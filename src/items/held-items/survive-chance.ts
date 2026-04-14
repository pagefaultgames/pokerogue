import { globalScene } from "#app/global-scene";
import { getPokemonNameWithAffix } from "#app/messages";
import { HeldItemEffect } from "#enums/held-item-effect";
import { HeldItem } from "#items/held-item";
import type { SurviveChanceParams } from "#types/held-item-parameter";
import i18next from "i18next";

/**
 * Class used for items that provide a chance to survive otherwise-fatal damage.
 * Used by Focus Band.
 * @sealed
 */
// TODO: Rename to "endure chance" for clarity
export class SurviveChanceHeldItem extends HeldItem<[typeof HeldItemEffect.SURVIVE_CHANCE]> {
  public readonly effects = [HeldItemEffect.SURVIVE_CHANCE] as const;

  public override shouldApply(
    _effect: typeof HeldItemEffect.SURVIVE_CHANCE,
    { pokemon, surviveDamage }: SurviveChanceParams,
  ): boolean {
    return !surviveDamage.value && pokemon.randBattleSeedInt(10) < pokemon.heldItemManager.getStack(this.type);
  }

  public override apply(
    _effect: typeof HeldItemEffect.SURVIVE_CHANCE,
    { pokemon, surviveDamage }: SurviveChanceParams,
  ): void {
    surviveDamage.value = true;

    globalScene.phaseManager.queueMessage(
      i18next.t("modifier:surviveDamageApply", {
        pokemonNameWithAffix: getPokemonNameWithAffix(pokemon),
        typeName: this.name,
      }),
    );
  }
}
