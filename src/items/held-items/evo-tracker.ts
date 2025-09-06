import { globalScene } from "#app/global-scene";
import { HeldItemEffect } from "#enums/held-item-effect";
import { HeldItemId } from "#enums/held-item-id";
import type { SpeciesId } from "#enums/species-id";
import { TrainerItemId } from "#enums/trainer-item-id";
import type { Pokemon } from "#field/pokemon";
import { HeldItem } from "#items/held-item";
import i18next from "i18next";

export class EvoTrackerHeldItem extends HeldItem<[typeof HeldItemEffect.EVO_TRACKER]> {
  public readonly effects = [HeldItemEffect.EVO_TRACKER] as const;

  protected species: SpeciesId;
  protected required: number;
  public isTransferable = false;

  constructor(type: HeldItemId, maxStackCount: number, species: SpeciesId, required: number) {
    super(type, maxStackCount);
    this.species = species;
    this.required = required;
  }

  /**
   * Applies the {@linkcode EvoTrackerModifier}
   * @returns always `true`
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
    const stackCount =
      pokemon.heldItemManager.getStack(this.type) +
      pokemon.heldItemManager.getStack(HeldItemId.GOLDEN_PUNCH) +
      globalScene.trainerItems.getStack(TrainerItemId.AMULET_COIN) +
      globalScene.trainerItems.getStack(TrainerItemId.GOLDEN_POKEBALL);
    return stackCount;
  }
}
