import { globalScene } from "#app/global-scene";
import { TouchControl } from "#app/touch-controls";
import { Button } from "#enums/buttons";
import { Device } from "#enums/devices";
import { UiMode } from "#enums/ui-mode";
import { CFG_KEYBOARD_QWERTY } from "#inputs/cfg-keyboard-qwerty";
import { assign, getButtonWithKeycode, getIconForLatestInput, swap } from "#inputs/config-handler";
import { PAD_DUALSHOCK } from "#inputs/pad-dualshock";
import { PAD_GENERIC } from "#inputs/pad-generic";
import { PAD_PROCON } from "#inputs/pad-procon";
import { PAD_UNLICENSED_SNES } from "#inputs/pad-unlicensed-snes";
import { PAD_XBOX360 } from "#inputs/pad-xbox360";
import type {
  CustomInterfaceConfig,
  CustomKeyboardConfig,
  CustomPadConfig,
  Interaction,
  InterfaceConfig,
  MappingSettingName,
  SelectedDevice,
} from "#types/configs/inputs";
import { MoveTouchControlsHandler } from "#ui/move-touch-controls-handler";
import type { SettingsGamepadUiHandler } from "#ui/settings-gamepad-ui-handler";
import type { SettingsKeyboardUiHandler } from "#ui/settings-keyboard-ui-handler";
import { deepCopy } from "#utils/data";
import { getEnumValues } from "#utils/enums";
import Phaser from "phaser";

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
  private gamepads: Phaser.Input.Gamepad.Gamepad[] = [];
  public events: Phaser.Events.EventEmitter;

  private buttonLock: Button[] = [];
  private readonly interactions: Partial<Record<Button, Interaction>> = {};
  private configs: Record<string, InterfaceConfig> = {};

  public gamepadSupport = true;
  public selectedDevice: SelectedDevice;

  private disconnectedGamepads: string[] = [];

  public lastSource = "keyboard";
  private readonly inputInterval: NodeJS.Timeout[] = [];
  private touchControls: TouchControl;
  public moveTouchControlsHandler: MoveTouchControlsHandler;

  /**
   * Initializes a new instance of the game control system, setting up initial state and configurations.
   *
   * @remarks
   * This constructor initializes the game control system with necessary setups for handling inputs.
   * It prepares an interactions array indexed by button identifiers and configures default states for each button.
   * Specific buttons like MENU and STATS are set not to repeat their actions.
   * It concludes by calling the `init` method to complete the setup.
   */
  constructor() {
    this.selectedDevice = {
      [Device.KEYBOARD]: "default",
    };

    for (const b of getEnumValues(Button)) {
      // We don't want the menu key to be repeated
      if (b === Button.MENU || b === Button.STATS) {
        continue;
      }
      this.interactions[b] = {
        pressTime: false,
        isPressed: false,
        source: null,
      };
    }
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
    this.events = globalScene.game.events;

    globalScene.game.events.on(Phaser.Core.Events.BLUR, () => {
      this.loseFocus();
    });

    if (typeof globalScene.input.gamepad !== "undefined") {
      globalScene.input.gamepad?.on(
        "connected",
        function (this: InputsController, thisGamepad: Phaser.Input.Gamepad.Gamepad) {
          if (!thisGamepad) {
            return;
          }
          this.refreshGamepads();
          this.setupGamepad();
          this.onReconnect(thisGamepad);
        },
        this,
      );

      globalScene.input.gamepad?.on(
        "disconnected",
        function (this: InputsController, thisGamepad: Phaser.Input.Gamepad.Gamepad) {
          this.onDisconnect(thisGamepad); // when a gamepad is disconnected
        },
        this,
      );

      // Check to see if the gamepad has already been setup by the browser
      globalScene.input.gamepad?.refreshPads();
      if (globalScene.input.gamepad?.total) {
        this.refreshGamepads();
        for (const thisGamepad of this.gamepads) {
          globalScene.input.gamepad.emit("connected", thisGamepad);
        }
      }

      globalScene.input.gamepad?.on("down", this.gamepadButtonDown, this).on("up", this.gamepadButtonUp, this);
      globalScene.input.keyboard?.on("keydown", this.keyboardKeyDown, this).on("keyup", this.keyboardKeyUp, this);
    }
    this.touchControls = new TouchControl();
    this.moveTouchControlsHandler = new MoveTouchControlsHandler(this.touchControls);
  }

  /**
   * Handles actions to take when the game loses focus, such as deactivating pressed keys.
   *
   * @remarks
   * This method is triggered when the game or the browser tab loses focus. It ensures that any keys pressed are deactivated to prevent stuck keys affecting gameplay when the game is not active.
   */
  loseFocus(): void {
    this.deactivatePressedKey();
    this.touchControls.deactivatePressedKey();
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
      this.deactivatePressedKey();
    }
  }

  /**
   * Sets the currently chosen gamepad and initializes related settings.
   * This method first deactivates any active key presses and then initializes the gamepad settings.
   *
   * @param gamepad - The identifier of the gamepad to set as chosen.
   */
  setChosenGamepad(gamepad: string): void {
    this.deactivatePressedKey();
    this.initChosenGamepad(gamepad);
  }

  /**
   * Sets the currently chosen keyboard layout and initializes related settings.
   *
   * @param layoutKeyboard - The identifier of the keyboard layout to set as chosen.
   */
  setChosenKeyboardLayout(layoutKeyboard: string): void {
    this.deactivatePressedKey();
    this.initChosenLayoutKeyboard(layoutKeyboard);
  }

  /**
   * Retrieves the identifiers of all connected gamepads, excluding any that are currently marked as disconnected.
   * @returns Array<String> An array of strings representing the IDs of the connected gamepads.
   */
  getGamepadsName(): string[] {
    return this.gamepads.filter(g => !this.disconnectedGamepads.includes(g.id)).map(g => g.id);
  }

  /**
   * Initializes the chosen gamepad by setting its identifier in the local storage and updating the UI to reflect the chosen gamepad.
   * If a gamepad name is provided, it uses that as the chosen gamepad; otherwise, it defaults to the currently chosen gamepad.
   * @param gamepadName Optional parameter to specify the name of the gamepad to initialize as chosen.
   */
  initChosenGamepad(gamepadName?: string): void {
    if (gamepadName) {
      this.selectedDevice[Device.GAMEPAD] = gamepadName.toLowerCase();
    }
    const handler = globalScene.ui?.handlers[UiMode.SETTINGS_GAMEPAD] as SettingsGamepadUiHandler;
    handler?.updateChosenGamepadDisplay();
  }

  /**
   * Initializes the chosen keyboard layout by setting its identifier in the local storage and updating the UI to reflect the chosen layout.
   * If a layout name is provided, it uses that as the chosen layout; otherwise, it defaults to the currently chosen layout.
   * @param layoutKeyboard Optional parameter to specify the name of the keyboard layout to initialize as chosen.
   */
  initChosenLayoutKeyboard(layoutKeyboard?: string): void {
    if (layoutKeyboard) {
      this.selectedDevice[Device.KEYBOARD] = layoutKeyboard.toLowerCase();
    }
    const handler = globalScene.ui?.handlers[UiMode.SETTINGS_KEYBOARD] as SettingsKeyboardUiHandler;
    handler?.updateChosenKeyboardDisplay();
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
   * and ensures these configurations are saved.
   */
  setupGamepad(): void {
    const allGamepads = this.getGamepadsName();
    for (const gamepad of allGamepads) {
      const gamepadID = gamepad.toLowerCase();
      if (!this.selectedDevice[Device.GAMEPAD]) {
        this.setChosenGamepad(gamepadID);
      }
      const config = deepCopy(this.getConfig(gamepadID)) as InterfaceConfig;
      config.custom = this.configs[gamepadID]?.custom || { ...config.default };
      this.configs[gamepadID] = config;
      globalScene.gameData?.saveMappingConfigs(gamepadID, this.configs[gamepadID]);
    }
    this.lastSource = "gamepad";
    const handler = globalScene.ui?.handlers[UiMode.SETTINGS_GAMEPAD] as SettingsGamepadUiHandler;
    handler?.updateChosenGamepadDisplay();
  }

  /**
   * Initializes or updates configurations for connected keyboards.
   */
  setupKeyboard(): void {
    for (const layout of ["default"]) {
      const config = deepCopy(this.getConfigKeyboard(layout)) as InterfaceConfig;
      config.custom = this.configs[layout]?.custom || { ...config.default };
      this.configs[layout] = config;
      globalScene.gameData?.saveMappingConfigs(this.selectedDevice[Device.KEYBOARD], this.configs[layout]);
    }
    this.initChosenLayoutKeyboard(this.selectedDevice[Device.KEYBOARD]);
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
    this.gamepads = globalScene.input.gamepad?.gamepads.filter(el => el !== null) ?? [];

    for (const [index, thisGamepad] of this.gamepads.entries()) {
      thisGamepad.index = index; // Overwrite the gamepad index, in case we had undefined gamepads earlier
    }
  }

  /**
   * Ensures the keyboard is initialized by checking if there is an active configuration for the keyboard.
   * If not, it sets up the keyboard with default configurations.
   */
  ensureKeyboardIsInit(): void {
    if (!this.getActiveConfig(Device.KEYBOARD)?.padID) {
      this.setupKeyboard();
    }
  }

  /**
   * Handles the keydown event for the keyboard.
   *
   * @param event The keyboard event.
   */
  keyboardKeyDown(event: KeyboardEvent): void {
    this.lastSource = "keyboard";
    this.ensureKeyboardIsInit();
    const buttonDown = getButtonWithKeycode(this.getActiveConfig(Device.KEYBOARD)!, event.keyCode);
    if (buttonDown != null) {
      if (this.buttonLock.includes(buttonDown)) {
        return;
      }
      this.events.emit("input_down", {
        controller_type: "keyboard",
        button: buttonDown,
      });
      clearInterval(this.inputInterval[buttonDown]);
      this.inputInterval[buttonDown] = setInterval(() => {
        this.events.emit("input_down", {
          controller_type: "keyboard",
          button: buttonDown,
        });
      }, repeatInputDelayMillis);
      this.buttonLock.push(buttonDown);
    }
  }

  /**
   * Handles the keyup event for the keyboard.
   *
   * @param event The keyboard event.
   */
  keyboardKeyUp(event: KeyboardEvent): void {
    this.lastSource = "keyboard";
    // Bang is safe here; can't receive keyboard input if no active keyboard
    const buttonUp = getButtonWithKeycode(this.getActiveConfig(Device.KEYBOARD)!, event.keyCode);
    if (buttonUp != null) {
      this.events.emit("input_up", {
        controller_type: "keyboard",
        button: buttonUp,
      });
      const index = this.buttonLock.indexOf(buttonUp);
      this.buttonLock.splice(index, 1);
      clearInterval(this.inputInterval[buttonUp]);
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
  gamepadButtonDown(pad: Phaser.Input.Gamepad.Gamepad, button: Phaser.Input.Gamepad.Button, _value: number): void {
    if (!this.configs[this.selectedDevice[Device.KEYBOARD]]?.padID) {
      this.setupKeyboard();
    }
    if (!pad) {
      return;
    }
    this.lastSource = "gamepad";
    if (
      !this.selectedDevice[Device.GAMEPAD]
      || (globalScene.ui.getMode() !== UiMode.GAMEPAD_BINDING
        && this.selectedDevice[Device.GAMEPAD] !== pad.id.toLowerCase())
    ) {
      this.setChosenGamepad(pad.id);
    }
    if (!this.gamepadSupport || pad.id.toLowerCase() !== this.selectedDevice[Device.GAMEPAD]?.toLowerCase()) {
      return;
    }
    const activeConfig = this.getActiveConfig(Device.GAMEPAD);
    const buttonDown = activeConfig && getButtonWithKeycode(activeConfig, button.index);
    if (buttonDown != null) {
      if (this.buttonLock.includes(buttonDown)) {
        return;
      }
      this.events.emit("input_down", {
        controller_type: "gamepad",
        button: buttonDown,
      });
      clearInterval(this.inputInterval[buttonDown]);
      this.inputInterval[buttonDown] = setInterval(() => {
        if (!this.buttonLock.includes(buttonDown)) {
          clearInterval(this.inputInterval[buttonDown]);
          return;
        }
        this.events.emit("input_down", {
          controller_type: "gamepad",
          button: buttonDown,
        });
      }, repeatInputDelayMillis);
      this.buttonLock.push(buttonDown);
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
  gamepadButtonUp(pad: Phaser.Input.Gamepad.Gamepad, button: Phaser.Input.Gamepad.Button, _value: number): void {
    if (!pad) {
      return;
    }
    this.lastSource = "gamepad";
    if (!this.gamepadSupport || pad.id.toLowerCase() !== this.selectedDevice[Device.GAMEPAD]) {
      return;
    }
    // Bang is safe here; can't receive gamepad input if no active gamepad
    const buttonUp = getButtonWithKeycode(this.getActiveConfig(Device.GAMEPAD)!, button.index);
    if (buttonUp !== undefined) {
      this.events.emit("input_up", {
        controller_type: "gamepad",
        button: buttonUp,
      });
      const index = this.buttonLock.indexOf(buttonUp);
      this.buttonLock.splice(index, 1);
      clearInterval(this.inputInterval[buttonUp]);
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

    if (id.includes("081f") && id.includes("e401")) {
      return PAD_UNLICENSED_SNES as InterfaceConfig;
    }
    if (id.includes("xbox") && id.includes("360")) {
      return PAD_XBOX360 as InterfaceConfig;
    }
    if (id.includes("054c")) {
      return PAD_DUALSHOCK as InterfaceConfig;
    }
    if (id.includes("057e") && id.includes("2009")) {
      return PAD_PROCON as InterfaceConfig;
    }

    return PAD_GENERIC as InterfaceConfig;
  }

  /**
   * Retrieves the configuration object for a keyboard layout based on its identifier.
   *
   * @param id The identifier string of the keyboard layout.
   * @returns InterfaceConfig The configuration object corresponding to the identified keyboard layout.
   */
  getConfigKeyboard(id: string): InterfaceConfig {
    if (id === "default") {
      return CFG_KEYBOARD_QWERTY;
    }

    return CFG_KEYBOARD_QWERTY;
  }

  /**
   * Deactivates all currently pressed keys.
   */
  deactivatePressedKey(): void {
    for (const value of Object.values(this.inputInterval)) {
      clearInterval(value);
    }
    this.buttonLock = [];
  }

  /**
   * Retrieves the active configuration for the currently chosen device.
   * It checks if a specific device ID is stored in configurations and returns it.
   *
   * @returns InterfaceConfig The configuration object for the active gamepad, or null if not set.
   */
  getActiveConfig(device: Device.KEYBOARD): CustomKeyboardConfig | null;
  getActiveConfig(device: Device.GAMEPAD): CustomPadConfig | null;
  getActiveConfig(device: Device): CustomInterfaceConfig | null;
  getActiveConfig(device: Device): CustomInterfaceConfig | null {
    const activeDevice = this.selectedDevice[device];
    if (activeDevice == null) {
      return null;
    }
    const config = this.configs[activeDevice];
    if (config?.padID) {
      config.custom ??= { ...config.default };
      // Cast is safe here as we assign `custom` above if it was undefined
      return config as CustomInterfaceConfig;
    }
    return null;
  }

  getIconForLatestInputRecorded(settingName: MappingSettingName): string | undefined {
    if (this.lastSource === "keyboard") {
      this.ensureKeyboardIsInit();
    }
    return getIconForLatestInput(this.configs, this.lastSource, this.selectedDevice, settingName);
  }

  getLastSourceDevice(): Device {
    if (this.lastSource === "gamepad") {
      return Device.GAMEPAD;
    }
    return Device.KEYBOARD;
  }

  getLastSourceConfig(): InterfaceConfig | null {
    const sourceDevice = this.getLastSourceDevice();
    if (sourceDevice === Device.KEYBOARD) {
      this.ensureKeyboardIsInit();
    }
    return this.getActiveConfig(sourceDevice);
  }

  getLastSourceType(): string | undefined {
    return this.getLastSourceConfig()?.padType;
  }

  /**
   * Injects a custom mapping configuration into the configuration for a specific gamepad.
   * If the device does not have an existing configuration, it initializes one first.
   *
   * @param selectedDevice The identifier of the device to configure.
   * @param mappingConfigs The mapping configuration to apply to the device.
   */
  injectConfig(selectedDevice: string, mappingConfigs: InterfaceConfig): void {
    if (!this.configs[selectedDevice]) {
      this.configs[selectedDevice] = {} as InterfaceConfig;
    }
    // A proper way of handling migrating keybinds would be much better
    const mappingOverrides = {
      BUTTON_CYCLE_VARIANT: "BUTTON_CYCLE_TERA",
    };
    type mappingConfigKey = keyof typeof mappingConfigs.custom;
    for (const key in mappingConfigs.custom) {
      if (mappingConfigs.custom[key as mappingConfigKey] in mappingOverrides) {
        // @ts-expect-error - TS narrows mappingConfigs.custom[key] to never for some reason
        mappingConfigs.custom[key as mappingConfigKey] =
          mappingOverrides[mappingConfigs.custom[key as mappingConfigKey] as keyof typeof mappingOverrides];
      }
    }
    this.configs[selectedDevice].custom = mappingConfigs.custom;
  }

  resetConfigs(): void {
    this.configs = {};
    if (this.getGamepadsName()?.length > 0) {
      this.setupGamepad();
    }
    this.setupKeyboard();
  }

  /**
   * Swaps a binding in the configuration.
   *
   * @param config - The configuration object.
   * @param settingName - The name of the setting to swap.
   * @param pressedButton - The keycode of the button that was pressed.
   */
  assignBinding(config: CustomInterfaceConfig, settingName: MappingSettingName, pressedButton: number): boolean {
    this.deactivatePressedKey();
    if (config.padType === "keyboard") {
      return assign(config, settingName, pressedButton);
    }
    return swap(config, settingName, pressedButton);
  }
}
