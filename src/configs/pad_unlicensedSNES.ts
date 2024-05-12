import {SettingGamepad} from "../system/settings-gamepad";
import {Button} from "../enums/buttons";

/**
 * 081f-e401 - UnlicensedSNES
 */
const pad_unlicensedSNES = {
    padID: '081f-e401',
    padType: 'xbox',
    gamepadMapping : {
        RC_S: 2,
        RC_E: 1,
        RC_W: 3,
        RC_N: 0,
        START: 9,
        SELECT: 8,
        LB: 4,
        RB: 5,
        LC_N: 12,
        LC_S: 13,
        LC_W: 14,
        LC_E: 15
    },
    icons: {
        RC_S: "T_X_B_Color_Alt.png",
        RC_E: "T_X_A_Color_Alt.png",
        RC_W: "T_X_Y_Color_Alt.png",
        RC_N: "T_X_X_Color_Alt.png",
        START: "T_X_X_Alt.png",
        SELECT: "T_X_Share_Alt.png",
        LB: "T_X_LB_Alt.png",
        RB: "T_X_RB_Alt.png",
        LC_N: "T_X_Dpad_Up_Alt.png",
        LC_S: "T_X_Dpad_Down_Alt.png",
        LC_W: "T_X_Dpad_Left_Alt.png",
        LC_E: "T_X_Dpad_Right_Alt.png",
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
        LC_N: Button.UP,
        LC_S: Button.DOWN,
        LC_W: Button.LEFT,
        LC_E: Button.RIGHT,
    }
};

export default pad_unlicensedSNES;
