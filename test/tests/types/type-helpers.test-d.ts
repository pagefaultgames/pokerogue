import type { AtLeastOne } from "#types/type-helpers";
import { describe, it } from "node:test";
import { expectTypeOf } from "vitest";

type FakeObj = {
  foo: number;
  bar: string;
  baz: number | string;
};

type OptionalObj = {
  foo: number;
  bar: string;
  baz?: number | string;
};

describe("AtLeastOne", () => {
  it("should accept an object with at least 1 of its defined parameters", () => {
    expectTypeOf<{ foo: number }>().toExtend<AtLeastOne<FakeObj>>();
    expectTypeOf<{ bar: string }>().toExtend<AtLeastOne<FakeObj>>();
    expectTypeOf<{ baz: number | string }>().toExtend<AtLeastOne<FakeObj>>();
  });

  it("should convert to a partial intersection with the union of all individual single properties", () => {
    expectTypeOf<AtLeastOne<FakeObj>>().branded.toEqualTypeOf<
      Partial<FakeObj> & ({ foo: number } | { bar: string } | { baz: number | string })
    >();
  });

  it("should treat optional properties as required", () => {
    expectTypeOf<AtLeastOne<FakeObj>>().branded.toEqualTypeOf<AtLeastOne<OptionalObj>>();
  });

  it("should not accept empty objects, even if optional properties are present", () => {
    expectTypeOf<Record<string, never>>().not.toExtend<AtLeastOne<FakeObj>>();
    expectTypeOf<Record<string, never>>().not.toExtend<AtLeastOne<OptionalObj>>();
  });
});
