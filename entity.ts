import { BaseObject } from "./attribute.js";

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
    position: [number, number];

    constructor(name: string) {
        super();
        this.name = name;
        this.position = [0,0];
    }
}