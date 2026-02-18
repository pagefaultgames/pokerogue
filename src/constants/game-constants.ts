import { TimeOfDay } from "#enums/time-of-day";

/** The maximum candy a starter is allowed to have. */
export const MAX_STARTER_CANDY_COUNT = 9999;

export const DAY_TIME = Object.freeze([TimeOfDay.DAWN, TimeOfDay.DAY]);

export const NIGHT_TIME = Object.freeze([TimeOfDay.DUSK, TimeOfDay.NIGHT]);
