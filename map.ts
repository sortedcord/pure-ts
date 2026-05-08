import { BaseObject } from "./attribute.js";
import { Entity } from "./entity.js";

class PointOfInterest extends BaseObject {
    name: string;
    position: [number, number];
    description: string;
    reach_allowance: number;
    isBlocking: boolean;

    constructor(name: string, description: string, position: [number, number], reach_allowance: number=1, isBlocking: boolean = false) {
        super();
        this.name = name;
        this.description = description;
        this.position = position;
        this.reach_allowance = reach_allowance;
        this.isBlocking = isBlocking;
    }
}

class Location extends BaseObject {
    name: string;
    children: Map<string, Location>;
    pointOfInterests: Map<string, PointOfInterest>;
    boundPositions: [number, number][]; // order of points matters as it describes the hull
    description: string;

    constructor(name: string, description: string, boundingPositions: [number, number][]) {
        super();
        this.name = name;
        this.description = description;
        this.children = new Map<string, Location>();
        this.pointOfInterests = new Map<string, PointOfInterest>();
        this.boundPositions = boundingPositions;
    }
}

class WorldMap {
    readonly name: string;
    description: string;
    locations: Map<string, Location>;

    constructor(name: string, description: string) {
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

class PositioningService {
    isPositionInLocation(position: [number, number], map: WorldMap, locationId: string): boolean {
        let inside = false;

        // get location bounding hull points
        let polygon: [number, number][] = map.getLocation(locationId).boundPositions;

        if (polygon.length === 0) return false;

        for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
            const xi = polygon[i][0], yi = polygon[i][1];
            const xj = polygon[j][0], yj = polygon[j][1];

            const intersect =
                (yi > position[1]) !== (yj > position[1]) &&
                position[0] < ((xj - xi) * (position[1] - yi)) / (yj - yi) + xi;

            if (intersect) inside = !inside;
        }
        return inside;
    }

    getLocationBoundingPosition(position: [number, number], map: WorldMap): string|undefined {
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
        // Checks if a POI can be reached by an entity at its current position without major movement to its position

        // reachability check using PointOfInterest.reach_allowance
        return true;
    }

    // calculateDistance(source:PointOfInterest, destination: PointOfInterest): number {
    //     return 0
    // }

}