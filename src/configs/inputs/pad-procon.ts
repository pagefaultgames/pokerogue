import { Button } from "#enums/buttons";
import { SettingGamepad } from "#system/settings-gamepad";
import type { PadConfig, ProconButtons } from "#types/inputs";

/**
 * Nintendo Pro Controller mapping
 */
export const PAD_PROCON: PadConfig<ProconButtons> = {
  padID: "Pro Controller",
  padType: "procon",
  deviceMapping: {
    RC_S: 1,
    RC_E: 0,
    RC_W: 3,
    RC_N: 2,
    START: 9, // +
    SELECT: 8, // -
    LB: 4,
    RB: 5,
    LT: 6,
    RT: 7,
    LS: 10,
    RS: 11,
    LC_N: 12,
    LC_S: 13,
    LC_W: 14,
    LC_E: 15,
    MENU: 16, // Home
  },
  icons: {
    RC_S: "B.png",
    RC_E: "A.png",
    RC_W: "Y.png",
    RC_N: "X.png",
    START: "PLUS.png",
    SELECT: "MINUS.png",
    LB: "L.png",
    RB: "R.png",
    LT: "ZL.png",
    RT: "ZR.png",
    LS: "LS.png",
    RS: "RS.png",
    LC_N: "UP.png",
    LC_S: "DOWN.png",
    LC_W: "LEFT.png",
    LC_E: "RIGHT.png",
  },
  settings: {
    [SettingGamepad.BUTTON_UP]: Button.UP,
    [SettingGamepad.BUTTON_DOWN]: Button.DOWN,
    [SettingGamepad.BUTTON_LEFT]: Button.LEFT,
    [SettingGamepad.BUTTON_RIGHT]: Button.RIGHT,
    [SettingGamepad.BUTTON_ACTION]: Button.ACTION,
    [SettingGamepad.BUTTON_CANCEL]: Button.CANCEL,
    [SettingGamepad.BUTTON_CYCLE_NATURE]: Button.CYCLE_NATURE,
    [SettingGamepad.BUTTON_CYCLE_TERA]: Button.CYCLE_TERA,
    [SettingGamepad.BUTTON_MENU]: Button.MENU,
    [SettingGamepad.BUTTON_STATS]: Button.STATS,
    [SettingGamepad.BUTTON_CYCLE_FORM]: Button.CYCLE_FORM,
    [SettingGamepad.BUTTON_CYCLE_SHINY]: Button.CYCLE_SHINY,
    [SettingGamepad.BUTTON_CYCLE_GENDER]: Button.CYCLE_GENDER,
    [SettingGamepad.BUTTON_CYCLE_ABILITY]: Button.CYCLE_ABILITY,
    [SettingGamepad.BUTTON_SPEED_UP]: Button.SPEED_UP,
    [SettingGamepad.BUTTON_SLOW_DOWN]: Button.SLOW_DOWN,
  },
  default: {
    LC_N: SettingGamepad.BUTTON_UP,
    LC_S: SettingGamepad.BUTTON_DOWN,
    LC_W: SettingGamepad.BUTTON_LEFT,
    LC_E: SettingGamepad.BUTTON_RIGHT,
    RC_S: SettingGamepad.BUTTON_ACTION,
    RC_E: SettingGamepad.BUTTON_CANCEL,
    RC_W: SettingGamepad.BUTTON_CYCLE_NATURE,
    RC_N: SettingGamepad.BUTTON_CYCLE_TERA,
    START: SettingGamepad.BUTTON_MENU,
    SELECT: SettingGamepad.BUTTON_STATS,
    LB: SettingGamepad.BUTTON_CYCLE_FORM,
    RB: SettingGamepad.BUTTON_CYCLE_SHINY,
    LT: SettingGamepad.BUTTON_CYCLE_GENDER,
    RT: SettingGamepad.BUTTON_CYCLE_ABILITY,
    LS: SettingGamepad.BUTTON_SPEED_UP,
    RS: SettingGamepad.BUTTON_SLOW_DOWN,
    MENU: -1, // Home button unbound by default
  },
};
