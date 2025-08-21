/**
 * @module
 * A big file storing colors used in logging.
 * Is minified by Vite during production runs to avoid overhead.
 */

// Colors used in prod
export const PHASE_START_COLOR = "green" as const;
export const MOVE_COLOR = "RebeccaPurple" as const;

// Colors used for testing code
export const NEW_TURN_COLOR = "#ffad00ff" as const;
export const UI_MSG_COLOR = "#009dffff" as const;
export const OVERRIDES_COLOR = "#b0b01eff" as const;

// Mock console log stuff
export const TRACE_COLOR = "#b700ff" as const;
export const DEBUG_COLOR = "#874600ff" as const;
