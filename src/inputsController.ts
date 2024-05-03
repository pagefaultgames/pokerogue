import Phaser, { Time } from "phaser";
import * as Utils from "./utils";
import {initTouchControls} from './touch-controls';
import pad_generic from "#app/configs/pad_generic";
import pad_unlicensedSNES from "#app/configs/pad_unlicensedSNES";
import pad_xbox360 from "#app/configs/pad_xbox360";
import pad_dualshock from "#app/configs/pad_dualshock";


export enum Button {
    UP,
    DOWN,
    LEFT,
    RIGHT,
    SUBMIT,
    ACTION,
    CANCEL,
    MENU,
    STATS,
    CYCLE_SHINY,
    CYCLE_FORM,
    CYCLE_GENDER,
    CYCLE_ABILITY,
    CYCLE_NATURE,
    CYCLE_VARIANT,
    SPEED_UP,
    SLOW_DOWN
}
const repeatInputDelayMillis = 250;

export class InputsController extends Phaser.Plugins.ScenePlugin {
	private game: Phaser.Game;
	private buttonKeys: Phaser.Input.Keyboard.Key[][];
	private gamepads: Array<string> = new Array();
	private scene: Phaser.Scene;

	// buttonLock ensures only a single movement key is firing repeated inputs
	// (i.e. by holding down a button) at a time
	private buttonLock: Button;
	private interactions: Map<Button, Map<string, boolean>> = new Map();
	private time: Time;

    constructor(scene: Phaser.Scene, pluginManager: Phaser.Plugins.PluginManager, pluginKey: string) {
		super(scene, pluginManager, pluginKey);
		this.game = pluginManager.game;
		this.scene = scene;
		this.time = this.scene.time;
		this.buttonKeys = [];

		for (const b of Utils.getEnumValues(Button)) {
			this.interactions[b] = {
				pressTime: false,
				isPressed: false,
			}
		}
		delete this.interactions[Button.MENU];
		delete this.interactions[Button.SUBMIT];
    }

	boot() {
		this.eventEmitter = this.systems.events;
		this.events = new Phaser.Events.EventEmitter();
		this.game.events.on(Phaser.Core.Events.STEP, this.update, this);

		if (typeof this.systems.input.gamepad !== 'undefined') {
			this.systems.input.gamepad.on('connected', function (thisGamepad) {
				this.refreshGamepads();
				this.setupGamepad(thisGamepad);
			}, this);

			// Check to see if the gamepad has already been setup by the browser
			this.systems.input.gamepad.refreshPads();
			if (this.systems.input.gamepad.total) {
				this.refreshGamepads();
				for (const thisGamepad of this.gamepads) {
					this.systems.input.gamepad.emit('connected', thisGamepad);
				}
			}

			this.systems.input.gamepad.on('down', this.gamepadButtonDown, this);
			this.systems.input.gamepad.on('up', this.gamepadButtonUp, this);
		}

		// Keyboard
		this.setupKeyboardControls();
	}

	update() {
		for (const b of Utils.getEnumValues(Button)) {
			if (!this.interactions.hasOwnProperty(b)) continue;
			if (this.repeatInputDurationJustPassed(b)) {
				this.events.emit('input_down', {
					controller_type: 'keyboard',
					button: b,
				});
				this.setLastProcessedMovementTime(b);
			}
		}
	}

	setupGamepad(thisGamepad) {
		let gamepadID = thisGamepad.id.toLowerCase();
		const mappedPad = this.mapGamepad(gamepadID);
		this.player = {
			'mapping': mappedPad.gamepadMapping,
		}
	}

	refreshGamepads() {
		// Sometimes, gamepads are undefined. For some reason.
		this.gamepads = this.systems.input.gamepad.gamepads.filter(function (el) {
			return el != null;
		});

		for (const [index, thisGamepad] of this.gamepads.entries()) {
			thisGamepad.index = index; // Overwrite the gamepad index, in case we had undefined gamepads earlier
		}
	}

	getActionGamepadMapping() {
		const gamepadMapping = {};
		gamepadMapping[this.player.mapping.LC_N] = Button.UP;
		gamepadMapping[this.player.mapping.LC_S] = Button.DOWN;
		gamepadMapping[this.player.mapping.LC_W] = Button.LEFT;
		gamepadMapping[this.player.mapping.LC_E] = Button.RIGHT;
		gamepadMapping[this.player.mapping.TOUCH] = Button.SUBMIT;
		gamepadMapping[this.player.mapping.RC_S] = Button.ACTION;
		gamepadMapping[this.player.mapping.RC_E] = Button.CANCEL;
		gamepadMapping[this.player.mapping.SELECT] = Button.STATS;
		gamepadMapping[this.player.mapping.START] = Button.MENU;
		gamepadMapping[this.player.mapping.RB] = Button.CYCLE_SHINY;
		gamepadMapping[this.player.mapping.LB] = Button.CYCLE_FORM;
		gamepadMapping[this.player.mapping.LT] = Button.CYCLE_GENDER;
		gamepadMapping[this.player.mapping.RT] = Button.CYCLE_ABILITY;
		gamepadMapping[this.player.mapping.RC_W] = Button.CYCLE_NATURE;
		gamepadMapping[this.player.mapping.RC_N] = Button.CYCLE_VARIANT;
		gamepadMapping[this.player.mapping.LS] = Button.SPEED_UP;
		gamepadMapping[this.player.mapping.RS] = Button.SLOW_DOWN;

		return gamepadMapping;
	}
	gamepadButtonDown(pad, button, value) {
		const actionMapping = this.getActionGamepadMapping();
		const buttonDown = actionMapping.hasOwnProperty(button.index) && actionMapping[button.index];
		if (buttonDown !== undefined) {
			this.events.emit('input_down', {
				controller_type: 'gamepad',
				button: buttonDown,
			});
			this.setLastProcessedMovementTime(buttonDown);
		}
	}

	gamepadButtonUp(pad, button, value) {
		const actionMapping = this.getActionGamepadMapping();
		const buttonUp = actionMapping.hasOwnProperty(button.index) && actionMapping[button.index];
		if (buttonUp !== undefined) {
			this.events.emit('input_up', {
				controller_type: 'gamepad',
				button: buttonUp,
			});
			this.delLastProcessedMovementTime(buttonUp);
		}
	}

	setupKeyboardControls() {
		const keyCodes = Phaser.Input.Keyboard.KeyCodes;
		const keyConfig = {
			[Button.UP]: [keyCodes.UP, keyCodes.W],
			[Button.DOWN]: [keyCodes.DOWN, keyCodes.S],
			[Button.LEFT]: [keyCodes.LEFT, keyCodes.A],
			[Button.RIGHT]: [keyCodes.RIGHT, keyCodes.D],
			[Button.SUBMIT]: [keyCodes.ENTER],
			[Button.ACTION]: [keyCodes.SPACE, keyCodes.ENTER, keyCodes.Z],
			[Button.CANCEL]: [keyCodes.BACKSPACE, keyCodes.X],
			[Button.MENU]: [keyCodes.ESC, keyCodes.M],
			[Button.STATS]: [keyCodes.SHIFT, keyCodes.C],
			[Button.CYCLE_SHINY]: [keyCodes.R],
			[Button.CYCLE_FORM]: [keyCodes.F],
			[Button.CYCLE_GENDER]: [keyCodes.G],
			[Button.CYCLE_ABILITY]: [keyCodes.E],
			[Button.CYCLE_NATURE]: [keyCodes.N],
			[Button.CYCLE_VARIANT]: [keyCodes.V],
			[Button.SPEED_UP]: [keyCodes.PLUS],
			[Button.SLOW_DOWN]: [keyCodes.MINUS]
		};
		const mobileKeyConfig = {};
		for (const b of Utils.getEnumValues(Button)) {
			const keys: Phaser.Input.Keyboard.Key[] = [];
			if (keyConfig.hasOwnProperty(b)) {
				for (let k of keyConfig[b])
					keys.push(this.systems.input.keyboard.addKey(k, false));
				mobileKeyConfig[Button[b]] = keys[0];
			}
			this.buttonKeys[b] = keys;
		}

		initTouchControls(mobileKeyConfig);
		this.listenInputKeyboard();
	}

	listenInputKeyboard() {
		this.buttonKeys.forEach((row, index) => {
			for (const key of row) {
				key.on('down', () => {
					this.events.emit('input_down', {
						controller_type: 'keyboard',
						button: index,
					});
					this.setLastProcessedMovementTime(index);
				});
				key.on('up', () => {
					this.events.emit('input_up', {
						controller_type: 'keyboard',
						button: index,
					});
					this.delLastProcessedMovementTime(index);
				});
			}
		})
	}

    mapGamepad(id) {
        id = id.toLowerCase();
        let padConfig = pad_generic;

        if (id.includes('081f') && id.includes('e401')) {
            padConfig = pad_unlicensedSNES;
        }
        else if (id.includes('xbox') && id.includes('360')) {
            padConfig = pad_xbox360;
        }
        else if (id.includes('054c')) {
            padConfig = pad_dualshock;
        }

        return padConfig;
    }

	/**
	 * repeatInputDurationJustPassed returns true if @param button has been held down long
	 * enough to fire a repeated input. A button must claim the buttonLock before
	 * firing a repeated input - this is to prevent multiple buttons from firing repeatedly.
	 */
	repeatInputDurationJustPassed(button: Button): boolean {
		if (this.buttonLock === null || this.buttonLock !== button) {
			return false;
		}
		if (this.time.now - this.interactions[button].pressTime >= repeatInputDelayMillis) {
			this.buttonLock = null;
			return true;
		}
	}

	setLastProcessedMovementTime(button: Button) {
		if (!this.interactions.hasOwnProperty(button)) return;
		this.buttonLock = button;
		this.interactions[button].pressTime = this.time.now;
	}

	delLastProcessedMovementTime(button: Button) {
		if (!this.interactions.hasOwnProperty(button)) return;
		this.buttonLock = null;
		this.interactions[button].pressTime = null;
	}
}