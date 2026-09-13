import { globalScene } from "#app/global-scene";
import { settings } from "#app/global-settings-manager";
import { Button } from "#enums/buttons";
import type { Device } from "#enums/devices";
import { TextStyle } from "#enums/text-style";
import { UiMode } from "#enums/ui-mode";
import { getIconWithSettingName } from "#inputs/config-handler";
import type { CustomInterfaceConfig, InterfaceConfig, MappingSettingName } from "#types/inputs";
import type { InputsIcons, LayoutConfig } from "#types/ui-types";
import { ScrollBar } from "#ui/scroll-bar";
import { specialIconKeys, specialIcons } from "#ui/special-icons";
import { TabMenu } from "#ui/tab-menu";
import { addTextObject, getTextColor } from "#ui/text";
import { UiHandler } from "#ui/ui-handler";
import { addWindow } from "#ui/ui-theme";
import { toCamelCase } from "#utils/strings";
import i18next from "i18next";

/**
 * Abstract class for handling UI elements related to control settings.
 */
export abstract class BaseControlSettingsUiHandler extends UiHandler {
  protected settingsContainer: Phaser.GameObjects.Container;
  protected optionsContainer: Phaser.GameObjects.Container;
  protected tabMenu: TabMenu;
  protected readonly settingsTabs = [
    { mode: UiMode.SETTINGS_GENERAL, labelKey: "settings:general" },
    { mode: UiMode.SETTINGS_DISPLAY, labelKey: "settings:display" },
    { mode: UiMode.SETTINGS_AUDIO, labelKey: "settings:audio" },
    { mode: UiMode.SETTINGS_GAMEPAD, labelKey: "settings:gamepad" },
    { mode: UiMode.SETTINGS_KEYBOARD, labelKey: "settings:keyboard" },
  ];

  protected scrollBar: ScrollBar;
  protected scrollCursor: number;
  protected optionCursors: number[];
  protected cursorObj: Phaser.GameObjects.NineSlice | null;

  protected optionsBg: Phaser.GameObjects.NineSlice;
  protected actionsBg: Phaser.GameObjects.NineSlice;

  protected settingLabels: Phaser.GameObjects.Text[];
  protected optionValueLabels: Phaser.GameObjects.Text[][];

  // layout will contain the 3 Gamepad tab for each config - dualshock, xbox, snes
  protected layout: Map<string, LayoutConfig> = new Map<string, LayoutConfig>();
  // Will contain the input icons from the selected layout
  protected inputsIcons: InputsIcons;
  protected navigationIcons: InputsIcons;
  // list all the setting keys used in the selected layout (because dualshock has more buttons than xbox)
  protected keys: string[];

  // Store the specific settings related to key bindings for the current gamepad configuration.
  protected bindingSettings: MappingSettingName[];

  protected setting: Record<string, MappingSettingName>;
  protected settingBlacklisted: string[];
  protected settingDeviceDefaults;
  protected settingDeviceOptions;
  protected configs;
  protected commonSettingsCount;
  protected textureOverride;
  protected titleSelected;
  protected rowsToDisplay: number;
  protected device: Device;

  abstract setSetting(setting: MappingSettingName, value: number): boolean;

  constructor() {
    super();

    this.rowsToDisplay = 8;
  }

  public override setup(): void {
    const ui = this.getUi();
    this.navigationIcons = {};

    this.settingsContainer = globalScene.add.container(1, -globalScene.scaledCanvas.height + 1);
    this.settingsContainer.setName(`settings-${this.titleSelected}`);

    this.settingsContainer.setInteractive(
      new Phaser.Geom.Rectangle(0, 0, globalScene.scaledCanvas.width, globalScene.scaledCanvas.height),
      Phaser.Geom.Rectangle.Contains,
    );

    const tabLabels = this.settingsTabs.map(tab => i18next.t(tab.labelKey));
    const menuWidth = globalScene.scaledCanvas.width;

    this.tabMenu = new TabMenu(0, 0, menuWidth, tabLabels, newIndex => {
      globalScene.ui.setMode(this.settingsTabs[newIndex].mode);
    });

    const activeIndex = this.settingsTabs.findIndex(tab => tab.mode === ui.mode);
    if (activeIndex !== -1) {
      this.tabMenu.setIndex(activeIndex);
    }

    const navHeight = this.tabMenu.height;
    const navWidth = this.tabMenu.width;

    this.optionsBg = addWindow(
      0,
      navHeight,
      globalScene.scaledCanvas.width - 2,
      globalScene.scaledCanvas.height - 16 - navHeight - 2,
    ) //
      .setOrigin(0);

    this.actionsBg = addWindow(0, globalScene.scaledCanvas.height - navHeight, globalScene.scaledCanvas.width - 2, 22) //
      .setOrigin(0);

    /*
     * If there isn't enough space to fit all the icons and texts, there will be an overlap
     * This currently doesn't happen, but it's something to keep in mind.
     */

    const iconAction = globalScene.add
      .sprite(0, 0, "keyboard")
      .setOrigin(0, -0.1)
      .setPositionRelative(this.actionsBg, navWidth - 32, 4);
    this.navigationIcons["BUTTON_ACTION"] = iconAction;

    const actionText = addTextObject(0, 0, i18next.t("settings:action"), TextStyle.SETTINGS_LABEL) //
      .setOrigin(0, 0.15);
    actionText.setPositionRelative(iconAction, -actionText.width / 6 - 2, 0);

    const iconCancel = globalScene.add
      .sprite(0, 0, "keyboard")
      .setOrigin(0, -0.1)
      .setPositionRelative(this.actionsBg, actionText.x - 28, 4);
    this.navigationIcons["BUTTON_CANCEL"] = iconCancel;

    const cancelText = addTextObject(0, 0, i18next.t("settings:back"), TextStyle.SETTINGS_LABEL) //
      .setOrigin(0, 0.15);
    cancelText.setPositionRelative(iconCancel, -cancelText.width / 6 - 2, 0);

    const iconReset = globalScene.add
      .sprite(0, 0, "keyboard")
      .setOrigin(0, -0.1)
      .setPositionRelative(this.actionsBg, cancelText.x - 28, 4);
    this.navigationIcons["BUTTON_HOME"] = iconReset;

    const resetText = addTextObject(0, 0, i18next.t("settings:reset"), TextStyle.SETTINGS_LABEL) //
      .setOrigin(0, 0.15);
    resetText.setPositionRelative(iconReset, -resetText.width / 6 - 2, 0);

    this.settingsContainer.add([
      this.optionsBg,
      this.actionsBg,
      this.tabMenu,
      iconAction,
      iconCancel,
      iconReset,
      actionText,
      cancelText,
      resetText,
    ]);

    for (const config of this.configs) {
      this.layout[config.padType] = new Map();

      const optionsContainer = globalScene.add //
        .container()
        .setVisible(false);

      const bindingSettings = Object.keys(config.settings);

      const settingLabels: Phaser.GameObjects.Text[] = [];

      const optionValueLabels: Phaser.GameObjects.GameObject[][] = [];

      const inputsIcons: InputsIcons = {};

      const commonSettingKeys = Object.keys(this.setting)
        .slice(0, this.commonSettingsCount)
        .map(key => this.setting[key]);
      const specificBindingKeys = [...commonSettingKeys, ...Object.keys(config.settings)];
      const optionCursors = Object.values(
        Object.keys(this.settingDeviceDefaults)
          .filter(s => specificBindingKeys.includes(s))
          .map(k => this.settingDeviceDefaults[k]),
      );
      const settingFiltered = Object.keys(this.setting).filter(_key =>
        specificBindingKeys.includes(this.setting[_key]),
      );

      settingFiltered.forEach((setting, s) => {
        // Convert the setting key from format 'Key_Name' to 'Key name' for display.
        // TODO: IDK if this can be followed by both an underscore and a space, so leaving it as a regex matching both for now
        const i18nKey = toCamelCase(setting.replace(/ALT(_| )/, ""));

        const isLock = this.settingBlacklisted.includes(this.setting[setting]);
        const labelStyle = isLock ? TextStyle.SETTINGS_LOCKED : TextStyle.SETTINGS_LABEL;
        const isAlt = setting.includes("ALT");
        const labelText = i18next.t(`settings:${i18nKey}`) + (isAlt ? i18next.t("settings:alt") : "");
        settingLabels[s] = addTextObject(8, 28 + s * 16, labelText, labelStyle) //
          .setOrigin(0);
        optionsContainer.add(settingLabels[s]);

        const valueLabels: Phaser.GameObjects.GameObject[] = [];

        for (const [o, option] of this.settingDeviceOptions[this.setting[setting]].entries()) {
          if (bindingSettings.includes(this.setting[setting])) {
            if (o) {
              const valueLabel = addTextObject(0, 0, isLock ? "" : option, TextStyle.WINDOW) //
                .setOrigin(0);
              optionsContainer.add(valueLabel);
              valueLabels.push(valueLabel);
              continue;
            }
            const icon = globalScene.add
              .sprite(0, 0, this.textureOverride ? this.textureOverride : config.padType)
              .setOrigin(0, -0.15);
            inputsIcons[this.setting[setting]] = icon;
            optionsContainer.add(icon);
            valueLabels.push(icon);
            continue;
          }
          const valueLabelStyle =
            this.settingDeviceDefaults[this.setting[setting]] === o ? TextStyle.SETTINGS_SELECTED : TextStyle.WINDOW;
          const valueLabel = addTextObject(0, 0, option, valueLabelStyle) //
            .setOrigin(0);

          optionsContainer.add(valueLabel);

          valueLabels.push(valueLabel);
        }
        optionValueLabels.push(valueLabels);

        const totalWidth = optionValueLabels[s]
          .map(o => (o as Phaser.GameObjects.Text).width)
          .reduce((total, width) => (total += width), 0);

        const labelWidth = Math.max(130, settingLabels[s].displayWidth + 8);

        const totalSpace = 297 - labelWidth - totalWidth / 6;
        const optionSpacing = Math.floor(totalSpace / (optionValueLabels[s].length - 1));

        let xOffset = 0;

        for (const value of optionValueLabels[s]) {
          (value as Phaser.GameObjects.Text).setPositionRelative(settingLabels[s], labelWidth + xOffset, 0);
          xOffset += (value as Phaser.GameObjects.Text).width / 6 + optionSpacing;
        }
      });

      this.layout[config.padType].optionsContainer = optionsContainer;
      this.layout[config.padType].inputsIcons = inputsIcons;
      this.layout[config.padType].settingLabels = settingLabels;
      this.layout[config.padType].optionValueLabels = optionValueLabels;
      this.layout[config.padType].optionCursors = optionCursors;
      this.layout[config.padType].keys = specificBindingKeys;
      this.layout[config.padType].bindingSettings = bindingSettings;

      this.settingsContainer.add(optionsContainer);
    }

    this.scrollBar = new ScrollBar(
      this.optionsBg.width - 9,
      this.optionsBg.y + 5,
      4,
      this.optionsBg.height - 11,
      this.rowsToDisplay,
    );
    this.settingsContainer.add(this.scrollBar);

    ui.add(this.settingsContainer);

    this.settingsContainer.setVisible(false);
  }

  /**
   * @returns The active configuration for current device
   */
  protected getActiveConfig(): CustomInterfaceConfig | null {
    return globalScene.inputController.getActiveConfig(this.device);
  }

  /**
   * Update the bindings for the current active device configuration.
   */
  public updateBindings(): void {
    this.layout.keys().forEach(key => this.layout[key].optionsContainer.setVisible(false));
    const activeConfig = this.getActiveConfig();

    // Set the UI layout for the active configuration. If unsuccessful, exit the function early.
    // Note: `setLayout` is always invoked here (even when `activeConfig` is null) because it is
    // responsible for displaying the "no gamepad connected" fallback message in that case.
    if (!this.setLayout(activeConfig)) {
      return;
    }

    this.keys.forEach((key, index) => {
      if (key === "enabled") {
        this.setOptionCursor(index, settings.gamepad[key] ? Number(!settings.gamepad[key]) : this.optionCursors[index]);
      }
    });

    // If the active configuration has no custom bindings set, exit the function early.
    // by default, if custom does not exists, a default is assigned to it
    // it only means the gamepad is not yet initalized
    if (!activeConfig.custom) {
      return;
    }

    for (const elm of this.bindingSettings) {
      const icon = getIconWithSettingName(activeConfig, elm);
      if (icon) {
        this.inputsIcons[elm] //
          .setFrame(icon)
          .setAlpha(1);
      } else {
        this.inputsIcons[elm].alpha = 0;
      }
    }

    this.setCursor(this.cursor);
    this.setScrollCursor(this.scrollCursor);
  }

  private updateNavigationDisplay(): void {
    for (const settingName of Object.keys(this.navigationIcons)) {
      if (specialIconKeys.includes(settingName)) {
        this.navigationIcons[settingName] //
          .setTexture("keyboard")
          .setFrame(specialIcons[settingName])
          .setAlpha(1);
        continue;
      }
      const inputController = globalScene.inputController;
      // cast is fine here. If it doesn't match, it will just return undefined
      const icon = inputController?.getIconForLatestInputRecorded(settingName as MappingSettingName);
      const type = inputController?.getLastSourceType();
      if (icon != null && type != null) {
        this.navigationIcons[settingName] //
          .setTexture(type)
          .setFrame(icon)
          .setAlpha(1);
      } else {
        this.navigationIcons[settingName].alpha = 0;
      }
    }
  }

  public override show(args: any[]): boolean {
    super.show(args);

    const { ui } = globalScene;

    const activeIndex = this.settingsTabs.findIndex(tab => tab.mode === ui.mode);
    if (activeIndex !== -1) {
      this.tabMenu.setIndex(activeIndex);
    }

    this.updateNavigationDisplay();
    this.tabMenu.updateIcons();
    this.updateBindings();

    this.settingsContainer.setVisible(true);
    this.resetScroll();

    ui.moveTo(this.settingsContainer, ui.length - 1);

    ui.hideTooltip();

    return true;
  }

  /**
   * Set the UI layout for the active device configuration.
   *
   * @param activeConfig - The active device configuration.
   * @returns Whether the layout was successfully applied.
   */
  protected setLayout(activeConfig: InterfaceConfig | null): activeConfig is InterfaceConfig {
    // Check if there is no active configuration (e.g., no gamepad connected).
    if (!activeConfig) {
      const layout = this.layout["noGamepads"];
      layout.optionsContainer.setVisible(true);
      return false;
    }
    const noGamepads = this.layout["noGamepads"];
    noGamepads?.optionsContainer?.setVisible(false);
    const configType = activeConfig.padType;

    const layout = this.layout[configType];
    this.keys = layout.keys;
    this.optionsContainer = layout.optionsContainer;
    this.optionsContainer.setVisible(true);
    this.settingLabels = layout.settingLabels;
    this.optionValueLabels = layout.optionValueLabels;
    this.optionCursors = layout.optionCursors;
    this.inputsIcons = layout.inputsIcons;
    this.bindingSettings = layout.bindingSettings;
    this.scrollBar.setTotalRows(layout.settingLabels.length);
    this.scrollBar.setScrollCursor(0);

    return true;
  }

  /**
   * Process the input for the given button.
   *
   * @param button - The button to process.
   * @returns Whether the input was processed successfully.
   */
  public override processInput(button: Button): boolean {
    const ui = this.getUi();
    let success = false;
    this.updateNavigationDisplay();

    if (button === Button.CANCEL) {
      success = true;
      globalScene.ui.revertMode();
    } else {
      const cursor = this.cursor + this.scrollCursor;
      const setting = this.setting[Object.keys(this.setting)[cursor]];
      switch (button) {
        case Button.ACTION:
          if (!this.optionCursors || !this.optionValueLabels) {
            return false; // TODO: is false correct as default? (previously was `undefined`)
          }
          if (this.settingBlacklisted.includes(setting) || !setting.includes("BUTTON_")) {
            success = false;
          } else {
            success = this.setSetting(setting, 1);
          }
          break;
        case Button.UP:
          if (!this.optionValueLabels) {
            return false;
          }
          if (cursor) {
            if (this.cursor) {
              success = this.setCursor(this.cursor - 1);
            } else {
              success = this.setScrollCursor(this.scrollCursor - 1);
            }
          } else {
            const successA = this.setCursor(this.rowsToDisplay - 1);
            const successB = this.setScrollCursor(this.optionValueLabels.length - this.rowsToDisplay);
            success = successA && successB;
          }
          break;
        case Button.DOWN:
          if (!this.optionValueLabels) {
            return false;
          }
          if (cursor < this.optionValueLabels.length - 1) {
            if (this.cursor < this.rowsToDisplay - 1) {
              success = this.setCursor(this.cursor + 1);
            } else if (this.scrollCursor < this.optionValueLabels.length - this.rowsToDisplay) {
              success = this.setScrollCursor(this.scrollCursor + 1);
            }
          } else {
            const successA = this.setCursor(0);
            const successB = this.setScrollCursor(0);
            success = successA && successB;
          }
          break;
        case Button.LEFT:
          if (!this.optionCursors || !this.optionValueLabels) {
            return false; // TODO: is false correct as default? (previously was `undefined`)
          }
          if (this.settingBlacklisted.includes(setting) || setting.includes("BUTTON_")) {
            success = false;
          } else {
            success = this.setOptionCursor(
              cursor,
              Phaser.Math.Wrap(this.optionCursors[cursor] - 1, 0, this.optionValueLabels[cursor].length),
              true,
            );
          }
          break;
        case Button.RIGHT:
          if (!this.optionCursors || !this.optionValueLabels) {
            return false; // TODO: is false correct as default? (previously was `undefined`)
          }
          if (this.settingBlacklisted.includes(setting) || setting.includes("BUTTON_")) {
            success = false;
          } else {
            success = this.setOptionCursor(
              cursor,
              Phaser.Math.Wrap(this.optionCursors[cursor] + 1, 0, this.optionValueLabels[cursor].length),
              true,
            );
          }
          break;
        case Button.CYCLE_FORM:
        case Button.CYCLE_SHINY:
          success = this.tabMenu.navigate(button);
          break;
      }
    }

    if (success) {
      ui.playSelect();
    }

    return success;
  }

  protected resetScroll(): void {
    this.cursorObj?.destroy();
    this.cursorObj = null;
    this.cursor = 0;
    this.setCursor(0);
    this.setScrollCursor(0);
    this.updateSettingsScroll();
  }

  /**
   * Set the cursor to the specified position.
   *
   * @param cursor - The cursor position to set.
   * @returns Whether the cursor was set successfully.
   */
  public override setCursor(cursor: number): boolean {
    const ret = super.setCursor(cursor);
    if (!this.optionsContainer) {
      return ret;
    }

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
   * Set the scroll cursor to the specified position.
   *
   * @param scrollCursor - The scroll cursor position to set.
   * @returns Whether the scroll cursor was set successfully.
   */
  public setScrollCursor(scrollCursor: number): boolean {
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
   * Set the option cursor to the specified position.
   *
   * @param settingIndex - The index of the setting.
   * @param cursor - The cursor position to set.
   * @param save - Whether to save the setting to local storage.
   * @returns Whether the option cursor was set successfully.
   */
  public setOptionCursor(settingIndex: number, cursor: number, save?: boolean): boolean {
    const setting = this.setting[Object.keys(this.setting)[settingIndex]];

    const lastCursor = this.optionCursors[settingIndex];

    // Check if the setting is not part of the bindings (i.e., it's a regular setting).
    if (!this.bindingSettings.includes(setting) && !setting.includes("BUTTON_")) {
      const lastValueLabel =
        this.optionValueLabels[settingIndex][lastCursor] ?? this.optionValueLabels[settingIndex][0];
      lastValueLabel.setColor(getTextColor(TextStyle.WINDOW));
      lastValueLabel.setShadowColor(getTextColor(TextStyle.WINDOW, true));

      this.optionCursors[settingIndex] = cursor;

      (this.optionValueLabels[settingIndex][cursor] ?? this.optionValueLabels[settingIndex][0])
        .setColor(getTextColor(TextStyle.SETTINGS_SELECTED))
        .setShadowColor(getTextColor(TextStyle.SETTINGS_SELECTED, true));
    }

    if (save) {
      this.setSetting(setting, cursor);
    }

    return true;
  }

  /** Update the scroll position of the settings UI. */
  private updateSettingsScroll(): void {
    if (!this.optionsContainer) {
      return;
    }

    this.optionsContainer.setY(-16 * this.scrollCursor);

    for (let s = 0; s < this.settingLabels.length; s++) {
      const visible = s >= this.scrollCursor && s < this.scrollCursor + this.rowsToDisplay;

      this.settingLabels[s].setVisible(visible);
      for (const option of this.optionValueLabels[s]) {
        option.setVisible(visible);
      }
    }
  }

  public override clear(): void {
    super.clear();

    this.settingsContainer.setVisible(false);

    this.eraseCursor();
  }

  /** Erase the cursor from the UI. */
  private eraseCursor(): void {
    this.cursorObj?.destroy();

    this.cursorObj = null;
  }
}
