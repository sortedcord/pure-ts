import { Entity } from "./entity.ts";

class PointOfInterest {
    readonly id: string;
    name: string;
    coordinate: [number, number]; // relative to the parent location's center
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
    private boundingCoordinates: [number, number][];
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

    getLocation(locationId: string) {
        this.locations.get(locationId)
    }

    search(locationOrPointOfInterestId: string, parent:Location|undefined): string|undefined {
        // returns the location ID of the location containing that location of point of interest
        let _parent: any = parent;

        if (_parent===undefined) {
            _parent = {
                id: "root",
                children: this.locations,
                pointOfInterests: new Map()
            };
        }


        if (_parent?.children.has(locationOrPointOfInterestId)) {
            return _parent.id;
        }

        if (_parent?.pointOfInterests.has(locationOrPointOfInterestId)) {
            return _parent.id;
        }
        
        if (_parent.children.size === 0) {
            return;
        }

        for (const location of _parent.location.values()) {
            let locationId = this.search(locationOrPointOfInterestId,location);

            if (locationId) {
                return locationId;
            }

        }

        return;
    }
}

class PositioningService {
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