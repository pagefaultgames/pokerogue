import { HeldItemEffect } from "#enums/held-item-effect";
import type { HeldItemId } from "#enums/held-item-id";
import { HeldItem } from "#items/held-item";
import type { ExpBoostParams } from "#types/held-item-parameter";
import i18next from "i18next";

export class ExpBoosterHeldItem extends HeldItem<[typeof HeldItemEffect.EXP_BOOSTER]> {
  public readonly effects = [HeldItemEffect.EXP_BOOSTER] as const;
  private boostPercent: number;
  private boostMultiplier: number;

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

  // TODO: What do we do with this? Need to look up all the shouldApply
  /**
   * Checks if {@linkcode PokemonExpBoosterModifier} should be applied
   * @param pokemon The {@linkcode Pokemon} to apply the exp boost to
   * @param boost {@linkcode NumberHolder} holding the exp boost value
   * @returns `true` if {@linkcode PokemonExpBoosterModifier} should be applied
   */
  //  override shouldApply(pokemon: Pokemon, boost: NumberHolder): boolean {
  //    return super.shouldApply(pokemon, boost) && !!boost;
  //  }

  /**
   * Applies {@linkcode PokemonExpBoosterModifier}
   * @returns always `true`
   */
  apply(_effect: typeof HeldItemEffect.EXP_BOOSTER, { pokemon, expAmount }: ExpBoostParams): true {
    const stackCount = pokemon.heldItemManager.getStack(this.type);
    expAmount.value = Math.floor(expAmount.value * (1 + stackCount * this.boostMultiplier));

    return true;
  }
}
