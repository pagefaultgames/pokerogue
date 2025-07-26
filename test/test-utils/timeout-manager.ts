import { afterEach } from "vitest";

/** An array of pending timeouts and intervals to clear on test end. */
const allTimeouts: NodeJS.Timeout[] = [];
/** An array of pending Immediates to clear on test end. */
const allImmediates: NodeJS.Immediate[] = [];

// Original clear functions

const origClearTimeout = global.clearTimeout;
const origClearInterval = global.clearInterval;
const origClearImmediate = global.clearImmediate;

/**
 * Wrap NodeJS global timeout functions to allow clearing stray intervals on test end.
 *
 * We add all timeouts to a global array on creation, remove them upon being cleared, and remove all stray intervals
 * on test end.
 */
export function manageTimeouts() {
  const origTimeout = global.setTimeout;
  global.setTimeout = Object.assign(
    (...args: Parameters<typeof globalThis.setTimeout>) => {
      const timeout = origTimeout(...args);
      allTimeouts.push(timeout);
      return timeout;
    },
    { __promisify__: global.setTimeout.__promisify__ },
  ) as typeof global.setTimeout;

  const origInterval = global.setInterval;
  global.setInterval = ((...args: Parameters<typeof globalThis.setInterval>) => {
    const interval = origInterval(...args);
    allTimeouts.push(interval);
    return interval;
  }) as typeof global.setInterval;

  const origImmediate = global.setImmediate;
  global.setImmediate = Object.assign(
    (...args: Parameters<typeof globalThis.setImmediate>) => {
      const immediate = origImmediate(...args);
      allImmediates.push(immediate);
      return immediate;
    },
    { __promisify__: global.setImmediate.__promisify__ },
  ) as typeof global.setImmediate;

  global.clearTimeout = (...args: Parameters<typeof globalThis.clearTimeout>) => {
    const timeout = args[0];
    if (typeof timeout === "object") {
      const index = allTimeouts.indexOf(timeout);
      if (index !== -1) {
        // Remove the timeout from the list of all unresolved timeouts
        allTimeouts.splice(index, 1);
      }
    }
    return origClearTimeout(...args);
  };

  global.clearInterval = (...args: Parameters<typeof globalThis.clearInterval>) => {
    const interval = args[0];
    if (typeof interval === "object") {
      const index = allTimeouts.indexOf(interval);
      if (index !== -1) {
        // Remove the interval from the list of all unresolved timeouts
        allTimeouts.splice(index, 1);
      }
    }
    return origClearInterval(...args);
  };

  global.clearImmediate = (...args: Parameters<typeof globalThis.clearImmediate>) => {
    const immediate = args[0];
    if (typeof immediate === "object") {
      const index = allImmediates.indexOf(immediate);
      if (index !== -1) {
        // Remove the immediate from the list of all unresolved immediates
        allImmediates.splice(index, 1);
      }
    }
    return origClearImmediate(...args);
  };
}

// Clear all lingering timeouts on test end.
afterEach(() => {
  console.log("Clearing %d timeouts on test end", allTimeouts.length + allImmediates.length);
  // NB: The absolute WORST CASE SCENARIO for this is us clearing a timeout twice in a row
  // (behavior which MDN web docs has certified to be a no-op)
  for (const timeout of allTimeouts) {
    // clearTimeout works on both intervals and timeouts
    origClearTimeout(timeout);
  }
  for (const immediate of allImmediates) {
    origClearImmediate(immediate);
  }
  allTimeouts.splice(0);
  allImmediates.splice(0);
});
