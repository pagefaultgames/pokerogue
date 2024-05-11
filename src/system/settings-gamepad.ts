import BattleScene from "../battle-scene";
import {SettingDefaults, SettingOptions} from "./settings";
import SettingsGamepadUiHandler from "../ui/settings-gamepad-ui-handler";
import {Mode} from "#app/ui/ui";
import {truncateString} from "../utils";
import {Button} from "../enums/buttons";

export enum SettingGamepad {
    Default_Controller = "DEFAULT_CONTROLLER",
    Gamepad_Support = "GAMEPAD_SUPPORT",
    Swap_A_and_B = "SWAP_A_B", // Swaps which gamepad button handles ACTION and CANCEL
    Button_Action = "BUTTON_ACTION",
    Button_Cancel = "BUTTON_CANCEL",
    Button_Menu = "BUTTON_MENU",
    Button_Stats = "BUTTON_STATS",
    Button_Cycle_Shiny = "BUTTON_CYCLE_SHINY",
    Button_Cycle_Form = "BUTTON_CYCLE_FORM",
    Button_Cycle_Gender = "BUTTON_CYCLE_GENDER",
    Button_Cycle_Ability = "BUTTON_CYCLE_ABILITY",
    Button_Cycle_Nature = "BUTTON_CYCLE_NATURE",
    Button_Cycle_Variant = "BUTTON_CYCLE_VARIANT",
    Button_Speed_Up = "BUTTON_SPEED_UP",
    Button_Slow_Down = "BUTTON_SLOW_DOWN",
}

export const settingGamepadOptions: SettingOptions = {
    [SettingGamepad.Default_Controller]: ['Default', 'Change'],
    [SettingGamepad.Gamepad_Support]: ['Auto', 'Disabled'],
    [SettingGamepad.Swap_A_and_B]: ['Enabled', 'Disabled'],
    [SettingGamepad.Button_Action]: [`KEY ${Button.ACTION.toString()}`, 'Change'],
    [SettingGamepad.Button_Cancel]: [`KEY ${Button.CANCEL.toString()}`, 'Change'],
    [SettingGamepad.Button_Menu]: [`KEY ${Button.MENU.toString()}`, 'Change'],
    [SettingGamepad.Button_Stats]: [`KEY ${Button.STATS.toString()}`, 'Change'],
    [SettingGamepad.Button_Cycle_Shiny]: [`KEY ${Button.CYCLE_SHINY.toString()}`, 'Change'],
    [SettingGamepad.Button_Cycle_Form]: [`KEY ${Button.CYCLE_FORM.toString()}`, 'Change'],
    [SettingGamepad.Button_Cycle_Gender]: [`KEY ${Button.CYCLE_GENDER.toString()}`, 'Change'],
    [SettingGamepad.Button_Cycle_Ability]: [`KEY ${Button.CYCLE_ABILITY.toString()}`, 'Change'],
    [SettingGamepad.Button_Cycle_Nature]: [`KEY ${Button.CYCLE_NATURE.toString()}`, 'Change'],
    [SettingGamepad.Button_Cycle_Variant]: [`KEY ${Button.CYCLE_VARIANT.toString()}`, 'Change'],
    [SettingGamepad.Button_Speed_Up]: [`KEY ${Button.SPEED_UP.toString()}`, 'Change'],
    [SettingGamepad.Button_Slow_Down]: [`KEY ${Button.SLOW_DOWN.toString()}`, 'Change']
};

export const settingGamepadDefaults: SettingDefaults = {
    [SettingGamepad.Default_Controller]: 0,
    [SettingGamepad.Gamepad_Support]: 0,
    [SettingGamepad.Swap_A_and_B]: 1, // Set to 'Disabled' by default
    [SettingGamepad.Button_Action]: 0,
    [SettingGamepad.Button_Cancel]: 0,
    [SettingGamepad.Button_Menu]: 0,
    [SettingGamepad.Button_Stats]: 0,
    [SettingGamepad.Button_Cycle_Shiny]: 0,
    [SettingGamepad.Button_Cycle_Form]: 0,
    [SettingGamepad.Button_Cycle_Gender]: 0,
    [SettingGamepad.Button_Cycle_Ability]: 0,
    [SettingGamepad.Button_Cycle_Nature]: 0,
    [SettingGamepad.Button_Cycle_Variant]: 0,
    [SettingGamepad.Button_Speed_Up]: 0,
    [SettingGamepad.Button_Slow_Down]: 0,
};

export const noOptionsCursors: Array<SettingGamepad> = [
    SettingGamepad.Button_Action,
    SettingGamepad.Button_Cancel,
    SettingGamepad.Button_Menu,
    SettingGamepad.Button_Stats,
    SettingGamepad.Button_Cycle_Shiny,
    SettingGamepad.Button_Cycle_Form,
    SettingGamepad.Button_Cycle_Gender,
    SettingGamepad.Button_Cycle_Ability,
    SettingGamepad.Button_Cycle_Nature,
    SettingGamepad.Button_Cycle_Variant,
    SettingGamepad.Button_Speed_Up,
    SettingGamepad.Button_Slow_Down,
];

export function setSettingGamepad(scene: BattleScene, setting: SettingGamepad, value: integer): boolean {
    switch (setting) {
        case SettingGamepad.Gamepad_Support:
            // if we change the value of the gamepad support, we call a method in the inputController to
            // activate or deactivate the controller listener
            scene.inputController.setGamepadSupport(settingGamepadOptions[setting][value] !== 'Disabled');
            break;
        case SettingGamepad.Swap_A_and_B:
            scene.abSwapped = settingGamepadOptions[setting][value] !== 'Disabled';
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
        case SettingGamepad.Button_Cycle_Variant:
        case SettingGamepad.Button_Speed_Up:
        case SettingGamepad.Button_Slow_Down:
            if (value) {
                if (scene.ui) {
                    const cancelHandler = () => {
                        scene.ui.revertMode();
                        return false;
                    };
                    scene.ui.setOverlayMode(Mode.GAMEPAD_BINDING, {
                        target: setting,
                        cancelHandler: cancelHandler,
                    });
                }
            }
            break;
        case SettingGamepad.Default_Controller:
            if (value) {
                const gp = scene.inputController.getGamepadsName();
                if (scene.ui && gp) {
                    const cancelHandler = () => {
                        scene.ui.revertMode();
                        (scene.ui.getHandler() as SettingsGamepadUiHandler).setOptionCursor(Object.values(SettingGamepad).indexOf(SettingGamepad.Default_Controller), 0, true);
                        return false;
                    };
                    const changeGamepadHandler = (gamepad: string) => {
                        scene.inputController.setChosenGamepad(gamepad);
                        cancelHandler();
                        return true;
                    };
                    scene.ui.setOverlayMode(Mode.OPTION_SELECT, {
                        options: [...gp.map((g) => ({
                            label: truncateString(g, 30),
                            handler: () => changeGamepadHandler(g)
                        })), {
                            label: 'Cancel',
                            handler: cancelHandler,
                        }]
                    });
                    return false;
                }
            }
            break;
    }

    return true;
}
