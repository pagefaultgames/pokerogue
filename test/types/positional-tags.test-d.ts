import type { SerializedPositionalTag, ToSerializedPosTag } from "#data/positional-tags/load-positional-tag";
import type { DelayedAttackTag, WishTag } from "#data/positional-tags/positional-tag";
import type { PositionalTagType } from "#enums/positional-tag-type";
import type { Jsonify } from "type-fest";
import { describe, expectTypeOf, it } from "vitest";

describe("Positional Tags", () => {
  describe("ToSerializedPosTag", () => {
    it("should map each class' tag type to their serialized forms", () => {
      expectTypeOf<ToSerializedPosTag<PositionalTagType.DELAYED_ATTACK>>().branded.toEqualTypeOf<
        Jsonify<DelayedAttackTag>
      >();
      expectTypeOf<ToSerializedPosTag<PositionalTagType.WISH>>().branded.toEqualTypeOf<Jsonify<WishTag>>();
    });
  });

  describe("SerializedPositionalTag", () => {
    it("should be a union of all serialized tag forms", () => {
      expectTypeOf<SerializedPositionalTag>().branded.toEqualTypeOf<Jsonify<DelayedAttackTag> | Jsonify<WishTag>>();
    });
    it("should be extended by all unserialized class instances", () => {
      expectTypeOf<WishTag>().toExtend<SerializedPositionalTag>();
      expectTypeOf<DelayedAttackTag>().toExtend<SerializedPositionalTag>();
    });
  });
});
