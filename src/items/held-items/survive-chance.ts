import { globalScene } from "#app/global-scene";
import { getPokemonNameWithAffix } from "#app/messages";
import { HeldItemEffect } from "#enums/held-item-effect";
import { HeldItem } from "#items/held-item";
import type { SurviveChanceParams } from "#types/held-item-parameter";
import i18next from "i18next";

/**
 * Modifier used for held items, namely Toxic Orb and Flame Orb, that apply a
 * set {@linkcode StatusEffect} at the end of a turn.
 * @extends PokemonHeldItemModifier
 * @see {@linkcode apply}
 */
export class SurviveChanceHeldItem extends HeldItem<[typeof HeldItemEffect.SURVIVE_CHANCE]> {
  public readonly effects = [HeldItemEffect.SURVIVE_CHANCE] as const;

  /**
   * Checks if the {@linkcode SurviveDamageModifier} should be applied
   * @param _effect - Unused
   * @param __namedParameters.pokemon - Needed for proper typedoc rendering
   * @returns Whether the
   */
  override shouldApply(
    _effect: typeof HeldItemEffect.SURVIVE_CHANCE,
    { pokemon, surviveDamage }: SurviveChanceParams,
  ): boolean {
    return !surviveDamage.value && pokemon.randBattleSeedInt(10) < pokemon.heldItemManager.getAmount(this.type);
  }

  /**
   * Applies {@linkcode SurviveDamageModifier}
   * @returns `true` if the survive damage has been applied
   */
  apply(_effect: typeof HeldItemEffect.SURVIVE_CHANCE, { pokemon, surviveDamage }: SurviveChanceParams): void {
    surviveDamage.value = true;

    globalScene.phaseManager.queueMessage(
      i18next.t("modifier:surviveDamageApply", {
        pokemonNameWithAffix: getPokemonNameWithAffix(pokemon),
        typeName: this.name,
      }),
    );
  }
}
