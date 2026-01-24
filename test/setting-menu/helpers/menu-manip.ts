import {
  assign,
  canIAssignThisKey,
  canIDeleteThisKey,
  canIOverrideThisSetting,
  deleteBind,
  getIconWithKeycode,
  getIconWithSettingName,
  getKeyWithKeycode,
  getKeyWithSettingName,
  getSettingNameWithKeycode,
} from "#inputs/config-handler";
import { SettingKeyboard } from "#system/settings-keyboard";
import type { KeyboardConfig } from "#types/configs/inputs";
import { expect } from "vitest";

export class MenuManip {
  private readonly config: Required<KeyboardConfig>;
  private settingName?: SettingKeyboard;
  private keycode?: number;
  private iconDisplayed?: string;

  constructor(config: KeyboardConfig) {
    this.config = config as Required<KeyboardConfig>;
  }

  // TODO: Review this
  convertNameToButtonString(input: SettingKeyboard) {
    if (input.startsWith("ALT_BUTTON")) {
      // Bang is fine as we already match on `_`
      return input.split("_").pop()!.toUpperCase();
    }

    const parts = input.split("_");

    const result = parts
      .slice(1)
      .map(part => part.toUpperCase())
      .join("_");

    return result;
  }

  whenCursorIsOnSetting(settingName: string) {
    if (!settingName.includes("BUTTON_")) {
      settingName = "BUTTON_" + settingName;
    }
    this.settingName = SettingKeyboard[settingName as keyof typeof SettingKeyboard];
    return this;
  }

  iconDisplayedIs(icon: string) {
    if (!icon.toUpperCase().includes("KEY_")) {
      icon = "KEY_" + icon.toUpperCase();
    }
    this.iconDisplayed = this.config.icons[icon as keyof typeof this.config.icons];
    expect(getIconWithSettingName(this.config, this.settingName)).toEqual(this.iconDisplayed);
    return this;
  }

  thereShouldBeNoIconAnymore() {
    const icon = getIconWithSettingName(this.config, this.settingName);
    expect(icon === undefined).toEqual(true);
    return this;
  }

  thereShouldBeNoIcon() {
    return this.thereShouldBeNoIconAnymore();
  }

  nothingShouldHappen() {
    const settingName = getSettingNameWithKeycode(this.config, this.keycode);
    expect(settingName).toEqual(-1);
    return this;
  }

  weWantThisBindInstead(keycode: string) {
    this.keycode = Phaser.Input.Keyboard.KeyCodes[keycode as keyof typeof Phaser.Input.Keyboard.KeyCodes];
    const icon = getIconWithKeycode(this.config, this.keycode);
    const key = getKeyWithKeycode(this.config, this.keycode)!; // TODO: is this bang correct?
    const _keys = key.toLowerCase().split("_");
    const iconIdentifier = _keys.at(-1);
    expect(icon?.toLowerCase()).toContain(iconIdentifier);
    return this;
  }

  whenWeDelete(settingName?: SettingKeyboard) {
    this.settingName = settingName ?? this.settingName;
    // const key = getKeyWithSettingName(this.config, this.settingName);
    deleteBind(this.config, this.settingName);
    // expect(this.config.custom[key]).toEqual(-1);
    return this;
  }

  whenWeTryToDelete(settingName?: SettingKeyboard) {
    this.settingName = settingName ?? this.settingName;
    deleteBind(this.config, this.settingName);
    return this;
  }

  confirmAssignment() {
    assign(this.config, this.settingName!, this.keycode!);
  }

  butLetsForceIt() {
    this.confirm();
  }

  confirm() {
    assign(this.config, this.settingName!, this.keycode!);
  }

  weCantAssignThisKey() {
    const key = getKeyWithKeycode(this.config, this.keycode);
    expect(canIAssignThisKey(this.config, key)).toEqual(false);
    return this;
  }

  weCantOverrideThisBind() {
    expect(canIOverrideThisSetting(this.config, this.settingName)).toEqual(false);
    return this;
  }

  weCantDelete() {
    const key = getKeyWithSettingName(this.config, this.settingName);
    expect(canIDeleteThisKey(this.config, key)).toEqual(false);
    return this;
  }
}
