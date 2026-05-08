"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var AttributeVisibility;
(function (AttributeVisibility) {
    AttributeVisibility["PUBLIC"] = "PUBLIC";
    AttributeVisibility["PRIVATE"] = "PRIVATE";
})(AttributeVisibility || (AttributeVisibility = {}));
class Attribute {
    name;
    value;
    visibility;
    allowedEntities;
    constructor(name, value, visibility) {
        this.name = name;
        this.value = value;
        this.visibility = visibility;
        this.allowedEntities = new Set();
    }
    hasAccess(entityId) {
        return (this.visibility === AttributeVisibility.PUBLIC) || this.allowedEntities.has(entityId);
    }
    getVisibility() {
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
    grantAccess(entityId) {
        if (!EntityStore.get(entityId)) {
            return;
        }
        if (this.visibility === AttributeVisibility.PRIVATE) {
            this.allowedEntities.add(entityId);
        }
    }
    revokeAccess(entityId) {
        if (!EntityStore.get(entityId)) {
            return;
        }
        if (this.visibility === AttributeVisibility.PRIVATE && this.allowedEntities.has(entityId)) {
            this.allowedEntities.delete(entityId);
        }
    }
}
class EntityStore {
    static entities = new Map();
    static add(entity) {
        this.entities.set(entity.id, entity);
    }
    static get(entityId) {
        return this.entities.get(entityId);
    }
    static remove(entityId) {
        this.entities.delete(entityId);
    }
}
class Entity {
    name;
    attributes;
    id;
    constructor(name) {
        this.name = name;
        this.attributes = [];
        this.id = crypto.randomUUID();
    }
    addAttribute(attributeName, value, visibility) {
        this.attributes.push(new Attribute(attributeName, value, visibility));
    }
    removeAttribute(attributeName) {
        this.attributes = this.attributes.filter(attribute => attribute.name !== attributeName);
    }
    getSelfAttribute(attributeName) {
        return this.attributes.find(attribute => attribute.name === attributeName);
    }
    getVisibleAttributesFor(entityId) {
        let availableAttributes = [];
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
//# sourceMappingURL=entity.js.map