import { HeldItemEffect } from "#enums/held-item-effect";
import { HeldItemId } from "#enums/held-item-id";
import { PokemonType, type RegularPokemonType } from "#enums/pokemon-type";
import { HeldItemAttr } from "#items/held-item-attr";
import type { AttackTypeBoostParams } from "#types/held-item-parameter";

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
} as const satisfies Record<RegularPokemonType, HeldItemId>;

export class AttackTypeBoostHeldItemAttr extends HeldItemAttr<typeof HeldItemEffect.ATTACK_TYPE_BOOST> {
  public override readonly effect = HeldItemEffect.ATTACK_TYPE_BOOST;
  public readonly moveType: PokemonType;
  public readonly powerBoost: number;

  constructor(moveType: PokemonType, powerBoost: number) {
    super();
    this.moveType = moveType;
    this.powerBoost = powerBoost;
  }

  public override shouldApply({ moveType, movePower }: AttackTypeBoostParams): boolean {
    // TODO: Investigate why there's a check against movePower being less than 1
    return moveType === this.moveType && movePower.value >= 1;
  }

  public override apply({ pokemon, movePower }: AttackTypeBoostParams): void {
    // TODO: Don't round this
    const stackCount = pokemon.heldItemManager.getStack(this.type);
    movePower.value = Math.floor(movePower.value * (1 + stackCount * this.powerBoost));
  }
}
