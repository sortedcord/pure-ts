import type { EventDispatcher } from "./event.js";
import type { ConsequenceGenerator } from "./intent.js";
import type { OutcomeResult } from "./intent.js";
import type { WorldMutation, WorldContext } from "./world.js";

export class EngineConsequenceGenerator implements ConsequenceGenerator {
    constructor(private dispatcher: EventDispatcher) {}

    apply(outcome: OutcomeResult, context: WorldContext): void {
        // 1. APPLY WORLD MUTATIONS (Deterministic State Changes)
        if (outcome.worldMutations) {
            for (const mutation of outcome.worldMutations) {
                this.applyMutation(mutation, context);
            }
        }

        // 2. DISPATCH WORLD EVENTS (Sensory outputs for LLMs to react to)
        for (const event of outcome.generatedEvents) {
            // Note: If the event's position is not resolved by the simulator, 
            // you might need to resolve it here using the context.
            this.dispatcher.dispatch(event);
        }
    }

    private applyMutation(mutation: WorldMutation, context: WorldContext) {
        const target = context.getEntity(mutation.targetId);
        if (!target) return;

        switch (mutation.mutationType) {
            case "ATTRIBUTE_UPDATE":
                const attr = target.attributes.get(mutation.payload.key);
                if (attr) {
                    attr.setValue(mutation.payload.value);
                } else {
                    // Add new attribute if it doesn't exist (assuming PUBLIC by default for mutations)
                    target.addAttribute(mutation.payload.key, mutation.payload.value, "PUBLIC");
                }
                break;

            case "POSITION_UPDATE":
                // Assuming payload looks like { x: 10, y: 15 }
                target.position = [mutation.payload.x, mutation.payload.y];
                break;

            case "MEMORY_APPEND":
                // Force-feed a memory to an entity (inception lol)
                target.memory.push({
                    type: "internal_thought",
                    data: mutation.payload,
                    timestamp: context.getTime()
                });
                break;
                
            default:
                console.warn(`Unknown mutation type: ${mutation.mutationType}`);
        }
    }
}