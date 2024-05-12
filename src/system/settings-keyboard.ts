import {SettingDefaults, SettingOptions} from "#app/system/settings";
import {Button} from "#app/enums/buttons";
import BattleScene from "#app/battle-scene";
import {SettingGamepad} from "#app/system/settings-gamepad";
import {Mode} from "#app/ui/ui";

export enum SettingKeyboard {
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
    }
    return true;

}