enum AttributeVisibility {
    PUBLIC = "PUBLIC", 
    PRIVATE = "PRIVATE"
}

class Attribute {
    readonly name: string;
    private value: string;
    private visibility: AttributeVisibility;
    private allowedEntities: Set<string>;

    constructor(name: string, value: string, visibility: AttributeVisibility) {
        this.name = name;
        this.value = value;
        this.visibility = visibility;
        this.allowedEntities = new Set();
    }

    setValue(newValue: string) {
        this.value = newValue;
    }

    getValue(): string {
        return this.value;
    }

    hasAccess(entityId: string): boolean {
        return (this.visibility === AttributeVisibility.PUBLIC) || this.allowedEntities.has(entityId);
    }

    getVisibility(): AttributeVisibility {
        return this.visibility;
    }

    setPublic() {
        this.visibility = AttributeVisibility.PUBLIC;
    }

    setPrivate() {
        // In case a property becomes public and then private, we do NOT want to preserve the ACLs over visibility changes
        this.allowedEntities.clear();
        this.visibility = AttributeVisibility.PRIVATE;
    }

    grantAccess(entityId: string) {
        if (!EntityStore.get(entityId)) {
            return;
        }

        if (this.visibility === AttributeVisibility.PRIVATE) {
            this.allowedEntities.add(entityId);
        }
    }

    revokeAccess(entityId: string) {
        if (!EntityStore.get(entityId)) {
            return;
        }
        
        if (this.visibility === AttributeVisibility.PRIVATE && this.allowedEntities.has(entityId)) {
            this.allowedEntities.delete(entityId);
        }
        
    }
}

class EntityStore {
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

export class Entity {
    name: string;
    private attributes: Map<string, Attribute>;
    readonly id: string;
    position: [number, number];

    constructor(name: string) {
        this.name = name;
        this.attributes = new Map<string, Attribute>();
        this.id = crypto.randomUUID();
        this.position = [0,0];
    }

    addAttribute(attributeName: string, value: string, visibility: AttributeVisibility) {
        if (this.attributes.get(attributeName)) {
            throw Error("Attribute already exists");
        }

        this.attributes.set(attributeName, new Attribute(attributeName, value, visibility)
        )
    }

    removeAttribute(attributeName: string) {
        if (!this.attributes.get(attributeName)) {
            throw Error("No attribute found");
        }

        this.attributes.delete(attributeName);
    }

    getSelfAttribute(attributeName: string): Attribute | undefined {
        return this.attributes.get(attributeName);
    }

    getVisibleAttributesFor(entityId: string): Array<Attribute> {
        let availableAttributes: Array<Attribute> = [];
        let thirdPartyEntity = EntityStore.get(entityId);
            if (!thirdPartyEntity) {
                return availableAttributes;
            }

        for (const attribute of this.attributes.values()) {
            if (attribute.hasAccess(thirdPartyEntity.id)) {
                availableAttributes.push(attribute);
            }
        }

        return availableAttributes;
    }
}