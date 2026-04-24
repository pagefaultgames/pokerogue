import { HeldItemEffect } from "#enums/held-item-effect";
import type { SpeciesId } from "#enums/species-id";
import { HeldItemAttr } from "#items/held-item-attr";
import type { CritBoostParams } from "#types/held-item-parameter";

/**
 * Attribute used for held items that increase the critical hit ratio of the Pokemon's moves.
 */
export class CritBoostHeldItemAttr extends HeldItemAttr<typeof HeldItemEffect.CRIT_BOOST> {
  public override readonly effect = HeldItemEffect.CRIT_BOOST;

  /** The amount of stages to increase the critical-hit stage by */
  protected stages: number;

  constructor(stageIncrement: number) {
    super();

    this.stages = stageIncrement;
  }

  public override apply({ critStage }: CritBoostParams): void {
    critStage.value += this.stages;
  }
}

/**
 * Attribute used for held items that only apply critical-hit boosts to specific species.
 */
export class SpeciesCritBoostHeldItemAttr extends CritBoostHeldItemAttr {
  /** The species that the held item's critical-hit stage boost applies to */
  private readonly species: readonly SpeciesId[];

  constructor(stageIncrement: number, species: readonly SpeciesId[]) {
    super(stageIncrement);

    this.species = species;
  }

  public override shouldApply(params: CritBoostParams): boolean {
    const { pokemon } = params;
    return (
      super.shouldApply(params)
      && (this.species.includes(pokemon.getSpeciesForm(true).speciesId)
        || (pokemon.isFusion() && this.species.includes(pokemon.getFusionSpeciesForm(true).speciesId)))
    );
  }
}
