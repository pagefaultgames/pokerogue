import type { SerializedPositionalTag, toSerializedPosTag } from "#data/positional-tags/load-positional-tag";
import type { DelayedAttackTag, WishTag } from "#data/positional-tags/positional-tag";
import type { PositionalTagType } from "#enums/positional-tag-type";
import type { Mutable, NonFunctionPropertiesRecursive } from "#types/type-helpers";
import { describe, expectTypeOf, it } from "vitest";

// Needed to get around properties being readonly in certain classes
type NonFunctionMutable<T> = Mutable<NonFunctionPropertiesRecursive<T>>;

describe("toSerializedPosTag", () => {
  it("should contain representations of each tag's serialized form", () => {
    expectTypeOf<toSerializedPosTag<PositionalTagType.DELAYED_ATTACK>>().branded.toEqualTypeOf<
      NonFunctionMutable<DelayedAttackTag>
    >();
    expectTypeOf<toSerializedPosTag<PositionalTagType.WISH>>().branded.toEqualTypeOf<NonFunctionMutable<WishTag>>();
  });
});

describe("SerializedPositionalTag", () => {
  it("should be a union of all serialized tag forms", () => {
    expectTypeOf<SerializedPositionalTag>().branded.toEqualTypeOf<
      NonFunctionMutable<DelayedAttackTag> | NonFunctionMutable<WishTag>
    >();
  });
  it("should be extended by all unserialized tag forms", () => {
    expectTypeOf<WishTag>().toExtend<SerializedPositionalTag>();
    expectTypeOf<DelayedAttackTag>().toExtend<SerializedPositionalTag>();
  });
});
