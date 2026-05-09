import type { Entity } from "./entity.js";
import type { WorldEvent, PerceivedEvent } from "./intent.js";
import type { Coordinates } from "./map.js";

export class EventDispatcher {
    constructor(private getEntitiesInRadius: (position: Coordinates, radius: number) => Entity[]) {}

    /**
     * Takes a raw world event, calculates physics (attenuation), 
     * and delivers perceived events to nearby entities.
     */

    dispatch(event: WorldEvent) {
        // Optimization: Only fetch entities within a maximum conceivable hearing/seeing radius
        // Let's assume a max propagation radius of 100 units for this example
        const potentialWitnesses = this.getEntitiesInRadius(event.position, 100);

        for (const entity of potentialWitnesses) {
            // Don't send events to the actor who caused them (optional, depends on design)
            // if (entity.id === event.sourceId.toString()) continue;

            const perceived = this.calculatePerception(event, entity);
            
            // If the signal is strong enough, the entity "perceives" it
            if (perceived && perceived.perceivedIntensity > 0.1) {
                // entity.receive(perceived); TODO: Implement receive/react pipeline for entity
            }
        }

}


private calculatePerception(event: WorldEvent, entity: Entity): PerceivedEvent | null {
        // FIX: Perception model and weights
        // Work on objective and subjective parameters.


        // Calculate Euclidean distance
        const dx = entity.position.x - event.position.x;
        const dy = entity.position.y - event.position.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        // Inverse square law for signal decay (simplified)
        // Intensity halves every 10 units of distance
        let perceivedIntensity = event.intensity * (10 / (10 + distance));

        // If intensity drops below threshold, they don't notice it
        if (perceivedIntensity <= 0.1) return null;

        // In a full game, you'd check entity.perception stats here for clarity
        const clarity = perceivedIntensity > (event.intensity * 0.5) ? 1.0 : 0.5;

        return {
            type: event.type,
            sourceId: event.sourceId,
            perceivedIntensity,
            clarity,
            data: event.data
        };
    }
}