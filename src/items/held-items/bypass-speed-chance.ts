import { globalScene } from "#app/global-scene";
import { getPokemonNameWithAffix } from "#app/messages";
import { BattlerTagType } from "#enums/battler-tag-type";
import { Command } from "#enums/command";
import { HeldItemEffect } from "#enums/held-item-effect";
import { HeldItemAttr } from "#items/held-item-attr";
import type { BypassSpeedChanceParams } from "#types/held-item-parameter";
import i18next from "i18next";

/**
 * Attribute used for items that allow a Pokémon to randomly move first in their priority bracket.
 * @see {@link https://bulbapedia.bulbagarden.net/wiki/Quick_Claw}
 * @sealed
 */
export class BypassSpeedChanceHeldItemAttr extends HeldItemAttr<typeof HeldItemEffect.BYPASS_SPEED_CHANCE> {
  public override readonly effect = HeldItemEffect.BYPASS_SPEED_CHANCE;

  public override shouldApply({ pokemon }: BypassSpeedChanceParams): boolean {
    const stackCount = pokemon.heldItemManager.getStack(this.type);
    return pokemon.randBattleSeedInt(10) < stackCount;
  }

  public override apply({ pokemon }: BypassSpeedChanceParams): void {
    pokemon.addTag(BattlerTagType.BYPASS_SPEED);

    const isCommandFight = globalScene.currentBattle.turnCommands[pokemon.getBattlerIndex()]?.command === Command.FIGHT;
    if (isCommandFight) {
      // TODO: Remove the `itemName` parameter
      globalScene.phaseManager.queueMessage(
        i18next.t("itemApply:bypassSpeedChanceApply", {
          pokemonName: getPokemonNameWithAffix(pokemon),
          itemName: this.item.name,
        }),
      );
    }
  }
}
