import Overrides, { defaultOverrides } from "#app/overrides";
import { expect, test } from "vitest";

test("Overrides are default values", () => {
  expect(Overrides).toEqual(defaultOverrides);
});
