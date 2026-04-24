import { audioManager } from "#app/global-audio-manager";
import { globalScene } from "#app/global-scene";
import type { InputsController } from "#app/inputs-controller";
import { isDev } from "#constants/app-constants";
import { SETTINGS_UI_MODES } from "#constants/ui-constants";
import { Button } from "#enums/buttons";
import { GameSpeed } from "#enums/game-speed";
import { UiMode } from "#enums/ui-mode";
import { settings } from "#system/settings-manager";
import { SettingsAudioUiHandler } from "#ui/audio-settings-ui-handler";
import { SettingsDisplayUiHandler } from "#ui/display-settings-ui-handler";
import { SettingsGamepadUiHandler } from "#ui/gamepad-settings-ui-handler";
import { GeneralSettingsUiHandler } from "#ui/general-settings-ui-handler";
import { GameChallengesUiHandler } from "#ui/handlers/challenges-select-ui-handler";
import { SettingsKeyboardUiHandler } from "#ui/keyboard-settings-ui-handler";
import type { MessageUiHandler } from "#ui/message-ui-handler";
import { PokedexPageUiHandler } from "#ui/pokedex-page-ui-handler";
import { PokedexUiHandler } from "#ui/pokedex-ui-handler";
import { RunInfoUiHandler } from "#ui/run-info-ui-handler";
import { StarterSelectUiHandler } from "#ui/starter-select-ui-handler";
import type Phaser from "phaser";

type ActionKeys = Record<Button, () => void>;

export class UiInputs {
  private events: Phaser.Events.EventEmitter;
  private readonly inputsController: InputsController;

  constructor(inputsController: InputsController) {
    this.inputsController = inputsController;
    this.init();
  }

  private init(): void {
    this.events = this.inputsController.events;
    this.listenInputs();
  }

  detectInputMethod(evt): void {
    if (evt.controller_type === "keyboard") {
      //if the touch property is present and defined, then this is a simulated keyboard event from the touch screen
      if (Object.hasOwn(evt, "isTouch") && evt.isTouch) {
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
        if (!Object.hasOwn(actions, event.button)) {
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
        if (!Object.hasOwn(actions, event.button)) {
          return;
        }
        actions[event.button]();
      },
      this,
    );
  }

  doVibration(inputSuccess: boolean, vibrationLength: number): void {
    if (inputSuccess && settings.general.enableVibration && typeof navigator.vibrate !== "undefined") {
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
      [Button.DEV_CUSTOM]: () => {
        if (isDev) {
          import("./dev-function").then(m => m.customDevFunction());
        }
      },
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
      [Button.DEV_CUSTOM]: () => {},
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
    for (const pkmn of globalScene.getField().filter(p => p?.isActive(true))) {
      pkmn.toggleStats(pressed);
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
    if (settings.display.showMovesetFlyout) {
      for (const pkmn of globalScene.getEnemyField().filter(p => p?.isActive(true))) {
        pkmn.toggleFlyout(pressed);
      }
    }

    if (settings.display.showArenaFlyout) {
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
        audioManager.playSound("ui/select");
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
      GameChallengesUiHandler,
      GeneralSettingsUiHandler,
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

  private buttonSpeedChange(up = true): void {
    const { ui } = globalScene;

    if (SETTINGS_UI_MODES.includes(ui?.getMode())) {
      return;
    }

    const gameSpeeds = Object.values(GameSpeed);
    const gameSpeedIndex = gameSpeeds.indexOf(settings.general.gameSpeed);
    const lastIndex = gameSpeeds.length - 1;
    const newIndex = up ? Math.min(gameSpeedIndex + 1, lastIndex) : Math.max(gameSpeedIndex - 1, 0);

    settings.update("general", "gameSpeed", gameSpeeds[newIndex]);
  }
}
