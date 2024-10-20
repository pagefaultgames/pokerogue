import Phaser from "phaser";
import BattleScene from "#app/battle-scene";
import { TextStyle, addTextObject } from "#app/ui/text";
import { Mode } from "#app/ui/ui";
import UiHandler from "#app/ui/ui-handler";
import { addWindow } from "#app/ui/ui-theme";
import * as Utils from "#app/utils";
import { DexAttr, GameData } from "#app/system/game-data";
import { speciesStarterCosts } from "#app/data/balance/starters";
import { Button } from "#enums/buttons";
import i18next from "i18next";
import { UiTheme } from "#enums/ui-theme";

interface DisplayStat {
  label_key?: string;
  sourceFunc?: (gameData: GameData) => string;
  hidden?: boolean;
}

interface DisplayStats {
  [key: string]: DisplayStat | string
}

const displayStats: DisplayStats = {
  playTime: {
    label_key: "playTime",
    sourceFunc: gameData => Utils.getPlayTimeString(gameData.gameStats.playTime)
  },
  battles: {
    label_key: "totalBattles",
    sourceFunc: gameData => gameData.gameStats.battles.toString(),
  },
  startersUnlocked: {
    label_key: "starters",
    sourceFunc: gameData => {
      const starterCount = gameData.getStarterCount(d => !!d.caughtAttr);
      return `${starterCount} (${Math.floor((starterCount / Object.keys(speciesStarterCosts).length) * 1000) / 10}%)`;
    }
  },
  shinyStartersUnlocked: {
    label_key: "shinyStarters",
    sourceFunc: gameData => {
      const starterCount = gameData.getStarterCount(d => !!(d.caughtAttr & DexAttr.SHINY));
      return `${starterCount} (${Math.floor((starterCount / Object.keys(speciesStarterCosts).length) * 1000) / 10}%)`;
    }
  },
  dexSeen: {
    label_key: "speciesSeen",
    sourceFunc: gameData => {
      const seenCount = gameData.getSpeciesCount(d => !!d.seenAttr);
      return `${seenCount} (${Math.floor((seenCount / Object.keys(gameData.dexData).length) * 1000) / 10}%)`;
    }
  },
  dexCaught: {
    label_key: "speciesCaught",
    sourceFunc: gameData => {
      const caughtCount = gameData.getSpeciesCount(d => !!d.caughtAttr);
      return `${caughtCount} (${Math.floor((caughtCount / Object.keys(gameData.dexData).length) * 1000) / 10}%)`;
    }
  },
  ribbonsOwned: {
    label_key: "ribbonsOwned",
    sourceFunc: gameData => gameData.gameStats.ribbonsOwned.toString(),
  },
  classicSessionsPlayed:{
    label_key: "classicRuns",
    sourceFunc: gameData => gameData.gameStats.classicSessionsPlayed.toString(),
  },
  sessionsWon: {
    label_key: "classicWins",
    sourceFunc: gameData => gameData.gameStats.sessionsWon.toString(),
  },
  dailyRunSessionsPlayed: {
    label_key: "dailyRunAttempts",
    sourceFunc: gameData => gameData.gameStats.dailyRunSessionsPlayed.toString(),
  },
  dailyRunSessionsWon: {
    label_key: "dailyRunWins",
    sourceFunc: gameData => gameData.gameStats.dailyRunSessionsWon.toString(),
  },
  endlessSessionsPlayed: {
    label_key: "endlessRuns",
    sourceFunc: gameData => gameData.gameStats.endlessSessionsPlayed.toString(),
    hidden: true
  },
  highestEndlessWave: {
    label_key: "highestWaveEndless",
    sourceFunc: gameData => gameData.gameStats.highestEndlessWave.toString(),
    hidden: true
  },
  highestMoney: {
    label_key: "highestMoney",
    sourceFunc: gameData => Utils.formatFancyLargeNumber(gameData.gameStats.highestMoney),
  },
  highestDamage: {
    label_key: "highestDamage",
    sourceFunc: gameData => gameData.gameStats.highestDamage.toString(),
  },
  highestHeal: {
    label_key: "highestHPHealed",
    sourceFunc: gameData => gameData.gameStats.highestHeal.toString(),
  },
  pokemonSeen: {
    label_key: "pokemonEncountered",
    sourceFunc: gameData => gameData.gameStats.pokemonSeen.toString(),
  },
  pokemonDefeated: {
    label_key: "pokemonDefeated",
    sourceFunc: gameData => gameData.gameStats.pokemonDefeated.toString(),
  },
  pokemonCaught: {
    label_key: "pokemonCaught",
    sourceFunc: gameData => gameData.gameStats.pokemonCaught.toString(),
  },
  pokemonHatched: {
    label_key: "eggsHatched",
    sourceFunc: gameData => gameData.gameStats.pokemonHatched.toString(),
  },
  subLegendaryPokemonSeen: {
    label_key: "subLegendsSeen",
    sourceFunc: gameData => gameData.gameStats.subLegendaryPokemonSeen.toString(),
    hidden: true
  },
  subLegendaryPokemonCaught: {
    label_key: "subLegendsCaught",
    sourceFunc: gameData => gameData.gameStats.subLegendaryPokemonCaught.toString(),
    hidden: true
  },
  subLegendaryPokemonHatched: {
    label_key: "subLegendsHatched",
    sourceFunc: gameData => gameData.gameStats.subLegendaryPokemonHatched.toString(),
    hidden: true
  },
  legendaryPokemonSeen: {
    label_key: "legendsSeen",
    sourceFunc: gameData => gameData.gameStats.legendaryPokemonSeen.toString(),
    hidden: true
  },
  legendaryPokemonCaught: {
    label_key: "legendsCaught",
    sourceFunc: gameData => gameData.gameStats.legendaryPokemonCaught.toString(),
    hidden: true
  },
  legendaryPokemonHatched: {
    label_key: "legendsHatched",
    sourceFunc: gameData => gameData.gameStats.legendaryPokemonHatched.toString(),
    hidden: true
  },
  mythicalPokemonSeen: {
    label_key: "mythicalsSeen",
    sourceFunc: gameData => gameData.gameStats.mythicalPokemonSeen.toString(),
    hidden: true
  },
  mythicalPokemonCaught: {
    label_key: "mythicalsCaught",
    sourceFunc: gameData => gameData.gameStats.mythicalPokemonCaught.toString(),
    hidden: true
  },
  mythicalPokemonHatched: {
    label_key: "mythicalsHatched",
    sourceFunc: gameData => gameData.gameStats.mythicalPokemonHatched.toString(),
    hidden: true
  },
  shinyPokemonSeen: {
    label_key: "shiniesSeen",
    sourceFunc: gameData => gameData.gameStats.shinyPokemonSeen.toString(),
    hidden: true
  },
  shinyPokemonCaught: {
    label_key: "shiniesCaught",
    sourceFunc: gameData => gameData.gameStats.shinyPokemonCaught.toString(),
    hidden: true
  },
  shinyPokemonHatched: {
    label_key: "shiniesHatched",
    sourceFunc: gameData => gameData.gameStats.shinyPokemonHatched.toString(),
    hidden: true
  },
  pokemonFused: {
    label_key: "pokemonFused",
    sourceFunc: gameData => gameData.gameStats.pokemonFused.toString(),
    hidden: true
  },
  trainersDefeated: {
    label_key: "trainersDefeated",
    sourceFunc: gameData => gameData.gameStats.trainersDefeated.toString(),
  },
  eggsPulled: {
    label_key: "eggsPulled",
    sourceFunc: gameData => gameData.gameStats.eggsPulled.toString(),
    hidden: true
  },
  rareEggsPulled: {
    label_key: "rareEggsPulled",
    sourceFunc: gameData => gameData.gameStats.rareEggsPulled.toString(),
    hidden: true
  },
  epicEggsPulled: {
    label_key: "epicEggsPulled",
    sourceFunc: gameData => gameData.gameStats.epicEggsPulled.toString(),
    hidden: true
  },
  legendaryEggsPulled: {
    label_key: "legendaryEggsPulled",
    sourceFunc: gameData => gameData.gameStats.legendaryEggsPulled.toString(),
    hidden: true
  },
  manaphyEggsPulled: {
    label_key: "manaphyEggsPulled",
    sourceFunc: gameData => gameData.gameStats.manaphyEggsPulled.toString(),
    hidden: true
  },
};

export default class GameStatsUiHandler extends UiHandler {
  private gameStatsContainer: Phaser.GameObjects.Container;
  private statsContainer: Phaser.GameObjects.Container;

  private statLabels: Phaser.GameObjects.Text[];
  private statValues: Phaser.GameObjects.Text[];

  private arrowUp: Phaser.GameObjects.Sprite;
  private arrowDown: Phaser.GameObjects.Sprite;

  constructor(scene: BattleScene, mode: Mode | null = null) {
    super(scene, mode);

    this.statLabels = [];
    this.statValues = [];
  }

  setup() {
    const ui = this.getUi();

    this.gameStatsContainer = this.scene.add.container(1, -(this.scene.game.canvas.height / 6) + 1);

    this.gameStatsContainer.setInteractive(new Phaser.Geom.Rectangle(0, 0, this.scene.game.canvas.width / 6, this.scene.game.canvas.height / 6), Phaser.Geom.Rectangle.Contains);

    const headerBg = addWindow(this.scene, 0, 0, (this.scene.game.canvas.width / 6) - 2, 24);
    headerBg.setOrigin(0, 0);

    const headerText = addTextObject(this.scene, 0, 0, i18next.t("gameStatsUiHandler:stats"), TextStyle.SETTINGS_LABEL);
    headerText.setOrigin(0, 0);
    headerText.setPositionRelative(headerBg, 8, 4);

    const statsBgWidth = ((this.scene.game.canvas.width / 6) - 2) / 2;
    const [ statsBgLeft, statsBgRight ] = new Array(2).fill(null).map((_, i) => {
      const width = statsBgWidth + 2;
      const height = Math.floor((this.scene.game.canvas.height / 6) - headerBg.height - 2);
      const statsBg = addWindow(this.scene, (statsBgWidth - 2) * i, headerBg.height, width, height, false, false, i > 0 ? -3 : 0, 1);
      statsBg.setOrigin(0, 0);
      return statsBg;
    });

    this.statsContainer = this.scene.add.container(0, 0);


    new Array(18).fill(null).map((_, s) => {

      const statLabel = addTextObject(this.scene, 8 + (s % 2 === 1 ? statsBgWidth : 0), 28 + Math.floor(s / 2) * 16, "", TextStyle.STATS_LABEL);
      statLabel.setOrigin(0, 0);
      this.statsContainer.add(statLabel);
      this.statLabels.push(statLabel);

      const statValue = addTextObject(this.scene, (statsBgWidth * ((s % 2) + 1)) - 8, statLabel.y, "", TextStyle.STATS_VALUE);
      statValue.setOrigin(1, 0);
      this.statsContainer.add(statValue);
      this.statValues.push(statValue);
    });

    this.gameStatsContainer.add(headerBg);
    this.gameStatsContainer.add(headerText);
    this.gameStatsContainer.add(statsBgLeft);
    this.gameStatsContainer.add(statsBgRight);
    this.gameStatsContainer.add(this.statsContainer);

    // arrows to show that we can scroll through the stats
    const isLegacyTheme = this.scene.uiTheme === UiTheme.LEGACY;
    this.arrowDown = this.scene.add.sprite(statsBgWidth, this.scene.game.canvas.height / 6 - (isLegacyTheme ? 9 : 5), "prompt");
    this.gameStatsContainer.add(this.arrowDown);
    this.arrowUp = this.scene.add.sprite(statsBgWidth, headerBg.height + (isLegacyTheme ? 7 : 3), "prompt");
    this.arrowUp.flipY = true;
    this.gameStatsContainer.add(this.arrowUp);

    ui.add(this.gameStatsContainer);

    this.setCursor(0);

    this.gameStatsContainer.setVisible(false);
  }

  show(args: any[]): boolean {
    super.show(args);

    this.setCursor(0);

    this.updateStats();

    this.arrowUp.play("prompt");
    this.arrowDown.play("prompt");
    if (this.scene.uiTheme === UiTheme.LEGACY) {
      this.arrowUp.setTint(0x484848);
      this.arrowDown.setTint(0x484848);
    }

    this.updateArrows();

    this.gameStatsContainer.setVisible(true);

    this.getUi().moveTo(this.gameStatsContainer, this.getUi().length - 1);

    this.getUi().hideTooltip();

    return true;
  }

  updateStats(): void {
    const statKeys = Object.keys(displayStats).slice(this.cursor * 2, this.cursor * 2 + 18);
    statKeys.forEach((key, s) => {
      const stat = displayStats[key] as DisplayStat;
      const value = stat.sourceFunc!(this.scene.gameData); // TODO: is this bang correct?
      this.statLabels[s].setText(!stat.hidden || isNaN(parseInt(value)) || parseInt(value) ? i18next.t(`gameStatsUiHandler:${stat.label_key}`) : "???");
      this.statValues[s].setText(value);
    });
    if (statKeys.length < 18) {
      for (let s = statKeys.length; s < 18; s++) {
        this.statLabels[s].setText("");
        this.statValues[s].setText("");
      }
    }
  }

  /**
   * Show arrows at the top / bottom of the page if it's possible to scroll in that direction
   */
  updateArrows(): void {
    const showUpArrow = this.cursor > 0;
    this.arrowUp.setVisible(showUpArrow);

    const showDownArrow = this.cursor < Math.ceil((Object.keys(displayStats).length - 18) / 2);
    this.arrowDown.setVisible(showDownArrow);
  }

  processInput(button: Button): boolean {
    const ui = this.getUi();

    let success = false;

    if (button === Button.CANCEL) {
      success = true;
      this.scene.ui.revertMode();
    } else {
      switch (button) {
        case Button.UP:
          if (this.cursor) {
            success = this.setCursor(this.cursor - 1);
          }
          break;
        case Button.DOWN:
          if (this.cursor < Math.ceil((Object.keys(displayStats).length - 18) / 2)) {
            success = this.setCursor(this.cursor + 1);
          }
          break;
      }
    }

    if (success) {
      ui.playSelect();
    }

    return success;
  }

  setCursor(cursor: integer): boolean {
    const ret = super.setCursor(cursor);

    if (ret) {
      this.updateStats();
      this.updateArrows();
    }

    return ret;
  }

  clear() {
    super.clear();
    this.gameStatsContainer.setVisible(false);
  }
}

export function initStatsKeys() {
  const statKeys = Object.keys(displayStats);

  for (const key of statKeys) {
    if (typeof displayStats[key] === "string") {
      let label = displayStats[key] as string;
      let hidden = false;
      if (label.endsWith("?")) {
        label = label.slice(0, -1);
        hidden = true;
      }
      displayStats[key] = {
        label_key: label,
        sourceFunc: gameData => gameData.gameStats[key].toString(),
        hidden: hidden
      };
    } else if (displayStats[key] === null) {
      displayStats[key] = {
        sourceFunc: gameData => gameData.gameStats[key].toString()
      };
    }
    if (!(displayStats[key] as DisplayStat).label_key) {
      const splittableKey = key.replace(/([a-z]{2,})([A-Z]{1}(?:[^A-Z]|$))/g, "$1_$2");
      (displayStats[key] as DisplayStat).label_key = Utils.toReadableString(`${splittableKey[0].toUpperCase()}${splittableKey.slice(1)}`);
    }
  }
}
