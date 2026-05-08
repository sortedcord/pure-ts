import { Entity } from "./entity.js";

class PointOfInterest {
    readonly id: string;
    name: string;
    coordinate: [number, number];
    description: string;
    reach_allowance: number;
    isBlocking: boolean;

    constructor(name: string, description: string, coordinate: [number, number], reach_allowance: number=1, isBlocking: boolean = false) {
        this.name = name;
        this.id = crypto.randomUUID();
        this.description = description;
        this.coordinate = coordinate;
        this.reach_allowance = reach_allowance;
        this.isBlocking = isBlocking;
    }
}

class Location {
    readonly id: string;
    name: string;
    children: Map<string, Location>;
    pointOfInterests: Map<string, PointOfInterest>;
    boundingCoordinates: [number, number][]; // order of points matters as it describes the hull
    description: string;

    constructor(name: string, description: string, boundingCoordinates: [number, number][]) {
        this.id = crypto.randomUUID();
        this.name = name;
        this.description = description;
        this.children = new Map<string, Location>();
        this.pointOfInterests = new Map<string, PointOfInterest>();
        this.boundingCoordinates = boundingCoordinates;
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
    isCoordinateInLocation(coordinate: [number, number], map: WorldMap, locationId: string): boolean {
        let inside = false;

        // get location bounding hull points
        let polygon: [number, number][] = map.getLocation(locationId).boundingCoordinates;

        for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
            const xi = polygon[i][0], yi = polygon[i][1];
            const xj = polygon[j][0], yj = polygon[j][0];

            const intersect =
            (yi > coordinate[1]) !== (yj > coordinate[1]) &&
            coordinate[0] < ((xj - xi) * (coordinate[1] - yi)) / (yj - yi + xi);

            if (intersect) inside = !inside;
        }
        return inside;
    }

    getLocationBoundingCoordinate(coordinate: [number, number], map: WorldMap): string|undefined {
        // Returns the lowest location node that bounds the given coordinate
        let containingLocation: Location|undefined;
        for (const location of map.locations.values()) {
            if (containingLocation) {
                if (this.isCoordinateInLocation(coordinate, map, location.id)) {
                    // if location is child of contianingLocation then update
                    if (containingLocation.children.has(location.id)) {
                        containingLocation = location;
                    }
                }
            }

            containingLocation = location;
        }
        return containingLocation?.id;

    }

    getLocation(entity: Entity, map: WorldMap): string {
        // logic for calculating where an entity is


        return "location_id"
    }

    canReach(entity: Entity, map: WorldMap, pointOfInterest: PointOfInterest): boolean {
        // Checks if a POI can be reached by an entity at its current position without major movement to its coordinate

        // reachability check using PointOfInterest.reach_allowance
        return true;
    }

    calculateDistance(source:PointOfInterest, destination: PointOfInterest): number {
        return 0
    }

}