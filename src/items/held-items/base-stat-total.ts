import { HeldItemEffect } from "#enums/held-item-effect";
import type { HeldItemId } from "#enums/held-item-id";
import { HeldItem } from "#items/held-item";
import type { BaseStatTotalParams } from "#items/held-item-parameter";
import i18next from "i18next";

/**
 * Currently used by Shuckle Juice item
 */
export class BaseStatTotalHeldItem extends HeldItem<[typeof HeldItemEffect.BASE_STAT_TOTAL]> {
  public readonly effects = [HeldItemEffect.BASE_STAT_TOTAL] as const;
  public isTransferable = false;
  public statModifier: number;

  constructor(type: HeldItemId, maxStackCount: number, statModifier: number) {
    super(type, maxStackCount);
    this.statModifier = statModifier;
  }

  get name(): string {
    return this.statModifier > 0
      ? i18next.t("modifierType:ModifierType.MYSTERY_ENCOUNTER_SHUCKLE_JUICE_GOOD.name")
      : i18next.t("modifierType:ModifierType.MYSTERY_ENCOUNTER_SHUCKLE_JUICE_BAD.name");
  }

  // TODO: where is this description shown?
  get description(): string {
    return this.statModifier > 0
      ? i18next.t("modifierType:ModifierType.MYSTERY_ENCOUNTER_SHUCKLE_JUICE_GOOD.description")
      : i18next.t("modifierType:ModifierType.MYSTERY_ENCOUNTER_SHUCKLE_JUICE_BAD.description");
  }

  get iconName(): string {
    return this.statModifier > 0 ? "berry_juice_good" : "berry_juice_bad";
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
  apply(_effect: typeof HeldItemEffect.BASE_STAT_TOTAL, { baseStats }: BaseStatTotalParams): true {
    // Modifies the passed in baseStats[] array
    baseStats.forEach((v, i) => {
      // HP is affected by half as much as other stats
      const newVal = i === 0 ? Math.floor(v + this.statModifier / 2) : Math.floor(v + this.statModifier);
      baseStats[i] = Math.min(Math.max(newVal, 1), 999999);
    });

    return true;
  }
}
