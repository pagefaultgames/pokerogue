import { globalScene } from "#app/global-scene";
import { getPokemonNameWithAffix } from "#app/messages";
import { Command } from "#enums/command";
import { HeldItemEffect } from "#enums/held-item-effect";
import { HeldItem } from "#items/held-item";
import type { BypassSpeedChanceParams } from "#types/held-item-parameter";
import i18next from "i18next";

/**
 * Modifier used for items that allow a Pokémon to bypass the speed chance (Quick Claw).
 */
export class BypassSpeedChanceHeldItem extends HeldItem<[typeof HeldItemEffect.BYPASS_SPEED_CHANCE]> {
  public readonly effects = [HeldItemEffect.BYPASS_SPEED_CHANCE] as const;

  override shouldApply(
    _effect: typeof HeldItemEffect.BYPASS_SPEED_CHANCE,
    { pokemon, doBypassSpeed }: BypassSpeedChanceParams,
  ): boolean {
    const stackCount = pokemon.heldItemManager.getStack(this.type);
    return !doBypassSpeed.value && pokemon.randBattleSeedInt(10) < stackCount;
  }

  apply(_effect: typeof HeldItemEffect.BYPASS_SPEED_CHANCE, { pokemon, doBypassSpeed }: BypassSpeedChanceParams): void {
    // TODO: Fix this to be consistent with Dean's PR
    doBypassSpeed.value = true;
    const isCommandFight = globalScene.currentBattle.turnCommands[pokemon.getBattlerIndex()]?.command === Command.FIGHT;

    if (isCommandFight) {
      globalScene.phaseManager.queueMessage(
        i18next.t("modifier:bypassSpeedChanceApply", {
          pokemonName: getPokemonNameWithAffix(pokemon),
          itemName: this.name,
        }),
      );
    }
  }
}
