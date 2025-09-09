/**
 * @module
 * A big file storing colors used in logging.
 * Minified by Terser during production builds, so has no overhead.
 */

// Colors used in prod
/** Color used for "Start Phase <Phase>" logs */
export const PHASE_START_COLOR = "green" as const;
/** Color used for logs in `MovePhase` */
export const MOVE_COLOR = "orchid" as const;

// Colors used for testing code
export const NEW_TURN_COLOR = "#ffad00ff" as const;
export const UI_MSG_COLOR = "#009dffff" as const;
export const OVERRIDES_COLOR = "#b0b01eff" as const;
export const SETTINGS_COLOR = "#008844ff" as const;

// Colors used for Vitest-related test utils
export const TEST_NAME_COLOR = "#008886ff" as const;
export const VITEST_PINK_COLOR = "#c162de" as const;

// Mock console log stuff
export const TRACE_COLOR = "#b700ff" as const;
export const DEBUG_COLOR = "#874600ff" as const;
