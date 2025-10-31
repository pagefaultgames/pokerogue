import { HeldItemEffect } from "#enums/held-item-effect";
import { HeldItemId, HeldItemNames } from "#enums/held-item-id";
import { PokemonType } from "#enums/pokemon-type";
import { HeldItem } from "#items/held-item";
import type { AttackTypeBoostParams } from "#types/held-item-parameter";
import i18next from "i18next";

export const attackTypeToHeldItem = {
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
} as const;

export class AttackTypeBoosterHeldItem extends HeldItem<[typeof HeldItemEffect.ATTACK_TYPE_BOOST]> {
  public readonly effects = [HeldItemEffect.ATTACK_TYPE_BOOST] as const;
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

  public override shouldApply(
    _effect: typeof HeldItemEffect.ATTACK_TYPE_BOOST,
    { moveType, movePower }: AttackTypeBoostParams,
  ): boolean {
    // TODO: Investigate why there's a check against movePower being less than 1
    return moveType === this.moveType && movePower.value >= 1;
  }

  public override apply(
    _effect: typeof HeldItemEffect.ATTACK_TYPE_BOOST,
    { pokemon, movePower }: AttackTypeBoostParams,
  ): void {
    const stackCount = pokemon.heldItemManager.getStack(this.type);
    movePower.value = Math.floor(movePower.value * (1 + stackCount * this.powerBoost));
  }
}
