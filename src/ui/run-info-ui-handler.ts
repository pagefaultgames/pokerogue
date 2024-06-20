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
  additionalBottomPaddingPx?: integer;
  setupFunc: (scene: BattleScene, x: integer, y: integer) => Phaser.GameObjects.Sprite | Phaser.GameObjects.Text;
  sourceFunc: (element: Phaser.GameObjects.Sprite | Phaser.GameObjects.Text, pokemon: PlayerPokemon) => void;
}

const defaultTextSetupFunc = (scene, x, y) => {
  const text = addTextObject(scene, x, y, "", TextStyle.TOOLTIP_CONTENT);
  text.setOrigin(0, 0);
  return text;
};

const DEFAULT_RIGHT_PADDING_PX = 9;

const rowData: DisplayStat[] = [
  {
    additionalBottomPaddingPx: 6,
    setupFunc: (scene, x, y) => {
      const spriteIcon = scene.add.sprite(x, y, "pkmn__sub");
      spriteIcon.setOrigin(0, 0.25);
      spriteIcon.setScale(0.70);
      spriteIcon.setPipeline(scene.spritePipeline, { tone: [ 0.0, 0.0, 0.0, 0.0 ], ignoreTimeTint: true });
      return spriteIcon;
    },
    sourceFunc: (element: Phaser.GameObjects.Sprite, pokemon) => {
      element.setTexture(pokemon.getIconAtlasKey());
      element.setFrame(pokemon.getIconId());
    }
  },
  /*
  {
    setupFunc: (scene, x, y) => {
      const text = addTextObject(scene, x, y, "", TextStyle.TOOLTIP_TITLE);
      text.setOrigin(0, 0);
      return text;
    },
    sourceFunc: (element: Phaser.GameObjects.Text, pokemon) => {
      element.setText(pokemon.name.trim());
    }
  },
  */
  {
    labelKey: "level",
    setupFunc: defaultTextSetupFunc,
    sourceFunc: (element: Phaser.GameObjects.Text, pokemon) => {
      element.setText(formatLargeNumber(pokemon.level, 100000));
    }
  },
  {
    labelKey: "metOnWave",
    setupFunc: defaultTextSetupFunc,
    sourceFunc: (element: Phaser.GameObjects.Text, pokemon) => {
      element.setText(pokemon.metWave !== 0 ? pokemon.metWave.toString() : i18next.t("runInfoUiHandler:starter"));
    }
  },
  {
    labelKey: "knockouts",
    setupFunc: defaultTextSetupFunc,
    sourceFunc: (element: Phaser.GameObjects.Text, pokemon) => {
      element.setText(formatLargeNumber(pokemon.runData.knockouts, 100000));
    }
  },
  {
    labelKey: "assists",
    setupFunc: defaultTextSetupFunc,
    sourceFunc: (element: Phaser.GameObjects.Text, pokemon) => {
      element.setText(formatLargeNumber(pokemon.runData.assists, 100000));
    }
  },
  {
    labelKey: "faints",
    setupFunc: defaultTextSetupFunc,
    sourceFunc: (element: Phaser.GameObjects.Text, pokemon) => {
      element.setText(formatLargeNumber(pokemon.runData.faints, 100000));
    }
  },
  {
    labelKey: "damageDealt",
    setupFunc: defaultTextSetupFunc,
    sourceFunc: (element: Phaser.GameObjects.Text, pokemon) => {
      element.setText(formatLargeNumber(pokemon.runData.damageDealt, 100000));
    }
  },
  {
    labelKey: "damageTaken",
    setupFunc: defaultTextSetupFunc,
    sourceFunc: (element: Phaser.GameObjects.Text, pokemon) => {
      element.setText(formatLargeNumber(pokemon.runData.damageTaken, 100000));
    }
  },
];

export default class runInfoUiHandler extends UiHandler {
  private runInfoContainer: Phaser.GameObjects.Container;
  private statsContainer: Phaser.GameObjects.Container;

  private cells: (Phaser.GameObjects.Sprite | Phaser.GameObjects.Text)[][];

  constructor(scene: BattleScene, mode?: Mode) {
    super(scene, mode);

    // rows, columns. the first column is reserved for labels.
    this.cells = new Array(rowData.length).fill(undefined).map(x => Array(6+1).fill(undefined));
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

    for (let col = 0; col < 6+1; ++col) {
      let culmulativeY = 34;

      for (let row = 0; row < rowData.length; ++row) {
        // x offsets are computed in alignStats()
        if (col === 0) {
          const statLabelKey = rowData[row].labelKey;
          // subtract a bit off the y offset to compensate for the larger font
          const statLabel = addTextObject(this.scene, 0, culmulativeY-1, (statLabelKey ? i18next.t(`runInfoUiHandler:${statLabelKey}`) : ""), TextStyle.TOOLTIP_TITLE);
          statLabel.setOrigin(0, 0);
          this.cells[row][col] = statLabel;
          this.statsContainer.add(statLabel);
        } else {
          const statValue = rowData[row].setupFunc(this.scene, 0, culmulativeY);
          this.cells[row][col] = statValue;
          this.statsContainer.add(statValue);
        }

        culmulativeY += 14 + (rowData[row].additionalBottomPaddingPx ?? 0);
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

    for (let row = 0; row < rowData.length; ++row) {
      // the first column holds the labels
      this.cells[row][0].setVisible(true);

      for (let col = 1; col < 6+1; ++col) {
        if (col-1 < sortedPlayerParty.length) {
          rowData[row].sourceFunc(this.cells[row][col], sortedPlayerParty[col-1]);
          this.cells[row][col].setVisible(true);
        } else {
          this.cells[row][col].setVisible(false);
        }
      }
    }
  }

  alignStats(): void {
    let culmulativeDisplayWidth = 0;

    for (let col = 0; col < 6+1; ++col) {
      // left-align columns together by setting the x of this column (and
      // subsequently the others) to the culmulative width of all previous columns
      for (let row = 0; row < rowData.length; ++row) {
        this.cells[row][col].x = culmulativeDisplayWidth;
      }

      let maxDisplayWidthOnColumn = 0;
      for (let row = 0; row < rowData.length; ++row) {
        maxDisplayWidthOnColumn = Math.max(maxDisplayWidthOnColumn, this.cells[row][col].displayWidth);
      }

      // center-align values relative to the column, but keep the labels left-aligned
      if (col > 0) {
        for (let row = 0; row < rowData.length; ++row) {
          this.cells[row][col].x += (maxDisplayWidthOnColumn - this.cells[row][col].displayWidth) / 2;
        }
      }

      culmulativeDisplayWidth += maxDisplayWidthOnColumn + DEFAULT_RIGHT_PADDING_PX;
    }

    culmulativeDisplayWidth -= DEFAULT_RIGHT_PADDING_PX;

    // center-align columns relative to the container
    const offsetToCenter = (((this.scene.game.canvas.width / 6) - 2) - culmulativeDisplayWidth) / 2;
    for (let col = 0; col < 6+1; ++col) {
      for (let row = 0; row < rowData.length; ++row) {
        this.cells[row][col].x += offsetToCenter;
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
