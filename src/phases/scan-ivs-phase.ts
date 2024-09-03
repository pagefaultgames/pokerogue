import BattleScene from "#app/battle-scene.js";
import { BattlerIndex } from "#app/battle.js";
import { CommonBattleAnim, CommonAnim } from "#app/data/battle-anims.js";
import { Stat } from "#app/enums/stat.js";
import { getPokemonNameWithAffix } from "#app/messages.js";
import { getTextColor, TextStyle } from "#app/ui/text.js";
import { Mode } from "#app/ui/ui.js";
import i18next from "i18next";
import { PokemonPhase } from "./pokemon-phase";

export class ScanIvsPhase extends PokemonPhase {
  private shownIvs: integer;

  constructor(scene: BattleScene, battlerIndex: BattlerIndex, shownIvs: integer) {
    super(scene, battlerIndex);

    this.shownIvs = shownIvs;
  }

  start() {
    super.start();

    if (!this.shownIvs) {
      return this.end();
    }

    const pokemon = this.getPokemon();

    let enemyIvs: number[] = [];
    let statsContainer: Phaser.GameObjects.Sprite[] = [];
    let statsContainerLabels: Phaser.GameObjects.Sprite[] = [];
    const enemyField = this.scene.getEnemyField();
    const uiTheme = (this.scene as BattleScene).uiTheme; // Assuming uiTheme is accessible
    for (let e = 0; e < enemyField.length; e++) {
      enemyIvs = enemyField[e].ivs;
      const currentIvs = this.scene.gameData.dexData[enemyField[e].species.getRootSpeciesId()].ivs;  // we are using getRootSpeciesId() here because we want to check against the baby form, not the mid form if it exists
      const ivsToShow = this.scene.ui.getMessageHandler().getTopIvs(enemyIvs, this.shownIvs);
      statsContainer = enemyField[e].getBattleInfo().getStatsValueContainer().list as Phaser.GameObjects.Sprite[];
      statsContainerLabels = statsContainer.filter(m => m.name.indexOf("icon_stat_label") >= 0);
      for (let s = 0; s < statsContainerLabels.length; s++) {
        const ivStat = Stat[statsContainerLabels[s].frame.name];
        if (enemyIvs[ivStat] > currentIvs[ivStat] && ivsToShow.indexOf(Number(ivStat)) >= 0) {
          const hexColour = enemyIvs[ivStat] === 31 ? getTextColor(TextStyle.PERFECT_IV, false, uiTheme) : getTextColor(TextStyle.SUMMARY_GREEN, false, uiTheme);
          const hexTextColour = Phaser.Display.Color.HexStringToColor(hexColour).color;
          statsContainerLabels[s].setTint(hexTextColour);
        }
        statsContainerLabels[s].setVisible(true);
      }
    }

    if (!this.scene.hideIvs) {
      this.scene.ui.showText(i18next.t("battle:ivScannerUseQuestion", { pokemonName: getPokemonNameWithAffix(pokemon) }), null, () => {
        this.scene.ui.setMode(Mode.CONFIRM, () => {
          this.scene.ui.setMode(Mode.MESSAGE);
          this.scene.ui.clearText();
          new CommonBattleAnim(CommonAnim.LOCK_ON, pokemon, pokemon).play(this.scene, () => {
            this.scene.ui.getMessageHandler().promptIvs(pokemon.id, pokemon.ivs, this.shownIvs).then(() => this.end());
          });
        }, () => {
          this.scene.ui.setMode(Mode.MESSAGE);
          this.scene.ui.clearText();
          this.end();
        });
      });
    } else {
      this.end();
    }
  }
}
