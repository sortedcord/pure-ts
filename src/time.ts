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