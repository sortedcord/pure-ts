import { BaseObject } from "./attribute.js";
import type { Coordinates } from "./map.js";

export class EntityStore {
    static entities = new Map<string, Entity>();

    static add(entity: Entity) {
        this.entities.set(entity.id, entity);
    }

    static get(entityId: string) {
        return this.entities.get(entityId);
    }

    static remove(entityId: string) {
        this.entities.delete(entityId);
    }
}

export class Entity extends BaseObject {
    name: string;
    position: Coordinates;
    memory: any;

    constructor(name: string) {
        super();
        this.name = name;
        this.position = {x: 0, y: 0};
    }
}