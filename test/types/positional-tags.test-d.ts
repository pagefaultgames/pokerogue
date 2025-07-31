import type { SerializedPositionalTag, serializedPosTagMap } from "#data/positional-tags/load-positional-tag";
import type { DelayedAttackTag, WishTag } from "#data/positional-tags/positional-tag";
import type { PositionalTagType } from "#enums/positional-tag-type";
import type { Mutable, NonFunctionPropertiesRecursive } from "#types/type-helpers";
import { describe, expectTypeOf, it } from "vitest";

// Needed to get around properties being readonly in certain classes
type NonFunctionMutable<T> = Mutable<NonFunctionPropertiesRecursive<T>>;

describe("serializedPositionalTagMap", () => {
  it("should contain representations of each tag's serialized form", () => {
    expectTypeOf<serializedPosTagMap[PositionalTagType.DELAYED_ATTACK]>().branded.toEqualTypeOf<
      NonFunctionMutable<DelayedAttackTag>
    >();
    expectTypeOf<serializedPosTagMap[PositionalTagType.WISH]>().branded.toEqualTypeOf<NonFunctionMutable<WishTag>>();
  });
});

describe("SerializedPositionalTag", () => {
  it("should accept a union of all serialized tag forms", () => {
    expectTypeOf<SerializedPositionalTag>().branded.toEqualTypeOf<
      NonFunctionMutable<DelayedAttackTag> | NonFunctionMutable<WishTag>
    >();
  });
  it("should accept a union of all unserialized tag forms", () => {
    expectTypeOf<WishTag>().toExtend<SerializedPositionalTag>();
    expectTypeOf<DelayedAttackTag>().toExtend<SerializedPositionalTag>();
  });
});
