import Phaser from "phaser";
import BattleScene from "../battle-scene";
import { EndRunStatsPhase } from "../phases";
import { PlayerPokemon } from "../field/pokemon";
import { TextStyle, addTextObject } from "./text";
import { Mode } from "./ui";
import UiHandler from "./ui-handler";
import { addWindow } from "./ui-theme";
import { Button } from "../enums/buttons";
import i18next from "../plugins/i18n";
import { formatLargeNumber } from "../utils";

interface DisplayStat {
  labelKey?: string;
  rightPaddingPx: integer;
  setupFunc: (scene: BattleScene, x: integer, y: integer) => Phaser.GameObjects.Sprite | Phaser.GameObjects.Text;
  sourceFunc: (element: Phaser.GameObjects.Sprite | Phaser.GameObjects.Text, pokemon: PlayerPokemon) => void;
}

const defaultTextSetupFunc = (scene, x, y) => {
  const text = addTextObject(scene, x, y, "", TextStyle.TOOLTIP_CONTENT);
  text.setOrigin(0, 0);
  return text;
};

const displayStats: DisplayStat[] = [
  {
    rightPaddingPx: 4,
    setupFunc: (scene, x, y) => {
      const spriteIcon = scene.add.sprite(x, y, "pkmn__sub");
      spriteIcon.setOrigin(0, 0.25);
      spriteIcon.setScale(0.5);
      spriteIcon.setPipeline(scene.spritePipeline, { tone: [ 0.0, 0.0, 0.0, 0.0 ], ignoreTimeTint: true });
      return spriteIcon;
    },
    sourceFunc: (element, pokemon) => {
      element.setTexture(pokemon.getIconAtlasKey());
      element.setFrame(pokemon.getIconId());
    }
  },
  {
    labelKey: "pokemonName",
    rightPaddingPx: 8,
    setupFunc: defaultTextSetupFunc,
    sourceFunc: (element, pokemon) => {
      element.setText(pokemon.name.trim());
    }
  },
  {
    labelKey: "level",
    rightPaddingPx: 8,
    setupFunc: defaultTextSetupFunc,
    sourceFunc: (element, pokemon) => {
      element.setText(formatLargeNumber(pokemon.level, 100000));
    }
  },
  {
    labelKey: "metOnWave",
    rightPaddingPx: 8,
    setupFunc: defaultTextSetupFunc,
    sourceFunc: (element, pokemon) => {
      element.setText(pokemon.metWave !== 0 ? pokemon.metWave : i18next.t("runStatsUiHandler:starter"));
    }
  },
  {
    labelKey: "kills",
    rightPaddingPx: 8,
    setupFunc: defaultTextSetupFunc,
    sourceFunc: (element, pokemon) => {
      element.setText(formatLargeNumber(pokemon.runData.kills, 100000));
    }
  },
  {
    labelKey: "assists",
    rightPaddingPx: 8,
    setupFunc: defaultTextSetupFunc,
    sourceFunc: (element, pokemon) => {
      element.setText(formatLargeNumber(pokemon.runData.assists, 100000));
    }
  },
  {
    labelKey: "deaths",
    rightPaddingPx: 8,
    setupFunc: defaultTextSetupFunc,
    sourceFunc: (element, pokemon) => {
      element.setText(formatLargeNumber(pokemon.runData.deaths, 100000));
    }
  },
  {
    labelKey: "damageDealt",
    rightPaddingPx: 8,
    setupFunc: defaultTextSetupFunc,
    sourceFunc: (element, pokemon) => {
      element.setText(formatLargeNumber(pokemon.runData.damageDealt, 100000));
    }
  },
  {
    labelKey: "damageTaken",
    rightPaddingPx: 8,
    setupFunc: defaultTextSetupFunc,
    sourceFunc: (element, pokemon) => {
      element.setText(formatLargeNumber(pokemon.runData.damageTaken, 100000));
    }
  },
];

export default class RunStatsUiHandler extends UiHandler {
  private runStatsContainer: Phaser.GameObjects.Container;
  private statsContainer: Phaser.GameObjects.Container;

  private statLabels: Phaser.GameObjects.Text[];
  private statValues: (Phaser.GameObjects.Sprite | Phaser.GameObjects.Text)[][];

  constructor(scene: BattleScene, mode?: Mode) {
    super(scene, mode);

    this.statLabels = new Array(displayStats.length);
    this.statValues = new Array(6).fill(undefined).map(x => Array(displayStats.length).fill(undefined));
  }

  setup() {
    const ui = this.getUi();

    this.runStatsContainer = this.scene.add.container(1, -(this.scene.game.canvas.height / 6) + 1);

    this.runStatsContainer.setInteractive(new Phaser.Geom.Rectangle(0, 0, this.scene.game.canvas.width / 6, this.scene.game.canvas.height / 6), Phaser.Geom.Rectangle.Contains);

    const headerBg = addWindow(this.scene, 0, 0, (this.scene.game.canvas.width / 6) - 2, 24);
    headerBg.setOrigin(0, 0);

    const headerText = addTextObject(this.scene, 0, 0, i18next.t("runStatsUiHandler:stats"), TextStyle.SETTINGS_LABEL);
    headerText.setOrigin(0, 0);
    headerText.setPositionRelative(headerBg, 8, 4);

    const statsBgWidth = ((this.scene.game.canvas.width / 6) - 2);
    const statsBg = addWindow(this.scene, 0, headerBg.height, statsBgWidth, (this.scene.game.canvas.height / 6) - headerBg.height - 2, false, false, 2);
    statsBg.setOrigin(0, 0);

    this.statsContainer = this.scene.add.container(0, 0);

    for (let row = 0; row < 6+1; ++row) {
      for (let col = 0; col < displayStats.length; ++col) {
        // x values are computed later
        const y = 30 + (row * 16);

        if (row === 0) {
          const statLabelKey = displayStats[col].labelKey;
          const statLabel = addTextObject(this.scene, 0, y, statLabelKey ? i18next.t(`runStatsUiHandler:${statLabelKey}`) : "", TextStyle.TOOLTIP_TITLE);
          statLabel.setOrigin(0, 0);
          this.statLabels[col] = statLabel;
          this.statsContainer.add(statLabel);
        } else {
          const statValue = displayStats[col].setupFunc(this.scene, 0, y);
          this.statValues[row-1][col] = statValue;
          this.statsContainer.add(statValue);
        }
      }
    }

    this.runStatsContainer.add(headerBg);
    this.runStatsContainer.add(headerText);
    this.runStatsContainer.add(statsBg);
    this.runStatsContainer.add(this.statsContainer);

    ui.add(this.runStatsContainer);

    this.setCursor(0);

    this.runStatsContainer.setVisible(false);
  }

  show(args: any[]): boolean {
    super.show(args);

    this.setCursor(0);

    this.updateStats();

    this.alignStats();

    this.runStatsContainer.setVisible(true);

    this.getUi().moveTo(this.runStatsContainer, this.getUi().length - 1);

    this.getUi().hideTooltip();

    return true;
  }

  updateStats(): void {
    const playerParty = this.scene.getParty();
    const sortedPlayerParty = [...playerParty].sort((a, b) => b.runData.kills - a.runData.kills);

    for (let row = 0; row < 6; ++row) {
      for (let col = 0; col < displayStats.length; ++col) {
        if (row < sortedPlayerParty.length) {
          displayStats[col].sourceFunc(this.statValues[row][col], sortedPlayerParty[row]);
          this.statValues[row][col].setVisible(true);
        } else {
          this.statValues[row][col].setVisible(false);
        }
      }
    }
  }

  alignStats(): void {
    // left-align all columns such that they're non-overlapping and separated by a given padding
    let culmulativeDisplayWidth = 0;

    for (let col = 0; col < displayStats.length; ++col) {
      // x offset of this column = culmulative width of all previous columns
      this.statLabels[col].x = culmulativeDisplayWidth;
      for (let row = 0; row < 6; ++row) {
        this.statValues[row][col].x = culmulativeDisplayWidth;
      }

      let maxDisplayWidthOnColumn = 0;
      maxDisplayWidthOnColumn = Math.max(maxDisplayWidthOnColumn, this.statLabels[col].displayWidth);
      for (let row = 0; row < 6; ++row) {
        maxDisplayWidthOnColumn = Math.max(maxDisplayWidthOnColumn, this.statValues[row][col].displayWidth);
      }

      culmulativeDisplayWidth += maxDisplayWidthOnColumn + displayStats[col].rightPaddingPx;
    }

    // center all columns
    const offsetToCenter = (((this.scene.game.canvas.width / 6) - 2) - culmulativeDisplayWidth) / 2;

    for (let col = 0; col < displayStats.length; ++col) {
      this.statLabels[col].x += offsetToCenter;
      for (let row = 0; row < 6; ++row) {
        this.statValues[row][col].x += offsetToCenter;
      }
    }
  }

  processInput(button: Button): boolean {
    const ui = this.getUi();

    const currentPhase = this.scene.getCurrentPhase();
    const isEndRunStatsPhase = (currentPhase instanceof EndRunStatsPhase);

    let success = false;

    switch (button) {
    case Button.CANCEL:
      if (!isEndRunStatsPhase) {
        success = true;
        this.scene.ui.revertMode();
      }
      break;
    case Button.UP:
      if (this.cursor) {
        success = this.setCursor(this.cursor - 1);
      }
      break;
    case Button.DOWN:
      success = this.setCursor(this.cursor + 1);
      break;
    case Button.ACTION:
    case Button.SUBMIT:
      if (isEndRunStatsPhase) {
        currentPhase.end();
        success = true;
      }
      break;
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
      this.alignStats();
    }

    return ret;
  }

  clear() {
    super.clear();
    this.runStatsContainer.setVisible(false);
  }
}
