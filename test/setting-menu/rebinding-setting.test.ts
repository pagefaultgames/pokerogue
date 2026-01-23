import { Button } from "#enums/buttons";
import { Device } from "#enums/devices";
import { CFG_KEYBOARD_QWERTY } from "#inputs/cfg-keyboard-qwerty";
import { getKeyWithKeycode, getKeyWithSettingName } from "#inputs/config-handler";
import { SettingKeyboard } from "#system/settings-keyboard";
import { InGameManip } from "#test/setting-menu/helpers/in-game-manip";
import { MenuManip } from "#test/setting-menu/helpers/menu-manip";
import type { InterfaceConfig, SelectedDevice } from "#types/configs/inputs";
import { deepCopy } from "#utils/data";
import { beforeEach, describe, expect, it } from "vitest";

describe("Test Rebinding", () => {
  let config: InterfaceConfig;
  let inGame: InGameManip;
  let inTheSettingMenu: MenuManip;
  const configs: Record<string, InterfaceConfig> = {};
  const selectedDevice: SelectedDevice = {
    [Device.KEYBOARD]: "default",
  };

  beforeEach(() => {
    config = deepCopy(CFG_KEYBOARD_QWERTY);
    config.custom = { ...config.default };
    configs["default"] = config;
    inGame = new InGameManip(configs, config, selectedDevice);
    inTheSettingMenu = new MenuManip(config);
  });

  it("Check if config is loaded", () => {
    expect(config).not.toBeNull();
  });
  it("Check button for setting name", () => {
    const settingName = SettingKeyboard.BUTTON_LEFT;
    const button = config.settings[settingName];
    expect(button).toEqual(Button.LEFT);
  });
  it("Check key for Keyboard KeyCode", () => {
    const key = getKeyWithKeycode(config, Phaser.Input.Keyboard.KeyCodes.LEFT) ?? "";
    const settingName = config.custom?.[key as keyof typeof config.custom];
    const button = config.settings[settingName as keyof typeof config.custom];
    expect(button).toEqual(Button.LEFT);
  });
  it("Check key for currenly Assigned to action not alt", () => {
    const key = getKeyWithKeycode(config, Phaser.Input.Keyboard.KeyCodes.A) ?? "";
    const settingName = config.custom?.[key as keyof typeof config.custom];
    const button = config.settings[settingName as keyof typeof config.settings];
    expect(button).toEqual(Button.LEFT);
  });

  it("Check key for currenly Assigned to setting name", () => {
    const settingName = SettingKeyboard.BUTTON_LEFT;
    const key = getKeyWithSettingName(config, settingName);
    expect(key).toEqual("KEY_ARROW_LEFT");
  });
  it("Check key for currenly Assigned to setting name alt", () => {
    const settingName = SettingKeyboard.ALT_BUTTON_LEFT;
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
    const key = getKeyWithKeycode(config, keycode) ?? "";
    const icon = config.icons[key as keyof typeof config.icons];
    expect(icon).toEqual("KEY_ARROW_LEFT.png");
  });
  it("Check icon for currenly Assigned to key code", () => {
    const keycode = Phaser.Input.Keyboard.KeyCodes.A;
    const key = getKeyWithKeycode(config, keycode) ?? "";
    const icon = config.icons[key as keyof typeof config.icons];
    expect(icon).toEqual("A.png");
  });
  it("Check icon for currenly Assigned to setting name", () => {
    const settingName = SettingKeyboard.BUTTON_LEFT;
    const key = getKeyWithSettingName(config, settingName) ?? "";
    const icon = config.icons[key as keyof typeof config.icons];
    expect(icon).toEqual("KEY_ARROW_LEFT.png");
  });
  it("Check icon for currenly Assigned to setting name alt", () => {
    const settingName = SettingKeyboard.ALT_BUTTON_LEFT;
    const key = getKeyWithSettingName(config, settingName) ?? "";
    const icon = config.icons[key as keyof typeof config.icons];
    expect(icon).toEqual("A.png");
  });

  it("Check if is working", () => {
    inTheSettingMenu.whenCursorIsOnSetting("ALT_BUTTON_LEFT").iconDisplayedIs("A");
    inTheSettingMenu.whenCursorIsOnSetting("ALT_BUTTON_RIGHT").iconDisplayedIs("D");
    inTheSettingMenu.whenCursorIsOnSetting("ALT_BUTTON_LEFT").iconDisplayedIs("A").weWantThisBindInstead("D").confirm();
    inGame.whenWePressOnKeyboard("A").nothingShouldHappen();
    inGame.whenWePressOnKeyboard("D").weShouldTriggerTheButton("ALT_BUTTON_LEFT");
  });

  it("Check prevent rebind indirectly the d-pad buttons", () => {
    inTheSettingMenu.whenCursorIsOnSetting("ALT_BUTTON_LEFT").iconDisplayedIs("A");
    inTheSettingMenu.whenCursorIsOnSetting("ALT_BUTTON_RIGHT").iconDisplayedIs("D");
    inTheSettingMenu
      .whenCursorIsOnSetting("ALT_BUTTON_LEFT")
      .iconDisplayedIs("A")
      .weWantThisBindInstead("LEFT")
      .weCantAssignThisKey()
      .butLetsForceIt();
    inGame.whenWePressOnKeyboard("LEFT").weShouldTriggerTheButton("Left");
    inGame.whenWePressOnKeyboard("A").weShouldTriggerTheButton("ALT_BUTTON_LEFT");
    inGame.whenWePressOnKeyboard("D").weShouldTriggerTheButton("ALT_BUTTON_RIGHT");
  });

  it("Swap alt with a d-pad main", () => {
    inGame.whenWePressOnKeyboard("UP").weShouldTriggerTheButton("BUTTON_UP");
    inGame.whenWePressOnKeyboard("W").weShouldTriggerTheButton("ALT_BUTTON_UP");
    inTheSettingMenu
      .whenCursorIsOnSetting("BUTTON_UP")
      .iconDisplayedIs("KEY_ARROW_UP")
      .weWantThisBindInstead("W")
      .weCantOverrideThisBind()
      .butLetsForceIt();
    inGame.whenWePressOnKeyboard("UP").weShouldTriggerTheButton("BUTTON_UP");
    inGame.whenWePressOnKeyboard("W").weShouldTriggerTheButton("ALT_BUTTON_UP");
  });

  it("Check if double assign d-pad is blocked", () => {
    inGame.whenWePressOnKeyboard("RIGHT").weShouldTriggerTheButton("BUTTON_RIGHT");
    inGame.whenWePressOnKeyboard("UP").weShouldTriggerTheButton("BUTTON_UP");

    inTheSettingMenu
      .whenCursorIsOnSetting("BUTTON_LEFT")
      .iconDisplayedIs("KEY_ARROW_LEFT")
      .weWantThisBindInstead("RIGHT")
      .weCantOverrideThisBind()
      .weCantAssignThisKey()
      .butLetsForceIt();

    inGame.whenWePressOnKeyboard("LEFT").weShouldTriggerTheButton("BUTTON_LEFT");
    inGame.whenWePressOnKeyboard("RIGHT").weShouldTriggerTheButton("BUTTON_RIGHT");
    inGame.whenWePressOnKeyboard("UP").weShouldTriggerTheButton("BUTTON_UP");

    inTheSettingMenu
      .whenCursorIsOnSetting("BUTTON_LEFT")
      .iconDisplayedIs("KEY_ARROW_LEFT")
      .weWantThisBindInstead("UP")
      .weCantOverrideThisBind()
      .weCantAssignThisKey()
      .butLetsForceIt();

    inGame.whenWePressOnKeyboard("LEFT").weShouldTriggerTheButton("BUTTON_LEFT");
    inGame.whenWePressOnKeyboard("RIGHT").weShouldTriggerTheButton("BUTTON_RIGHT");
    inGame.whenWePressOnKeyboard("UP").weShouldTriggerTheButton("BUTTON_UP");

    inTheSettingMenu
      .whenCursorIsOnSetting("BUTTON_LEFT")
      .iconDisplayedIs("KEY_ARROW_LEFT")
      .weWantThisBindInstead("RIGHT")
      .weCantOverrideThisBind()
      .weCantAssignThisKey()
      .butLetsForceIt();

    inGame.whenWePressOnKeyboard("LEFT").weShouldTriggerTheButton("BUTTON_LEFT");
    inGame.whenWePressOnKeyboard("RIGHT").weShouldTriggerTheButton("BUTTON_RIGHT");
    inGame.whenWePressOnKeyboard("UP").weShouldTriggerTheButton("BUTTON_UP");
  });

  it("Check if double assign is working", () => {
    inGame.whenWePressOnKeyboard("A").weShouldTriggerTheButton("ALT_BUTTON_LEFT");
    inGame.whenWePressOnKeyboard("D").weShouldTriggerTheButton("ALT_BUTTON_RIGHT");
    inGame.whenWePressOnKeyboard("W").weShouldTriggerTheButton("ALT_BUTTON_UP");

    inTheSettingMenu
      .whenCursorIsOnSetting("ALT_BUTTON_LEFT")
      .iconDisplayedIs("KEY_A")
      .weWantThisBindInstead("D")
      .confirm();

    inGame.whenWePressOnKeyboard("A").nothingShouldHappen();
    inGame.whenWePressOnKeyboard("D").weShouldTriggerTheButton("ALT_BUTTON_LEFT");
    inGame.whenWePressOnKeyboard("W").weShouldTriggerTheButton("ALT_BUTTON_UP");

    inTheSettingMenu
      .whenCursorIsOnSetting("ALT_BUTTON_LEFT")
      .iconDisplayedIs("KEY_D")
      .weWantThisBindInstead("W")
      .confirm();

    inGame.whenWePressOnKeyboard("A").nothingShouldHappen();
    inGame.whenWePressOnKeyboard("D").nothingShouldHappen();
    inGame.whenWePressOnKeyboard("W").weShouldTriggerTheButton("ALT_BUTTON_LEFT");

    inTheSettingMenu
      .whenCursorIsOnSetting("ALT_BUTTON_LEFT")
      .iconDisplayedIs("KEY_W")
      .weWantThisBindInstead("D")
      .confirm();

    inGame.whenWePressOnKeyboard("A").nothingShouldHappen();
    inGame.whenWePressOnKeyboard("D").weShouldTriggerTheButton("ALT_BUTTON_LEFT");
    inGame.whenWePressOnKeyboard("W").nothingShouldHappen();
  });

  it("Check if triple swap d-pad is prevented", () => {
    inTheSettingMenu
      .whenCursorIsOnSetting("BUTTON_LEFT")
      .iconDisplayedIs("KEY_ARROW_LEFT")
      .weWantThisBindInstead("RIGHT")
      .weCantOverrideThisBind()
      .weCantAssignThisKey()
      .butLetsForceIt();

    inGame.whenWePressOnKeyboard("LEFT").weShouldTriggerTheButton("BUTTON_LEFT");
    inGame.whenWePressOnKeyboard("RIGHT").weShouldTriggerTheButton("BUTTON_RIGHT");
    inGame.whenWePressOnKeyboard("UP").weShouldTriggerTheButton("BUTTON_UP");

    inTheSettingMenu
      .whenCursorIsOnSetting("BUTTON_RIGHT")
      .iconDisplayedIs("KEY_ARROW_RIGHT")
      .weWantThisBindInstead("UP")
      .weCantOverrideThisBind()
      .weCantAssignThisKey()
      .butLetsForceIt();
    inGame.whenWePressOnKeyboard("LEFT").weShouldTriggerTheButton("BUTTON_LEFT");
    inGame.whenWePressOnKeyboard("RIGHT").weShouldTriggerTheButton("BUTTON_RIGHT");
    inGame.whenWePressOnKeyboard("UP").weShouldTriggerTheButton("BUTTON_UP");

    inTheSettingMenu
      .whenCursorIsOnSetting("BUTTON_LEFT")
      .iconDisplayedIs("KEY_ARROW_LEFT")
      .weWantThisBindInstead("LEFT")
      .weCantOverrideThisBind()
      .weCantAssignThisKey()
      .butLetsForceIt();
    inGame.whenWePressOnKeyboard("LEFT").weShouldTriggerTheButton("BUTTON_LEFT");
    inGame.whenWePressOnKeyboard("RIGHT").weShouldTriggerTheButton("BUTTON_RIGHT");
    inGame.whenWePressOnKeyboard("UP").weShouldTriggerTheButton("BUTTON_UP");
  });

  it("Check if triple swap is working", () => {
    inGame.whenWePressOnKeyboard("A").weShouldTriggerTheButton("ALT_BUTTON_LEFT");
    inGame.whenWePressOnKeyboard("D").weShouldTriggerTheButton("ALT_BUTTON_RIGHT");
    inGame.whenWePressOnKeyboard("W").weShouldTriggerTheButton("ALT_BUTTON_UP");

    inTheSettingMenu
      .whenCursorIsOnSetting("ALT_BUTTON_LEFT")
      .iconDisplayedIs("KEY_A")
      .weWantThisBindInstead("D")
      .confirm();

    inGame.whenWePressOnKeyboard("A").nothingShouldHappen();
    inGame.whenWePressOnKeyboard("D").weShouldTriggerTheButton("ALT_BUTTON_LEFT");
    inGame.whenWePressOnKeyboard("W").weShouldTriggerTheButton("ALT_BUTTON_UP");

    inTheSettingMenu
      .whenCursorIsOnSetting("ALT_BUTTON_RIGHT")
      .thereShouldBeNoIcon()
      .weWantThisBindInstead("W")
      .confirm();

    inGame.whenWePressOnKeyboard("A").nothingShouldHappen();
    inGame.whenWePressOnKeyboard("D").weShouldTriggerTheButton("ALT_BUTTON_LEFT");
    inGame.whenWePressOnKeyboard("W").weShouldTriggerTheButton("ALT_BUTTON_RIGHT");

    inTheSettingMenu
      .whenCursorIsOnSetting("ALT_BUTTON_LEFT")
      .iconDisplayedIs("KEY_D")
      .weWantThisBindInstead("A")
      .confirm();

    inGame.whenWePressOnKeyboard("A").weShouldTriggerTheButton("ALT_BUTTON_LEFT");
    inGame.whenWePressOnKeyboard("D").nothingShouldHappen();
    inGame.whenWePressOnKeyboard("W").weShouldTriggerTheButton("ALT_BUTTON_RIGHT");
  });

  it("Swap alt with a main", () => {
    inGame.whenWePressOnKeyboard("D").weShouldTriggerTheButton("ALT_BUTTON_RIGHT");
    inGame.whenWePressOnKeyboard("R").weShouldTriggerTheButton("CYCLE_SHINY");
    inTheSettingMenu.whenCursorIsOnSetting("CYCLE_SHINY").iconDisplayedIs("KEY_R").weWantThisBindInstead("D").confirm();
    inGame.whenWePressOnKeyboard("D").weShouldTriggerTheButton("CYCLE_SHINY");
    inGame.whenWePressOnKeyboard("R").nothingShouldHappen();
  });

  it("multiple Swap alt with another main", () => {
    inGame.whenWePressOnKeyboard("D").weShouldTriggerTheButton("ALT_BUTTON_RIGHT");
    inGame.whenWePressOnKeyboard("R").weShouldTriggerTheButton("BUTTON_CYCLE_SHINY");
    inGame.whenWePressOnKeyboard("A").weShouldTriggerTheButton("ALT_BUTTON_LEFT");
    inGame.whenWePressOnKeyboard("F").weShouldTriggerTheButton("BUTTON_CYCLE_FORM");
    inTheSettingMenu
      .whenCursorIsOnSetting("BUTTON_CYCLE_SHINY")
      .iconDisplayedIs("KEY_R")
      .weWantThisBindInstead("D")
      .confirm();
    inGame.whenWePressOnKeyboard("D").weShouldTriggerTheButton("BUTTON_CYCLE_SHINY");
    inGame.whenWePressOnKeyboard("R").nothingShouldHappen();
    inGame.whenWePressOnKeyboard("A").weShouldTriggerTheButton("ALT_BUTTON_LEFT");
    inGame.whenWePressOnKeyboard("F").weShouldTriggerTheButton("BUTTON_CYCLE_FORM");
    inTheSettingMenu
      .whenCursorIsOnSetting("BUTTON_CYCLE_FORM")
      .iconDisplayedIs("KEY_F")
      .weWantThisBindInstead("R")
      .confirm();
    inGame.whenWePressOnKeyboard("D").weShouldTriggerTheButton("BUTTON_CYCLE_SHINY");
    inGame.whenWePressOnKeyboard("R").weShouldTriggerTheButton("BUTTON_CYCLE_FORM");
    inGame.whenWePressOnKeyboard("A").weShouldTriggerTheButton("ALT_BUTTON_LEFT");
    inGame.whenWePressOnKeyboard("F").nothingShouldHappen();
  });

  it("Swap alt with a key not binded yet", () => {
    inGame.whenWePressOnKeyboard("W").weShouldTriggerTheButton("ALT_BUTTON_UP");
    inGame.whenWePressOnKeyboard("B").nothingShouldHappen();
    inTheSettingMenu
      .whenCursorIsOnSetting("ALT_BUTTON_UP")
      .iconDisplayedIs("KEY_W")
      .weWantThisBindInstead("B")
      .confirm();
    inGame.whenWePressOnKeyboard("W").nothingShouldHappen();
    inGame.whenWePressOnKeyboard("B").weShouldTriggerTheButton("ALT_BUTTON_UP");
  });

  it("Delete blacklisted bind", () => {
    inGame.whenWePressOnKeyboard("LEFT").weShouldTriggerTheButton("BUTTON_LEFT");
    inTheSettingMenu.whenWeDelete(SettingKeyboard.BUTTON_LEFT).weCantDelete().iconDisplayedIs("KEY_ARROW_LEFT");
    inGame.whenWePressOnKeyboard("LEFT").weShouldTriggerTheButton("BUTTON_LEFT");
  });

  it("Delete bind", () => {
    inGame.whenWePressOnKeyboard("A").weShouldTriggerTheButton("ALT_BUTTON_LEFT");
    inTheSettingMenu.whenWeDelete(SettingKeyboard.ALT_BUTTON_LEFT).thereShouldBeNoIconAnymore();
    inGame.whenWePressOnKeyboard("A").nothingShouldHappen();
  });

  it("Delete bind then assign a not yet binded button", () => {
    inTheSettingMenu.whenWeDelete(SettingKeyboard.ALT_BUTTON_LEFT).thereShouldBeNoIconAnymore();
    inGame.whenWePressOnKeyboard("A").nothingShouldHappen();
    inGame.whenWePressOnKeyboard("B").nothingShouldHappen();
    inTheSettingMenu
      .whenCursorIsOnSetting("ALT_BUTTON_LEFT")
      .thereShouldBeNoIcon()
      .weWantThisBindInstead("B")
      .confirm();
    inGame.whenWePressOnKeyboard("A").nothingShouldHappen();
    inGame.whenWePressOnKeyboard("B").weShouldTriggerTheButton("ALT_BUTTON_LEFT");
  });
  it("swap 2 bind, than delete 1 bind than assign another bind", () => {
    inGame.whenWePressOnKeyboard("R").weShouldTriggerTheButton("BUTTON_CYCLE_SHINY");
    inGame.whenWePressOnKeyboard("F").weShouldTriggerTheButton("BUTTON_CYCLE_FORM");
    inGame.whenWePressOnKeyboard("W").weShouldTriggerTheButton("ALT_BUTTON_UP");
    inGame.whenWePressOnKeyboard("D").weShouldTriggerTheButton("ALT_BUTTON_RIGHT");
    inTheSettingMenu
      .whenCursorIsOnSetting("BUTTON_CYCLE_SHINY")
      .iconDisplayedIs("KEY_R")
      .weWantThisBindInstead("D")
      .confirm();
    inGame.whenWePressOnKeyboard("R").nothingShouldHappen();
    inGame.whenWePressOnKeyboard("F").weShouldTriggerTheButton("BUTTON_CYCLE_FORM");
    inGame.whenWePressOnKeyboard("W").weShouldTriggerTheButton("ALT_BUTTON_UP");
    inGame.whenWePressOnKeyboard("D").weShouldTriggerTheButton("BUTTON_CYCLE_SHINY");

    inTheSettingMenu
      .whenCursorIsOnSetting("BUTTON_CYCLE_FORM")
      .iconDisplayedIs("KEY_F")
      .weWantThisBindInstead("W")
      .confirm();
    inGame.whenWePressOnKeyboard("R").nothingShouldHappen();
    inGame.whenWePressOnKeyboard("F").nothingShouldHappen();
    inGame.whenWePressOnKeyboard("W").weShouldTriggerTheButton("BUTTON_CYCLE_FORM");
    inGame.whenWePressOnKeyboard("D").weShouldTriggerTheButton("BUTTON_CYCLE_SHINY");
    inGame.whenWePressOnKeyboard("A").weShouldTriggerTheButton("ALT_BUTTON_LEFT");

    inTheSettingMenu.whenWeDelete(SettingKeyboard.ALT_BUTTON_LEFT).thereShouldBeNoIconAnymore();
    inGame.whenWePressOnKeyboard("R").nothingShouldHappen();
    inGame.whenWePressOnKeyboard("F").nothingShouldHappen();
    inGame.whenWePressOnKeyboard("W").weShouldTriggerTheButton("BUTTON_CYCLE_FORM");
    inGame.whenWePressOnKeyboard("D").weShouldTriggerTheButton("BUTTON_CYCLE_SHINY");
    inGame.whenWePressOnKeyboard("S").weShouldTriggerTheButton("ALT_BUTTON_DOWN");
    inGame.whenWePressOnKeyboard("A").nothingShouldHappen();
    inGame.whenWePressOnKeyboard("B").nothingShouldHappen();

    inTheSettingMenu
      .whenCursorIsOnSetting("ALT_BUTTON_DOWN")
      .iconDisplayedIs("KEY_S")
      .weWantThisBindInstead("B")
      .confirm();
    inGame.whenWePressOnKeyboard("R").nothingShouldHappen();
    inGame.whenWePressOnKeyboard("F").nothingShouldHappen();
    inGame.whenWePressOnKeyboard("W").weShouldTriggerTheButton("BUTTON_CYCLE_FORM");
    inGame.whenWePressOnKeyboard("D").weShouldTriggerTheButton("BUTTON_CYCLE_SHINY");
    inGame.whenWePressOnKeyboard("S").nothingShouldHappen();
    inGame.whenWePressOnKeyboard("A").nothingShouldHappen();
    inGame.whenWePressOnKeyboard("B").weShouldTriggerTheButton("ALT_BUTTON_DOWN");
  });

  it("Delete bind then assign not already existing button", () => {
    inGame.whenWePressOnKeyboard("A").weShouldTriggerTheButton("ALT_BUTTON_LEFT");
    inGame.whenWePressOnKeyboard("B").nothingShouldHappen();

    inTheSettingMenu.whenWeDelete(SettingKeyboard.ALT_BUTTON_LEFT).thereShouldBeNoIconAnymore();
    inGame.whenWePressOnKeyboard("A").nothingShouldHappen();
    inGame.whenWePressOnKeyboard("B").nothingShouldHappen();

    inTheSettingMenu
      .whenCursorIsOnSetting("ALT_BUTTON_LEFT")
      .thereShouldBeNoIcon()
      .weWantThisBindInstead("B")
      .confirm();
    inGame.whenWePressOnKeyboard("A").nothingShouldHappen();
    inGame.whenWePressOnKeyboard("B").weShouldTriggerTheButton("ALT_BUTTON_LEFT");
  });

  it("change alt bind to not already existing button, than another one alt bind with another not already existing button", () => {
    inGame.whenWePressOnKeyboard("A").weShouldTriggerTheButton("ALT_BUTTON_LEFT");
    inGame.whenWePressOnKeyboard("D").weShouldTriggerTheButton("ALT_BUTTON_RIGHT");
    inGame.whenWePressOnKeyboard("B").nothingShouldHappen();
    inGame.whenWePressOnKeyboard("U").nothingShouldHappen();
    inTheSettingMenu
      .whenCursorIsOnSetting("ALT_BUTTON_LEFT")
      .iconDisplayedIs("KEY_A")
      .weWantThisBindInstead("B")
      .confirm();
    inGame.whenWePressOnKeyboard("A").nothingShouldHappen();
    inGame.whenWePressOnKeyboard("D").weShouldTriggerTheButton("ALT_BUTTON_RIGHT");
    inGame.whenWePressOnKeyboard("B").weShouldTriggerTheButton("ALT_BUTTON_LEFT");
    inGame.whenWePressOnKeyboard("U").nothingShouldHappen();
    inTheSettingMenu
      .whenCursorIsOnSetting("ALT_BUTTON_RIGHT")
      .iconDisplayedIs("KEY_D")
      .weWantThisBindInstead("U")
      .confirm();
    inGame.whenWePressOnKeyboard("A").nothingShouldHappen();
    inGame.whenWePressOnKeyboard("D").nothingShouldHappen();
    inGame.whenWePressOnKeyboard("B").weShouldTriggerTheButton("ALT_BUTTON_LEFT");
    inGame.whenWePressOnKeyboard("U").weShouldTriggerTheButton("ALT_BUTTON_RIGHT");
  });

  it("Swap multiple touch alt and main", () => {
    inGame.whenWePressOnKeyboard("UP").weShouldTriggerTheButton("BUTTON_UP");
    inGame.whenWePressOnKeyboard("RIGHT").weShouldTriggerTheButton("BUTTON_RIGHT");
    inGame.whenWePressOnKeyboard("W").weShouldTriggerTheButton("ALT_BUTTON_UP");
    inGame.whenWePressOnKeyboard("D").weShouldTriggerTheButton("ALT_BUTTON_RIGHT");
    inTheSettingMenu
      .whenCursorIsOnSetting("BUTTON_UP")
      .iconDisplayedIs("KEY_ARROW_UP")
      .weWantThisBindInstead("RIGHT")
      .weCantOverrideThisBind()
      .weCantAssignThisKey()
      .butLetsForceIt();
    inGame.whenWePressOnKeyboard("UP").weShouldTriggerTheButton("BUTTON_UP");
    inGame.whenWePressOnKeyboard("RIGHT").weShouldTriggerTheButton("BUTTON_RIGHT");
    inGame.whenWePressOnKeyboard("W").weShouldTriggerTheButton("ALT_BUTTON_UP");
    inGame.whenWePressOnKeyboard("D").weShouldTriggerTheButton("ALT_BUTTON_RIGHT");
    inTheSettingMenu
      .whenCursorIsOnSetting("ALT_BUTTON_UP")
      .iconDisplayedIs("KEY_W")
      .weWantThisBindInstead("D")
      .confirm();
    inGame.whenWePressOnKeyboard("UP").weShouldTriggerTheButton("BUTTON_UP");
    inGame.whenWePressOnKeyboard("RIGHT").weShouldTriggerTheButton("BUTTON_RIGHT");
    inGame.whenWePressOnKeyboard("W").nothingShouldHappen();
    inGame.whenWePressOnKeyboard("D").weShouldTriggerTheButton("ALT_BUTTON_UP");
    inTheSettingMenu
      .whenCursorIsOnSetting("ALT_BUTTON_UP")
      .iconDisplayedIs("KEY_D")
      .weWantThisBindInstead("W")
      .confirm();
    inGame.whenWePressOnKeyboard("UP").weShouldTriggerTheButton("BUTTON_UP");
    inGame.whenWePressOnKeyboard("RIGHT").weShouldTriggerTheButton("BUTTON_RIGHT");
    inGame.whenWePressOnKeyboard("W").weShouldTriggerTheButton("ALT_BUTTON_UP");
    inGame.whenWePressOnKeyboard("D").nothingShouldHappen();
  });

  it("Delete 2 bind then reassign one of them", () => {
    inGame.whenWePressOnKeyboard("A").weShouldTriggerTheButton("ALT_BUTTON_LEFT");
    inGame.whenWePressOnKeyboard("D").weShouldTriggerTheButton("ALT_BUTTON_RIGHT");

    inTheSettingMenu.whenWeDelete(SettingKeyboard.ALT_BUTTON_LEFT).thereShouldBeNoIconAnymore();
    inGame.whenWePressOnKeyboard("A").nothingShouldHappen();
    inGame.whenWePressOnKeyboard("D").weShouldTriggerTheButton("ALT_BUTTON_RIGHT");

    inTheSettingMenu.whenWeDelete(SettingKeyboard.ALT_BUTTON_RIGHT).thereShouldBeNoIconAnymore();
    inGame.whenWePressOnKeyboard("A").nothingShouldHappen();
    inGame.whenWePressOnKeyboard("D").nothingShouldHappen();

    inTheSettingMenu
      .whenCursorIsOnSetting("ALT_BUTTON_LEFT")
      .thereShouldBeNoIcon()
      .weWantThisBindInstead("A")
      .confirm();
    inGame.whenWePressOnKeyboard("A").weShouldTriggerTheButton("ALT_BUTTON_LEFT");
    inGame.whenWePressOnKeyboard("D").nothingShouldHappen();
  });

  it("test keyboard listener", () => {
    const keyDown = Phaser.Input.Keyboard.KeyCodes.S;
    const key = getKeyWithKeycode(config, keyDown) ?? "";
    const settingName = config.custom?.[key as keyof typeof config.custom];
    const buttonDown = config.settings[settingName as keyof typeof config.settings];
    expect(buttonDown).toEqual(Button.DOWN);
  });

  it("retrieve the correct icon for a given source", () => {
    inTheSettingMenu.whenCursorIsOnSetting("CYCLE_SHINY").iconDisplayedIs("KEY_R");
    inTheSettingMenu.whenCursorIsOnSetting("CYCLE_FORM").iconDisplayedIs("KEY_F");
    inGame.forTheSource("keyboard").forTheWantedBind("CYCLE_SHINY").weShouldSeeTheIcon("R");
    inGame.forTheSource("keyboard").forTheWantedBind("CYCLE_FORM").weShouldSeeTheIcon("F");
  });

  it("check the key displayed on confirm", () => {
    inGame.whenWePressOnKeyboard("ENTER").weShouldTriggerTheButton("BUTTON_SUBMIT");
    inGame.whenWePressOnKeyboard("UP").weShouldTriggerTheButton("BUTTON_UP");
    inGame.whenWePressOnKeyboard("DOWN").weShouldTriggerTheButton("BUTTON_DOWN");
    inGame.whenWePressOnKeyboard("LEFT").weShouldTriggerTheButton("BUTTON_LEFT");
    inGame.whenWePressOnKeyboard("RIGHT").weShouldTriggerTheButton("BUTTON_RIGHT");
    inGame.whenWePressOnKeyboard("ESC").weShouldTriggerTheButton("BUTTON_MENU");
    inGame.whenWePressOnKeyboard("HOME").nothingShouldHappen();
    inGame.whenWePressOnKeyboard("DELETE").nothingShouldHappen();
    inTheSettingMenu
      .whenCursorIsOnSetting("BUTTON_SUBMIT")
      .iconDisplayedIs("KEY_ENTER")
      .whenWeDelete()
      .iconDisplayedIs("KEY_ENTER");
    inTheSettingMenu
      .whenCursorIsOnSetting("BUTTON_UP")
      .iconDisplayedIs("KEY_ARROW_UP")
      .whenWeDelete()
      .iconDisplayedIs("KEY_ARROW_UP");
    inTheSettingMenu
      .whenCursorIsOnSetting("BUTTON_DOWN")
      .iconDisplayedIs("KEY_ARROW_DOWN")
      .whenWeDelete()
      .iconDisplayedIs("KEY_ARROW_DOWN");
    inTheSettingMenu
      .whenCursorIsOnSetting("BUTTON_LEFT")
      .iconDisplayedIs("KEY_ARROW_LEFT")
      .whenWeDelete()
      .iconDisplayedIs("KEY_ARROW_LEFT");
    inTheSettingMenu
      .whenCursorIsOnSetting("BUTTON_RIGHT")
      .iconDisplayedIs("KEY_ARROW_RIGHT")
      .whenWeDelete()
      .iconDisplayedIs("KEY_ARROW_RIGHT");
    inTheSettingMenu
      .whenCursorIsOnSetting("BUTTON_MENU")
      .iconDisplayedIs("KEY_ESC")
      .whenWeDelete()
      .iconDisplayedIs("KEY_ESC");
    inTheSettingMenu
      .whenCursorIsOnSetting("ALT_BUTTON_UP")
      .iconDisplayedIs("KEY_W")
      .whenWeDelete()
      .thereShouldBeNoIconAnymore();
    inTheSettingMenu
      .whenCursorIsOnSetting("ALT_BUTTON_UP")
      .thereShouldBeNoIcon()
      .weWantThisBindInstead("DELETE")
      .weCantAssignThisKey()
      .butLetsForceIt();
    inTheSettingMenu
      .whenCursorIsOnSetting("ALT_BUTTON_UP")
      .thereShouldBeNoIcon()
      .weWantThisBindInstead("HOME")
      .weCantAssignThisKey()
      .butLetsForceIt();
    inGame.whenWePressOnKeyboard("DELETE").nothingShouldHappen();
    inGame.whenWePressOnKeyboard("HOME").nothingShouldHappen();
    inGame.whenWePressOnKeyboard("W").nothingShouldHappen();
  });

  it("check to delete all the binds of an action", () => {
    inGame.whenWePressOnKeyboard("V").weShouldTriggerTheButton("BUTTON_CYCLE_TERA");
    inTheSettingMenu
      .whenCursorIsOnSetting("ALT_BUTTON_CYCLE_TERA")
      .thereShouldBeNoIcon()
      .weWantThisBindInstead("K")
      .confirm();
    inTheSettingMenu
      .whenCursorIsOnSetting("ALT_BUTTON_CYCLE_TERA")
      .iconDisplayedIs("KEY_K")
      .whenWeDelete()
      .thereShouldBeNoIconAnymore();
    inTheSettingMenu
      .whenCursorIsOnSetting("BUTTON_CYCLE_TERA")
      .iconDisplayedIs("KEY_V")
      .whenWeDelete()
      .thereShouldBeNoIconAnymore();
  });
});
