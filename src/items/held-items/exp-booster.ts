import { HeldItemEffect } from "#enums/held-item-effect";
import type { HeldItemId } from "#enums/held-item-id";
import { HeldItem } from "#items/held-item";
import type { ExpBoostParams } from "#types/held-item-parameter";
import i18next from "i18next";

export class ExpBoosterHeldItem extends HeldItem<[typeof HeldItemEffect.EXP_BOOSTER]> {
  public readonly effects = [HeldItemEffect.EXP_BOOSTER] as const;
  private readonly boostPercent: number;
  private readonly boostMultiplier: number;

  constructor(type: HeldItemId, maxStackCount: number, boostPercent: number) {
    super(type, maxStackCount);
    this.boostPercent = boostPercent;
    this.boostMultiplier = boostPercent * 0.01;
  }

  get description(): string {
    return i18next.t("modifierType:ModifierType.PokemonExpBoosterModifierType.description", {
      boostPercent: this.boostPercent,
    });
  }

  apply(_effect: typeof HeldItemEffect.EXP_BOOSTER, { pokemon, expAmount }: ExpBoostParams): void {
    const stackCount = pokemon.heldItemManager.getAmount(this.type);
    expAmount.value = Math.floor(expAmount.value * (1 + stackCount * this.boostMultiplier));
  }
}
