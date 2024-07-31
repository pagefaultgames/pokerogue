import {beforeEach, describe, expect, it} from "vitest";
import {Button} from "#app/enums/buttons";
import {deepCopy} from "#app/utils";
import {
  getKeyWithKeycode,
  getKeyWithSettingName,
} from "#app/configs/inputs/configHandler";
import {MenuManip} from "#app/test/settingMenu/helpers/menuManip";
import {InGameManip} from "#app/test/settingMenu/helpers/inGameManip";
import {Device} from "#app/enums/devices";
import {InterfaceConfig} from "#app/inputs-controller";
import cfg_keyboard_qwerty from "#app/configs/inputs/cfg_keyboard_qwerty";
import {SettingKeyboard} from "#app/system/settings/settings-keyboard";


describe("Test Rebinding", () => {
  let config;
  let inGame;
  let inTheSettingMenu;
  const configs: Map<string, InterfaceConfig> = new Map();
  const selectedDevice = {
    [Device.GAMEPAD]: null,
    [Device.KEYBOARD]: "default",
  };

  beforeEach(() => {
    config = deepCopy(cfg_keyboard_qwerty);
    config.custom = {...config.default};
    configs["default"] = config;
    inGame = new InGameManip(configs, config, selectedDevice);
    inTheSettingMenu = new MenuManip(config);
  });

  it("Check if config is loaded", () => {
    expect(config).not.toBeNull();
  });
  it("Check button for setting name", () => {
    const settingName = SettingKeyboard.Button_Left;
    const button = config.settings[settingName];
    expect(button).toEqual(Button.LEFT);
  });
  it("Check key for Keyboard KeyCode", () => {
    const key = getKeyWithKeycode(config, Phaser.Input.Keyboard.KeyCodes.LEFT);
    const settingName = config.custom[key];
    const button = config.settings[settingName];
    expect(button).toEqual(Button.LEFT);
  });
  it("Check key for currenly Assigned to action not alt", () => {
    const key = getKeyWithKeycode(config, Phaser.Input.Keyboard.KeyCodes.A);
    const settingName = config.custom[key];
    const button = config.settings[settingName];
    expect(button).toEqual(Button.LEFT);
  });

  it("Check key for currenly Assigned to setting name", () => {
    const settingName = SettingKeyboard.Button_Left;
    const key = getKeyWithSettingName(config, settingName);
    expect(key).toEqual("KEY_ARROW_LEFT");
  });
  it("Check key for currenly Assigned to setting name alt", () => {
    const settingName = SettingKeyboard.Alt_Button_Left;
    const key = getKeyWithSettingName(config, settingName);
    expect(key).toEqual("KEY_A");
  });
  it("Check key from key code", () => {
    const keycode = Phaser.Input.Keyboard.KeyCodes.LEFT;
    const key = getKeyWithKeycode(config, keycode);
    expect(key).toEqual("KEY_ARROW_LEFT");
  });
  it("Check icon for currenly Assigned to key code", () => {
    const keycode = Phaser.Input.Keyboard.KeyCodes.LEFT;
    const key = getKeyWithKeycode(config, keycode);
    const icon = config.icons[key];
    expect(icon).toEqual("KEY_ARROW_LEFT.png");
  });
  it("Check icon for currenly Assigned to key code", () => {
    const keycode = Phaser.Input.Keyboard.KeyCodes.A;
    const key = getKeyWithKeycode(config, keycode);
    const icon = config.icons[key];
    expect(icon).toEqual("A.png");
  });
  it("Check icon for currenly Assigned to setting name", () => {
    const settingName = SettingKeyboard.Button_Left;
    const key = getKeyWithSettingName(config, settingName);
    const icon = config.icons[key];
    expect(icon).toEqual("KEY_ARROW_LEFT.png");
  });
  it("Check icon for currenly Assigned to setting name alt", () => {
    const settingName = SettingKeyboard.Alt_Button_Left;
    const key = getKeyWithSettingName(config, settingName);
    const icon = config.icons[key];
    expect(icon).toEqual("A.png");
  });

  it("Check if is working", () => {
    inTheSettingMenu.whenCursorIsOnSetting("Alt_Button_Left").iconDisplayedIs("A");
    inTheSettingMenu.whenCursorIsOnSetting("Alt_Button_Right").iconDisplayedIs("D");
    inTheSettingMenu.whenCursorIsOnSetting("Alt_Button_Left").iconDisplayedIs("A").weWantThisBindInstead("D").confirm();
    inGame.whenWePressOnKeyboard("A").nothingShouldHappen();
    inGame.whenWePressOnKeyboard("D").weShouldTriggerTheButton("Alt_Button_Left");
  });

  it("Check prevent rebind indirectly the d-pad buttons", () => {
    inTheSettingMenu.whenCursorIsOnSetting("Alt_Button_Left").iconDisplayedIs("A");
    inTheSettingMenu.whenCursorIsOnSetting("Alt_Button_Right").iconDisplayedIs("D");
    inTheSettingMenu.whenCursorIsOnSetting("Alt_Button_Left").iconDisplayedIs("A").weWantThisBindInstead("LEFT").weCantAssignThisKey().butLetsForceIt();
    inGame.whenWePressOnKeyboard("LEFT").weShouldTriggerTheButton("Left");
    inGame.whenWePressOnKeyboard("A").weShouldTriggerTheButton("Alt_Button_Left");
    inGame.whenWePressOnKeyboard("D").weShouldTriggerTheButton("Alt_Button_Right");
  });

  it("Swap alt with a d-pad main", () => {
    inGame.whenWePressOnKeyboard("UP").weShouldTriggerTheButton("Button_Up");
    inGame.whenWePressOnKeyboard("W").weShouldTriggerTheButton("Alt_Button_Up");
    inTheSettingMenu.whenCursorIsOnSetting("Button_Up").iconDisplayedIs("KEY_ARROW_UP").weWantThisBindInstead("W").weCantOverrideThisBind().butLetsForceIt();
    inGame.whenWePressOnKeyboard("UP").weShouldTriggerTheButton("Button_Up");
    inGame.whenWePressOnKeyboard("W").weShouldTriggerTheButton("Alt_Button_Up");
  });

  it("Check if double assign d-pad is blocked", () => {
    inGame.whenWePressOnKeyboard("RIGHT").weShouldTriggerTheButton("Button_Right");
    inGame.whenWePressOnKeyboard("UP").weShouldTriggerTheButton("Button_Up");

    inTheSettingMenu.whenCursorIsOnSetting("Button_Left").iconDisplayedIs("KEY_ARROW_LEFT").weWantThisBindInstead("RIGHT").weCantOverrideThisBind().weCantAssignThisKey().butLetsForceIt();

    inGame.whenWePressOnKeyboard("LEFT").weShouldTriggerTheButton("Button_Left");
    inGame.whenWePressOnKeyboard("RIGHT").weShouldTriggerTheButton("Button_Right");
    inGame.whenWePressOnKeyboard("UP").weShouldTriggerTheButton("Button_Up");

    inTheSettingMenu.whenCursorIsOnSetting("Button_Left").iconDisplayedIs("KEY_ARROW_LEFT").weWantThisBindInstead("UP").weCantOverrideThisBind().weCantAssignThisKey().butLetsForceIt();

    inGame.whenWePressOnKeyboard("LEFT").weShouldTriggerTheButton("Button_Left");
    inGame.whenWePressOnKeyboard("RIGHT").weShouldTriggerTheButton("Button_Right");
    inGame.whenWePressOnKeyboard("UP").weShouldTriggerTheButton("Button_Up");

    inTheSettingMenu.whenCursorIsOnSetting("Button_Left").iconDisplayedIs("KEY_ARROW_LEFT").weWantThisBindInstead("RIGHT").weCantOverrideThisBind().weCantAssignThisKey().butLetsForceIt();

    inGame.whenWePressOnKeyboard("LEFT").weShouldTriggerTheButton("Button_Left");
    inGame.whenWePressOnKeyboard("RIGHT").weShouldTriggerTheButton("Button_Right");
    inGame.whenWePressOnKeyboard("UP").weShouldTriggerTheButton("Button_Up");
  });

  it("Check if double assign is working", () => {
    inGame.whenWePressOnKeyboard("A").weShouldTriggerTheButton("Alt_Button_Left");
    inGame.whenWePressOnKeyboard("D").weShouldTriggerTheButton("Alt_Button_Right");
    inGame.whenWePressOnKeyboard("W").weShouldTriggerTheButton("Alt_Button_Up");

    inTheSettingMenu.whenCursorIsOnSetting("Alt_Button_Left").iconDisplayedIs("KEY_A").weWantThisBindInstead("D").confirm();

    inGame.whenWePressOnKeyboard("A").nothingShouldHappen();
    inGame.whenWePressOnKeyboard("D").weShouldTriggerTheButton("Alt_Button_Left");
    inGame.whenWePressOnKeyboard("W").weShouldTriggerTheButton("Alt_Button_Up");

    inTheSettingMenu.whenCursorIsOnSetting("Alt_Button_Left").iconDisplayedIs("KEY_D").weWantThisBindInstead("W").confirm();

    inGame.whenWePressOnKeyboard("A").nothingShouldHappen();
    inGame.whenWePressOnKeyboard("D").nothingShouldHappen();
    inGame.whenWePressOnKeyboard("W").weShouldTriggerTheButton("Alt_Button_Left");

    inTheSettingMenu.whenCursorIsOnSetting("Alt_Button_Left").iconDisplayedIs("KEY_W").weWantThisBindInstead("D").confirm();

    inGame.whenWePressOnKeyboard("A").nothingShouldHappen();
    inGame.whenWePressOnKeyboard("D").weShouldTriggerTheButton("Alt_Button_Left");
    inGame.whenWePressOnKeyboard("W").nothingShouldHappen();
  });

  it("Check if triple swap d-pad is prevented", () => {
    inTheSettingMenu.whenCursorIsOnSetting("Button_Left").iconDisplayedIs("KEY_ARROW_LEFT").weWantThisBindInstead("RIGHT").weCantOverrideThisBind().weCantAssignThisKey().butLetsForceIt();

    inGame.whenWePressOnKeyboard("LEFT").weShouldTriggerTheButton("Button_Left");
    inGame.whenWePressOnKeyboard("RIGHT").weShouldTriggerTheButton("Button_Right");
    inGame.whenWePressOnKeyboard("UP").weShouldTriggerTheButton("Button_Up");

    inTheSettingMenu.whenCursorIsOnSetting("Button_Right").iconDisplayedIs("KEY_ARROW_RIGHT").weWantThisBindInstead("UP").weCantOverrideThisBind().weCantAssignThisKey().butLetsForceIt();
    inGame.whenWePressOnKeyboard("LEFT").weShouldTriggerTheButton("Button_Left");
    inGame.whenWePressOnKeyboard("RIGHT").weShouldTriggerTheButton("Button_Right");
    inGame.whenWePressOnKeyboard("UP").weShouldTriggerTheButton("Button_Up");

    inTheSettingMenu.whenCursorIsOnSetting("Button_Left").iconDisplayedIs("KEY_ARROW_LEFT").weWantThisBindInstead("LEFT").weCantOverrideThisBind().weCantAssignThisKey().butLetsForceIt();
    inGame.whenWePressOnKeyboard("LEFT").weShouldTriggerTheButton("Button_Left");
    inGame.whenWePressOnKeyboard("RIGHT").weShouldTriggerTheButton("Button_Right");
    inGame.whenWePressOnKeyboard("UP").weShouldTriggerTheButton("Button_Up");
  });

  it("Check if triple swap is working", () => {
    inGame.whenWePressOnKeyboard("A").weShouldTriggerTheButton("Alt_Button_Left");
    inGame.whenWePressOnKeyboard("D").weShouldTriggerTheButton("Alt_Button_Right");
    inGame.whenWePressOnKeyboard("W").weShouldTriggerTheButton("Alt_Button_Up");

    inTheSettingMenu.whenCursorIsOnSetting("Alt_Button_Left").iconDisplayedIs("KEY_A").weWantThisBindInstead("D").confirm();

    inGame.whenWePressOnKeyboard("A").nothingShouldHappen();
    inGame.whenWePressOnKeyboard("D").weShouldTriggerTheButton("Alt_Button_Left");
    inGame.whenWePressOnKeyboard("W").weShouldTriggerTheButton("Alt_Button_Up");

    inTheSettingMenu.whenCursorIsOnSetting("Alt_Button_Right").thereShouldBeNoIcon().weWantThisBindInstead("W").confirm();

    inGame.whenWePressOnKeyboard("A").nothingShouldHappen();
    inGame.whenWePressOnKeyboard("D").weShouldTriggerTheButton("Alt_Button_Left");
    inGame.whenWePressOnKeyboard("W").weShouldTriggerTheButton("Alt_Button_Right");

    inTheSettingMenu.whenCursorIsOnSetting("Alt_Button_Left").iconDisplayedIs("KEY_D").weWantThisBindInstead("A").confirm();

    inGame.whenWePressOnKeyboard("A").weShouldTriggerTheButton("Alt_Button_Left");
    inGame.whenWePressOnKeyboard("D").nothingShouldHappen();
    inGame.whenWePressOnKeyboard("W").weShouldTriggerTheButton("Alt_Button_Right");
  });

  it("Swap alt with a main", () => {
    inGame.whenWePressOnKeyboard("D").weShouldTriggerTheButton("Alt_Button_Right");
    inGame.whenWePressOnKeyboard("R").weShouldTriggerTheButton("Cycle_Shiny");
    inTheSettingMenu.whenCursorIsOnSetting("Cycle_Shiny").iconDisplayedIs("KEY_R").weWantThisBindInstead("D").confirm();
    inGame.whenWePressOnKeyboard("D").weShouldTriggerTheButton("Cycle_Shiny");
    inGame.whenWePressOnKeyboard("R").nothingShouldHappen();
  });

  it("multiple Swap alt with another main", () => {
    inGame.whenWePressOnKeyboard("D").weShouldTriggerTheButton("Alt_Button_Right");
    inGame.whenWePressOnKeyboard("R").weShouldTriggerTheButton("Button_Cycle_Shiny");
    inGame.whenWePressOnKeyboard("A").weShouldTriggerTheButton("Alt_Button_Left");
    inGame.whenWePressOnKeyboard("F").weShouldTriggerTheButton("Button_Cycle_Form");
    inTheSettingMenu.whenCursorIsOnSetting("Button_Cycle_Shiny").iconDisplayedIs("KEY_R").weWantThisBindInstead("D").confirm();
    inGame.whenWePressOnKeyboard("D").weShouldTriggerTheButton("Button_Cycle_Shiny");
    inGame.whenWePressOnKeyboard("R").nothingShouldHappen();
    inGame.whenWePressOnKeyboard("A").weShouldTriggerTheButton("Alt_Button_Left");
    inGame.whenWePressOnKeyboard("F").weShouldTriggerTheButton("Button_Cycle_Form");
    inTheSettingMenu.whenCursorIsOnSetting("Button_Cycle_Form").iconDisplayedIs("KEY_F").weWantThisBindInstead("R").confirm();
    inGame.whenWePressOnKeyboard("D").weShouldTriggerTheButton("Button_Cycle_Shiny");
    inGame.whenWePressOnKeyboard("R").weShouldTriggerTheButton("Button_Cycle_Form");
    inGame.whenWePressOnKeyboard("A").weShouldTriggerTheButton("Alt_Button_Left");
    inGame.whenWePressOnKeyboard("F").nothingShouldHappen();
  });

  it("Swap alt with a key not binded yet", () => {
    inGame.whenWePressOnKeyboard("W").weShouldTriggerTheButton("Alt_Button_Up");
    inGame.whenWePressOnKeyboard("B").nothingShouldHappen();
    inTheSettingMenu.whenCursorIsOnSetting("Alt_Button_Up").iconDisplayedIs("KEY_W").weWantThisBindInstead("B").confirm();
    inGame.whenWePressOnKeyboard("W").nothingShouldHappen();
    inGame.whenWePressOnKeyboard("B").weShouldTriggerTheButton("Alt_Button_Up");
  });

  it("Delete blacklisted bind", () => {
    inGame.whenWePressOnKeyboard("LEFT").weShouldTriggerTheButton("Button_Left");
    inTheSettingMenu.whenWeDelete("Button_Left").weCantDelete().iconDisplayedIs("KEY_ARROW_LEFT");
    inGame.whenWePressOnKeyboard("LEFT").weShouldTriggerTheButton("Button_Left");
  });

  it("Delete bind", () => {
    inGame.whenWePressOnKeyboard("A").weShouldTriggerTheButton("Alt_Button_Left");
    inTheSettingMenu.whenWeDelete("Alt_Button_Left").thereShouldBeNoIconAnymore();
    inGame.whenWePressOnKeyboard("A").nothingShouldHappen();
  });

  it("Delete bind then assign a not yet binded button", () => {
    inTheSettingMenu.whenWeDelete("Alt_Button_Left").thereShouldBeNoIconAnymore();
    inGame.whenWePressOnKeyboard("A").nothingShouldHappen();
    inGame.whenWePressOnKeyboard("B").nothingShouldHappen();
    inTheSettingMenu.whenCursorIsOnSetting("Alt_Button_Left").thereShouldBeNoIcon().weWantThisBindInstead("B").confirm();
    inGame.whenWePressOnKeyboard("A").nothingShouldHappen();
    inGame.whenWePressOnKeyboard("B").weShouldTriggerTheButton("Alt_Button_Left");
  });
  it("swap 2 bind, than delete 1 bind than assign another bind", () => {
    inGame.whenWePressOnKeyboard("R").weShouldTriggerTheButton("Button_Cycle_Shiny");
    inGame.whenWePressOnKeyboard("F").weShouldTriggerTheButton("Button_Cycle_Form");
    inGame.whenWePressOnKeyboard("W").weShouldTriggerTheButton("Alt_Button_Up");
    inGame.whenWePressOnKeyboard("D").weShouldTriggerTheButton("Alt_Button_Right");
    inTheSettingMenu.whenCursorIsOnSetting("Button_Cycle_Shiny").iconDisplayedIs("KEY_R").weWantThisBindInstead("D").confirm();
    inGame.whenWePressOnKeyboard("R").nothingShouldHappen();
    inGame.whenWePressOnKeyboard("F").weShouldTriggerTheButton("Button_Cycle_Form");
    inGame.whenWePressOnKeyboard("W").weShouldTriggerTheButton("Alt_Button_Up");
    inGame.whenWePressOnKeyboard("D").weShouldTriggerTheButton("Button_Cycle_Shiny");

    inTheSettingMenu.whenCursorIsOnSetting("Button_Cycle_Form").iconDisplayedIs("KEY_F").weWantThisBindInstead("W").confirm();
    inGame.whenWePressOnKeyboard("R").nothingShouldHappen();
    inGame.whenWePressOnKeyboard("F").nothingShouldHappen();
    inGame.whenWePressOnKeyboard("W").weShouldTriggerTheButton("Button_Cycle_Form");
    inGame.whenWePressOnKeyboard("D").weShouldTriggerTheButton("Button_Cycle_Shiny");
    inGame.whenWePressOnKeyboard("A").weShouldTriggerTheButton("Alt_Button_Left");

    inTheSettingMenu.whenWeDelete("Alt_Button_Left").thereShouldBeNoIconAnymore();
    inGame.whenWePressOnKeyboard("R").nothingShouldHappen();
    inGame.whenWePressOnKeyboard("F").nothingShouldHappen();
    inGame.whenWePressOnKeyboard("W").weShouldTriggerTheButton("Button_Cycle_Form");
    inGame.whenWePressOnKeyboard("D").weShouldTriggerTheButton("Button_Cycle_Shiny");
    inGame.whenWePressOnKeyboard("S").weShouldTriggerTheButton("Alt_Button_Down");
    inGame.whenWePressOnKeyboard("A").nothingShouldHappen();
    inGame.whenWePressOnKeyboard("B").nothingShouldHappen();

    inTheSettingMenu.whenCursorIsOnSetting("Alt_Button_Down").iconDisplayedIs("KEY_S").weWantThisBindInstead("B").confirm();
    inGame.whenWePressOnKeyboard("R").nothingShouldHappen();
    inGame.whenWePressOnKeyboard("F").nothingShouldHappen();
    inGame.whenWePressOnKeyboard("W").weShouldTriggerTheButton("Button_Cycle_Form");
    inGame.whenWePressOnKeyboard("D").weShouldTriggerTheButton("Button_Cycle_Shiny");
    inGame.whenWePressOnKeyboard("S").nothingShouldHappen();
    inGame.whenWePressOnKeyboard("A").nothingShouldHappen();
    inGame.whenWePressOnKeyboard("B").weShouldTriggerTheButton("Alt_Button_Down");
  });


  it("Delete bind then assign not already existing button", () => {

    inGame.whenWePressOnKeyboard("A").weShouldTriggerTheButton("Alt_Button_Left");
    inGame.whenWePressOnKeyboard("B").nothingShouldHappen();

    inTheSettingMenu.whenWeDelete("Alt_Button_Left").thereShouldBeNoIconAnymore();
    inGame.whenWePressOnKeyboard("A").nothingShouldHappen();
    inGame.whenWePressOnKeyboard("B").nothingShouldHappen();

    inTheSettingMenu.whenCursorIsOnSetting("Alt_Button_Left").thereShouldBeNoIcon().weWantThisBindInstead("B").confirm();
    inGame.whenWePressOnKeyboard("A").nothingShouldHappen();
    inGame.whenWePressOnKeyboard("B").weShouldTriggerTheButton("Alt_Button_Left");
  });


  it("change alt bind to not already existing button, than another one alt bind with another not already existing button", () => {
    inGame.whenWePressOnKeyboard("A").weShouldTriggerTheButton("Alt_Button_Left");
    inGame.whenWePressOnKeyboard("D").weShouldTriggerTheButton("Alt_Button_Right");
    inGame.whenWePressOnKeyboard("B").nothingShouldHappen();
    inGame.whenWePressOnKeyboard("U").nothingShouldHappen();
    inTheSettingMenu.whenCursorIsOnSetting("Alt_Button_Left").iconDisplayedIs("KEY_A").weWantThisBindInstead("B").confirm();
    inGame.whenWePressOnKeyboard("A").nothingShouldHappen();
    inGame.whenWePressOnKeyboard("D").weShouldTriggerTheButton("Alt_Button_Right");
    inGame.whenWePressOnKeyboard("B").weShouldTriggerTheButton("Alt_Button_Left");
    inGame.whenWePressOnKeyboard("U").nothingShouldHappen();
    inTheSettingMenu.whenCursorIsOnSetting("Alt_Button_Right").iconDisplayedIs("KEY_D").weWantThisBindInstead("U").confirm();
    inGame.whenWePressOnKeyboard("A").nothingShouldHappen();
    inGame.whenWePressOnKeyboard("D").nothingShouldHappen();
    inGame.whenWePressOnKeyboard("B").weShouldTriggerTheButton("Alt_Button_Left");
    inGame.whenWePressOnKeyboard("U").weShouldTriggerTheButton("Alt_Button_Right");
  });

  it("Swap multiple touch alt and main", () => {
    inGame.whenWePressOnKeyboard("UP").weShouldTriggerTheButton("Button_Up");
    inGame.whenWePressOnKeyboard("RIGHT").weShouldTriggerTheButton("Button_Right");
    inGame.whenWePressOnKeyboard("W").weShouldTriggerTheButton("Alt_Button_Up");
    inGame.whenWePressOnKeyboard("D").weShouldTriggerTheButton("Alt_Button_Right");
    inTheSettingMenu.whenCursorIsOnSetting("Button_Up").iconDisplayedIs("KEY_ARROW_UP").weWantThisBindInstead("RIGHT").weCantOverrideThisBind().weCantAssignThisKey().butLetsForceIt();
    inGame.whenWePressOnKeyboard("UP").weShouldTriggerTheButton("Button_Up");
    inGame.whenWePressOnKeyboard("RIGHT").weShouldTriggerTheButton("Button_Right");
    inGame.whenWePressOnKeyboard("W").weShouldTriggerTheButton("Alt_Button_Up");
    inGame.whenWePressOnKeyboard("D").weShouldTriggerTheButton("Alt_Button_Right");
    inTheSettingMenu.whenCursorIsOnSetting("Alt_Button_Up").iconDisplayedIs("KEY_W").weWantThisBindInstead("D").confirm();
    inGame.whenWePressOnKeyboard("UP").weShouldTriggerTheButton("Button_Up");
    inGame.whenWePressOnKeyboard("RIGHT").weShouldTriggerTheButton("Button_Right");
    inGame.whenWePressOnKeyboard("W").nothingShouldHappen();
    inGame.whenWePressOnKeyboard("D").weShouldTriggerTheButton("Alt_Button_Up");
    inTheSettingMenu.whenCursorIsOnSetting("Alt_Button_Up").iconDisplayedIs("KEY_D").weWantThisBindInstead("W").confirm();
    inGame.whenWePressOnKeyboard("UP").weShouldTriggerTheButton("Button_Up");
    inGame.whenWePressOnKeyboard("RIGHT").weShouldTriggerTheButton("Button_Right");
    inGame.whenWePressOnKeyboard("W").weShouldTriggerTheButton("Alt_Button_Up");
    inGame.whenWePressOnKeyboard("D").nothingShouldHappen();
  });


  it("Delete 2 bind then reassign one of them", () => {

    inGame.whenWePressOnKeyboard("A").weShouldTriggerTheButton("Alt_Button_Left");
    inGame.whenWePressOnKeyboard("D").weShouldTriggerTheButton("Alt_Button_Right");

    inTheSettingMenu.whenWeDelete("Alt_Button_Left").thereShouldBeNoIconAnymore();
    inGame.whenWePressOnKeyboard("A").nothingShouldHappen();
    inGame.whenWePressOnKeyboard("D").weShouldTriggerTheButton("Alt_Button_Right");

    inTheSettingMenu.whenWeDelete("Alt_Button_Right").thereShouldBeNoIconAnymore();
    inGame.whenWePressOnKeyboard("A").nothingShouldHappen();
    inGame.whenWePressOnKeyboard("D").nothingShouldHappen();

    inTheSettingMenu.whenCursorIsOnSetting("Alt_Button_Left").thereShouldBeNoIcon().weWantThisBindInstead("A").confirm();
    inGame.whenWePressOnKeyboard("A").weShouldTriggerTheButton("Alt_Button_Left");
    inGame.whenWePressOnKeyboard("D").nothingShouldHappen();
  });

  it("test keyboard listener", () => {
    const keyDown = Phaser.Input.Keyboard.KeyCodes.S;
    const key = getKeyWithKeycode(config, keyDown);
    const settingName = config.custom[key];
    const buttonDown = config.settings[settingName];
    expect(buttonDown).toEqual(Button.DOWN);
  });

  it("retrieve the correct icon for a given source", () => {
    inTheSettingMenu.whenCursorIsOnSetting("Cycle_Shiny").iconDisplayedIs("KEY_R");
    inTheSettingMenu.whenCursorIsOnSetting("Cycle_Form").iconDisplayedIs("KEY_F");
    inGame.forTheSource("keyboard").forTheWantedBind("Cycle_Shiny").weShouldSeeTheIcon("R");
    inGame.forTheSource("keyboard").forTheWantedBind("Cycle_Form").weShouldSeeTheIcon("F");
  });

  it("check the key displayed on confirm", () => {
    inGame.whenWePressOnKeyboard("ENTER").weShouldTriggerTheButton("Button_Submit");
    inGame.whenWePressOnKeyboard("UP").weShouldTriggerTheButton("Button_Up");
    inGame.whenWePressOnKeyboard("DOWN").weShouldTriggerTheButton("Button_Down");
    inGame.whenWePressOnKeyboard("LEFT").weShouldTriggerTheButton("Button_Left");
    inGame.whenWePressOnKeyboard("RIGHT").weShouldTriggerTheButton("Button_Right");
    inGame.whenWePressOnKeyboard("ESC").weShouldTriggerTheButton("Button_Menu");
    inGame.whenWePressOnKeyboard("HOME").nothingShouldHappen();
    inGame.whenWePressOnKeyboard("DELETE").nothingShouldHappen();
    inTheSettingMenu.whenCursorIsOnSetting("Button_Submit").iconDisplayedIs("KEY_ENTER").whenWeDelete().iconDisplayedIs("KEY_ENTER");
    inTheSettingMenu.whenCursorIsOnSetting("Button_Up").iconDisplayedIs("KEY_ARROW_UP").whenWeDelete().iconDisplayedIs("KEY_ARROW_UP");
    inTheSettingMenu.whenCursorIsOnSetting("Button_Down").iconDisplayedIs("KEY_ARROW_DOWN").whenWeDelete().iconDisplayedIs("KEY_ARROW_DOWN");
    inTheSettingMenu.whenCursorIsOnSetting("Button_Left").iconDisplayedIs("KEY_ARROW_LEFT").whenWeDelete().iconDisplayedIs("KEY_ARROW_LEFT");
    inTheSettingMenu.whenCursorIsOnSetting("Button_Right").iconDisplayedIs("KEY_ARROW_RIGHT").whenWeDelete().iconDisplayedIs("KEY_ARROW_RIGHT");
    inTheSettingMenu.whenCursorIsOnSetting("Button_Menu").iconDisplayedIs("KEY_ESC").whenWeDelete().iconDisplayedIs("KEY_ESC");
    inTheSettingMenu.whenCursorIsOnSetting("Alt_Button_Up").iconDisplayedIs("KEY_W").whenWeDelete().thereShouldBeNoIconAnymore();
    inTheSettingMenu.whenCursorIsOnSetting("Alt_Button_Up").thereShouldBeNoIcon().weWantThisBindInstead("DELETE").weCantAssignThisKey().butLetsForceIt();
    inTheSettingMenu.whenCursorIsOnSetting("Alt_Button_Up").thereShouldBeNoIcon().weWantThisBindInstead("HOME").weCantAssignThisKey().butLetsForceIt();
    inGame.whenWePressOnKeyboard("DELETE").nothingShouldHappen();
    inGame.whenWePressOnKeyboard("HOME").nothingShouldHappen();
    inGame.whenWePressOnKeyboard("W").nothingShouldHappen();
  });

  it("check to delete all the binds of an action", () => {
    inGame.whenWePressOnKeyboard("V").weShouldTriggerTheButton("Button_Cycle_Variant");
    inTheSettingMenu.whenCursorIsOnSetting("Alt_Button_Cycle_Variant").thereShouldBeNoIcon().weWantThisBindInstead("K").confirm();
    inTheSettingMenu.whenCursorIsOnSetting("Alt_Button_Cycle_Variant").iconDisplayedIs("KEY_K").whenWeDelete().thereShouldBeNoIconAnymore();
    inTheSettingMenu.whenCursorIsOnSetting("Button_Cycle_Variant").iconDisplayedIs("KEY_V").whenWeDelete().thereShouldBeNoIconAnymore();
  });
});
