import { Entity, EntityStore } from "./entity.js";
import { WorldMap, PositioningService } from "./map.js";

export interface WorldContext {
    getMap(): WorldMap;
    getEntity(entityId: string): Entity | undefined;
    getPositioning(): PositioningService;
    
    // TODO: Implement Time Service
}

export interface WorldMutation {
    type: string;

    description: string;

    apply(context: WorldContext): void;
}