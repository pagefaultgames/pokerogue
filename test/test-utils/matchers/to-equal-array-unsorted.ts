import { getOnelineDiffStr } from "#test/test-utils/string-utils";
import type { MatcherState, SyncExpectationResult } from "@vitest/expect";

/**
 * Matcher that checks if an array contains exactly the given items, disregarding order.
 * @param received - The received value. Should be an array of elements
 * @param expected - The array to check equality with
 * @returns Whether the matcher passed
 */
export function toEqualArrayUnsorted(
  this: MatcherState,
  received: unknown,
  expected: unknown[],
): SyncExpectationResult {
  if (!Array.isArray(received)) {
    return {
      pass: false,
      message: () => `Expected an array, but got ${this.utils.stringify(received)}!`,
    };
  }

  if (received.length !== expected.length) {
    return {
      pass: false,
      message: () => `Expected to receive array of length ${received.length}, but got ${expected.length} instead!`,
      actual: received,
      expected,
    };
  }

  // Create shallow copies of the arrays in case we have
  const actualSorted = received.slice().sort();
  const expectedSorted = expected.slice().sort();
  const pass = this.equals(actualSorted, expectedSorted, [...this.customTesters, this.utils.iterableEquality]);

  const actualStr = getOnelineDiffStr.call(this, actualSorted);
  const expectedStr = getOnelineDiffStr.call(this, expectedSorted);

  return {
    pass,
    message: () =>
      pass
        ? `Expected ${actualStr} to NOT exactly equal ${expectedStr} without order, but it did!`
        : `Expected ${actualStr} to exactly equal ${expectedStr} without order, but it didn't!`,
    expected: expectedSorted,
    actual: actualSorted,
  };
}
