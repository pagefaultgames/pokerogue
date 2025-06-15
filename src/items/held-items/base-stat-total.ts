import type Pokemon from "#app/field/pokemon";
import i18next from "i18next";
import { HeldItem, ITEM_EFFECT } from "../held-item";
import type { BASE_STAT_TOTAL_DATA } from "../held-item-data";

export interface BASE_STAT_TOTAL_PARAMS {
  /** The pokemon with the item */
  pokemon: Pokemon;
  /** The amount of exp to gain */
  baseStats: number[];
}

/**
 * Currently used by Shuckle Juice item
 */
export class BaseStatTotalHeldItem extends HeldItem {
  public effects: ITEM_EFFECT[] = [ITEM_EFFECT.BASE_STAT_TOTAL];
  public isTransferable = false;

  get name(): string {
    return i18next.t("modifierType:ModifierType.MYSTERY_ENCOUNTER_SHUCKLE_JUICE") + " (new)";
  }

  // TODO: where is this description shown?
  get description(): string {
    return i18next.t("modifierType:ModifierType.PokemonBaseStatTotalModifierType.description", {
      increaseDecrease: i18next.t(
        this.statModifier >= 0
          ? "modifierType:ModifierType.PokemonBaseStatTotalModifierType.extra.increase"
          : "modifierType:ModifierType.PokemonBaseStatTotalModifierType.extra.decrease",
      ),
      blessCurse: i18next.t(
        this.statModifier >= 0
          ? "modifierType:ModifierType.PokemonBaseStatTotalModifierType.extra.blessed"
          : "modifierType:ModifierType.PokemonBaseStatTotalModifierType.extra.cursed",
      ),
      statValue: this.statModifier,
    });
  }

  get icon(): string {
    return "berry_juice";
  }

  /**
   * Checks if {@linkcode PokemonBaseStatTotalModifier} should be applied to the specified {@linkcode Pokemon}.
   * @param pokemon the {@linkcode Pokemon} to be modified
   * @param baseStats the base stats of the {@linkcode Pokemon}
   * @returns `true` if the {@linkcode Pokemon} should be modified
   */
  //  override shouldApply(pokemon?: Pokemon, baseStats?: number[]): boolean {
  //    return super.shouldApply(pokemon, baseStats) && Array.isArray(baseStats);
  //  }

  /**
   * Applies the {@linkcode PokemonBaseStatTotalModifier}
   * @param _pokemon the {@linkcode Pokemon} to be modified
   * @param baseStats the base stats of the {@linkcode Pokemon}
   * @returns always `true`
   */
  apply(params: BASE_STAT_TOTAL_PARAMS): boolean {
    const pokemon = params.pokemon;
    const itemData = pokemon.heldItemManager.heldItems[this.type]?.data as BASE_STAT_TOTAL_DATA;
    if (!itemData) {
      return false;
    }
    const statModifier = itemData.statModifier;
    const baseStats = params.baseStats;
    // Modifies the passed in baseStats[] array
    baseStats.forEach((v, i) => {
      // HP is affected by half as much as other stats
      const newVal = i === 0 ? Math.floor(v + statModifier / 2) : Math.floor(v + statModifier);
      baseStats[i] = Math.min(Math.max(newVal, 1), 999999);
    });

    return true;
  }
}
