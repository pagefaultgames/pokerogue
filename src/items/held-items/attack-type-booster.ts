import { HeldItemEffect } from "#enums/held-item-effect";
import { HeldItemId, HeldItemNames } from "#enums/held-item-id";
import { PokemonType } from "#enums/pokemon-type";
import type { Pokemon } from "#field/pokemon";
import { HeldItem } from "#items/held-item";
import type { NumberHolder } from "#utils/common";
import i18next from "i18next";

export interface AttackTypeBoostParams {
  /** The pokemon with the item */
  pokemon: Pokemon;
  /** The resolved type of the move */
  moveType: PokemonType;
  /** Holder for the damage value */
  // TODO: https://github.com/pagefaultgames/pokerogue/pull/5656#discussion_r2119660807
  movePower: NumberHolder;
}

type AttackTypeToHeldItemMap = Record<Exclude<PokemonType, PokemonType.UNKNOWN | PokemonType.STELLAR>, HeldItemId>;

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
  public effects: HeldItemEffect[] = [HeldItemEffect.TURN_END_HEAL];
  public moveType: PokemonType;
  public powerBoost: number;

  // This constructor may need a revision
  constructor(type: HeldItemId, maxStackCount: number, moveType: PokemonType, powerBoost: number) {
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

  apply({ pokemon, moveType, movePower }: AttackTypeBoostParams): void {
    const stackCount = pokemon.heldItemManager.getStack(this.type);
    if (moveType === this.moveType && movePower.value >= 1) {
      movePower.value = Math.floor(movePower.value * (1 + stackCount * this.powerBoost));
    }
  }
}
