import { Button } from "#enums/buttons";
import { SettingGamepad } from "#system/settings-gamepad";
import type { PadConfig, ProconButtons } from "#types/configs/inputs";

/**
 * Nintendo Pro Controller mapping
 */
export const PAD_PROCON: PadConfig<ProconButtons> = {
  padID: "Pro Controller",
  padType: "xbox",
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
    RC_S: "XB_Letter_B_OL.png",
    RC_E: "XB_Letter_A_OL.png",
    RC_W: "XB_Letter_Y_OL.png",
    RC_N: "XB_Letter_X_OL.png",
    START: "START.png",
    SELECT: "SELECT.png",
    LB: "Bumper_L.png",
    RB: "Bumper_R.png",
    LT: "Trigger_L.png",
    RT: "Trigger_R.png",
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
