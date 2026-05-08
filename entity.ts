enum AttributeVisibility {
    PUBLIC = "PUBLIC",
    PRIVATE = "PRIVATE"
}

class Attribute {

    name: string;
    value: string;
    private visibility: AttributeVisibility;
    private allowedEntities: Set<string>;

    constructor(name: string, value: string, visibility: AttributeVisibility) {
        this.name = name;
        this.value = value;
        this.visibility = visibility;
        this.allowedEntities = new Set();
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

class Entity {
    name: string;
    private attributes: Attribute[];
    readonly id: string;

    constructor(name: string) {
        this.name = name;
        this.attributes = [];
        this.id = crypto.randomUUID();
    }

    addAttribute(attributeName: string, value: string, visibility: AttributeVisibility) {
        this.attributes.push(
            new Attribute(attributeName, value, visibility)
        )
    }

    removeAttribute(attributeName: string) {
        this.attributes = this.attributes.filter(attribute => attribute.name !== attributeName);
    }

    getSelfAttribute(attributeName: string): Attribute | undefined {
        return this.attributes.find(attribute => attribute.name === attributeName);
    }

    getVisibleAttributesFor(entityId: string): Array<Attribute> {
        let availableAttributes: Array<Attribute> = [];
        let thirdPartyEntity = EntityStore.get(entityId);
            if (!thirdPartyEntity) {
                return availableAttributes;
            }

        for (const attribute of this.attributes) {
            if (attribute.hasAccess(thirdPartyEntity.id)) {
                availableAttributes.push(attribute);
            }
        }

        return availableAttributes;
    }
}