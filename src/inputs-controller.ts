import * as Utils from "./utils";
import {deepCopy} from "./utils";
import {initTouchControls} from './touch-controls';
import pad_generic from "./configs/pad_generic";
import pad_unlicensedSNES from "./configs/pad_unlicensedSNES";
import pad_xbox360 from "./configs/pad_xbox360";
import pad_dualshock from "./configs/pad_dualshock";
import {Button} from "./enums/buttons";
import {Mode} from "./ui/ui";
import SettingsGamepadUiHandler from "./ui/settings/settings-gamepad-ui-handler";
import SettingsKeyboardUiHandler from "./ui/settings/settings-keyboard-ui-handler";
import cfg_keyboard_azerty from "./configs/cfg_keyboard_azerty";
import {Device} from "#app/enums/devices";
import {getButtonWithKeycode, regenerateIdentifiers, swap} from "#app/configs/configHandler";

export interface DeviceMapping {
    [key: string]: number;
}

export interface IconsMapping {
    [key: string]: string;
}

export interface SettingMapping {
    [key: string]: string;
}

export interface MappingLayout {
    [key: string]: Button;
}

export interface InterfaceConfig {
    padID: string;
    padType: string;
    deviceMapping: DeviceMapping;
    icons: IconsMapping;
    setting: SettingMapping;
    default: MappingLayout;
    custom: MappingLayout;
    main: Array<string>;
    alt: Array<string>;
}

const repeatInputDelayMillis = 250;

/**
 * Manages and handles all input controls for the game, including keyboard and gamepad interactions.
 *
 * @remarks
 * This class is designed to centralize input management across the game. It facilitates the setup,
 * configuration, and handling of all game inputs, making it easier to manage various input devices
 * such as keyboards and gamepads. The class provides methods for setting up input devices, handling
 * their events, and responding to changes in input state (e.g., button presses, releases).
 *
 * The `InputsController` class also includes mechanisms to handle game focus events to ensure input
 * states are correctly reset and managed when the game loses or regains focus, maintaining robust
 * and responsive control handling throughout the game's lifecycle.
 *
 * Key responsibilities include:
 * - Initializing and configuring gamepad and keyboard controls.
 * - Emitting events related to specific input actions.
 * - Responding to external changes such as gamepad connection/disconnection.
 * - Managing game state transitions in response to input events, particularly focus loss and recovery.
 *
 * Usage of this class is intended to simplify input management across various parts of the game,
 * providing a unified interface for all input-related interactions.
 */
export class InputsController {
    private buttonKeys: Phaser.Input.Keyboard.Key[][];
    private gamepads: Array<Phaser.Input.Gamepad.Gamepad> = new Array();
    private scene: Phaser.Scene;
    private events: Phaser.Events.EventEmitter;

    private buttonLock: Button;
    private buttonLock2: Button;
    private interactions: Map<Button, Map<string, boolean>> = new Map();
    private time: Phaser.Time.Clock;
    private configs: Map<string, InterfaceConfig> = new Map();

    private gamepadSupport: boolean = true;
    public selectedDevice;

    private disconnectedGamepads: Array<String> = new Array();

    private pauseUpdate: boolean = false;

    public lastSource: string = 'keyboard';
    private keys: Array<number> = [];

    /**
     * Initializes a new instance of the game control system, setting up initial state and configurations.
     *
     * @param scene - The Phaser scene associated with this instance.
     *
     * @remarks
     * This constructor initializes the game control system with necessary setups for handling inputs.
     * It prepares an interactions array indexed by button identifiers and configures default states for each button.
     * Specific buttons like MENU and STATS are set not to repeat their actions.
     * It concludes by calling the `init` method to complete the setup.
     */

    constructor(scene: Phaser.Scene) {
        this.scene = scene;
        this.time = this.scene.time;
        this.buttonKeys = [];
        this.selectedDevice = {
            [Device.GAMEPAD]: null,
            [Device.KEYBOARD]: 'default'
        }

        for (const b of Utils.getEnumValues(Button)) {
            this.interactions[b] = {
                pressTime: false,
                isPressed: false,
                source: null,
            }
        }
        // We don't want the menu key to be repeated
        delete this.interactions[Button.MENU];
        delete this.interactions[Button.STATS];
        this.init();
    }

    /**
     * Sets up event handlers and initializes gamepad and keyboard controls.
     *
     * @remarks
     * This method configures event listeners for both gamepad and keyboard inputs.
     * It handles gamepad connections/disconnections and button press events, and ensures keyboard controls are set up.
     * Additionally, it manages the game's behavior when it loses focus to prevent unwanted game actions during this state.
     */
    init(): void {
        this.events = this.scene.game.events;

        if (localStorage.hasOwnProperty('selectedDevice')) {
            this.selectedDevice = JSON.parse(localStorage.getItem('selectedDevice'));
        }
        this.scene.game.events.on(Phaser.Core.Events.BLUR, () => {
            this.loseFocus()
        })

        if (typeof this.scene.input.gamepad !== 'undefined') {
            this.scene.input.gamepad.on('connected', function (thisGamepad) {
                if (!thisGamepad) return;
                this.refreshGamepads();
                this.setupGamepad(thisGamepad);
                this.onReconnect(thisGamepad);
            }, this);

            this.scene.input.gamepad.on('disconnected', function (thisGamepad) {
                this.onDisconnect(thisGamepad); // when a gamepad is disconnected
            }, this);

            // Check to see if the gamepad has already been setup by the browser
            this.scene.input.gamepad.refreshPads();
            if (this.scene.input.gamepad.total) {
                this.refreshGamepads();
                for (const thisGamepad of this.gamepads) {
                    this.scene.input.gamepad.emit('connected', thisGamepad);
                }
            }

            this.scene.input.gamepad.on('down', this.gamepadButtonDown, this);
            this.scene.input.gamepad.on('up', this.gamepadButtonUp, this);
            this.scene.input.keyboard.on('keydown', this.keyboardKeyDown, this);
            this.scene.input.keyboard.on('keyup', this.keyboardKeyUp, this);
        }
        initTouchControls(this.events);
        // Keyboard
        // this.setupKeyboardControls();
    }

    /**
     * Handles actions to take when the game loses focus, such as deactivating pressed keys.
     *
     * @remarks
     * This method is triggered when the game or the browser tab loses focus. It ensures that any keys pressed are deactivated to prevent stuck keys affecting gameplay when the game is not active.
     */
    loseFocus(): void {
        this.deactivatePressedKey();
    }

    /**
     * Enables or disables support for gamepad input.
     *
     * @param value - A boolean indicating whether gamepad support should be enabled (true) or disabled (false).
     *
     * @remarks
     * This method toggles gamepad support. If disabled, it also ensures that all currently pressed gamepad buttons are deactivated to avoid stuck inputs.
     */
    setGamepadSupport(value: boolean): void {
        if (value) {
            this.gamepadSupport = true;
        } else {
            this.gamepadSupport = false;
            // if we disable the gamepad, we want to release every key pressed
            this.deactivatePressedKey();
        }
    }

    /**
     * Sets the currently chosen gamepad and initializes related settings.
     * This method first deactivates any active key presses and then initializes the gamepad settings.
     *
     * @param gamepad - The identifier of the gamepad to set as chosen.
     */
    setChosenGamepad(gamepad: String): void {
        this.deactivatePressedKey();
        this.initChosenGamepad(gamepad)
    }

    setChosenKeyboardLayout(layoutKeyboard: String): void {
        this.deactivatePressedKey();
        this.initChosenLayoutKeyboard(layoutKeyboard)
    }

    /**
     * Updates the interaction handling by processing input states.
     * This method gives priority to certain buttons by reversing the order in which they are checked.
     * This method loops through all button values, checks for valid and timely interactions, and conditionally processes
     * or ignores them based on the current state of gamepad support and other criteria.
     *
     * It handles special conditions such as the absence of gamepad support or mismatches between the source of the input and
     * the currently chosen gamepad. It also respects the paused state of updates to prevent unwanted input processing.
     *
     * If an interaction is valid and should be processed, it emits an 'input_down' event with details of the interaction.
     */
    update(): void {
        for (const b of Utils.getEnumValues(Button).reverse()) {
            if (
                this.interactions.hasOwnProperty(b) &&
                this.repeatInputDurationJustPassed(b as Button) &&
                this.interactions[b].isPressed
            ) {
                // Prevents repeating button interactions when gamepad support is disabled.
                if (
                    (!this.gamepadSupport && this.interactions[b].source === 'gamepad') ||
                    (this.interactions[b].source === 'gamepad' && this.interactions[b].sourceName && this.interactions[b].sourceName !== this.selectedDevice[Device.GAMEPAD]) ||
                    (this.interactions[b].source === 'keyboard' && this.interactions[b].sourceName && this.interactions[b].sourceName !== this.selectedDevice[Device.KEYBOARD]) ||
                    this.pauseUpdate
                ) {
                    // Deletes the last interaction for a button if gamepad is disabled.
                    this.delLastProcessedMovementTime(b as Button);
                    return;
                }
                // Emits an event for the button press.
                this.events.emit('input_down', {
                    controller_type: this.interactions[b].source,
                    button: b,
                });
                this.setLastProcessedMovementTime(b as Button, this.interactions[b].source, this.interactions[b].sourceName);
            }
        }
    }

    /**
     * Retrieves the identifiers of all connected gamepads, excluding any that are currently marked as disconnected.
     * @returns Array<String> An array of strings representing the IDs of the connected gamepads.
     */
    getGamepadsName(): Array<String> {
        return this.gamepads.filter(g => !this.disconnectedGamepads.includes(g.id)).map(g => g.id);
    }

    /**
     * Initializes the chosen gamepad by setting its identifier in the local storage and updating the UI to reflect the chosen gamepad.
     * If a gamepad name is provided, it uses that as the chosen gamepad; otherwise, it defaults to the currently chosen gamepad.
     * @param gamepadName Optional parameter to specify the name of the gamepad to initialize as chosen.
     */
    initChosenGamepad(gamepadName?: String): void {
        if (gamepadName)
            this.selectedDevice[Device.GAMEPAD] = gamepadName.toLowerCase();
        localStorage.setItem('selectedDevice', JSON.stringify(this.selectedDevice));
        const handler = this.scene.ui?.handlers[Mode.SETTINGS_GAMEPAD] as SettingsGamepadUiHandler;
        handler && handler.updateChosenGamepadDisplay()
    }

    initChosenLayoutKeyboard(layoutKeyboard?: String): void {
        if (layoutKeyboard)
            this.selectedDevice[Device.KEYBOARD] = layoutKeyboard.toLowerCase();
        localStorage.setItem('selectedDevice', JSON.stringify(this.selectedDevice));
        const handler = this.scene.ui?.handlers[Mode.SETTINGS_KEYBOARD] as SettingsKeyboardUiHandler;
        handler && handler.updateChosenKeyboardDisplay()
    }

    /**
     * Handles the disconnection of a gamepad by adding its identifier to a list of disconnected gamepads.
     * This is necessary because Phaser retains memory of previously connected gamepads, and without tracking
     * disconnections, it would be impossible to determine the connection status of gamepads. This method ensures
     * that disconnected gamepads are recognized and can be appropriately hidden in the gamepad selection menu.
     *
     * @param thisGamepad The gamepad that has been disconnected.
     */
    onDisconnect(thisGamepad: Phaser.Input.Gamepad.Gamepad): void {
        this.disconnectedGamepads.push(thisGamepad.id);
    }

    /**
     * Updates the tracking of disconnected gamepads when a gamepad is reconnected.
     * It removes the reconnected gamepad's identifier from the `disconnectedGamepads` array,
     * effectively updating its status to connected.
     *
     * @param thisGamepad The gamepad that has been reconnected.
     */
    onReconnect(thisGamepad: Phaser.Input.Gamepad.Gamepad): void {
        this.disconnectedGamepads = this.disconnectedGamepads.filter(g => g !== thisGamepad.id);
    }

    /**
     * Initializes or updates configurations for connected gamepads.
     * It retrieves the names of all connected gamepads, sets up their configurations according to stored or default settings,
     * and ensures these configurations are saved. If the connected gamepad is the currently chosen one,
     * it reinitializes the chosen gamepad settings.
     *
     * @param thisGamepad The gamepad that is being set up.
     */
    setupGamepad(thisGamepad: Phaser.Input.Gamepad.Gamepad): void {
        const allGamepads = this.getGamepadsName();
        for (const gamepad of allGamepads) {
            const gamepadID = gamepad.toLowerCase();
            if (!this.selectedDevice[Device.GAMEPAD])
                this.setChosenGamepad(gamepadID);
            const config = deepCopy(this.getConfig(gamepadID));
            config.custom = this.configs[gamepadID]?.custom || {...config.default};
            this.configs[gamepadID] = config;
            this.scene.gameData?.saveMappingConfigs(gamepadID, this.configs[gamepadID]);
        }
        this.initChosenGamepad(this.selectedDevice[Device.GAMEPAD])
    }

    setupKeyboard(): void {
        for (const layout of ['default']) {
            const config = deepCopy(this.getConfigKeyboard(layout));
            config.custom = this.configs[layout]?.custom || {...config.default};
            this.configs[layout] = config;
            this.scene.gameData?.saveMappingConfigs(this.selectedDevice[Device.KEYBOARD], this.configs[layout]);
        }
        this.initChosenLayoutKeyboard(this.selectedDevice[Device.KEYBOARD])
    }

    /**
     * Refreshes and re-indexes the list of connected gamepads.
     *
     * @remarks
     * This method updates the list of gamepads to exclude any that are undefined.
     * It corrects the index of each gamepad to account for any previously undefined entries,
     * ensuring that all gamepads are properly indexed and can be accurately referenced within the game.
     */
    refreshGamepads(): void {
        // Sometimes, gamepads are undefined. For some reason.
        this.gamepads = this.scene.input.gamepad.gamepads.filter(function (el) {
            return el != null;
        });

        for (const [index, thisGamepad] of this.gamepads.entries()) {
            thisGamepad.index = index; // Overwrite the gamepad index, in case we had undefined gamepads earlier
        }
    }

    checkIfKeyboardIsInit(): void {
        if (!this.getActiveConfig(Device.KEYBOARD)?.padID)
            this.setupKeyboard();
    }

    keyboardKeyDown(event): void {
        const keyDown = event.keyCode;
        this.checkIfKeyboardIsInit();
        if (this.keys.includes(keyDown)) return;
        this.keys.push(keyDown);
        const buttonDown = getButtonWithKeycode(this.getActiveConfig(Device.KEYBOARD), keyDown);
        this.lastSource = 'keyboard';
        if (buttonDown !== undefined) {
            this.events.emit('input_down', {
                controller_type: 'keyboard',
                button: buttonDown,
            });
            this.setLastProcessedMovementTime(buttonDown, 'keyboard', this.selectedDevice[Device.KEYBOARD]);
        }
    }

    keyboardKeyUp(event): void {
        const keyDown = event.keyCode;
        this.keys = this.keys.filter(k => k !== keyDown);
        this.checkIfKeyboardIsInit()
        const buttonUp = getButtonWithKeycode(this.getActiveConfig(Device.KEYBOARD), keyDown);
        if (buttonUp !== undefined) {
            this.events.emit('input_up', {
                controller_type: 'keyboard',
                button: buttonUp,
            });
            this.delLastProcessedMovementTime(buttonUp);
        }
    }

    /**
     * Handles button press events on a gamepad. This method sets the gamepad as chosen on the first input if no gamepad is currently chosen.
     * It checks if gamepad support is enabled and if the event comes from the chosen gamepad. If so, it maps the button press to a specific
     * action using a custom configuration, emits an event for the button press, and records the time of the action.
     *
     * @param pad The gamepad on which the button was pressed.
     * @param button The specific button that was pressed.
     * @param value The intensity or value of the button press, if applicable.
     */
    gamepadButtonDown(pad: Phaser.Input.Gamepad.Gamepad, button: Phaser.Input.Gamepad.Button, value: number): void {
        if (!this.configs[this.selectedDevice[Device.KEYBOARD]]?.padID)
            this.setupKeyboard();
        if (!pad) return;
        if (!this.selectedDevice[Device.GAMEPAD])
            this.setChosenGamepad(pad.id);
        if (!this.gamepadSupport || pad.id.toLowerCase() !== this.selectedDevice[Device.GAMEPAD].toLowerCase()) return;
        const buttonDown = getButtonWithKeycode(this.getActiveConfig(Device.GAMEPAD), button.index);
        this.lastSource = 'gamepad';
        if (buttonDown !== undefined) {
            this.events.emit('input_down', {
                controller_type: 'gamepad',
                button: buttonDown,
            });
            this.setLastProcessedMovementTime(buttonDown, 'gamepad', pad.id);
        }
    }

    /**
     * Responds to a button release event on a gamepad by checking if the gamepad is supported and currently chosen.
     * If conditions are met, it identifies the configured action for the button, emits an event signaling the button release,
     * and clears the record of the button.
     *
     * @param pad The gamepad from which the button was released.
     * @param button The specific button that was released.
     * @param value The intensity or value of the button release, if applicable.
     */
    gamepadButtonUp(pad: Phaser.Input.Gamepad.Gamepad, button: Phaser.Input.Gamepad.Button, value: number): void {
        if (!pad) return;
        if (!this.gamepadSupport || pad.id.toLowerCase() !== this.selectedDevice[Device.GAMEPAD]) return;
        const buttonUp = getButtonWithKeycode(this.getActiveConfig(Device.GAMEPAD), button.index);
        if (buttonUp !== undefined) {
            this.events.emit('input_up', {
                controller_type: 'gamepad',
                button: buttonUp,
            });
            this.delLastProcessedMovementTime(buttonUp);
        }
    }

    /**
     * Retrieves the configuration object for a gamepad based on its identifier. The method identifies specific gamepad models
     * based on substrings in the identifier and returns predefined configurations for recognized models.
     * If no specific configuration matches, it defaults to a generic gamepad configuration.
     *
     * @param id The identifier string of the gamepad.
     * @returns InterfaceConfig The configuration object corresponding to the identified gamepad type.
     */
    getConfig(id: string): InterfaceConfig {
        id = id.toLowerCase();

        if (id.includes('081f') && id.includes('e401')) {
            return pad_unlicensedSNES;
        } else if (id.includes('xbox') && id.includes('360')) {
            return pad_xbox360;
        } else if (id.includes('054c')) {
            return pad_dualshock;
        }

        return pad_generic;
    }

    getConfigKeyboard(id: string): InterfaceConfig {
        if (id === 'default')
            return cfg_keyboard_azerty;

        return cfg_keyboard_azerty;
    }

    /**
     * repeatInputDurationJustPassed returns true if @param button has been held down long
     * enough to fire a repeated input. A button must claim the buttonLock before
     * firing a repeated input - this is to prevent multiple buttons from firing repeatedly.
     */
    repeatInputDurationJustPassed(button: Button): boolean {
        if (!this.isButtonLocked(button)) return false;
        if (this.time.now - this.interactions[button].pressTime >= repeatInputDelayMillis) {
            return true;
        }
    }

    /**
     * This method updates the interaction state to reflect that the button is pressed.
     *
     * @param button - The button for which to set the interaction.
     * @param source - The source of the input (defaults to 'keyboard'). This helps identify the origin of the input, especially useful in environments with multiple input devices.
     *
     * @remarks
     * This method is responsible for updating the interaction state of a button within the `interactions` dictionary. If the button is not already registered, this method returns immediately.
     * When invoked, it performs the following updates:
     * - `pressTime`: Sets this to the current time, representing when the button was initially pressed.
     * - `isPressed`: Marks the button as currently being pressed.
     * - `source`: Identifies the source device of the input, which can vary across different hardware (e.g., keyboard, gamepad).
     *
     * Additionally, this method locks the button (by calling `setButtonLock`) to prevent it from being re-processed until it is released, ensuring that each press is handled distinctly.
     */
    setLastProcessedMovementTime(button: Button, source: String = 'keyboard', sourceName?: String): void {
        if (!this.interactions.hasOwnProperty(button)) return;
        this.setButtonLock(button);
        this.interactions[button].pressTime = this.time.now;
        this.interactions[button].isPressed = true;
        this.interactions[button].source = source;
        this.interactions[button].sourceName = sourceName.toLowerCase();
    }

    /**
     * Clears the last interaction for a specified button.
     *
     * @param button - The button for which to clear the interaction.
     *
     * @remarks
     * This method resets the interaction details of the button, allowing it to be processed as a new input when pressed again.
     * If the button is not registered in the `interactions` dictionary, this method returns immediately, otherwise:
     * - `pressTime` is cleared. This was previously storing the timestamp of when the button was initially pressed.
     * - `isPressed` is set to false, indicating that the button is no longer being pressed.
     * - `source` is set to null, which had been indicating the device from which the button input was originating.
     *
     * It releases the button lock, which prevents the button from being processed repeatedly until it's explicitly released.
     */
    delLastProcessedMovementTime(button: Button): void {
        if (!this.interactions.hasOwnProperty(button)) return;
        this.releaseButtonLock(button);
        this.interactions[button].pressTime = null;
        this.interactions[button].isPressed = false;
        this.interactions[button].source = null;
        this.interactions[button].sourceName = null;
    }

    /**
     * Deactivates all currently pressed keys and resets their interaction states.
     *
     * @remarks
     * This method is used to reset the state of all buttons within the `interactions` dictionary,
     * effectively deactivating any currently pressed keys. It performs the following actions:
     *
     * - Releases button locks for predefined buttons (`buttonLock` and `buttonLock2`), allowing them
     *   to be pressed again or properly re-initialized in future interactions.
     * - Iterates over all possible button values obtained via `Utils.getEnumValues(Button)`, and for
     *   each button:
     *   - Checks if the button is currently registered in the `interactions` dictionary.
     *   - Resets `pressTime` to null, indicating that there is no ongoing interaction.
     *   - Sets `isPressed` to false, marking the button as not currently active.
     *   - Clears the `source` field, removing the record of which device the button press came from.
     *
     * This method is typically called when needing to ensure that all inputs are neutralized.
     */
    deactivatePressedKey(): void {
        this.pauseUpdate = true;
        this.releaseButtonLock(this.buttonLock);
        this.releaseButtonLock(this.buttonLock2);
        for (const b of Utils.getEnumValues(Button)) {
            if (this.interactions.hasOwnProperty(b)) {
                this.interactions[b].pressTime = null;
                this.interactions[b].isPressed = false;
                this.interactions[b].source = null;
                this.interactions[b].sourceName = null;
            }
        }
        setTimeout(() => this.pauseUpdate = false, 500);
    }

    /**
     * Checks if a specific button is currently locked.
     *
     * @param button - The button to check for a lock status.
     * @returns `true` if the button is either of the two potentially locked buttons (`buttonLock` or `buttonLock2`), otherwise `false`.
     *
     * @remarks
     * This method is used to determine if a given button is currently prevented from being processed due to a lock.
     * It checks against two separate lock variables, allowing for up to two buttons to be locked simultaneously.
     */
    isButtonLocked(button: Button): boolean {
        return (this.buttonLock === button || this.buttonLock2 === button);
    }

    /**
     * Sets a lock on a given button if it is not already locked.
     *
     * @param button - The button to lock.
     *
     * @remarks
     * This method ensures that a button is not processed multiple times inadvertently.
     * It checks if the button is already locked by either of the two lock variables (`buttonLock` or `buttonLock2`).
     * If not, it locks the button using the first available lock variable.
     * This mechanism allows for up to two buttons to be locked at the same time.
     */
    setButtonLock(button: Button): void {
        if (this.buttonLock === button || this.buttonLock2 === button) return;
        if (this.buttonLock === button) this.buttonLock2 = button;
        else if (this.buttonLock2 === button) this.buttonLock = button;
        else if (!!this.buttonLock) this.buttonLock2 = button;
        else this.buttonLock = button;
    }

    /**
     * Releases a lock on a specific button, allowing it to be processed again.
     *
     * @param button - The button whose lock is to be released.
     *
     * @remarks
     * This method checks both lock variables (`buttonLock` and `buttonLock2`).
     * If either lock matches the specified button, that lock is cleared.
     * This action frees the button to be processed again, ensuring it can respond to new inputs.
     */
    releaseButtonLock(button: Button): void {
        if (this.buttonLock === button) this.buttonLock = null;
        else if (this.buttonLock2 === button) this.buttonLock2 = null;
    }

    /**
     * Retrieves the active configuration for the currently chosen device.
     * It checks if a specific device ID is stored in configurations and returns it.
     *
     * @returns InterfaceConfig The configuration object for the active gamepad, or null if not set.
     */
    getActiveConfig(device: Device) {
        if (this.configs[this.selectedDevice[device]]?.padID) return this.configs[this.selectedDevice[device]]
        return null;
    }

    /**
     * Injects a custom mapping configuration into the gamepad configuration for a specific gamepad.
     * If the gamepad does not have an existing configuration, it initializes one first.
     *
     * @param gamepadName The identifier of the gamepad to configure.
     * @param customMappings The custom mapping configuration to apply to the gamepad.
     */
    injectConfig(selectedDevice: string, mappingConfigs): void {
        if (!this.configs[selectedDevice]) this.configs[selectedDevice] = {};
        this.configs[selectedDevice].custom = mappingConfigs.custom;
        this.configs[selectedDevice].main = mappingConfigs.main;
        this.configs[selectedDevice].alt = mappingConfigs.alt;
        regenerateIdentifiers(this.configs[selectedDevice]);
    }

    swapBinding(config, settingName, pressedButton): void {
        this.pauseUpdate = true;
        swap(config, settingName, pressedButton);
        setTimeout(() => this.pauseUpdate = false, 500);
    }
}