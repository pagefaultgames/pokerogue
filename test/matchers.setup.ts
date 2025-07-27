import { toEqualArrayUnsorted } from "#test/test-utils/matchers/to-equal-array-unsorted";
import { toHaveTypes } from "#test/test-utils/matchers/to-have-types";
import { expect } from "vitest";

/**
 * @module
 * Setup file for custom matchers.
 * Make sure to define the call signatures in `test/@types/vitest.d.ts` too!
 */

expect.extend({
  toEqualArrayUnsorted,
  toHaveTypes,
});
