import { getIconForLatestInput, getSettingNameWithKeycode } from "#inputs/config-handler";
import { SettingKeyboard } from "#system/settings-keyboard";
import type { InterfaceConfig, MappingSettingName, SelectedDevice } from "#types/configs/inputs";
import { toUpperSnakeCase } from "#utils/strings";
import { expect } from "vitest";

export class InGameManip {
  private readonly config: InterfaceConfig;
  private keycode: number | null;
  private settingName: string | null;
  private icon: string | null;
  private readonly configs;
  private latestSource: string | null;
  private readonly selectedDevice: SelectedDevice;

  constructor(configs: Record<string, InterfaceConfig>, config: InterfaceConfig, selectedDevice: SelectedDevice) {
    this.config = config;
    this.configs = configs;
    this.selectedDevice = selectedDevice;
    this.keycode = null;
    this.settingName = null;
    this.icon = null;
    this.latestSource = null;
  }

  whenWePressOnKeyboard(keycode: string) {
    this.keycode = Phaser.Input.Keyboard.KeyCodes[keycode.toUpperCase() as keyof typeof Phaser.Input.Keyboard.KeyCodes];
    return this;
  }

  nothingShouldHappen() {
    const settingName = getSettingNameWithKeycode(this.config, this.keycode!);
    expect(settingName).toEqual(-1);
    return this;
  }

  forTheWantedBind(settingName: string) {
    if (!settingName.includes("BUTTON_")) {
      settingName = "BUTTON_" + settingName;
    }
    this.settingName = SettingKeyboard[settingName];
    return this;
  }

  weShouldSeeTheIcon(icon: string) {
    if (!icon.includes("KEY_")) {
      icon = "KEY_" + icon;
    }
    this.icon = this.config.icons[icon as keyof typeof this.config.icons];
    expect(
      getIconForLatestInput(
        this.configs,
        this.latestSource!,
        this.selectedDevice,
        this.settingName as MappingSettingName,
      ),
    ).toEqual(this.icon);
    return this;
  }

  forTheSource(source: string) {
    this.latestSource = source;
    return this;
  }

  weShouldTriggerTheButton(settingName: string) {
    if (!settingName.includes("BUTTON_")) {
      settingName = "BUTTON_" + settingName;
    }
    this.settingName = SettingKeyboard[toUpperSnakeCase(settingName) as keyof typeof SettingKeyboard];
    expect(getSettingNameWithKeycode(this.config, this.keycode!)).toEqual(this.settingName);
    return this;
  }
}
