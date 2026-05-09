import type { Coordinates } from "./map.js";
import type { WorldContext, WorldMutation } from "./world.js";

export type WorldEvent = {
    position: Coordinates;
    data: any;
    id: string;
    type: string;
    sourceId: string;
    modifier: string;
    timestamp: number;
    payload: any;
};

export type PerceivedEvent = {
    type: string;
    sourceId: string;
    data: any;
};

interface Intent {
    actorId: string;
    timestamp: number;
    modifiers?: string[];
}

export interface SayIntent extends Intent {
    type: "say";
    message: string;

    focusTargetId?: string;
}

export interface InteractIntent extends Intent {
    type: "interact";
    targetId: string;
    action: string;

    focusTargetId?: string;
}

interface ValidationResult {
    valid: boolean;
    reason?: string;
}

export interface OutcomeResult {
    success: boolean;

    outcomeType:
        | "success"
        | "failure"
        | "partial"
        | "interrupted";

    generatedEvents: WorldEvent[];

    worldMutations?: WorldMutation[];
}

export interface ResolutionResult {
    intent: Intent;
    validation: ValidationResult;
    outcome?: OutcomeResult;
}

export interface IntentValidator<T extends Intent> {
    validate(intent: T, context: WorldContext): ValidationResult;
}

/*
We can probably have Just-In-Time code generation that 
creates custom validators/simulators/consequence for specific 
intents/scenarios to make the simulation feel more deterministic.
*/

// Example of a simple reachability validator
export class ReachabilityValidator implements IntentValidator<InteractIntent> {
    validate(intent: InteractIntent, context: WorldContext): ValidationResult {
        const actor = context.getEntity(intent.actorId);
        const positioning = context.getPositioning();
        const map = context.getMap();

        if (!actor) {
            return {valid: false, reason: "Actor not found"};
        }

        // get the target poi/entity and use PositioningService to check if it's reachable
        return {valid: true};
    }
}

export interface ActionSimulator {
    simulate(intent: Intent, context: WorldContext): Promise<OutcomeResult>;
}

export interface ConsequenceGenerator {
    apply(outcome: OutcomeResult, context: WorldContext): void;
}

export interface IntentResolver<T extends Intent> {
    resolve(intent: T, context: WorldContext): Promise<any>;
}

export class SayResolver implements IntentResolver<SayIntent> {
    async resolve(intent: SayIntent, context: WorldContext): Promise<OutcomeResult> {
        const actor = context.getEntity(intent.actorId);

        return {
            success: true,
            outcomeType: "success",
            worldMutations: [],
            generatedEvents: [{
                id: crypto.randomUUID(),
                type: "sound:speech",
                sourceId: actor?.id || "unknown",
                position: actor?.position || { x: 0, y: 0 },
                modifier: "volume:normal",
                timestamp: intent.timestamp,
                payload: {
                    text: intent.message, tone: intent.modifiers?.[0] || "neutral"
                },
                data: undefined
            }]
            };
    }}

export class InteractionPipeline implements IntentResolver<Intent> {
    constructor(
        private validators: IntentValidator<Intent>[],
        private simulator: ActionSimulator,
        private consequenceGenerator: ConsequenceGenerator
    ) {}

    async resolve(intent: Intent, context: WorldContext): Promise<any> {
        for (const validator of this.validators) {
            const validationResult = validator.validate(intent, context);
            if (!validationResult.valid) {
                return {
                    intent,
                    validation: validationResult
                };
            }
        }

        const validResult: ValidationResult = {valid: true};

        const outcome = await this.simulator.simulate(intent, context);

        if (outcome.success || outcome.outcomeType === "partial" || outcome.outcomeType === "failure") {
            this.consequenceGenerator.apply(outcome, context);
        }

        return {
            intent,
            validation: validResult,
            outcome
        };
    }
}
