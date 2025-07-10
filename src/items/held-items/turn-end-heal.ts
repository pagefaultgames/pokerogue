import type Pokemon from "#app/field/pokemon";
import { globalScene } from "#app/global-scene";
import i18next from "i18next";
import { HeldItemEffect, HeldItem } from "#app/items/held-item";
import { PokemonHealPhase } from "#app/phases/pokemon-heal-phase";
import { toDmgValue } from "#app/utils/common";
import { getPokemonNameWithAffix } from "#app/messages";

export interface TurnEndHealParams {
  /** The pokemon with the item */
  pokemon: Pokemon;
}

export class TurnEndHealHeldItem extends HeldItem {
  public effects: HeldItemEffect[] = [HeldItemEffect.TURN_END_HEAL];

  apply(params: TurnEndHealParams): boolean {
    const pokemon = params.pokemon;
    const stackCount = pokemon.heldItemManager.getStack(this.type);
    if (pokemon.isFullHp()) {
      return false;
    }
    globalScene.phaseManager.unshiftPhase(
      new PokemonHealPhase(
        pokemon.getBattlerIndex(),
        toDmgValue(pokemon.getMaxHp() / 16) * stackCount,
        i18next.t("modifier:turnHealApply", {
          pokemonNameWithAffix: getPokemonNameWithAffix(pokemon),
          typeName: this.name,
        }),
        true,
      ),
    );
    return true;
  }
}
