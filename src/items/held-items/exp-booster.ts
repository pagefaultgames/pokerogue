import { HeldItemEffect } from "#enums/held-item-effect";
import type { HeldItemId } from "#enums/held-item-id";
import { HeldItem } from "#items/held-item";
import type { ExpBoostParams } from "#types/held-item-parameter";
import i18next from "i18next";

/**
 * Class used for items that boost the amount of experience gained from battles.
 * Used for Lucky and Golden Eggs.
 */
export class ExpBoosterHeldItem extends HeldItem<[typeof HeldItemEffect.EXP_BOOSTER]> {
  public readonly effects = [HeldItemEffect.EXP_BOOSTER] as const;
  /** The percentage boost to experience gained. */
  // TODO: This should arguably be stored as a decimal instead of % for consistency with other similar effects
  private readonly boostPercent: number;

  constructor(type: HeldItemId, maxStackCount: number, boostPercent: number) {
    super(type, maxStackCount);
    this.boostPercent = boostPercent;
  }

  get description(): string {
    return i18next.t("modifierType:ModifierType.PokemonExpBoosterModifierType.description", {
      boostPercent: this.boostPercent,
    });
  }

  apply(_effect: typeof HeldItemEffect.EXP_BOOSTER, { pokemon, expAmount }: ExpBoostParams): void {
    const stackCount = pokemon.heldItemManager.getStack(this.type);
    expAmount.value = Math.floor(expAmount.value * (1 + stackCount * this.boostPercent * 0.01));
  }
}
