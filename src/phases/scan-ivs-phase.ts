import { globalScene } from "#app/global-scene";
import { settings } from "#app/global-settings-manager";
import { getPokemonNameWithAffix } from "#app/messages";
import type { BattlerIndex } from "#enums/battler-index";
import { PERMANENT_STATS, type PermanentStat, Stat } from "#enums/stat";
import { TextStyle } from "#enums/text-style";
import { UiMode } from "#enums/ui-mode";
import { PokemonPhase } from "#phases/pokemon-phase";
import type { ConfirmModeConfig } from "#types/ui-types";
import { getTextColor } from "#ui/text";
import i18next from "i18next";

export class ScanIvsPhase extends PokemonPhase {
  public readonly phaseName = "ScanIvsPhase";

  // biome-ignore lint/complexity/noUselessConstructor: This changes `battlerIndex` to be required
  constructor(battlerIndex: BattlerIndex) {
    super(battlerIndex);
  }

  public override start(): void {
    super.start();

    const { gameData, ui } = globalScene;

    const pokemon = this.getPokemon();

    for (const enemy of globalScene.getEnemyField()) {
      const enemyIvs = enemy.ivs;
      // we are using getRootSpeciesId() here because we want to check against the baby form, not the mid form if it exists
      const currentIvs = gameData.dexData[enemy.species.getRootSpeciesId()].ivs;
      const statsContainer = enemy.getBattleInfo().getStatsValueContainer().list as Phaser.GameObjects.Sprite[];
      const statsContainerLabels = statsContainer.filter(m => m.name.includes("icon_stat_label"));
      for (const statContainer of statsContainerLabels) {
        const ivStat = Stat[statContainer.frame.name] as PermanentStat;
        // TODO: is this `Number()` even needed?
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

    if (settings.general.hideIvScanner) {
      this.end();
      return;
    }

    ui.showText(
      i18next.t("battle:ivScannerUseQuestion", { pokemonName: getPokemonNameWithAffix(pokemon) }),
      null,
      () => {
        const options: ConfirmModeConfig = {
          yesHandler: () => {
            ui.setMode(UiMode.MESSAGE);
            ui.clearText();
            ui.getMessageHandler()
              .promptIvs(pokemon.id, pokemon.ivs)
              .then(() => this.end());
          },
          noHandler: () => {
            ui.setMode(UiMode.MESSAGE);
            ui.clearText();
            this.end();
          },
        };
        ui.setMode(UiMode.CONFIRM, options);
      },
    );
  }
}
