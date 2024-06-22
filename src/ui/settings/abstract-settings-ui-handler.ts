import BattleScene from "../../battle-scene";
import { hasTouchscreen, isMobile } from "../../touch-controls";
import { TextStyle, addTextObject } from "../text";
import { Mode } from "../ui";
import UiHandler from "../ui-handler";
import { addWindow } from "../ui-theme";
import {Button} from "#enums/buttons";
import {InputsIcons} from "#app/ui/settings/abstract-control-settings-ui-handler.js";
import NavigationMenu, {NavigationManager} from "#app/ui/settings/navigationMenu";
import { Setting, SettingKeys } from "#app/system/settings/settings";
import i18next from "i18next";


/**
 * Abstract class for handling UI elements related to settings.
 */
export default class AbstractSettingsUiHandler extends UiHandler {
  private settingsContainer: Phaser.GameObjects.Container;
  private optionsContainer: Phaser.GameObjects.Container;
  private navigationContainer: NavigationMenu;

  private scrollCursor: integer;

  private optionsBg: Phaser.GameObjects.NineSlice;

  private optionCursors: integer[];

  private settingLabels: Phaser.GameObjects.Text[];
  private optionValueLabels: Phaser.GameObjects.Text[][];

  protected navigationIcons: InputsIcons;

  private cursorObj: Phaser.GameObjects.NineSlice;

  private reloadSettings: Array<Setting>;
  private reloadRequired: boolean;

  protected rowsToDisplay: number;
  protected title: string;
  protected settings: Array<Setting>;
  protected localStorageKey: string;

  constructor(scene: BattleScene, mode?: Mode) {
    super(scene, mode);

    this.reloadRequired = false;
    this.rowsToDisplay = 8;
  }

  /**
   * Setup UI elements
   */
  setup() {
    const ui = this.getUi();

    this.settingsContainer = this.scene.add.container(1, -(this.scene.game.canvas.height / 6) + 1);

    this.settingsContainer.setInteractive(new Phaser.Geom.Rectangle(0, 0, this.scene.game.canvas.width / 6, this.scene.game.canvas.height / 6 - 20), Phaser.Geom.Rectangle.Contains);

    this.navigationIcons = {};

    this.navigationContainer = new NavigationMenu(this.scene, 0, 0);

    this.optionsBg = addWindow(this.scene, 0, this.navigationContainer.height, (this.scene.game.canvas.width / 6) - 2, (this.scene.game.canvas.height / 6) - 16 - this.navigationContainer.height - 2);
    this.optionsBg.setOrigin(0, 0);

    const actionsBg = addWindow(this.scene, 0, (this.scene.game.canvas.height / 6) - this.navigationContainer.height, (this.scene.game.canvas.width / 6) - 2, 22);
    actionsBg.setOrigin(0, 0);

    const iconAction = this.scene.add.sprite(0, 0, "keyboard");
    iconAction.setOrigin(0, -0.1);
    iconAction.setPositionRelative(actionsBg, this.navigationContainer.width - 32, 4);
    this.navigationIcons["BUTTON_ACTION"] = iconAction;

    const actionText = addTextObject(this.scene, 0, 0, i18next.t("settings:action"), TextStyle.SETTINGS_LABEL);
    actionText.setOrigin(0, 0.15);
    actionText.setPositionRelative(iconAction, -actionText.width/6-2, 0);

    const iconCancel = this.scene.add.sprite(0, 0, "keyboard");
    iconCancel.setOrigin(0, -0.1);
    iconCancel.setPositionRelative(actionsBg, this.navigationContainer.width - 100, 4);
    this.navigationIcons["BUTTON_CANCEL"] = iconCancel;

    const cancelText = addTextObject(this.scene, 0, 0, i18next.t("settings:back"), TextStyle.SETTINGS_LABEL);
    cancelText.setOrigin(0, 0.15);
    cancelText.setPositionRelative(iconCancel, -cancelText.width/6-2, 0);

    this.optionsContainer = this.scene.add.container(0, 0);

    this.settingLabels = [];
    this.optionValueLabels = [];

    this.reloadSettings = this.settings.filter(s => s?.requireReload);

    this.settings
      .forEach((setting, s) => {
        let settingName = setting.label;
        if (setting?.requireReload) {
          settingName += ` (${i18next.t("settings:requireReload")})`;
        }

        this.settingLabels[s] = addTextObject(this.scene, 8, 28 + s * 16, settingName, TextStyle.SETTINGS_LABEL);
        this.settingLabels[s].setOrigin(0, 0);

        this.optionsContainer.add(this.settingLabels[s]);
        this.optionValueLabels.push(setting.options.map((option, o) => {
          const valueLabel = addTextObject(this.scene, 0, 0, option.label, setting.default === o ? TextStyle.SETTINGS_SELECTED : TextStyle.WINDOW);
          valueLabel.setOrigin(0, 0);

          this.optionsContainer.add(valueLabel);

          return valueLabel;
        }));

        const totalWidth = this.optionValueLabels[s].map(o => o.width).reduce((total, width) => total += width, 0);

        const labelWidth =  Math.max(78, this.settingLabels[s].displayWidth + 8);

        const totalSpace = (300 - labelWidth) - totalWidth / 6;
        const optionSpacing = Math.floor(totalSpace / (this.optionValueLabels[s].length - 1));

        let xOffset = 0;

        for (const value of this.optionValueLabels[s]) {
          value.setPositionRelative(this.settingLabels[s], labelWidth + xOffset, 0);
          xOffset += value.width / 6 + optionSpacing;
        }
      });

    this.optionCursors = this.settings.map(setting => setting.default);

    this.settingsContainer.add(this.optionsBg);
    this.settingsContainer.add(this.navigationContainer);
    this.settingsContainer.add(actionsBg);
    this.settingsContainer.add(this.optionsContainer);
    this.settingsContainer.add(iconAction);
    this.settingsContainer.add(iconCancel);
    this.settingsContainer.add(actionText);
    this.settingsContainer.add(cancelText);

    ui.add(this.settingsContainer);

    this.setCursor(0);
    this.setScrollCursor(0);

    this.settingsContainer.setVisible(false);
  }
  /**
   * Update the bindings for the current active device configuration.
   */
  updateBindings(): void {
    for (const settingName of Object.keys(this.navigationIcons)) {
      if (settingName === "BUTTON_HOME") {
        this.navigationIcons[settingName].setTexture("keyboard");
        this.navigationIcons[settingName].setFrame("HOME.png");
        this.navigationIcons[settingName].alpha = 1;
        continue;
      }
      const icon = this.scene.inputController?.getIconForLatestInputRecorded(settingName);
      if (icon) {
        const type = this.scene.inputController?.getLastSourceType();
        this.navigationIcons[settingName].setTexture(type);
        this.navigationIcons[settingName].setFrame(icon);
        this.navigationIcons[settingName].alpha = 1;
      } else {
        this.navigationIcons[settingName].alpha = 0;
      }
    }
    NavigationManager.getInstance().updateIcons();
  }

  /**
   * Show the UI with the provided arguments.
   *
   * @param args - Arguments to be passed to the show method.
   * @returns `true` if successful.
     */
  show(args: any[]): boolean {
    super.show(args);
    this.updateBindings();

    const settings: object = localStorage.hasOwnProperty(this.localStorageKey) ? JSON.parse(localStorage.getItem(this.localStorageKey)) : {};

    this.settings.forEach((setting, s) => this.setOptionCursor(s, settings.hasOwnProperty(setting.key) ? settings[setting.key] : this.settings[s].default));

    this.settingsContainer.setVisible(true);
    this.setCursor(0);

    this.getUi().moveTo(this.settingsContainer, this.getUi().length - 1);

    this.getUi().hideTooltip();

    return true;
  }

  /**
   * Processes input from a specified button.
   * This method handles navigation through a UI menu, including movement through menu items
   * and handling special actions like cancellation. Each button press may adjust the cursor
   * position or the menu scroll, and plays a sound effect if the action was successful.
   *
   * @param button - The button pressed by the user.
   * @returns `true` if the action associated with the button was successfully processed, `false` otherwise.
   */
  processInput(button: Button): boolean {
    const ui = this.getUi();
    // Defines the maximum number of rows that can be displayed on the screen.

    let success = false;

    if (button === Button.CANCEL) {
      success = true;
      NavigationManager.getInstance().reset();
      // Reverts UI to its previous state on cancel.
      this.scene.ui.revertMode();
    } else {
      const cursor = this.cursor + this.scrollCursor;
      switch (button) {
      case Button.UP:
        if (cursor) {
          if (this.cursor) {
            success = this.setCursor(this.cursor - 1);
          } else {
            success = this.setScrollCursor(this.scrollCursor - 1);
          }
        } else {
          // When at the top of the menu and pressing UP, move to the bottommost item.
          // First, set the cursor to the last visible element, preparing for the scroll to the end.
          const successA = this.setCursor(this.rowsToDisplay - 1);
          // Then, adjust the scroll to display the bottommost elements of the menu.
          const successB = this.setScrollCursor(this.optionValueLabels.length - this.rowsToDisplay);
          success = successA && successB; // success is just there to play the little validation sound effect
        }
        break;
      case Button.DOWN:
        if (cursor < this.optionValueLabels.length - 1) {
          if (this.cursor < this.rowsToDisplay - 1) {// if the visual cursor is in the frame of 0 to 8
            success = this.setCursor(this.cursor + 1);
          } else if (this.scrollCursor < this.optionValueLabels.length - this.rowsToDisplay) {
            success = this.setScrollCursor(this.scrollCursor + 1);
          }
        } else {
          // When at the bottom of the menu and pressing DOWN, move to the topmost item.
          // First, set the cursor to the first visible element, resetting the scroll to the top.
          const successA = this.setCursor(0);
          // Then, reset the scroll to start from the first element of the menu.
          const successB = this.setScrollCursor(0);
          success = successA && successB; // Indicates a successful cursor and scroll adjustment.
        }
        break;
      case Button.LEFT:
        if (this.optionCursors[cursor]) {// Moves the option cursor left, if possible.
          success = this.setOptionCursor(cursor, this.optionCursors[cursor] - 1, true);
        }
        break;
      case Button.RIGHT:
        // Moves the option cursor right, if possible.
        if (this.optionCursors[cursor] < this.optionValueLabels[cursor].length - 1) {
          success = this.setOptionCursor(cursor, this.optionCursors[cursor] + 1, true);
        }
        break;
      case Button.CYCLE_FORM:
      case Button.CYCLE_SHINY:
        success = this.navigationContainer.navigate(button);
        break;
      }
    }

    // Plays a select sound effect if an action was successfully processed.
    if (success) {
      ui.playSelect();
    }

    return success;
  }

  /**
   * Set the cursor to the specified position.
   *
   * @param cursor - The cursor position to set.
   * @returns `true` if the cursor was set successfully.
   */
  setCursor(cursor: integer): boolean {
    const ret = super.setCursor(cursor);

    if (!this.cursorObj) {
      this.cursorObj = this.scene.add.nineslice(0, 0, "summary_moves_cursor", null, (this.scene.game.canvas.width / 6) - 10, 16, 1, 1, 1, 1);
      this.cursorObj.setOrigin(0, 0);
      this.optionsContainer.add(this.cursorObj);
    }

    this.cursorObj.setPositionRelative(this.optionsBg, 4, 4 + (this.cursor + this.scrollCursor) * 16);

    return ret;
  }

  /**
   * Set the option cursor to the specified position.
   *
   * @param settingIndex - The index of the setting.
   * @param cursor - The cursor position to set.
   * @param save - Whether to save the setting to local storage.
   * @returns `true` if the option cursor was set successfully.
   */
  setOptionCursor(settingIndex: integer, cursor: integer, save?: boolean): boolean {
    const setting = this.settings[settingIndex];

    if (setting.key === SettingKeys.Touch_Controls && cursor && hasTouchscreen() && isMobile()) {
      this.getUi().playError();
      return false;
    }

    const lastCursor = this.optionCursors[settingIndex];

    const lastValueLabel = this.optionValueLabels[settingIndex][lastCursor];
    lastValueLabel.setColor(this.getTextColor(TextStyle.WINDOW));
    lastValueLabel.setShadowColor(this.getTextColor(TextStyle.WINDOW, true));

    this.optionCursors[settingIndex] = cursor;

    const newValueLabel = this.optionValueLabels[settingIndex][cursor];
    newValueLabel.setColor(this.getTextColor(TextStyle.SETTINGS_SELECTED));
    newValueLabel.setShadowColor(this.getTextColor(TextStyle.SETTINGS_SELECTED, true));

    if (save) {
      this.scene.gameData.saveSetting(setting.key, cursor);
      if (this.reloadSettings.includes(setting)) {
        this.reloadRequired = true;
      }
    }

    return true;
  }

  /**
   * Set the scroll cursor to the specified position.
   *
   * @param scrollCursor - The scroll cursor position to set.
   * @returns `true` if the scroll cursor was set successfully.
   */
  setScrollCursor(scrollCursor: integer): boolean {
    if (scrollCursor === this.scrollCursor) {
      return false;
    }

    this.scrollCursor = scrollCursor;

    this.updateSettingsScroll();

    this.setCursor(this.cursor);

    return true;
  }

  /**
   * Update the scroll position of the settings UI.
   */
  updateSettingsScroll(): void {
    this.optionsContainer.setY(-16 * this.scrollCursor);

    for (let s = 0; s < this.settingLabels.length; s++) {
      const visible = s >= this.scrollCursor && s < this.scrollCursor + this.rowsToDisplay;
      this.settingLabels[s].setVisible(visible);
      for (const option of this.optionValueLabels[s]) {
        option.setVisible(visible);
      }
    }
  }

  /**
   * Clear the UI elements and state.
   */
  clear() {
    super.clear();
    this.settingsContainer.setVisible(false);
    this.eraseCursor();
    if (this.reloadRequired) {
      this.reloadRequired = false;
      this.scene.reset(true, false, true);
    }
  }

  /**
   * Erase the cursor from the UI.
   */
  eraseCursor() {
    if (this.cursorObj) {
      this.cursorObj.destroy();
    }
    this.cursorObj = null;
  }
}
