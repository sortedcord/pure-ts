export enum AttributeVisibility {
    PUBLIC = "PUBLIC",
    PRIVATE = "PRIVATE"
}
export class Attribute {
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

    hasAccess(objectId: string): boolean {
        return (this.visibility === AttributeVisibility.PUBLIC) || this.allowedEntities.has(objectId);
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

    grantAccess(objectId: string) {
        if (this.visibility === AttributeVisibility.PRIVATE) {
            this.allowedEntities.add(objectId);
        }
    }

    revokeAccess(objectId: string) {
        if (this.visibility === AttributeVisibility.PRIVATE && this.allowedEntities.has(objectId)) {
            this.allowedEntities.delete(objectId);
        }

    }
}

export interface IAttribute {
    id: string;
    attributes: Map<string, Attribute>;

    addAttribute(name: string, value: string, visibility: AttributeVisibility): void;
    getVisibleAttributesFor(viewerId: string): Attribute[];

}

export abstract class BaseObject implements IAttribute {
    readonly id: string = crypto.randomUUID();
    readonly attributes: Map<string, Attribute> = new Map<string, Attribute>();

    addAttribute(name: string, value: string, visibility: AttributeVisibility): void {
        if (this.attributes.has(name)) throw Error(`Attribute ${name} already exists`);
        this.attributes.set(name, new Attribute(name, value, visibility));
    }

    removeAttribute(name: string): void {
        if (!this.attributes.has(name)) throw Error(`Attribute ${name} does not exist`);
        this.attributes.delete(name);
    }

    getVisibleAttributesFor(viewerId: string): Attribute[] {
        return Array.from(this.attributes.values())
            .filter(attr => attr.hasAccess(viewerId));
    }
}