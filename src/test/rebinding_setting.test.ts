import {afterEach, beforeEach, describe, expect, it} from "vitest";
import cfg_keyboard_azerty from "#app/test/cfg_keyboard.example";
import {SettingInterface} from "#app/test/cfg_keyboard.example";
import {Button} from "#app/enums/buttons";
import {deepCopy} from "#app/utils";
import {
    getButtonWithSettingName,
    getIconWithSettingName,
    getKeyWithKeycode,
    getKeyWithSettingName,
    getSettingNameWithKeycode,
    regenerateIdentifiers,
    swap
} from "#app/configs/configHandler";
import {MenuManip} from "#app/test/helpers/menuManip";
import {InGameManip} from "#app/test/helpers/inGameManip";


describe('Test Rebinding', () => {
    let config;
    let inGame;
    let inTheSettingMenu;
    beforeEach(() => {
        config = deepCopy(cfg_keyboard_azerty);
        config.custom = {...config.default}
        regenerateIdentifiers(config);
        inGame = new InGameManip(config);
        inTheSettingMenu = new MenuManip(config);
    });

    it('Check if config is loaded', () => {
        expect(config).not.toBeNull();
    });
    it('Check button for setting name', () => {
        const settingName = SettingInterface.Button_Left;
        const button = config.settings[settingName];
        expect(button).toEqual(Button.LEFT);
    });
    it('Check key for Keyboard KeyCode', () => {
        const key = getKeyWithKeycode(config, Phaser.Input.Keyboard.KeyCodes.LEFT);
        const settingName = config.custom[key];
        const button = config.settings[settingName];
        expect(button).toEqual(Button.LEFT);
    });
    it('Check key for currenly Assigned to action not alt', () => {
        const key = getKeyWithKeycode(config, Phaser.Input.Keyboard.KeyCodes.Q);
        const settingName = config.custom[key];
        const button = config.settings[settingName];
        expect(button).toEqual(Button.LEFT);
    });

    it('Check key for currenly Assigned to setting name', () => {
        const settingName = SettingInterface.Button_Left;
        const key = getKeyWithSettingName(config, settingName);
        expect(key).toEqual('KEY_ARROW_LEFT');
    });
    it('Check key for currenly Assigned to setting name alt', () => {
        const settingName = SettingInterface.Alt_Button_Left;
        const key = getKeyWithSettingName(config, settingName);
        expect(key).toEqual('KEY_Q');
    });
    it('Check key from key code', () => {
        const keycode = Phaser.Input.Keyboard.KeyCodes.LEFT;
        const key = getKeyWithKeycode(config, keycode);
        expect(key).toEqual('KEY_ARROW_LEFT');
    });
    it('Check icon for currenly Assigned to key code', () => {
        const keycode = Phaser.Input.Keyboard.KeyCodes.LEFT;
        const key = getKeyWithKeycode(config, keycode);
        const icon = config.icons[key];
        expect(icon).toEqual('T_Left_Key_Dark.png');
    });
    it('Check icon for currenly Assigned to key code', () => {
        const keycode = Phaser.Input.Keyboard.KeyCodes.Q;
        const key = getKeyWithKeycode(config, keycode);
        const icon = config.icons[key];
        expect(icon).toEqual('T_Q_Key_Dark.png');
    });
    it('Check icon for currenly Assigned to setting name', () => {
        const settingName = SettingInterface.Button_Left;
        const key = getKeyWithSettingName(config, settingName);
        const icon = config.icons[key];
        expect(icon).toEqual('T_Left_Key_Dark.png');
    });
    it('Check icon for currenly Assigned to setting name alt', () => {
        const settingName = SettingInterface.Alt_Button_Left;
        const key = getKeyWithSettingName(config, settingName);
        const icon = config.icons[key];
        expect(icon).toEqual('T_Q_Key_Dark.png');
    });
    it('Check if  is working', () => {
        const settingNameA = SettingInterface.Button_Left;
        const settingNameB = SettingInterface.Button_Right;
        swap(config, SettingInterface.Button_Left, Phaser.Input.Keyboard.KeyCodes.RIGHT);
        expect(getButtonWithSettingName(config, settingNameA)).toEqual(Button.LEFT);
        expect(getSettingNameWithKeycode(config, Phaser.Input.Keyboard.KeyCodes.RIGHT)).toEqual(SettingInterface.Button_Left)
        expect(getButtonWithSettingName(config, settingNameB)).toEqual(Button.RIGHT);
        expect(getSettingNameWithKeycode(config, Phaser.Input.Keyboard.KeyCodes.LEFT)).toEqual(SettingInterface.Button_Right)
        expect(getIconWithSettingName(config, settingNameA)).toEqual(config.icons.KEY_ARROW_RIGHT);
        expect(getIconWithSettingName(config, settingNameB)).toEqual(config.icons.KEY_ARROW_LEFT);
    });

    it('Check if double swap is working', () => {
        inGame.whenWePressOnKeyboard("LEFT").weShouldTriggerTheButton("Button_Left");
        inGame.whenWePressOnKeyboard("RIGHT").weShouldTriggerTheButton("Button_Right");
        inGame.whenWePressOnKeyboard("UP").weShouldTriggerTheButton("Button_Up");

        inTheSettingMenu.whenCursorIsOnSetting("Button_Left").iconDisplayedIs("KEY_ARROW_LEFT").weWantThisBindInstead("RIGHT").confirm();

        inGame.whenWePressOnKeyboard("LEFT").weShouldTriggerTheButton("Button_Right");
        inGame.whenWePressOnKeyboard("RIGHT").weShouldTriggerTheButton("Button_Left");
        inGame.whenWePressOnKeyboard("UP").weShouldTriggerTheButton("Button_Up");

        inTheSettingMenu.whenCursorIsOnSetting("Button_Left").iconDisplayedIs("KEY_ARROW_RIGHT").weWantThisBindInstead("UP").confirm();

        inGame.whenWePressOnKeyboard("LEFT").weShouldTriggerTheButton("Button_Right");
        inGame.whenWePressOnKeyboard("RIGHT").weShouldTriggerTheButton("Button_Up");
        inGame.whenWePressOnKeyboard("UP").weShouldTriggerTheButton("Button_Left");

        inTheSettingMenu.whenCursorIsOnSetting("Button_Left").iconDisplayedIs("KEY_ARROW_UP").weWantThisBindInstead("RIGHT").confirm();

        inGame.whenWePressOnKeyboard("LEFT").weShouldTriggerTheButton("Button_Right");
        inGame.whenWePressOnKeyboard("RIGHT").weShouldTriggerTheButton("Button_Left");
        inGame.whenWePressOnKeyboard("UP").weShouldTriggerTheButton("Button_Up");
    });

    it('Check if triple swap is working', () => {
        inTheSettingMenu.whenCursorIsOnSetting("Button_Left").iconDisplayedIs("KEY_ARROW_LEFT").weWantThisBindInstead("RIGHT").confirm();

        inGame.whenWePressOnKeyboard("LEFT").weShouldTriggerTheButton("Button_Right");
        inGame.whenWePressOnKeyboard("RIGHT").weShouldTriggerTheButton("Button_Left");
        inGame.whenWePressOnKeyboard("UP").weShouldTriggerTheButton("Button_Up");

        inTheSettingMenu.whenCursorIsOnSetting("Button_Right").iconDisplayedIs("KEY_ARROW_LEFT").weWantThisBindInstead("UP").confirm();
        inGame.whenWePressOnKeyboard("LEFT").weShouldTriggerTheButton("Button_Up");
        inGame.whenWePressOnKeyboard("RIGHT").weShouldTriggerTheButton("Button_Left");
        inGame.whenWePressOnKeyboard("UP").weShouldTriggerTheButton("Button_Right");

        inTheSettingMenu.whenCursorIsOnSetting("Button_Left").iconDisplayedIs("KEY_ARROW_RIGHT").weWantThisBindInstead("LEFT").confirm();
        inGame.whenWePressOnKeyboard("LEFT").weShouldTriggerTheButton("Button_Left");
        inGame.whenWePressOnKeyboard("RIGHT").weShouldTriggerTheButton("Button_Up");
        inGame.whenWePressOnKeyboard("UP").weShouldTriggerTheButton("Button_Right");
    });

    it('Swap alt with another main', () => {
        inGame.whenWePressOnKeyboard("D").weShouldTriggerTheButton("Alt_Button_Right");
        inGame.whenWePressOnKeyboard("LEFT").weShouldTriggerTheButton("Button_Left");
        inGame.whenWePressOnKeyboard("Q").weShouldTriggerTheButton("Alt_Button_Left");
        inTheSettingMenu.whenCursorIsOnSetting("Button_Left").iconDisplayedIs("KEY_ARROW_LEFT").weWantThisBindInstead("D").OopsSpecialCaseIcon("KEY_Q").confirm();
        inGame.whenWePressOnKeyboard("D").weShouldTriggerTheButton("Alt_Button_Left");
        inGame.whenWePressOnKeyboard("LEFT").weShouldTriggerTheButton("Button_Left");
        inGame.whenWePressOnKeyboard("Q").weShouldTriggerTheButton("Alt_Button_Right");
    });

    it('multiple Swap alt with another main', () => {
        inGame.whenWePressOnKeyboard("D").weShouldTriggerTheButton("Alt_Button_Right");
        inGame.whenWePressOnKeyboard("LEFT").weShouldTriggerTheButton("Button_Left");
        inGame.whenWePressOnKeyboard("LEFT").weShouldTriggerTheButton("Button_Left");
        inGame.whenWePressOnKeyboard("UP").weShouldTriggerTheButton("Button_Up");
        inTheSettingMenu.whenCursorIsOnSetting("Button_Left").iconDisplayedIs("KEY_ARROW_LEFT").weWantThisBindInstead("D").OopsSpecialCaseIcon("KEY_Q").confirm();
        inGame.whenWePressOnKeyboard("D").weShouldTriggerTheButton("Alt_Button_Left");
        inGame.whenWePressOnKeyboard("LEFT").weShouldTriggerTheButton("Button_Left");
        inGame.whenWePressOnKeyboard("Q").weShouldTriggerTheButton("Alt_Button_Right");
        inGame.whenWePressOnKeyboard("UP").weShouldTriggerTheButton("Button_Up");
        inTheSettingMenu.whenCursorIsOnSetting("Button_Up").iconDisplayedIs("KEY_ARROW_UP").weWantThisBindInstead("LEFT").confirm();
        inGame.whenWePressOnKeyboard("D").weShouldTriggerTheButton("Alt_Button_Left");
        inGame.whenWePressOnKeyboard("LEFT").weShouldTriggerTheButton("Button_Up");
        inGame.whenWePressOnKeyboard("Q").weShouldTriggerTheButton("Alt_Button_Right");
        inGame.whenWePressOnKeyboard("UP").weShouldTriggerTheButton("Button_Left");
    });

    it('Swap alt with a key not binded yet', () => {
        inGame.whenWePressOnKeyboard("Z").weShouldTriggerTheButton("Alt_Button_Up");
        inGame.whenWePressOnKeyboard("B").nothingShouldHappen();
        inTheSettingMenu.whenCursorIsOnSetting("Alt_Button_Up").iconDisplayedIs("KEY_Z").weWantThisBindInstead("B").confirm();
        inGame.whenWePressOnKeyboard("Z").nothingShouldHappen();
        inGame.whenWePressOnKeyboard("B").weShouldTriggerTheButton("Alt_Button_Up");

    });

    it('Delete bind', () => {
        inGame.whenWePressOnKeyboard("LEFT").weShouldTriggerTheButton("Button_Left");
        inTheSettingMenu.whenWeDelete("Button_Left").thereShouldBeNoIconAnymore();
        inGame.whenWePressOnKeyboard("LEFT").nothingShouldHappen();
    });

    it('Delete bind then assign a not yet binded button', () => {
        inGame.whenWePressOnKeyboard("LEFT").weShouldTriggerTheButton("Button_Left");
        inGame.whenWePressOnKeyboard("Q").weShouldTriggerTheButton("Alt_Button_Left");
        inGame.whenWePressOnKeyboard("B").nothingShouldHappen();
        inTheSettingMenu.whenWeDelete("Button_Left").thereShouldBeNoIconAnymore();
        inGame.whenWePressOnKeyboard("LEFT").nothingShouldHappen();
        inGame.whenWePressOnKeyboard("Q").weShouldTriggerTheButton("Alt_Button_Left");
        inGame.whenWePressOnKeyboard("B").nothingShouldHappen();

        inTheSettingMenu.whenCursorIsOnSetting("Button_Left").thereShouldBeNoIcon().weWantThisBindInstead("B").confirm();
        inGame.whenWePressOnKeyboard("B").weShouldTriggerTheButton("Button_Left");
        inGame.whenWePressOnKeyboard("LEFT").nothingShouldHappen();
        inGame.whenWePressOnKeyboard("Q").weShouldTriggerTheButton("Alt_Button_Left");
    })

    it('Delete bind then assign a not yet binded button', () => {
        inGame.whenWePressOnKeyboard("LEFT").weShouldTriggerTheButton("Button_Left");
        inGame.whenWePressOnKeyboard("Q").weShouldTriggerTheButton("Alt_Button_Left");
        inGame.whenWePressOnKeyboard("B").nothingShouldHappen();
        inTheSettingMenu.whenWeDelete("Button_Left").thereShouldBeNoIconAnymore();
        inGame.whenWePressOnKeyboard("LEFT").nothingShouldHappen();
        inGame.whenWePressOnKeyboard("RIGHT").weShouldTriggerTheButton("Button_Right");
        inTheSettingMenu.whenCursorIsOnSetting("Button_Left").thereShouldBeNoIcon().weWantThisBindInstead("RIGHT").confirm();
        inGame.whenWePressOnKeyboard("LEFT").nothingShouldHappen();
        inGame.whenWePressOnKeyboard("RIGHT").weShouldTriggerTheButton("Button_Left");
    });


    it('swap 2 bind, than delete 1 bind than assign another bind', () => {
        inGame.whenWePressOnKeyboard("LEFT").weShouldTriggerTheButton("Button_Left");
        inGame.whenWePressOnKeyboard("RIGHT").weShouldTriggerTheButton("Button_Right");
        inTheSettingMenu.whenCursorIsOnSetting("Button_Left").iconDisplayedIs("KEY_ARROW_LEFT").weWantThisBindInstead("RIGHT").confirm();
        inGame.whenWePressOnKeyboard("LEFT").weShouldTriggerTheButton("Button_Right");
        inGame.whenWePressOnKeyboard("RIGHT").weShouldTriggerTheButton("Button_Left");
        inTheSettingMenu.whenCursorIsOnSetting("Button_Left").whenWeDelete().thereShouldBeNoIconAnymore();
        inGame.whenWePressOnKeyboard("LEFT").weShouldTriggerTheButton("Button_Right");
        inGame.whenWePressOnKeyboard("RIGHT").nothingShouldHappen();
        inTheSettingMenu.whenCursorIsOnSetting("Alt_Button_Up").iconDisplayedIs("KEY_Z").weWantThisBindInstead("B").confirm();
        inGame.whenWePressOnKeyboard("LEFT").weShouldTriggerTheButton("Button_Right");
        inGame.whenWePressOnKeyboard("RIGHT").nothingShouldHappen();
        inGame.whenWePressOnKeyboard("B").weShouldTriggerTheButton("Alt_Button_Up");
    });


    it('Delete bind then assign not already existing button', () => {
        inGame.whenWePressOnKeyboard("LEFT").weShouldTriggerTheButton("Button_Left");
        inGame.whenWePressOnKeyboard("Q").weShouldTriggerTheButton("Alt_Button_Left");
        inGame.whenWePressOnKeyboard("B").nothingShouldHappen();
        inTheSettingMenu.whenWeDelete("Button_Left").thereShouldBeNoIconAnymore();
        inGame.whenWePressOnKeyboard("LEFT").nothingShouldHappen();
        inGame.whenWePressOnKeyboard("RIGHT").weShouldTriggerTheButton("Button_Right");
        inTheSettingMenu.whenCursorIsOnSetting("Button_Left").thereShouldBeNoIcon().weWantThisBindInstead("L").confirm();
        inGame.whenWePressOnKeyboard("L").weShouldTriggerTheButton("Button_Left");
    });

    it('change alt bind to not already existing button, than another one alt bind with another not already existing button', () => {
        inGame.whenWePressOnKeyboard("Z").weShouldTriggerTheButton("Alt_Button_Up");
        inGame.whenWePressOnKeyboard("S").weShouldTriggerTheButton("Alt_Button_Down");
        inGame.whenWePressOnKeyboard("T").nothingShouldHappen();
        inTheSettingMenu.whenCursorIsOnSetting("Alt_Button_Up").iconDisplayedIs("KEY_Z").weWantThisBindInstead("T").confirm();
        inGame.whenWePressOnKeyboard("T").weShouldTriggerTheButton("Alt_Button_Up");
        inGame.whenWePressOnKeyboard("Z").nothingShouldHappen();
        inGame.whenWePressOnKeyboard("U").nothingShouldHappen();
        inGame.whenWePressOnKeyboard("S").weShouldTriggerTheButton("Alt_Button_Down");
        inTheSettingMenu.whenCursorIsOnSetting("Alt_Button_Down").iconDisplayedIs("KEY_S").weWantThisBindInstead("U").confirm();
        inGame.whenWePressOnKeyboard("T").weShouldTriggerTheButton("Alt_Button_Up");
        inGame.whenWePressOnKeyboard("Z").nothingShouldHappen();
        inGame.whenWePressOnKeyboard("U").weShouldTriggerTheButton("Alt_Button_Down");
        inGame.whenWePressOnKeyboard("S").nothingShouldHappen();
    });

    it('Swap multiple touch alt and main', () => {
        inGame.whenWePressOnKeyboard("UP").weShouldTriggerTheButton("Button_Up");
        inGame.whenWePressOnKeyboard("RIGHT").weShouldTriggerTheButton("Button_Right");
        inGame.whenWePressOnKeyboard("Z").weShouldTriggerTheButton("Alt_Button_Up");
        inGame.whenWePressOnKeyboard("D").weShouldTriggerTheButton("Alt_Button_Right");
        inTheSettingMenu.whenCursorIsOnSetting("Button_Up").iconDisplayedIs("KEY_ARROW_UP").weWantThisBindInstead("RIGHT").confirm();
        inGame.whenWePressOnKeyboard("UP").weShouldTriggerTheButton("Button_Right");
        inGame.whenWePressOnKeyboard("RIGHT").weShouldTriggerTheButton("Button_Up");
        inGame.whenWePressOnKeyboard("Z").weShouldTriggerTheButton("Alt_Button_Up");
        inGame.whenWePressOnKeyboard("D").weShouldTriggerTheButton("Alt_Button_Right");

        inTheSettingMenu.whenCursorIsOnSetting("Alt_Button_Up").iconDisplayedIs("KEY_Z").weWantThisBindInstead("D").confirm();
        inGame.whenWePressOnKeyboard("UP").weShouldTriggerTheButton("Button_Right");
        inGame.whenWePressOnKeyboard("RIGHT").weShouldTriggerTheButton("Button_Up");
        inGame.whenWePressOnKeyboard("Z").weShouldTriggerTheButton("Alt_Button_Right");
        inGame.whenWePressOnKeyboard("D").weShouldTriggerTheButton("Alt_Button_Up");

        inTheSettingMenu.whenCursorIsOnSetting("Alt_Button_Up").iconDisplayedIs("KEY_D").weWantThisBindInstead("Z").confirm();
        inGame.whenWePressOnKeyboard("UP").weShouldTriggerTheButton("Button_Right");
        inGame.whenWePressOnKeyboard("RIGHT").weShouldTriggerTheButton("Button_Up");
        inGame.whenWePressOnKeyboard("Z").weShouldTriggerTheButton("Alt_Button_Up");
        inGame.whenWePressOnKeyboard("D").weShouldTriggerTheButton("Alt_Button_Right");
    })


    it('Delete 2 bind then reassign one of them', () => {
        inGame.whenWePressOnKeyboard("LEFT").weShouldTriggerTheButton("Button_Left");
        inGame.whenWePressOnKeyboard("Q").weShouldTriggerTheButton("Alt_Button_Left");
        inGame.whenWePressOnKeyboard("B").nothingShouldHappen();

        inTheSettingMenu.whenWeDelete("Button_Left").thereShouldBeNoIconAnymore();
        inGame.whenWePressOnKeyboard("LEFT").nothingShouldHappen();
        inGame.whenWePressOnKeyboard("Q").weShouldTriggerTheButton("Alt_Button_Left");
        inGame.whenWePressOnKeyboard("B").nothingShouldHappen();

        inTheSettingMenu.whenWeDelete("Alt_Button_Left").thereShouldBeNoIconAnymore();
        inGame.whenWePressOnKeyboard("LEFT").nothingShouldHappen();
        inGame.whenWePressOnKeyboard("Q").nothingShouldHappen();
        inGame.whenWePressOnKeyboard("B").nothingShouldHappen();

        inTheSettingMenu.whenCursorIsOnSetting("Alt_Button_Left").thereShouldBeNoIcon().weWantThisBindInstead("Q").confirm();
        inGame.whenWePressOnKeyboard("LEFT").nothingShouldHappen();
        inGame.whenWePressOnKeyboard("Q").weShouldTriggerTheButton("Alt_Button_Left");
        inGame.whenWePressOnKeyboard("B").nothingShouldHappen();
    });

    it("test keyboard listener", () => {
        const keyDown = Phaser.Input.Keyboard.KeyCodes.S;
        const key = getKeyWithKeycode(config, keyDown);
        const settingName = config.custom[key];
        const buttonDown = config.settings[settingName];
        expect(buttonDown).toEqual(Button.DOWN);
    });
});
