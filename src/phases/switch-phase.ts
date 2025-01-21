import { globalScene } from "#app/global-scene";
import PartyUiHandler, { PartyOption, PartyUiMode } from "#app/ui/party-ui-handler";
import { Mode } from "#app/ui/ui";
import { SwitchType } from "#enums/switch-type";
import { BattlePhase } from "./battle-phase";
import { PostSummonPhase } from "./post-summon-phase";
import { SwitchSummonPhase } from "./switch-summon-phase";

/**
 * Opens the party selector UI and transitions into a {@linkcode SwitchSummonPhase}
 * for the player (if a switch would be valid for the current battle state).
 */
export class SwitchPhase extends BattlePhase {
  protected readonly fieldIndex: integer;
  private readonly switchType: SwitchType;
  private readonly isModal: boolean;
  private readonly doReturn: boolean;

  /**
     * Creates a new SwitchPhase
     * @param switchType {@linkcode SwitchType} The type of switch logic this phase implements
     * @param fieldIndex Field index to switch out
     * @param isModal Indicates if the switch should be forced (true) or is
     * optional (false).
     * @param doReturn Indicates if the party member on the field should be
     * recalled to ball or has already left the field. Passed to {@linkcode SwitchSummonPhase}.
     */
  constructor(switchType: SwitchType, fieldIndex: integer, isModal: boolean, doReturn: boolean) {
    super();

    this.switchType = switchType;
    this.fieldIndex = fieldIndex;
    this.isModal = isModal;
    this.doReturn = doReturn;
  }

  start() {
    super.start();

    // Skip modal switch if impossible (no remaining party members that aren't in battle)
    if (this.isModal && !globalScene.getPlayerParty().filter(p => p.isAllowedInBattle() && !p.isActive(true)).length) {
      return super.end();
    }

    /**
     * Skip if the fainted party member has been revived already. doReturn is
     * only passed as `false` from FaintPhase (as opposed to other usages such
     * as ForceSwitchOutAttr or CheckSwitchPhase), so we only want to check this
     * if the mon should have already been returned but is still alive and well
     * on the field. see also; battle.test.ts
     */
    if (this.isModal && !this.doReturn && !globalScene.getPlayerParty()[this.fieldIndex].isFainted()) {
      return super.end();
    }

    // Check if there is any space still in field
    if (this.isModal && globalScene.getPlayerField().filter(p => p.isAllowedInBattle() && p.isActive(true)).length >= globalScene.currentBattle.getBattlerCount()) {
      return super.end();
    }

    // Override field index to 0 in case of double battle where 2/3 remaining legal party members fainted at once
    const fieldIndex = globalScene.currentBattle.getBattlerCount() === 1 || globalScene.getPokemonAllowedInBattle().length > 1 ? this.fieldIndex : 0;

    globalScene.ui.setMode(Mode.PARTY, this.isModal ? PartyUiMode.FAINT_SWITCH : PartyUiMode.POST_BATTLE_SWITCH, fieldIndex, (slotIndex: integer, option: PartyOption) => {
      if (slotIndex >= globalScene.currentBattle.getBattlerCount() && slotIndex < 6) {
        // Remove any pre-existing PostSummonPhase under the same field index.
        // Pre-existing PostSummonPhases may occur when this phase is invoked during a prompt to switch at the start of a wave.
        globalScene.tryRemovePhase(p => p instanceof PostSummonPhase && p.player && p.fieldIndex === this.fieldIndex);
        const switchType = (option === PartyOption.PASS_BATON) ? SwitchType.BATON_PASS : this.switchType;
        globalScene.unshiftPhase(new SwitchSummonPhase(switchType, fieldIndex, slotIndex, this.doReturn));
      }
      globalScene.ui.setMode(Mode.MESSAGE).then(() => super.end());
    }, PartyUiHandler.FilterNonFainted);
  }
}
