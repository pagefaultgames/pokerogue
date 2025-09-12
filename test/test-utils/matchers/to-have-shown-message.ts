// biome-ignore lint/correctness/noUnusedImports: TSDoc
import type { GameManager } from "#test/test-utils/game-manager";
import { isGameManagerInstance, receivedStr } from "#test/test-utils/test-utils";
import { truncateString } from "#utils/common";
import type { MatcherState, SyncExpectationResult } from "@vitest/expect";

/**
 * Matcher to check if the {@linkcode GameManager} has shown the given message at least once.
 * @param received - The object to check. Should be the current {@linkcode GameManager}.
 * @param expectedMessage - The expected message
 * @returns The result of the matching
 */
export function toHaveShownMessage(
  this: MatcherState,
  received: unknown,
  expectedMessage: string,
): SyncExpectationResult {
  if (!isGameManagerInstance(received)) {
    return {
      pass: this.isNot,
      message: () => `Expected to receive a GameManager, but got ${receivedStr(received)}!`,
    };
  }

  if (!received.textInterceptor) {
    return {
      pass: this.isNot,
      message: () => "Expected GameManager.TextInterceptor to be defined!",
    };
  }

  // Pass if any of the matching tags meet our criteria
  const pass = received.textInterceptor.logs.includes(expectedMessage);
  return {
    pass,
    message: () =>
      pass
        ? `Expected the GameManager to NOT have shown the message ${truncateString(expectedMessage, 30)}, but it did!`
        : `Expected the GameManager to have shown the message ${truncateString(expectedMessage, 30)}, but it didn't!`,
    expected: expectedMessage,
    actual: received.textInterceptor.logs,
  };
}
