import {SettingDefaults, SettingOptions} from "#app/system/settings";
import {Button} from "#app/enums/buttons";
import BattleScene from "#app/battle-scene";
import {Mode} from "#app/ui/ui";
import SettingsKeyboardUiHandler from "#app/ui/settings/settings-keyboard-ui-handler";

export enum SettingKeyboard {
    Default_Layout = "DEFAULT_LAYOUT",
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
    Button_Cycle_Variant = "BUTTON_CYCLE_VARIANT",
    Button_Speed_Up = "BUTTON_SPEED_UP",
    Button_Slow_Down = "BUTTON_SLOW_DOWN",
    Button_Submit = "BUTTON_SUBMIT",
}

export const settingKeyboardOptions: SettingOptions = {
    [SettingKeyboard.Default_Layout]: ['Default', 'Change'],
    [SettingKeyboard.Button_Up]: [`KEY ${Button.UP.toString()}`, 'Change'],
    [SettingKeyboard.Button_Down]: [`KEY ${Button.DOWN.toString()}`, 'Change'],
    [SettingKeyboard.Button_Left]: [`KEY ${Button.LEFT.toString()}`, 'Change'],
    [SettingKeyboard.Button_Right]: [`KEY ${Button.RIGHT.toString()}`, 'Change'],
    [SettingKeyboard.Button_Action]: [`KEY ${Button.ACTION.toString()}`, 'Change'],
    [SettingKeyboard.Button_Cancel]: [`KEY ${Button.CANCEL.toString()}`, 'Change'],
    [SettingKeyboard.Button_Menu]: [`KEY ${Button.MENU.toString()}`, 'Change'],
    [SettingKeyboard.Button_Stats]: [`KEY ${Button.STATS.toString()}`, 'Change'],
    [SettingKeyboard.Button_Cycle_Form]: [`KEY ${Button.CYCLE_FORM.toString()}`, 'Change'],
    [SettingKeyboard.Button_Cycle_Shiny]: [`KEY ${Button.CYCLE_SHINY.toString()}`, 'Change'],
    [SettingKeyboard.Button_Cycle_Gender]: [`KEY ${Button.CYCLE_GENDER.toString()}`, 'Change'],
    [SettingKeyboard.Button_Cycle_Ability]: [`KEY ${Button.CYCLE_ABILITY.toString()}`, 'Change'],
    [SettingKeyboard.Button_Cycle_Nature]: [`KEY ${Button.CYCLE_NATURE.toString()}`, 'Change'],
    [SettingKeyboard.Button_Cycle_Variant]: [`KEY ${Button.CYCLE_VARIANT.toString()}`, 'Change'],
    [SettingKeyboard.Button_Speed_Up]: [`KEY ${Button.SPEED_UP.toString()}`, 'Change'],
    [SettingKeyboard.Button_Slow_Down]: [`KEY ${Button.SLOW_DOWN.toString()}`, 'Change'],
    [SettingKeyboard.Button_Submit]: [`KEY ${Button.SUBMIT.toString()}`, 'Change']
};

export const settingKeyboardDefaults: SettingDefaults = {
    [SettingKeyboard.Default_Layout]: 0,
    [SettingKeyboard.Button_Up]: 0,
    [SettingKeyboard.Button_Down]: 0,
    [SettingKeyboard.Button_Left]: 0,
    [SettingKeyboard.Button_Right]: 0,
    [SettingKeyboard.Button_Action]: 0,
    [SettingKeyboard.Button_Cancel]: 0,
    [SettingKeyboard.Button_Menu]: 0,
    [SettingKeyboard.Button_Stats]: 0,
    [SettingKeyboard.Button_Cycle_Form]: 0,
    [SettingKeyboard.Button_Cycle_Shiny]: 0,
    [SettingKeyboard.Button_Cycle_Gender]: 0,
    [SettingKeyboard.Button_Cycle_Ability]: 0,
    [SettingKeyboard.Button_Cycle_Nature]: 0,
    [SettingKeyboard.Button_Cycle_Variant]: 0,
    [SettingKeyboard.Button_Speed_Up]: 0,
    [SettingKeyboard.Button_Slow_Down]: 0,
    [SettingKeyboard.Button_Submit]: 0,
};


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
            if (value) {
                if (scene.ui) {
                    const cancelHandler = (success: boolean = false) : boolean => {
                        scene.ui.revertMode();
                        (scene.ui.getHandler() as SettingsKeyboardUiHandler).updateBindings();
                        return success;
                    }
                    scene.ui.setOverlayMode(Mode.KEYBOARD_BINDING, {
                        target: setting,
                        cancelHandler: cancelHandler,
                    })
                }
            }
            break;
        case SettingKeyboard.Default_Layout:
            if (value && scene.ui) {
                    const cancelHandler = () => {
                        scene.ui.revertMode();
                        (scene.ui.getHandler() as SettingsKeyboardUiHandler).setOptionCursor(Object.values(SettingKeyboard).indexOf(SettingKeyboard.Default_Layout), 0, true);
                        (scene.ui.getHandler() as SettingsKeyboardUiHandler).updateBindings();
                        return false;
                    };
                    const changeKeyboardHandler = (keyboardLayout: string) => {
                        scene.inputController.setChosenKeyboardLayout(keyboardLayout);
                        cancelHandler();
                        return true;
                    };
                    scene.ui.setOverlayMode(Mode.OPTION_SELECT, {
                        options: [{
                            label: 'azerty',
                            handler: changeKeyboardHandler,
                        }, {
                            label: 'qwerty',
                            handler: changeKeyboardHandler,
                        }]
                    });
                    return false;
            }
    }
    return true;

}