import type { MatcherState, SyncExpectationResult } from "@vitest/expect";

/**
 * Matcher to check if an array contains exactly the given items, disregarding order.
 * @param received - The object to check. Should be an array of elements.
 * @returns The result of the matching
 */
export function toEqualArrayUnsorted(this: MatcherState, received: unknown, expected: unknown): SyncExpectationResult {
  if (!Array.isArray(received)) {
    return {
      pass: this.isNot,
      message: () => `Expected an array, but got ${this.utils.stringify(received)}!`,
    };
  }

  if (!Array.isArray(expected)) {
    return {
      pass: this.isNot,
      message: () => `Expected to recieve an array, but got ${this.utils.stringify(expected)}!`,
    };
  }

  if (received.length !== expected.length) {
    return {
      pass: this.isNot,
      message: () => `Expected to recieve array of length ${received.length}, but got ${expected.length}!`,
      actual: received,
      expected,
    };
  }

  const gotSorted = received.slice().sort();
  const wantSorted = expected.slice().sort();
  const pass = this.equals(gotSorted, wantSorted, [...this.customTesters, this.utils.iterableEquality]);

  return {
    pass: this.isNot !== pass,
    message: () =>
      `Expected ${this.utils.stringify(received)} to exactly equal ${this.utils.stringify(expected)} without order!`,
    actual: gotSorted,
    expected: wantSorted,
  };
}
