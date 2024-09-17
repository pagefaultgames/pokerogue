import BattleScene from "#app/battle-scene";
import PartyUiHandler, { PartyUiMode, PartyOption } from "#app/ui/party-ui-handler";
import { Mode } from "#app/ui/ui";
import { BattlePhase } from "./battle-phase";
import { SwitchSummonPhase } from "./switch-summon-phase";

/**
 * Opens the party selector UI and transitions into a {@linkcode SwitchSummonPhase}
 * for the player (if a switch would be valid for the current battle state).
 */
export class SwitchPhase extends BattlePhase {
  protected fieldIndex: integer;
  private switchReason: "faint" | "moveEffect" | "switchMode";
  private doReturn: boolean;

  /**
     * Creates a new SwitchPhase
     * @param scene {@linkcode BattleScene} Current battle scene
     * @param fieldIndex Field index to switch out
   * @param switchReason Indicates why this switch is occurring. The valid options are
   * `'faint'` (party member fainted), `'moveEffect'` (uturn, baton pass, dragon
   * tail, etc), and `'switchMode'` (start-of-battle optional switch). This
   * helps the phase determine both if the switch should be cancellable by the
   * user, as well as determine if the party UI should be shown at all.
   * @param doReturn Indicates if this switch should call back the pokemon at
   * the {@linkcode fieldIndex} (true), or if the mon has already been recalled
   * (false).
   */
  constructor(scene: BattleScene, fieldIndex: integer, switchReason: "faint" | "moveEffect" | "switchMode", doReturn: boolean) {
    super(scene);

    this.fieldIndex = fieldIndex;
    this.switchReason = switchReason;
    this.doReturn = doReturn;
  }

  start() {
    super.start();

    const isForcedSwitch = this.switchReason !== "switchMode";

    // Skip forced switch if impossible (no remaining party members that aren't in battle)
    if (isForcedSwitch && !this.scene.getParty().filter(p => p.isAllowedInBattle() && !p.isActive(true)).length) {
      return super.end();
    }

    // Skip if the fainted party member has been revived already. see also; battle.test.ts
    if (this.switchReason === "faint" && !this.scene.getParty()[this.fieldIndex].isFainted()) {
      return super.end();
    }

    // Check if there is any space still in field
    const numActiveBattlers = this.scene.getPlayerField().filter(p => p.isAllowedInBattle() && p.isActive(true)).length;
    const willReturnModifer = (this.doReturn ? 1 : 0); // need to subtract this if doReturn is true, because the pokemon in the given index hasn't left the field yet. (used for volt switch + pursuit, etc)
    if (isForcedSwitch && numActiveBattlers - willReturnModifer >= this.scene.currentBattle.getBattlerCount()) {
      return super.end();
    }

    // Override field index to 0 in case of double battle where 2/3 remaining legal party members fainted at once
    const fieldIndex = this.scene.currentBattle.getBattlerCount() === 1 || this.scene.getParty().filter(p => p.isAllowedInBattle()).length > 1 ? this.fieldIndex : 0;

    this.scene.ui.setMode(Mode.PARTY, isForcedSwitch ? PartyUiMode.FAINT_SWITCH : PartyUiMode.POST_BATTLE_SWITCH, fieldIndex, (slotIndex: integer, option: PartyOption) => {
      if (slotIndex >= this.scene.currentBattle.getBattlerCount() && slotIndex < 6) {
        this.scene.unshiftPhase(new SwitchSummonPhase(this.scene, fieldIndex, slotIndex, this.doReturn, option === PartyOption.PASS_BATON));
      }
      this.scene.ui.setMode(Mode.MESSAGE).then(() => super.end());
    }, PartyUiHandler.FilterNonFainted);
  }
}
