import { eventBus } from "#app/event-bus";
import { globalScene } from "#app/global-scene";
import { Button } from "#enums/buttons";
import { TextStyle } from "#enums/text-style";
import { UiMode } from "#enums/ui-mode";
import { settings as settingsManager } from "#system/settings-manager";
import type { MappingSettingName } from "#types/configs/inputs";
import type { SettingsCategory, SettingsUiItem } from "#types/settings";
import type { InputsIcons } from "#types/ui-types";
import { TabMenu } from "#ui/containers/tab-menu";
import { MessageUiHandler } from "#ui/message-ui-handler";
import { ScrollBar } from "#ui/scroll-bar";
import { addTextObject, getTextColor } from "#ui/text";
import type { TitleUiHandler } from "#ui/title-ui-handler";
import { addWindow } from "#ui/ui-theme";
import { hasTouchscreen } from "#utils/app-utils";
import { capitalizeFirstLetter } from "#utils/strings";
import i18next from "i18next";

/**
 * Abstract class for handling UI elements related to settings.
 */
export class BaseSettingsUiHandler extends MessageUiHandler {
  private settingsContainer: Phaser.GameObjects.Container;
  private optionsContainer: Phaser.GameObjects.Container;
  private messageBoxContainer: Phaser.GameObjects.Container;
  protected tabMenu: TabMenu;
  protected readonly settingsTabs = [
    { mode: UiMode.SETTINGS, labelKey: "settings:general" },
    { mode: UiMode.SETTINGS_DISPLAY, labelKey: "settings:display" },
    { mode: UiMode.SETTINGS_AUDIO, labelKey: "settings:audio" },
    { mode: UiMode.SETTINGS_GAMEPAD, labelKey: "settings:gamepad" },
    { mode: UiMode.SETTINGS_KEYBOARD, labelKey: "settings:keyboard" },
  ];

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

  protected uiItems: SettingsUiItem[];
  protected category: SettingsCategory;

  constructor(category: SettingsCategory, uiItems: SettingsUiItem[]) {
    super(null);

    this.category = category;

    if (hasTouchscreen()) {
      this.uiItems = uiItems;
    } else {
      this.uiItems = uiItems.filter(uiItem => !uiItem.touchscreenOnly);
    }

    this.reloadRequired = false;
    this.rowsToDisplay = 8;
    this.title = capitalizeFirstLetter(category);
  }

  public override setup(): void {
    const ui = this.getUi();
    const canvasWidth = globalScene.scaledCanvas.width;
    const canvasHeight = globalScene.scaledCanvas.height;

    this.settingsContainer = globalScene.add
      .container(1, -canvasHeight + 1)
      .setName(`settings-${this.title}`)
      .setInteractive(new Phaser.Geom.Rectangle(0, 0, canvasWidth, canvasHeight - 20), Phaser.Geom.Rectangle.Contains);

    this.navigationIcons = {};

    const tabLabels = this.settingsTabs.map(tab => i18next.t(tab.labelKey));

    const menuWidth = globalScene.scaledCanvas.width;

    this.tabMenu = new TabMenu(0, 0, menuWidth, tabLabels, newIndex => {
      globalScene.ui.setMode(this.settingsTabs[newIndex].mode);
    });

    const activeIndex = this.settingsTabs.findIndex(tab => tab.mode === this.getUi().getMode());
    if (activeIndex !== -1) {
      this.tabMenu.setIndex(activeIndex);
    }
    const navHeight = this.tabMenu.height;
    const navWidth = this.tabMenu.width;
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
    this.uiItems.forEach((uiItem, i) => {
      let settingName = uiItem.label;
      if (uiItem?.requiresReload) {
        settingName += "*";
        anyReloadRequired = true;
      }

      this.settingLabels[i] = addTextObject(8, 28 + i * 16, settingName, TextStyle.SETTINGS_LABEL).setOrigin(0);

      this.optionsContainer.add(this.settingLabels[i]);
      this.optionValueLabels.push(
        uiItem.options.map(option => {
          const valueLabel = addTextObject(0, 0, option.label, TextStyle.SETTINGS_VALUE) //
            .setOrigin(0);

          this.optionsContainer.add(valueLabel);

          return valueLabel;
        }),
      );

      const totalWidth = this.optionValueLabels[i].map(o => o.width).reduce((total, width) => (total += width), 0);

      const labelWidth = Math.max(78, this.settingLabels[i].displayWidth + 8);

      const totalSpace = 297 - labelWidth - totalWidth / 6;
      const optionSpacing = Math.floor(totalSpace / (this.optionValueLabels[i].length - 1));

      let xOffset = 0;

      for (const value of this.optionValueLabels[i]) {
        value.setPositionRelative(this.settingLabels[i], labelWidth + xOffset, 0);
        xOffset += value.width / 6 + optionSpacing;
      }
    });

    // Treat all settings as having the first options selected. These get properly updated in show()
    this.optionCursors = new Array(this.uiItems.length).fill(0);

    this.scrollBar = new ScrollBar(
      this.optionsBg.width - 9,
      this.optionsBg.y + 5,
      4,
      this.optionsBg.height - 11,
      this.rowsToDisplay,
    );
    this.scrollBar.setTotalRows(this.uiItems.length);

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
      this.tabMenu,
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
  protected updateBindings(): void {
    for (const settingName of Object.keys(this.navigationIcons)) {
      if (settingName === "BUTTON_HOME") {
        this.navigationIcons[settingName].setTexture("keyboard").setFrame("HOME.png").alpha = 1;
        continue;
      }
      const inputController = globalScene.inputController;
      const icon = inputController?.getIconForLatestInputRecorded(settingName as MappingSettingName);
      const type = inputController?.getLastSourceType();
      if (icon && type != null) {
        this.navigationIcons[settingName].setTexture(type).setFrame(icon).setAlpha(1);
      } else {
        this.navigationIcons[settingName].alpha = 0;
      }
    }
    this.tabMenu?.updateIcons();
  }

  /**
   * Show the UI with the provided arguments.
   *
   * @param args - Arguments to be passed to the show method.
   * @returns `true` if successful.
   */
  public override show(args: any[]): boolean {
    super.show(args);
    const activeIndex = this.settingsTabs.findIndex(tab => tab.mode === this.getUi().getMode());
    if (activeIndex !== -1) {
      this.tabMenu.setIndex(activeIndex);
    }
    this.updateBindings();

    this.uiItems.forEach((uiItem, s) => {
      const value = settingsManager[this.category][uiItem.key];
      let index = 0;

      if (value !== undefined) {
        index = uiItem.options.findIndex(option => option.value === value);
      }

      if (index < 0) {
        console.warn(
          `Could not find index for ${uiItem.key}.`,
          `\nExpected value: ${settingsManager[this.category][uiItem.key]}`,
          "\nAvailable values:",
          uiItem.options,
        );
      }
      this.setOptionCursor(s, Math.max(index, 0));
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
    if (this.uiItems[cursor]?.clamp) {
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
  public override processInput(button: Button): boolean {
    const ui = this.getUi();

    let success = false;

    if (button === Button.CANCEL) {
      success = true;
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
            success = successA || successB; // success is just there to play the little validation sound effect
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
            success = successA || successB; // Indicates a successful cursor and scroll adjustment.
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
          success = this.tabMenu.navigate(button);
          break;
        case Button.ACTION:
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
  public override setCursor(cursor: number): boolean {
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
  public setOptionCursor(settingIndex: number, cursor: number, save?: boolean): boolean {
    if (settingIndex === -1) {
      settingIndex = this.cursor + this.scrollCursor;
    }
    const uiItem = this.uiItems[settingIndex];
    const lastCursor = this.optionCursors[settingIndex];

    this.optionValueLabels[settingIndex][lastCursor]
      .setColor(getTextColor(TextStyle.SETTINGS_VALUE))
      .setShadowColor(getTextColor(TextStyle.SETTINGS_VALUE, true));

    this.optionCursors[settingIndex] = cursor;

    this.optionValueLabels[settingIndex][cursor]
      .setColor(getTextColor(TextStyle.SETTINGS_SELECTED))
      .setShadowColor(getTextColor(TextStyle.SETTINGS_SELECTED, true));

    // skip save if the option isn't changing
    if (cursor === lastCursor) {
      return false;
    }

    if (save) {
      const value = uiItem.options[cursor].value;

      // For settings that ask for confirmation, display confirmation message and a Yes/No prompt before saving the setting
      if (uiItem.options[cursor]?.requiresConfirmation) {
        const confirmUpdateSetting = () => {
          globalScene.ui.revertMode();
          this.showText("");
          this.handleSaveSetting(uiItem, value);
        };
        const cancelUpdateSetting = () => {
          globalScene.ui.revertMode();
          this.showText("");
          // Put the cursor back to its previous position without saving or asking for confirmation again
          this.setOptionCursor(settingIndex, lastCursor, false);
        };

        const confirmationMessage =
          uiItem.options[cursor].confirmationMessage ?? i18next.t("settings:defaultConfirmMessage");
        globalScene.ui.showText(confirmationMessage, null, () => {
          globalScene.ui.setOverlayMode(UiMode.CONFIRM, confirmUpdateSetting, cancelUpdateSetting, null, null, 1, 750);
        });
      } else {
        this.handleSaveSetting<typeof value>(uiItem, value);
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
  protected setScrollCursor(scrollCursor: number): boolean {
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
  private updateSettingsScroll(): void {
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
  public override clear(): void {
    super.clear();
    this.settingsContainer.setVisible(false);
    this.setScrollCursor(0);
    this.eraseCursor();
    this.getUi().bgmBar.toggleBgmBar(settingsManager.display.showBgmBar);
    (this.getUi().handlers[UiMode.TITLE] as TitleUiHandler)?.updateUsername();
    if (this.reloadRequired) {
      this.reloadRequired = false;
      globalScene.reset(true, false, true);
    }
  }

  /**
   * Erase the cursor from the UI.
   */
  protected eraseCursor(): void {
    if (this.cursorObj) {
      this.cursorObj.destroy();
    }
    this.cursorObj = null;
  }

  public override showText(
    text: string,
    delay?: number,
    callback?: () => void,
    callbackDelay?: number,
    prompt?: boolean,
    promptDelay?: number,
  ): void {
    this.messageBoxContainer.setVisible(text?.length > 0);
    super.showText(text, delay, callback, callbackDelay, prompt, promptDelay);
  }

  protected updateOptionValueLabel(settingIndex: number, optionIndex: number, newLabel: string) {
    this.optionValueLabels[settingIndex][optionIndex].setText(newLabel);
  }

  private handleSaveSetting<V = any>(uiItem: SettingsUiItem, newValue: V): void {
    const { key, requiresReload } = uiItem;

    if (this.category === "display" && key === "language") {
      eventBus.emit("language/change", newValue);
      return;
    }

    if (this.category === "general" && uiItem.key === "moveTouchControls") {
      eventBus.emit("touchControls/move/start");
      eventBus.once("touchControls/move/end", () => {
        this.setOptionCursor(-1, 0, false);
      });
      return;
    }

    if (requiresReload) {
      if (this.canLoseProgress()) {
        this.showConfirm(
          i18next.t("menuUiHandler:losingProgressionWarning"),
          () => {
            this.reloadRequired = true;
            settingsManager.update(this.category, key as never, newValue);
          },
          () => this.handleCancelConfirm(uiItem),
        );
        return;
      }

      this.reloadRequired = true;
    }

    settingsManager.update(this.category, key as never, newValue);
  }

  protected canLoseProgress(): boolean {
    return globalScene.currentBattle?.turn > 1;
  }

  protected showConfirm(text: string, onConfirm: () => void, onCancel?: () => void) {
    this.showText(text, undefined, () => {
      globalScene.ui.setOverlayMode(
        UiMode.CONFIRM,
        () => {
          // revert confirm mode.
          globalScene.ui.revertMode();
          // revert settings mode.
          globalScene.ui.revertMode();
          this.showText("", 0);
          onConfirm();
        },
        () => {
          globalScene.ui.revertMode();
          this.showText("", 0);
          onCancel?.();
        },
        false,
        0,
        0,
      );
    });
  }

  protected handleCancelConfirm(uiItem: SettingsUiItem) {
    const { key, options } = uiItem;

    const oldValue = settingsManager[this.category][key];
    const oldOptionIndex = options.findIndex(option => option.value === oldValue);
    this.setOptionCursor(-1, Math.max(oldOptionIndex, 0), false);
  }
}
