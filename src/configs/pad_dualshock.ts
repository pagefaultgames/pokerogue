import {SettingGamepad} from "../system/settings-gamepad";
import {Button} from "../enums/buttons";

/**
 * Dualshock mapping
 */
const pad_dualshock = {
    padID: 'Dualshock',
    padType: 'dualshock',
    gamepadMapping: {
        RC_S: 0,
        RC_E: 1,
        RC_W: 2,
        RC_N: 3,
        START: 9, // Options
        SELECT: 8, // Share
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
        TOUCH: 17
    },
    icons: {
        RC_S: "T_P4_Cross_Color_Default.png",
        RC_E: "T_P4_Circle_Color_Default.png",
        RC_W: "T_P4_Square_Color_Default.png",
        RC_N: "T_P4_Triangle_Color_Default.png",
        START: "T_P4_Options_Default.png",
        SELECT: "T_P4_Share_Default.png",
        LB: "T_P4_L1_Default.png",
        RB: "T_P4_R1_Default.png",
        LT: "T_P4_L2_Default.png",
        RT: "T_P4_R2_Default.png",
        LS: "T_P4_Left_Stick_Click_Default.png",
        RS: "T_P4_Left_Stick_Click_Default-1.png",
        LC_N: "T_P4_Dpad_UP_Default.png",
        LC_S: "T_P4_Dpad_Down_Default.png",
        LC_W: "T_P4_Dpad_Left_Default.png",
        LC_E: "T_P4_Dpad_Right_Default.png",
        TOUCH: "T_P4_Touch_Pad_Default.png"
    },
    setting: {
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
        RS: SettingGamepad.Button_Slow_Down,
        TOUCH: SettingGamepad.Button_Submit,
    },
    default: {
        RC_S: Button.ACTION,
        RC_E: Button.CANCEL,
        RC_W: Button.CYCLE_NATURE,
        RC_N: Button.CYCLE_VARIANT,
        START: Button.MENU,
        SELECT: Button.STATS,
        LB: Button.CYCLE_FORM,
        RB: Button.CYCLE_SHINY,
        LT: Button.CYCLE_GENDER,
        RT: Button.CYCLE_ABILITY,
        LS: Button.SPEED_UP,
        RS: Button.SLOW_DOWN,
        LC_N: Button.UP,
        LC_S: Button.DOWN,
        LC_W: Button.LEFT,
        LC_E: Button.RIGHT,
        TOUCH: Button.SUBMIT,
    }
};

export default pad_dualshock;
