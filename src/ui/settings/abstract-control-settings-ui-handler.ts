import UiHandler from "../ui-handler";
import BattleScene from "../../battle-scene";
import {Mode} from "../ui";
import {InterfaceConfig} from "../../inputs-controller";
import {addWindow} from "../ui-theme";
import {addTextObject, TextStyle} from "../text";
import {Button} from "../../enums/buttons";
import {getIconWithSettingName} from "#app/configs/inputs/configHandler";
import NavigationMenu, {NavigationManager} from "#app/ui/settings/navigationMenu";
import { Device } from "#app/enums/devices.js";

export interface InputsIcons {
    [key: string]: Phaser.GameObjects.Sprite;
}

export interface LayoutConfig {
    optionsContainer: Phaser.GameObjects.Container;
    inputsIcons: InputsIcons;
    settingLabels: Phaser.GameObjects.Text[];
    optionValueLabels: Phaser.GameObjects.Text[][];
    optionCursors: integer[];
    keys: string[];
    bindingSettings: Array<String>;
}
/**
 * Abstract class for handling UI elements related to control settings.
 */
export default abstract class AbstractControlSettingsUiHandler extends UiHandler {
  protected settingsContainer: Phaser.GameObjects.Container;
  protected optionsContainer: Phaser.GameObjects.Container;
  protected navigationContainer: NavigationMenu;

  protected scrollCursor: integer;
  protected optionCursors: integer[];
  protected cursorObj: Phaser.GameObjects.NineSlice;

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
  protected keys: Array<String>;

  // Store the specific settings related to key bindings for the current gamepad configuration.
  protected bindingSettings: Array<String>;

  protected setting;
  protected settingBlacklisted;
  protected settingDeviceDefaults;
  protected settingDeviceOptions;
  protected configs;
  protected commonSettingsCount;
  protected textureOverride;
  protected titleSelected;
  protected localStoragePropertyName;
  protected rowsToDisplay: number;
  protected device: Device;

  abstract saveSettingToLocalStorage(setting, cursor): void;
  abstract setSetting(scene: BattleScene, setting, value: integer): boolean;

  /**
   * Constructor for the AbstractSettingsUiHandler.
   *
   * @param scene - The BattleScene instance.
   * @param mode - The UI mode.
   */
  constructor(scene: BattleScene, mode?: Mode) {
    super(scene, mode);
    this.rowsToDisplay = 8;
  }

  getLocalStorageSetting(): object {
    // Retrieve the settings from local storage or use an empty object if none exist.
    const settings: object = localStorage.hasOwnProperty(this.localStoragePropertyName) ? JSON.parse(localStorage.getItem(this.localStoragePropertyName)) : {};
    return settings;
  }

  /**
   * Setup UI elements.
   */
  setup() {
    const ui = this.getUi();
    this.navigationIcons = {};

    this.settingsContainer = this.scene.add.container(1, -(this.scene.game.canvas.height / 6) + 1);

    this.settingsContainer.setInteractive(new Phaser.Geom.Rectangle(0, 0, this.scene.game.canvas.width / 6, this.scene.game.canvas.height / 6), Phaser.Geom.Rectangle.Contains);

    this.navigationContainer = new NavigationMenu(this.scene, 0, 0);

    this.optionsBg = addWindow(this.scene, 0, this.navigationContainer.height, (this.scene.game.canvas.width / 6) - 2, (this.scene.game.canvas.height / 6) - 16 - this.navigationContainer.height - 2);
    this.optionsBg.setOrigin(0, 0);


    this.actionsBg = addWindow(this.scene, 0, (this.scene.game.canvas.height / 6) - this.navigationContainer.height, (this.scene.game.canvas.width / 6) - 2, 22);
    this.actionsBg.setOrigin(0, 0);

    const iconAction = this.scene.add.sprite(0, 0, "keyboard");
    iconAction.setOrigin(0, -0.1);
    iconAction.setPositionRelative(this.actionsBg, this.navigationContainer.width - 32, 4);
    this.navigationIcons["BUTTON_ACTION"] = iconAction;

    const actionText = addTextObject(this.scene, 0, 0, "Action", TextStyle.SETTINGS_LABEL);
    actionText.setOrigin(0, 0.15);
    actionText.setPositionRelative(iconAction, -actionText.width/6-2, 0);

    const iconCancel = this.scene.add.sprite(0, 0, "keyboard");
    iconCancel.setOrigin(0, -0.1);
    iconCancel.setPositionRelative(this.actionsBg, this.navigationContainer.width - 100, 4);
    this.navigationIcons["BUTTON_CANCEL"] = iconCancel;

    const cancelText = addTextObject(this.scene, 0, 0, "Cancel", TextStyle.SETTINGS_LABEL);
    cancelText.setOrigin(0, 0.15);
    cancelText.setPositionRelative(iconCancel, -cancelText.width/6-2, 0);

    const iconReset = this.scene.add.sprite(0, 0, "keyboard");
    iconReset.setOrigin(0, -0.1);
    iconReset.setPositionRelative(this.actionsBg, this.navigationContainer.width - 180, 4);
    this.navigationIcons["BUTTON_HOME"] = iconReset;

    const resetText = addTextObject(this.scene, 0, 0, "Reset all", TextStyle.SETTINGS_LABEL);
    resetText.setOrigin(0, 0.15);
    resetText.setPositionRelative(iconReset, -resetText.width/6-2, 0);

    this.settingsContainer.add(this.optionsBg);
    this.settingsContainer.add(this.actionsBg);
    this.settingsContainer.add(this.navigationContainer);
    this.settingsContainer.add(iconAction);
    this.settingsContainer.add(iconCancel);
    this.settingsContainer.add(iconReset);
    this.settingsContainer.add(actionText);
    this.settingsContainer.add(cancelText);
    this.settingsContainer.add(resetText);

    /// Initialize a new configuration "screen" for each type of gamepad.
    for (const config of this.configs) {
      // Create a map to store layout settings based on the pad type.
      this.layout[config.padType] = new Map();
      // Create a container for gamepad options in the scene, initially hidden.

      const optionsContainer = this.scene.add.container(0, 0);
      optionsContainer.setVisible(false);

      // Gather all binding settings from the configuration.
      const bindingSettings = Object.keys(config.settings);

      // Array to hold labels for different settings such as 'Controller', 'Gamepad Support', etc.
      const settingLabels: Phaser.GameObjects.Text[] = [];

      // Array to hold options for each setting, e.g., 'Auto', 'Disabled'.
      const optionValueLabels: Phaser.GameObjects.GameObject[][] = [];

      // Object to store sprites for each button configuration.
      const inputsIcons: InputsIcons = {};

      // Fetch common setting keys such as 'Controller' and 'Gamepad Support' from gamepad settings.
      const commonSettingKeys = Object.keys(this.setting).slice(0, this.commonSettingsCount).map(key => this.setting[key]);
      // Combine common and specific bindings into a single array.
      const specificBindingKeys = [...commonSettingKeys, ...Object.keys(config.settings)];
      // Fetch default values for these settings and prepare to highlight selected options.
      const optionCursors = Object.values(Object.keys(this.settingDeviceDefaults).filter(s => specificBindingKeys.includes(s)).map(k => this.settingDeviceDefaults[k]));
      // Filter out settings that are not relevant to the current gamepad configuration.
      const settingFiltered = Object.keys(this.setting).filter(_key => specificBindingKeys.includes(this.setting[_key]));
      // Loop through the filtered settings to manage display and options.

      settingFiltered.forEach((setting, s) => {
        // Convert the setting key from format 'Key_Name' to 'Key name' for display.
        const settingName = setting.replace(/\_/g, " ");

        // Create and add a text object for the setting name to the scene.
        const isLock = this.settingBlacklisted.includes(this.setting[setting]);
        const labelStyle = isLock ? TextStyle.SETTINGS_LOCKED : TextStyle.SETTINGS_LABEL;
        settingLabels[s] = addTextObject(this.scene, 8, 28 + s * 16, settingName, labelStyle);
        settingLabels[s].setOrigin(0, 0);
        optionsContainer.add(settingLabels[s]);

        // Initialize an array to store the option labels for this setting.
        const valueLabels: Phaser.GameObjects.GameObject[] = [];

        // Process each option for the current setting.
        for (const [o, option] of this.settingDeviceOptions[this.setting[setting]].entries()) {
          // Check if the current setting is for binding keys.
          if (bindingSettings.includes(this.setting[setting])) {
            // Create a label for non-null options, typically indicating actionable options like 'change'.
            if (o) {
              const valueLabel = addTextObject(this.scene, 0, 0, isLock ? "" : option, TextStyle.WINDOW);
              valueLabel.setOrigin(0, 0);
              optionsContainer.add(valueLabel);
              valueLabels.push(valueLabel);
              continue;
            }
            // For null options, add an icon for the key.
            const icon = this.scene.add.sprite(0, 0, this.textureOverride ? this.textureOverride : config.padType);
            icon.setOrigin(0, -0.15);
            inputsIcons[this.setting[setting]] = icon;
            optionsContainer.add(icon);
            valueLabels.push(icon);
            continue;
          }
          // For regular settings like 'Gamepad support', create a label and determine if it is selected.
          const valueLabel = addTextObject(this.scene, 0, 0, option, this.settingDeviceDefaults[this.setting[setting]] === o ? TextStyle.SETTINGS_SELECTED : TextStyle.WINDOW);
          valueLabel.setOrigin(0, 0);

          optionsContainer.add(valueLabel);

          //if a setting has 2 options, valueLabels will be an array of 2 elements
          valueLabels.push(valueLabel);
        }
        // Collect all option labels for this setting into the main array.
        optionValueLabels.push(valueLabels);

        // Calculate the total width of all option labels within a specific setting
        // This is achieved by summing the width of each option label
        const totalWidth = optionValueLabels[s].map((o) => (o as Phaser.GameObjects.Text).width).reduce((total, width) => total += width, 0);

        // Define the minimum width for a label, ensuring it's at least 78 pixels wide or the width of the setting label plus some padding
        const labelWidth = Math.max(130, settingLabels[s].displayWidth + 8);

        // Calculate the total available space for placing option labels next to their setting label
        // We reserve space for the setting label and then distribute the remaining space evenly
        const totalSpace = (300 - labelWidth) - totalWidth / 6;
        // Calculate the spacing between options based on the available space divided by the number of gaps between labels
        const optionSpacing = Math.floor(totalSpace / (optionValueLabels[s].length - 1));

        // Initialize xOffset to zero, which will be used to position each option label horizontally
        let xOffset = 0;

        // Start positioning each option label one by one
        for (const value of optionValueLabels[s]) {
          // Set the option label's position right next to the setting label, adjusted by xOffset
          (value as Phaser.GameObjects.Text).setPositionRelative(settingLabels[s], labelWidth + xOffset, 0);
          // Move the xOffset to the right for the next label, ensuring each label is spaced evenly
          xOffset += (value as Phaser.GameObjects.Text).width / 6 + optionSpacing;
        }
      });

      // Assigning the newly created components to the layout map under the specific gamepad type.
      this.layout[config.padType].optionsContainer = optionsContainer; // Container for this pad's options.
      this.layout[config.padType].inputsIcons = inputsIcons; // Icons for each input specific to this pad.
      this.layout[config.padType].settingLabels = settingLabels; // Text labels for each setting available on this pad.
      this.layout[config.padType].optionValueLabels = optionValueLabels; // Labels for values corresponding to each setting.
      this.layout[config.padType].optionCursors = optionCursors; // Cursors to navigate through the options.
      this.layout[config.padType].keys = specificBindingKeys; // Keys that identify each setting specifically bound to this pad.
      this.layout[config.padType].bindingSettings = bindingSettings; // Settings that define how the keys are bound.

      // Add the options container to the overall settings container to be displayed in the UI.
      this.settingsContainer.add(optionsContainer);
    }
    // Add the settings container to the UI.
    ui.add(this.settingsContainer);

    // Initially hide the settings container until needed (e.g., when a gamepad is connected or a button is pressed).
    this.settingsContainer.setVisible(false);
  }

  /**
   * Get the active configuration.
   *
   * @returns The active configuration for current device
   */
  getActiveConfig(): InterfaceConfig {
    return this.scene.inputController.getActiveConfig(this.device);
  }

  /**
   * Update the bindings for the current active device configuration.
   */
  updateBindings(): void {
    // Hide the options container for all layouts to reset the UI visibility.
    Object.keys(this.layout).forEach((key) => this.layout[key].optionsContainer.setVisible(false));
    // Fetch the active gamepad configuration from the input controller.
    const activeConfig = this.getActiveConfig();

    // Set the UI layout for the active configuration. If unsuccessful, exit the function early.
    if (!this.setLayout(activeConfig)) {
      return;
    }

    // Retrieve the gamepad settings from local storage or use an empty object if none exist.
    const settings: object = this.getLocalStorageSetting();

    // Update the cursor for each key based on the stored settings or default cursors.
    this.keys.forEach((key, index) => {
      this.setOptionCursor(index, settings.hasOwnProperty(key as string) ? settings[key as string] : this.optionCursors[index]);
    });

    // If the active configuration has no custom bindings set, exit the function early.
    // by default, if custom does not exists, a default is assigned to it
    // it only means the gamepad is not yet initalized
    if (!activeConfig.custom) {
      return;
    }

    // For each element in the binding settings, update the icon according to the current assignment.
    for (const elm of this.bindingSettings) {
      const icon = getIconWithSettingName(activeConfig, elm);
      if (icon) {
        this.inputsIcons[elm as string].setFrame(icon);
        this.inputsIcons[elm as string].alpha = 1;
      } else {
        this.inputsIcons[elm as string].alpha = 0;
      }
    }

    // Set the cursor and scroll cursor to their initial positions.
    this.setCursor(this.cursor);
    this.setScrollCursor(this.scrollCursor);
  }

  updateNavigationDisplay() {
    const specialIcons = {
      "BUTTON_HOME": "HOME.png",
      "BUTTON_DELETE": "DEL.png",
    };
    for (const settingName of Object.keys(this.navigationIcons)) {
      if (Object.keys(specialIcons).includes(settingName)) {
        this.navigationIcons[settingName].setTexture("keyboard");
        this.navigationIcons[settingName].setFrame(specialIcons[settingName]);
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
  }

  /**
   * Show the UI with the provided arguments.
   *
   * @param args - Arguments to be passed to the show method.
   * @returns `true` if successful.
   */
  show(args: any[]): boolean {
    super.show(args);

    this.updateNavigationDisplay();
    NavigationManager.getInstance().updateIcons();
    // Update the bindings for the current active gamepad configuration.
    this.updateBindings();

    // Make the settings container visible to the user.
    this.settingsContainer.setVisible(true);
    // Reset the scroll cursor to the top of the settings container.
    this.resetScroll();

    // Move the settings container to the end of the UI stack to ensure it is displayed on top.
    this.getUi().moveTo(this.settingsContainer, this.getUi().length - 1);

    // Hide any tooltips that might be visible before showing the settings container.
    this.getUi().hideTooltip();

    // Return true to indicate the UI was successfully shown.
    return true;
  }

  /**
   * Set the UI layout for the active device configuration.
   *
   * @param activeConfig - The active device configuration.
   * @returns `true` if the layout was successfully applied, otherwise `false`.
   */
  setLayout(activeConfig: InterfaceConfig): boolean {
    // Check if there is no active configuration (e.g., no gamepad connected).
    if (!activeConfig) {
      // Retrieve the layout for when no gamepads are connected.
      const layout = this.layout["noGamepads"];
      // Make the options container visible to show message.
      layout.optionsContainer.setVisible(true);
      // Return false indicating the layout application was not successful due to lack of gamepad.
      return false;
    }
    // Extract the type of the gamepad from the active configuration.
    const configType = activeConfig.padType;

    // Retrieve the layout settings based on the type of the gamepad.
    const layout = this.layout[configType];
    // Update the main controller with configuration details from the selected layout.
    this.keys = layout.keys;
    this.optionsContainer = layout.optionsContainer;
    this.optionsContainer.setVisible(true);
    this.settingLabels = layout.settingLabels;
    this.optionValueLabels = layout.optionValueLabels;
    this.optionCursors = layout.optionCursors;
    this.inputsIcons = layout.inputsIcons;
    this.bindingSettings = layout.bindingSettings;

    // Return true indicating the layout was successfully applied.
    return true;
  }

  /**
   * Process the input for the given button.
   *
   * @param button - The button to process.
   * @returns `true` if the input was processed successfully.
   */
  processInput(button: Button): boolean {
    const ui = this.getUi();
    // Defines the maximum number of rows that can be displayed on the screen.
    let success = false;
    this.updateNavigationDisplay();

    // Handle the input based on the button pressed.
    if (button === Button.CANCEL) {
      // Handle cancel button press, reverting UI mode to previous state.
      success = true;
      NavigationManager.getInstance().reset();
      this.scene.ui.revertMode();
    } else {
      const cursor = this.cursor + this.scrollCursor; // Calculate the absolute cursor position.
      const setting = this.setting[Object.keys(this.setting)[cursor]];
      switch (button) {
      case Button.ACTION:
        if (!this.optionCursors || !this.optionValueLabels) {
          return;
        }
        if (this.settingBlacklisted.includes(setting) || !setting.includes("BUTTON_")) {
          success = false;
        } else {
          success = this.setSetting(this.scene, setting, 1);
        }
        break;
      case Button.UP: // Move up in the menu.
        if (!this.optionValueLabels) {
          return false;
        }
        if (cursor) { // If not at the top, move the cursor up.
          if (this.cursor) {
            success = this.setCursor(this.cursor - 1);
          } else {// If at the top of the visible items, scroll up.
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
      case Button.DOWN: // Move down in the menu.
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
          // When at the bottom of the menu and pressing DOWN, move to the topmost item.
          // First, set the cursor to the first visible element, resetting the scroll to the top.
          const successA = this.setCursor(0);
          // Then, reset the scroll to start from the first element of the menu.
          const successB = this.setScrollCursor(0);
          success = successA && successB; // Indicates a successful cursor and scroll adjustment.
        }
        break;
      case Button.LEFT: // Move selection left within the current option set.
        if (!this.optionCursors || !this.optionValueLabels) {
          return;
        }
        if (this.settingBlacklisted.includes(setting) || setting.includes("BUTTON_")) {
          success = false;
        } else if (this.optionCursors[cursor]) {
          success = this.setOptionCursor(cursor, this.optionCursors[cursor] - 1, true);
        }
        break;
      case Button.RIGHT: // Move selection right within the current option set.
        if (!this.optionCursors || !this.optionValueLabels) {
          return;
        }
        if (this.settingBlacklisted.includes(setting) || setting.includes("BUTTON_")) {
          success = false;
        } else if (this.optionCursors[cursor] < this.optionValueLabels[cursor].length - 1) {
          success = this.setOptionCursor(cursor, this.optionCursors[cursor] + 1, true);
        }
        break;
      case Button.CYCLE_FORM:
      case Button.CYCLE_SHINY:
        success = this.navigationContainer.navigate(button);
        break;
      }
    }

    // If a change occurred, play the selection sound.
    if (success) {
      ui.playSelect();
    }

    return success; // Return whether the input resulted in a successful action.
  }

  resetScroll() {
    this.cursorObj?.destroy();
    this.cursorObj = null;
    this.cursor = null;
    this.setCursor(0);
    this.setScrollCursor(0);
    this.updateSettingsScroll();
  }

  /**
   * Set the cursor to the specified position.
   *
   * @param cursor - The cursor position to set.
   * @returns `true` if the cursor was set successfully.
   */
  setCursor(cursor: integer): boolean {
    const ret = super.setCursor(cursor);
    // If the optionsContainer is not initialized, return the result from the parent class directly.
    if (!this.optionsContainer) {
      return ret;
    }

    // Check if the cursor object exists, if not, create it.
    if (!this.cursorObj) {
      this.cursorObj = this.scene.add.nineslice(0, 0, "summary_moves_cursor", null, (this.scene.game.canvas.width / 6) - 10, 16, 1, 1, 1, 1);
      this.cursorObj.setOrigin(0, 0); // Set the origin to the top-left corner.
      this.optionsContainer.add(this.cursorObj); // Add the cursor to the options container.
    }

    // Update the position of the cursor object relative to the options background based on the current cursor and scroll positions.
    this.cursorObj.setPositionRelative(this.optionsBg, 4, 4 + (this.cursor + this.scrollCursor) * 16);

    return ret; // Return the result from the parent class's setCursor method.
  }

  /**
   * Set the scroll cursor to the specified position.
   *
   * @param scrollCursor - The scroll cursor position to set.
   * @returns `true` if the scroll cursor was set successfully.
   */
  setScrollCursor(scrollCursor: integer): boolean {
    // Check if the new scroll position is the same as the current one; if so, do not update.
    if (scrollCursor === this.scrollCursor) {
      return false;
    }

    // Update the internal scroll cursor state
    this.scrollCursor = scrollCursor;

    // Apply the new scroll position to the settings UI.
    this.updateSettingsScroll();

    // Reset the cursor to its current position to adjust its visibility after scrolling.
    this.setCursor(this.cursor);

    return true; // Return true to indicate the scroll cursor was successfully updated.
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
    // Retrieve the specific setting using the settingIndex from the settingDevice enumeration.
    const setting = this.setting[Object.keys(this.setting)[settingIndex]];

    // Get the current cursor position for this setting.
    const lastCursor = this.optionCursors[settingIndex];

    // Check if the setting is not part of the bindings (i.e., it's a regular setting).
    if (!this.bindingSettings.includes(setting) && !setting.includes("BUTTON_")) {
      // Get the label of the last selected option and revert its color to the default.
      const lastValueLabel = this.optionValueLabels[settingIndex][lastCursor];
      lastValueLabel.setColor(this.getTextColor(TextStyle.WINDOW));
      lastValueLabel.setShadowColor(this.getTextColor(TextStyle.WINDOW, true));

      // Update the cursor for the setting to the new position.
      this.optionCursors[settingIndex] = cursor;

      // Change the color of the new selected option to indicate it's selected.
      const newValueLabel = this.optionValueLabels[settingIndex][cursor];
      newValueLabel.setColor(this.getTextColor(TextStyle.SETTINGS_SELECTED));
      newValueLabel.setShadowColor(this.getTextColor(TextStyle.SETTINGS_SELECTED, true));
    }

    // If the save flag is set, save the setting to local storage
    if (save) {
      this.saveSettingToLocalStorage(setting, cursor);
    }

    return true; // Return true to indicate the cursor was successfully updated.
  }

  /**
   * Update the scroll position of the settings UI.
   */
  updateSettingsScroll(): void {
    // Return immediately if the options container is not initialized.
    if (!this.optionsContainer) {
      return;
    }

    // Set the vertical position of the options container based on the current scroll cursor, multiplying by the item height.
    this.optionsContainer.setY(-16 * this.scrollCursor);

    // Iterate over all setting labels to update their visibility.
    for (let s = 0; s < this.settingLabels.length; s++) {
      // Determine if the current setting should be visible based on the scroll position.
      const visible = s >= this.scrollCursor && s < this.scrollCursor + this.rowsToDisplay;

      // Set the visibility of the setting label and its corresponding options.
      this.settingLabels[s].setVisible(visible);
      for (const option of this.optionValueLabels[s]) {
        option.setVisible(visible);
      }
    }
  }

  /**
   * Clear the UI elements and state.
   */
  clear(): void {
    super.clear();

    // Hide the settings container to remove it from the view.
    this.settingsContainer.setVisible(false);

    // Remove the cursor from the UI.
    this.eraseCursor();
  }

  /**
   * Erase the cursor from the UI.
   */
  eraseCursor(): void {
    // Check if a cursor object exists.
    if (this.cursorObj) {
      this.cursorObj.destroy();
    } // Destroy the cursor object to clean up resources.

    // Set the cursor object reference to null to fully dereference it.
    this.cursorObj = null;
  }

}
