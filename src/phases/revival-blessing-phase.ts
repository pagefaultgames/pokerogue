import { SwitchType } from "#enums/switch-type";
import { globalScene } from "#app/global-scene";
import type { PartyOption } from "#app/ui/party-ui-handler";
import PartyUiHandler, { PartyUiMode } from "#app/ui/party-ui-handler";
import { UiMode } from "#enums/ui-mode";
import i18next from "i18next";
import { toDmgValue, isNullOrUndefined } from "#app/utils/common";
import { BattlePhase } from "#app/phases/battle-phase";
import type { PlayerPokemon } from "#app/field/pokemon";

/**
 * Sets the Party UI and handles the effect of Revival Blessing
 * when used by one of the player's Pokemon.
 */
export class RevivalBlessingPhase extends BattlePhase {
  public readonly phaseName = "RevivalBlessingPhase";
  constructor(protected user: PlayerPokemon) {
    super();
  }

  public override start(): void {
    globalScene.ui.setMode(
      UiMode.PARTY,
      PartyUiMode.REVIVAL_BLESSING,
      this.user.getFieldIndex(),
      (slotIndex: number, _option: PartyOption) => {
        if (slotIndex >= 0 && slotIndex < 6) {
          const pokemon = globalScene.getPlayerParty()[slotIndex];
          if (!pokemon || !pokemon.isFainted()) {
            return this.end();
          }

          pokemon.resetTurnData();
          pokemon.resetStatus(true, false, false, false);
          pokemon.heal(Math.min(toDmgValue(0.5 * pokemon.getMaxHp()), pokemon.getMaxHp()));
          globalScene.phaseManager.queueMessage(
            i18next.t("moveTriggers:revivalBlessing", {
              pokemonName: pokemon.name,
            }),
            0,
            true,
          );

          const allyPokemon = this.user.getAlly();
          if (
            globalScene.currentBattle.double &&
            globalScene.getPlayerParty().length > 1 &&
            !isNullOrUndefined(allyPokemon)
          ) {
            if (slotIndex <= 1) {
              // Revived ally pokemon
              globalScene.phaseManager.unshiftNew(
                "SwitchSummonPhase",
                SwitchType.SWITCH,
                pokemon.getFieldIndex(),
                slotIndex,
                false,
                true,
              );
              globalScene.phaseManager.unshiftNew("ToggleDoublePositionPhase", true);
            } else if (allyPokemon.isFainted()) {
              // Revived party pokemon, and ally pokemon is fainted
              globalScene.phaseManager.unshiftNew(
                "SwitchSummonPhase",
                SwitchType.SWITCH,
                allyPokemon.getFieldIndex(),
                slotIndex,
                false,
                true,
              );
              globalScene.phaseManager.unshiftNew("ToggleDoublePositionPhase", true);
            }
          }
        }
        globalScene.ui.setMode(UiMode.MESSAGE).then(() => this.end());
      },
      PartyUiHandler.FilterFainted,
    );
  }
}
