import { HeldItemNames, HeldItemId } from "#enums/held-item-id";
import { PokemonType } from "#enums/pokemon-type";
import i18next from "i18next";
import type { NumberHolder } from "#app/utils/common";
import type Pokemon from "#app/field/pokemon";
import { HeldItem, HELD_ITEM_EFFECT } from "#app/items/held-item";

export interface ATTACK_TYPE_BOOST_PARAMS {
  /** The pokemon with the item */
  pokemon: Pokemon;
  /** The resolved type of the move */
  moveType: PokemonType;
  /** Holder for the damage value */
  movePower: NumberHolder;
}

interface AttackTypeToHeldItemMap {
  [key: number]: HeldItemId;
}

export const attackTypeToHeldItem: AttackTypeToHeldItemMap = {
  [PokemonType.NORMAL]: HeldItemId.SILK_SCARF,
  [PokemonType.FIGHTING]: HeldItemId.BLACK_BELT,
  [PokemonType.FLYING]: HeldItemId.SHARP_BEAK,
  [PokemonType.POISON]: HeldItemId.POISON_BARB,
  [PokemonType.GROUND]: HeldItemId.SOFT_SAND,
  [PokemonType.ROCK]: HeldItemId.HARD_STONE,
  [PokemonType.BUG]: HeldItemId.SILVER_POWDER,
  [PokemonType.GHOST]: HeldItemId.SPELL_TAG,
  [PokemonType.STEEL]: HeldItemId.METAL_COAT,
  [PokemonType.FIRE]: HeldItemId.CHARCOAL,
  [PokemonType.WATER]: HeldItemId.MYSTIC_WATER,
  [PokemonType.GRASS]: HeldItemId.MIRACLE_SEED,
  [PokemonType.ELECTRIC]: HeldItemId.MAGNET,
  [PokemonType.PSYCHIC]: HeldItemId.TWISTED_SPOON,
  [PokemonType.ICE]: HeldItemId.NEVER_MELT_ICE,
  [PokemonType.DRAGON]: HeldItemId.DRAGON_FANG,
  [PokemonType.DARK]: HeldItemId.BLACK_GLASSES,
  [PokemonType.FAIRY]: HeldItemId.FAIRY_FEATHER,
};

export class AttackTypeBoosterHeldItem extends HeldItem {
  public effects: HELD_ITEM_EFFECT[] = [HELD_ITEM_EFFECT.TURN_END_HEAL];
  public moveType: PokemonType;
  public powerBoost: number;

  // This constructor may need a revision
  constructor(type: HeldItemId, maxStackCount = 1, moveType: PokemonType, powerBoost: number) {
    super(type, maxStackCount);
    this.moveType = moveType;
    this.powerBoost = powerBoost;
  }

  get name(): string {
    return i18next.t(`modifierType:AttackTypeBoosterItem.${HeldItemNames[this.type]?.toLowerCase()}`);
  }

  get description(): string {
    return i18next.t("modifierType:ModifierType.AttackTypeBoosterModifierType.description", {
      moveType: i18next.t(`pokemonInfo:Type.${PokemonType[this.moveType]}`),
    });
  }

  get iconName(): string {
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
