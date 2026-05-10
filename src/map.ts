import { AttributableObject } from "./attribute.js";
import { Entity } from "./entity.js";

export type Coordinates = {
    x: number;
    y: number;
}

class PointOfInterest extends AttributableObject {
    name: string;
    position: Coordinates;
    description: string;
    reach_allowance: number;
    isBlocking: boolean; // If true, entities cannot move through this point of interest (e.g., a wall or a locked door)

    constructor(name: string, description: string, position: Coordinates, reach_allowance: number=1, isBlocking: boolean = false) {
        super();
        this.name = name;
        this.description = description;
        this.position = position;
        this.reach_allowance = reach_allowance;
        this.isBlocking = isBlocking;
    }
}

class Location extends AttributableObject {
    name: string;
    children: Map<string, Location>;
    pointOfInterests: Map<string, PointOfInterest>;
    boundPositions: Coordinates[]; // order of points matters as it describes the hull
    description: string;

    constructor(name: string, description: string, boundingPositions: Coordinates[]) {
        super();
        this.name = name;
        this.description = description;
        this.children = new Map<string, Location>();
        this.pointOfInterests = new Map<string, PointOfInterest>();
        this.boundPositions = boundingPositions;
    }
}

export class WorldMap extends AttributableObject {
    readonly name: string;
    description: string;
    locations: Map<string, Location>;

    constructor(name: string, description: string) {
        super();
        this.name = name;
        this.description = description;
        this.locations = new Map<string, Location>();
    }

    getLocation(locationId: string): Location {
        let location = this.locations.get(locationId)
        if (!location) {
            throw Error("Could not find a location with the given ID");
        }

        return location;
    }

    getParent(locationOrPointOfInterestId: string, parent:Location|undefined): string|undefined {
        // returns the location ID of the parent location containing that location or point of interest

        type RootLocation = {
            id: "root",
            children: Map<string, Location>,
            pointOfInterests: Map<string, PointOfInterest>
        }

        let _parent: Location|RootLocation|undefined = parent;

        if (_parent===undefined) {
            _parent = {
                id: "root",
                children: this.locations,
                pointOfInterests: new Map<string, PointOfInterest>()
            } satisfies RootLocation;
        }


        if (_parent.children.has(locationOrPointOfInterestId)) {
            return _parent.id;
        }

        if (_parent.pointOfInterests.has(locationOrPointOfInterestId)) {
            return _parent.id;
        }
        
        if (_parent.children.size === 0) {
            return;
        }

        for (const location of _parent.children.values()) {
            let locationId = this.getParent(locationOrPointOfInterestId,location);

            if (locationId) {
                return locationId;
            }

        }

        return;
    }
}

/*
Better design would probably be to have a top-down graph structure for locations where each location(or node) references
its children and its parent.

POIs and entities would attatch to nodes or locations in the graph. This would make it easier to travel through the locations
but also to figure out where an entity is and where it can go along with what all entities are there in the graph at any arbitrary location.
*/


// TODO: Implement portals

export class PositioningService {
    isPositionInLocation(position: Coordinates, map: WorldMap, locationId: string): boolean {
        let inside = false;

        // Run a ray casting algorithm

        // get location bounding hull points
        let polygon: Coordinates[] = map.getLocation(locationId).boundPositions;

        // ensure polygon is defined before accessing its properties
        if (!polygon || polygon.length === 0) return false;

        for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
            const xi = polygon[i].x, yi = polygon[i].y;
            const xj = polygon[j].x, yj = polygon[j].y;

            const intersect =
                (yi > position.y) !== (yj > position.y) &&
                position.x < ((xj - xi) * (position.y - yi)) / (yj - yi) + xi;

            if (intersect) inside = !inside;
        }
        return inside;
    }

    getLocationBoundingPosition(position: Coordinates, map: WorldMap): string|undefined {
        // Returns the deepest location node that bounds the given position
        const findDeepestPositionLocation = (location: Location): Location | undefined => {
            if (!this.isPositionInLocation(position, map, location.id)) {
                return undefined;
            }

            for (const child of location.children.values()) {
                const deepestChild = findDeepestPositionLocation(child);
                if (deepestChild) {
                    return deepestChild;
                }
            }

            return location;
        };

        for (const location of map.locations.values()) {
            const found = findDeepestPositionLocation(location);
            if (found) {
                return found.id;
            }
        }

        return undefined;

    }

    getLocation(entity: Entity, map: WorldMap): string {
        // logic for calculating where an entity is
        const locationId = this.getLocationBoundingPosition(entity.position, map);
        return locationId || "unknown";
    }

    canReach(entity: Entity, map: WorldMap, pointOfInterest: PointOfInterest): boolean {
        // Also determines interactability with a point of interest
        const directDistance = this.calculateDistance(entity.position, pointOfInterest.position);

        // TODO: Path finding and object collision
        return directDistance <= pointOfInterest.reach_allowance;
    }

    calculateDistance(source: Coordinates, destination: Coordinates): number {
        return Math.sqrt(Math.pow(destination.x - source.x, 2) + Math.pow(destination.y - source.y, 2));
    }
}