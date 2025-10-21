import type { SerializedPositionalTag, toSerializedPosTag } from "#data/positional-tags/load-positional-tag";
import type { DelayedAttackTag, WishTag } from "#data/positional-tags/positional-tag";
import type { PositionalTagType } from "#enums/positional-tag-type";
import type { NonFunctionPropertiesRecursive } from "#types/type-helpers";
import { describe, expectTypeOf, it } from "vitest";

describe("toSerializedPosTag", () => {
  it("should map each class' tag type to their serialized forms", () => {
    expectTypeOf<toSerializedPosTag<PositionalTagType.DELAYED_ATTACK>>().branded.toEqualTypeOf<
      NonFunctionPropertiesRecursive<DelayedAttackTag>
    >();
    expectTypeOf<toSerializedPosTag<PositionalTagType.WISH>>().branded.toEqualTypeOf<
      NonFunctionPropertiesRecursive<WishTag>
    >();
  });
});

describe("SerializedPositionalTag", () => {
  it("should be a union of all serialized tag forms", () => {
    expectTypeOf<SerializedPositionalTag>().branded.toEqualTypeOf<
      NonFunctionPropertiesRecursive<DelayedAttackTag> | NonFunctionPropertiesRecursive<WishTag>
    >();
  });
  it("should be extended by all unserialized tag forms", () => {
    expectTypeOf<WishTag>().toExtend<SerializedPositionalTag>();
    expectTypeOf<DelayedAttackTag>().toExtend<SerializedPositionalTag>();
  });
});
