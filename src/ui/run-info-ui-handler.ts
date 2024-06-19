import Phaser from "phaser";
import BattleScene from "../battle-scene";
import { EndRunInfoPhase } from "../phases";
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
  centerAlign: boolean;
  setupFunc: (scene: BattleScene, x: integer, y: integer) => Phaser.GameObjects.Sprite | Phaser.GameObjects.Text;
  sourceFunc: (element: Phaser.GameObjects.Sprite | Phaser.GameObjects.Text, pokemon: PlayerPokemon) => void;
}

const defaultTextSetupFunc = (scene, x, y) => {
  const text = addTextObject(scene, x, y, "", TextStyle.TOOLTIP_CONTENT);
  text.setOrigin(0, 0);
  return text;
};

const DEFAULT_RIGHT_PADDING_PX = 8;

const displayStats: DisplayStat[] = [
  {
    rightPaddingPx: 0.5*DEFAULT_RIGHT_PADDING_PX,
    centerAlign: true,
    setupFunc: (scene, x, y) => {
      const spriteIcon = scene.add.sprite(x, y, "pkmn__sub");
      spriteIcon.setOrigin(0, 0.25);
      spriteIcon.setScale(0.5);
      spriteIcon.setPipeline(scene.spritePipeline, { tone: [ 0.0, 0.0, 0.0, 0.0 ], ignoreTimeTint: true });
      return spriteIcon;
    },
    sourceFunc: (element: Phaser.GameObjects.Sprite, pokemon) => {
      element.setTexture(pokemon.getIconAtlasKey());
      element.setFrame(pokemon.getIconId());
    }
  },
  {
    labelKey: "pokemonName",
    rightPaddingPx: DEFAULT_RIGHT_PADDING_PX,
    centerAlign: false,
    setupFunc: defaultTextSetupFunc,
    sourceFunc: (element: Phaser.GameObjects.Text, pokemon) => {
      element.setText(pokemon.name.trim());
    }
  },
  {
    labelKey: "level",
    rightPaddingPx: 1.5*DEFAULT_RIGHT_PADDING_PX,
    centerAlign: true,
    setupFunc: defaultTextSetupFunc,
    sourceFunc: (element: Phaser.GameObjects.Text, pokemon) => {
      element.setText(formatLargeNumber(pokemon.level, 100000));
    }
  },
  {
    labelKey: "metOnWave",
    rightPaddingPx: 1.5*DEFAULT_RIGHT_PADDING_PX,
    centerAlign: true,
    setupFunc: defaultTextSetupFunc,
    sourceFunc: (element: Phaser.GameObjects.Text, pokemon) => {
      element.setText(pokemon.metWave !== 0 ? pokemon.metWave.toString() : i18next.t("runInfoUiHandler:starter"));
    }
  },
  {
    labelKey: "knockouts",
    rightPaddingPx: DEFAULT_RIGHT_PADDING_PX,
    centerAlign: true,
    setupFunc: defaultTextSetupFunc,
    sourceFunc: (element: Phaser.GameObjects.Text, pokemon) => {
      element.setText(formatLargeNumber(pokemon.runData.knockouts, 100000));
    }
  },
  {
    labelKey: "assists",
    rightPaddingPx: DEFAULT_RIGHT_PADDING_PX,
    centerAlign: true,
    setupFunc: defaultTextSetupFunc,
    sourceFunc: (element: Phaser.GameObjects.Text, pokemon) => {
      element.setText(formatLargeNumber(pokemon.runData.assists, 100000));
    }
  },
  {
    labelKey: "faints",
    rightPaddingPx: DEFAULT_RIGHT_PADDING_PX,
    centerAlign: true,
    setupFunc: defaultTextSetupFunc,
    sourceFunc: (element: Phaser.GameObjects.Text, pokemon) => {
      element.setText(formatLargeNumber(pokemon.runData.faints, 100000));
    }
  },
  {
    labelKey: "damageDealt",
    rightPaddingPx: DEFAULT_RIGHT_PADDING_PX,
    centerAlign: true,
    setupFunc: defaultTextSetupFunc,
    sourceFunc: (element: Phaser.GameObjects.Text, pokemon) => {
      element.setText(formatLargeNumber(pokemon.runData.damageDealt, 100000));
    }
  },
  {
    labelKey: "damageTaken",
    rightPaddingPx: DEFAULT_RIGHT_PADDING_PX,
    centerAlign: true,
    setupFunc: defaultTextSetupFunc,
    sourceFunc: (element: Phaser.GameObjects.Text, pokemon) => {
      element.setText(formatLargeNumber(pokemon.runData.damageTaken, 100000));
    }
  },
];

export default class runInfoUiHandler extends UiHandler {
  private runInfoContainer: Phaser.GameObjects.Container;
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

    this.runInfoContainer = this.scene.add.container(1, -(this.scene.game.canvas.height / 6) + 1);

    this.runInfoContainer.setInteractive(new Phaser.Geom.Rectangle(0, 0, this.scene.game.canvas.width / 6, this.scene.game.canvas.height / 6), Phaser.Geom.Rectangle.Contains);

    const headerBg = addWindow(this.scene, 0, 0, (this.scene.game.canvas.width / 6) - 2, 24);
    headerBg.setOrigin(0, 0);

    const headerText = addTextObject(this.scene, 0, 0, i18next.t("runInfoUiHandler:title"), TextStyle.SETTINGS_LABEL);
    headerText.setOrigin(0, 0);
    headerText.setPositionRelative(headerBg, 8, 4);

    const statsBgWidth = ((this.scene.game.canvas.width / 6) - 2);
    const statsBg = addWindow(this.scene, 0, headerBg.height, statsBgWidth, (this.scene.game.canvas.height / 6) - headerBg.height - 2, false, false, 2);
    statsBg.setOrigin(0, 0);

    this.statsContainer = this.scene.add.container(0, 0);

    for (let row = 0; row < 6+1; ++row) {
      for (let col = 0; col < displayStats.length; ++col) {
        // x values are computed later

        let y = (row === 0) ? 30 : (38 + (row * 16));

        if (row === 0) {
          const statLabelKey = displayStats[col].labelKey;
          const statLabelText = statLabelKey ? i18next.t(`runInfoUiHandler:${statLabelKey}`) : "";

          // one label has a newline. vertically align the others accordingly
          if (!statLabelText.includes("\n")) {
            y += 4;
          }

          const statLabel = addTextObject(this.scene, 0, y, statLabelText, TextStyle.TOOLTIP_TITLE);
          statLabel.setOrigin(0, 0);
          statLabel.setLineSpacing(-10);
          statLabel.setAlign("center");
          this.statLabels[col] = statLabel;
          this.statsContainer.add(statLabel);
        } else {
          const statValue = displayStats[col].setupFunc(this.scene, 0, y);
          this.statValues[row-1][col] = statValue;
          this.statsContainer.add(statValue);
        }
      }
    }

    this.runInfoContainer.add(headerBg);
    this.runInfoContainer.add(headerText);
    this.runInfoContainer.add(statsBg);
    this.runInfoContainer.add(this.statsContainer);

    ui.add(this.runInfoContainer);

    this.setCursor(0);

    this.runInfoContainer.setVisible(false);
  }

  show(args: any[]): boolean {
    super.show(args);

    this.setCursor(0);

    this.updateStats();

    this.alignStats();

    this.runInfoContainer.setVisible(true);

    this.getUi().moveTo(this.runInfoContainer, this.getUi().length - 1);

    this.getUi().hideTooltip();

    return true;
  }

  updateStats(): void {
    const playerParty = this.scene.getParty();
    const sortedPlayerParty = [...playerParty].sort((a, b) => b.runData.knockouts - a.runData.knockouts);

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
    let culmulativeDisplayWidth = 0;

    for (let col = 0; col < displayStats.length; ++col) {
      // left-align columns together by setting the x of this column (and
      // subsequently the others) to the culmulative width of all previous columns
      this.statLabels[col].x = culmulativeDisplayWidth;
      for (let row = 0; row < 6; ++row) {
        this.statValues[row][col].x = culmulativeDisplayWidth;
      }

      let maxDisplayWidthOnColumn = 0;
      maxDisplayWidthOnColumn = Math.max(maxDisplayWidthOnColumn, this.statLabels[col].displayWidth);
      for (let row = 0; row < 6; ++row) {
        maxDisplayWidthOnColumn = Math.max(maxDisplayWidthOnColumn, this.statValues[row][col].displayWidth);
      }

      // center-align column contents relative to the column
      if (displayStats[col].centerAlign) {
        this.statLabels[col].x += (maxDisplayWidthOnColumn - this.statLabels[col].displayWidth) / 2;
        for (let row = 0; row < 6; ++row) {
          this.statValues[row][col].x += (maxDisplayWidthOnColumn - this.statValues[row][col].displayWidth) / 2;
        }
      }

      culmulativeDisplayWidth += maxDisplayWidthOnColumn + displayStats[col].rightPaddingPx;
    }

    // center-align columns relative to the container
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
    const isEndRunInfoPhase = (currentPhase instanceof EndRunInfoPhase);

    let success = false;

    switch (button) {
    case Button.CANCEL:
      if (!isEndRunInfoPhase) {
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
      if (isEndRunInfoPhase) {
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
    this.runInfoContainer.setVisible(false);
  }
}
