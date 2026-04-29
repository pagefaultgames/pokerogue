import { type Assertion, describe, expectTypeOf, it } from "vitest";

describe("Matcher Types", () => {
  it("should ban everything from Chai.Assertion, except for `not`", () => {
    expectTypeOf<Assertion["not"]>().not.toBeNever();

    type ChaiAssertionKeys = Exclude<keyof Chai.Assertion, "not">;
    type NonNeverChaiAssertionKeys = {
      [k in ChaiAssertionKeys]: Assertion[k] extends never ? never : k;
    }[ChaiAssertionKeys];

    expectTypeOf<NonNeverChaiAssertionKeys>().toBeNever();
  });

  // TODO: Write comprehensive tests detailing allowed parameters for each matcher to ensure we don't break them again
  it.todo("should support custom types for matchers");
});
