import type { Assertion } from "@vitest/expect";
import { describe, expectTypeOf, it } from "vitest";

describe("Matcher Types", () => {
  it("should ban everything from Chai.Assertion except `not`", () => {
    type ChaiAssertionKeys = Exclude<keyof Chai.Assertion, "not">;
    expectTypeOf<Assertion[ChaiAssertionKeys]>().toBeNever();
    expectTypeOf<Assertion["not"]>().not.toBeNever();
  });
});
