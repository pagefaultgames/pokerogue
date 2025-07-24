import { globalScene } from "#app/global-scene";
import { getPokemonNameWithAffix } from "#app/messages";
import { HeldItemEffect } from "#enums/held-item-effect";
import type { Pokemon } from "#field/pokemon";
import { HeldItem } from "#items/held-item";
import { PokemonHealPhase } from "#phases/pokemon-heal-phase";
import { toDmgValue } from "#utils/common";
import i18next from "i18next";

export interface TurnEndHealParams {
  /** The pokemon with the item */
  pokemon: Pokemon;
}

export class TurnEndHealHeldItem extends HeldItem {
  public effects: HeldItemEffect[] = [HeldItemEffect.TURN_END_HEAL];

  apply({ pokemon }: TurnEndHealParams): boolean {
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
