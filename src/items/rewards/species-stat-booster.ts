import { globalScene } from "#app/global-scene";
import { HeldItemId } from "#enums/held-item-id";
import { SpeciesId } from "#enums/species-id";
import { allHeldItems } from "#items/all-held-items";
import { RewardGenerator } from "#items/reward";
import type { SpeciesStatBoosterItemId, SpeciesStatBoostHeldItem } from "#items/stat-boost";
import { randSeedInt } from "#utils/common";
import { HeldItemReward } from "./held-item-reward";

/**
 * Consumable type generator for {@linkcode SpeciesStatBoosterReward}, which
 * encapsulates the logic for weighting the most useful held item from
 * the current list of {@linkcode items}.
 * @extends RewardGenerator
 */
export class SpeciesStatBoosterRewardGenerator extends RewardGenerator {
  /** Object comprised of the currently available species-based stat boosting held items */

  private rare: boolean;
  constructor(rare: boolean) {
    super();
    this.rare = rare;
  }
  override generateReward(pregenArgs?: SpeciesStatBoosterItemId) {
    if (pregenArgs !== undefined) {
      return new HeldItemReward(pregenArgs);
    }

    // Get a pool of items based on the rarity.
    const tierItems = this.rare
      ? [HeldItemId.LIGHT_BALL, HeldItemId.THICK_CLUB, HeldItemId.METAL_POWDER, HeldItemId.QUICK_POWDER]
      : [HeldItemId.DEEP_SEA_SCALE, HeldItemId.DEEP_SEA_TOOTH];

    const weights = new Array(tierItems.length).fill(0);

    for (const p of globalScene.getPlayerParty()) {
      const speciesId = p.getSpeciesForm(true).speciesId;
      const fusionSpeciesId = p.isFusion() ? p.getFusionSpeciesForm(true).speciesId : null;
      // TODO: Use commented boolean when Fling is implemented
      const hasFling = false; /* p.getMoveset(true).some(m => m.moveId === MoveId.FLING) */

      for (const i in tierItems) {
        const checkedSpecies = (allHeldItems[tierItems[i]] as SpeciesStatBoostHeldItem).species;

        // If party member already has the item being weighted currently, skip to the next item
        const hasItem = p.heldItemManager.hasItem(tierItems[i]);

        if (!hasItem) {
          if (checkedSpecies.includes(speciesId) || (!!fusionSpeciesId && checkedSpecies.includes(fusionSpeciesId))) {
            // Add weight if party member has a matching species or, if applicable, a matching fusion species
            weights[i]++;
          } else if (checkedSpecies.includes(SpeciesId.PIKACHU) && hasFling) {
            // Add weight to Light Ball if party member has Fling
            weights[i]++;
          }
        }
      }
    }

    // TODO: Replace this with a helper function
    let totalWeight = 0;
    for (const weight of weights) {
      totalWeight += weight;
    }

    if (totalWeight !== 0) {
      const randInt = randSeedInt(totalWeight, 1);
      let weight = 0;

      for (const i in weights) {
        if (weights[i] !== 0) {
          const curWeight = weight + weights[i];
          if (randInt <= weight + weights[i]) {
            return new HeldItemReward(tierItems[i]);
          }
          weight = curWeight;
        }
      }
    }

    return null;
  }
}
