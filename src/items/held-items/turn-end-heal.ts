import { globalScene } from "#app/global-scene";
import { getPokemonNameWithAffix } from "#app/messages";
import { HeldItemEffect } from "#enums/held-item-effect";
import { HeldItem } from "#items/held-item";
import { PokemonHealPhase } from "#phases/pokemon-heal-phase";
import type { TurnEndHealParams } from "#types/held-item-parameter";
import { toDmgValue } from "#utils/common";
import i18next from "i18next";

export class TurnEndHealHeldItem extends HeldItem<[typeof HeldItemEffect.TURN_END_HEAL]> {
  public readonly effects = [HeldItemEffect.TURN_END_HEAL] as const;

  override shouldApply(_effect: typeof HeldItemEffect.TURN_END_HEAL, { pokemon }: TurnEndHealParams): boolean {
    return !pokemon.isFullHp();
  }

  apply(_effect: typeof HeldItemEffect.TURN_END_HEAL, { pokemon }: TurnEndHealParams): void {
    const stackCount = pokemon.heldItemManager.getStack(this.type);
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
  }
}
