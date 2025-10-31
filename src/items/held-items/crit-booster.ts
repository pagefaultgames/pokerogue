import { HeldItemEffect } from "#enums/held-item-effect";
import type { HeldItemId } from "#enums/held-item-id";
import type { SpeciesId } from "#enums/species-id";
import { HeldItem } from "#items/held-item";
import type { CritBoostParams } from "#types/held-item-parameter";

/**
 * Modifier used for held items that apply critical-hit stage boost(s).
 * using a multiplier.
 * @see {@linkcode apply}
 */
export class CritBoostHeldItem extends HeldItem<[typeof HeldItemEffect.CRIT_BOOST]> {
  public readonly effects = [HeldItemEffect.CRIT_BOOST] as const;

  /** The amount of stages by which the held item increases the current critical-hit stage value */
  protected stageIncrement: number;

  constructor(type: HeldItemId, maxStackCount: number, stageIncrement: number) {
    super(type, maxStackCount);

    this.stageIncrement = stageIncrement;
  }

  /**
   * Increases the current critical-hit stage value by {@linkcode stageIncrement}.
   * @param _pokemon {@linkcode Pokemon} N/A
   * @param critStage {@linkcode NumberHolder} that holds the resulting critical-hit level
   * @returns always `true`
   */
  apply(_effect: typeof HeldItemEffect.CRIT_BOOST, { critStage }: CritBoostParams): void {
    critStage.value += this.stageIncrement;
  }
}

/**
 * Modifier used for held items that apply critical-hit stage boost(s)
 * if the holder is of a specific {@linkcode SpeciesId}.
 * @extends CritBoosterModifier
 * @see {@linkcode shouldApply}
 */
export class SpeciesCritBoostHeldItem extends CritBoostHeldItem {
  /** The species that the held item's critical-hit stage boost applies to */
  private readonly species: readonly SpeciesId[];

  constructor(type: HeldItemId, maxStackCount: number, stageIncrement: number, species: readonly SpeciesId[]) {
    super(type, maxStackCount, stageIncrement);

    this.species = species;
  }

  /**
   * Checks if the holder's {@linkcode SpeciesId} (or its fused species) is listed
   * in {@linkcode species}.
   * @param effect - The effect to be applied
   * @param __namedParameters.critStage - Needed for proper typedoc rendering
   * @returns Whether the critical-hit stage boost should be applied
   */
  override shouldApply(effect: typeof HeldItemEffect.CRIT_BOOST, params: CritBoostParams): boolean {
    const pokemon = params.pokemon;
    return (
      super.shouldApply(effect, params)
      && (this.species.includes(pokemon.getSpeciesForm(true).speciesId)
        || (pokemon.isFusion() && this.species.includes(pokemon.getFusionSpeciesForm(true).speciesId)))
    );
  }
}
