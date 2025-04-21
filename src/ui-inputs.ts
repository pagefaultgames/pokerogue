import type Phaser from "phaser";
import { UiMode } from "#enums/ui-mode";
import type { InputsController } from "./inputs-controller";
import type MessageUiHandler from "./ui/message-ui-handler";
import StarterSelectUiHandler from "./ui/starter-select-ui-handler";
import { Setting, SettingKeys, settingIndex } from "./system/settings/settings";
import SettingsUiHandler from "./ui/settings/settings-ui-handler";
import { Button } from "#enums/buttons";
import SettingsGamepadUiHandler from "./ui/settings/settings-gamepad-ui-handler";
import SettingsKeyboardUiHandler from "#app/ui/settings/settings-keyboard-ui-handler";
import { globalScene } from "#app/global-scene";
import SettingsDisplayUiHandler from "./ui/settings/settings-display-ui-handler";
import SettingsAudioUiHandler from "./ui/settings/settings-audio-ui-handler";
import RunInfoUiHandler from "./ui/run-info-ui-handler";
import PokedexUiHandler from "./ui/pokedex-ui-handler";
import PokedexPageUiHandler from "./ui/pokedex-page-ui-handler";

type ActionKeys = Record<Button, () => void>;

export class UiInputs {
  private events: Phaser.Events.EventEmitter;
  private inputsController: InputsController;

  constructor(inputsController: InputsController) {
    this.inputsController = inputsController;
    this.init();
  }

  init(): void {
    this.events = this.inputsController.events;
    this.listenInputs();
  }

  detectInputMethod(evt): void {
    if (evt.controller_type === "keyboard") {
      //if the touch property is present and defined, then this is a simulated keyboard event from the touch screen
      if (evt.hasOwnProperty("isTouch") && evt.isTouch) {
        globalScene.inputMethod = "touch";
      } else {
        globalScene.inputMethod = "keyboard";
      }
    } else if (evt.controller_type === "gamepad") {
      globalScene.inputMethod = "gamepad";
    }
  }

  listenInputs(): void {
    this.events.on(
      "input_down",
      event => {
        this.detectInputMethod(event);

        const actions = this.getActionsKeyDown();
        if (!actions.hasOwnProperty(event.button)) {
          return;
        }
        actions[event.button]();
      },
      this,
    );

    this.events.on(
      "input_up",
      event => {
        const actions = this.getActionsKeyUp();
        if (!actions.hasOwnProperty(event.button)) {
          return;
        }
        actions[event.button]();
      },
      this,
    );
  }

  doVibration(inputSuccess: boolean, vibrationLength: number): void {
    if (inputSuccess && globalScene.enableVibration && typeof navigator.vibrate !== "undefined") {
      navigator.vibrate(vibrationLength);
    }
  }

  getActionsKeyDown(): ActionKeys {
    const actions: ActionKeys = {
      [Button.UP]: () => this.buttonDirection(Button.UP),
      [Button.DOWN]: () => this.buttonDirection(Button.DOWN),
      [Button.LEFT]: () => this.buttonDirection(Button.LEFT),
      [Button.RIGHT]: () => this.buttonDirection(Button.RIGHT),
      [Button.SUBMIT]: () => this.buttonTouch(),
      [Button.ACTION]: () => this.buttonAb(Button.ACTION),
      [Button.CANCEL]: () => this.buttonAb(Button.CANCEL),
      [Button.MENU]: () => this.buttonMenu(),
      [Button.STATS]: () => this.buttonGoToFilter(Button.STATS),
      [Button.CYCLE_SHINY]: () => this.buttonCycleOption(Button.CYCLE_SHINY),
      [Button.CYCLE_FORM]: () => this.buttonCycleOption(Button.CYCLE_FORM),
      [Button.CYCLE_GENDER]: () => this.buttonCycleOption(Button.CYCLE_GENDER),
      [Button.CYCLE_ABILITY]: () => this.buttonCycleOption(Button.CYCLE_ABILITY),
      [Button.CYCLE_NATURE]: () => this.buttonCycleOption(Button.CYCLE_NATURE),
      [Button.CYCLE_TERA]: () => this.buttonCycleOption(Button.CYCLE_TERA),
      [Button.SPEED_UP]: () => this.buttonSpeedChange(),
      [Button.SLOW_DOWN]: () => this.buttonSpeedChange(false),
    };
    return actions;
  }

  getActionsKeyUp(): ActionKeys {
    const actions: ActionKeys = {
      [Button.UP]: () => undefined,
      [Button.DOWN]: () => undefined,
      [Button.LEFT]: () => undefined,
      [Button.RIGHT]: () => undefined,
      [Button.SUBMIT]: () => undefined,
      [Button.ACTION]: () => undefined,
      [Button.CANCEL]: () => undefined,
      [Button.MENU]: () => undefined,
      [Button.STATS]: () => this.buttonStats(false),
      [Button.CYCLE_SHINY]: () => undefined,
      [Button.CYCLE_FORM]: () => undefined,
      [Button.CYCLE_GENDER]: () => undefined,
      [Button.CYCLE_ABILITY]: () => undefined,
      [Button.CYCLE_NATURE]: () => undefined,
      [Button.CYCLE_TERA]: () => this.buttonInfo(false),
      [Button.SPEED_UP]: () => undefined,
      [Button.SLOW_DOWN]: () => undefined,
    };
    return actions;
  }

  buttonDirection(direction: Button): void {
    const inputSuccess = globalScene.ui.processInput(direction);
    const vibrationLength = 5;
    this.doVibration(inputSuccess, vibrationLength);
  }

  buttonAb(button: Button): void {
    globalScene.ui.processInput(button);
  }

  buttonTouch(): void {
    globalScene.ui.processInput(Button.SUBMIT) || globalScene.ui.processInput(Button.ACTION);
  }

  buttonStats(pressed = true): void {
    // allow access to Button.STATS as a toggle for other elements
    for (const t of globalScene.getInfoToggles(true)) {
      t.toggleInfo(pressed);
    }
    // handle normal pokemon battle ui
    for (const p of globalScene.getField().filter(p => p?.isActive(true))) {
      p.toggleStats(pressed);
    }
  }

  buttonGoToFilter(button: Button): void {
    const whitelist = [StarterSelectUiHandler, PokedexUiHandler, PokedexPageUiHandler];
    const uiHandler = globalScene.ui?.getHandler();
    if (whitelist.some(handler => uiHandler instanceof handler)) {
      globalScene.ui.processInput(button);
    } else {
      this.buttonStats(true);
    }
  }

  buttonInfo(pressed = true): void {
    if (globalScene.showMovesetFlyout) {
      for (const p of globalScene.getField().filter(p => p?.isActive(true))) {
        p.toggleFlyout(pressed);
      }
    }

    if (globalScene.showArenaFlyout) {
      globalScene.ui.processInfoButton(pressed);
    }
  }

  buttonMenu(): void {
    if (globalScene.disableMenu) {
      return;
    }
    switch (globalScene.ui?.getMode()) {
      case UiMode.MESSAGE:
        const messageHandler = globalScene.ui.getHandler<MessageUiHandler>();
        if (!messageHandler.pendingPrompt || messageHandler.isTextAnimationInProgress()) {
          return;
        }
      case UiMode.TITLE:
      case UiMode.COMMAND:
      case UiMode.MODIFIER_SELECT:
      case UiMode.MYSTERY_ENCOUNTER:
        globalScene.ui.setOverlayMode(UiMode.MENU);
        break;
      case UiMode.STARTER_SELECT:
      case UiMode.POKEDEX_PAGE:
        this.buttonTouch();
        break;
      case UiMode.MENU:
        globalScene.ui.revertMode();
        globalScene.playSound("ui/select");
        break;
      default:
        return;
    }
  }

  buttonCycleOption(button: Button): void {
    const whitelist = [
      StarterSelectUiHandler,
      PokedexUiHandler,
      PokedexPageUiHandler,
      SettingsUiHandler,
      RunInfoUiHandler,
      SettingsDisplayUiHandler,
      SettingsAudioUiHandler,
      SettingsGamepadUiHandler,
      SettingsKeyboardUiHandler,
    ];
    const uiHandler = globalScene.ui?.getHandler();
    if (whitelist.some(handler => uiHandler instanceof handler)) {
      globalScene.ui.processInput(button);
    } else if (button === Button.CYCLE_TERA) {
      this.buttonInfo(true);
    }
  }

  buttonSpeedChange(up = true): void {
    const settingGameSpeed = settingIndex(SettingKeys.Game_Speed);
    if (up && globalScene.gameSpeed < 5) {
      globalScene.gameData.saveSetting(
        SettingKeys.Game_Speed,
        Setting[settingGameSpeed].options.findIndex(item => item.label === `${globalScene.gameSpeed}x`) + 1,
      );
      if (globalScene.ui?.getMode() === UiMode.SETTINGS) {
        (globalScene.ui.getHandler() as SettingsUiHandler).show([]);
      }
    } else if (!up && globalScene.gameSpeed > 1) {
      globalScene.gameData.saveSetting(
        SettingKeys.Game_Speed,
        Math.max(
          Setting[settingGameSpeed].options.findIndex(item => item.label === `${globalScene.gameSpeed}x`) - 1,
          0,
        ),
      );
      if (globalScene.ui?.getMode() === UiMode.SETTINGS) {
        (globalScene.ui.getHandler() as SettingsUiHandler).show([]);
      }
    }
  }
}
