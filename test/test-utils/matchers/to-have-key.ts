import { getOnelineDiffStr } from "#test/test-utils/string-utils";
import { receivedStr } from "#test/test-utils/test-utils";
import type { MatcherState, SyncExpectationResult } from "@vitest/expect";

/**
 * Matcher that checks if a {@linkcode Map} contains the given key, regardless of its value.
 * @param received - The received value. Should be a Map
 * @param expectedKey - The key whose inclusion in the map is being checked
 * @returns Whether the matcher passed
 */
export function toHaveKey(this: MatcherState, received: unknown, expectedKey: unknown): SyncExpectationResult {
  if (!(received instanceof Map)) {
    return {
      pass: this.isNot,
      message: () => `Expected to receive a Map, but got ${receivedStr(received)}!`,
    };
  }

  if (received.size === 0) {
    return {
      pass: this.isNot,
      message: () => "Expected to receive a non-empty Map, but received map was empty!",
      expected: expectedKey,
      actual: received,
    };
  }

  const keys = [...received.keys()];
  const pass = this.equals(keys, expectedKey, [
    ...this.customTesters,
    this.utils.iterableEquality,
    this.utils.subsetEquality,
  ]);

  const actualStr = getOnelineDiffStr.call(this, received);
  const expectedStr = getOnelineDiffStr.call(this, expectedKey);

  return {
    pass,
    message: () =>
      pass
        ? `Expected ${actualStr} to NOT have the key ${expectedStr}, but it did!`
        : `Expected ${actualStr} to have the key ${expectedStr}, but it didn't!`,
    expected: expectedKey,
    actual: keys,
  };
}
