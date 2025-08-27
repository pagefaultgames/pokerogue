import { globalScene } from "#app/global-scene";
import { getPokemonNameWithAffix } from "#app/messages";
import { HeldItemEffect } from "#enums/held-item-effect";
import { HeldItem } from "#items/held-item";
import type { TurnEndHealParams } from "#items/held-item-parameter";
import { PokemonHealPhase } from "#phases/pokemon-heal-phase";
import { toDmgValue } from "#utils/common";
import i18next from "i18next";

export class TurnEndHealHeldItem extends HeldItem<[typeof HeldItemEffect.TURN_END_HEAL]> {
  public readonly effects = [HeldItemEffect.TURN_END_HEAL] as const;

  apply(_effect: typeof HeldItemEffect.TURN_END_HEAL, { pokemon }: TurnEndHealParams): boolean {
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
