import { globalScene } from "#app/global-scene";
import { Button } from "#enums/buttons";
import { UiMode } from "#enums/ui-mode";
import type { SettingsKeyboardUiHandler } from "#ui/settings-keyboard-ui-handler";
import i18next from "i18next";

export enum SettingKeyboard {
  // Default_Layout = "DEFAULT_LAYOUT",
  BUTTON_UP = "BUTTON_UP",
  ALT_BUTTON_UP = "ALT_BUTTON_UP",
  BUTTON_DOWN = "BUTTON_DOWN",
  ALT_BUTTON_DOWN = "ALT_BUTTON_DOWN",
  BUTTON_LEFT = "BUTTON_LEFT",
  ALT_BUTTON_LEFT = "ALT_BUTTON_LEFT",
  BUTTON_RIGHT = "BUTTON_RIGHT",
  ALT_BUTTON_RIGHT = "ALT_BUTTON_RIGHT",
  BUTTON_ACTION = "BUTTON_ACTION",
  ALT_BUTTON_ACTION = "ALT_BUTTON_ACTION",
  BUTTON_CANCEL = "BUTTON_CANCEL",
  ALT_BUTTON_CANCEL = "ALT_BUTTON_CANCEL",
  BUTTON_MENU = "BUTTON_MENU",
  ALT_BUTTON_MENU = "ALT_BUTTON_MENU",
  BUTTON_STATS = "BUTTON_STATS",
  ALT_BUTTON_STATS = "ALT_BUTTON_STATS",
  BUTTON_CYCLE_FORM = "BUTTON_CYCLE_FORM",
  ALT_BUTTON_CYCLE_FORM = "ALT_BUTTON_CYCLE_FORM",
  BUTTON_CYCLE_SHINY = "BUTTON_CYCLE_SHINY",
  ALT_BUTTON_CYCLE_SHINY = "ALT_BUTTON_CYCLE_SHINY",
  BUTTON_CYCLE_GENDER = "BUTTON_CYCLE_GENDER",
  ALT_BUTTON_CYCLE_GENDER = "ALT_BUTTON_CYCLE_GENDER",
  BUTTON_CYCLE_ABILITY = "BUTTON_CYCLE_ABILITY",
  ALT_BUTTON_CYCLE_ABILITY = "ALT_BUTTON_CYCLE_ABILITY",
  BUTTON_CYCLE_NATURE = "BUTTON_CYCLE_NATURE",
  ALT_BUTTON_CYCLE_NATURE = "ALT_BUTTON_CYCLE_NATURE",
  BUTTON_CYCLE_TERA = "BUTTON_CYCLE_TERA",
  ALT_BUTTON_CYCLE_TERA = "ALT_BUTTON_CYCLE_TERA",
  BUTTON_SPEED_UP = "BUTTON_SPEED_UP",
  ALT_BUTTON_SPEED_UP = "ALT_BUTTON_SPEED_UP",
  BUTTON_SLOW_DOWN = "BUTTON_SLOW_DOWN",
  ALT_BUTTON_SLOW_DOWN = "ALT_BUTTON_SLOW_DOWN",
  BUTTON_SUBMIT = "BUTTON_SUBMIT",
  ALT_BUTTON_SUBMIT = "ALT_BUTTON_SUBMIT",
}

const pressAction = i18next.t("settings:pressToBind");

export const settingKeyboardOptions = {
  // [SettingKeyboard.Default_Layout]: ['Default'],
  [SettingKeyboard.BUTTON_UP]: [`KEY ${Button.UP.toString()}`, pressAction],
  [SettingKeyboard.BUTTON_DOWN]: [`KEY ${Button.DOWN.toString()}`, pressAction],
  [SettingKeyboard.ALT_BUTTON_UP]: [`KEY ${Button.UP.toString()}`, pressAction],
  [SettingKeyboard.BUTTON_LEFT]: [`KEY ${Button.LEFT.toString()}`, pressAction],
  [SettingKeyboard.BUTTON_RIGHT]: [`KEY ${Button.RIGHT.toString()}`, pressAction],
  [SettingKeyboard.BUTTON_ACTION]: [`KEY ${Button.ACTION.toString()}`, pressAction],
  [SettingKeyboard.BUTTON_MENU]: [`KEY ${Button.MENU.toString()}`, pressAction],
  [SettingKeyboard.BUTTON_SUBMIT]: [`KEY ${Button.SUBMIT.toString()}`, pressAction],
  [SettingKeyboard.ALT_BUTTON_DOWN]: [`KEY ${Button.DOWN.toString()}`, pressAction],
  [SettingKeyboard.ALT_BUTTON_LEFT]: [`KEY ${Button.LEFT.toString()}`, pressAction],
  [SettingKeyboard.ALT_BUTTON_RIGHT]: [`KEY ${Button.RIGHT.toString()}`, pressAction],
  [SettingKeyboard.ALT_BUTTON_ACTION]: [`KEY ${Button.ACTION.toString()}`, pressAction],
  [SettingKeyboard.BUTTON_CANCEL]: [`KEY ${Button.CANCEL.toString()}`, pressAction],
  [SettingKeyboard.ALT_BUTTON_CANCEL]: [`KEY ${Button.CANCEL.toString()}`, pressAction],
  [SettingKeyboard.ALT_BUTTON_MENU]: [`KEY ${Button.MENU.toString()}`, pressAction],
  [SettingKeyboard.BUTTON_STATS]: [`KEY ${Button.STATS.toString()}`, pressAction],
  [SettingKeyboard.ALT_BUTTON_STATS]: [`KEY ${Button.STATS.toString()}`, pressAction],
  [SettingKeyboard.BUTTON_CYCLE_FORM]: [`KEY ${Button.CYCLE_FORM.toString()}`, pressAction],
  [SettingKeyboard.ALT_BUTTON_CYCLE_FORM]: [`KEY ${Button.CYCLE_FORM.toString()}`, pressAction],
  [SettingKeyboard.BUTTON_CYCLE_SHINY]: [`KEY ${Button.CYCLE_SHINY.toString()}`, pressAction],
  [SettingKeyboard.ALT_BUTTON_CYCLE_SHINY]: [`KEY ${Button.CYCLE_SHINY.toString()}`, pressAction],
  [SettingKeyboard.BUTTON_CYCLE_GENDER]: [`KEY ${Button.CYCLE_GENDER.toString()}`, pressAction],
  [SettingKeyboard.ALT_BUTTON_CYCLE_GENDER]: [`KEY ${Button.CYCLE_GENDER.toString()}`, pressAction],
  [SettingKeyboard.BUTTON_CYCLE_ABILITY]: [`KEY ${Button.CYCLE_ABILITY.toString()}`, pressAction],
  [SettingKeyboard.ALT_BUTTON_CYCLE_ABILITY]: [`KEY ${Button.CYCLE_ABILITY.toString()}`, pressAction],
  [SettingKeyboard.BUTTON_CYCLE_NATURE]: [`KEY ${Button.CYCLE_NATURE.toString()}`, pressAction],
  [SettingKeyboard.ALT_BUTTON_CYCLE_NATURE]: [`KEY ${Button.CYCLE_NATURE.toString()}`, pressAction],
  [SettingKeyboard.BUTTON_CYCLE_TERA]: [`KEY ${Button.CYCLE_TERA.toString()}`, pressAction],
  [SettingKeyboard.ALT_BUTTON_CYCLE_TERA]: [`KEY ${Button.CYCLE_TERA.toString()}`, pressAction],
  [SettingKeyboard.BUTTON_SPEED_UP]: [`KEY ${Button.SPEED_UP.toString()}`, pressAction],
  [SettingKeyboard.ALT_BUTTON_SPEED_UP]: [`KEY ${Button.SPEED_UP.toString()}`, pressAction],
  [SettingKeyboard.BUTTON_SLOW_DOWN]: [`KEY ${Button.SLOW_DOWN.toString()}`, pressAction],
  [SettingKeyboard.ALT_BUTTON_SLOW_DOWN]: [`KEY ${Button.SLOW_DOWN.toString()}`, pressAction],
  [SettingKeyboard.ALT_BUTTON_SUBMIT]: [`KEY ${Button.SUBMIT.toString()}`, pressAction],
};

export const settingKeyboardDefaults = {
  // [SettingKeyboard.Default_Layout]: 0,
  [SettingKeyboard.BUTTON_UP]: 0,
  [SettingKeyboard.BUTTON_DOWN]: 0,
  [SettingKeyboard.BUTTON_LEFT]: 0,
  [SettingKeyboard.BUTTON_RIGHT]: 0,
  [SettingKeyboard.BUTTON_ACTION]: 0,
  [SettingKeyboard.BUTTON_MENU]: 0,
  [SettingKeyboard.BUTTON_SUBMIT]: 0,

  [SettingKeyboard.ALT_BUTTON_UP]: 0,
  [SettingKeyboard.ALT_BUTTON_DOWN]: 0,
  [SettingKeyboard.ALT_BUTTON_LEFT]: 0,
  [SettingKeyboard.ALT_BUTTON_RIGHT]: 0,
  [SettingKeyboard.ALT_BUTTON_ACTION]: 0,
  [SettingKeyboard.BUTTON_CANCEL]: 0,
  [SettingKeyboard.ALT_BUTTON_CANCEL]: 0,
  [SettingKeyboard.ALT_BUTTON_MENU]: 0,
  [SettingKeyboard.BUTTON_STATS]: 0,
  [SettingKeyboard.ALT_BUTTON_STATS]: 0,
  [SettingKeyboard.BUTTON_CYCLE_FORM]: 0,
  [SettingKeyboard.ALT_BUTTON_CYCLE_FORM]: 0,
  [SettingKeyboard.BUTTON_CYCLE_SHINY]: 0,
  [SettingKeyboard.ALT_BUTTON_CYCLE_SHINY]: 0,
  [SettingKeyboard.BUTTON_CYCLE_GENDER]: 0,
  [SettingKeyboard.ALT_BUTTON_CYCLE_GENDER]: 0,
  [SettingKeyboard.BUTTON_CYCLE_ABILITY]: 0,
  [SettingKeyboard.ALT_BUTTON_CYCLE_ABILITY]: 0,
  [SettingKeyboard.BUTTON_CYCLE_NATURE]: 0,
  [SettingKeyboard.ALT_BUTTON_CYCLE_NATURE]: 0,
  [SettingKeyboard.BUTTON_CYCLE_TERA]: 0,
  [SettingKeyboard.ALT_BUTTON_CYCLE_TERA]: 0,
  [SettingKeyboard.BUTTON_SPEED_UP]: 0,
  [SettingKeyboard.ALT_BUTTON_SPEED_UP]: 0,
  [SettingKeyboard.BUTTON_SLOW_DOWN]: 0,
  [SettingKeyboard.ALT_BUTTON_SLOW_DOWN]: 0,
  [SettingKeyboard.ALT_BUTTON_SUBMIT]: 0,
};

export const settingKeyboardBlackList = [
  SettingKeyboard.BUTTON_SUBMIT,
  SettingKeyboard.BUTTON_MENU,
  SettingKeyboard.BUTTON_ACTION,
  SettingKeyboard.BUTTON_CANCEL,
  SettingKeyboard.BUTTON_UP,
  SettingKeyboard.BUTTON_DOWN,
  SettingKeyboard.BUTTON_LEFT,
  SettingKeyboard.BUTTON_RIGHT,
];

export function setSettingKeyboard(setting: SettingKeyboard, value: number): boolean {
  switch (setting) {
    case SettingKeyboard.BUTTON_UP:
    case SettingKeyboard.BUTTON_DOWN:
    case SettingKeyboard.BUTTON_LEFT:
    case SettingKeyboard.BUTTON_RIGHT:
    case SettingKeyboard.BUTTON_ACTION:
    case SettingKeyboard.BUTTON_CANCEL:
    case SettingKeyboard.BUTTON_MENU:
    case SettingKeyboard.BUTTON_STATS:
    case SettingKeyboard.BUTTON_CYCLE_SHINY:
    case SettingKeyboard.BUTTON_CYCLE_FORM:
    case SettingKeyboard.BUTTON_CYCLE_GENDER:
    case SettingKeyboard.BUTTON_CYCLE_ABILITY:
    case SettingKeyboard.BUTTON_CYCLE_NATURE:
    case SettingKeyboard.BUTTON_CYCLE_TERA:
    case SettingKeyboard.BUTTON_SPEED_UP:
    case SettingKeyboard.BUTTON_SLOW_DOWN:
    case SettingKeyboard.ALT_BUTTON_UP:
    case SettingKeyboard.ALT_BUTTON_DOWN:
    case SettingKeyboard.ALT_BUTTON_LEFT:
    case SettingKeyboard.ALT_BUTTON_RIGHT:
    case SettingKeyboard.ALT_BUTTON_ACTION:
    case SettingKeyboard.ALT_BUTTON_CANCEL:
    case SettingKeyboard.ALT_BUTTON_MENU:
    case SettingKeyboard.ALT_BUTTON_STATS:
    case SettingKeyboard.ALT_BUTTON_CYCLE_SHINY:
    case SettingKeyboard.ALT_BUTTON_CYCLE_FORM:
    case SettingKeyboard.ALT_BUTTON_CYCLE_GENDER:
    case SettingKeyboard.ALT_BUTTON_CYCLE_ABILITY:
    case SettingKeyboard.ALT_BUTTON_CYCLE_NATURE:
    case SettingKeyboard.ALT_BUTTON_CYCLE_TERA:
    case SettingKeyboard.ALT_BUTTON_SPEED_UP:
    case SettingKeyboard.ALT_BUTTON_SLOW_DOWN:
    case SettingKeyboard.ALT_BUTTON_SUBMIT:
      if (value && globalScene.ui) {
        const cancelHandler = (success = false): boolean => {
          globalScene.ui.revertMode();
          (globalScene.ui.getHandler() as SettingsKeyboardUiHandler).updateBindings();
          return success;
        };
        globalScene.ui.setOverlayMode(UiMode.KEYBOARD_BINDING, {
          target: setting,
          cancelHandler,
        });
      }
      break;
  }
  return true;
}
