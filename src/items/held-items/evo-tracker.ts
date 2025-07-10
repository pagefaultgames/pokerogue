import type Pokemon from "#app/field/pokemon";
import { globalScene } from "#app/global-scene";
import { HeldItemId } from "#enums/held-item-id";
import type { SpeciesId } from "#enums/species-id";
import i18next from "i18next";
import { HeldItemEffect, HeldItem } from "../held-item";
import { TrainerItemId } from "#enums/trainer-item-id";

export interface EVO_TRACKER_PARAMS {
  /** The pokemon with the item */
  pokemon: Pokemon;
}

export class EvoTrackerHeldItem extends HeldItem {
  public effects: HeldItemEffect[] = [HeldItemEffect.EVO_TRACKER];

  protected species: SpeciesId;
  protected required: number;
  public isTransferable = false;

  constructor(type: HeldItemId, maxStackCount = 1, species: SpeciesId, required: number) {
    super(type, maxStackCount);
    this.species = species;
    this.required = required;
  }

  /**
   * Applies the {@linkcode EvoTrackerModifier}
   * @returns always `true`
   */
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
