import { globalScene } from "#app/global-scene";
import { HeldItemEffect } from "#enums/held-item-effect";
import { HeldItemId } from "#enums/held-item-id";
import type { SpeciesId } from "#enums/species-id";
import { TrainerItemId } from "#enums/trainer-item-id";
import type { Pokemon } from "#field/pokemon";
import { DEFAULT_HELD_ITEM_FLAGS, HELD_ITEM_FLAG_TRANSFERABLE, HeldItem } from "#items/held-item";
import i18next from "i18next";

export class EvoTrackerHeldItem extends HeldItem<[typeof HeldItemEffect.EVO_TRACKER]> {
  public readonly effects = [HeldItemEffect.EVO_TRACKER] as const;

  protected species: SpeciesId;
  protected required: number;
  protected override readonly flags =
    DEFAULT_HELD_ITEM_FLAGS & ~(HELD_ITEM_FLAG_TRANSFERABLE | HELD_ITEM_FLAG_TRANSFERABLE);

  constructor(type: HeldItemId, maxStackCount: number, species: SpeciesId, required: number) {
    super(type, maxStackCount);
    this.species = species;
    this.required = required;
  }

  /**
   * Applies the {@linkcode EvoTrackerModifier}
   */
  // TODO: does this need fixing?
  apply(): boolean {
    return true;
  }
}

export class GimmighoulEvoTrackerHeldItem extends EvoTrackerHeldItem {
  get name(): string {
    return i18next.t("modifierType:ModifierType.EVOLUTION_TRACKER_GIMMIGHOUL.name");
  }

  get description(): string {
    return i18next.t("modifierType:ModifierType.EVOLUTION_TRACKER_GIMMIGHOUL.description");
  }

  get iconName(): string {
    return "relic_gold";
  }

  getStackCount(pokemon: Pokemon): number {
    const getStack = pokemon.heldItemManager.getStack;
    const getGlobalStack = globalScene.trainerItems.getStack;
    const stackCount =
      getStack(this.type)
      + getStack(HeldItemId.GOLDEN_PUNCH)
      + getGlobalStack(TrainerItemId.AMULET_COIN)
      + getGlobalStack(TrainerItemId.GOLDEN_POKEBALL);
    return stackCount;
  }
}
