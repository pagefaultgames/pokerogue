import BattleScene from "../../battle-scene";
import {Mode} from "../ui";
import {Button} from "../../enums/buttons";
import {addWindow} from "#app/ui/ui-theme";
import {addTextObject, TextStyle} from "#app/ui/text";
import cfg_keyboard_azerty from "#app/configs/cfg_keyboard_azerty";
import {SettingKeyboard, settingKeyboardDefaults, settingKeyboardOptions} from "#app/system/settings-keyboard";
import {getCurrentlyAssignedIconToSettingName, getKeyForSettingName} from "#app/configs/gamepad-utils";
import {GamepadConfig} from "#app/inputs-controller";
import {truncateString} from "#app/utils";
import AbstractSettingsUiUiHandler, {InputsIcons} from "#app/ui/settings/abstract-settings-ui-handler";


export default class SettingsKeyboardUiHandler extends AbstractSettingsUiUiHandler {
    constructor(scene: BattleScene, mode?: Mode) {
        super(scene, mode);
    }

    setup() {
        const ui = this.getUi();

        this.settingsContainer = this.scene.add.container(1, -(this.scene.game.canvas.height / 6) + 1);

        this.settingsContainer.setInteractive(new Phaser.Geom.Rectangle(0, 0, this.scene.game.canvas.width / 6, this.scene.game.canvas.height / 6), Phaser.Geom.Rectangle.Contains);

        const headerBg = addWindow(this.scene, 0, 0, (this.scene.game.canvas.width / 6) - 2, 24);
        headerBg.setOrigin(0, 0);

        const headerText = addTextObject(this.scene, 0, 0, 'General', TextStyle.SETTINGS_LABEL);
        headerText.setOrigin(0, 0);
        headerText.setPositionRelative(headerBg, 8, 4);

        const gamepadText = addTextObject(this.scene, 0, 0, 'Gamepad', TextStyle.SETTINGS_LABEL);
        gamepadText.setOrigin(0, 0);
        gamepadText.setPositionRelative(headerBg, 50, 4);

        const keyboardText = addTextObject(this.scene, 0, 0, 'Keyboard', TextStyle.SETTINGS_SELECTED);
        keyboardText.setOrigin(0, 0);
        keyboardText.setPositionRelative(headerBg, 97, 4);

        this.optionsBg = addWindow(this.scene, 0, headerBg.height, (this.scene.game.canvas.width / 6) - 2, (this.scene.game.canvas.height / 6) - headerBg.height - 2);
        this.optionsBg.setOrigin(0, 0);

        this.settingsContainer.add(headerBg);
        this.settingsContainer.add(headerText);
        this.settingsContainer.add(gamepadText);
        this.settingsContainer.add(keyboardText);
        this.settingsContainer.add(this.optionsBg);
        for (const config of [cfg_keyboard_azerty]) {
            // Create a map to store layout settings based on the pad type.
            this.layout[config.padType] = new Map();
            // Create a container for gamepad options in the scene, initially hidden.

            const optionsContainer = this.scene.add.container(0, 0);
            optionsContainer.setVisible(false);

            // Gather all gamepad binding settings from the configuration.
            const bindingSettings = Object.keys(config.setting).map(k => config.setting[k]);

            // Array to hold labels for different settings such as 'Default Controller', 'Gamepad Support', etc.
            const settingLabels: Phaser.GameObjects.Text[] = [];

            // Array to hold options for each setting, e.g., 'Auto', 'Disabled'.
            const optionValueLabels: Phaser.GameObjects.Text[][] = [];

            // Object to store sprites for each button configuration.
            const inputsIcons: InputsIcons = {};

            // Fetch common setting keys such as 'Default Controller' and 'Gamepad Support' from gamepad settings.
            const commonSettingKeys = Object.keys(SettingKeyboard).slice(0, 1).map(key => SettingKeyboard[key]);
            // Combine common and specific bindings into a single array.
            const specificBindingKeys = [...commonSettingKeys, ...Object.keys(config.setting).map(k => config.setting[k])];
            // Fetch default values for these settings and prepare to highlight selected options.
            const optionCursors = Object.values(Object.keys(settingKeyboardDefaults).filter(s => specificBindingKeys.includes(s)).map(k => settingKeyboardDefaults[k]));
            // Filter out settings that are not relevant to the current gamepad configuration.
            const SettingKeyboardFiltered = Object.keys(SettingKeyboard).filter(_key => specificBindingKeys.includes(SettingKeyboard[_key]));
            // Loop through the filtered settings to manage display and options.

            SettingKeyboardFiltered.forEach((setting, s) => {
                // Convert the setting key from format 'Key_Name' to 'Key name' for display.
                let settingName = setting.replace(/\_/g, ' ');

                // Create and add a text object for the setting name to the scene.
                settingLabels[s] = addTextObject(this.scene, 8, 28 + s * 16, settingName, TextStyle.SETTINGS_LABEL);
                settingLabels[s].setOrigin(0, 0);
                optionsContainer.add(settingLabels[s]);

                // Initialize an array to store the option labels for this setting.
                const valueLabels: Phaser.GameObjects.Text[] = []

                // Process each option for the current setting.
                for (const [o, option] of settingKeyboardOptions[SettingKeyboard[setting]].entries()) {
                    // Check if the current setting is for binding keys.
                    if (bindingSettings.includes(SettingKeyboard[setting])) {
                        // Create a label for non-null options, typically indicating actionable options like 'change'.
                        if (o) {
                            const valueLabel = addTextObject(this.scene, 0, 0, option, TextStyle.WINDOW);
                            valueLabel.setOrigin(0, 0);
                            optionsContainer.add(valueLabel);
                            valueLabels.push(valueLabel);
                            continue;
                        }
                        // For null options, add an icon for the key.
                        const key = getKeyForSettingName(config as GamepadConfig, SettingKeyboard[setting]);
                        const icon = this.scene.add.sprite(0, 0, 'keyboard');
                        icon.setScale(0.1);
                        icon.setOrigin(0, -0.1);
                        inputsIcons[key] = icon;
                        optionsContainer.add(icon);
                        valueLabels.push(icon);
                        continue;
                    }
                    // For regular settings like 'Gamepad support', create a label and determine if it is selected.
                    const valueLabel = addTextObject(this.scene, 0, 0, option, settingKeyboardDefaults[SettingKeyboard[setting]] === o ? TextStyle.SETTINGS_SELECTED : TextStyle.WINDOW);
                    valueLabel.setOrigin(0, 0);

                    optionsContainer.add(valueLabel);

                    //if a setting has 2 options, valueLabels will be an array of 2 elements
                    valueLabels.push(valueLabel);
                }
                // Collect all option labels for this setting into the main array.
                optionValueLabels.push(valueLabels);

                // Calculate the total width of all option labels within a specific setting
                // This is achieved by summing the width of each option label
                const totalWidth = optionValueLabels[s].map(o => o.width).reduce((total, width) => total += width, 0);

                // Define the minimum width for a label, ensuring it's at least 78 pixels wide or the width of the setting label plus some padding
                const labelWidth = Math.max(78, settingLabels[s].displayWidth + 8);

                // Calculate the total available space for placing option labels next to their setting label
                // We reserve space for the setting label and then distribute the remaining space evenly
                const totalSpace = (300 - labelWidth) - totalWidth / 6;
                // Calculate the spacing between options based on the available space divided by the number of gaps between labels
                const optionSpacing = Math.floor(totalSpace / (optionValueLabels[s].length - 1));

                // Initialize xOffset to zero, which will be used to position each option label horizontally
                let xOffset = 0;

                // Start positioning each option label one by one
                for (let value of optionValueLabels[s]) {
                    // Set the option label's position right next to the setting label, adjusted by xOffset
                    value.setPositionRelative(settingLabels[s], labelWidth + xOffset, 0);
                    // Move the xOffset to the right for the next label, ensuring each label is spaced evenly
                    xOffset += value.width / 6 + optionSpacing;
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

    updateBindings(): void {
        // Hide the options container for all layouts to reset the UI visibility.
        Object.keys(this.layout).forEach((key) => this.layout[key].optionsContainer.setVisible(false));
        // Fetch the active gamepad configuration from the input controller.
        const activeConfig = this.scene.inputController.getActiveKeyboardConfig();
        // Set the UI layout for the active configuration. If unsuccessful, exit the function early.
        if (!this.setLayout(activeConfig)) return;

        // Retrieve the gamepad settings from local storage or use an empty object if none exist.
        const settings: object = localStorage.hasOwnProperty('settingsKeyboard') ? JSON.parse(localStorage.getItem('settingsKeyboard')) : {};

        // Update the cursor for each key based on the stored settings or default cursors.
        this.keys.forEach((key, index) => {
            this.setOptionCursor(index, settings.hasOwnProperty(key) ? settings[key] : this.optionCursors[index])
        });

        // If the active configuration has no custom bindings set, exit the function early.
        // by default, if custom does not exists, a default is assigned to it
        // it only means the gamepad is not yet initalized
        if (!activeConfig.custom) return;

        // For each element in the binding settings, update the icon according to the current assignment.
        for (const elm of this.bindingSettings) {
            const key = getKeyForSettingName(activeConfig, elm); // Get the key for the setting name.
            const icon = getCurrentlyAssignedIconToSettingName(activeConfig, elm); // Fetch the currently assigned icon for the setting.
            this.inputsIcons[key].setFrame(icon); // Set the icon frame to the inputs icon object.
        }

        // Set the cursor and scroll cursor to their initial positions.
        this.setCursor(0);
        this.setScrollCursor(0);

    }

    processInput(button: Button): boolean {
        const ui = this.getUi();
        // Defines the maximum number of rows that can be displayed on the screen.
        const rowsToDisplay = 9;

        let success = false;

        // Handle the input based on the button pressed.
        if (button === Button.CANCEL) {
            // Handle cancel button press, reverting UI mode to previous state.
            success = true;
            this.scene.ui.revertMode();
        } else {
            const cursor = this.cursor + this.scrollCursor; // Calculate the absolute cursor position.
            switch (button) {
                case Button.UP: // Move up in the menu.
                    if (cursor) { // If not at the top, move the cursor up.
                        if (this.cursor)
                            success = this.setCursor(this.cursor - 1);
                        else // If at the top of the visible items, scroll up.
                            success = this.setScrollCursor(this.scrollCursor - 1);
                    } else {
                        // When at the top of the menu and pressing UP, move to the bottommost item.
                        // First, set the cursor to the last visible element, preparing for the scroll to the end.
                        const successA = this.setCursor(rowsToDisplay - 1);
                        // Then, adjust the scroll to display the bottommost elements of the menu.
                        const successB = this.setScrollCursor(this.optionValueLabels.length - rowsToDisplay);
                        success = successA && successB; // success is just there to play the little validation sound effect
                    }
                    break;
                case Button.DOWN: // Move down in the menu.
                    if (cursor < this.optionValueLabels.length - 1) {
                        if (this.cursor < rowsToDisplay - 1)
                            success = this.setCursor(this.cursor + 1);
                        else if (this.scrollCursor < this.optionValueLabels.length - rowsToDisplay)
                            success = this.setScrollCursor(this.scrollCursor + 1);
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
                    if (!this.optionCursors) return;
                    if (this.optionCursors[cursor])
                        success = this.setOptionCursor(cursor, this.optionCursors[cursor] - 1, true);
                    break;
                case Button.RIGHT: // Move selection right within the current option set.
                    if (!this.optionCursors) return;
                    if (this.optionCursors[cursor] < this.optionValueLabels[cursor].length - 1)
                        success = this.setOptionCursor(cursor, this.optionCursors[cursor] + 1, true);
                    break;
                case Button.CYCLE_FORM: // Change the UI mode to SETTINGS mode.
                    this.scene.ui.setMode(Mode.SETTINGS_GAMEPAD)
                    success = true;
                    break;
                case Button.CYCLE_SHINY:
                    this.scene.ui.setMode(Mode.SETTINGS)
                    success = true;
                    break;
            }
        }

        // If a change occurred, play the selection sound.
        if (success)
            ui.playSelect();

        return success; // Return whether the input resulted in a successful action.
    }

    updateChosenKeyboardDisplay(): void {
        // Update any bindings that might have changed since the last update.
        this.updateBindings();

        // Iterate over the keys in the SettingKeyboard enumeration.
        for (const [index, key] of Object.keys(SettingKeyboard).entries()) {
            const setting = SettingKeyboard[key] // Get the actual setting value using the key.

            // Check if the current setting corresponds to the default controller setting.
            if (setting === SettingKeyboard.Default_Layout) {
                // Iterate over all layouts excluding the 'noGamepads' special case.
                for (const _key of Object.keys(this.layout)) {
                    // Update the text of the first option label under the current setting to the name of the chosen gamepad,
                    // truncating the name to 30 characters if necessary.
                    this.layout[_key].optionValueLabels[index][0].setText(truncateString(this.scene.inputController.chosenKeyboard, 30));
                }
            }
        }

    }

    setOptionCursor(settingIndex: integer, cursor: integer, save?: boolean): boolean {
        // Retrieve the specific setting using the settingIndex from the SettingKeyboard enumeration.
        const setting = SettingKeyboard[Object.keys(SettingKeyboard)[settingIndex]];

        // Get the current cursor position for this setting.
        const lastCursor = this.optionCursors[settingIndex];

        // Check if the setting is not part of the bindings (i.e., it's a regular setting).
        if (!this.bindingSettings.includes(setting) && !setting.includes('BUTTON_')) {
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

        // If the save flag is set and the setting is not the default controller setting, save the setting to local storage
        if (save) {
            if (SettingKeyboard[setting] !== SettingKeyboard.Default_Layout)
                this.scene.gameData.saveKeyboardSetting(setting, cursor)
        }

        return true; // Return true to indicate the cursor was successfully updated.
    }

}