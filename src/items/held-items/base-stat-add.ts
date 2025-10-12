import { HeldItemEffect } from "#enums/held-item-effect";
import type { HeldItemId } from "#enums/held-item-id";
import { Stat } from "#enums/stat";
import type { Pokemon } from "#field/pokemon";
import { HeldItem } from "#items/held-item";
import type { BaseStatParams } from "#types/held-item-parameter";
import i18next from "i18next";

/**
 * Currently used by Old Gateau item
 */
export class OldGateauHeldItem extends HeldItem<[typeof HeldItemEffect.BASE_STAT_ADD]> {
  public readonly effects = [HeldItemEffect.BASE_STAT_ADD] as const;
  public isTransferable = false;

  get description(): string {
    return i18next.t("modifierType:ModifierType.PokemonBaseStatFlatModifierType.description");
  }

  apply(_effect: typeof HeldItemEffect.BASE_STAT_ADD, { pokemon, baseStats }: BaseStatParams): void {
    const stats = this.getStats(pokemon);
    const statModifier = 20;
    // Modifies the passed in baseStats[] array by a flat value, only if the stat is specified in this.stats
    baseStats.forEach((v, i) => {
      if (stats.includes(i)) {
        const newVal = Math.floor(v + statModifier);
        baseStats[i] = Math.min(Math.max(newVal, 1), 999999);
      }
    });
  }

  /**
   * Get the lowest of HP/Spd, lowest of Atk/SpAtk, and lowest of Def/SpDef
   * @returns Array of 3 {@linkcode Stat}s to boost
   */
  getStats(pokemon: Pokemon): [HpOrSpeed: Stat, AtkOrSpAtk: Stat, DefOrSpDef: Stat] {
    const baseStats = pokemon.getSpeciesForm().baseStats;
    return [
      baseStats[Stat.HP] < baseStats[Stat.SPD] ? Stat.HP : Stat.SPD,
      baseStats[Stat.ATK] < baseStats[Stat.SPATK] ? Stat.ATK : Stat.SPATK,
      baseStats[Stat.DEF] < baseStats[Stat.SPDEF] ? Stat.DEF : Stat.SPDEF,
    ];
  }
}

/**
 * Currently used by Shuckle Juice item
 */
export class ShuckleJuiceHeldItem extends HeldItem<[typeof HeldItemEffect.BASE_STAT_ADD]> {
  public readonly effects = [HeldItemEffect.BASE_STAT_ADD] as const;
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
  apply(_effect: typeof HeldItemEffect.BASE_STAT_ADD, { baseStats }: BaseStatParams): true {
    // Modifies the passed in baseStats[] array
    baseStats.forEach((v, i) => {
      // HP is affected by half as much as other stats
      const newVal = i === 0 ? Math.floor(v + this.statModifier / 2) : Math.floor(v + this.statModifier);
      baseStats[i] = Math.min(Math.max(newVal, 1), 999999);
    });

    return true;
  }
}
