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

  /**
   * Checks if {@linkcode BypassSpeedChanceModifier} should be applied
   * @param pokemon the {@linkcode Pokemon} that holds the item
   * @param doBypassSpeed {@linkcode BooleanHolder} that is `true` if speed should be bypassed
   * @returns `true` if {@linkcode BypassSpeedChanceModifier} should be applied
   */
  //  override shouldApply(pokemon?: Pokemon, doBypassSpeed?: BooleanHolder): boolean {
  //    return super.shouldApply(pokemon, doBypassSpeed) && !!doBypassSpeed;
  //  }

  /**
   * Applies {@linkcode BypassSpeedChanceModifier}
   * @returns `true` if {@linkcode BypassSpeedChanceModifier} has been applied
   */
  apply(
    _effect: typeof HeldItemEffect.BYPASS_SPEED_CHANCE,
    { pokemon, doBypassSpeed }: BypassSpeedChanceParams,
  ): boolean {
    // TODO: Fix this to be consistent with Dean's PR
    const stackCount = pokemon.heldItemManager.getStack(this.type);
    if (!doBypassSpeed.value && pokemon.randBattleSeedInt(10) < stackCount) {
      doBypassSpeed.value = true;
      const isCommandFight =
        globalScene.currentBattle.turnCommands[pokemon.getBattlerIndex()]?.command === Command.FIGHT;

      if (isCommandFight) {
        globalScene.phaseManager.queueMessage(
          i18next.t("modifier:bypassSpeedChanceApply", {
            pokemonName: getPokemonNameWithAffix(pokemon),
            itemName: this.name,
          }),
        );
      }
      return true;
    }

    return false;
  }
}
