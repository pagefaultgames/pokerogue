import { globalScene } from "#app/global-scene";
import { getPokemonNameWithAffix } from "#app/messages";
import { HeldItemEffect } from "#enums/held-item-effect";
import { HeldItemAttr } from "#items/held-item-attr";
import { PokemonHealPhase } from "#phases/pokemon-heal-phase";
import type { TurnEndHealParams } from "#types/held-item-parameter";
import { toDmgValue } from "#utils/common";
import i18next from "i18next";

/**
 * Class used for items that heal the holder at the end of each turn.
 * @see {@link https://bulbapedia.bulbagarden.net/wiki/Leftovers}
 * @sealed
 */
export class TurnEndHealHeldItemAttr extends HeldItemAttr<typeof HeldItemEffect.TURN_END_HEAL> {
  public override readonly effect = HeldItemEffect.TURN_END_HEAL;

  public override shouldApply({ pokemon }: TurnEndHealParams): boolean {
    return !pokemon.isFullHp();
  }

  public override apply({ pokemon }: TurnEndHealParams): void {
    const stackCount = pokemon.heldItemManager.getStack(this.type);
    globalScene.phaseManager.unshiftPhase(
      new PokemonHealPhase(
        pokemon.getBattlerIndex(),
        toDmgValue(pokemon.getMaxHp() / 16) * stackCount,
        i18next.t("modifier:turnHealApply", {
          pokemonNameWithAffix: getPokemonNameWithAffix(pokemon),
          // TODO: consider removing the parameter
          typeName: this.item.name,
        }),
        true,
      ),
    );
  }
}
