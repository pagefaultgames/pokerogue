import { SwitchType } from "#enums/switch-type";
import { globalScene } from "#app/global-scene";
import type { PartyOption } from "#app/ui/party-ui-handler";
import PartyUiHandler, { PartyUiMode } from "#app/ui/party-ui-handler";
import { Mode } from "#app/ui/ui";
import i18next from "i18next";
import * as Utils from "#app/utils";
import { BattlePhase } from "#app/phases/battle-phase";
import { SwitchSummonPhase } from "#app/phases/switch-summon-phase";
import { ToggleDoublePositionPhase } from "#app/phases/toggle-double-position-phase";
import type { PlayerPokemon } from "#app/field/pokemon";

/**
 * Sets the Party UI and handles the effect of Revival Blessing
 * when used by one of the player's Pokemon.
 */
export class RevivalBlessingPhase extends BattlePhase {
  constructor(protected user: PlayerPokemon) {
    super();
  }

  public override start(): void {
    globalScene.ui.setMode(
      Mode.PARTY,
      PartyUiMode.REVIVAL_BLESSING,
      this.user.getFieldIndex(),
      (slotIndex: integer, option: PartyOption) => {
        if (slotIndex >= 0 && slotIndex < 6) {
          const pokemon = globalScene.getPlayerParty()[slotIndex];
          if (!pokemon || !pokemon.isFainted()) {
            return this.end();
          }

          pokemon.resetTurnData();
          pokemon.resetStatus();
          pokemon.heal(Math.min(Utils.toDmgValue(0.5 * pokemon.getMaxHp()), pokemon.getMaxHp()));
          globalScene.queueMessage(i18next.t("moveTriggers:revivalBlessing", { pokemonName: pokemon.name }), 0, true);

          if (globalScene.currentBattle.double && globalScene.getPlayerParty().length > 1) {
            const allyPokemon = this.user.getAlly();
            if (slotIndex <= 1) {
              // Revived ally pokemon
              globalScene.unshiftPhase(
                new SwitchSummonPhase(SwitchType.SWITCH, pokemon.getFieldIndex(), slotIndex, false, true),
              );
              globalScene.unshiftPhase(new ToggleDoublePositionPhase(true));
            } else if (allyPokemon.isFainted()) {
              // Revived party pokemon, and ally pokemon is fainted
              globalScene.unshiftPhase(
                new SwitchSummonPhase(SwitchType.SWITCH, allyPokemon.getFieldIndex(), slotIndex, false, true),
              );
              globalScene.unshiftPhase(new ToggleDoublePositionPhase(true));
            }
          }
        }
        globalScene.ui.setMode(Mode.MESSAGE).then(() => this.end());
      },
      PartyUiHandler.FilterFainted,
    );
  }
}
