import BattleScene, { Button } from "../battle-scene";
import { Setting, settingDefaults, settingOptions } from "../system/settings";
import { TextStyle, addTextObject, getTextColor } from "./text";
import { Mode } from "./ui";
import UiHandler from "./uiHandler";

export default class SettingsUiHandler extends UiHandler {
  private settingsContainer: Phaser.GameObjects.Container;
  private optionsContainer: Phaser.GameObjects.Container;

  private optionsBg: Phaser.GameObjects.NineSlice;

  private optionCursors: integer[];

  private optionValueLabels: Phaser.GameObjects.Text[][];

  private cursorObj: Phaser.GameObjects.NineSlice;

  constructor(scene: BattleScene, mode?: Mode) {
    super(scene, mode);
  }

  setup() {
    const ui = this.getUi();
    
    this.settingsContainer = this.scene.add.container(1, -(this.scene.game.canvas.height / 6) + 1);

    this.settingsContainer.setInteractive(new Phaser.Geom.Rectangle(0, 0, this.scene.game.canvas.width / 6, this.scene.game.canvas.height / 6), Phaser.Geom.Rectangle.Contains);

    const headerBg = this.scene.add.nineslice(0, 0, 'window', null, (this.scene.game.canvas.width / 6) - 2, 24, 6, 6, 6, 6);
    headerBg.setOrigin(0, 0);

    const headerText = addTextObject(this.scene, 0, 0, 'Options', TextStyle.SETTINGS_LABEL);
    headerText.setOrigin(0, 0);
    headerText.setPositionRelative(headerBg, 8, 4);

    this.optionsBg = this.scene.add.nineslice(0, headerBg.height, 'window', null, (this.scene.game.canvas.width / 6) - 2, (this.scene.game.canvas.height / 6) - headerBg.height - 2, 6, 6, 6, 6);
    this.optionsBg.setOrigin(0, 0);

    this.optionsContainer = this.scene.add.container(0, 0);

    const settingLabels = [];
    this.optionValueLabels = [];

    Object.keys(Setting).forEach((setting, s) => {
      settingLabels[s] = addTextObject(this.scene, 8, 28 + s * 16, setting.replace(/\_/g, ' '), TextStyle.SETTINGS_LABEL);
      settingLabels[s].setOrigin(0, 0);

      this.optionsContainer.add(settingLabels[s]);

      this.optionValueLabels.push(settingOptions[Setting[setting]].map((option, o) => {
        const valueLabel = addTextObject(this.scene, 0, 0, option, settingDefaults[Setting[setting]] === o ? TextStyle.SETTINGS_SELECTED : TextStyle.WINDOW);
        valueLabel.setOrigin(0, 0);

        this.optionsContainer.add(valueLabel);

        return valueLabel;
      }));

      const totalWidth = this.optionValueLabels[s].map(o => o.width).reduce((total, width) => total += width, 0);

      const labelWidth =  Math.max(78, settingLabels[s].displayWidth + 8);

      const totalSpace = (300 - labelWidth) - totalWidth / 6;
      const optionSpacing = Math.floor(totalSpace / (this.optionValueLabels[s].length - 1));

      let xOffset = 0;

      for (let value of this.optionValueLabels[s]) {
        value.setPositionRelative(settingLabels[s], labelWidth + xOffset, 0);
        xOffset += value.width / 6 + optionSpacing;
      }
    });

    this.optionCursors = Object.values(settingDefaults);

    this.settingsContainer.add(headerBg);
    this.settingsContainer.add(headerText);
    this.settingsContainer.add(this.optionsBg);
    this.settingsContainer.add(this.optionsContainer);

    ui.add(this.settingsContainer);

    this.setCursor(0);

    this.settingsContainer.setVisible(false);
  }

  show(args: any[]) {
    super.show(args);
    
    const settings: object = localStorage.hasOwnProperty('settings') ? JSON.parse(localStorage.getItem('settings')) : {};

    Object.keys(settingDefaults).forEach((setting, s) => {
      this.setOptionCursor(s, settings.hasOwnProperty(setting) ? settings[setting] : settingDefaults[setting]);
    });

    this.settingsContainer.setVisible(true);
    this.setCursor(0);

    this.getUi().moveTo(this.settingsContainer, this.getUi().length - 1);

    this.getUi().hideTooltip();
  }

  processInput(button: Button) {
    const ui = this.getUi();

    let success = false;

    if (button === Button.CANCEL) {
      success = true;
      this.scene.ui.revertMode();
    } else {
      switch (button) {
        case Button.UP:
          if (this.cursor)
            success = this.setCursor(this.cursor - 1);
          break;
        case Button.DOWN:
          if (this.cursor < this.optionValueLabels.length - 1)
            success = this.setCursor(this.cursor + 1);
          break;
        case Button.LEFT:
          if (this.optionCursors[this.cursor])
            success = this.setOptionCursor(this.cursor, this.optionCursors[this.cursor] - 1, true);
          break;
        case Button.RIGHT:
          if (this.optionCursors[this.cursor] < this.optionValueLabels[this.cursor].length - 1)
            success = this.setOptionCursor(this.cursor, this.optionCursors[this.cursor] + 1, true);
          break;
      }
    }

    if (success)
      ui.playSelect();
  }

  setCursor(cursor: integer): boolean {
    const ret = super.setCursor(cursor);

    if (!this.cursorObj) {
      this.cursorObj = this.scene.add.nineslice(0, 0, 'starter_select_cursor_highlight', null, (this.scene.game.canvas.width / 6) - 10, 16, 1, 1, 1, 1);
      this.cursorObj.setOrigin(0, 0);
      this.optionsContainer.add(this.cursorObj);
    }

    this.cursorObj.setPositionRelative(this.optionsBg, 4, 4 + this.cursor * 16);

    return ret;
  }

  setOptionCursor(settingIndex: integer, cursor: integer, save?: boolean): boolean {
    const lastValueLabel = this.optionValueLabels[settingIndex][this.optionCursors[settingIndex]];
    lastValueLabel.setColor(getTextColor(TextStyle.WINDOW));
    lastValueLabel.setShadowColor(getTextColor(TextStyle.WINDOW, true));

    this.optionCursors[settingIndex] = cursor;

    const newValueLabel = this.optionValueLabels[settingIndex][cursor];
    newValueLabel.setColor(getTextColor(TextStyle.SETTINGS_SELECTED));
    newValueLabel.setShadowColor(getTextColor(TextStyle.SETTINGS_SELECTED, true));

    if (save)
      this.scene.gameData.saveSetting(Setting[Object.keys(Setting)[settingIndex]], cursor);

    return true;
  }

  clear() {
    super.clear();
    this.settingsContainer.setVisible(false);
    this.eraseCursor();
  }

  eraseCursor() {
    if (this.cursorObj)
      this.cursorObj.destroy();
    this.cursorObj = null;
  }
}