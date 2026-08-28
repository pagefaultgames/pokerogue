import { globalScene } from "#app/global-scene";
import { getPokemonNameWithAffix } from "#app/messages";
import { HeldItemEffect } from "#enums/held-item-effect";
import { HeldItemAttr } from "#items/held-item-attr";
import type { SurviveChanceParams } from "#types/held-item-parameter";
import i18next from "i18next";

/**
 * Class used for items that provide a chance to survive otherwise-fatal damage.
 * @see {@link https://bulbapedia.bulbagarden.net/wiki/Focus_Band}
 * @sealed
 */
// TODO: Rename to "endure chance" for clarity
export class SurviveChanceHeldItemAttr extends HeldItemAttr<typeof HeldItemEffect.SURVIVE_CHANCE> {
  public override readonly effect = HeldItemEffect.SURVIVE_CHANCE;

  public override shouldApply({ pokemon, surviveDamage }: SurviveChanceParams): boolean {
    return !surviveDamage.value && pokemon.randBattleSeedInt(10) < pokemon.heldItemManager.getStack(this.type);
  }

  public override apply({ pokemon, surviveDamage }: SurviveChanceParams): void {
    surviveDamage.value = true;

    globalScene.phaseManager.queueMessage(
      i18next.t("itemApply:surviveDamageApply", {
        pokemonNameWithAffix: getPokemonNameWithAffix(pokemon),
        typeName: this.item.name,
      }),
    );
  }
}
