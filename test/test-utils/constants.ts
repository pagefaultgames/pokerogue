import { url } from "node:inspector";

/** Whether test code is currently running inside a debug session. */
export const isDebug = url() !== undefined;

/**
 * The amount of time to wait for tests to finish before forcibly cancelling them, in milliseconds. \
 * Set to the maximum allowed 32-bit integer (equivalent to 24.8 days) during debug sessions to avoid timeouts while stepping through code.
 * @remarks
 * Code providing timeouts to external code that will cancel, crash or otherwise stop the test **must** use this constant
 * to avoid prematurely ending debug sessions.
 */
export const TEST_TIMEOUT = isDebug ? Math.pow(2, 31) - 1 : 20_000;
