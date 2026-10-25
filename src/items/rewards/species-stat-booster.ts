import { globalScene } from "#app/global-scene";
import { allHeldItems } from "#data/data-lists";
import { HeldItemEffect } from "#enums/held-item-effect";
import type { SpeciesStatBoosterItemId } from "#enums/held-item-id";
import { HeldItemId } from "#enums/held-item-id";
import { RewardId } from "#enums/reward-id";
import { SpeciesId } from "#enums/species-id";
import { RewardGenerator } from "#items/reward";
import type { SpeciesStatBoostHeldItemAttr } from "#items/stat-multiply";
import { weightedPick } from "#utils/random";
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
    const id = this.rare ? RewardId.RARE_SPECIES_STAT_BOOSTER : RewardId.SPECIES_STAT_BOOSTER;

    if (pregenArgs !== undefined) {
      return new HeldItemReward(id, pregenArgs);
    }

    // Get a pool of items based on the rarity.
    const tierItems = this.rare
      ? [HeldItemId.LIGHT_BALL, HeldItemId.THICK_CLUB, HeldItemId.METAL_POWDER, HeldItemId.QUICK_POWDER]
      : [HeldItemId.DEEP_SEA_SCALE, HeldItemId.DEEP_SEA_TOOTH];

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
        const hasItem = p.heldItemManager.hasItem(item);

        if (!hasItem) {
          if (checkedSpecies.includes(speciesId) || (!!fusionSpeciesId && checkedSpecies.includes(fusionSpeciesId))) {
            // Add weight if party member has a matching species or, if applicable, a matching fusion species
            itemWeights.set(item, (itemWeights.get(item) ?? 0) + 1);
          } else if (checkedSpecies.includes(SpeciesId.PIKACHU) && hasFling) {
            // Add weight to Light Ball if party member has Fling
            itemWeights.set(item, (itemWeights.get(item) ?? 0) + 1);
          }
        }
      }
    }

    if (itemWeights.size > 0) {
      return new HeldItemReward(id, weightedPick(itemWeights));
    }

    return null;
  }
}
