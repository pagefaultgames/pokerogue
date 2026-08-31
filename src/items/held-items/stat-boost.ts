import { speciesDataRegistry } from "#app/global-species-data-registry";
import { HeldItemEffect } from "#enums/held-item-effect";
import type { HeldItemId } from "#enums/held-item-id";
import type { SpeciesId } from "#enums/species-id";
import type { Stat } from "#enums/stat";
import { HeldItemAttr } from "#items/held-item-attr";
import type { StatBoostParams } from "#types/held-item-parameter";
import type { NonEmptyTuple } from "type-fest";

/**
 * Class used for held items that boost specific stats by a multiplicative amount.
 */
// TODO: Rename class and effect to `StatMultiply`
abstract class StatBoostHeldItemAttr extends HeldItemAttr<typeof HeldItemEffect.STAT_BOOST> {
  public override readonly effect = HeldItemEffect.STAT_BOOST;
  /** The stats to multiply */
  protected readonly stats: readonly Stat[];
  /**
   * The multiplier to apply to `stats`; must be strictly positive
   */
  protected readonly multiplier: number;

  constructor(stats: NonEmptyTuple<Stat>, multiplier: number) {
    super();

    this.stats = stats;
    this.multiplier = multiplier;
  }

  public override shouldApply({ stat }: StatBoostParams): boolean {
    return this.stats.includes(stat);
  }

  public override apply({ statHolder }: StatBoostParams): void {
    statHolder.value *= this.multiplier;
  }

  // TODO: This looks like a holdover that can be removed
  getMaxHeldItemCount(): number {
    return 1;
  }
}

// TODO: Since the core logic for both classes is somewhat similar, could we try to combine them?
/**
 * Attribute used for held items that only boost stats of pre-evolved pokemon.
 */
export class EvolutionStatBoostHeldItemAttr extends StatBoostHeldItemAttr {
  public override shouldApply(params: StatBoostParams): boolean {
    if (!super.shouldApply(params)) {
      return false;
    }
    const { pokemon } = params;
    const isUnevolved = speciesDataRegistry.hasEvolutions(pokemon.getSpeciesForm(true).speciesId);
    if (isUnevolved) {
      // Dynamax/G-Max pokemon can never benefit from eviolite, even if their root species is unevolved
      return !pokemon.isMax();
    }

    // check for fusion that has eviolite
    return pokemon.isFusion() && speciesDataRegistry.hasEvolutions(pokemon.getFusionSpeciesForm(true).speciesId);
  }

  public override apply({ pokemon, statHolder }: StatBoostParams): void {
    const isUnevolved = speciesDataRegistry.hasEvolutions(pokemon.getSpeciesForm(true).speciesId);
    const isFusionUnevolved = speciesDataRegistry.hasEvolutions(pokemon.getFusionSpeciesForm(true).speciesId);

    let boost = this.multiplier - 1;
    if (pokemon.isFusion() && isFusionUnevolved !== isUnevolved) {
      // Halve the boost if 1/2 of a fused pokemon is unevolved.
      boost /= 2;
    }

    statHolder.value *= 1 + boost;
  }
}

// TODO: Stop littering these types all over the codebase and move them to 1 file
export type SpeciesStatBoosterItemId =
  | typeof HeldItemId.LIGHT_BALL
  | typeof HeldItemId.THICK_CLUB
  | typeof HeldItemId.METAL_POWDER
  | typeof HeldItemId.QUICK_POWDER
  | typeof HeldItemId.DEEP_SEA_SCALE
  | typeof HeldItemId.DEEP_SEA_TOOTH;

export class SpeciesStatBoostHeldItemAttr extends StatBoostHeldItemAttr {
  /** The species that the held item's stat boost(s) apply to */
  public readonly species: readonly SpeciesId[];

  constructor(stats: NonEmptyTuple<Stat>, multiplier: number, species: NonEmptyTuple<SpeciesId>) {
    super(stats, multiplier);
    this.species = species;
  }

  public override shouldApply(params: StatBoostParams): boolean {
    if (!super.shouldApply(params)) {
      return false;
    }

    const { pokemon } = params;
    return (
      this.species.includes(pokemon.getSpeciesForm(true).speciesId)
      || (pokemon.isFusion() && this.species.includes(pokemon.getFusionSpeciesForm(true).speciesId))
    );
  }
}
