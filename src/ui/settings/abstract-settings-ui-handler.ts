import { globalScene } from "#app/global-scene";
import { Button } from "#enums/buttons";
import { TextStyle } from "#enums/text-style";
import { UiMode } from "#enums/ui-mode";
import type { SettingType } from "#system/settings";
import { Setting, SettingKeys } from "#system/settings";
import type { AnyFn } from "#types/type-helpers";
import type { InputsIcons } from "#ui/abstract-control-settings-ui-handler";
import { MessageUiHandler } from "#ui/message-ui-handler";
import { NavigationManager, NavigationMenu } from "#ui/navigation-menu";
import { ScrollBar } from "#ui/scroll-bar";
import { addTextObject, getTextColor } from "#ui/text";
import { addWindow } from "#ui/ui-theme";
import i18next from "i18next";

/**
 * Abstract class for handling UI elements related to settings.
 */
export class AbstractSettingsUiHandler extends MessageUiHandler {
  private settingsContainer: Phaser.GameObjects.Container;
  private optionsContainer: Phaser.GameObjects.Container;
  private messageBoxContainer: Phaser.GameObjects.Container;
  private navigationContainer: NavigationMenu;

  private scrollCursor: number;
  private scrollBar: ScrollBar;

  private optionsBg: Phaser.GameObjects.NineSlice;

  private optionCursors: number[];

  private settingLabels: Phaser.GameObjects.Text[];
  private optionValueLabels: Phaser.GameObjects.Text[][];

  protected navigationIcons: InputsIcons;

  private cursorObj: Phaser.GameObjects.NineSlice | null;
  private reloadRequired: boolean;

  protected rowsToDisplay: number;
  protected title: string;
  protected settings: Array<Setting>;
  protected localStorageKey: string;

  constructor(type: SettingType, mode: UiMode | null = null) {
    super(mode);
    this.settings = Setting.filter(s => s.type === type && !s?.isHidden?.());
    this.reloadRequired = false;
    this.rowsToDisplay = 8;
  }

  /**
   * Setup UI elements
   */
  setup() {
    const ui = this.getUi();
    const canvasWidth = globalScene.scaledCanvas.width;
    const canvasHeight = globalScene.scaledCanvas.height;

    this.settingsContainer = globalScene.add
      .container(1, -canvasHeight + 1)
      .setName(`settings-${this.title}`)
      .setInteractive(new Phaser.Geom.Rectangle(0, 0, canvasWidth, canvasHeight - 20), Phaser.Geom.Rectangle.Contains);

    this.navigationIcons = {};

    this.navigationContainer = new NavigationMenu(0, 0);
    const navWidth = this.navigationContainer.width;
    const navHeight = this.navigationContainer.height;

    this.optionsBg = addWindow(0, navHeight, canvasWidth - 2, canvasHeight - 16 - navHeight - 2)
      .setName("window-options-bg")
      .setOrigin(0);

    const actionsBg = addWindow(0, canvasHeight - navHeight, canvasWidth - 2, 22) // formatting
      .setOrigin(0);

    const iconAction = globalScene.add
      .sprite(0, 0, "keyboard")
      .setOrigin(0, -0.1)
      .setPositionRelative(actionsBg, navWidth - 32, 4);
    this.navigationIcons["BUTTON_ACTION"] = iconAction;

    const actionText = addTextObject(0, 0, i18next.t("settings:action"), TextStyle.SETTINGS_LABEL).setOrigin(0, 0.15);
    actionText.setPositionRelative(iconAction, -actionText.width / 6 - 2, 0);

    const iconCancel = globalScene.add
      .sprite(0, 0, "keyboard")
      .setOrigin(0, -0.1)
      .setPositionRelative(actionsBg, actionText.x - 28, 4);
    this.navigationIcons["BUTTON_CANCEL"] = iconCancel;

    const cancelText = addTextObject(0, 0, i18next.t("settings:back"), TextStyle.SETTINGS_LABEL) // formatting
      .setOrigin(0, 0.15);
    cancelText.setPositionRelative(iconCancel, -cancelText.width / 6 - 2, 0);

    this.optionsContainer = globalScene.add.container();

    this.settingLabels = [];
    this.optionValueLabels = [];

    let anyReloadRequired = false;
    this.settings.forEach((setting, s) => {
      let settingName = setting.label;
      if (setting?.requireReload) {
        settingName += "*";
        anyReloadRequired = true;
      }

      this.settingLabels[s] = addTextObject(8, 28 + s * 16, settingName, TextStyle.SETTINGS_LABEL).setOrigin(0);

      this.optionsContainer.add(this.settingLabels[s]);
      this.optionValueLabels.push(
        setting.options.map((option, o) => {
          const valueLabel = addTextObject(
            0,
            0,
            option.label,
            setting.default === o ? TextStyle.SETTINGS_SELECTED : TextStyle.SETTINGS_VALUE,
          );
          valueLabel.setOrigin(0);

          this.optionsContainer.add(valueLabel);

          return valueLabel;
        }),
      );

      const totalWidth = this.optionValueLabels[s].map(o => o.width).reduce((total, width) => (total += width), 0);

      const labelWidth = Math.max(78, this.settingLabels[s].displayWidth + 8);

      const totalSpace = 297 - labelWidth - totalWidth / 6;
      const optionSpacing = Math.floor(totalSpace / (this.optionValueLabels[s].length - 1));

      let xOffset = 0;

      for (const value of this.optionValueLabels[s]) {
        value.setPositionRelative(this.settingLabels[s], labelWidth + xOffset, 0);
        xOffset += value.width / 6 + optionSpacing;
      }
    });

    this.optionCursors = this.settings.map(setting => setting.default);

    this.scrollBar = new ScrollBar(
      this.optionsBg.width - 9,
      this.optionsBg.y + 5,
      4,
      this.optionsBg.height - 11,
      this.rowsToDisplay,
    );
    this.scrollBar.setTotalRows(this.settings.length);

    // Two-lines message box
    this.messageBoxContainer = globalScene.add
      .container(0, globalScene.scaledCanvas.height)
      .setName("settings-message-box")
      .setVisible(false);

    const settingsMessageBox = addWindow(0, -1, globalScene.scaledCanvas.width - 2, 48);
    settingsMessageBox.setOrigin(0, 1);
    this.messageBoxContainer.add(settingsMessageBox);

    const messageText = addTextObject(8, -40, "", TextStyle.WINDOW, { maxLines: 2 })
      .setWordWrapWidth(globalScene.game.canvas.width - 60)
      .setName("settings-message")
      .setOrigin(0);

    this.messageBoxContainer.add(messageText);
    this.message = messageText;

    this.settingsContainer.add([
      this.optionsBg,
      this.scrollBar,
      this.navigationContainer,
      actionsBg,
      this.optionsContainer,
      iconAction,
      iconCancel,
      actionText,
    ]);
    // Only add the ReloadRequired text on pages that have settings that require a reload.
    if (anyReloadRequired) {
      const reloadRequired = addTextObject(0, 0, `*${i18next.t("settings:requireReload")}`, TextStyle.SETTINGS_LABEL)
        .setOrigin(0, 0.15)
        .setPositionRelative(actionsBg, 6, 0)
        .setY(actionText.y);
      this.settingsContainer.add(reloadRequired);
    }
    this.settingsContainer.add([cancelText, this.messageBoxContainer]);

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
        this.navigationIcons[settingName].setTexture("keyboard").setFrame("HOME.png").alpha = 1;
        continue;
      }
      const icon = globalScene.inputController?.getIconForLatestInputRecorded(settingName);
      if (icon) {
        const type = globalScene.inputController?.getLastSourceType();
        this.navigationIcons[settingName].setTexture(type).setFrame(icon).alpha = 1;
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

    const settings: object = localStorage.hasOwnProperty(this.localStorageKey)
      ? JSON.parse(localStorage.getItem(this.localStorageKey)!)
      : {}; // TODO: is this bang correct?

    this.settings.forEach((setting, s) => {
      this.setOptionCursor(s, settings.hasOwnProperty(setting.key) ? settings[setting.key] : this.settings[s].default);
    });

    this.settingsContainer.setVisible(true);
    this.setCursor(0);
    this.setScrollCursor(0);

    const ui = this.getUi();

    ui.moveTo(this.settingsContainer, ui.length - 1);

    ui.hideTooltip();

    return true;
  }

  /**
   * Submethod of {@linkcode processInput} to handle left/right input for changing option values
   *
   * @remarks
   * If the cursor is positioned on a boundary option, will apply clamping / wrapping as appropriate
   * @param cursor - Current cursor position in the settings menu
   * @param dir - Direction to pan when scrolling, -1 for left, 1 for right
   * @returns `true` if the action associated with the button was successfully processed, `false` otherwise.
   */
  private processLeftRightInput(cursor: number, dir: -1 | 1): boolean {
    let boundaryAction = Phaser.Math.Wrap;
    let upperBound = this.optionValueLabels[cursor].length;
    if (this.settings[cursor]?.clamp) {
      boundaryAction = Phaser.Math.Clamp;
      // clamping is right inclusive; wrapping isn't
      upperBound -= 1;
    }
    return this.setOptionCursor(cursor, boundaryAction(this.optionCursors[cursor] + dir, 0, upperBound), true);
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
      globalScene.ui.revertMode();
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
            if (this.cursor < this.rowsToDisplay - 1) {
              // if the visual cursor is in the frame of 0 to 8
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
          success = this.processLeftRightInput(cursor, -1);
          break;
        case Button.RIGHT:
          success = this.processLeftRightInput(cursor, 1);
          break;
        case Button.CYCLE_FORM:
        case Button.CYCLE_SHINY:
          success = this.navigationContainer.navigate(button);
          break;
        case Button.ACTION: {
          const setting: Setting = this.settings[cursor];
          if (setting?.activatable) {
            success = this.activateSetting(setting);
          }
          break;
        }
      }
    }

    // Plays a select sound effect if an action was successfully processed.
    if (success) {
      ui.playSelect();
    }

    return success;
  }

  /**
   * Activate the specified setting if it is activatable.
   * @param setting The setting to activate.
   * @returns Whether the setting was successfully activated.
   */
  activateSetting(setting: Setting): boolean {
    switch (setting.key) {
      case SettingKeys.Move_Touch_Controls:
        globalScene.inputController.moveTouchControlsHandler.enableConfigurationMode(this.getUi());
        return true;
    }
    return false;
  }

  /**
   * Set the cursor to the specified position.
   *
   * @param cursor - The cursor position to set.
   * @returns `true` if the cursor was set successfully.
   */
  setCursor(cursor: number): boolean {
    const ret = super.setCursor(cursor);

    if (!this.cursorObj) {
      const cursorWidth = globalScene.scaledCanvas.width - (this.scrollBar.visible ? 16 : 10);
      this.cursorObj = globalScene.add
        .nineslice(0, 0, "summary_moves_cursor", undefined, cursorWidth, 16, 1, 1, 1, 1)
        .setOrigin(0);
      this.optionsContainer.add(this.cursorObj);
    }

    this.cursorObj.setPositionRelative(this.optionsBg, 4, 4 + (this.cursor + this.scrollCursor) * 16);

    return ret;
  }

  /**
   * Set the option cursor to the specified position.
   *
   * @param settingIndex - The index of the setting or -1 to change the current setting
   * @param cursor - The cursor position to set.
   * @param save - Whether to save the setting to local storage.
   * @returns `true` if the option cursor was set successfully.
   */
  setOptionCursor(settingIndex: number, cursor: number, save?: boolean): boolean {
    if (settingIndex === -1) {
      settingIndex = this.cursor + this.scrollCursor;
    }
    const setting = this.settings[settingIndex];
    const lastCursor = this.optionCursors[settingIndex];
    // do nothing if the option isn't changing
    if (cursor === lastCursor) {
      return false;
    }

    this.optionValueLabels[settingIndex][lastCursor]
      .setColor(getTextColor(TextStyle.SETTINGS_VALUE))
      .setShadowColor(getTextColor(TextStyle.SETTINGS_VALUE, true));

    this.optionCursors[settingIndex] = cursor;

    this.optionValueLabels[settingIndex][cursor]
      .setColor(getTextColor(TextStyle.SETTINGS_SELECTED))
      .setShadowColor(getTextColor(TextStyle.SETTINGS_SELECTED, true));

    if (save) {
      const saveSetting = () => {
        globalScene.gameData.saveSetting(setting.key, cursor);
        if (setting.requireReload) {
          this.reloadRequired = true;
        }
      };

      // For settings that ask for confirmation, display confirmation message and a Yes/No prompt before saving the setting
      if (setting.options[cursor].needConfirmation) {
        const confirmUpdateSetting = () => {
          globalScene.ui.revertMode();
          this.showText("");
          saveSetting();
        };
        const cancelUpdateSetting = () => {
          globalScene.ui.revertMode();
          this.showText("");
          // Put the cursor back to its previous position without saving or asking for confirmation again
          this.setOptionCursor(settingIndex, lastCursor, false);
        };

        const confirmationMessage =
          setting.options[cursor].confirmationMessage ?? i18next.t("settings:defaultConfirmMessage");
        globalScene.ui.showText(confirmationMessage, null, () => {
          globalScene.ui.setOverlayMode(UiMode.CONFIRM, confirmUpdateSetting, cancelUpdateSetting, null, null, 1, 750);
        });
      } else {
        saveSetting();
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
  setScrollCursor(scrollCursor: number): boolean {
    if (scrollCursor === this.scrollCursor) {
      return false;
    }

    this.scrollCursor = scrollCursor;
    this.scrollBar.setScrollCursor(this.scrollCursor);

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
    this.setScrollCursor(0);
    this.eraseCursor();
    this.getUi().bgmBar.toggleBgmBar(globalScene.showBgmBar);
    if (this.reloadRequired) {
      this.reloadRequired = false;
      globalScene.reset(true, false, true);
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

  override showText(
    text: string,
    delay?: number,
    callback?: AnyFn,
    callbackDelay?: number,
    prompt?: boolean,
    promptDelay?: number,
  ) {
    this.messageBoxContainer.setVisible(text?.length > 0);
    super.showText(text, delay, callback, callbackDelay, prompt, promptDelay);
  }
}
