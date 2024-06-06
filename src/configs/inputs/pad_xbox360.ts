import {SettingGamepad} from "../../system/settings/settings-gamepad";
import {Button} from "#app/enums/buttons";

/**
 * Generic pad mapping
 */
const pad_xbox360 = {
  padID: "Xbox 360 controller (XInput STANDARD GAMEPAD)",
  padType: "xbox",
  deviceMapping: {
    RC_S: 0,
    RC_E: 1,
    RC_W: 2,
    RC_N: 3,
    START: 9,
    SELECT: 8,
    LB: 4,
    RB: 5,
    LT: 6,
    RT: 7,
    LS: 10,
    RS: 11,
    LC_N: 12,
    LC_S: 13,
    LC_W: 14,
    LC_E: 15
  },
  icons: {
    RC_S: "XB_Letter_A_OL.png",
    RC_E: "XB_Letter_B_OL.png",
    RC_W: "XB_Letter_X_OL.png",
    RC_N: "XB_Letter_Y_OL.png",
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
    [SettingGamepad.Button_Up]: Button.UP,
    [SettingGamepad.Button_Down]: Button.DOWN,
    [SettingGamepad.Button_Left]: Button.LEFT,
    [SettingGamepad.Button_Right]: Button.RIGHT,
    [SettingGamepad.Button_Action]: Button.ACTION,
    [SettingGamepad.Button_Cancel]: Button.CANCEL,
    [SettingGamepad.Button_Cycle_Nature]: Button.CYCLE_NATURE,
    [SettingGamepad.Button_Cycle_Variant]: Button.V,
    [SettingGamepad.Button_Menu]: Button.MENU,
    [SettingGamepad.Button_Stats]: Button.STATS,
    [SettingGamepad.Button_Cycle_Form]:  Button.CYCLE_FORM,
    [SettingGamepad.Button_Cycle_Shiny]: Button.CYCLE_SHINY,
    [SettingGamepad.Button_Cycle_Gender]: Button.CYCLE_GENDER,
    [SettingGamepad.Button_Cycle_Ability]: Button.CYCLE_ABILITY,
    [SettingGamepad.Button_Speed_Up]: Button.SPEED_UP,
    [SettingGamepad.Button_Slow_Down]: Button.SLOW_DOWN
  },
  default: {
    LC_N: SettingGamepad.Button_Up,
    LC_S: SettingGamepad.Button_Down,
    LC_W: SettingGamepad.Button_Left,
    LC_E: SettingGamepad.Button_Right,
    RC_S: SettingGamepad.Button_Action,
    RC_E: SettingGamepad.Button_Cancel,
    RC_W: SettingGamepad.Button_Cycle_Nature,
    RC_N: SettingGamepad.Button_Cycle_Variant,
    START: SettingGamepad.Button_Menu,
    SELECT: SettingGamepad.Button_Stats,
    LB: SettingGamepad.Button_Cycle_Form,
    RB: SettingGamepad.Button_Cycle_Shiny,
    LT: SettingGamepad.Button_Cycle_Gender,
    RT: SettingGamepad.Button_Cycle_Ability,
    LS: SettingGamepad.Button_Speed_Up,
    RS: SettingGamepad.Button_Slow_Down
  },
};

export default pad_xbox360;
