import {Button} from "#app/enums/buttons";
import BattleScene from "#app/battle-scene";
import {Mode} from "#app/ui/ui";
import SettingsKeyboardUiHandler from "#app/ui/settings/settings-keyboard-ui-handler";

export enum SettingKeyboard {
    // Default_Layout = "DEFAULT_LAYOUT",
    Button_Up = "BUTTON_UP",
    Alt_Button_Up = "ALT_BUTTON_UP",
    Button_Down = "BUTTON_DOWN",
    Alt_Button_Down = "ALT_BUTTON_DOWN",
    Button_Left = "BUTTON_LEFT",
    Alt_Button_Left = "ALT_BUTTON_LEFT",
    Button_Right = "BUTTON_RIGHT",
    Alt_Button_Right = "ALT_BUTTON_RIGHT",
    Button_Action = "BUTTON_ACTION",
    Alt_Button_Action = "ALT_BUTTON_ACTION",
    Button_Cancel = "BUTTON_CANCEL",
    Alt_Button_Cancel = "ALT_BUTTON_CANCEL",
    Button_Menu = "BUTTON_MENU",
    Alt_Button_Menu = "ALT_BUTTON_MENU",
    Button_Stats = "BUTTON_STATS",
    Alt_Button_Stats = "ALT_BUTTON_STATS",
    Button_Cycle_Form = "BUTTON_CYCLE_FORM",
    Alt_Button_Cycle_Form = "ALT_BUTTON_CYCLE_FORM",
    Button_Cycle_Shiny = "BUTTON_CYCLE_SHINY",
    Alt_Button_Cycle_Shiny = "ALT_BUTTON_CYCLE_SHINY",
    Button_Cycle_Gender = "BUTTON_CYCLE_GENDER",
    Alt_Button_Cycle_Gender = "ALT_BUTTON_CYCLE_GENDER",
    Button_Cycle_Ability = "BUTTON_CYCLE_ABILITY",
    Alt_Button_Cycle_Ability = "ALT_BUTTON_CYCLE_ABILITY",
    Button_Cycle_Nature = "BUTTON_CYCLE_NATURE",
    Alt_Button_Cycle_Nature = "ALT_BUTTON_CYCLE_NATURE",
    Button_Cycle_Variant = "BUTTON_CYCLE_VARIANT",
    Alt_Button_Cycle_Variant = "ALT_BUTTON_CYCLE_VARIANT",
    Button_Speed_Up = "BUTTON_SPEED_UP",
    Alt_Button_Speed_Up = "ALT_BUTTON_SPEED_UP",
    Button_Slow_Down = "BUTTON_SLOW_DOWN",
    Alt_Button_Slow_Down = "ALT_BUTTON_SLOW_DOWN",
    Button_Submit = "BUTTON_SUBMIT",
    Alt_Button_Submit = "ALT_BUTTON_SUBMIT",
}

const pressAction = "Press action to assign";

export const settingKeyboardOptions = {
  // [SettingKeyboard.Default_Layout]: ['Default'],
  [SettingKeyboard.Button_Up]: [`KEY ${Button.UP.toString()}`, pressAction],
  [SettingKeyboard.Button_Down]: [`KEY ${Button.DOWN.toString()}`, pressAction],
  [SettingKeyboard.Alt_Button_Up]: [`KEY ${Button.UP.toString()}`, pressAction],
  [SettingKeyboard.Button_Left]: [`KEY ${Button.LEFT.toString()}`, pressAction],
  [SettingKeyboard.Button_Right]: [`KEY ${Button.RIGHT.toString()}`, pressAction],
  [SettingKeyboard.Button_Action]: [`KEY ${Button.ACTION.toString()}`, pressAction],
  [SettingKeyboard.Button_Menu]: [`KEY ${Button.MENU.toString()}`, pressAction],
  [SettingKeyboard.Button_Submit]: [`KEY ${Button.SUBMIT.toString()}`, pressAction],
  [SettingKeyboard.Alt_Button_Down]: [`KEY ${Button.DOWN.toString()}`, pressAction],
  [SettingKeyboard.Alt_Button_Left]: [`KEY ${Button.LEFT.toString()}`, pressAction],
  [SettingKeyboard.Alt_Button_Right]: [`KEY ${Button.RIGHT.toString()}`, pressAction],
  [SettingKeyboard.Alt_Button_Action]: [`KEY ${Button.ACTION.toString()}`, pressAction],
  [SettingKeyboard.Button_Cancel]: [`KEY ${Button.CANCEL.toString()}`, pressAction],
  [SettingKeyboard.Alt_Button_Cancel]: [`KEY ${Button.CANCEL.toString()}`, pressAction],
  [SettingKeyboard.Alt_Button_Menu]: [`KEY ${Button.MENU.toString()}`, pressAction],
  [SettingKeyboard.Button_Stats]: [`KEY ${Button.STATS.toString()}`, pressAction],
  [SettingKeyboard.Alt_Button_Stats]: [`KEY ${Button.STATS.toString()}`, pressAction],
  [SettingKeyboard.Button_Cycle_Form]: [`KEY ${Button.CYCLE_FORM.toString()}`, pressAction],
  [SettingKeyboard.Alt_Button_Cycle_Form]: [`KEY ${Button.CYCLE_FORM.toString()}`, pressAction],
  [SettingKeyboard.Button_Cycle_Shiny]: [`KEY ${Button.CYCLE_SHINY.toString()}`, pressAction],
  [SettingKeyboard.Alt_Button_Cycle_Shiny]: [`KEY ${Button.CYCLE_SHINY.toString()}`, pressAction],
  [SettingKeyboard.Button_Cycle_Gender]: [`KEY ${Button.CYCLE_GENDER.toString()}`, pressAction],
  [SettingKeyboard.Alt_Button_Cycle_Gender]: [`KEY ${Button.CYCLE_GENDER.toString()}`, pressAction],
  [SettingKeyboard.Button_Cycle_Ability]: [`KEY ${Button.CYCLE_ABILITY.toString()}`, pressAction],
  [SettingKeyboard.Alt_Button_Cycle_Ability]: [`KEY ${Button.CYCLE_ABILITY.toString()}`, pressAction],
  [SettingKeyboard.Button_Cycle_Nature]: [`KEY ${Button.CYCLE_NATURE.toString()}`, pressAction],
  [SettingKeyboard.Alt_Button_Cycle_Nature]: [`KEY ${Button.CYCLE_NATURE.toString()}`, pressAction],
  [SettingKeyboard.Button_Cycle_Variant]: [`KEY ${Button.V.toString()}`, pressAction],
  [SettingKeyboard.Alt_Button_Cycle_Variant]: [`KEY ${Button.V.toString()}`, pressAction],
  [SettingKeyboard.Button_Speed_Up]: [`KEY ${Button.SPEED_UP.toString()}`, pressAction],
  [SettingKeyboard.Alt_Button_Speed_Up]: [`KEY ${Button.SPEED_UP.toString()}`, pressAction],
  [SettingKeyboard.Button_Slow_Down]: [`KEY ${Button.SLOW_DOWN.toString()}`, pressAction],
  [SettingKeyboard.Alt_Button_Slow_Down]: [`KEY ${Button.SLOW_DOWN.toString()}`, pressAction],
  [SettingKeyboard.Alt_Button_Submit]: [`KEY ${Button.SUBMIT.toString()}`, pressAction],
};

export const settingKeyboardDefaults = {
  // [SettingKeyboard.Default_Layout]: 0,
  [SettingKeyboard.Button_Up]: 0,
  [SettingKeyboard.Button_Down]: 0,
  [SettingKeyboard.Button_Left]: 0,
  [SettingKeyboard.Button_Right]: 0,
  [SettingKeyboard.Button_Action]: 0,
  [SettingKeyboard.Button_Menu]: 0,
  [SettingKeyboard.Button_Submit]: 0,

  [SettingKeyboard.Alt_Button_Up]: 0,
  [SettingKeyboard.Alt_Button_Down]: 0,
  [SettingKeyboard.Alt_Button_Left]: 0,
  [SettingKeyboard.Alt_Button_Right]: 0,
  [SettingKeyboard.Alt_Button_Action]: 0,
  [SettingKeyboard.Button_Cancel]: 0,
  [SettingKeyboard.Alt_Button_Cancel]: 0,
  [SettingKeyboard.Alt_Button_Menu]: 0,
  [SettingKeyboard.Button_Stats]: 0,
  [SettingKeyboard.Alt_Button_Stats]: 0,
  [SettingKeyboard.Button_Cycle_Form]: 0,
  [SettingKeyboard.Alt_Button_Cycle_Form]: 0,
  [SettingKeyboard.Button_Cycle_Shiny]: 0,
  [SettingKeyboard.Alt_Button_Cycle_Shiny]: 0,
  [SettingKeyboard.Button_Cycle_Gender]: 0,
  [SettingKeyboard.Alt_Button_Cycle_Gender]: 0,
  [SettingKeyboard.Button_Cycle_Ability]: 0,
  [SettingKeyboard.Alt_Button_Cycle_Ability]: 0,
  [SettingKeyboard.Button_Cycle_Nature]: 0,
  [SettingKeyboard.Alt_Button_Cycle_Nature]: 0,
  [SettingKeyboard.Button_Cycle_Variant]: 0,
  [SettingKeyboard.Alt_Button_Cycle_Variant]: 0,
  [SettingKeyboard.Button_Speed_Up]: 0,
  [SettingKeyboard.Alt_Button_Speed_Up]: 0,
  [SettingKeyboard.Button_Slow_Down]: 0,
  [SettingKeyboard.Alt_Button_Slow_Down]: 0,
  [SettingKeyboard.Alt_Button_Submit]: 0,
};

export const settingKeyboardBlackList = [
  SettingKeyboard.Button_Submit,
  SettingKeyboard.Button_Menu,
  SettingKeyboard.Button_Action,
  SettingKeyboard.Button_Cancel,
  SettingKeyboard.Button_Up,
  SettingKeyboard.Button_Down,
  SettingKeyboard.Button_Left,
  SettingKeyboard.Button_Right,
];


export function setSettingKeyboard(scene: BattleScene, setting: SettingKeyboard, value: integer): boolean {
  switch (setting) {
  case SettingKeyboard.Button_Up:
  case SettingKeyboard.Button_Down:
  case SettingKeyboard.Button_Left:
  case SettingKeyboard.Button_Right:
  case SettingKeyboard.Button_Action:
  case SettingKeyboard.Button_Cancel:
  case SettingKeyboard.Button_Menu:
  case SettingKeyboard.Button_Stats:
  case SettingKeyboard.Button_Cycle_Shiny:
  case SettingKeyboard.Button_Cycle_Form:
  case SettingKeyboard.Button_Cycle_Gender:
  case SettingKeyboard.Button_Cycle_Ability:
  case SettingKeyboard.Button_Cycle_Nature:
  case SettingKeyboard.Button_Cycle_Variant:
  case SettingKeyboard.Button_Speed_Up:
  case SettingKeyboard.Button_Slow_Down:
  case SettingKeyboard.Alt_Button_Up:
  case SettingKeyboard.Alt_Button_Down:
  case SettingKeyboard.Alt_Button_Left:
  case SettingKeyboard.Alt_Button_Right:
  case SettingKeyboard.Alt_Button_Action:
  case SettingKeyboard.Alt_Button_Cancel:
  case SettingKeyboard.Alt_Button_Menu:
  case SettingKeyboard.Alt_Button_Stats:
  case SettingKeyboard.Alt_Button_Cycle_Shiny:
  case SettingKeyboard.Alt_Button_Cycle_Form:
  case SettingKeyboard.Alt_Button_Cycle_Gender:
  case SettingKeyboard.Alt_Button_Cycle_Ability:
  case SettingKeyboard.Alt_Button_Cycle_Nature:
  case SettingKeyboard.Alt_Button_Cycle_Variant:
  case SettingKeyboard.Alt_Button_Speed_Up:
  case SettingKeyboard.Alt_Button_Slow_Down:
  case SettingKeyboard.Alt_Button_Submit:
    if (value) {
      if (scene.ui) {
        const cancelHandler = (success: boolean = false) : boolean => {
          scene.ui.revertMode();
          (scene.ui.getHandler() as SettingsKeyboardUiHandler).updateBindings();
          return success;
        };
        scene.ui.setOverlayMode(Mode.KEYBOARD_BINDING, {
          target: setting,
          cancelHandler: cancelHandler,
        });
      }
    }
    break;
        // case SettingKeyboard.Default_Layout:
        //     if (value && scene.ui) {
        //             const cancelHandler = () => {
        //                 scene.ui.revertMode();
        //                 (scene.ui.getHandler() as SettingsKeyboardUiHandler).setOptionCursor(Object.values(SettingKeyboard).indexOf(SettingKeyboard.Default_Layout), 0, true);
        //                 (scene.ui.getHandler() as SettingsKeyboardUiHandler).updateBindings();
        //                 return false;
        //             };
        //             const changeKeyboardHandler = (keyboardLayout: string) => {
        //                 scene.inputController.setChosenKeyboardLayout(keyboardLayout);
        //                 cancelHandler();
        //                 return true;
        //             };
        //             scene.ui.setOverlayMode(Mode.OPTION_SELECT, {
        //                 options: [{
        //                     label: 'Default',
        //                     handler: changeKeyboardHandler,
        //                 }]
        //             });
        //             return false;
        //     }
  }
  return true;

}
