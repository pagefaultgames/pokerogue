import type Pokemon from "#app/field/pokemon";
import { globalScene } from "#app/global-scene";
import { HeldItemId } from "#enums/held-item-id";
import type { SpeciesId } from "#enums/species-id";
import i18next from "i18next";
import { HeldItem, HELD_ITEM_EFFECT } from "../held-item";

export interface EVO_TRACKER_PARAMS {
  /** The pokemon with the item */
  pokemon: Pokemon;
}

export class EvoTrackerHeldItem extends HeldItem {
  public effects: HELD_ITEM_EFFECT[] = [HELD_ITEM_EFFECT.EVO_TRACKER];

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

  getIconStackText(pokemon: Pokemon): Phaser.GameObjects.BitmapText | null {
    const stackCount = this.getFullCount(pokemon);

    const text = globalScene.add.bitmapText(10, 15, "item-count", stackCount.toString(), 11);
    text.letterSpacing = -0.5;
    if (stackCount >= this.required) {
      text.setTint(0xf89890);
    }
    text.setOrigin(0, 0);

    return text;
  }

  getFullCount(pokemon: Pokemon): number {
    return pokemon.heldItemManager.getStack(this.type);
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
    const stackCount = pokemon.heldItemManager.getStack(this.type);
    +pokemon.heldItemManager.getStack(HeldItemId.GOLDEN_PUNCH) +
      globalScene.findModifiers(
        m => m.is("MoneyMultiplierModifier") || m.is("ExtraModifierModifier") || m.is("TempExtraModifierModifier"),
      ).length;
    return stackCount;
  }
}
