import BattleScene from "#app/battle-scene";
import PartyUiHandler, { PartyUiMode, PartyOption } from "#app/ui/party-ui-handler";
import { Mode } from "#app/ui/ui";
import { BattlePhase } from "./battle-phase";
import { SwitchSummonPhase } from "./switch-summon-phase";
import * as LoggerTools from "../logger";

/**
 * Opens the party selector UI and transitions into a {@linkcode SwitchSummonPhase}
 * for the player (if a switch would be valid for the current battle state).
 */
export class SwitchPhase extends BattlePhase {
  protected fieldIndex: integer;
  private isModal: boolean;
  private doReturn: boolean;

  /**
   * Creates a new SwitchPhase
   * @param scene {@linkcode BattleScene} Current battle scene
   * @param fieldIndex Field index to switch out
   * @param isModal Indicates if the switch should be forced (true) or is
   * optional (false).
   * @param doReturn Indicates if the party member on the field should be
   * recalled to ball or has already left the field. Passed to {@linkcode SwitchSummonPhase}.
   */
  constructor(scene: BattleScene, fieldIndex: integer, isModal: boolean, doReturn: boolean) {
    super(scene);

    this.fieldIndex = fieldIndex;
    this.isModal = isModal;
    this.doReturn = doReturn;
  }

  start() {
    super.start();

    // Skip modal switch if impossible (no remaining party members that aren't in battle)
    if (this.isModal && !this.scene.getParty().filter(p => p.isAllowedInBattle() && !p.isActive(true)).length) {
      LoggerTools.isPreSwitch.value = false;
      LoggerTools.isFaintSwitch.value = false;
      return super.end();
    }

    // Skip if the fainted party member has been revived already. doReturn is
    // only passed as `false` from FaintPhase (as opposed to other usages such
    // as ForceSwitchOutAttr or CheckSwitchPhase), so we only want to check this
    // if the mon should have already been returned but is still alive and well
    // on the field. see also; battle.test.ts
    if (this.isModal && !this.doReturn && !this.scene.getParty()[this.fieldIndex].isFainted()) {
      return super.end();
    }

    // Check if there is any space still in field
    if (this.isModal && this.scene.getPlayerField().filter(p => p.isAllowedInBattle() && p.isActive(true)).length >= this.scene.currentBattle.getBattlerCount()) {
      LoggerTools.isPreSwitch.value = false;
      LoggerTools.isFaintSwitch.value = false;
      return super.end();
    }

    // Override field index to 0 in case of double battle where 2/3 remaining legal party members fainted at once
    const fieldIndex = this.scene.currentBattle.getBattlerCount() === 1 || this.scene.getParty().filter(p => p.isAllowedInBattle()).length > 1 ? this.fieldIndex : 0;

    this.scene.ui.setMode(Mode.PARTY, this.isModal ? PartyUiMode.FAINT_SWITCH : PartyUiMode.POST_BATTLE_SWITCH, fieldIndex, (slotIndex: integer, option: PartyOption) => {
      if (this.isModal) {console.error("Forced Switch Detected")}
      if (slotIndex >= this.scene.currentBattle.getBattlerCount() && slotIndex < 6) {
        if (LoggerTools.isPreSwitch.value) {
          LoggerTools.logActions(this.scene, this.scene.currentBattle.waveIndex, "Pre-switch" + (option == PartyOption.PASS_BATON ? "+ Baton" : "") + " " + LoggerTools.playerPokeName(this.scene, fieldIndex) + " to " + LoggerTools.playerPokeName(this.scene, slotIndex))
        } else if (LoggerTools.isFaintSwitch.value) {
          LoggerTools.logActions(this.scene, this.scene.currentBattle.waveIndex, (option == PartyOption.PASS_BATON ? "Baton" : "Send") + " in " + LoggerTools.playerPokeName(this.scene, slotIndex))
        } else {
          //LoggerTools.Actions[this.scene.getParty()[fieldIndex].getBattlerIndex()] += " to " + LoggerTools.playerPokeName(this.scene, slotIndex)
          LoggerTools.logActions(this.scene, this.scene.currentBattle.waveIndex, `Switch ${LoggerTools.playerPokeName(this.scene, fieldIndex)} to ${LoggerTools.playerPokeName(this.scene, slotIndex)}`)
        }
        this.scene.unshiftPhase(new SwitchSummonPhase(this.scene, fieldIndex, slotIndex, this.doReturn, option === PartyOption.PASS_BATON));
      }
      LoggerTools.isPreSwitch.value = false;
      this.scene.ui.setMode(Mode.MESSAGE).then(() => super.end());
    }, PartyUiHandler.FilterNonFainted);
  }
}
