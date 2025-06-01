import { HeldItemNames, HeldItems } from "#enums/held-items";
import { PokemonType } from "#enums/pokemon-type";
import i18next from "i18next";
import type { NumberHolder } from "#app/utils/common";
import type Pokemon from "#app/field/pokemon";
import { HeldItem, ITEM_EFFECT } from "#app/items/held-item";

export interface ATTACK_TYPE_BOOST_PARAMS {
  /** The pokemon with the item */
  pokemon: Pokemon;
  /** The resolved type of the move */
  moveType: PokemonType;
  /** Holder for the damage value */
  movePower: NumberHolder;
}

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
  public effects: ITEM_EFFECT[] = [ITEM_EFFECT.TURN_END_HEAL];
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

  apply(params: ATTACK_TYPE_BOOST_PARAMS): void {
    const pokemon = params.pokemon;
    const moveType = params.moveType;
    const movePower = params.movePower;
    const stackCount = pokemon.heldItemManager.getStack(this.type);
    if (moveType === this.moveType && movePower.value >= 1) {
      movePower.value = Math.floor(movePower.value * (1 + stackCount * this.powerBoost));
    }
  }
}
