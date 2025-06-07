import type Pokemon from "#app/field/pokemon";
import type { NumberHolder } from "#app/utils/common";
import { HeldItemId } from "#enums/held-item-id";
import i18next from "i18next";
import { HeldItem, ITEM_EFFECT } from "../held-item";

export interface EXP_BOOST_PARAMS {
  /** The pokemon with the item */
  pokemon: Pokemon;
  /** The amount of exp to gain */
  expAmount: NumberHolder;
}

export class ExpBoosterHeldItem extends HeldItem {
  public effects: ITEM_EFFECT[] = [ITEM_EFFECT.EXP_BOOSTER];
  private boostMultiplier: number;

  constructor(type: HeldItemId, maxStackCount = 1, boostPercent: number) {
    super(type, maxStackCount);
    this.boostMultiplier = boostPercent * 0.01;
  }

  get name(): string {
    return this.type === HeldItemId.LUCKY_EGG
      ? i18next.t("modifierType:ModifierType.LUCKY_EGG.name")
      : i18next.t("modifierType:ModifierType.GOLDEN_EGG.name");
  }

  get description(): string {
    return this.type === HeldItemId.LUCKY_EGG
      ? i18next.t("modifierType:ModifierType.LUCKY_EGG.description")
      : i18next.t("modifierType:ModifierType.GOLDEN_EGG.description");
  }

  get icon(): string {
    return this.type === HeldItemId.LUCKY_EGG ? "lucky_egg" : "golden_egg";
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
   * @param _pokemon The {@linkcode Pokemon} to apply the exp boost to
   * @param boost {@linkcode NumberHolder} holding the exp boost value
   * @returns always `true`
   */
  apply(params: EXP_BOOST_PARAMS): boolean {
    const pokemon = params.pokemon;
    const expAmount = params.expAmount;
    const stackCount = pokemon.heldItemManager.getStack(this.type);
    expAmount.value = Math.floor(expAmount.value * (1 + stackCount * this.boostMultiplier));

    return true;
  }
}
