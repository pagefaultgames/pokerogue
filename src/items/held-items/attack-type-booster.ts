import { HeldItemNames, HeldItems } from "#enums/held-items";
import { PokemonType } from "#enums/pokemon-type";
import i18next from "i18next";
import type { NumberHolder } from "#app/utils/common";
import type Pokemon from "#app/field/pokemon";
import { HeldItem } from "#app/items/held-item";
import { allHeldItems } from "../all-held-items";

interface AttackTypeToHeldItemMap {
  [key: number]: HeldItems;
}

export const attackTypeToHeldItem: AttackTypeToHeldItemMap = {
  [PokemonType.NORMAL]: HeldItems.SILK_SCARF,
  [PokemonType.FIGHTING]: HeldItems.BLACK_BELT,
  [PokemonType.FLYING]: HeldItems.SHARP_BEAK,
  [PokemonType.POISON]: HeldItems.POISON_BARB,
  [PokemonType.GROUND]: HeldItems.SOFT_SAND,
  [PokemonType.ROCK]: HeldItems.HARD_STONE,
  [PokemonType.BUG]: HeldItems.SILVER_POWDER,
  [PokemonType.GHOST]: HeldItems.SPELL_TAG,
  [PokemonType.STEEL]: HeldItems.METAL_COAT,
  [PokemonType.FIRE]: HeldItems.CHARCOAL,
  [PokemonType.WATER]: HeldItems.MYSTIC_WATER,
  [PokemonType.GRASS]: HeldItems.MIRACLE_SEED,
  [PokemonType.ELECTRIC]: HeldItems.MAGNET,
  [PokemonType.PSYCHIC]: HeldItems.TWISTED_SPOON,
  [PokemonType.ICE]: HeldItems.NEVER_MELT_ICE,
  [PokemonType.DRAGON]: HeldItems.DRAGON_FANG,
  [PokemonType.DARK]: HeldItems.BLACK_GLASSES,
  [PokemonType.FAIRY]: HeldItems.FAIRY_FEATHER,
};

export class AttackTypeBoosterHeldItem extends HeldItem {
  public moveType: PokemonType;
  public powerBoost: number;

  constructor(type: HeldItems, maxStackCount = 1, moveType: PokemonType, powerBoost: number) {
    super(type, maxStackCount);
    this.moveType = moveType;
    this.powerBoost = powerBoost;
  }

  getName(): string {
    return i18next.t(`modifierType:AttackTypeBoosterItem.${HeldItemNames[this.type]?.toLowerCase()}`);
  }

  getDescription(): string {
    return i18next.t("modifierType:ModifierType.AttackTypeBoosterModifierType.description", {
      moveType: i18next.t(`pokemonInfo:Type.${PokemonType[this.moveType]}`),
    });
  }

  getIcon(): string {
    return `${HeldItemNames[this.type]?.toLowerCase()}`;
  }

  apply(stackCount: number, moveType: PokemonType, movePower: NumberHolder): void {
    if (moveType === this.moveType && movePower.value >= 1) {
      movePower.value = Math.floor(movePower.value * (1 + stackCount * this.powerBoost));
    }
  }
}

export function applyAttackTypeBoosterHeldItem(pokemon: Pokemon, moveType: PokemonType, movePower: NumberHolder) {
  if (pokemon) {
    for (const [item, props] of Object.entries(pokemon.heldItemManager.getHeldItems())) {
      if (allHeldItems[item] instanceof AttackTypeBoosterHeldItem) {
        allHeldItems[item].apply(props.stack, moveType, movePower);
      }
    }
  }
}
