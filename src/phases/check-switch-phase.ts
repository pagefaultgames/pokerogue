import { globalScene } from "#app/battle-scene";
import { BattleStyle } from "#app/enums/battle-style";
import { BattlerTagType } from "#app/enums/battler-tag-type";
import { getPokemonNameWithAffix } from "#app/messages";
import { Mode } from "#app/ui/ui";
import i18next from "i18next";
import { BattlePhase } from "./battle-phase";
import { PostSummonPhase } from "./post-summon-phase";
import { SummonMissingPhase } from "./summon-missing-phase";
import { SwitchPhase } from "./switch-phase";
import { SwitchType } from "#enums/switch-type";

export class CheckSwitchPhase extends BattlePhase {
  protected fieldIndex: integer;
  protected useName: boolean;

  constructor(fieldIndex: integer, useName: boolean) {
    super();

    this.fieldIndex = fieldIndex;
    this.useName = useName;
  }

  start() {
    super.start();

    const pokemon = globalScene.getPlayerField()[this.fieldIndex];

    if (globalScene.battleStyle === BattleStyle.SET) {
      super.end();
      return;
    }

    if (globalScene.field.getAll().indexOf(pokemon) === -1) {
      globalScene.unshiftPhase(new SummonMissingPhase(this.fieldIndex));
      super.end();
      return;
    }

    if (!globalScene.getParty().slice(1).filter(p => p.isActive()).length) {
      super.end();
      return;
    }

    if (pokemon.getTag(BattlerTagType.FRENZY)) {
      super.end();
      return;
    }

    globalScene.ui.showText(i18next.t("battle:switchQuestion", { pokemonName: this.useName ? getPokemonNameWithAffix(pokemon) : i18next.t("battle:pokemon") }), null, () => {
      globalScene.ui.setMode(Mode.CONFIRM, () => {
        globalScene.ui.setMode(Mode.MESSAGE);
        globalScene.tryRemovePhase(p => p instanceof PostSummonPhase && p.player && p.fieldIndex === this.fieldIndex);
        globalScene.unshiftPhase(new SwitchPhase(SwitchType.INITIAL_SWITCH, this.fieldIndex, false, true));
        this.end();
      }, () => {
        globalScene.ui.setMode(Mode.MESSAGE);
        this.end();
      });
    });
  }
}
