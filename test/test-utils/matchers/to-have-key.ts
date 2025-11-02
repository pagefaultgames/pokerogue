import { getOnelineDiffStr } from "#test/test-utils/string-utils";
import { receivedStr } from "#test/test-utils/test-utils";
import type { MatcherState, SyncExpectationResult } from "@vitest/expect";

/**
 * Matcher that checks if a {@linkcode Map} contains the given key, regardless of its value.
 * @param received - The received value. Should be a Map
 * @param expectedKey - The key whose inclusion is being checked
 * @param expectedValue - The desired value for the given key-value pair;
 * if omitted, will only check that the given key exists (disregarding its value)
 * @returns Whether the matcher passed
 */
export function toHaveKey(
  this: MatcherState,
  received: unknown,
  expectedKey: unknown,
  expectedValue?: unknown,
): SyncExpectationResult {
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
  const hasKey = keys.includes(expectedKey);

  const actualStr = getOnelineDiffStr.call(this, received);
  const expectedStr = getOnelineDiffStr.call(this, expectedKey);

  // Break out early if no expected value was provided OR the key was missing
  if (typeof expectedValue === "undefined" || !hasKey) {
    return {
      pass: hasKey,
      message: () =>
        hasKey
          ? `Expected ${actualStr} to NOT have the key ${expectedStr}, but it did!`
          : `Expected ${actualStr} to have the key ${expectedStr}, but it didn't!`,
      expected: expectedKey,
      actual: keys,
    };
  }

  // Check for value equality
  const gotVal = received.get(expectedKey);
  const pass = this.equals(gotVal, expectedValue, [...this.customTesters, this.utils.iterableEquality]);

  const valueStr = getOnelineDiffStr.call(this, expectedValue);
  const gotValStr = getOnelineDiffStr.call(this, gotVal);
  return {
    pass,
    message: () =>
      pass
        ? `Expected ${actualStr}'s value for ${expectedKey} to NOT be ${valueStr}, but it was!`
        : `Expected ${actualStr}'s value for ${expectedKey} to be ${valueStr}, but got ${gotValStr} instead!`,
    expected: expectedValue,
    actual: gotVal,
  };
}
