import BattleScene from "../battle-scene";
import {TextStyle, addTextObject} from "./text";
import {Mode} from "./ui";
import UiHandler from "./ui-handler";
import {addWindow} from "./ui-theme";
import {Button} from "../enums/buttons";
import {
    noOptionsCursors,
    SettingGamepad,
    settingGamepadDefaults,
    settingGamepadOptions
} from "../system/settings-gamepad";
import {truncateString} from "../utils";
import {
    getCurrentlyAssignedIconToSettingName,
    getKeyForSettingName
} from "#app/configs/gamepad-utils";
import pad_xbox360 from "#app/configs/pad_xbox360";
import pad_dualshock from "#app/configs/pad_dualshock";
import pad_unlicensedSNES from "#app/configs/pad_unlicensedSNES";
import {GamepadConfig} from "#app/inputs-controller";

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

export default class SettingsGamepadUiHandler extends UiHandler {
    private settingsContainer: Phaser.GameObjects.Container;
    private optionsContainer: Phaser.GameObjects.Container;

    private scrollCursor: integer;

    private optionsBg: Phaser.GameObjects.NineSlice;

    private optionCursors: integer[];

    private settingLabels: Phaser.GameObjects.Text[];
    private optionValueLabels: Phaser.GameObjects.Text[][];

    private cursorObj: Phaser.GameObjects.NineSlice;

    private reloadRequired: boolean;
    private reloadI18n: boolean;
    private gamepads: Array<String>;

    private inputsIcons: InputsIcons;

    private layout: Map<string, LayoutConfig> = new Map<string, LayoutConfig>();
    private keys: Array<String>;

    constructor(scene: BattleScene, mode?: Mode) {
        super(scene, mode);

        this.reloadRequired = false;
        this.reloadI18n = false;
        this.gamepads = null;
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

        const gamepadText = addTextObject(this.scene, 0, 0, 'Gamepad', TextStyle.SETTINGS_SELECTED);
        gamepadText.setOrigin(0, 0);
        gamepadText.setPositionRelative(headerBg, 50, 4);

        this.optionsBg = addWindow(this.scene, 0, headerBg.height, (this.scene.game.canvas.width / 6) - 2, (this.scene.game.canvas.height / 6) - headerBg.height - 2);
        this.optionsBg.setOrigin(0, 0);

        this.settingsContainer.add(headerBg);
        this.settingsContainer.add(headerText);
        this.settingsContainer.add(gamepadText);
        this.settingsContainer.add(this.optionsBg);

        for (const config of [pad_xbox360, pad_dualshock, pad_unlicensedSNES]) {
            this.layout[config.padType] = new Map();
            const optionsContainer = this.scene.add.container(0, 0);
            optionsContainer.setVisible(false);

            const bindingSettings = Object.keys(config.setting).map(k => config.setting[k]);

            const settingLabels = [];
            const optionValueLabels = [];
            const inputsIcons = {};

            const commonSettingKeys = Object.keys(SettingGamepad).slice(0, 2).map(key => SettingGamepad[key]);
            const specificBindingKeys = [...commonSettingKeys, ...Object.keys(config.setting).map(k => config.setting[k])];
            const optionCursors = Object.values(Object.keys(settingGamepadDefaults).filter(s => specificBindingKeys.includes(s)).map(k => settingGamepadDefaults[k]));

            const settingGamepadFiltered = Object.keys(SettingGamepad).filter(_key => specificBindingKeys.includes(SettingGamepad[_key]));
            settingGamepadFiltered.forEach((setting, s) => {
                let settingName = setting.replace(/\_/g, ' ');

                settingLabels[s] = addTextObject(this.scene, 8, 28 + s * 16, settingName, TextStyle.SETTINGS_LABEL);
                settingLabels[s].setOrigin(0, 0);

                optionsContainer.add(settingLabels[s]);
                const valueLabels = []
                for (const [o, option] of settingGamepadOptions[SettingGamepad[setting]].entries()) {
                    if (bindingSettings.includes(SettingGamepad[setting])) {
                        if (o) {
                            const valueLabel = addTextObject(this.scene, 0, 0, option, TextStyle.WINDOW);
                            valueLabel.setOrigin(0, 0);
                            optionsContainer.add(valueLabel);
                            valueLabels.push(valueLabel);
                            continue;
                        }
                        const key = getKeyForSettingName(config as GamepadConfig, SettingGamepad[setting]);
                        const icon = this.scene.add.sprite(0, 0, config.padType);
                        icon.setScale(0.1);
                        icon.setOrigin(0, -0.1);
                        inputsIcons[key] = icon;
                        optionsContainer.add(icon);
                        valueLabels.push(icon);
                        continue;
                    }
                    const valueLabel = addTextObject(this.scene, 0, 0, option, settingGamepadDefaults[SettingGamepad[setting]] === o ? TextStyle.SETTINGS_SELECTED : TextStyle.WINDOW);
                    valueLabel.setOrigin(0, 0);

                    optionsContainer.add(valueLabel);

                    valueLabels.push(valueLabel);
                }
                optionValueLabels.push(valueLabels);

                const totalWidth = optionValueLabels[s].map(o => o.width).reduce((total, width) => total += width, 0);

                const labelWidth = Math.max(78, settingLabels[s].displayWidth + 8);

                const totalSpace = (300 - labelWidth) - totalWidth / 6;
                const optionSpacing = Math.floor(totalSpace / (optionValueLabels[s].length - 1));

                let xOffset = 0;

                for (let value of optionValueLabels[s]) {
                    value.setPositionRelative(settingLabels[s], labelWidth + xOffset, 0);
                    xOffset += value.width / 6 + optionSpacing;
                }
            });


            this.layout[config.padType].optionsContainer = optionsContainer;
            this.layout[config.padType].inputsIcons = inputsIcons;
            this.layout[config.padType].settingLabels = settingLabels;
            this.layout[config.padType].optionValueLabels = optionValueLabels;
            this.layout[config.padType].optionCursors = optionCursors
            this.layout[config.padType].keys = specificBindingKeys
            this.layout[config.padType].bindingSettings = bindingSettings

            this.settingsContainer.add(optionsContainer);
        }
        this.layout['noGamepads'] = new Map();
        const optionsContainer = this.scene.add.container(0, 0);
        optionsContainer.setVisible(false);
        const label = addTextObject(this.scene, 8, 28, 'Please plug a controller or press a button', TextStyle.SETTINGS_LABEL);
        label.setOrigin(0, 0);
        optionsContainer.add(label);
        this.settingsContainer.add(optionsContainer);

        this.layout['noGamepads'].optionsContainer = optionsContainer;
        this.layout['noGamepads'].label = label;


        ui.add(this.settingsContainer);

        this.settingsContainer.setVisible(false);
    }

    updateBindings(): void {
        Object.keys(this.layout).forEach((key) => this.layout[key].optionsContainer.setVisible(false));
        const activeConfig = this.scene.inputController.getActiveConfig();
        if (!activeConfig) {
            const layout = this.layout['noGamepads'];
            layout.optionsContainer.setVisible(true);
            return;
        }
        const configType = activeConfig.padType;
        this.cursorObj?.destroy();
        this.cursorObj = null;
        this.scrollCursor = null;
        const layout = this.layout[configType];
        this.keys = layout.keys;
        this.optionsContainer = layout.optionsContainer;
        this.optionsContainer.setVisible(true);
        this.settingLabels = layout.settingLabels;
        this.optionValueLabels = layout.optionValueLabels;
        this.optionCursors = layout.optionCursors;
        this.inputsIcons = layout.inputsIcons;
        const bindingSettings = layout.bindingSettings;

        const settings: object = localStorage.hasOwnProperty('settingsGamepad') ? JSON.parse(localStorage.getItem('settingsGamepad')) : {};
        this.keys.forEach((key, index) => {
            this.setOptionCursor(index, settings.hasOwnProperty(key) ? settings[key] : this.optionCursors[index])
        });

        if (!activeConfig.custom) return;
        for (const elm of bindingSettings) {
            const key = getKeyForSettingName(activeConfig, elm);
            const icon = getCurrentlyAssignedIconToSettingName(activeConfig, elm);
            this.inputsIcons[key].setFrame(icon);
        }
        this.setCursor(0);
        this.setScrollCursor(0);
    }

    show(args: any[]): boolean {
        super.show(args);
        this.updateBindings();

        this.settingsContainer.setVisible(true);
        this.setScrollCursor(0);

        this.getUi().moveTo(this.settingsContainer, this.getUi().length - 1);

        this.getUi().hideTooltip();

        return true;
    }

    processInput(button: Button): boolean {
        const ui = this.getUi();
        // Defines the maximum number of rows that can be displayed on the screen.
        const rowsToDisplay = 9;

        let success = false;

        if (button === Button.CANCEL) {
            success = true;
            this.scene.ui.revertMode();
        } else {
            const cursor = this.cursor + this.scrollCursor;
            switch (button) {
                case Button.UP:
                    if (cursor) {
                        if (this.cursor)
                            success = this.setCursor(this.cursor - 1);
                        else
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
                case Button.DOWN:
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
                case Button.LEFT:
                    if (!this.optionCursors) return;
                    if (this.optionCursors[cursor])
                        success = this.setOptionCursor(cursor, this.optionCursors[cursor] - 1, true);
                    break;
                case Button.RIGHT:
                    if (!this.optionCursors) return;
                    if (this.optionCursors[cursor] < this.optionValueLabels[cursor].length - 1)
                        success = this.setOptionCursor(cursor, this.optionCursors[cursor] + 1, true);
                    break;
                case Button.CYCLE_FORM:
                    this.scene.ui.setMode(Mode.SETTINGS)
                    success = true;
                case Button.CYCLE_SHINY:
                    this.scene.ui.setMode(Mode.SETTINGS)
                    success = true;
                    break;
            }
        }

        if (success)
            ui.playSelect();

        return success;
    }

    setCursor(cursor: integer): boolean {
        const ret = super.setCursor(cursor);
        if (!this.optionsContainer) return ret;

        if (!this.cursorObj) {
            this.cursorObj = this.scene.add.nineslice(0, 0, 'summary_moves_cursor', null, (this.scene.game.canvas.width / 6) - 10, 16, 1, 1, 1, 1);
            this.cursorObj.setOrigin(0, 0);
            this.optionsContainer.add(this.cursorObj);
        }

        this.cursorObj.setPositionRelative(this.optionsBg, 4, 4 + (this.cursor + this.scrollCursor) * 16);

        return ret;
    }

    updateChosenGamepadDisplay(): void {
        this.updateBindings();
        for (const [index, key] of Object.keys(SettingGamepad).entries()) {
            const setting = SettingGamepad[key]
            if (setting === SettingGamepad.Default_Controller) {
                for (const _key of Object.keys(this.layout)) {
                    if (_key === 'noGamepads') continue;
                    this.layout[_key].optionValueLabels[index][0].setText(truncateString(this.scene.inputController.chosenGamepad, 30));
                }
            }
        }
    }

    setOptionCursor(settingIndex: integer, cursor: integer, save?: boolean): boolean {
        const setting = SettingGamepad[Object.keys(SettingGamepad)[settingIndex]];

        const lastCursor = this.optionCursors[settingIndex];

        if (!noOptionsCursors.includes(setting)) {
            const lastValueLabel = this.optionValueLabels[settingIndex][lastCursor];
            lastValueLabel.setColor(this.getTextColor(TextStyle.WINDOW));
            lastValueLabel.setShadowColor(this.getTextColor(TextStyle.WINDOW, true));

            this.optionCursors[settingIndex] = cursor;
            const newValueLabel = this.optionValueLabels[settingIndex][cursor];
            newValueLabel.setColor(this.getTextColor(TextStyle.SETTINGS_SELECTED));
            newValueLabel.setShadowColor(this.getTextColor(TextStyle.SETTINGS_SELECTED, true));
        }

        if (save) {
            if (SettingGamepad[setting] !== SettingGamepad.Default_Controller)
                this.scene.gameData.saveGamepadSetting(setting, cursor)
        }

        return true;
    }

    setScrollCursor(scrollCursor: integer): boolean {
        if (scrollCursor === this.scrollCursor)
            return false;

        this.scrollCursor = scrollCursor;

        this.updateSettingsScroll();

        this.setCursor(this.cursor);

        return true;
    }

    updateSettingsScroll(): void {
        if (!this.optionsContainer) return;
        this.optionsContainer.setY(-16 * this.scrollCursor);

        for (let s = 0; s < this.settingLabels.length; s++) {
            const visible = s >= this.scrollCursor && s < this.scrollCursor + 9;
            this.settingLabels[s].setVisible(visible);
            for (let option of this.optionValueLabels[s])
                option.setVisible(visible);
        }
    }

    clear(): void {
        super.clear();
        this.settingsContainer.setVisible(false);
        this.eraseCursor();
    }

    eraseCursor(): void {
        if (this.cursorObj)
            this.cursorObj.destroy();
        this.cursorObj = null;
    }
}