import { globalScene } from "#app/global-scene";
import { Button } from "#enums/buttons";
import { UiMode } from "#enums/ui-mode";
import { SettingKeyboard } from "#system/settings-keyboard";
import type { SettingsGamepadUiHandler } from "#ui/settings-gamepad-ui-handler";
import { truncateString } from "#utils/common";
import i18next from "i18next";

export enum SettingGamepad {
  Controller = "CONTROLLER",
  Gamepad_Support = "GAMEPAD_SUPPORT",
  Button_Up = "BUTTON_UP",
  Button_Down = "BUTTON_DOWN",
  Button_Left = "BUTTON_LEFT",
  Button_Right = "BUTTON_RIGHT",
  Button_Action = "BUTTON_ACTION",
  Button_Cancel = "BUTTON_CANCEL",
  Button_Menu = "BUTTON_MENU",
  Button_Stats = "BUTTON_STATS",
  Button_Cycle_Form = "BUTTON_CYCLE_FORM",
  Button_Cycle_Shiny = "BUTTON_CYCLE_SHINY",
  Button_Cycle_Gender = "BUTTON_CYCLE_GENDER",
  Button_Cycle_Ability = "BUTTON_CYCLE_ABILITY",
  Button_Cycle_Nature = "BUTTON_CYCLE_NATURE",
  Button_Cycle_Tera = "BUTTON_CYCLE_TERA",
  Button_Speed_Up = "BUTTON_SPEED_UP",
  Button_Slow_Down = "BUTTON_SLOW_DOWN",
  Button_Submit = "BUTTON_SUBMIT",
}

const pressAction = i18next.t("settings:pressActionToAssign");

export const settingGamepadOptions = {
  [SettingGamepad.Controller]: [i18next.t("settings:controllerDefault"), i18next.t("settings:controllerChange")],
  [SettingGamepad.Gamepad_Support]: [
    i18next.t("settings:gamepadSupportAuto"),
    i18next.t("settings:gamepadSupportDisabled"),
  ],
  [SettingGamepad.Button_Up]: [`KEY ${Button.UP.toString()}`, pressAction],
  [SettingGamepad.Button_Down]: [`KEY ${Button.DOWN.toString()}`, pressAction],
  [SettingGamepad.Button_Left]: [`KEY ${Button.LEFT.toString()}`, pressAction],
  [SettingGamepad.Button_Right]: [`KEY ${Button.RIGHT.toString()}`, pressAction],
  [SettingGamepad.Button_Action]: [`KEY ${Button.ACTION.toString()}`, pressAction],
  [SettingGamepad.Button_Cancel]: [`KEY ${Button.CANCEL.toString()}`, pressAction],
  [SettingGamepad.Button_Menu]: [`KEY ${Button.MENU.toString()}`, pressAction],
  [SettingGamepad.Button_Stats]: [`KEY ${Button.STATS.toString()}`, pressAction],
  [SettingGamepad.Button_Cycle_Form]: [`KEY ${Button.CYCLE_FORM.toString()}`, pressAction],
  [SettingGamepad.Button_Cycle_Shiny]: [`KEY ${Button.CYCLE_SHINY.toString()}`, pressAction],
  [SettingGamepad.Button_Cycle_Gender]: [`KEY ${Button.CYCLE_GENDER.toString()}`, pressAction],
  [SettingGamepad.Button_Cycle_Ability]: [`KEY ${Button.CYCLE_ABILITY.toString()}`, pressAction],
  [SettingGamepad.Button_Cycle_Nature]: [`KEY ${Button.CYCLE_NATURE.toString()}`, pressAction],
  [SettingGamepad.Button_Cycle_Tera]: [`KEY ${Button.CYCLE_TERA.toString()}`, pressAction],
  [SettingGamepad.Button_Speed_Up]: [`KEY ${Button.SPEED_UP.toString()}`, pressAction],
  [SettingGamepad.Button_Slow_Down]: [`KEY ${Button.SLOW_DOWN.toString()}`, pressAction],
  [SettingGamepad.Button_Submit]: [`KEY ${Button.SUBMIT.toString()}`, pressAction],
};

export const settingGamepadDefaults = {
  [SettingGamepad.Controller]: 0,
  [SettingGamepad.Gamepad_Support]: 0,
  [SettingGamepad.Button_Up]: 0,
  [SettingGamepad.Button_Down]: 0,
  [SettingGamepad.Button_Left]: 0,
  [SettingGamepad.Button_Right]: 0,
  [SettingGamepad.Button_Action]: 0,
  [SettingGamepad.Button_Cancel]: 0,
  [SettingGamepad.Button_Menu]: 0,
  [SettingGamepad.Button_Stats]: 0,
  [SettingGamepad.Button_Cycle_Form]: 0,
  [SettingGamepad.Button_Cycle_Shiny]: 0,
  [SettingGamepad.Button_Cycle_Gender]: 0,
  [SettingGamepad.Button_Cycle_Ability]: 0,
  [SettingGamepad.Button_Cycle_Nature]: 0,
  [SettingGamepad.Button_Cycle_Tera]: 0,
  [SettingGamepad.Button_Speed_Up]: 0,
  [SettingGamepad.Button_Slow_Down]: 0,
  [SettingGamepad.Button_Submit]: 0,
};

export const settingGamepadBlackList = [
  SettingKeyboard.Button_Up,
  SettingKeyboard.Button_Down,
  SettingKeyboard.Button_Left,
  SettingKeyboard.Button_Right,
];

export function setSettingGamepad(setting: SettingGamepad, value: number): boolean {
  switch (setting) {
    case SettingGamepad.Gamepad_Support:
      // if we change the value of the gamepad support, we call a method in the inputController to
      // activate or deactivate the controller listener
      globalScene.inputController.setGamepadSupport(settingGamepadOptions[setting][value] !== "Disabled");
      break;
    case SettingGamepad.Button_Action:
    case SettingGamepad.Button_Cancel:
    case SettingGamepad.Button_Menu:
    case SettingGamepad.Button_Stats:
    case SettingGamepad.Button_Cycle_Shiny:
    case SettingGamepad.Button_Cycle_Form:
    case SettingGamepad.Button_Cycle_Gender:
    case SettingGamepad.Button_Cycle_Ability:
    case SettingGamepad.Button_Cycle_Nature:
    case SettingGamepad.Button_Cycle_Tera:
    case SettingGamepad.Button_Speed_Up:
    case SettingGamepad.Button_Slow_Down:
    case SettingGamepad.Button_Submit:
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
    case SettingGamepad.Controller:
      if (value) {
        const gp = globalScene.inputController.getGamepadsName();
        if (globalScene.ui && gp) {
          const cancelHandler = () => {
            globalScene.ui.revertMode();
            (globalScene.ui.getHandler() as SettingsGamepadUiHandler).setOptionCursor(
              Object.values(SettingGamepad).indexOf(SettingGamepad.Controller),
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
