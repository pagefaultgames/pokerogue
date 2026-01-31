import { globalScene } from "#app/global-scene";
import { Button } from "#enums/buttons";
import { UiMode } from "#enums/ui-mode";
import { SettingKeyboard } from "#system/settings-keyboard";
import type { SettingsGamepadUiHandler } from "#ui/settings-gamepad-ui-handler";
import { truncateString } from "#utils/common";
import i18next from "i18next";

export enum SettingGamepad {
  CONTROLLER = "CONTROLLER",
  GAMEPAD_SUPPORT = "GAMEPAD_SUPPORT",
  BUTTON_UP = "BUTTON_UP",
  BUTTON_DOWN = "BUTTON_DOWN",
  BUTTON_LEFT = "BUTTON_LEFT",
  BUTTON_RIGHT = "BUTTON_RIGHT",
  BUTTON_ACTION = "BUTTON_ACTION",
  BUTTON_CANCEL = "BUTTON_CANCEL",
  BUTTON_MENU = "BUTTON_MENU",
  BUTTON_STATS = "BUTTON_STATS",
  BUTTON_CYCLE_FORM = "BUTTON_CYCLE_FORM",
  BUTTON_CYCLE_SHINY = "BUTTON_CYCLE_SHINY",
  BUTTON_CYCLE_GENDER = "BUTTON_CYCLE_GENDER",
  BUTTON_CYCLE_ABILITY = "BUTTON_CYCLE_ABILITY",
  BUTTON_CYCLE_NATURE = "BUTTON_CYCLE_NATURE",
  BUTTON_CYCLE_TERA = "BUTTON_CYCLE_TERA",
  BUTTON_SPEED_UP = "BUTTON_SPEED_UP",
  BUTTON_SLOW_DOWN = "BUTTON_SLOW_DOWN",
  BUTTON_SUBMIT = "BUTTON_SUBMIT",
}

const pressAction = i18next.t("settings:pressActionToAssign");

export const settingGamepadOptions = {
  [SettingGamepad.CONTROLLER]: [i18next.t("settings:controllerDefault"), i18next.t("settings:controllerChange")],
  [SettingGamepad.GAMEPAD_SUPPORT]: [
    i18next.t("settings:gamepadSupportAuto"),
    i18next.t("settings:gamepadSupportDisabled"),
  ],
  [SettingGamepad.BUTTON_UP]: [`KEY ${Button.UP.toString()}`, pressAction],
  [SettingGamepad.BUTTON_DOWN]: [`KEY ${Button.DOWN.toString()}`, pressAction],
  [SettingGamepad.BUTTON_LEFT]: [`KEY ${Button.LEFT.toString()}`, pressAction],
  [SettingGamepad.BUTTON_RIGHT]: [`KEY ${Button.RIGHT.toString()}`, pressAction],
  [SettingGamepad.BUTTON_ACTION]: [`KEY ${Button.ACTION.toString()}`, pressAction],
  [SettingGamepad.BUTTON_CANCEL]: [`KEY ${Button.CANCEL.toString()}`, pressAction],
  [SettingGamepad.BUTTON_MENU]: [`KEY ${Button.MENU.toString()}`, pressAction],
  [SettingGamepad.BUTTON_STATS]: [`KEY ${Button.STATS.toString()}`, pressAction],
  [SettingGamepad.BUTTON_CYCLE_FORM]: [`KEY ${Button.CYCLE_FORM.toString()}`, pressAction],
  [SettingGamepad.BUTTON_CYCLE_SHINY]: [`KEY ${Button.CYCLE_SHINY.toString()}`, pressAction],
  [SettingGamepad.BUTTON_CYCLE_GENDER]: [`KEY ${Button.CYCLE_GENDER.toString()}`, pressAction],
  [SettingGamepad.BUTTON_CYCLE_ABILITY]: [`KEY ${Button.CYCLE_ABILITY.toString()}`, pressAction],
  [SettingGamepad.BUTTON_CYCLE_NATURE]: [`KEY ${Button.CYCLE_NATURE.toString()}`, pressAction],
  [SettingGamepad.BUTTON_CYCLE_TERA]: [`KEY ${Button.CYCLE_TERA.toString()}`, pressAction],
  [SettingGamepad.BUTTON_SPEED_UP]: [`KEY ${Button.SPEED_UP.toString()}`, pressAction],
  [SettingGamepad.BUTTON_SLOW_DOWN]: [`KEY ${Button.SLOW_DOWN.toString()}`, pressAction],
  [SettingGamepad.BUTTON_SUBMIT]: [`KEY ${Button.SUBMIT.toString()}`, pressAction],
};

export const settingGamepadDefaults = {
  [SettingGamepad.CONTROLLER]: 0,
  [SettingGamepad.GAMEPAD_SUPPORT]: 0,
  [SettingGamepad.BUTTON_UP]: 0,
  [SettingGamepad.BUTTON_DOWN]: 0,
  [SettingGamepad.BUTTON_LEFT]: 0,
  [SettingGamepad.BUTTON_RIGHT]: 0,
  [SettingGamepad.BUTTON_ACTION]: 0,
  [SettingGamepad.BUTTON_CANCEL]: 0,
  [SettingGamepad.BUTTON_MENU]: 0,
  [SettingGamepad.BUTTON_STATS]: 0,
  [SettingGamepad.BUTTON_CYCLE_FORM]: 0,
  [SettingGamepad.BUTTON_CYCLE_SHINY]: 0,
  [SettingGamepad.BUTTON_CYCLE_GENDER]: 0,
  [SettingGamepad.BUTTON_CYCLE_ABILITY]: 0,
  [SettingGamepad.BUTTON_CYCLE_NATURE]: 0,
  [SettingGamepad.BUTTON_CYCLE_TERA]: 0,
  [SettingGamepad.BUTTON_SPEED_UP]: 0,
  [SettingGamepad.BUTTON_SLOW_DOWN]: 0,
  [SettingGamepad.BUTTON_SUBMIT]: 0,
};

export const settingGamepadBlackList = [
  SettingKeyboard.BUTTON_UP,
  SettingKeyboard.BUTTON_DOWN,
  SettingKeyboard.BUTTON_LEFT,
  SettingKeyboard.BUTTON_RIGHT,
];

export function setSettingGamepad(setting: SettingGamepad, value: number): boolean {
  switch (setting) {
    case SettingGamepad.GAMEPAD_SUPPORT:
      // if we change the value of the gamepad support, we call a method in the inputController to
      // activate or deactivate the controller listener
      globalScene.inputController.setGamepadSupport(settingGamepadOptions[setting][value] !== "Disabled");
      break;
    case SettingGamepad.BUTTON_ACTION:
    case SettingGamepad.BUTTON_CANCEL:
    case SettingGamepad.BUTTON_MENU:
    case SettingGamepad.BUTTON_STATS:
    case SettingGamepad.BUTTON_CYCLE_SHINY:
    case SettingGamepad.BUTTON_CYCLE_FORM:
    case SettingGamepad.BUTTON_CYCLE_GENDER:
    case SettingGamepad.BUTTON_CYCLE_ABILITY:
    case SettingGamepad.BUTTON_CYCLE_NATURE:
    case SettingGamepad.BUTTON_CYCLE_TERA:
    case SettingGamepad.BUTTON_SPEED_UP:
    case SettingGamepad.BUTTON_SLOW_DOWN:
    case SettingGamepad.BUTTON_SUBMIT:
      if (value && globalScene.ui) {
        const cancelHandler = (success = false): boolean => {
          globalScene.ui.revertMode();
          (globalScene.ui.getHandler() as SettingsGamepadUiHandler).updateBindings();
          return success;
        };
        globalScene.ui.setOverlayMode(UiMode.GAMEPAD_BINDING, {
          target: setting,
          cancelHandler,
        });
      }
      break;
    case SettingGamepad.CONTROLLER:
      if (value) {
        const gp = globalScene.inputController.getGamepadsName();
        if (globalScene.ui && gp) {
          const cancelHandler = () => {
            globalScene.ui.revertMode();
            (globalScene.ui.getHandler() as SettingsGamepadUiHandler).setOptionCursor(
              Object.values(SettingGamepad).indexOf(SettingGamepad.CONTROLLER),
              0,
              true,
            );
            (globalScene.ui.getHandler() as SettingsGamepadUiHandler).updateBindings();
            return false;
          };
          const changeGamepadHandler = (gamepad: string) => {
            globalScene.inputController.setChosenGamepad(gamepad);
            cancelHandler();
            return true;
          };
          globalScene.ui.setOverlayMode(UiMode.OPTION_SELECT, {
            options: [
              ...gp.map((g: string) => ({
                label: truncateString(g, 30), // Truncate the gamepad name for display
                handler: () => changeGamepadHandler(g),
              })),
              {
                label: i18next.t("settings:cancelControllerChoice"),
                handler: cancelHandler,
              },
            ],
          });
          return false;
        }
      }
      break;
  }

  return true;
}
