import type Pokemon from "#app/field/pokemon";
import { globalScene } from "#app/global-scene";
import { getPokemonNameWithAffix } from "#app/messages";
import type { BooleanHolder } from "#app/utils/common";
import { Command } from "#enums/command";
import { HeldItem, HeldItemEffect } from "#items/held-item";
import i18next from "i18next";

export interface BypassSpeedChanceParams {
  /** The pokemon with the item */
  pokemon: Pokemon;
  doBypassSpeed: BooleanHolder;
}

/**
 * Modifier used for held items, namely Toxic Orb and Flame Orb, that apply a
 * set {@linkcode StatusEffect} at the end of a turn.
 * @extends PokemonHeldItemModifier
 * @see {@linkcode apply}
 */
export class BypassSpeedChanceHeldItem extends HeldItem {
  public effects: HeldItemEffect[] = [HeldItemEffect.BYPASS_SPEED_CHANCE];

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
   * @param pokemon the {@linkcode Pokemon} that holds the item
   * @param doBypassSpeed {@linkcode BooleanHolder} that is `true` if speed should be bypassed
   * @returns `true` if {@linkcode BypassSpeedChanceModifier} has been applied
   */
  apply(params: BypassSpeedChanceParams): boolean {
    const pokemon = params.pokemon;
    const doBypassSpeed = params.doBypassSpeed;
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
