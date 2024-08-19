import BattleScene from "#app/battle-scene.js";
import { BattleStyle } from "#app/enums/battle-style.js";
import { BattlerTagType } from "#app/enums/battler-tag-type.js";
import { getPokemonNameWithAffix } from "#app/messages.js";
import { Mode } from "#app/ui/ui.js";
import i18next from "i18next";
import { BattlePhase } from "./battle-phase";
import { PostSummonPhase } from "./post-summon-phase";
import { SummonMissingPhase } from "./summon-missing-phase";
import { SwitchPhase } from "./switch-phase";

export class CheckSwitchPhase extends BattlePhase {
  protected fieldIndex: integer;
  protected useName: boolean;

  constructor(scene: BattleScene, fieldIndex: integer, useName: boolean) {
    super(scene);

    this.fieldIndex = fieldIndex;
    this.useName = useName;
  }

  start() {
    super.start();

    const pokemon = this.scene.getPlayerField()[this.fieldIndex];

    if (this.scene.battleStyle === BattleStyle.SET) {
      super.end();
      return;
    }

    if (this.scene.field.getAll().indexOf(pokemon) === -1) {
      this.scene.unshiftPhase(new SummonMissingPhase(this.scene, this.fieldIndex));
      super.end();
      return;
    }

    if (!this.scene.getParty().slice(1).filter(p => p.isActive()).length) {
      super.end();
      return;
    }

    if (pokemon.getTag(BattlerTagType.FRENZY)) {
      super.end();
      return;
    }

    this.scene.ui.showText(i18next.t("battle:switchQuestion", { pokemonName: this.useName ? getPokemonNameWithAffix(pokemon) : i18next.t("battle:pokemon") }), null, () => {
      this.scene.ui.setMode(Mode.CONFIRM, () => {
        this.scene.ui.setMode(Mode.MESSAGE);
        this.scene.tryRemovePhase(p => p instanceof PostSummonPhase && p.player && p.fieldIndex === this.fieldIndex);
        this.scene.unshiftPhase(new SwitchPhase(this.scene, this.fieldIndex, false, true));
        this.end();
      }, () => {
        this.scene.ui.setMode(Mode.MESSAGE);
        this.end();
      });
    });
  }
}
