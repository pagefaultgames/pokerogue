import { globalScene } from "#app/global-scene";
import { getPokemonNameWithAffix } from "#app/messages";
import { BattleStyle } from "#enums/battle-style";
import { BattlerTagType } from "#enums/battler-tag-type";
import { SwitchType } from "#enums/switch-type";
import { UiMode } from "#enums/ui-mode";
import { BattlePhase } from "#phases/battle-phase";
import { PartyOption, PartyUiMode } from "#ui/party-ui-handler";
import i18next from "i18next";

export class CheckSwitchPhase extends BattlePhase {
  public readonly phaseName = "CheckSwitchPhase";
  protected fieldIndex: number;
  protected useName: boolean;

  constructor(fieldIndex: number, useName: boolean) {
    super();

    this.fieldIndex = fieldIndex;
    this.useName = useName;
  }

  start() {
    super.start();

    const pokemon = globalScene.getPlayerField()[this.fieldIndex];
    const { field, phaseManager, ui } = globalScene;

    // End this phase early...

    // ...if the user is playing in Set Mode
    if (globalScene.battleStyle === BattleStyle.SET) {
      this.end();
      return;
    }

    // ...if the checked Pokemon is somehow not on the field
    if (field.getAll().indexOf(pokemon) === -1) {
      phaseManager.unshiftNew("SummonPhase", pokemon.getBattlerIndex(), { delayPostSummon: true });
      this.end();
      return;
    }

    // ...if there are no other allowed Pokemon in the player's party to switch with
    if (
      globalScene
        .getPlayerParty()
        .slice(1)
        .filter(p => p.isActive()).length === 0
    ) {
      this.end();
      return;
    }

    // ...or if any player Pokemon has an effect that prevents the checked Pokemon from switching
    if (
      pokemon.getTag(BattlerTagType.FRENZY)
      || pokemon.isTrapped()
      || globalScene.getPlayerField().some(p => p.getTag(BattlerTagType.COMMANDED))
    ) {
      this.end();
      return;
    }

    ui.showText(
      i18next.t("battle:switchQuestion", {
        pokemonName: this.useName ? getPokemonNameWithAffix(pokemon) : i18next.t("battle:pokemon"),
      }),
      null,
      () => {
        globalScene.ui.setMode(
          UiMode.CONFIRM,
          () => this.onConfirm(),
          () => this.onCancel(),
        );
      },
    );
  }

  private onConfirm(): void {
    globalScene.ui.setMode(UiMode.PARTY, PartyUiMode.SWITCH, this.fieldIndex, (cursor: number, option: PartyOption) =>
      this.onPartyModeSelection(cursor, option),
    );
  }

  private onCancel(): void {
    globalScene.ui.setMode(UiMode.MESSAGE).then(() => super.end());
  }

  private async onPartyModeSelection(cursor: number, option: PartyOption): Promise<void> {
    // Hitting "cancel" re-starts the prompt
    if (option === PartyOption.CANCEL) {
      await globalScene.ui.setMode(UiMode.MESSAGE);
      this.start();
      return;
    }

    globalScene.phaseManager.unshiftNew("RecallPhase", this.fieldIndex, SwitchType.INITIAL_SWITCH);
    globalScene.phaseManager.unshiftNew("SwitchPhase", this.fieldIndex, SwitchType.INITIAL_SWITCH, cursor);

    await globalScene.ui.setMode(UiMode.MESSAGE);
    this.end();
  }
}
