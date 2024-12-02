import BattleScene from "#app/battle-scene";
import { BattleStyle } from "#app/enums/battle-style";
import { BattlerTagType } from "#app/enums/battler-tag-type";
import { getPokemonNameWithAffix } from "#app/messages";
import { Mode } from "#app/ui/ui";
import i18next from "i18next";
import { BattlePhase } from "./battle-phase";
import { SummonMissingPhase } from "./summon-missing-phase";
import { SwitchPhase } from "./switch-phase";
import { SwitchType } from "#enums/switch-type";

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

    // End this phase early...

    // ...if the user is playing in Set Mode
    if (this.scene.battleStyle === BattleStyle.SET) {
      return super.end();
    }

    // ...if the checked Pokemon is somehow not on the field
    if (this.scene.field.getAll().indexOf(pokemon) === -1) {
      this.scene.unshiftPhase(new SummonMissingPhase(this.scene, this.fieldIndex));
      return super.end();
    }

    // ...if there are no other allowed Pokemon in the player's party to switch with
    if (!this.scene.getPlayerParty().slice(1).filter(p => p.isActive()).length) {
      return super.end();
    }

    // ...or if any player Pokemon has an effect that prevents the checked Pokemon from switching
    if (pokemon.getTag(BattlerTagType.FRENZY)
        || pokemon.isTrapped()
        || this.scene.getPlayerField().some(p => p.getTag(BattlerTagType.COMMANDED))) {
      return super.end();
    }

    this.scene.ui.showText(i18next.t("battle:switchQuestion", { pokemonName: this.useName ? getPokemonNameWithAffix(pokemon) : i18next.t("battle:pokemon") }), null, () => {
      this.scene.ui.setMode(Mode.CONFIRM, () => {
        this.scene.ui.setMode(Mode.MESSAGE);
        this.scene.unshiftPhase(new SwitchPhase(this.scene, SwitchType.INITIAL_SWITCH, this.fieldIndex, false, true));
        this.end();
      }, () => {
        this.scene.ui.setMode(Mode.MESSAGE);
        this.end();
      });
    });
  }
}
