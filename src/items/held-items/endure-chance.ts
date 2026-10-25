import { globalScene } from "#app/global-scene";
import { getPokemonNameWithAffix } from "#app/messages";
import { HeldItemEffect } from "#enums/held-item-effect";
import { HeldItemAttr } from "#items/held-item-attr";
import type { EndureChanceParams } from "#types/held-item-parameter";
import i18next from "i18next";

/**
 * Class used for items that provide a chance to survive otherwise-fatal damage.
 * @see {@link https://bulbapedia.bulbagarden.net/wiki/Focus_Band}
 * @sealed
 */
export class EndureChanceHeldItemAttr extends HeldItemAttr<typeof HeldItemEffect.ENDURE_CHANCE> {
  public override readonly effect = HeldItemEffect.ENDURE_CHANCE;

  public override shouldApply({ pokemon, endure }: EndureChanceParams): boolean {
    return !endure.value && pokemon.randBattleSeedInt(10) < pokemon.heldItemManager.getStack(this.type);
  }

  public override apply({ pokemon, endure }: EndureChanceParams): void {
    endure.value = true;

    globalScene.phaseManager.queueMessage(
      i18next.t("itemApply:surviveDamageApply", {
        pokemonNameWithAffix: getPokemonNameWithAffix(pokemon),
        typeName: this.item.name,
      }),
    );
  }
}
