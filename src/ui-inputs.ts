import { globalScene } from "#app/global-scene";
import type { InputsController } from "#app/inputs-controller";
import { Button } from "#enums/buttons";
import { UiMode } from "#enums/ui-mode";
import { Setting, SettingKeys, settingIndex } from "#system/settings";
import { PokedexPageUiHandler } from "#ui/containers/pokedex-page-ui-handler";
import type { MessageUiHandler } from "#ui/handlers/message-ui-handler";
import { PokedexUiHandler } from "#ui/handlers/pokedex-ui-handler";
import { RunInfoUiHandler } from "#ui/handlers/run-info-ui-handler";
import { StarterSelectUiHandler } from "#ui/handlers/starter-select-ui-handler";
import { SettingsAudioUiHandler } from "#ui/settings-audio-ui-handler";
import { SettingsDisplayUiHandler } from "#ui/settings-display-ui-handler";
import { SettingsGamepadUiHandler } from "#ui/settings-gamepad-ui-handler";
import { SettingsKeyboardUiHandler } from "#ui/settings-keyboard-ui-handler";
import { SettingsUiHandler } from "#ui/settings-ui-handler";
import Phaser from "phaser";

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
      [Button.UP]: () => {},
      [Button.DOWN]: () => {},
      [Button.LEFT]: () => {},
      [Button.RIGHT]: () => {},
      [Button.SUBMIT]: () => {},
      [Button.ACTION]: () => {},
      [Button.CANCEL]: () => {},
      [Button.MENU]: () => {},
      [Button.STATS]: () => this.buttonStats(false),
      [Button.CYCLE_SHINY]: () => {},
      [Button.CYCLE_FORM]: () => {},
      [Button.CYCLE_GENDER]: () => {},
      [Button.CYCLE_ABILITY]: () => {},
      [Button.CYCLE_NATURE]: () => {},
      [Button.CYCLE_TERA]: () => this.buttonInfo(false),
      [Button.SPEED_UP]: () => {},
      [Button.SLOW_DOWN]: () => {},
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
      for (const p of globalScene.getEnemyField().filter(p => p?.isActive(true))) {
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
      // biome-ignore lint/suspicious/noFallthroughSwitchClause: falls through to show menu overlay
      case UiMode.MESSAGE: {
        const messageHandler = globalScene.ui.getHandler<MessageUiHandler>();
        if (!messageHandler.pendingPrompt || messageHandler.isTextAnimationInProgress()) {
          return;
        }
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
    const settingOptions = Setting[settingGameSpeed].options;
    let currentSetting = settingOptions.findIndex(item => item.value === globalScene.gameSpeed.toString());
    // if current setting is -1, then the current game speed is not a valid option, so default to index 5 (3x)
    if (currentSetting === -1) {
      currentSetting = 5;
    }
    let direction: number;
    if (up && globalScene.gameSpeed < 5) {
      direction = 1;
    } else if (!up && globalScene.gameSpeed > 1) {
      direction = -1;
    } else {
      return;
    }
    globalScene.gameData.saveSetting(
      SettingKeys.Game_Speed,
      Phaser.Math.Clamp(currentSetting + direction, 0, settingOptions.length - 1),
    );
    if (globalScene.ui?.getMode() === UiMode.SETTINGS) {
      (globalScene.ui.getHandler() as SettingsUiHandler).show([]);
    }
  }
}
