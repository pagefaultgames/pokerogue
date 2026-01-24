import type { Button } from "#enums/buttons";
import type { Device } from "#enums/devices";
import type { PAD_DUALSHOCK } from "#inputs/pad-dualshock";
import type { PAD_GENERIC } from "#inputs/pad-generic";
import type { PAD_PROCON } from "#inputs/pad-procon";
import type { PAD_UNLICENSED_SNES } from "#inputs/pad-unlicensed-snes";
import type { PAD_XBOX360 } from "#inputs/pad-xbox360";
import type { SettingGamepad } from "#system/settings-gamepad";
import type { SettingKeyboard } from "#system/settings-keyboard";
import type { OnlyRequired } from "#types/type-helpers";

/** Union type of a Gamepad Button name */
export type GamepadButtonName =
  | "RC_S" // Right stick down
  | "RC_E" // Right stick right
  | "RC_W" // Right stick left
  | "RC_N" // Right stick down
  | "START" // "+" on Procon / "Options" on Dualshock
  | "SELECT" // "-" on Procon / "Share" on Dualshock
  | "LB" //  Left bumper
  | "RB" // Right bumper
  | "LT" // Left trigger
  | "RT" // Right trigger
  | "LS" // Left analog stick press
  | "RS" // Right analog stick press
  | "LC_N" // Left analog stick up
  | "LC_S" // Left analog stick down
  | "LC_W" // Left analog stick left
  | "LC_E" // Left analog stick right
  | "TOUCH" // Dualshock only
  | "MENU"; // Procon only, the home button

/** Map of key names to keycodes */
export type DeviceMapping = {
  RC_S: number;
  RC_E: number;
  RC_W: number;
  RC_N: number;
  START: number;
  SELECT: number;
  LB: number;
  RB: number;
  LT?: number;
  RT?: number;
  LS?: number;
  RS?: number;
  LC_N: number;
  LC_S: number;
  LC_W: number;
  LC_E: number;
  TOUCH?: number;
  MENU?: number;
};

/**
 * Configuration for a gamepad.
 *
 * @typeParam T -  Type that maps device buttons to their keycodes
 */
export interface PadConfig<T extends DeviceMapping = DeviceMapping> {
  /** Identifier of the gamepad, as provided by the browser */
  readonly padID: string;
  /** Type of gamepad */
  readonly padType: string;
  /** Mapping of the device's buttons to the keycode they evaluate to */
  deviceMapping: T;
  /** Mapping of the device's buttons to the icon filename */
  icons: Record<keyof OnlyRequired<T>, string>;
  /** Mapping of the settings to the buttons */
  settings: Partial<Record<SettingGamepad, Button>>;
  /** Default bindings for each button */
  default: Record<keyof T, SettingGamepad | -1>;
  /** List of keys that cannot be remapped */
  blacklist?: InterfaceButtonName[];
  /** Custom bindings for each button */
  custom?: Record<keyof T, SettingGamepad | -1>;
}
export type CustomPadConfig<T extends DeviceMapping = DeviceMapping> = Omit<PadConfig<T>, "custom"> &
  Required<Pick<PadConfig<T>, "custom">>;

export interface KeyboardConfig {
  /** Identifier for the pad ID */
  readonly padID: string;
  /** The type of controller layout */
  readonly padType: string;
  /** Mapping of key names to their keycode */
  deviceMapping: Readonly<KeyboardMapping>;
  /** Mapping of icons to use for each keyboard key */
  icons: Record<keyof KeyboardMapping, string>;
  /** The setting names that can be associated with the controller */
  settings: Partial<Record<SettingKeyboard, Button>>;
  /** Default bindings for each key */
  default: Record<keyof KeyboardMapping, SettingKeyboard | -1>;
  /** List of keys that cannot be remapped */
  blacklist?: InterfaceButtonName[];
  /** User-configured custom bindings for each key */
  custom?: Record<keyof KeyboardMapping, SettingKeyboard | -1>;
}

/**
 * Union type of a specific gamepad configuration
 */
export type GamepadConfig =
  | typeof PAD_DUALSHOCK
  | typeof PAD_GENERIC
  | typeof PAD_PROCON
  | typeof PAD_XBOX360
  | typeof PAD_UNLICENSED_SNES;

/**
 * Union type of all supported gamepad configurations, with the `custom` property marked as required
 */
export type CustomGamepadConfig =
  | (typeof PAD_DUALSHOCK & Required<Pick<typeof PAD_DUALSHOCK, "custom">>)
  | (typeof PAD_GENERIC & Required<Pick<typeof PAD_GENERIC, "custom">>)
  | (typeof PAD_PROCON & Required<Pick<typeof PAD_PROCON, "custom">>)
  | (typeof PAD_XBOX360 & Required<Pick<typeof PAD_XBOX360, "custom">>)
  | (typeof PAD_UNLICENSED_SNES & Required<Pick<typeof PAD_UNLICENSED_SNES, "custom">>);

export type CustomKeyboardConfig = Omit<KeyboardConfig, "custom"> & Required<Pick<KeyboardConfig, "custom">>;

/** Union type of all supported configurations (gamepad and keyboard) */
export type InterfaceConfig = PadConfig | KeyboardConfig;
/** The name of a keyboard key */
export type KeyboardKeyName = keyof KeyboardMapping;
/** The name of either a keyboard key or a gamepad input button */
export type InterfaceButtonName = GamepadButtonName | KeyboardKeyName;
/** Set of configurations, indexed by their identifier */
export type ConfigSet = Record<string, InterfaceConfig>;

/**
 * Union type of all supported configurations (gamepad and keyboard), with the `custom` property marked as required
 */
export type CustomInterfaceConfig = CustomPadConfig | CustomKeyboardConfig;

export interface Interaction {
  pressTime: boolean;
  /** Whether the button is still being pressed */
  isPressed: boolean;
  /** The name of  */
  source: string | null;
}

/**
 * The name of the selected device for each device type.
 */
export interface SelectedDevice {
  [Device.GAMEPAD]?: string;
  /**
   * @defaultValue `"default"`
   */
  [Device.KEYBOARD]: string;
}

//#region Button mappings
/** Button keycode mappings for Dualshock controller */
export type DualshockButtons = {
  RC_S: 0;
  RC_E: 1;
  RC_W: 2;
  RC_N: 3;
  START: 9; // Options
  SELECT: 8; // Share
  LB: 4;
  RB: 5;
  LT: 6;
  RT: 7;
  LS: 10;
  RS: 11;
  LC_N: 12;
  LC_S: 13;
  LC_W: 14;
  LC_E: 15;
  TOUCH: 17;
};

/** Button keycode mappings for SNES controller */
export type UnlicensedSnesButtons = {
  RC_S: 2;
  RC_E: 1;
  RC_W: 3;
  RC_N: 0;
  START: 9;
  SELECT: 8;
  LB: 4;
  RB: 5;
  LC_N: 12;
  LC_S: 13;
  LC_W: 14;
  LC_E: 15;
  LT?: number;
  RT?: number;
  LS?: number;
  RS?: number;
};

/** Button keycode mappings for Nintendo pro controller */
export type ProconButtons = {
  RC_S: 1;
  RC_E: 0;
  RC_W: 3;
  RC_N: 2;
  START: 9; // +
  SELECT: 8; // -
  LB: 4;
  RB: 5;
  LT: 6;
  RT: 7;
  LS: 10;
  RS: 11;
  LC_N: 12;
  LC_S: 13;
  LC_W: 14;
  LC_E: 15;
  MENU?: 16; // Home
};

/** Button keycode mappings for xbox360 controller */
export type Xbox360Buttons = {
  RC_S: 0;
  RC_E: 1;
  RC_W: 2;
  RC_N: 3;
  START: 9;
  SELECT: 8;
  LB: 4;
  RB: 5;
  LT: 6;
  RT: 7;
  LS: 10;
  RS: 11;
  LC_N: 12;
  LC_S: 13;
  LC_W: 14;
  LC_E: 15;
};

/** Button keycode mappings for generic controllers */
export type GenericPadButtons = {
  RC_S: 0;
  RC_E: 1;
  RC_W: 2;
  RC_N: 3;
  START: 9;
  SELECT: 8;
  LB: 4;
  RB: 5;
  LT: 6;
  RT: 7;
  LS: 10;
  RS: 11;
  LC_N: 12;
  LC_S: 13;
  LC_W: 14;
  LC_E: 15;
};

/** Map of keyboard button names to their keycode */
export type KeyboardMapping = {
  KEY_A: typeof Phaser.Input.Keyboard.KeyCodes.A;
  KEY_B: typeof Phaser.Input.Keyboard.KeyCodes.B;
  KEY_C: typeof Phaser.Input.Keyboard.KeyCodes.C;
  KEY_D: typeof Phaser.Input.Keyboard.KeyCodes.D;
  KEY_E: typeof Phaser.Input.Keyboard.KeyCodes.E;
  KEY_F: typeof Phaser.Input.Keyboard.KeyCodes.F;
  KEY_G: typeof Phaser.Input.Keyboard.KeyCodes.G;
  KEY_H: typeof Phaser.Input.Keyboard.KeyCodes.H;
  KEY_I: typeof Phaser.Input.Keyboard.KeyCodes.I;
  KEY_J: typeof Phaser.Input.Keyboard.KeyCodes.J;
  KEY_K: typeof Phaser.Input.Keyboard.KeyCodes.K;
  KEY_L: typeof Phaser.Input.Keyboard.KeyCodes.L;
  KEY_M: typeof Phaser.Input.Keyboard.KeyCodes.M;
  KEY_N: typeof Phaser.Input.Keyboard.KeyCodes.N;
  KEY_O: typeof Phaser.Input.Keyboard.KeyCodes.O;
  KEY_P: typeof Phaser.Input.Keyboard.KeyCodes.P;
  KEY_Q: typeof Phaser.Input.Keyboard.KeyCodes.Q;
  KEY_R: typeof Phaser.Input.Keyboard.KeyCodes.R;
  KEY_S: typeof Phaser.Input.Keyboard.KeyCodes.S;
  KEY_T: typeof Phaser.Input.Keyboard.KeyCodes.T;
  KEY_U: typeof Phaser.Input.Keyboard.KeyCodes.U;
  KEY_V: typeof Phaser.Input.Keyboard.KeyCodes.V;
  KEY_W: typeof Phaser.Input.Keyboard.KeyCodes.W;
  KEY_X: typeof Phaser.Input.Keyboard.KeyCodes.X;
  KEY_Y: typeof Phaser.Input.Keyboard.KeyCodes.Y;
  KEY_Z: typeof Phaser.Input.Keyboard.KeyCodes.Z;

  KEY_0: typeof Phaser.Input.Keyboard.KeyCodes.ZERO;
  KEY_1: typeof Phaser.Input.Keyboard.KeyCodes.ONE;
  KEY_2: typeof Phaser.Input.Keyboard.KeyCodes.TWO;
  KEY_3: typeof Phaser.Input.Keyboard.KeyCodes.THREE;
  KEY_4: typeof Phaser.Input.Keyboard.KeyCodes.FOUR;
  KEY_5: typeof Phaser.Input.Keyboard.KeyCodes.FIVE;
  KEY_6: typeof Phaser.Input.Keyboard.KeyCodes.SIX;
  KEY_7: typeof Phaser.Input.Keyboard.KeyCodes.SEVEN;
  KEY_8: typeof Phaser.Input.Keyboard.KeyCodes.EIGHT;
  KEY_9: typeof Phaser.Input.Keyboard.KeyCodes.NINE;

  KEY_F1: typeof Phaser.Input.Keyboard.KeyCodes.F1;
  KEY_F2: typeof Phaser.Input.Keyboard.KeyCodes.F2;
  KEY_F3: typeof Phaser.Input.Keyboard.KeyCodes.F3;
  KEY_F4: typeof Phaser.Input.Keyboard.KeyCodes.F4;
  KEY_F5: typeof Phaser.Input.Keyboard.KeyCodes.F5;
  KEY_F6: typeof Phaser.Input.Keyboard.KeyCodes.F6;
  KEY_F7: typeof Phaser.Input.Keyboard.KeyCodes.F7;
  KEY_F8: typeof Phaser.Input.Keyboard.KeyCodes.F8;
  KEY_F9: typeof Phaser.Input.Keyboard.KeyCodes.F9;
  KEY_F10: typeof Phaser.Input.Keyboard.KeyCodes.F10;
  KEY_F11: typeof Phaser.Input.Keyboard.KeyCodes.F11;
  KEY_F12: typeof Phaser.Input.Keyboard.KeyCodes.F12;

  KEY_PAGE_DOWN: typeof Phaser.Input.Keyboard.KeyCodes.PAGE_DOWN;
  KEY_PAGE_UP: typeof Phaser.Input.Keyboard.KeyCodes.PAGE_UP;

  KEY_CTRL: typeof Phaser.Input.Keyboard.KeyCodes.CTRL;
  KEY_DEL: typeof Phaser.Input.Keyboard.KeyCodes.DELETE;
  KEY_END: typeof Phaser.Input.Keyboard.KeyCodes.END;
  KEY_ENTER: typeof Phaser.Input.Keyboard.KeyCodes.ENTER;
  KEY_ESC: typeof Phaser.Input.Keyboard.KeyCodes.ESC;
  KEY_HOME: typeof Phaser.Input.Keyboard.KeyCodes.HOME;
  KEY_INSERT: typeof Phaser.Input.Keyboard.KeyCodes.INSERT;

  KEY_PLUS: typeof Phaser.Input.Keyboard.KeyCodes.NUMPAD_ADD; // Assuming numpad plus
  KEY_MINUS: typeof Phaser.Input.Keyboard.KeyCodes.NUMPAD_SUBTRACT; // Assuming numpad minus
  KEY_QUOTATION: typeof Phaser.Input.Keyboard.KeyCodes.QUOTES;
  KEY_SHIFT: typeof Phaser.Input.Keyboard.KeyCodes.SHIFT;

  KEY_SPACE: typeof Phaser.Input.Keyboard.KeyCodes.SPACE;
  KEY_TAB: typeof Phaser.Input.Keyboard.KeyCodes.TAB;
  KEY_TILDE: typeof Phaser.Input.Keyboard.KeyCodes.BACKTICK;

  KEY_ARROW_UP: typeof Phaser.Input.Keyboard.KeyCodes.UP;
  KEY_ARROW_DOWN: typeof Phaser.Input.Keyboard.KeyCodes.DOWN;
  KEY_ARROW_LEFT: typeof Phaser.Input.Keyboard.KeyCodes.LEFT;
  KEY_ARROW_RIGHT: typeof Phaser.Input.Keyboard.KeyCodes.RIGHT;

  KEY_LEFT_BRACKET: typeof Phaser.Input.Keyboard.KeyCodes.OPEN_BRACKET;
  KEY_RIGHT_BRACKET: typeof Phaser.Input.Keyboard.KeyCodes.CLOSED_BRACKET;

  KEY_SEMICOLON: typeof Phaser.Input.Keyboard.KeyCodes.SEMICOLON;
  KEY_COMMA: typeof Phaser.Input.Keyboard.KeyCodes.COMMA;
  KEY_PERIOD: typeof Phaser.Input.Keyboard.KeyCodes.PERIOD;
  KEY_BACK_SLASH: typeof Phaser.Input.Keyboard.KeyCodes.BACK_SLASH;
  KEY_FORWARD_SLASH: typeof Phaser.Input.Keyboard.KeyCodes.FORWARD_SLASH;

  KEY_BACKSPACE: typeof Phaser.Input.Keyboard.KeyCodes.BACKSPACE;
  KEY_ALT: typeof Phaser.Input.Keyboard.KeyCodes.ALT;
};
//#endregion Button mappings

export type MappingSettingName = SettingGamepad | SettingKeyboard;
