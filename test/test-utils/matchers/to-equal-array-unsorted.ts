import type { MatcherState, SyncExpectationResult } from "@vitest/expect";

/**
 * Matcher to check if an array contains exactly the given items, disregarding order.
 * @param received - The received value. Should be an array of elements
 * @param expected - The array to check equality with
 * @returns Whether the matcher passed
 */
export function toEqualArrayUnsorted(this: MatcherState, received: unknown, expected: unknown): SyncExpectationResult {
  if (!Array.isArray(received)) {
    return {
      pass: false,
      message: () => `Expected an array, but got ${this.utils.stringify(received)}!`,
    };
  }

  if (!Array.isArray(expected)) {
    return {
      pass: false,
      message: () => `Expected to receive an array, but got ${this.utils.stringify(expected)}!`,
    };
  }

  if (received.length !== expected.length) {
    return {
      pass: false,
      message: () => `Expected to receive array of length ${received.length}, but got ${expected.length}!`,
      actual: received,
      expected,
    };
  }

  const gotSorted = received.slice().sort();
  const wantSorted = expected.slice().sort();
  const pass = this.equals(gotSorted, wantSorted, [...this.customTesters, this.utils.iterableEquality]);

  return {
    pass,
    message: () =>
      `Expected ${this.utils.stringify(received)} to exactly equal ${this.utils.stringify(expected)} without order!`,
    actual: gotSorted,
    expected: wantSorted,
  };
}
