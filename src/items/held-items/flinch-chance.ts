import type Pokemon from "#app/field/pokemon";
import { HeldItemEffect, HeldItem } from "#app/items/held-item";
import type { BooleanHolder } from "#app/utils/common";
import type { HeldItemId } from "#enums/held-item-id";

export interface FlinchChanceParams {
  /** The pokemon with the item */
  pokemon: Pokemon;
  flinched: BooleanHolder;
}

/**
 * Modifier used for held items, namely Toxic Orb and Flame Orb, that apply a
 * set {@linkcode StatusEffect} at the end of a turn.
 * @extends PokemonHeldItemModifier
 * @see {@linkcode apply}
 */
export class FlinchChanceHeldItem extends HeldItem {
  public effects: HeldItemEffect[] = [HeldItemEffect.FLINCH_CHANCE];
  private chance: number;

  constructor(type: HeldItemId, maxStackCount: number, chance: number) {
    super(type, maxStackCount);

    this.chance = chance; // 10
  }

  /**
   * Checks if {@linkcode FlinchChanceModifier} should be applied
   * @param pokemon the {@linkcode Pokemon} that holds the item
   * @param flinched {@linkcode BooleanHolder} that is `true` if the pokemon flinched
   * @returns `true` if {@linkcode FlinchChanceModifier} should be applied
   */
  //  override shouldApply(pokemon?: Pokemon, flinched?: BooleanHolder): boolean {
  //    return super.shouldApply(pokemon, flinched) && !!flinched;
  //  }

  /**
   * Applies {@linkcode FlinchChanceModifier} to randomly flinch targets hit.
   * @param pokemon - The {@linkcode Pokemon} that holds the item
   * @param flinched - A {@linkcode BooleanHolder} holding whether the pokemon has flinched
   * @returns `true` if {@linkcode FlinchChanceModifier} was applied successfully
   */
  apply(params: FlinchChanceParams): boolean {
    const pokemon = params.pokemon;
    const flinched = params.flinched;
    const stackCount = pokemon.heldItemManager.getStack(this.type);
    // The check for pokemon.summonData is to ensure that a crash doesn't occur when a Pokemon with King's Rock procs a flinch
    // TODO: Since summonData is always defined now, we can probably remove this
    if (pokemon.summonData && !flinched.value && pokemon.randBattleSeedInt(100) < stackCount * this.chance) {
      flinched.value = true;
      return true;
    }

    return false;
  }
}
