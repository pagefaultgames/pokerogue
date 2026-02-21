import type { Assertion } from "@vitest/expect";
import { describe, expectTypeOf, it } from "vitest";

describe("Matcher Types", () => {
  it("should ban everything from Chai.Assertion except `not`", () => {
    type ChaiAssertionKeys = Exclude<keyof Chai.Assertion, "not">;
    expectTypeOf<Assertion[ChaiAssertionKeys]>().toBeNever();
    expectTypeOf<Assertion["not"]>().not.toBeNever();
  });

  // TODO: Write comprehensive tests detailing allowed parameters for each matcher to ensure we don't break them again
  it.todo("should support custom types for matchers");
});
