import { Stat } from "#enums/stat";
import type { Pokemon } from "#field/pokemon";
import { HeldItem, HeldItemEffect } from "#items/held-item";
import i18next from "i18next";

export interface BaseStatFlatParams {
  /** The pokemon with the item */
  pokemon: Pokemon;
  /** The amount of exp to gain */
  baseStats: number[];
}

/**
 * Currently used by Old Gateau item
 */
export class BaseStatFlatHeldItem extends HeldItem {
  public effects: HeldItemEffect[] = [HeldItemEffect.BASE_STAT_FLAT];
  public isTransferable = false;

  get description(): string {
    return i18next.t("modifierType:ModifierType.PokemonBaseStatFlatReward.description");
  }

  /**
   * Checks if the {@linkcode PokemonBaseStatFlatModifier} should be applied to the {@linkcode Pokemon}.
   * @param pokemon The {@linkcode Pokemon} that holds the item
   * @param baseStats The base stats of the {@linkcode Pokemon}
   * @returns `true` if the {@linkcode PokemonBaseStatFlatModifier} should be applied
   */
  //  override shouldApply(pokemon?: Pokemon, baseStats?: number[]): boolean {
  //    return super.shouldApply(pokemon, baseStats) && Array.isArray(baseStats);
  //  }

  /**
   * Applies the {@linkcode PokemonBaseStatFlatModifier}
   * @param _pokemon The {@linkcode Pokemon} that holds the item
   * @param baseStats The base stats of the {@linkcode Pokemon}
   * @returns always `true`
   */
  apply(params: BaseStatFlatParams): boolean {
    const pokemon = params.pokemon;
    const baseStats = params.baseStats;
    const stats = this.getStats(pokemon);
    const statModifier = 20;
    // Modifies the passed in baseStats[] array by a flat value, only if the stat is specified in this.stats
    baseStats.forEach((v, i) => {
      if (stats.includes(i)) {
        const newVal = Math.floor(v + statModifier);
        baseStats[i] = Math.min(Math.max(newVal, 1), 999999);
      }
    });

    return true;
  }

  /**
   * Get the lowest of HP/Spd, lowest of Atk/SpAtk, and lowest of Def/SpDef
   * @returns Array of 3 {@linkcode Stat}s to boost
   */
  getStats(pokemon: Pokemon): Stat[] {
    const stats: Stat[] = [];
    const baseStats = pokemon.getSpeciesForm().baseStats.slice(0);
    // HP or Speed
    stats.push(baseStats[Stat.HP] < baseStats[Stat.SPD] ? Stat.HP : Stat.SPD);
    // Attack or SpAtk
    stats.push(baseStats[Stat.ATK] < baseStats[Stat.SPATK] ? Stat.ATK : Stat.SPATK);
    // Def or SpDef
    stats.push(baseStats[Stat.DEF] < baseStats[Stat.SPDEF] ? Stat.DEF : Stat.SPDEF);
    return stats;
  }
}
