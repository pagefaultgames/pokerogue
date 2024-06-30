import {
  getIconForLatestInput,
  getSettingNameWithKeycode
} from "#app/configs/inputs/configHandler";
import {expect} from "vitest";
import {SettingKeyboard} from "#app/system/settings/settings-keyboard";

export class InGameManip {
  private config;
  private keycode;
  private settingName;
  private icon;
  private configs;
  private latestSource;
  private selectedDevice;

  constructor(configs, config, selectedDevice) {
    this.config = config;
    this.configs = configs;
    this.selectedDevice = selectedDevice;
    this.keycode = null;
    this.settingName = null;
    this.icon = null;
    this.latestSource = null;
  }

  whenWePressOnKeyboard(keycode) {
    this.keycode = Phaser.Input.Keyboard.KeyCodes[keycode.toUpperCase()];
    return this;
  }

  nothingShouldHappen() {
    const settingName = getSettingNameWithKeycode(this.config, this.keycode);
    expect(settingName).toEqual(-1);
    return this;
  }

  forTheWantedBind(settingName) {
    if (!settingName.includes("Button_")) {
      settingName = "Button_" + settingName;
    }
    this.settingName = SettingKeyboard[settingName];
    return this;
  }

  weShouldSeeTheIcon(icon) {
    if (!icon.includes("KEY_")) {
      icon = "KEY_" + icon;
    }
    this.icon = this.config.icons[icon];
    expect(getIconForLatestInput(this.configs, this.latestSource, this.selectedDevice, this.settingName)).toEqual(this.icon);
    return this;
  }

  forTheSource(source) {
    this.latestSource = source;
    return this;
  }

  normalizeSettingNameString(input) {
    // Convert the input string to lower case
    const lowerCasedInput = input.toLowerCase();

    // Replace underscores with spaces, capitalize the first letter of each word, and join them back with underscores
    const words = lowerCasedInput.split("_").map(word => word.charAt(0).toUpperCase() + word.slice(1));
    const result = words.join("_");

    return result;
  }

  weShouldTriggerTheButton(settingName) {
    if (!settingName.includes("Button_")) {
      settingName = "Button_" + settingName;
    }
    this.settingName = SettingKeyboard[this.normalizeSettingNameString(settingName)];
    expect(getSettingNameWithKeycode(this.config, this.keycode)).toEqual(this.settingName);
    return this;
  }
}
