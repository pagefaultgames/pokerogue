import { globalScene } from "#app/global-scene";
import { allHeldItems } from "#data/data-lists";
import { HeldItemEffect } from "#enums/held-item-effect";
import type { SpeciesStatBoosterItemId } from "#enums/held-item-id";
import { HeldItemId } from "#enums/held-item-id";
import { SpeciesId } from "#enums/species-id";
import { RewardGenerator } from "#items/reward";
import type { SpeciesStatBoostHeldItemAttr } from "#items/stat-multiply";
import { HeldItemReward } from "./held-item-reward";

const COMMON_SPECIES_STAT_BOOSTERS: readonly SpeciesStatBoosterItemId[] = [
  HeldItemId.DEEP_SEA_SCALE,
  HeldItemId.DEEP_SEA_TOOTH,
];

const RARE_SPECIES_STAT_BOOSTERS: readonly SpeciesStatBoosterItemId[] = [
  HeldItemId.LIGHT_BALL,
  HeldItemId.THICK_CLUB,
  HeldItemId.METAL_POWDER,
  HeldItemId.QUICK_POWDER,
];

/**
 * Generator for species-specific stat boosting held items,
 * weighting each item by the number of party members able to use it.
 */
export class SpeciesStatBoosterRewardGenerator extends RewardGenerator<SpeciesStatBoosterItemId> {
  private readonly rare: boolean;
  constructor(rare: boolean) {
    super();
    this.rare = rare;
  }

  /**
   * Weigh each item of this generator's tier by how many party members could use it.
   * Items no party member can use are omitted.
   */
  private getItemWeights(): Map<SpeciesStatBoosterItemId, number> {
    const tierItems = this.rare ? RARE_SPECIES_STAT_BOOSTERS : COMMON_SPECIES_STAT_BOOSTERS;

    const itemWeights = new Map<SpeciesStatBoosterItemId, number>();

    for (const p of globalScene.getPlayerParty()) {
      const speciesId = p.getSpeciesForm(true).speciesId;
      const fusionSpeciesId = p.isFusion() ? p.getFusionSpeciesForm(true).speciesId : null;
      // TODO: Use commented boolean when Fling is implemented
      const hasFling = false; /* p.getMoveset(true).some(m => m.moveId === MoveId.FLING) */

      for (const item of tierItems) {
        // TODO: Handle this more gracefully with some semblance of encapsulation
        const checkedSpecies = (
          allHeldItems[item].getAttrs(HeldItemEffect.STAT_MULTIPLY)[0] as SpeciesStatBoostHeldItemAttr
        ).species;

        // If party member already has the item being weighted currently, skip to the next item
        if (p.heldItemManager.hasItem(item)) {
          continue;
        }

        if (checkedSpecies.includes(speciesId) || (!!fusionSpeciesId && checkedSpecies.includes(fusionSpeciesId))) {
          // Add weight if party member has a matching species or, if applicable, a matching fusion species
          itemWeights.set(item, (itemWeights.get(item) ?? 0) + 1);
        } else if (checkedSpecies.includes(SpeciesId.PIKACHU) && hasFling) {
          // Add weight to Light Ball if party member has Fling
          itemWeights.set(item, (itemWeights.get(item) ?? 0) + 1);
        }
      }
    }

    return itemWeights;
  }

  public override getAllAvailableItems(): SpeciesStatBoosterItemId[] {
    return [...this.getItemWeights().keys()];
  }

  protected override getWeight(item: SpeciesStatBoosterItemId): number {
    return this.getItemWeights().get(item) ?? 1;
  }

  override generateReward(item: SpeciesStatBoosterItemId): HeldItemReward {
    return new HeldItemReward(item);
  }
}
