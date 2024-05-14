import {beforeEach, expect, describe, it} from "vitest";
import cfg_keyboard_example, {SettingInterfaceKeyboard} from "#app/test/cfg_keyboard_example";
import {
    deleteBind,
    getIconWithPressedButton,
    getIconWithSettingName,
    getKeyAndActionFromCurrentKeysWithSettingName,
    getKeyForSettingName,
    getKeyFromMapping,
    getKeyWithAction, regenerateCustom,
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
        config.ogIcons = {...config.icons}
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
        expect(config.currentKeys[SettingInterfaceKeyboard.Alt_Button_Up].key).toEqual("KEY_Z");
        expect(config.currentKeys[SettingInterfaceKeyboard.Alt_Button_Up].action).toEqual(Button.UP);
        expect(config.currentKeys[SettingInterfaceKeyboard.Alt_Button_Up].icon).toEqual("T_Z_Key_Dark.png");

        swapCurrentKeys(config, SettingInterfaceKeyboard.Alt_Button_Up, Phaser.Input.Keyboard.KeyCodes.B);

        expect(config.currentKeys[SettingInterfaceKeyboard.Alt_Button_Up].key).toEqual("KEY_Z");
        expect(config.currentKeys[SettingInterfaceKeyboard.Alt_Button_Up].action).toEqual(Button.UP);
        expect(config.currentKeys[SettingInterfaceKeyboard.Alt_Button_Up].icon).toEqual("T_B_Key_Dark.png");
    })


    it('Delete bind', () => {
        const settingNameA = SettingInterfaceKeyboard.Alt_Button_Up;

        expect(config.currentKeys[SettingInterfaceKeyboard.Alt_Button_Up].key).toEqual("KEY_Z");
        expect(config.currentKeys[SettingInterfaceKeyboard.Alt_Button_Up].action).toEqual(Button.UP);
        expect(config.currentKeys[SettingInterfaceKeyboard.Alt_Button_Up].icon).toEqual("T_Z_Key_Dark.png");
        deleteBind(config, settingNameA)

        expect(config.currentKeys[SettingInterfaceKeyboard.Alt_Button_Up].key).toEqual("KEY_Z");
        expect(config.currentKeys[SettingInterfaceKeyboard.Alt_Button_Up].action).toEqual(-1);
        expect(config.currentKeys[SettingInterfaceKeyboard.Alt_Button_Up].icon).toEqual(undefined);
    })


    it('Delete bind then asign not existing button', () => {
        const settingNameA = SettingInterfaceKeyboard.Alt_Button_Up;

        expect(config.currentKeys[SettingInterfaceKeyboard.Alt_Button_Up].key).toEqual("KEY_Z");
        expect(config.currentKeys[SettingInterfaceKeyboard.Alt_Button_Up].action).toEqual(Button.UP);
        expect(config.currentKeys[SettingInterfaceKeyboard.Alt_Button_Up].icon).toEqual("T_Z_Key_Dark.png");
        expect(config.custom["KEY_Z"]).toEqual(Button.UP);
        deleteBind(config, settingNameA)

        expect(config.currentKeys[SettingInterfaceKeyboard.Alt_Button_Up].key).toEqual("KEY_Z");
        expect(config.currentKeys[SettingInterfaceKeyboard.Alt_Button_Up].action).toEqual(-1);
        expect(config.currentKeys[SettingInterfaceKeyboard.Alt_Button_Up].icon).toEqual(undefined);
        expect(config.custom["KEY_Z"]).toEqual(-1);

        swapCurrentKeys(config, SettingInterfaceKeyboard.Alt_Button_Up, Phaser.Input.Keyboard.KeyCodes.B);

        expect(config.currentKeys[SettingInterfaceKeyboard.Alt_Button_Up].key).toEqual("KEY_Z");
        expect(config.currentKeys[SettingInterfaceKeyboard.Alt_Button_Up].action).toEqual(Button.UP);
        expect(config.currentKeys[SettingInterfaceKeyboard.Alt_Button_Up].icon).toEqual("T_B_Key_Dark.png");
        expect(config.custom["KEY_B"]).toEqual(Button.UP);
        expect(config.custom["KEY_Z"]).toEqual(-1);
    })


    it('swap bind, then Delete bind then assign bind', () => {
        const settingNameA = SettingInterfaceKeyboard.Alt_Button_Up;

        expect(config.currentKeys[SettingInterfaceKeyboard.Alt_Button_Up].key).toEqual("KEY_Z");
        expect(config.currentKeys[SettingInterfaceKeyboard.Alt_Button_Up].action).toEqual(Button.UP);
        expect(config.currentKeys[SettingInterfaceKeyboard.Alt_Button_Up].icon).toEqual("T_Z_Key_Dark.png");
        expect(config.custom["KEY_Z"]).toEqual(Button.UP);
        expect(config.custom["KEY_B"]).toEqual(-1);

        swapCurrentKeys(config, SettingInterfaceKeyboard.Alt_Button_Up, Phaser.Input.Keyboard.KeyCodes.B);

        expect(config.currentKeys[SettingInterfaceKeyboard.Alt_Button_Up].key).toEqual("KEY_Z");
        expect(config.currentKeys[SettingInterfaceKeyboard.Alt_Button_Up].action).toEqual(Button.UP);
        expect(config.currentKeys[SettingInterfaceKeyboard.Alt_Button_Up].icon).toEqual("T_B_Key_Dark.png");
        expect(config.custom["KEY_B"]).toEqual(Button.UP);
        expect(config.custom["KEY_Z"]).toEqual(-1);

        deleteBind(config, settingNameA);

        expect(config.currentKeys[SettingInterfaceKeyboard.Alt_Button_Up].key).toEqual("KEY_Z");
        expect(config.currentKeys[SettingInterfaceKeyboard.Alt_Button_Up].action).toEqual(-1);
        expect(config.currentKeys[SettingInterfaceKeyboard.Alt_Button_Up].icon).toEqual(undefined);
        expect(config.custom["KEY_Z"]).toEqual(-1);
        expect(config.custom["KEY_B"]).toEqual(-1);

        swapCurrentKeys(config, SettingInterfaceKeyboard.Alt_Button_Up, Phaser.Input.Keyboard.KeyCodes.B);

        expect(config.currentKeys[SettingInterfaceKeyboard.Alt_Button_Up].key).toEqual("KEY_Z");
        expect(config.currentKeys[SettingInterfaceKeyboard.Alt_Button_Up].action).toEqual(Button.UP);
        expect(config.currentKeys[SettingInterfaceKeyboard.Alt_Button_Up].icon).toEqual("T_B_Key_Dark.png");
        expect(config.custom["KEY_B"]).toEqual(Button.UP);
        expect(config.custom["KEY_Z"]).toEqual(-1);
    })


    it('Delete bind then asign not already existing button', () => {
        const settingNameA = SettingInterfaceKeyboard.Alt_Button_Up;

        expect(config.currentKeys[SettingInterfaceKeyboard.Alt_Button_Up].key).toEqual("KEY_Z");
        expect(config.currentKeys[SettingInterfaceKeyboard.Alt_Button_Up].action).toEqual(Button.UP);
        expect(config.currentKeys[SettingInterfaceKeyboard.Alt_Button_Up].icon).toEqual("T_Z_Key_Dark.png");
        expect(config.custom["KEY_Z"]).toEqual(Button.UP);
        deleteBind(config, settingNameA)

        expect(config.currentKeys[SettingInterfaceKeyboard.Alt_Button_Up].key).toEqual("KEY_Z");
        expect(config.currentKeys[SettingInterfaceKeyboard.Alt_Button_Up].action).toEqual(-1);
        expect(config.currentKeys[SettingInterfaceKeyboard.Alt_Button_Up].icon).toEqual(undefined);

        expect(config.currentKeys[SettingInterfaceKeyboard.Alt_Button_Cycle_Ability].key).toEqual("KEY_L");
        expect(config.currentKeys[SettingInterfaceKeyboard.Alt_Button_Cycle_Ability].action).toEqual(Button.CYCLE_ABILITY);
        expect(config.currentKeys[SettingInterfaceKeyboard.Alt_Button_Cycle_Ability].icon).toEqual("T_L_Key_Dark.png");
        expect(config.custom["KEY_Z"]).toEqual(-1);
        expect(config.custom["KEY_L"]).toEqual(Button.CYCLE_ABILITY);

        swapCurrentKeys(config, SettingInterfaceKeyboard.Alt_Button_Up, Phaser.Input.Keyboard.KeyCodes.L);

        expect(config.currentKeys[SettingInterfaceKeyboard.Alt_Button_Up].key).toEqual("KEY_Z");
        expect(config.currentKeys[SettingInterfaceKeyboard.Alt_Button_Up].action).toEqual(Button.UP);
        expect(config.currentKeys[SettingInterfaceKeyboard.Alt_Button_Up].icon).toEqual("T_L_Key_Dark.png");

        expect(config.currentKeys[SettingInterfaceKeyboard.Alt_Button_Cycle_Ability].key).toEqual("KEY_L");
        expect(config.currentKeys[SettingInterfaceKeyboard.Alt_Button_Cycle_Ability].action).toEqual(-1);
        expect(config.currentKeys[SettingInterfaceKeyboard.Alt_Button_Cycle_Ability].icon).toEqual(undefined);

        expect(config.custom["KEY_Z"]).toEqual(-1);
        expect(config.custom["KEY_L"]).toEqual(Button.UP);
    })


    it('Custom scenario 2, regenerate customs when init key is not from setting', () => {
        expect(config.currentKeys[SettingInterfaceKeyboard.Alt_Button_Up].key).toEqual("KEY_Z");
        expect(config.currentKeys[SettingInterfaceKeyboard.Alt_Button_Up].action).toEqual(Button.UP);
        expect(config.currentKeys[SettingInterfaceKeyboard.Alt_Button_Up].icon).toEqual("T_Z_Key_Dark.png");
        expect(config.custom["KEY_Z"]).toEqual(Button.UP);
        expect(config.custom["KEY_T"]).toEqual(-1);

        swapCurrentKeys(config, SettingInterfaceKeyboard.Alt_Button_Up, Phaser.Input.Keyboard.KeyCodes.T);

        expect(config.currentKeys[SettingInterfaceKeyboard.Alt_Button_Up].key).toEqual("KEY_Z");
        expect(config.currentKeys[SettingInterfaceKeyboard.Alt_Button_Up].action).toEqual(Button.UP);
        expect(config.currentKeys[SettingInterfaceKeyboard.Alt_Button_Up].icon).toEqual("T_T_Key_Dark.png");

        expect(config.custom["KEY_Z"]).toEqual(-1);
        expect(config.custom["KEY_T"]).toEqual(Button.UP);
    })


    it('change alt to unknown touch than another one alt with another unknown touch', () => {
        expect(config.currentKeys[SettingInterfaceKeyboard.Alt_Button_Up].key).toEqual("KEY_Z");
        expect(config.currentKeys[SettingInterfaceKeyboard.Alt_Button_Up].action).toEqual(Button.UP);
        expect(config.currentKeys[SettingInterfaceKeyboard.Alt_Button_Up].icon).toEqual("T_Z_Key_Dark.png");
        expect(config.custom["KEY_Z"]).toEqual(Button.UP);

        swapCurrentKeys(config, SettingInterfaceKeyboard.Alt_Button_Up, Phaser.Input.Keyboard.KeyCodes.T);

        expect(config.currentKeys[SettingInterfaceKeyboard.Alt_Button_Up].key).toEqual("KEY_Z");
        expect(config.currentKeys[SettingInterfaceKeyboard.Alt_Button_Up].action).toEqual(Button.UP);
        expect(config.currentKeys[SettingInterfaceKeyboard.Alt_Button_Up].icon).toEqual("T_T_Key_Dark.png");

        expect(config.custom["KEY_Z"]).toEqual(-1);
        expect(config.custom["KEY_T"]).toEqual(Button.UP);


        expect(config.currentKeys[SettingInterfaceKeyboard.Alt_Button_Down].key).toEqual("KEY_S");
        expect(config.currentKeys[SettingInterfaceKeyboard.Alt_Button_Down].action).toEqual(Button.DOWN);
        expect(config.currentKeys[SettingInterfaceKeyboard.Alt_Button_Down].icon).toEqual("T_S_Key_Dark.png");

        swapCurrentKeys(config, SettingInterfaceKeyboard.Alt_Button_Down, Phaser.Input.Keyboard.KeyCodes.U);
        expect(config.currentKeys[SettingInterfaceKeyboard.Alt_Button_Down].key).toEqual("KEY_S");
        expect(config.currentKeys[SettingInterfaceKeyboard.Alt_Button_Down].action).toEqual(Button.DOWN);
        expect(config.currentKeys[SettingInterfaceKeyboard.Alt_Button_Down].icon).toEqual("T_U_Key_Dark.png");


        expect(config.custom["KEY_S"]).toEqual(-1);
        expect(config.custom["KEY_U"]).toEqual(Button.DOWN);
        expect(config.custom["KEY_Z"]).toEqual(-1);
        expect(config.custom["KEY_T"]).toEqual(Button.UP);

        expect(config.currentKeys[SettingInterfaceKeyboard.Alt_Button_Up].key).toEqual("KEY_Z");
        expect(config.currentKeys[SettingInterfaceKeyboard.Alt_Button_Up].action).toEqual(Button.UP);
        expect(config.currentKeys[SettingInterfaceKeyboard.Alt_Button_Up].icon).toEqual("T_T_Key_Dark.png");
    })


    it('reload scenario with 1 bind already reassigned', () => {
        config.currentKeys[SettingInterfaceKeyboard.Alt_Button_Up] = {
          "key": "KEY_Z",
          "isAlt": true,
          "action": 3,
          "icon": "T_D_Key_Dark.png",
          "from": {
            "key": "KEY_Z",
            "isAlt": true,
            "action": 0,
            "icon": "T_Z_Key_Dark.png"
          }
        };
        config.currentKeys[SettingInterfaceKeyboard.Alt_Button_Right] = {
          "key": "KEY_D",
          "isAlt": true,
          "action": 0,
          "icon": "T_Z_Key_Dark.png",
          "from": {
            "key": "KEY_D",
            "isAlt": true,
            "action": 3,
            "icon": "T_D_Key_Dark.png"
          }
        }
        config.icons["KEY_D"] = "T_Z_Key_Dark.png";
        config.icons["KEY_Z"] = "T_D_Key_Dark.png";
        regenerateCustom(config);

        expect(config.currentKeys[SettingInterfaceKeyboard.Alt_Button_Up].key).toEqual("KEY_Z");
        expect(config.currentKeys[SettingInterfaceKeyboard.Alt_Button_Up].action).toEqual(Button.RIGHT);
        expect(config.currentKeys[SettingInterfaceKeyboard.Alt_Button_Up].icon).toEqual("T_D_Key_Dark.png");
        expect(config.custom["KEY_Z"]).toEqual(Button.RIGHT);

        expect(config.currentKeys[SettingInterfaceKeyboard.Alt_Button_Right].key).toEqual("KEY_D");
        expect(config.currentKeys[SettingInterfaceKeyboard.Alt_Button_Right].action).toEqual(Button.UP);
        expect(config.currentKeys[SettingInterfaceKeyboard.Alt_Button_Right].icon).toEqual("T_Z_Key_Dark.png");
        expect(config.custom["KEY_D"]).toEqual(Button.UP);

        expect(config.currentKeys[SettingInterfaceKeyboard.Button_Up].key).toEqual("KEY_ARROW_UP");
        expect(config.currentKeys[SettingInterfaceKeyboard.Button_Up].action).toEqual(Button.UP);
        expect(config.currentKeys[SettingInterfaceKeyboard.Button_Up].icon).toEqual("T_Up_Key_Dark.png");
        expect(config.custom["KEY_ARROW_UP"]).toEqual(Button.UP);

        swapCurrentKeys(config, SettingInterfaceKeyboard.Button_Up, Phaser.Input.Keyboard.KeyCodes.RIGHT);

        expect(config.currentKeys[SettingInterfaceKeyboard.Alt_Button_Up].key).toEqual("KEY_Z");
        expect(config.currentKeys[SettingInterfaceKeyboard.Alt_Button_Up].action).toEqual(Button.RIGHT);
        expect(config.currentKeys[SettingInterfaceKeyboard.Alt_Button_Up].icon).toEqual("T_D_Key_Dark.png");
        expect(config.custom["KEY_Z"]).toEqual(Button.RIGHT);

        expect(config.currentKeys[SettingInterfaceKeyboard.Alt_Button_Right].key).toEqual("KEY_D");
        expect(config.currentKeys[SettingInterfaceKeyboard.Alt_Button_Right].action).toEqual(Button.UP);
        expect(config.currentKeys[SettingInterfaceKeyboard.Alt_Button_Right].icon).toEqual("T_Z_Key_Dark.png");
        expect(config.custom["KEY_D"]).toEqual(Button.UP);

        expect(config.currentKeys[SettingInterfaceKeyboard.Button_Up].key).toEqual("KEY_ARROW_UP");
        expect(config.currentKeys[SettingInterfaceKeyboard.Button_Up].action).toEqual(Button.RIGHT);
        expect(config.currentKeys[SettingInterfaceKeyboard.Button_Up].icon).toEqual("T_Right_Key_Dark.png");
        expect(config.custom["KEY_ARROW_UP"]).toEqual(Button.RIGHT);

        expect(config.currentKeys[SettingInterfaceKeyboard.Button_Right].key).toEqual("KEY_ARROW_RIGHT");
        expect(config.currentKeys[SettingInterfaceKeyboard.Button_Right].action).toEqual(Button.UP);
        expect(config.currentKeys[SettingInterfaceKeyboard.Button_Right].icon).toEqual("T_Up_Key_Dark.png");
        expect(config.custom["KEY_ARROW_RIGHT"]).toEqual(Button.UP);
    });


    it('Swap multiple touch alt and main', () => {
        expect(config.currentKeys[SettingInterfaceKeyboard.Button_Up].key).toEqual("KEY_ARROW_UP");
        expect(config.currentKeys[SettingInterfaceKeyboard.Button_Up].action).toEqual(Button.UP);
        expect(config.currentKeys[SettingInterfaceKeyboard.Button_Up].icon).toEqual("T_Up_Key_Dark.png");
        expect(config.custom["KEY_ARROW_UP"]).toEqual(Button.UP);

        expect(config.currentKeys[SettingInterfaceKeyboard.Alt_Button_Up].key).toEqual("KEY_Z");
        expect(config.currentKeys[SettingInterfaceKeyboard.Alt_Button_Up].action).toEqual(Button.UP);
        expect(config.currentKeys[SettingInterfaceKeyboard.Alt_Button_Up].icon).toEqual("T_Z_Key_Dark.png");
        expect(config.custom["KEY_Z"]).toEqual(Button.UP);

        expect(config.currentKeys[SettingInterfaceKeyboard.Button_Right].key).toEqual("KEY_ARROW_RIGHT");
        expect(config.currentKeys[SettingInterfaceKeyboard.Button_Right].action).toEqual(Button.RIGHT);
        expect(config.currentKeys[SettingInterfaceKeyboard.Button_Right].icon).toEqual("T_Right_Key_Dark.png");
        expect(config.custom["KEY_ARROW_RIGHT"]).toEqual(Button.RIGHT);

        swapCurrentKeys(config, SettingInterfaceKeyboard.Button_Up, Phaser.Input.Keyboard.KeyCodes.RIGHT);

        expect(config.currentKeys[SettingInterfaceKeyboard.Button_Up].key).toEqual("KEY_ARROW_UP");
        expect(config.currentKeys[SettingInterfaceKeyboard.Button_Up].action).toEqual(Button.RIGHT);
        expect(config.currentKeys[SettingInterfaceKeyboard.Button_Up].icon).toEqual("T_Right_Key_Dark.png");
        expect(config.custom["KEY_ARROW_UP"]).toEqual(Button.RIGHT);

        expect(config.currentKeys[SettingInterfaceKeyboard.Alt_Button_Up].key).toEqual("KEY_Z");
        expect(config.currentKeys[SettingInterfaceKeyboard.Alt_Button_Up].action).toEqual(Button.UP);
        expect(config.currentKeys[SettingInterfaceKeyboard.Alt_Button_Up].icon).toEqual("T_Z_Key_Dark.png");
        expect(config.custom["KEY_Z"]).toEqual(Button.UP);

        expect(config.currentKeys[SettingInterfaceKeyboard.Button_Right].key).toEqual("KEY_ARROW_RIGHT");
        expect(config.currentKeys[SettingInterfaceKeyboard.Button_Right].action).toEqual(Button.UP);
        expect(config.currentKeys[SettingInterfaceKeyboard.Button_Right].icon).toEqual("T_Up_Key_Dark.png");
        expect(config.custom["KEY_ARROW_RIGHT"]).toEqual(Button.UP);

        swapCurrentKeys(config, SettingInterfaceKeyboard.Alt_Button_Up, Phaser.Input.Keyboard.KeyCodes.D);

        expect(config.currentKeys[SettingInterfaceKeyboard.Button_Up].key).toEqual("KEY_ARROW_UP");
        expect(config.currentKeys[SettingInterfaceKeyboard.Button_Up].action).toEqual(Button.RIGHT);
        expect(config.currentKeys[SettingInterfaceKeyboard.Button_Up].icon).toEqual("T_Right_Key_Dark.png");
        expect(config.custom["KEY_ARROW_UP"]).toEqual(Button.RIGHT);

        expect(config.currentKeys[SettingInterfaceKeyboard.Alt_Button_Up].key).toEqual("KEY_Z");
        expect(config.currentKeys[SettingInterfaceKeyboard.Alt_Button_Up].action).toEqual(Button.RIGHT);
        expect(config.currentKeys[SettingInterfaceKeyboard.Alt_Button_Up].icon).toEqual("T_D_Key_Dark.png");
        expect(config.custom["KEY_Z"]).toEqual(Button.RIGHT);

        expect(config.currentKeys[SettingInterfaceKeyboard.Button_Right].key).toEqual("KEY_ARROW_RIGHT");
        expect(config.currentKeys[SettingInterfaceKeyboard.Button_Right].action).toEqual(Button.UP);
        expect(config.currentKeys[SettingInterfaceKeyboard.Button_Right].icon).toEqual("T_Up_Key_Dark.png");
        expect(config.custom["KEY_ARROW_RIGHT"]).toEqual(Button.UP);

        expect(config.currentKeys[SettingInterfaceKeyboard.Alt_Button_Right].key).toEqual("KEY_D");
        expect(config.currentKeys[SettingInterfaceKeyboard.Alt_Button_Right].action).toEqual(Button.UP);
        expect(config.currentKeys[SettingInterfaceKeyboard.Alt_Button_Right].icon).toEqual("T_Z_Key_Dark.png");
        expect(config.custom["KEY_D"]).toEqual(Button.UP);

        swapCurrentKeys(config, SettingInterfaceKeyboard.Alt_Button_Up, Phaser.Input.Keyboard.KeyCodes.Z);

        expect(config.currentKeys[SettingInterfaceKeyboard.Button_Up].key).toEqual("KEY_ARROW_UP");
        expect(config.currentKeys[SettingInterfaceKeyboard.Button_Up].action).toEqual(Button.RIGHT);
        expect(config.currentKeys[SettingInterfaceKeyboard.Button_Up].icon).toEqual("T_Right_Key_Dark.png");
        expect(config.custom["KEY_ARROW_UP"]).toEqual(Button.RIGHT);

        expect(config.currentKeys[SettingInterfaceKeyboard.Alt_Button_Up].key).toEqual("KEY_Z");
        expect(config.currentKeys[SettingInterfaceKeyboard.Alt_Button_Up].action).toEqual(Button.UP);
        expect(config.currentKeys[SettingInterfaceKeyboard.Alt_Button_Up].icon).toEqual("T_Z_Key_Dark.png");
        expect(config.custom["KEY_Z"]).toEqual(Button.UP);

        expect(config.currentKeys[SettingInterfaceKeyboard.Button_Right].key).toEqual("KEY_ARROW_RIGHT");
        expect(config.currentKeys[SettingInterfaceKeyboard.Button_Right].action).toEqual(Button.UP);
        expect(config.currentKeys[SettingInterfaceKeyboard.Button_Right].icon).toEqual("T_Up_Key_Dark.png");
        expect(config.custom["KEY_ARROW_RIGHT"]).toEqual(Button.UP);

        expect(config.currentKeys[SettingInterfaceKeyboard.Alt_Button_Right].key).toEqual("KEY_D");
        expect(config.currentKeys[SettingInterfaceKeyboard.Alt_Button_Right].action).toEqual(Button.RIGHT);
        expect(config.currentKeys[SettingInterfaceKeyboard.Alt_Button_Right].icon).toEqual("T_D_Key_Dark.png");
        expect(config.custom["KEY_D"]).toEqual(Button.RIGHT);
    })

    it('by method: Delete 2 binds, than rebind one of them', () => {

        expect(config.currentKeys[SettingInterfaceKeyboard.Alt_Button_Up].key).toEqual("KEY_Z");
        expect(config.currentKeys[SettingInterfaceKeyboard.Alt_Button_Up].action).toEqual(Button.UP);
        expect(config.currentKeys[SettingInterfaceKeyboard.Alt_Button_Up].icon).toEqual("T_Z_Key_Dark.png");
        expect(config.custom["KEY_Z"]).toEqual(Button.UP);
        deleteBind(config, SettingInterfaceKeyboard.Alt_Button_Up);
        expect(config.currentKeys[SettingInterfaceKeyboard.Alt_Button_Up].key).toEqual("KEY_Z");
        expect(config.currentKeys[SettingInterfaceKeyboard.Alt_Button_Up].action).toEqual(-1);
        expect(config.currentKeys[SettingInterfaceKeyboard.Alt_Button_Up].icon).toEqual(undefined);
        expect(config.custom["KEY_Z"]).toEqual(-1);



        expect(config.currentKeys[SettingInterfaceKeyboard.Alt_Button_Down].key).toEqual("KEY_S");
        expect(config.currentKeys[SettingInterfaceKeyboard.Alt_Button_Down].action).toEqual(Button.DOWN);
        expect(config.currentKeys[SettingInterfaceKeyboard.Alt_Button_Down].icon).toEqual("T_S_Key_Dark.png");
        expect(config.custom["KEY_S"]).toEqual(Button.DOWN);
        deleteBind(config, SettingInterfaceKeyboard.Alt_Button_Down);
        expect(config.currentKeys[SettingInterfaceKeyboard.Alt_Button_Down].key).toEqual("KEY_S");
        expect(config.currentKeys[SettingInterfaceKeyboard.Alt_Button_Down].action).toEqual(-1);
        expect(config.currentKeys[SettingInterfaceKeyboard.Alt_Button_Down].icon).toEqual(undefined);
        expect(config.custom["KEY_S"]).toEqual(-1);


        swapCurrentKeys(config, SettingInterfaceKeyboard.Alt_Button_Up, Phaser.Input.Keyboard.KeyCodes.Z);
        expect(config.currentKeys[SettingInterfaceKeyboard.Alt_Button_Up].key).toEqual("KEY_Z");
        expect(config.currentKeys[SettingInterfaceKeyboard.Alt_Button_Up].action).toEqual(Button.UP);
        expect(config.currentKeys[SettingInterfaceKeyboard.Alt_Button_Up].icon).toEqual("T_Z_Key_Dark.png");
        expect(config.custom["KEY_Z"]).toEqual(Button.UP);

        expect(config.currentKeys[SettingInterfaceKeyboard.Alt_Button_Down].key).toEqual("KEY_S");
        expect(config.currentKeys[SettingInterfaceKeyboard.Alt_Button_Down].action).toEqual(-1);
        expect(config.currentKeys[SettingInterfaceKeyboard.Alt_Button_Down].icon).toEqual(undefined);
        expect(config.custom["KEY_S"]).toEqual(-1);

    });

});