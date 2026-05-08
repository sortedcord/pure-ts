import type { Entity } from "./entity.js";
import type { Coordinates } from "./map.js";

export type WorldEvent = {
    position: [number, number];
    data: any;
    id: string;
    type: string;
    sourceId: number;
    intensity: number;
    timestamp: number;
    payload: any;
};

export type PerceivedEvent = {
    type: string;
    sourceId: number;
    perceivedIntensity: number;
    clarity: number; // how accurate it is
    data: any;
};

interface PerceptionModel {
    vision: number;
    hearing: number;
    noiseResistance: number;
    focus: number;
}

class EventProcessor {
    constructor(private entities: Entity[]) {}

    emit(event: WorldEvent) {
        for (const entity of this.entities) {
            const perceived = this.processForEntity(event, entity);
            entity.receive(perceived);
        }
    }

    processForEntity(event: WorldEvent, entity: Entity): PerceivedEvent {
    let intensity = event.intensity;
    let clarity = 1.0;

    const distance = this.getDistance(entity, event.position);

    // 1. Distance attenuation (signal decay)
    intensity *= 1 / (1 + distance * 0.1);

    // 2. Noise based on perception stats
    const noise = Math.random() * (1 - entity.perception.noiseResistance);
    intensity *= (1 - noise);
    clarity *= entity.perception.focus;

    // 3. Sensory filtering
    if (event.type === "sound" && entity.perception.hearing < 0.5) {
        clarity *= 0.3;
    }

    return {
        type: event.type,
        sourceId: event.sourceId,
        perceivedIntensity: intensity,
        clarity,
        data: event.data
    };
}
}

interface EventFilter {
    apply(event: WorldEvent, entity: Entity): WorldEvent;
}

class DistanceFilter implements EventFilter {
    apply(event: WorldEvent, entity: Entity): WorldEvent {
        const d = distance(entity.position, event.position);
        event.intensity *= Math.exp(-d * 0.1);
        return event;
    }
}

class PerceptionPipeline {
    constructor(private filters: EventFilter[]) {}

    process(event: WorldEvent, entity: Entity) {
        let modified = { ...event };

        for (const filter of this.filters) {
            modified = filter.apply(modified, entity);
        }

        return modified;
    }
}

type EventIntent = {
    sourceId: number;
    targetId?: number;
    position?: Coordinates;
    payload?: any;
};

class EventFactory {
    create(intent: EventIntent, context: WorldContext): WorldEvent {
        return {
            id: crypto.randomUUID(),
            type: intent.type,
            sourceId: intent.sourceId,
            position: this.resolvePosition(intent, context),
            intensity: this.baseIntensity(intent),
            timestamp: Date.now(),
            payload: intent.payload ?? {}
        };
    }

    private resolvePosition(intent: EventIntent, context: WorldContext): Coordinates {
        return intent.position ?? context.getEntity(intent.sourceId).position;
    }

    private baseIntensity(intent: EventIntent): number {
        return 0
    }
}


class EventSystem {
    constructor(
        private factory: EventFactory,
        private enrichers: EventEnricher[],
        private dispatcher: EventDispatcher
    ) {}

    emit(intent: EventIntent, context: WorldContext) {
        // 1. create base event
        let event = this.factory.create(intent, context);

        // 2. enrich event globally (world-level modifiers)
        for (const enricher of this.enrichers) {
            event = enricher.enrich(event, context);
        }

        // 3. dispatch into perception system
        this.dispatcher.dispatch(event);
    }
}