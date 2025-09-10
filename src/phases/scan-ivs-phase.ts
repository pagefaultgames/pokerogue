import { globalScene } from "#app/global-scene";
import { getPokemonNameWithAffix } from "#app/messages";
import type { BattlerIndex } from "#enums/battler-index";
import { PERMANENT_STATS, Stat } from "#enums/stat";
import { TextStyle } from "#enums/text-style";
import { UiMode } from "#enums/ui-mode";
import { PokemonPhase } from "#phases/pokemon-phase";
import { getTextColor } from "#ui/text";
import i18next from "i18next";

export class ScanIvsPhase extends PokemonPhase {
  public readonly phaseName = "ScanIvsPhase";
  // biome-ignore lint/complexity/noUselessConstructor: This changes `battlerIndex` to be required
  constructor(battlerIndex: BattlerIndex) {
    super(battlerIndex);
  }

  start() {
    super.start();

    const pokemon = this.getPokemon();

    for (const enemy of globalScene.getEnemyField()) {
      const enemyIvs = enemy.ivs;
      // we are using getRootSpeciesId() here because we want to check against the baby form, not the mid form if it exists
      const currentIvs = globalScene.gameData.dexData[enemy.species.getRootSpeciesId()].ivs;
      const statsContainer = enemy.getBattleInfo().getStatsValueContainer().list as Phaser.GameObjects.Sprite[];
      const statsContainerLabels = statsContainer.filter(m => m.name.includes("icon_stat_label"));
      for (const statContainer of statsContainerLabels) {
        const ivStat = Stat[statContainer.frame.name] as Stat;
        if (enemyIvs[ivStat] > currentIvs[ivStat] && PERMANENT_STATS.includes(Number(ivStat))) {
          const hexColour =
            enemyIvs[ivStat] === 31
              ? getTextColor(TextStyle.PERFECT_IV, false)
              : getTextColor(TextStyle.SUMMARY_GREEN, false);
          const hexTextColour = Phaser.Display.Color.HexStringToColor(hexColour).color;
          statContainer.setTint(hexTextColour);
        }
        statContainer.setVisible(true);
      }
    }

    if (globalScene.hideIvs) {
      this.end();
      return;
    }

    globalScene.ui.showText(
      i18next.t("battle:ivScannerUseQuestion", {
        pokemonName: getPokemonNameWithAffix(pokemon),
      }),
      null,
      () => {
        globalScene.ui.setMode(
          UiMode.CONFIRM,
          () => {
            globalScene.ui.setMode(UiMode.MESSAGE);
            globalScene.ui.clearText();
            globalScene.ui
              .getMessageHandler()
              .promptIvs(pokemon.id, pokemon.ivs)
              .then(() => this.end());
          },
          () => {
            globalScene.ui.setMode(UiMode.MESSAGE);
            globalScene.ui.clearText();
            this.end();
          },
        );
      },
    );
  }
}
