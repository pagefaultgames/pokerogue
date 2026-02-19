import { getOnelineDiffStr } from "#test/test-utils/string-utils";
import { receivedStr } from "#test/test-utils/test-utils";
import type { MatcherState, SyncExpectationResult } from "@vitest/expect";

/**
 * Matcher that checks if an array contains exactly the given items, disregarding order.
 * @param received - The received value. Should be an array of elements
 * @param expected - The array to check equality with
 * @returns Whether the matcher passed
 * @privateRemarks
 * Since this function can receive both readonly and non-readonly arrays, we restrict ourselves
 * to only using methods that do not mutate the passed-in arguments.
 */
export function toEqualUnsorted<T>(
  this: Readonly<MatcherState>,
  received: readonly T[],
  expected: readonly T[],
): SyncExpectationResult {
  if (!Array.isArray(received)) {
    return {
      pass: this.isNot,
      message: () => `Expected to receive an array, but got ${receivedStr(received)}!`,
    };
  }

  if (received.length !== expected.length) {
    return {
      pass: false,
      message: () => `Expected to receive an array of length ${received.length}, but got ${expected.length} instead!`,
      expected,
      actual: received,
    };
  }

  const actualSorted = received.toSorted();
  const expectedSorted = expected.toSorted();
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
