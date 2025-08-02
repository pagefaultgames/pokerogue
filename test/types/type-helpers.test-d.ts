import type { AtLeastOne } from "#types/type-helpers";
import { describe, it } from "node:test";
import { expectTypeOf } from "vitest";

type fakeObj = {
  foo: number;
  bar: string;
  baz: number | string;
};

type optionalObj = {
  foo: number;
  bar: string;
  baz?: number | string;
};

describe("AtLeastOne", () => {
  it("should accept an object with at least 1 of its defined parameters", () => {
    expectTypeOf<{ foo: number }>().toExtend<AtLeastOne<fakeObj>>();
    expectTypeOf<{ bar: string }>().toExtend<AtLeastOne<fakeObj>>();
    expectTypeOf<{ baz: number | string }>().toExtend<AtLeastOne<fakeObj>>();
  });

  it("should convert to a partial intersection with the union of all individual single properties", () => {
    expectTypeOf<AtLeastOne<fakeObj>>().branded.toEqualTypeOf<
      Partial<fakeObj> & ({ foo: number } | { bar: string } | { baz: number | string })
    >();
  });

  it("should treat optional properties as required", () => {
    expectTypeOf<AtLeastOne<fakeObj>>().branded.toEqualTypeOf<AtLeastOne<optionalObj>>();
  });

  it("should not accept empty objects, even if optional properties are present", () => {
    expectTypeOf<Record<string, never>>().not.toExtend<AtLeastOne<fakeObj>>();
    expectTypeOf<Record<string, never>>().not.toExtend<AtLeastOne<optionalObj>>();
  });
});
