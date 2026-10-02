import { globalScene } from "#app/global-scene";
import { HeldItemId } from "#enums/held-item-id";
import type { SpeciesId } from "#enums/species-id";
import { TrainerItemId } from "#enums/trainer-item-id";
import type { Pokemon } from "#field/pokemon";
import { CosmeticHeldItem } from "#items/held-item";

/**
 * Class for cosmetic held items used to track evolution progress for certain species.
 * These items do not have any effects and are not transferable.
 */
abstract class EvoTrackerHeldItem extends CosmeticHeldItem {
  protected species: SpeciesId;
  protected required: number;

  constructor(type: HeldItemId, maxStackCount: number, species: SpeciesId, required: number) {
    super(type, maxStackCount);
    this.species = species;
    this.required = required;
  }
}

export class GimmighoulEvoTrackerHeldItem extends EvoTrackerHeldItem {
  get iconName(): string {
    return "relic_gold";
  }

  getStackCount(pokemon: Pokemon): number {
    const stackCount =
      pokemon.heldItemManager.getStack(this.id)
      + pokemon.heldItemManager.getStack(HeldItemId.GOLDEN_PUNCH)
      + globalScene.trainerItems.getStack(TrainerItemId.AMULET_COIN)
      + globalScene.trainerItems.getStack(TrainerItemId.GOLDEN_POKEBALL);
    return stackCount;
  }
}
