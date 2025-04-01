import { expect } from "vitest";

/**
 * Whether or not it is currently the first time running this manager.
 */
let firstTime = true;

/**
 * The list of listeners that were present during the first time this manager is run.
 * These initial listeners are needed throughout the entire test suite, so we never remove them.
 */
const initialListeners: NodeJS.MessageListener[] = [];

/**
 * The current listener that is only needed for the current test file.
 * We plan to delete it during the next test file, when it is no longer needed.
 */
let currentListener: NodeJS.MessageListener | null;

export function manageListeners() {
  if (firstTime) {
    initialListeners.push(...process.listeners("message"));
  } else {
    expect(process.listeners("message").length).toBeLessThan(7);

    // Remove the listener that was used during the previous test file
    if (currentListener) {
      process.removeListener("message", currentListener);
      currentListener = null;
    }

    // Find the new listener that is being used for the current test file
    process.listeners("message").forEach(fn => {
      if (!initialListeners.includes(fn)) {
        currentListener = fn;
      }
    });
  }

  firstTime = false;
}
