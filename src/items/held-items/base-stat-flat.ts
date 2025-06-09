import type Pokemon from "#app/field/pokemon";
import type { HeldItemId } from "#enums/held-item-id";
import { HeldItem, ITEM_EFFECT } from "../held-item";
import type { Stat } from "#enums/stat";

export interface BASE_STAT_FLAT_PARAMS {
  /** The pokemon with the item */
  pokemon: Pokemon;
  /** The amount of exp to gain */
  baseStats: number[];
}

export interface BASE_STAT_FLAT_DATA {
  statModifier: number;
}

/**
 * Currently used by Old Gateau item
 */
export class BaseStatFlatHeldItem extends HeldItem {
  public effects: ITEM_EFFECT[] = [ITEM_EFFECT.BASE_STAT_FLAT];
  private stats: Stat[];
  public isTransferable = false;

  constructor(type: HeldItemId, maxStackCount = 1, stats: Stat[]) {
    super(type, maxStackCount);
    this.stats = stats;
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
  apply(params: BASE_STAT_FLAT_PARAMS): boolean {
    const pokemon = params.pokemon;
    const itemData = pokemon.heldItemManager.heldItems[this.type].data;
    if (!itemData) {
      return false;
    }
    const statModifier = itemData.statModifier;
    const baseStats = params.baseStats;
    // Modifies the passed in baseStats[] array by a flat value, only if the stat is specified in this.stats
    baseStats.forEach((v, i) => {
      if (this.stats.includes(i)) {
        const newVal = Math.floor(v + statModifier);
        baseStats[i] = Math.min(Math.max(newVal, 1), 999999);
      }
    });

    return true;
  }
}
