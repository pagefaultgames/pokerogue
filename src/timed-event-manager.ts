interface TimedEvent {
    name: string;
    eventType: string;
    value: number;
    startDate: string;
    endDate: string;
}

const timedEvents: TimedEvent[] = [
    {"name": "3x Shiny Weekend", "eventType": "shiny", "value": 3, 
    "startDate": "2024-05-18", "endDate": "2024-05-21"},
];

export class TimedEventManager {  
    constructor() {}

    isEventActive(): boolean {
        for (const timedEvent of timedEvents) {
            const eventStart = new Date(timedEvent.startDate);
            const now = new Date();
            const eventEnd = new Date(timedEvent.endDate);

            if (eventStart < now && now < eventEnd) {
                return true;
            }
        }
        return false;
    }

    getShinyMultiplier(): number {
        let multiplier = 1;
        for (const timedEvent of timedEvents) {
            if (timedEvent.eventType === 'shiny' &&
                new Date(timedEvent.startDate) < new Date() &&
                new Date() < new Date(timedEvent.endDate)) {
                multiplier *= timedEvent.value;
            }
        }
        return multiplier;
    }
}
