import { HeldItemEffect } from "#enums/held-item-effect";
import { HeldItemId } from "#enums/held-item-id";
import type { HeldItem } from "#items/held-item";
import { ConsumableHeldItemAttr, HeldItemAttr } from "#items/held-item-attr";
import { HeldItemBuilder } from "#items/held-item-builder";
import type { ErrorType } from "#types/error-type";
import type { ExtractItemEffect } from "#types/held-item-data-types";
import { describe, expectTypeOf, it } from "vitest";

// Dummy classes

class NonConsumableAttr extends HeldItemAttr<typeof HeldItemEffect.FIELD_EFFECT> {
  private declare readonly _: never;
  public override readonly effect = HeldItemEffect.FIELD_EFFECT;
  public override apply(): void {}
}
class ConsumableAttr extends ConsumableHeldItemAttr<typeof HeldItemEffect.EXP_BOOSTER> {
  public override readonly effect = HeldItemEffect.EXP_BOOSTER;
  public override apply(): void {}
}
class ConsumableAttr2 extends ConsumableHeldItemAttr<typeof HeldItemEffect.MACHO_BRACE> {
  public override readonly effect = HeldItemEffect.MACHO_BRACE;
  public override apply(): void {}
}

const builder = () => new HeldItemBuilder(HeldItemId.ABOMASITE);

describe("HeldItemBuilder", () => {
  it("should start with never for both type parameters", () => {
    expectTypeOf(builder()).toEqualTypeOf<HeldItemBuilder<never, never>>();
  });

  it("should preserve type information when adding non-consumable attributes", () => {
    const result = builder().attr(NonConsumableAttr);
    expectTypeOf(result).toEqualTypeOf<HeldItemBuilder<NonConsumableAttr, never>>();
  });

  it("should add a consumable attr to both Attrs and ConsumableEffects", () => {
    const result = builder().attr(ConsumableAttr);
    expectTypeOf(result).toEqualTypeOf<HeldItemBuilder<ConsumableAttr, ConsumableAttr["effect"]>>();
  });

  it("should accumulate types from multiple attributes", () => {
    const result = builder().attr(NonConsumableAttr).attr(ConsumableAttr);
    expectTypeOf(result).toEqualTypeOf<HeldItemBuilder<NonConsumableAttr | ConsumableAttr, ConsumableAttr["effect"]>>();
  });

  it("should allow two consumable attrs for different effects", () => {
    const result = builder().attr(ConsumableAttr).attr(ConsumableAttr2);
    expectTypeOf(result).toEqualTypeOf<
      HeldItemBuilder<ConsumableAttr | ConsumableAttr2, ConsumableAttr["effect"] | ConsumableAttr2["effect"]>
    >();
  });

  it("should convert the builder into a properly typed held item instance", () => {
    expectTypeOf(builder().build()).toEqualTypeOf<HeldItem<never>>();
    expectTypeOf(builder().attr(NonConsumableAttr).build()).toEqualTypeOf<HeldItem<NonConsumableAttr>>();
    expectTypeOf(builder().attr(NonConsumableAttr).attr(ConsumableAttr).build()).toEqualTypeOf<
      HeldItem<NonConsumableAttr | ConsumableAttr>
    >();
  });

  describe("Errors", () => {
    it("should produce an ErrorType when adding a second consumable attr for the same effect", () => {
      const result = builder().attr(ConsumableAttr).attr(ConsumableAttr);
      expectTypeOf(result).toExtend<ErrorType<string>>();
      expectTypeOf(result).not.toExtend<HeldItemBuilder>();
    });

    it("should include the effect name in the error message", () => {
      const result = builder().attr(ConsumableAttr).attr(ConsumableAttr);
      type ExtractError<T> = T extends ErrorType<infer Message> ? Message : never;

      expectTypeOf<
        ExtractError<typeof result>
      >().toEqualTypeOf<"A held item cannot have more than one consumable attribute for a given effect, but 2 were found for HeldItemEffect.EXP_BOOSTER!">();
    });
  });
});

describe("ExtractItemEffect", () => {
  it("should map item IDs to effects", () => {
    expectTypeOf<ExtractItemEffect<typeof HeldItemId.SITRUS_BERRY>>().toEqualTypeOf<typeof HeldItemEffect.BERRY>();
  });
});
