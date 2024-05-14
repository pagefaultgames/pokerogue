import {beforeEach, expect, describe, it} from "vitest";
import cfg_gamepad_example, {SettingInterfaceGamepad} from "./cfg_gamepad_example";
import {
    getIconWithPressedButton,
    getIconWithSettingName,
    getKeyAndActionFromCurrentKeysWithSettingName,
    getKeyForSettingName,
    getKeyFromMapping,
    getKeyWithAction,
    reloadCurrentKeys,
    swapCurrentKeys,
} from "#app/configs/gamepad-utils";
import {Button} from "#app/enums/buttons";


function deepCopy(config) {
    return JSON.parse(JSON.stringify(config));
}

describe('Test Keyboard', () => {
    let config;
    beforeEach(() => {
        const temp = {...cfg_gamepad_example}
        config = deepCopy(temp);
        config.custom = {...config.default}
        config.ogIcons = {...config.icons}
        reloadCurrentKeys(config);
    });

    it('Check if config is loaded', () => {
        expect(config).not.toBeNull();
    });
    it('Check key for setting name', () => {
        const settingName = SettingInterfaceGamepad.Button_Action;
        const key = getKeyForSettingName(config, settingName);
        expect(config.custom[key]).toEqual(Button.ACTION);
    });
    it('Check key for Keyboard KeyCode', () => {
        const key = getKeyFromMapping(config, 0);
        expect(config.custom[key]).toEqual(Button.ACTION);
    });
    it('Check key for currenly Assigned to action not alt', () => {
        const key = getKeyWithAction(config, Button.ACTION, false);
        expect(key).toEqual('RC_S');
    });
    it('Check key for currenly Assigned to setting name', () => {
        const settingName = SettingInterfaceGamepad.Button_Action;
        const { key } = getKeyAndActionFromCurrentKeysWithSettingName(config, settingName);
        expect(key).toEqual('RC_S');
    });
    it('Check icon for currenly Assigned to key code', () => {
        const icon = getIconWithPressedButton(config, 0);
        expect(icon).toEqual('T_X_A_Color_Alt.png');
    });
    it('Check icon for currenly Assigned to setting name', () => {
        const settingName = SettingInterfaceGamepad.Button_Action;
        const icon = getIconWithSettingName(config, settingName);
        expect(icon).toEqual('T_X_A_Color_Alt.png');
    });


    it('Check if current keys return the same', () => {
        const settingNameA = SettingInterfaceGamepad.Button_Action;
        const keyA = getKeyForSettingName(config, settingNameA);
        const action = config.custom[keyA];
        expect(keyA).toEqual("RC_S");
        expect(action).toEqual(Button.ACTION);

        expect(config.currentKeys[settingNameA].key).toEqual(keyA);
        expect(config.currentKeys[settingNameA].action).toEqual(action);
    });

    it('Check if new swap is working', () => {
        const settingNameA = SettingInterfaceGamepad.Button_Action;
        swapCurrentKeys(config, settingNameA, 1);
        expect(config.currentKeys[settingNameA].key).toEqual("RC_S");
        expect(config.currentKeys[settingNameA].action).toEqual(Button.CANCEL);
    });

    it('Check if new double swap is working', () => {
        const settingNameA = SettingInterfaceGamepad.Button_Action;

        swapCurrentKeys(config, settingNameA, 1);
        expect(config.currentKeys[settingNameA].key).toEqual("RC_S");
        expect(config.currentKeys[settingNameA].action).toEqual(Button.CANCEL);

        swapCurrentKeys(config, settingNameA, 2);
        expect(config.currentKeys[settingNameA].key).toEqual("RC_S");
        expect(config.currentKeys[settingNameA].action).toEqual(Button.CYCLE_NATURE);
    });

    it('Check if new triple swap is working', () => {
        const settingNameA = SettingInterfaceGamepad.Button_Action;
        const settingNameB = SettingInterfaceGamepad.Button_Cancel;
        const settingNameC = SettingInterfaceGamepad.Button_Cycle_Nature;

        expect(config.currentKeys[SettingInterfaceGamepad.Button_Action].key).toEqual("RC_S");
        expect(config.currentKeys[SettingInterfaceGamepad.Button_Action].action).toEqual(Button.ACTION);

        expect(config.currentKeys[SettingInterfaceGamepad.Button_Cancel].key).toEqual("RC_E");
        expect(config.currentKeys[SettingInterfaceGamepad.Button_Cancel].action).toEqual(Button.CANCEL);

        expect(config.currentKeys[SettingInterfaceGamepad.Button_Cycle_Nature].key).toEqual("RC_W");
        expect(config.currentKeys[SettingInterfaceGamepad.Button_Cycle_Nature].action).toEqual(Button.CYCLE_NATURE);

        let iconA = getIconWithSettingName(config, settingNameA);
        let iconB = getIconWithSettingName(config, settingNameB);
        let iconC = getIconWithSettingName(config, settingNameC);
        expect(iconA).toEqual('T_X_A_Color_Alt.png');
        expect(iconB).toEqual('T_X_B_Color_Alt.png');
        expect(iconC).toEqual('T_X_X_Color_Alt.png');

        swapCurrentKeys(config, SettingInterfaceGamepad.Button_Action, 1); // cancel

        expect(config.currentKeys[SettingInterfaceGamepad.Button_Action].key).toEqual("RC_S");
        expect(config.currentKeys[SettingInterfaceGamepad.Button_Action].action).toEqual(Button.CANCEL);

        expect(config.currentKeys[SettingInterfaceGamepad.Button_Cancel].key).toEqual("RC_E");
        expect(config.currentKeys[SettingInterfaceGamepad.Button_Cancel].action).toEqual(Button.ACTION);

        expect(config.currentKeys[SettingInterfaceGamepad.Button_Cycle_Nature].key).toEqual("RC_W");
        expect(config.currentKeys[SettingInterfaceGamepad.Button_Cycle_Nature].action).toEqual(Button.CYCLE_NATURE);

        iconA = getIconWithSettingName(config, settingNameA);
        iconB = getIconWithSettingName(config, settingNameB);
        iconC = getIconWithSettingName(config, settingNameC);
        expect(iconA).toEqual('T_X_B_Color_Alt.png');
        expect(iconB).toEqual('T_X_A_Color_Alt.png');
        expect(iconC).toEqual('T_X_X_Color_Alt.png');

        swapCurrentKeys(config, SettingInterfaceGamepad.Button_Cancel, 2); // cycle nature

        expect(config.currentKeys[SettingInterfaceGamepad.Button_Action].key).toEqual("RC_S");
        expect(config.currentKeys[SettingInterfaceGamepad.Button_Action].action).toEqual(Button.CANCEL); // 6

        expect(config.currentKeys[SettingInterfaceGamepad.Button_Cancel].key).toEqual("RC_E");
        expect(config.currentKeys[SettingInterfaceGamepad.Button_Cancel].action).toEqual(Button.CYCLE_NATURE); // 13

        expect(config.currentKeys[SettingInterfaceGamepad.Button_Cycle_Nature].key).toEqual("RC_W");
        expect(config.currentKeys[SettingInterfaceGamepad.Button_Cycle_Nature].action).toEqual(Button.ACTION); // 5

        iconA = getIconWithSettingName(config, settingNameA);
        iconB = getIconWithSettingName(config, settingNameB);
        iconC = getIconWithSettingName(config, settingNameC);
        expect(iconA).toEqual('T_X_B_Color_Alt.png');
        expect(iconB).toEqual('T_X_X_Color_Alt.png');
        expect(iconC).toEqual('T_X_A_Color_Alt.png');

        swapCurrentKeys(config, SettingInterfaceGamepad.Button_Cycle_Nature, 1); // cancel

        expect(config.currentKeys[SettingInterfaceGamepad.Button_Action].key).toEqual("RC_S");
        expect(config.currentKeys[SettingInterfaceGamepad.Button_Action].action).toEqual(Button.CANCEL);

        expect(config.currentKeys[SettingInterfaceGamepad.Button_Cancel].key).toEqual("RC_E");
        expect(config.currentKeys[SettingInterfaceGamepad.Button_Cancel].action).toEqual(Button.ACTION);

        expect(config.currentKeys[SettingInterfaceGamepad.Button_Cycle_Nature].key).toEqual("RC_W");
        expect(config.currentKeys[SettingInterfaceGamepad.Button_Cycle_Nature].action).toEqual(Button.CYCLE_NATURE);

        iconA = getIconWithSettingName(config, settingNameA);
        iconB = getIconWithSettingName(config, settingNameB);
        iconC = getIconWithSettingName(config, settingNameC);
        expect(iconA).toEqual('T_X_B_Color_Alt.png');
        expect(iconB).toEqual('T_X_A_Color_Alt.png');
        expect(iconC).toEqual('T_X_X_Color_Alt.png');

        expect(config.ogIcons["RC_S"]).toEqual("T_X_A_Color_Alt.png")
        expect(config.ogIcons["RC_E"]).toEqual("T_X_B_Color_Alt.png")
        expect(config.ogIcons["RC_N"]).toEqual("T_X_Y_Color_Alt.png")
        expect(config.ogIcons["RC_W"]).toEqual("T_X_X_Color_Alt.png")
    });

    it('Check 2 swap back to back', () => {
        swapCurrentKeys(config, SettingInterfaceGamepad.Button_Action, 1); // cancel
        expect(config.currentKeys[SettingInterfaceGamepad.Button_Action].key).toEqual("RC_S");
        expect(config.currentKeys[SettingInterfaceGamepad.Button_Action].action).toEqual(Button.CANCEL);
        let iconA = getIconWithSettingName(config, SettingInterfaceGamepad.Button_Action);
        expect(iconA).toEqual('T_X_B_Color_Alt.png');

        swapCurrentKeys(config, SettingInterfaceGamepad.Button_Action, 0); // cancel
        let iconB = getIconWithSettingName(config, SettingInterfaceGamepad.Button_Action);
        expect(config.currentKeys[SettingInterfaceGamepad.Button_Action].key).toEqual("RC_S");
        expect(config.currentKeys[SettingInterfaceGamepad.Button_Action].action).toEqual(Button.ACTION);
        expect(iconB).toEqual('T_X_A_Color_Alt.png');
    });
});