import { pokemonEvolutions } from "#app/data/balance/pokemon-evolutions";
import type Pokemon from "#app/field/pokemon";
import type { NumberHolder } from "#app/utils/common";
import type { HeldItemId } from "#enums/held-item-id";
import type { SpeciesId } from "#enums/species-id";
import type { Stat } from "#enums/stat";
import { HeldItem, ITEM_EFFECT } from "../held-item";

export interface STAT_BOOST_PARAMS {
  /** The pokemon with the item */
  pokemon: Pokemon;
  stat: Stat;
  statValue: NumberHolder;
}

/**
 * Modifier used for held items that Applies {@linkcode Stat} boost(s)
 * using a multiplier.
 * @extends PokemonHeldItemModifier
 * @see {@linkcode apply}
 */
export class StatBoostHeldItem extends HeldItem {
  public effects: ITEM_EFFECT[] = [ITEM_EFFECT.STAT_BOOST];
  /** The stats that the held item boosts */
  protected stats: Stat[];
  /** The multiplier used to increase the relevant stat(s) */
  protected multiplier: number;

  constructor(type: HeldItemId, maxStackCount = 1, stats: Stat[], multiplier: number) {
    super(type, maxStackCount);

    this.stats = stats;
    this.multiplier = multiplier;
  }

  /**
   * Checks if the incoming stat is listed in {@linkcode stats}
   * @param _pokemon the {@linkcode Pokemon} that holds the item
   * @param _stat the {@linkcode Stat} to be boosted
   * @param statValue {@linkcode NumberHolder} that holds the resulting value of the stat
   * @returns `true` if the stat could be boosted, false otherwise
   */
  //  override shouldApply(pokemon: Pokemon, stat: Stat, statValue: NumberHolder): boolean {
  //    return super.shouldApply(pokemon, stat, statValue) && this.stats.includes(stat);
  //  }

  /**
   * Boosts the incoming stat by a {@linkcode multiplier} if the stat is listed
   * in {@linkcode stats}.
   * @param _pokemon the {@linkcode Pokemon} that holds the item
   * @param _stat the {@linkcode Stat} to be boosted
   * @param statValue {@linkcode NumberHolder} that holds the resulting value of the stat
   * @returns `true` if the stat boost applies successfully, false otherwise
   * @see shouldApply
   */
  apply(params: STAT_BOOST_PARAMS): boolean {
    params.statValue.value *= this.multiplier;
    return true;
  }

  getMaxHeldItemCount(_pokemon: Pokemon): number {
    return 1;
  }
}

/**
 * Modifier used for held items, specifically Eviolite, that apply
 * {@linkcode Stat} boost(s) using a multiplier if the holder can evolve.
 * @extends StatBoosterModifier
 * @see {@linkcode apply}
 */
export class EvolutionStatBoostHeldItem extends StatBoostHeldItem {
  /**
   * Checks if the stat boosts can apply and if the holder is not currently
   * Gigantamax'd.
   * @param pokemon {@linkcode Pokemon} that holds the held item
   * @param stat {@linkcode Stat} The {@linkcode Stat} to be boosted
   * @param statValue {@linkcode NumberHolder} that holds the resulting value of the stat
   * @returns `true` if the stat boosts can be applied, false otherwise
   */
  //  override shouldApply(pokemon: Pokemon, stat: Stat, statValue: NumberHolder): boolean {
  //    return super.shouldApply(pokemon, stat, statValue) && !pokemon.isMax();
  //  }

  /**
   * Boosts the incoming stat value by a {@linkcode EvolutionStatBoosterModifier.multiplier} if the holder
   * can evolve. Note that, if the holder is a fusion, they will receive
   * only half of the boost if either of the fused members are fully
   * evolved. However, if they are both unevolved, the full boost
   * will apply.
   * @param pokemon {@linkcode Pokemon} that holds the item
   * @param _stat {@linkcode Stat} The {@linkcode Stat} to be boosted
   * @param statValue{@linkcode NumberHolder} that holds the resulting value of the stat
   * @returns `true` if the stat boost applies successfully, false otherwise
   * @see shouldApply
   */
  override apply(params: STAT_BOOST_PARAMS): boolean {
    const pokemon = params.pokemon;
    const isUnevolved = pokemon.getSpeciesForm(true).speciesId in pokemonEvolutions;

    if (pokemon.isFusion() && pokemon.getFusionSpeciesForm(true).speciesId in pokemonEvolutions !== isUnevolved) {
      // Half boost applied if pokemon is fused and either part of fusion is fully evolved
      params.statValue.value *= 1 + (this.multiplier - 1) / 2;
      return true;
    }
    if (isUnevolved) {
      // Full boost applied if holder is unfused and unevolved or, if fused, both parts of fusion are unevolved
      return super.apply(params);
    }

    return false;
  }
}

/**
 * Modifier used for held items that Applies {@linkcode Stat} boost(s) using a
 * multiplier if the holder is of a specific {@linkcode SpeciesId}.
 * @extends StatBoostHeldItem
 * @see {@linkcode apply}
 */
export class SpeciesStatBoostHeldItem extends StatBoostHeldItem {
  /** The species that the held item's stat boost(s) apply to */
  private species: SpeciesId[];

  constructor(type: HeldItemId, maxStackCount = 1, stats: Stat[], multiplier: number, species: SpeciesId[]) {
    super(type, maxStackCount, stats, multiplier);
    this.species = species;
  }

  /**
   * Checks if the incoming stat is listed in {@linkcode stats} and if the holder's {@linkcode SpeciesId}
   * (or its fused species) is listed in {@linkcode species}.
   * @param pokemon {@linkcode Pokemon} that holds the item
   * @param stat {@linkcode Stat} being checked at the time
   * @param statValue {@linkcode NumberHolder} that holds the resulting value of the stat
   * @returns `true` if the stat could be boosted, false otherwise
   */
  //  override shouldApply(pokemon: Pokemon, stat: Stat, statValue: NumberHolder): boolean {
  //    return (
  //      super.shouldApply(pokemon, stat, statValue) &&
  //      (this.species.includes(pokemon.getSpeciesForm(true).speciesId) ||
  //        (pokemon.isFusion() && this.species.includes(pokemon.getFusionSpeciesForm(true).speciesId)))
  //    );
  //  }

  apply(params: STAT_BOOST_PARAMS): boolean {
    const pokemon = params.pokemon;
    const fitsSpecies =
      this.species.includes(pokemon.getSpeciesForm(true).speciesId) ||
      (pokemon.isFusion() && this.species.includes(pokemon.getFusionSpeciesForm(true).speciesId));

    if (fitsSpecies) {
      return super.apply(params);
    }

    return false;
  }

  /**
   * Checks if either parameter is included in the corresponding lists
   * @param speciesId {@linkcode SpeciesId} being checked
   * @param stat {@linkcode Stat} being checked
   * @returns `true` if both parameters are in {@linkcode species} and {@linkcode stats} respectively, false otherwise
   */
  contains(speciesId: SpeciesId, stat: Stat): boolean {
    return this.species.includes(speciesId) && this.stats.includes(stat);
  }
}
