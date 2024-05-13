import UiHandler from "../ui-handler";
import BattleScene from "../../battle-scene";
import {Mode} from "../ui";
import {InterfaceConfig} from "../../inputs-controller";
import {addWindow} from "../ui-theme";
import {addTextObject, TextStyle} from "../text";
import {Button} from "../../enums/buttons";
import {
    getKeyAndActionFromCurrentKeysWithSettingName,
    getKeyForSettingName
} from "#app/configs/gamepad-utils";

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

export default abstract class AbstractSettingsUiUiHandler extends UiHandler {
    protected settingsContainer: Phaser.GameObjects.Container;
    protected optionsContainer: Phaser.GameObjects.Container;

    protected scrollCursor: integer;
    protected optionCursors: integer[];
    protected cursorObj: Phaser.GameObjects.NineSlice;

    protected optionsBg: Phaser.GameObjects.NineSlice;

    protected settingLabels: Phaser.GameObjects.Text[];
    protected optionValueLabels: Phaser.GameObjects.Text[][];

    // layout will contain the 3 Gamepad tab for each config - dualshock, xbox, snes
    protected layout: Map<string, LayoutConfig> = new Map<string, LayoutConfig>();
    // Will contain the input icons from the selected layout
    protected inputsIcons: InputsIcons;
    // list all the setting keys used in the selected layout (because dualshock has more buttons than xbox)
    protected keys: Array<String>;

    // Store the specific settings related to key bindings for the current gamepad configuration.
    protected bindingSettings: Array<String>;

    protected settingDevice;
    protected settingDeviceDefaults;
    protected settingDeviceOptions;
    protected configs;
    protected commonSettingsCount;
    protected textureOverride;
    protected titleSelected;
    protected localStoragePropertyName;

    abstract getLocalStorageSetting(): object;
    abstract navigateMenuLeft(): boolean;
    abstract navigateMenuRight(): boolean;
    abstract saveSettingToLocalStorage(setting, cursor): void;
    abstract getActiveConfig(): InterfaceConfig;

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

        const gamepadText = addTextObject(this.scene, 0, 0, 'Gamepad', this.titleSelected === 'Gamepad' ? TextStyle.SETTINGS_SELECTED : TextStyle.SETTINGS_LABEL);
        gamepadText.setOrigin(0, 0);
        gamepadText.setPositionRelative(headerBg, 50, 4);

        const keyboardText = addTextObject(this.scene, 0, 0, 'Keyboard', this.titleSelected === 'Keyboard' ? TextStyle.SETTINGS_SELECTED : TextStyle.SETTINGS_LABEL);
        keyboardText.setOrigin(0, 0);
        keyboardText.setPositionRelative(headerBg, 97, 4);

        this.optionsBg = addWindow(this.scene, 0, headerBg.height, (this.scene.game.canvas.width / 6) - 2, (this.scene.game.canvas.height / 6) - headerBg.height - 2);
        this.optionsBg.setOrigin(0, 0);

        this.settingsContainer.add(headerBg);
        this.settingsContainer.add(headerText);
        this.settingsContainer.add(gamepadText);
        this.settingsContainer.add(keyboardText);
        this.settingsContainer.add(this.optionsBg);

        /// Initialize a new configuration "screen" for each type of gamepad.
        for (const config of this.configs) {
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
            const commonSettingKeys = Object.keys(this.settingDevice).slice(0, this.commonSettingsCount).map(key => this.settingDevice[key]);
            // Combine common and specific bindings into a single array.
            const specificBindingKeys = [...commonSettingKeys, ...Object.keys(config.setting).map(k => config.setting[k])];
            // Fetch default values for these settings and prepare to highlight selected options.
            const optionCursors = Object.values(Object.keys(this.settingDeviceDefaults).filter(s => specificBindingKeys.includes(s)).map(k => this.settingDeviceDefaults[k]));

            // Filter out settings that are not relevant to the current gamepad configuration.
            const settingFiltered = Object.keys(this.settingDevice).filter(_key => specificBindingKeys.includes(this.settingDevice[_key]));
            // Loop through the filtered settings to manage display and options.

            settingFiltered.forEach((setting, s) => {
                // Convert the setting key from format 'Key_Name' to 'Key name' for display.
                let settingName = setting.replace(/\_/g, ' ');

                // Create and add a text object for the setting name to the scene.
                settingLabels[s] = addTextObject(this.scene, 8, 28 + s * 16, settingName, TextStyle.SETTINGS_LABEL);
                settingLabels[s].setOrigin(0, 0);
                optionsContainer.add(settingLabels[s]);

                // Initialize an array to store the option labels for this setting.
                const valueLabels: Phaser.GameObjects.Text[] = []

                // Process each option for the current setting.
                for (const [o, option] of this.settingDeviceOptions[this.settingDevice[setting]].entries()) {
                    // Check if the current setting is for binding keys.
                    if (bindingSettings.includes(this.settingDevice[setting])) {
                        // Create a label for non-null options, typically indicating actionable options like 'change'.
                        if (o) {
                            const valueLabel = addTextObject(this.scene, 0, 0, option, TextStyle.WINDOW);
                            valueLabel.setOrigin(0, 0);
                            optionsContainer.add(valueLabel);
                            valueLabels.push(valueLabel);
                            continue;
                        }
                        // For null options, add an icon for the key.
                        const key = getKeyForSettingName(config as InterfaceConfig, this.settingDevice[setting]);
                        const icon = this.scene.add.sprite(0, 0, this.textureOverride ? this.textureOverride : config.padType);
                        icon.setScale(0.1);
                        icon.setOrigin(0, -0.1);
                        inputsIcons[key] = icon;
                        optionsContainer.add(icon);
                        valueLabels.push(icon);
                        continue;
                    }
                    // For regular settings like 'Gamepad support', create a label and determine if it is selected.
                    const valueLabel = addTextObject(this.scene, 0, 0, option, this.settingDeviceDefaults[this.settingDevice[setting]] === o ? TextStyle.SETTINGS_SELECTED : TextStyle.WINDOW);
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
        const activeConfig = this.getActiveConfig();
        // Set the UI layout for the active configuration. If unsuccessful, exit the function early.
        if (!this.setLayout(activeConfig)) return;

        // Retrieve the gamepad settings from local storage or use an empty object if none exist.
        const settings: object = this.getLocalStorageSetting();

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
            // const key = getKeyForSettingName(activeConfig, elm); // Get the key for the setting name.
            const {key, icon} = getKeyAndActionFromCurrentKeysWithSettingName(activeConfig, elm);
            this.inputsIcons[key].setFrame(icon); // Set the icon frame to the inputs icon object.
        }

        // Set the cursor and scroll cursor to their initial positions.
        this.setCursor(0);
        this.setScrollCursor(0);
    }

    show(args: any[]): boolean {
        super.show(args);

        // Update the bindings for the current active gamepad configuration.
        this.updateBindings();

        // Make the settings container visible to the user.
        this.settingsContainer.setVisible(true);
        // Reset the scroll cursor to the top of the settings container.
        this.setScrollCursor(0);

        // Move the settings container to the end of the UI stack to ensure it is displayed on top.
        this.getUi().moveTo(this.settingsContainer, this.getUi().length - 1);

        // Hide any tooltips that might be visible before showing the settings container.
        this.getUi().hideTooltip();

        // Return true to indicate the UI was successfully shown.
        return true;
    }

    setLayout(activeConfig: InterfaceConfig): boolean {
        // Check if there is no active configuration (e.g., no gamepad connected).
        if (!activeConfig) {
            // Retrieve the layout for when no gamepads are connected.
            const layout = this.layout['noGamepads'];
            // Make the options container visible to show message.
            layout.optionsContainer.setVisible(true);
            // Return false indicating the layout application was not successful due to lack of gamepad.
            return false;
        }
        // Extract the type of the gamepad from the active configuration.
        const configType = activeConfig.padType;

        // If a cursor object exists, destroy it to clean up previous UI states.
        this.cursorObj?.destroy();
        // Reset the cursor object and scroll cursor to ensure they are re-initialized correctly.
        this.cursorObj = null;
        this.scrollCursor = null;

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
                    if (!this.optionValueLabels) return false;
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
                    if (!this.optionValueLabels) return false;
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
                    if (!this.optionCursors || !this.optionValueLabels) return;
                    if (this.optionCursors[cursor])
                        success = this.setOptionCursor(cursor, this.optionCursors[cursor] - 1, true);
                    break;
                case Button.RIGHT: // Move selection right within the current option set.
                    if (!this.optionCursors || !this.optionValueLabels) return;
                    if (this.optionCursors[cursor] < this.optionValueLabels[cursor].length - 1)
                        success = this.setOptionCursor(cursor, this.optionCursors[cursor] + 1, true);
                    break;
                case Button.CYCLE_FORM:
                    success = this.navigateMenuLeft();
                    break;
                case Button.CYCLE_SHINY:
                    success = this.navigateMenuRight();
                    break;
            }
        }

        // If a change occurred, play the selection sound.
        if (success)
            ui.playSelect();

        return success; // Return whether the input resulted in a successful action.
    }

    setCursor(cursor: integer): boolean {
        const ret = super.setCursor(cursor);
        // If the optionsContainer is not initialized, return the result from the parent class directly.
        if (!this.optionsContainer) return ret;

        // Check if the cursor object exists, if not, create it.
        if (!this.cursorObj) {
            this.cursorObj = this.scene.add.nineslice(0, 0, 'summary_moves_cursor', null, (this.scene.game.canvas.width / 6) - 10, 16, 1, 1, 1, 1);
            this.cursorObj.setOrigin(0, 0); // Set the origin to the top-left corner.
            this.optionsContainer.add(this.cursorObj); // Add the cursor to the options container.
        }

        // Update the position of the cursor object relative to the options background based on the current cursor and scroll positions.
        this.cursorObj.setPositionRelative(this.optionsBg, 4, 4 + (this.cursor + this.scrollCursor) * 16);

        return ret; // Return the result from the parent class's setCursor method.
    }

    setScrollCursor(scrollCursor: integer): boolean {
        // Check if the new scroll position is the same as the current one; if so, do not update.
        if (scrollCursor === this.scrollCursor)
            return false;

        // Update the internal scroll cursor state
        this.scrollCursor = scrollCursor;

        // Apply the new scroll position to the settings UI.
        this.updateSettingsScroll();

        // Reset the cursor to its current position to adjust its visibility after scrolling.
        this.setCursor(this.cursor);

        return true; // Return true to indicate the scroll cursor was successfully updated.
    }

    setOptionCursor(settingIndex: integer, cursor: integer, save?: boolean): boolean {
        // Retrieve the specific setting using the settingIndex from the settingDevice enumeration.
        const setting = this.settingDevice[Object.keys(this.settingDevice)[settingIndex]];

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
            this.saveSettingToLocalStorage(setting, cursor);
        }

        return true; // Return true to indicate the cursor was successfully updated.
    }

    updateSettingsScroll(): void {
        // Return immediately if the options container is not initialized.
        if (!this.optionsContainer) return;

        // Set the vertical position of the options container based on the current scroll cursor, multiplying by the item height.
        this.optionsContainer.setY(-16 * this.scrollCursor);

        // Iterate over all setting labels to update their visibility.
        for (let s = 0; s < this.settingLabels.length; s++) {
            // Determine if the current setting should be visible based on the scroll position.
            const visible = s >= this.scrollCursor && s < this.scrollCursor + 9;

            // Set the visibility of the setting label and its corresponding options.
            this.settingLabels[s].setVisible(visible);
            for (let option of this.optionValueLabels[s])
                option.setVisible(visible);
        }
    }

    clear(): void {
        super.clear();

        // Hide the settings container to remove it from the view.
        this.settingsContainer.setVisible(false);

        // Remove the cursor from the UI.
        this.eraseCursor();
    }

    eraseCursor(): void {
        // Check if a cursor object exists.
        if (this.cursorObj)
            this.cursorObj.destroy(); // Destroy the cursor object to clean up resources.

        // Set the cursor object reference to null to fully dereference it.
        this.cursorObj = null;
    }

}