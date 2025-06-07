import type Pokemon from "#app/field/pokemon";
import { HeldItem, ITEM_EFFECT } from "#app/items/held-item";
import type { BooleanHolder } from "#app/utils/common";
import { globalScene } from "#app/global-scene";
import i18next from "i18next";
import { getPokemonNameWithAffix } from "#app/messages";

export interface SURVIVE_CHANCE_PARAMS {
  /** The pokemon with the item */
  pokemon: Pokemon;
  surviveDamage: BooleanHolder;
}

/**
 * Modifier used for held items, namely Toxic Orb and Flame Orb, that apply a
 * set {@linkcode StatusEffect} at the end of a turn.
 * @extends PokemonHeldItemModifier
 * @see {@linkcode apply}
 */
export class SurviveChanceHeldItem extends HeldItem {
  public effects: ITEM_EFFECT[] = [ITEM_EFFECT.SURVIVE_CHANCE];

  /**
   * Checks if the {@linkcode SurviveDamageModifier} should be applied
   * @param pokemon the {@linkcode Pokemon} that holds the item
   * @param surviveDamage {@linkcode BooleanHolder} that holds the survive damage
   * @returns `true` if the {@linkcode SurviveDamageModifier} should be applied
   */
  //  override shouldApply(pokemon?: Pokemon, surviveDamage?: BooleanHolder): boolean {
  //    return super.shouldApply(pokemon, surviveDamage) && !!surviveDamage;
  //  }

  /**
   * Applies {@linkcode SurviveDamageModifier}
   * @param pokemon the {@linkcode Pokemon} that holds the item
   * @param surviveDamage {@linkcode BooleanHolder} that holds the survive damage
   * @returns `true` if the survive damage has been applied
   */
  apply(params: SURVIVE_CHANCE_PARAMS): boolean {
    const pokemon = params.pokemon;
    const surviveDamage = params.surviveDamage;
    const stackCount = pokemon.heldItemManager.getStack(this.type);
    if (!surviveDamage.value && pokemon.randBattleSeedInt(10) < stackCount) {
      surviveDamage.value = true;

      globalScene.queueMessage(
        i18next.t("modifier:surviveDamageApply", {
          pokemonNameWithAffix: getPokemonNameWithAffix(pokemon),
          typeName: this.name,
        }),
      );
      return true;
    }

    return false;
  }
}
