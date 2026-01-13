import { globalScene } from "#app/global-scene";
import { getPokemonNameWithAffix } from "#app/messages";
import { BattleStyle } from "#enums/battle-style";
import { BattleType } from "#enums/battle-type";
import { BattlerTagType } from "#enums/battler-tag-type";
import { SwitchType } from "#enums/switch-type";
import { UiMode } from "#enums/ui-mode";
import { BattlePhase } from "#phases/battle-phase";
import { PartyOption, PartyUiMode } from "#ui/party-ui-handler";
import i18next from "i18next";

/**
 * Phase handling asking the player to switch Pokemon at the start of a battle.
 *
 * If the prompt is confirmed, the corresponding Pokemon will be {@linkcode RecallPhase | recalled}
 * and the selected replacement {@linkcode SwitchPhase | switched in}.
 * If the prompt is denied or the conditions for it to appear are not met, a {@linkcode PostSummonPhase}
 * will be queued to trigger on-summon abilities and similar effects.
 */
export class CheckSwitchPhase extends BattlePhase {
  public readonly phaseName = "CheckSwitchPhase";
  /** The index of this Pokemon on the player field. */
  protected fieldIndex: number;

  constructor(fieldIndex: number) {
    super();

    this.fieldIndex = fieldIndex;
  }

  start() {
    super.start();

    const pokemon = globalScene.getPlayerField()[this.fieldIndex];
    const { field, battleStyle } = globalScene;

    // End this phase early...

    // ...if the user is playing in Set Mode
    if (battleStyle === BattleStyle.SET) {
      this.end();
      return;
    }

    // ... if the battle type is ineligible
    if (!this.checkBattleType()) {
      this.end();
      return;
    }

    // ...if the checked Pokemon is somehow not on the field
    // TODO: Do we need this check anymore?
    if (!field.getAll().includes(pokemon)) {
      this.end();
      return;
    }

    // ...if there are no other allowed Pokemon in the player's party to switch with
    if (
      globalScene
        .getPlayerParty()
        .slice(1)
        .every(p => !p.isActive())
    ) {
      this.end();
      return;
    }

    // ...or if the target Pokemon has an effect that prevents the checked Pokemon from switching
    if (
      pokemon.getTag(BattlerTagType.FRENZY)
      || pokemon.isTrapped()
      || globalScene.getPlayerField().some(p => p.getTag(BattlerTagType.COMMANDED))
    ) {
      this.end();
      return;
    }

    this.showSwitchPrompt();
  }

  private checkBattleType(): boolean {
    const { double, battleType, waveIndex } = globalScene.currentBattle;
    const availablePartyMembers = globalScene.getPokemonAllowedInBattle().length;
    const minPartySize = double ? 2 : 1;

    // NB: The ME phase check is still handled elsewhere, so we simply need to check the conditions
    // formerly in `TitlePhase`.
    return (
      availablePartyMembers > minPartySize
      && battleType !== BattleType.TRAINER
      && (waveIndex > 1 || !globalScene.gameMode.isDaily)
    );
  }

  /**
   * Show a message prompting the user to leave the field.
   */
  private showSwitchPrompt(): void {
    const { double } = globalScene.currentBattle;
    const pokemon = globalScene.getPlayerField()[this.fieldIndex];
    globalScene.ui.showText(
      i18next.t("battle:switchQuestion", {
        pokemonName: double ? getPokemonNameWithAffix(pokemon) : i18next.t("battle:pokemon"),
      }),
      null,
      () => {
        globalScene.ui.setMode(UiMode.CONFIRM, this.onConfirm, this.onDeny);
      },
    );
  }

  private onConfirm(): void {
    globalScene.ui.setMode(UiMode.PARTY, PartyUiMode.SWITCH, this.fieldIndex, (cursor: number, option: PartyOption) =>
      this.onPartyModeSelection(cursor, option),
    );
  }

  private async onPartyModeSelection(cursor: number, option: PartyOption): Promise<void> {
    // Hitting "cancel" re-starts the prompt
    if (option === PartyOption.CANCEL) {
      await globalScene.ui.setMode(UiMode.MESSAGE);
      return this.showSwitchPrompt();
    }

    globalScene.phaseManager.queueBattlerSwitchOut(this.fieldIndex, {
      switchType: SwitchType.INITIAL_SWITCH,
      switchInIndex: cursor,
    });

    await globalScene.ui.setMode(UiMode.MESSAGE);
    this.end(true);
  }

  /**
   * End the phase upon denying the switch prompt.
   */
  private async onDeny(): Promise<void> {
    await globalScene.ui.setMode(UiMode.MESSAGE);
    this.end();
  }

  /**
   * @param success - Whether the switch out prompt was accepted; default `false`
   */
  public override end(success?: true): void {
    if (!success) {
      globalScene.phaseManager.pushNew("PostSummonPhase", this.fieldIndex);
    }
    super.end();
  }
}
