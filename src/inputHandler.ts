import Phaser from "phaser";
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

export class InputHandler extends Phaser.Plugins.ScenePlugin {
	game: Phaser.Game;

    constructor(scene: Phaser.Scene, pluginManager: Phaser.Plugins.PluginManager, pluginKey: string) {
		super(scene, pluginManager, pluginKey);
		this.game = pluginManager.game;
		this.scene = scene;
		// Keys object to store Phaser key objects. We'll check these during update
		this.keys = {};
		this.players = [];
		this.gamepads = [];

		this.dpadMappings = {
			'UP': 12,
			'DOWN': 13,
			'LEFT': 14,
			'RIGHT': 15
		};
    }

	boot() {
		this.eventEmitter = this.systems.events;
		this.events = new Phaser.Events.EventEmitter();

		this.game.events.on(Phaser.Core.Events.PRE_STEP, this.preupdate, this);
		// Handle the game losing focus
		this.game.events.on(Phaser.Core.Events.BLUR, () => {
			this.loseFocus()
		});
		if (typeof this.systems.input.gamepad !== 'undefined') {
			this.systems.input.gamepad.on('connected', function (thisGamepad) {
				this.refreshGamepads();
				this.setupGamepad(thisGamepad);
			}, this);
		}

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

		// Keyboard
		// this.systems.input.keyboard.on('keydown', this.keyboardKeyDown, this);
		// this.systems.input.keyboard.on('keyup', this.keyboardKeyUp, this);
		console.log('==[input handler initialized');
	}

	setupGamepad(thisGamepad) {
		console.log('gamepad on');
		this.eventEmitter.emit('inputHandler', {
			device: 'gamepad',
			id: thisGamepad.id,
			action: 'Connected'
		});
		this.events.emit('gamepad_connected', thisGamepad);

		if (typeof this.players[thisGamepad.index] === 'undefined') {
			this.addPlayer();
		}

		let gamepadID = thisGamepad.id.toLowerCase();
		let mappedPad = this.mapGamepad(gamepadID);
		this.players[thisGamepad.index].gamepadMapping = mappedPad.gamepadMapping;
		this.players[thisGamepad.index].interaction_mapped.gamepadType = mappedPad.padType;
		for (let thisButton in this.players[thisGamepad.index].gamepadMapping) {
			this.players[thisGamepad.index].buttons_mapped[thisButton] = 0;
		}
	}
	refreshGamepads() {
		// Sometimes, gamepads are undefined. For some reason.
		this.gamepads = this.systems.input.gamepad.gamepads.filter(function (el) {
			return el != null;
		});

		for (const [index, thisGamepad] of this.gamepads.entries()) {
			thisGamepad.index = index; // Overwrite the gamepad index, in case we had undefined gamepads earlier

			/**
			 * Some cheap gamepads use the first axis as a dpad, in which case we won't have the dpad buttons 12-15
			 */
			thisGamepad.fakedpad = thisGamepad.buttons.length < 15;
		}
	}

	preupdate() {
		// this.setupControls();
		// this.checkInputGamepad();
		// this.checkInputKeyboard();
	}

	/**
	 * Function to run when the game loses focus
	 * We want to fake releasing the buttons here, so that they're not stuck down without an off event when focus returns to the game
	 */
	loseFocus() {
		// Loop through defined keys and reset them
		for (let thisKey in this.keys) {
			this.keys[thisKey].reset();
		}
	}

	/**
	 * Add a new player object to the players array
	 * @param {number} index Player index - if a player object at this index already exists, it will be returned instead of creating a new player object
	 * @param {number} numberOfButtons The number of buttons to assign to the player object. Defaults to 16. Fewer than 16 is not recommended, as gamepad DPads typically map to buttons 12-15
	 */
	addPlayer(index= 0, numberOfButtons=16) {
		if (typeof this.players[index] !== 'undefined') {
			return this.players[index];
		} else {
			// Set up player object
			let newPlayer = this.setupControls(numberOfButtons);

			// Add helper functions to the player object
			this.addPlayerHelperFunctions(newPlayer);

			// Push new player to players array
			this.players.push(newPlayer);

			this.players[this.players.length - 1].index = this.players.length - 1;
			return this.players[this.players.length - 1];
		}
	}

	/**
	 * Add helper functions to the player object
	 * @param {*} player
	 */
	addPlayerHelperFunctions(player) {
		/**
		 * Pass a button name, or an array of button names to check if any were pressed in this update step.
		 * This will only fire once per button press. If you need to check for a button being held down, use isDown instead.
		 * Returns the name of the matched button(s), in case you need it.
		 */
		player.interaction.isPressed = (button) => {
			button = (typeof button === 'string') ? Array(button) : button;
			let matchedButtons = button.filter(x => player.interaction.pressed.includes(x))
			return matchedButtons.length ? matchedButtons : false;
		}

		/**
		 * Pass a button name, or an array of button names to check if any are currently pressed in this update step.
		 * This differs from the isPressed function in that it will return true if the button is currently pressed, even if it was pressed in a previous update step.
		 * Returns the name of the matched button(s), in case you need it.
		 */
		player.interaction.isDown = (button) => {
			button = (typeof button === 'string') ? Array(button) : button;
			let matchedButtons = button.filter(x => player.buttons[x])
			let matchedDirections = button.filter(x => player.direction[x])
			let matchedAll = [...matchedButtons, ...matchedDirections];

			return matchedAll.length ? matchedAll : false;
		}

		/**
		 * Pass a button name, or an array of button names to check if any are currently pressed in this update step.
		 * Similar to Phaser's keyboard plugin, the checkDown function can accept a 'duration' parameter, and will only register a press once every X milliseconds.
		 * Returns the name of the matched button(s)
		 *
		 * @param {string|array} button Array of buttons to check
		 * @param {number} duration The duration which must have elapsed before this button is considered as being down.
		 * @param {boolean} includeFirst - When true, the initial press of the button will be included in the results. Defaults to false.
		 */
		player.interaction.checkDown = (button, duration, includeFirst) => {
			if (includeFirst === undefined) { includeFirst = false; }
			if (duration === undefined) { duration = 0; }

			let matchedButtons = [];
			let downButtons = player.interaction.isDown(button)
			console.log('downButtons:', downButtons);
			if (downButtons.length) {

				for (let thisButton of downButtons) {
					if (typeof player.timers[thisButton]._tick === 'undefined') {
						player.timers[thisButton]._tick = 0;
						if (includeFirst) {
							matchedButtons.push(thisButton);
						}
					}

					let t = Phaser.Math.Snap.Floor(this.scene.sys.time.now - player.timers[thisButton].pressed, duration);
					if (t > player.timers[thisButton]._tick) {
						this.game.events.once(Phaser.Core.Events.POST_STEP, ()=>{
							player.timers[thisButton]._tick = t;
						});
						matchedButtons.push(thisButton);
					}
				}
			}

			return matchedButtons.length ? matchedButtons : false;
		}

		/**
		 * Mapped version of the checkDown version - resolves mapped button names and calls the checkDown function
		 */
		player.interaction_mapped.checkDown = (button, duration, includeFirst) => {
			if (includeFirst === undefined) { includeFirst = false; }
			let unmappedButtons = [];

			// Resolve the unmapped button names to a new array
			for (let thisButton of button) {
				let unmappedButton = this.getUnmappedButton(player, thisButton);

				if (unmappedButton) {
					unmappedButtons.push(unmappedButton)
				}
			}

			let downButtons = player.interaction.checkDown(unmappedButtons, duration, includeFirst);
			return downButtons.length ? downButtons.map(x => this.getMappedButton(player, x)) : false;
		}


		/**
		 * The previous functions are specific to the interaction and interaction_mapped definition of buttons.
		 * In general you would pick a definition scheme and query that object (interaction or interaction_mapped), just for ease though, we'll add some functions that accept either type of convention
		 */

		/**
		 * Pass a button name, or an array of button names to check if any were pressed in this update step.
		 * This will only fire once per button press. If you need to check for a button being held down, use isDown instead.
		 * Returns the name of the matched button(s), in case you need it.
		 */
		player.isPressed = (button) => {
			let interaction = player.interaction.isPressed(button) || [];
			let interaction_mapped = player.interaction_mapped.isPressed(button) || [];
			let matchedButtons = [...interaction, ...interaction_mapped];
			return matchedButtons.length ? matchedButtons : false
		}

		/**
		 * Pass a button name, or an array of button names to check if any are currently pressed in this update step.
		 * This differs from the isPressed function in that it will return true if the button is currently pressed, even if it was pressed in a previous update step.
		 * Returns the name of the button(s), in case you need it.
		 */
		player.isDown = (button) => {
			let interaction = player.interaction.isDown(button) || [];
			let interaction_mapped = player.interaction_mapped.isDown(button) || [];
			let matchedButtons = [...interaction, ...interaction_mapped];
			return matchedButtons.length ? matchedButtons : false
		}

		/**
		 * Pass a button name, or an array of button names to check if any were released in this update step.
		 * Returns the name of the matched button(s), in case you need it.
		 */
		player.isReleased = (button) => {
			let interaction = player.interaction.isReleased(button) || [];
			let interaction_mapped = player.interaction_mapped.isReleased(button) || [];
			let matchedButtons = [...interaction, ...interaction_mapped];
			return matchedButtons.length ? matchedButtons : false
		}


		/**
		 * Pass a button name, or an array of button names to check if any are currently pressed in this update step.
		 * Similar to Phaser's keyboard plugin, the checkDown function can accept a 'duration' parameter, and will only register a press once every X milliseconds.
		 * Returns the name of the matched button(s)
		 *
		 * @param {string|array} button Array of buttons to check
		 * @param {number} - The duration which must have elapsed before this button is considered as being down.
		 */
		player.checkDown = (button, duration, includeFirst) => {
			if (includeFirst === undefined) { includeFirst = false; }
			let interaction = player.interaction.checkDown(button, duration, includeFirst) || [];
			let interaction_mapped = player.interaction_mapped.checkDown(button, duration, includeFirst) || [];
			let matchedButtons = [...interaction, ...interaction_mapped];
			return matchedButtons.length ? matchedButtons : false
		}


		player.setDevice = (device) => {
			if (player.interaction.device != device) {
				this.eventEmitter.emit('inputHandler', { device: device, player: player.index, action: 'Device Changed' });
				this.events.emit('device_changed', { player: player.index, device: device });
			}
			player.interaction.device = device;

			return this;
		}

		return this;
	}



    /**
     * Returns a struct to hold input control information
     * Set up a struct for each player in the game
     * Direction and Buttons contain the input from the devices
     * The keys struct contains arrays of keyboard characters that will trigger the action
     */
    setupControls(numberOfButtons = 16) {
		let controls = this.getBaseControls();

        // Add buttons
        for (let i = 0; i <= numberOfButtons; i++) {
            controls.buttons['B' + i] = 0;
            controls.keys['B' + i] = [];
        }

        // Add timers
        for (let i = 0; i <= numberOfButtons; i++) {
            controls.timers['B' + i] = {
                'pressed': 0,
                'released': 0,
                'duration': 0
            };
        }
        for (let thisDirection of ['UP', 'DOWN', 'LEFT', 'RIGHT', 'ALT_UP', 'ALT_DOWN', 'ALT_LEFT', 'ALT_RIGHT']) {
            controls.timers[thisDirection] = {
                'pressed': 0,
                'released': 0,
                'duration': 0
            };
        }


        controls.setPosition = function(x,y) {
            this.position.x = x;
            this.position.y = y;
        }

		return controls;
	}

	getBaseControls() {
		return {
			'direction': {
                'UP': 0,
                'DOWN': 0,
                'LEFT': 0,
                'RIGHT': 0,
			},
			'direction_secondary': {
                'UP': 0,
                'DOWN': 0,
                'LEFT': 0,
                'RIGHT': 0,
			},
			'buttons': {

			},
			'keys': {

			},
			'timers': {

			},
            'position': {x:0,y:0},
            'interaction': {
                'buffer': [],
                'pressed': [],
                'released': [],
                'last': '',
                'lastPressed': '',
                'lastReleased': '',
                'device': '',
            },
            'interaction_mapped': {
                'pressed': [],
                'released': [],
                'last': '',
                'lastPressed': '',
                'lastReleased': '',
                'gamepadType': '',
            },
            'buttons_mapped': {

			}
		}
	}


	// Gamepad functions

	/**
	 * When a gamepad button is pressed down, this function will emit a inputHandler event in the global registry.
	 * The event contains a reference to the player assigned to the gamepad, and passes a mapped action and value
	 * @param {number} index Button index
	 * @param {number} value Button value
	 * @param {Phaser.Input.Gamepad.Button} button Phaser Button object
	 */
	gamepadButtonDown(pad, button, value) {
		this.players[pad.index].setDevice('gamepad');
		this.players[pad.index].buttons.TIMESTAMP = this.scene.sys.time.now;
		this.eventEmitter.emit('inputHandler', {
			device: 'gamepad',
			value: value,
			player: pad.index,
			action: 'B' + button.index,
			state: 'DOWN'
		});
		this.events.emit('gamepad_buttondown', {
			player: pad.index,
			button: `B${button.index}`
		});

		// Buttons
		if (![12, 13, 14, 15].includes(button.index)) {
			let playerAction = 'B' + button.index;

			// Update the last button state
			this.players[pad.index].interaction.pressed.push(playerAction);
			this.players[pad.index].interaction.last = playerAction;
			this.players[pad.index].interaction.lastPressed = playerAction;
			this.players[pad.index].interaction.buffer.push(playerAction);

			// Update timers
			this.players[pad.index].timers[playerAction].pressed = this.scene.sys.time.now;
			this.players[pad.index].timers[playerAction].released = 0;
			this.players[pad.index].timers[playerAction].duration = 0;

			// Update mapped button object
			let mappedButton = this.getMappedButton(this.players[pad.index], button.index);
			if (typeof mappedButton !== "undefined") {
				this.players[pad.index].interaction_mapped.pressed.push(mappedButton);
				this.players[pad.index].interaction_mapped.last = mappedButton;
				this.players[pad.index].interaction_mapped.lastPressed = mappedButton;
			}
		}
		// DPad
		else {
			let dpadMapping = this.dpadMappings;
			let direction = Object.keys(dpadMapping).find(key => dpadMapping[key] == button.index);
			this.eventEmitter.emit('inputHandler', {
				device: 'gamepad',
				value: 1,
				player: pad.index,
				action: direction,
				state: 'DOWN'
			});
			this.events.emit('gamepad_directiondown', { player: pad.index, button: direction });

			this.players[pad.index].interaction.pressed.push(direction);
			this.players[pad.index].interaction.last = direction;
			this.players[pad.index].interaction.lastPressed = direction;
			this.players[pad.index].interaction.buffer.push(direction);
			this.players[pad.index].direction.TIMESTAMP = this.scene.sys.time.now;

			// Update timers
			this.players[pad.index].timers[direction].pressed = this.scene.sys.time.now;
			this.players[pad.index].timers[direction].released = 0;
			this.players[pad.index].timers[direction].duration = 0;


			// Update mapped button object
			let mappedButton = this.getMappedButton(this.players[pad.index], button.index);
			if (typeof mappedButton !== "undefined") {
				this.players[pad.index].interaction_mapped.pressed.push(mappedButton);
				this.players[pad.index].interaction_mapped.last = mappedButton;
				this.players[pad.index].interaction_mapped.lastPressed = mappedButton;
			}
		}

	}


	/**
	 * Given a player and a button ID, return the mapped button name, e.g. 0 = 'RC_S' (Right cluster, South - X on an xbox gamepad)
	 * @param {*} player
	 * @param {*} buttonID
	 */
	getMappedButton(player, buttonID) {
		buttonID = buttonID.toString().replace(/\D/g, '');
		return Object.keys(player.gamepadMapping).find(key => player.gamepadMapping[key] == buttonID);
	}

	/**
	 * When a gamepad button is released, this function will emit a inputHandler event in the global registry.
	 * The event contains a reference to the player assigned to the gamepad, and passes a mapped action and value
	 * @param {number} index Button index
	 * @param {number} value Button value
	 * @param {Phaser.Input.Gamepad.Button} button Phaser Button object
	 */
	gamepadButtonUp(pad, button, value) {
		this.players[pad.index].setDevice('gamepad');
		this.players[pad.index].buttons.TIMESTAMP = this.scene.sys.time.now;

		this.eventEmitter.emit('inputHandler', {
			device: 'gamepad',
			value: value,
			player: pad.index,
			action: 'B' + button.index,
			state: 'UP'
		});
		this.events.emit('gamepad_buttonup', {
			player: pad.index,
			button: `B${button.index}`
		});

		// Buttons
		if (![12, 13, 14, 15].includes(button.index)) {
			let playerAction = 'B' + button.index;

			// Update the last button state
			this.players[pad.index].interaction.released.push(playerAction);
			this.players[pad.index].interaction.lastReleased = playerAction;

			// Update timers
			this.players[pad.index].timers[playerAction].released = this.scene.sys.time.now;
			this.players[pad.index].timers[playerAction].duration = this.players[pad.index].timers[playerAction].released - this.players[pad.index].timers[playerAction].pressed;
			delete this.players[pad.index].timers[playerAction]._tick;

			// Update mapped button object
			let mappedButton = this.getMappedButton(this.players[pad.index], button.index);
			if (typeof mappedButton !== "undefined") {
				this.players[pad.index].interaction_mapped.released = mappedButton;
				this.players[pad.index].interaction_mapped.lastReleased = mappedButton;
			}
		}
		// DPad
		else {
			let dpadMapping = this.dpadMappings;
			let direction = Object.keys(dpadMapping).find(key => dpadMapping[key] == button.index);
			this.eventEmitter.emit('inputHandler', {
				device: 'gamepad',
				value: 1,
				player: pad.index,
				action: direction,
				state: 'UP'
			});
			this.events.emit('gamepad_directionup', {
				player: pad.index,
				button: direction
			});

			this.players[pad.index].interaction.released.push(direction);
			this.players[pad.index].interaction.lastReleased = direction;

			// Update timers
			this.players[pad.index].timers[direction].released = this.scene.sys.time.now;
			this.players[pad.index].timers[direction].duration = this.players[pad.index].timers[direction].released - this.players[pad.index].timers[direction].pressed;
			delete this.players[pad.index].timers[direction]._tick;

			// Update mapped button object
			let mappedButton = this.getMappedButton(this.players[pad.index], button.index);
			if (typeof mappedButton !== "undefined") {
				this.players[pad.index].interaction_mapped.released = mappedButton;
				this.players[pad.index].interaction_mapped.lastReleased = mappedButton;
			}
		}
	}

	// setupControls() {
		// const keyCodes = Phaser.Input.Keyboard.KeyCodes;
		// const keyConfig = {
		// 	[Button.UP]: [keyCodes.UP, keyCodes.W],
		// 	[Button.DOWN]: [keyCodes.DOWN, keyCodes.S],
		// 	[Button.LEFT]: [keyCodes.LEFT, keyCodes.A],
		// 	[Button.RIGHT]: [keyCodes.RIGHT, keyCodes.D],
		// 	[Button.SUBMIT]: [keyCodes.ENTER],
		// 	[Button.ACTION]: [keyCodes.SPACE, keyCodes.ENTER, keyCodes.Z],
		// 	[Button.CANCEL]: [keyCodes.BACKSPACE, keyCodes.X],
		// 	[Button.MENU]: [keyCodes.ESC, keyCodes.M],
		// 	[Button.STATS]: [keyCodes.SHIFT, keyCodes.C],
		// 	[Button.CYCLE_SHINY]: [keyCodes.R],
		// 	[Button.CYCLE_FORM]: [keyCodes.F],
		// 	[Button.CYCLE_GENDER]: [keyCodes.G],
		// 	[Button.CYCLE_ABILITY]: [keyCodes.E],
		// 	[Button.CYCLE_NATURE]: [keyCodes.N],
		// 	[Button.CYCLE_VARIANT]: [keyCodes.V],
		// 	[Button.SPEED_UP]: [keyCodes.PLUS],
		// 	[Button.SLOW_DOWN]: [keyCodes.MINUS]
		// };
		// const mobileKeyConfig = {};
		// this.buttonKeys = [];
		// for (let b of Utils.getEnumValues(Button)) {
		// 	const keys: Phaser.Input.Keyboard.Key[] = [];
		// 	if (keyConfig.hasOwnProperty(b)) {
		// 		for (let k of keyConfig[b])
		// 			keys.push(this.input.keyboard.addKey(k, false));
		// 		mobileKeyConfig[Button[b]] = keys[0];
		// 	}
		// 	this.buttonKeys[b] = keys;
		// }
		//
		// initTouchControls(mobileKeyConfig);
	// }

	checkInputKeyboard() {
		// this.buttonKeys.forEach((row, index) => {
		// 	for (const key of row) {
		// 		key.on('down', () => {
		// 			if (!this.isButtonPressing) {
		// 				this.isButtonPressing = true;
		// 				this.key_down(index);
		// 			}
		// 		});
		// 		key.on('up', () => {
		// 			if (this.isButtonPressing) {
		// 				this.isButtonPressing = false;
		// 				this.key_up(index);
		// 			}
		// 		});
		// 	}
		// })
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

		console.log('padConfig:', padConfig);

        return padConfig;
    }

	checkInputGamepad() {
		// this.input.gamepad.once('connected', function (pad) {
		// 	const gamepadID = pad.id.toLowerCase();
		// 	this.scene.mappedPad = this.scene.mapGamepad(gamepadID);
		// });

		// this.input.gamepad.on('down', function (gamepad, button) {
		// 	if (!this.scene.mappedPad) return;
		// 	let inputSuccess;
		// 	let vibrationLength;
		// 	switch(button.index) {
		// 		case this.scene.mappedPad.gamepadMapping.LC_N:
		// 			[inputSuccess, vibrationLength] = this.scene.button_up();
		// 			break;
		// 		case this.scene.mappedPad.gamepadMapping.LC_S:
		// 			[inputSuccess, vibrationLength] = this.scene.button_down();
		// 			break;
		// 		case this.scene.mappedPad.gamepadMapping.LC_W:
		// 			[inputSuccess, vibrationLength] = this.scene.button_left();
		// 			break
		// 		case this.scene.mappedPad.gamepadMapping.LC_E:
		// 			[inputSuccess, vibrationLength] = this.scene.button_right();
		// 			break
		// 		case this.scene.mappedPad.gamepadMapping.TOUCH:
		// 			inputSuccess = this.scene.button_touch();
		// 			break
		// 		case this.scene.mappedPad.gamepadMapping.RC_S:
		// 			inputSuccess = this.scene.button_action();
		// 			break;
		// 		case this.scene.mappedPad.gamepadMapping.RC_E:
		// 			inputSuccess = this.scene.button_cancel();
		// 			break
		// 		case this.scene.mappedPad.gamepadMapping.SELECT:
		// 			this.scene.button_stats(true);
		// 			break
		// 		case this.scene.mappedPad.gamepadMapping.START:
		// 			inputSuccess = this.scene.button_menu();
		// 			break
		// 		case this.scene.mappedPad.gamepadMapping.RB:
		// 			inputSuccess = this.scene.button_cycle_option(Button.CYCLE_SHINY);
		// 			break
		// 		case this.scene.mappedPad.gamepadMapping.LB:
		// 			inputSuccess = this.scene.button_cycle_option(Button.CYCLE_FORM);
		// 			break
		// 		case this.scene.mappedPad.gamepadMapping.LT:
		// 			inputSuccess = this.scene.button_cycle_option(Button.CYCLE_GENDER);
		// 			break
		// 		case this.scene.mappedPad.gamepadMapping.RT:
		// 			inputSuccess = this.scene.button_cycle_option(Button.CYCLE_ABILITY);
		// 			break;
		// 		case this.scene.mappedPad.gamepadMapping.RC_W:
		// 			inputSuccess = this.scene.button_cycle_option(Button.CYCLE_NATURE);
		// 			break
		// 		case this.scene.mappedPad.gamepadMapping.RC_N:
		// 			inputSuccess = this.scene.button_cycle_option(Button.CYCLE_VARIANT);
		// 			break
		// 		case this.scene.mappedPad.gamepadMapping.LS:
		// 			this.scene.button_speed_up();
		// 			break
		// 		case this.scene.mappedPad.gamepadMapping.RS:
		// 			this.scene.button_speed_down();
		// 			break
		// 	}
		// 	if (inputSuccess && this.scene.enableVibration && typeof navigator.vibrate !== 'undefined')
		// 		navigator.vibrate(vibrationLength);
		// });
		//
		// this.input.gamepad.on('up', function (gamepad, button) {
		// 	switch(button.index) {
		// 		case this.scene.mappedPad.gamepadMapping.SELECT:
		// 			this.scene.button_stats(false);
		// 			break
		// 	}
		// });
	}

	/**
	 * Get player object
	 * @param {number} index Player index
	 */
	getPlayer(index) {
		return typeof this.players[index] !== 'undefined' ? this.players[index] : ''
	}

	destroy() {
		this.shutdown();
		this.scene = undefined;
	}
}