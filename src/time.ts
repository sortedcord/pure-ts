function timeOfDayLabel(hour: number, for_today: boolean): string {
    if (5 <= hour && hour < 12) {
        return "morning"
    }
    if (12 <= hour && hour < 17) {
        return "afternoon"
    }
    if (for_today) return "tonight"
    return "night"
}

export function describeRelativeTime(timestampString: string, referenceTime: Date, preferDayPartForToday: boolean=false): string {
    // This function outputs subjective time descriptions for given time deltas.

    let timestamp: Date;
    try {
        // format timestring as %Y-%m-%d %H:%M
        timestamp = new Date(timestampString);
    } catch (e) {
        return "a long time ago";
    }

    let delta = (timestamp.getTime() - referenceTime.getTime()) / 1000;
    let seconds = Math.abs(delta);

    if (seconds < 0) {
        return "just now";
    }

    if (!preferDayPartForToday) {
        switch (true) {
            case seconds < 120:
                return "just now";
            case seconds < 3600:
                return "a few minutes ago";
            case seconds < 7200:
                return "an hour ago";
            case seconds < 3600 * 3:
                return "a couple hours ago";
        }
    }

    let dayDiff = Math.floor(seconds / (3600 * 24));

    // Use the timestamp hour to determine day part labels
    const hour = timestamp.getHours();

    switch (true) {
        case dayDiff === 0:
            return `today ${timeOfDayLabel(hour, true)}`;
        case dayDiff === 1:
            return `yesterday ${timeOfDayLabel(hour, false)}`;
        case dayDiff === 2:
            return "2 days ago";
        case dayDiff === 3:
            return "3 days ago";
        case dayDiff <= 6:
            return "a couple days ago";
        case dayDiff <= 10:
            return "a week ago";
        case dayDiff <= 20:
            return "a couple weeks ago";
        case dayDiff <= 45:
            return "a month ago";
        case dayDiff <= 75:
            return "a couple months ago";
        case dayDiff <= 420:
            return "a year ago";
        default:
            return "a long time ago";
    }

}

export class TickService {
    // This is a simple service that keeps a track of when an event happens but also to 
    // advance time in the world.

    // For simplicity, we will just use real world TIME UNITS as ticks. However there can be a
    // time provider interface that can be implemented to allow to source time from any arbitrary time provider
    // like an arbitrary time reference or real world time.


    /*
        Event and Tick Pipeline:

        1. The world time advances at fixed time intervals (or when an action finishes that takes time) -> tick
        2. On each tick, the TickService checks for any actions that are supposed to complete at that time and 
            then emits events for completion of those actions.
        3. The TickService also checks for any triggers that are supposed to activate at that time and emits 
            events for those triggers.
        
        Example Flow:

        1. Jake wants to "eat an apple"
        2. Intent is generated, and validated
        3. The ActionSimulator determines that eating the apple takes 5 minutes
        4. An event is created where Jake starts eating the apple and is marked to end in 5 minutes.
        5. This action is now "attatched" to the "Jake" entity.
        6. The event is broadcasted to the world and perceptions are calculated for nearby entities.
        7. Those entities may or may not react to the event of Jake eating the apple
        8. The TickService then looks for other events that are supposed to happen in the next 5 minutes and schedules them accordingly.
        9. After 5 minutes, the TickService emits an event that Jake has finished eating the apple. 

        Preliminary Input Mechanics Design (For player-controlled interfaces):

        // Just throwing around some ideas here.

        1. When an entity is directly controlled by the user, and the user is typing out an action or a command, 
            have it so that the world pauses (or slows down significantly)
        2. Maybe later we can have a more complex system where intent determination is done in real time as the 
            user is typing out the command, for example, speech is emitted 
            as the user is typing out a command and the world reacts to that speech in real time, but the actual 
            command is only executed once the user finishes typing it out. (I don't know, this might just be BS)
    */
}