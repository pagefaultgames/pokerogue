import Phaser from "phaser";
import * as Utils from "./utils";
import {initTouchControls} from "./touch-controls";
import pad_generic from "./configs/pad_generic";
import pad_unlicensedSNES from "./configs/pad_unlicensedSNES";
import pad_xbox360 from "./configs/pad_xbox360";
import pad_dualshock from "./configs/pad_dualshock";
import pad_procon from "./configs/pad_procon";
import {Button} from "./enums/buttons";
import BattleScene from "./battle-scene";

export interface GamepadMapping {
    [key: string]: number;
}

export interface GamepadConfig {
    padID: string;
    padType: string;
    gamepadMapping: GamepadMapping;
}

export interface ActionGamepadMapping {
    [key: string]: Button;
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
  private gamepads: Phaser.Input.Gamepad.Gamepad[] = new Array();
  private scene: BattleScene;

  private buttonLock: Button;
  private buttonLock2: Button;
  private interactions: Map<Button, Map<string, boolean>> = new Map();
  private time: Phaser.Time.Clock;
  private player: GamepadMapping;

  private gamepadSupport: boolean = true;
  public events: Phaser.Events.EventEmitter;

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
  constructor(scene: BattleScene) {
    this.scene = scene;
    this.time = this.scene.time;
    this.buttonKeys = [];

    for (const b of Utils.getEnumValues(Button)) {
      this.interactions[b] = {
        pressTime: false,
        isPressed: false,
        source: null,
      };
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
    this.events = new Phaser.Events.EventEmitter();
    this.scene.game.events.on(Phaser.Core.Events.BLUR, () => {
      this.loseFocus();
    });

    if (typeof this.scene.input.gamepad !== "undefined") {
      this.scene.input.gamepad.on("connected", function (thisGamepad) {
        this.refreshGamepads();
        this.setupGamepad(thisGamepad);
      }, this);

      // Check to see if the gamepad has already been setup by the browser
      if (this.scene.input.gamepad.total) {
        this.refreshGamepads();
        for (const thisGamepad of this.gamepads) {
          this.scene.input.gamepad.emit("connected", thisGamepad);
        }
      }

      this.scene.input.gamepad.on("down", this.gamepadButtonDown, this);
      this.scene.input.gamepad.on("up", this.gamepadButtonUp, this);
    }

    // Keyboard
    this.setupKeyboardControls();
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
     * Updates the interaction handling by processing input states.
     * This method gives priority to certain buttons by reversing the order in which they are checked.
     *
     * @remarks
     * The method iterates over all possible buttons, checking for specific conditions such as:
     * - If the button is registered in the `interactions` dictionary.
     * - If the button has been held down long enough.
     * - If the button is currently pressed.
     *
     * Special handling is applied if gamepad support is disabled but a gamepad source is still triggering inputs,
     * preventing potential infinite loops by removing the last processed movement time for the button.
     */
  update(): void {
    for (const b of Utils.getEnumValues(Button).reverse()) {
      if (
        this.interactions.hasOwnProperty(b) &&
                this.repeatInputDurationJustPassed(b) &&
                this.interactions[b].isPressed
      ) {
        // Prevents repeating button interactions when gamepad support is disabled.
        if (!this.gamepadSupport && this.interactions[b].source === "gamepad") {
          // Deletes the last interaction for a button if gamepad is disabled.
          this.delLastProcessedMovementTime(b);
          return;
        }
        // Emits an event for the button press.
        this.events.emit("input_down", {
          controller_type: this.interactions[b].source,
          button: b,
        });
        this.setLastProcessedMovementTime(b, this.interactions[b].source);
      }
    }
  }

  /**
     * Configures a gamepad for use based on its device ID.
     *
     * @param thisGamepad - The gamepad to set up.
     *
     * @remarks
     * This method initializes a gamepad by mapping its ID to a predefined configuration.
     * It updates the player's gamepad mapping based on the identified configuration, ensuring
     * that the gamepad controls are correctly mapped to in-game actions.
     */
  setupGamepad(thisGamepad: Phaser.Input.Gamepad.Gamepad): void {
    const gamepadID = thisGamepad.id.toLowerCase();
    const mappedPad = this.mapGamepad(gamepadID);
    this.player = mappedPad.gamepadMapping;
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
      return el !== null;
    });

    for (const [index, thisGamepad] of this.gamepads.entries()) {
      thisGamepad.index = index; // Overwrite the gamepad index, in case we had undefined gamepads earlier
    }
  }

  /**
     * Retrieves the current gamepad mapping for in-game actions.
     *
     * @returns An object mapping gamepad buttons to in-game actions based on the player's current gamepad configuration.
     *
     * @remarks
     * This method constructs a mapping of gamepad buttons to in-game action buttons according to the player's
     * current gamepad configuration. If no configuration is available, it returns an empty mapping.
     * The mapping includes directional controls, action buttons, and system commands among others,
     * adjusted for any custom settings such as swapped action buttons.
     */
  getActionGamepadMapping(): ActionGamepadMapping {
    const gamepadMapping = {};
    if (!this?.player) {
      return gamepadMapping;
    }
    gamepadMapping[this.player.LC_N] = Button.UP;
    gamepadMapping[this.player.LC_S] = Button.DOWN;
    gamepadMapping[this.player.LC_W] = Button.LEFT;
    gamepadMapping[this.player.LC_E] = Button.RIGHT;
    gamepadMapping[this.player.TOUCH] = Button.SUBMIT;
    gamepadMapping[this.player.RC_S] = this.scene.abSwapped ? Button.CANCEL : Button.ACTION;
    gamepadMapping[this.player.RC_E] = this.scene.abSwapped ? Button.ACTION : Button.CANCEL;
    gamepadMapping[this.player.SELECT] = Button.STATS;
    gamepadMapping[this.player.START] = Button.MENU;
    gamepadMapping[this.player.RB] = Button.CYCLE_SHINY;
    gamepadMapping[this.player.LB] = Button.CYCLE_FORM;
    gamepadMapping[this.player.LT] = Button.CYCLE_GENDER;
    gamepadMapping[this.player.RT] = Button.CYCLE_ABILITY;
    gamepadMapping[this.player.RC_W] = Button.CYCLE_NATURE;
    gamepadMapping[this.player.RC_N] = Button.V;
    gamepadMapping[this.player.LS] = Button.SPEED_UP;
    gamepadMapping[this.player.RS] = Button.SLOW_DOWN;

    return gamepadMapping;
  }

  /**
     * Handles the 'down' event for gamepad buttons, emitting appropriate events and updating the interaction state.
     *
     * @param pad - The gamepad on which the button press occurred.
     * @param button - The button that was pressed.
     * @param value - The value associated with the button press, typically indicating pressure or degree of activation.
     *
     * @remarks
     * This method is triggered when a gamepad button is pressed. If gamepad support is enabled, it:
     * - Retrieves the current gamepad action mapping.
     * - Checks if the pressed button is mapped to a game action.
     * - If mapped, emits an 'input_down' event with the controller type and button action, and updates the interaction of this button.
     */
  gamepadButtonDown(pad: Phaser.Input.Gamepad.Gamepad, button: Phaser.Input.Gamepad.Button, value: number): void {
    if (!this.gamepadSupport) {
      return;
    }
    const actionMapping = this.getActionGamepadMapping();
    const buttonDown = actionMapping.hasOwnProperty(button.index) && actionMapping[button.index];
    if (buttonDown !== undefined) {
      this.events.emit("input_down", {
        controller_type: "gamepad",
        button: buttonDown,
      });
      this.setLastProcessedMovementTime(buttonDown, "gamepad");
    }
  }

  /**
     * Handles the 'up' event for gamepad buttons, emitting appropriate events and clearing the interaction state.
     *
     * @param pad - The gamepad on which the button release occurred.
     * @param button - The button that was released.
     * @param value - The value associated with the button release, typically indicating pressure or degree of deactivation.
     *
     * @remarks
     * This method is triggered when a gamepad button is released. If gamepad support is enabled, it:
     * - Retrieves the current gamepad action mapping.
     * - Checks if the released button is mapped to a game action.
     * - If mapped, emits an 'input_up' event with the controller type and button action, and clears the interaction for this button.
     */
  gamepadButtonUp(pad: Phaser.Input.Gamepad.Gamepad, button: Phaser.Input.Gamepad.Button, value: number): void {
    if (!this.gamepadSupport) {
      return;
    }
    const actionMapping = this.getActionGamepadMapping();
    const buttonUp = actionMapping.hasOwnProperty(button.index) && actionMapping[button.index];
    if (buttonUp !== undefined) {
      this.events.emit("input_up", {
        controller_type: "gamepad",
        button: buttonUp,
      });
      this.delLastProcessedMovementTime(buttonUp);
    }
  }

  /**
     * Configures keyboard controls for the game, mapping physical keys to game actions.
     *
     * @remarks
     * This method sets up keyboard bindings for game controls using Phaser's `KeyCodes`. Each game action, represented
     * by a button in the `Button` enum, is associated with one or more physical keys. For example, movement actions
     * (up, down, left, right) are mapped to both arrow keys and WASD keys. Actions such as submit, cancel, and other
     * game-specific functions are mapped to appropriate keys like Enter, Space, etc.
     *
     * The method does the following:
     * - Defines a `keyConfig` object that associates each `Button` enum value with an array of `KeyCodes`.
     * - Iterates over all values of the `Button` enum to set up these key bindings within the Phaser game scene.
     * - For each button, it adds the respective keys to the game's input system and stores them in `this.buttonKeys`.
     * - Additional configurations for mobile or alternative input schemes are stored in `mobileKeyConfig`.
     *
     * Post-setup, it initializes touch controls (if applicable) and starts listening for keyboard inputs using
     * `listenInputKeyboard`, ensuring that all configured keys are actively monitored for player interactions.
     */
  setupKeyboardControls(): void {
    const keyCodes = Phaser.Input.Keyboard.KeyCodes;
    const keyConfig = {
      [Button.UP]: [keyCodes.UP, keyCodes.W],
      [Button.DOWN]: [keyCodes.DOWN, keyCodes.S],
      [Button.LEFT]: [keyCodes.LEFT, keyCodes.A],
      [Button.RIGHT]: [keyCodes.RIGHT, keyCodes.D],
      [Button.SUBMIT]: [keyCodes.ENTER],
      [Button.ACTION]: [keyCodes.SPACE, keyCodes.Z],
      [Button.CANCEL]: [keyCodes.BACKSPACE, keyCodes.X],
      [Button.MENU]: [keyCodes.ESC, keyCodes.M],
      [Button.STATS]: [keyCodes.SHIFT, keyCodes.C],
      [Button.CYCLE_SHINY]: [keyCodes.R],
      [Button.CYCLE_FORM]: [keyCodes.F],
      [Button.CYCLE_GENDER]: [keyCodes.G],
      [Button.CYCLE_ABILITY]: [keyCodes.E],
      [Button.CYCLE_NATURE]: [keyCodes.N],
      [Button.V]: [keyCodes.V],
      [Button.SPEED_UP]: [keyCodes.PLUS],
      [Button.SLOW_DOWN]: [keyCodes.MINUS]
    };
    const mobileKeyConfig = {};
    for (const b of Utils.getEnumValues(Button)) {
      const keys: Phaser.Input.Keyboard.Key[] = [];
      if (keyConfig.hasOwnProperty(b)) {
        for (const k of keyConfig[b]) {
          keys.push(this.scene.input.keyboard.addKey(k, false));
        }
        mobileKeyConfig[Button[b]] = keys[0];
      }
      this.buttonKeys[b] = keys;
    }

    initTouchControls(mobileKeyConfig);
    this.listenInputKeyboard();
  }

  /**
     * Sets up event listeners for keyboard inputs on all registered keys.
     *
     * @remarks
     * This method iterates over an array of keyboard button rows (`this.buttonKeys`), adding 'down' and 'up'
     * event listeners for each key. These listeners handle key press and release actions respectively.
     *
     * - **Key Down Event**: When a key is pressed down, the method emits an 'input_down' event with the button
     *   and the source ('keyboard'). It also records the time and state of the key press by calling
     *   `setLastProcessedMovementTime`.
     *
     * - **Key Up Event**: When a key is released, the method emits an 'input_up' event similarly, specifying the button
     *   and source. It then clears the recorded press time and state by calling
     *   `delLastProcessedMovementTime`.
     *
     * This setup ensures that each key on the keyboard is monitored for press and release events,
     * and that these events are properly communicated within the system.
     */
  listenInputKeyboard(): void {
    this.buttonKeys.forEach((row, index) => {
      for (const key of row) {
        key.on("down", () => {
          this.events.emit("input_down", {
            controller_type: "keyboard",
            button: index,
          });
          this.setLastProcessedMovementTime(index, "keyboard");
        });
        key.on("up", () => {
          this.events.emit("input_up", {
            controller_type: "keyboard",
            button: index,
          });
          this.delLastProcessedMovementTime(index);
        });
      }
    });
  }

  /**
     * Maps a gamepad ID to a specific gamepad configuration based on the ID's characteristics.
     *
     * @param id - The gamepad ID string, typically representing a unique identifier for a gamepad model or make.
     * @returns A `GamepadConfig` object corresponding to the identified gamepad model.
     *
     * @remarks
     * This function analyzes the provided gamepad ID and matches it to a predefined configuration based on known identifiers:
     * - If the ID includes both '081f' and 'e401', it is identified as an unlicensed SNES gamepad.
     * - If the ID contains 'xbox' and '360', it is identified as an Xbox 360 gamepad.
     * - If the ID contains '054c', it is identified as a DualShock gamepad.
     * - If the ID includes both '057e' and '2009', it is identified as a Pro controller gamepad.
     * If no specific identifiers are recognized, a generic gamepad configuration is returned.
     */
  mapGamepad(id: string): GamepadConfig {
    id = id.toLowerCase();

    if (id.includes("081f") && id.includes("e401")) {
      return pad_unlicensedSNES;
    } else if (id.includes("xbox") && id.includes("360")) {
      return pad_xbox360;
    } else if (id.includes("054c")) {
      return pad_dualshock;
    } else if (id.includes("057e") && id.includes("2009")) {
      return pad_procon;
    }

    return pad_generic;
  }

  /**
     * repeatInputDurationJustPassed returns true if @param button has been held down long
     * enough to fire a repeated input. A button must claim the buttonLock before
     * firing a repeated input - this is to prevent multiple buttons from firing repeatedly.
     */
  repeatInputDurationJustPassed(button: Button): boolean {
    if (!this.isButtonLocked(button)) {
      return false;
    }
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
  setLastProcessedMovementTime(button: Button, source: String = "keyboard"): void {
    if (!this.interactions.hasOwnProperty(button)) {
      return;
    }
    this.setButtonLock(button);
    this.interactions[button].pressTime = this.time.now;
    this.interactions[button].isPressed = true;
    this.interactions[button].source = source;
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
    if (!this.interactions.hasOwnProperty(button)) {
      return;
    }
    this.releaseButtonLock(button);
    this.interactions[button].pressTime = null;
    this.interactions[button].isPressed = false;
    this.interactions[button].source = null;
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
    this.releaseButtonLock(this.buttonLock);
    this.releaseButtonLock(this.buttonLock2);
    for (const b of Utils.getEnumValues(Button)) {
      if (this.interactions.hasOwnProperty(b)) {
        this.interactions[b].pressTime = null;
        this.interactions[b].isPressed = false;
        this.interactions[b].source = null;
      }
    }
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
    if (this.buttonLock === button || this.buttonLock2 === button) {
      return;
    }
    if (this.buttonLock === button) {
      this.buttonLock2 = button;
    } else if (this.buttonLock2 === button) {
      this.buttonLock = button;
    } else if (!!this.buttonLock) {
      this.buttonLock2 = button;
    } else {
      this.buttonLock = button;
    }
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
    if (this.buttonLock === button) {
      this.buttonLock = null;
    } else if (this.buttonLock2 === button) {
      this.buttonLock2 = null;
    }
  }
}
