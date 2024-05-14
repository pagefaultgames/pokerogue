import {beforeEach, expect, describe, it} from "vitest";
import cfg_keyboard_example, {SettingInterfaceKeyboard} from "#app/test/cfg_keyboard_example";
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
        config = deepCopy(cfg_keyboard_example);
        config.custom = {...config.default}
        reloadCurrentKeys(config);
    });

    it('Check if config is loaded', () => {
        expect(config).not.toBeNull();
    });
    it('Check key for setting name', () => {
        const settingName = SettingInterfaceKeyboard.Button_Left;
        const key = getKeyForSettingName(config, settingName);
        expect(config.custom[key]).toEqual(Button.LEFT);
    });
    it('Check key for Keyboard KeyCode', () => {
        const key = getKeyFromMapping(config, Phaser.Input.Keyboard.KeyCodes.LEFT);
        expect(config.custom[key]).toEqual(Button.LEFT);
    });
    it('Check key for currenly Assigned to action not alt', () => {
        const key = getKeyWithAction(config, Button.LEFT, false);
        expect(key).toEqual('KEY_ARROW_LEFT');
    });
    it('Check key for currenly Assigned to action alt', () => {
        const key = getKeyWithAction(config, Button.LEFT, true);
        expect(key).toEqual('KEY_Q');
    });
    it('Check key for currenly Assigned to setting name', () => {
        const settingName = SettingInterfaceKeyboard.Button_Left;
        const { key } = getKeyAndActionFromCurrentKeysWithSettingName(config, settingName);
        expect(key).toEqual('KEY_ARROW_LEFT');
    });
    it('Check key for currenly Assigned to setting name alt', () => {
        const settingName = SettingInterfaceKeyboard.Alt_Button_Left;
        const { key } = getKeyAndActionFromCurrentKeysWithSettingName(config, settingName);
        expect(key).toEqual('KEY_Q');
    });
    it('Check icon for currenly Assigned to key code', () => {
        const icon = getIconWithPressedButton(config, Phaser.Input.Keyboard.KeyCodes.LEFT);
        expect(icon).toEqual('T_Left_Key_Dark.png');
    });
    it('Check icon for currenly Assigned to key code alt', () => {
        const icon = getIconWithPressedButton(config, Phaser.Input.Keyboard.KeyCodes.Q);
        expect(icon).toEqual('T_Q_Key_Dark.png');
    });
    it('Check icon for currenly Assigned to setting name', () => {
        const settingName = SettingInterfaceKeyboard.Button_Left;
        const icon = getIconWithSettingName(config, settingName);
        expect(icon).toEqual('T_Left_Key_Dark.png');
    });
    it('Check icon for currenly Assigned to setting name alt', () => {
        const settingName = SettingInterfaceKeyboard.Alt_Button_Left;
        const icon = getIconWithSettingName(config, settingName);
        expect(icon).toEqual('T_Q_Key_Dark.png');
    });


    it('Check if current keys return the same', () => {
        const settingNameA = SettingInterfaceKeyboard.Button_Left;
        const keyA = getKeyForSettingName(config, settingNameA);
        const action = config.custom[keyA];
        expect(keyA).toEqual("KEY_ARROW_LEFT");
        expect(action).toEqual(Button.LEFT);

        expect(config.currentKeys[settingNameA].key).toEqual(keyA);
        expect(config.currentKeys[settingNameA].action).toEqual(action);
    });

    it('Check if new swap is working', () => {
        const settingNameA = SettingInterfaceKeyboard.Button_Left;
        swapCurrentKeys(config, settingNameA, Phaser.Input.Keyboard.KeyCodes.RIGHT);
        expect(config.currentKeys[settingNameA].key).toEqual("KEY_ARROW_LEFT");
        expect(config.currentKeys[settingNameA].action).toEqual(Button.RIGHT);
    });

    it('Check if new double swap is working', () => {
        const settingNameA = SettingInterfaceKeyboard.Button_Left;

        swapCurrentKeys(config, settingNameA, Phaser.Input.Keyboard.KeyCodes.RIGHT);
        expect(config.currentKeys[settingNameA].key).toEqual("KEY_ARROW_LEFT");
        expect(config.currentKeys[settingNameA].action).toEqual(Button.RIGHT);

        swapCurrentKeys(config, settingNameA, Phaser.Input.Keyboard.KeyCodes.UP);
        expect(config.currentKeys[settingNameA].key).toEqual("KEY_ARROW_LEFT");
        expect(config.currentKeys[settingNameA].action).toEqual(Button.UP);
    });

    it('Check if new triple swap is working', () => {
        const settingNameA = SettingInterfaceKeyboard.Button_Left;
        const settingNameB = SettingInterfaceKeyboard.Button_Action;
        const settingNameC = SettingInterfaceKeyboard.Button_Right;
        const settingNameD = SettingInterfaceKeyboard.Button_Up;

        expect(config.currentKeys[SettingInterfaceKeyboard.Button_Left].key).toEqual("KEY_ARROW_LEFT");
        expect(config.currentKeys[SettingInterfaceKeyboard.Button_Left].action).toEqual(Button.LEFT);

        expect(config.currentKeys[SettingInterfaceKeyboard.Button_Action].key).toEqual("KEY_SPACE");
        expect(config.currentKeys[SettingInterfaceKeyboard.Button_Action].action).toEqual(Button.ACTION);

        expect(config.currentKeys[SettingInterfaceKeyboard.Button_Right].key).toEqual("KEY_ARROW_RIGHT");
        expect(config.currentKeys[SettingInterfaceKeyboard.Button_Right].action).toEqual(Button.RIGHT);

        expect(config.currentKeys[SettingInterfaceKeyboard.Button_Up].key).toEqual("KEY_ARROW_UP");
        expect(config.currentKeys[SettingInterfaceKeyboard.Button_Up].action).toEqual(Button.UP);

        let iconA = getIconWithSettingName(config, settingNameA);
        let iconB = getIconWithSettingName(config, settingNameB);
        let iconC = getIconWithSettingName(config, settingNameC);
        let iconD = getIconWithSettingName(config, settingNameD);
        expect(iconA).toEqual('T_Left_Key_Dark.png');
        expect(iconB).toEqual('T_Space_Key_Dark.png');
        expect(iconC).toEqual('T_Right_Key_Dark.png');
        expect(iconD).toEqual('T_Up_Key_Dark.png');

        swapCurrentKeys(config, SettingInterfaceKeyboard.Button_Left, Phaser.Input.Keyboard.KeyCodes.RIGHT); // left->RIGHT, right->LEFT

        expect(config.currentKeys[SettingInterfaceKeyboard.Button_Left].key).toEqual("KEY_ARROW_LEFT");
        expect(config.currentKeys[SettingInterfaceKeyboard.Button_Left].action).toEqual(Button.RIGHT);

        expect(config.currentKeys[SettingInterfaceKeyboard.Button_Action].key).toEqual("KEY_SPACE");
        expect(config.currentKeys[SettingInterfaceKeyboard.Button_Action].action).toEqual(Button.ACTION);

        expect(config.currentKeys[SettingInterfaceKeyboard.Button_Right].key).toEqual("KEY_ARROW_RIGHT");
        expect(config.currentKeys[SettingInterfaceKeyboard.Button_Right].action).toEqual(Button.LEFT);

        expect(config.currentKeys[SettingInterfaceKeyboard.Button_Up].key).toEqual("KEY_ARROW_UP");
        expect(config.currentKeys[SettingInterfaceKeyboard.Button_Up].action).toEqual(Button.UP);

        iconA = getIconWithSettingName(config, settingNameA);
        iconB = getIconWithSettingName(config, settingNameB);
        iconC = getIconWithSettingName(config, settingNameC);
        iconD = getIconWithSettingName(config, settingNameD);
        expect(iconA).toEqual('T_Right_Key_Dark.png');
        expect(iconB).toEqual('T_Space_Key_Dark.png');
        expect(iconC).toEqual('T_Left_Key_Dark.png');
        expect(iconD).toEqual('T_Up_Key_Dark.png');

        swapCurrentKeys(config, SettingInterfaceKeyboard.Button_Action, Phaser.Input.Keyboard.KeyCodes.UP); // action->UP

        expect(config.currentKeys[SettingInterfaceKeyboard.Button_Left].key).toEqual("KEY_ARROW_LEFT");
        expect(config.currentKeys[SettingInterfaceKeyboard.Button_Left].action).toEqual(Button.RIGHT);

        expect(config.currentKeys[SettingInterfaceKeyboard.Button_Action].key).toEqual("KEY_SPACE");
        expect(config.currentKeys[SettingInterfaceKeyboard.Button_Action].action).toEqual(Button.UP)

        expect(config.currentKeys[SettingInterfaceKeyboard.Button_Right].key).toEqual("KEY_ARROW_RIGHT");
        expect(config.currentKeys[SettingInterfaceKeyboard.Button_Right].action).toEqual(Button.LEFT);

        expect(config.currentKeys[SettingInterfaceKeyboard.Button_Up].key).toEqual("KEY_ARROW_UP");
        expect(config.currentKeys[SettingInterfaceKeyboard.Button_Up].action).toEqual(Button.ACTION);

        iconA = getIconWithSettingName(config, settingNameA);
        iconB = getIconWithSettingName(config, settingNameB);
        iconC = getIconWithSettingName(config, settingNameC);
        iconD = getIconWithSettingName(config, settingNameD);
        expect(iconA).toEqual('T_Right_Key_Dark.png');
        expect(iconB).toEqual('T_Up_Key_Dark.png');
        expect(iconC).toEqual('T_Left_Key_Dark.png');
        expect(iconD).toEqual('T_Space_Key_Dark.png');

        swapCurrentKeys(config, SettingInterfaceKeyboard.Button_Right, Phaser.Input.Keyboard.KeyCodes.UP); // right->UP, action->LEFT

        expect(config.currentKeys[SettingInterfaceKeyboard.Button_Left].key).toEqual("KEY_ARROW_LEFT");
        expect(config.currentKeys[SettingInterfaceKeyboard.Button_Left].action).toEqual(Button.RIGHT);

        expect(config.currentKeys[SettingInterfaceKeyboard.Button_Action].key).toEqual("KEY_SPACE");
        expect(config.currentKeys[SettingInterfaceKeyboard.Button_Action].action).toEqual(Button.UP)

        expect(config.currentKeys[SettingInterfaceKeyboard.Button_Right].key).toEqual("KEY_ARROW_RIGHT");
        expect(config.currentKeys[SettingInterfaceKeyboard.Button_Right].action).toEqual(Button.ACTION);

        expect(config.currentKeys[SettingInterfaceKeyboard.Button_Up].key).toEqual("KEY_ARROW_UP");
        expect(config.currentKeys[SettingInterfaceKeyboard.Button_Up].action).toEqual(Button.LEFT);

        iconA = getIconWithSettingName(config, settingNameA);
        iconB = getIconWithSettingName(config, settingNameB);
        iconC = getIconWithSettingName(config, settingNameC);
        iconD = getIconWithSettingName(config, settingNameD);
        expect(iconA).toEqual('T_Right_Key_Dark.png');
        expect(iconB).toEqual('T_Up_Key_Dark.png');
        expect(iconC).toEqual('T_Space_Key_Dark.png');
        expect(iconD).toEqual('T_Left_Key_Dark.png');
    });


    it('Swap alt with another main', () => {
        const settingNameA = SettingInterfaceKeyboard.Button_Left;
        const settingNameB = SettingInterfaceKeyboard.Alt_Button_Right;
        const settingNameC = SettingInterfaceKeyboard.Button_Up;

        expect(config.currentKeys[SettingInterfaceKeyboard.Button_Left].key).toEqual("KEY_ARROW_LEFT");
        expect(config.currentKeys[SettingInterfaceKeyboard.Button_Left].action).toEqual(Button.LEFT);
        expect(config.currentKeys[SettingInterfaceKeyboard.Button_Left].icon).toEqual("T_Left_Key_Dark.png");

        expect(config.currentKeys[SettingInterfaceKeyboard.Alt_Button_Right].key).toEqual("KEY_D");
        expect(config.currentKeys[SettingInterfaceKeyboard.Alt_Button_Right].action).toEqual(Button.RIGHT);
        expect(config.currentKeys[SettingInterfaceKeyboard.Alt_Button_Right].icon).toEqual("T_D_Key_Dark.png");

        expect(config.currentKeys[SettingInterfaceKeyboard.Button_Up].key).toEqual("KEY_ARROW_UP");
        expect(config.currentKeys[SettingInterfaceKeyboard.Button_Up].action).toEqual(Button.UP);
        expect(config.currentKeys[SettingInterfaceKeyboard.Button_Up].icon).toEqual("T_Up_Key_Dark.png");

        swapCurrentKeys(config, SettingInterfaceKeyboard.Button_Left, Phaser.Input.Keyboard.KeyCodes.D);

        expect(config.currentKeys[SettingInterfaceKeyboard.Button_Left].key).toEqual("KEY_ARROW_LEFT");
        expect(config.currentKeys[SettingInterfaceKeyboard.Button_Left].action).toEqual(Button.RIGHT);
        expect(config.currentKeys[SettingInterfaceKeyboard.Button_Left].icon).toEqual("T_D_Key_Dark.png");

        expect(config.currentKeys[SettingInterfaceKeyboard.Alt_Button_Left].key).toEqual("KEY_Q");
        expect(config.currentKeys[SettingInterfaceKeyboard.Alt_Button_Left].action).toEqual(Button.LEFT);
        expect(config.currentKeys[SettingInterfaceKeyboard.Alt_Button_Left].icon).toEqual("T_Q_Key_Dark.png");

        expect(config.currentKeys[SettingInterfaceKeyboard.Button_Right].key).toEqual("KEY_ARROW_RIGHT");
        expect(config.currentKeys[SettingInterfaceKeyboard.Button_Right].action).toEqual(Button.RIGHT);
        expect(config.currentKeys[SettingInterfaceKeyboard.Button_Right].icon).toEqual("T_Right_Key_Dark.png");

        expect(config.currentKeys[SettingInterfaceKeyboard.Alt_Button_Right].key).toEqual("KEY_D");
        expect(config.currentKeys[SettingInterfaceKeyboard.Alt_Button_Right].action).toEqual(Button.LEFT);
        expect(config.currentKeys[SettingInterfaceKeyboard.Alt_Button_Right].icon).toEqual("T_Left_Key_Dark.png");

        expect(config.currentKeys[SettingInterfaceKeyboard.Button_Up].key).toEqual("KEY_ARROW_UP");
        expect(config.currentKeys[SettingInterfaceKeyboard.Button_Up].action).toEqual(Button.UP);
        expect(config.currentKeys[SettingInterfaceKeyboard.Button_Up].icon).toEqual("T_Up_Key_Dark.png");

        swapCurrentKeys(config, SettingInterfaceKeyboard.Button_Up, Phaser.Input.Keyboard.KeyCodes.LEFT);

        expect(config.currentKeys[SettingInterfaceKeyboard.Button_Left].key).toEqual("KEY_ARROW_LEFT");
        expect(config.currentKeys[SettingInterfaceKeyboard.Button_Left].action).toEqual(Button.UP);
        expect(config.currentKeys[SettingInterfaceKeyboard.Button_Left].icon).toEqual("T_Up_Key_Dark.png");

        expect(config.currentKeys[SettingInterfaceKeyboard.Alt_Button_Left].key).toEqual("KEY_Q");
        expect(config.currentKeys[SettingInterfaceKeyboard.Alt_Button_Left].action).toEqual(Button.LEFT);
        expect(config.currentKeys[SettingInterfaceKeyboard.Alt_Button_Left].icon).toEqual("T_Q_Key_Dark.png");

        expect(config.currentKeys[SettingInterfaceKeyboard.Button_Right].key).toEqual("KEY_ARROW_RIGHT");
        expect(config.currentKeys[SettingInterfaceKeyboard.Button_Right].action).toEqual(Button.RIGHT);
        expect(config.currentKeys[SettingInterfaceKeyboard.Button_Right].icon).toEqual("T_Right_Key_Dark.png");

        expect(config.currentKeys[SettingInterfaceKeyboard.Alt_Button_Right].key).toEqual("KEY_D");
        expect(config.currentKeys[SettingInterfaceKeyboard.Alt_Button_Right].action).toEqual(Button.LEFT);
        expect(config.currentKeys[SettingInterfaceKeyboard.Alt_Button_Right].icon).toEqual("T_Left_Key_Dark.png");

        expect(config.currentKeys[SettingInterfaceKeyboard.Button_Up].key).toEqual("KEY_ARROW_UP");
        expect(config.currentKeys[SettingInterfaceKeyboard.Button_Up].action).toEqual(Button.RIGHT);
        expect(config.currentKeys[SettingInterfaceKeyboard.Button_Up].icon).toEqual("T_D_Key_Dark.png");
    })


    it('Swap alt with a key not binded yet', () => {
        const settingNameA = SettingInterfaceKeyboard.Alt_Button_Up;

        expect(config.currentKeys[SettingInterfaceKeyboard.Alt_Button_Up].key).toEqual("KEY_Z");
        expect(config.currentKeys[SettingInterfaceKeyboard.Alt_Button_Up].action).toEqual(Button.UP);
        expect(config.currentKeys[SettingInterfaceKeyboard.Alt_Button_Up].icon).toEqual("T_Z_Key_Dark.png");

        swapCurrentKeys(config, SettingInterfaceKeyboard.Alt_Button_Up, Phaser.Input.Keyboard.KeyCodes.B);

        expect(config.currentKeys[SettingInterfaceKeyboard.Alt_Button_Up].key).toEqual("KEY_Z");
        expect(config.currentKeys[SettingInterfaceKeyboard.Alt_Button_Up].action).toEqual(Button.UP);
        expect(config.currentKeys[SettingInterfaceKeyboard.Alt_Button_Up].icon).toEqual("T_B_Key_Dark.png");

    })
});