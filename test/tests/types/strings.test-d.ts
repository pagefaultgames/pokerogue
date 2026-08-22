import type { Stringify, Unstringify } from "#types/strings";
import type { Tagged } from "type-fest";
import { describe, expectTypeOf, it } from "vitest";

describe("String types", () => {
  describe("Stringify", () => {
    it("should convert primitive literals to their string counterparts", () => {
      expectTypeOf<Stringify<"hello">>().toEqualTypeOf<"hello">();
      expectTypeOf<Stringify<1>>().toEqualTypeOf<"1">();
    });

    it("should work for primitives", () => {
      expectTypeOf<Stringify<boolean>>().toEqualTypeOf<`${boolean}`>();
      expectTypeOf<Stringify<string>>().toEqualTypeOf<string>();
      expectTypeOf<Stringify<number>>().toEqualTypeOf<`${number}`>();
    });
    it("should distribute over unions", () => {
      expectTypeOf<Stringify<1 | 2>>().toEqualTypeOf<"1" | "2">();
    });
  });
  describe("Unstringify", () => {
    it("should convert stringified primitive literals back to their original types", () => {
      expectTypeOf<Unstringify<`${42}`>>().toEqualTypeOf<42>();
      expectTypeOf<Unstringify<`${"hello"}`>>().toEqualTypeOf<"hello">();
    });

    // NB: This does not work with enums, but that's fine since we're mostly going to remove them anyhow
    it("should round-trip with Stringify for tagged literals", () => {
      type SpecialOne = Tagged<1, "apples">;
      expectTypeOf<Unstringify<Stringify<SpecialOne>>>().toEqualTypeOf<SpecialOne>();
    });
  });
});
