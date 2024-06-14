import Phaser from "phaser";
import {Mode} from "./ui/ui";
import {InputsController} from "./inputs-controller";
import MessageUiHandler from "./ui/message-ui-handler";
import StarterSelectUiHandler from "./ui/starter-select-ui-handler";
import {Setting, settingOptions} from "./system/settings";
import SettingsUiHandler from "./ui/settings-ui-handler";
import {Button} from "./enums/buttons";

export interface ActionKeys {
    [key in Button]: () => void;
}

export class UiInputs {
  private scene: Phaser.Scene;
  private events: Phaser.Events;
  private inputsController: InputsController;

  constructor(scene: Phaser.Scene, inputsController: InputsController) {
    this.scene = scene;
    this.inputsController = inputsController;
    this.init();
  }

  init(): void {
    this.events = this.inputsController.events;
    this.listenInputs();
  }

  listenInputs(): void {
    this.events.on("input_down", (event) => {
      const actions = this.getActionsKeyDown();
      if (!actions.hasOwnProperty(event.button)) {
        return;
      }
      actions[event.button]();
    }, this);

    this.events.on("input_up", (event) => {
      const actions = this.getActionsKeyUp();
      if (!actions.hasOwnProperty(event.button)) {
        return;
      }
      actions[event.button]();
    }, this);
  }

  doVibration(inputSuccess: boolean, vibrationLength: number): void {
    if (inputSuccess && this.scene.enableVibration && typeof navigator.vibrate !== "undefined") {
      navigator.vibrate(vibrationLength);
    }
  }

  getActionsKeyDown(): ActionKeys {
    const actions = {};
    actions[Button.UP] = () => this.buttonDirection(Button.UP);
    actions[Button.DOWN] = () => this.buttonDirection(Button.DOWN);
    actions[Button.LEFT] = () => this.buttonDirection(Button.LEFT);
    actions[Button.RIGHT] = () => this.buttonDirection(Button.RIGHT);
    actions[Button.SUBMIT] = () => this.buttonTouch();
    actions[Button.ACTION] = () => this.buttonAb(Button.ACTION);
    actions[Button.CANCEL] = () => this.buttonAb(Button.CANCEL);
    actions[Button.MENU] = () => this.buttonMenu();
    actions[Button.STATS] = () => this.buttonStats(true);
    actions[Button.CYCLE_SHINY] = () => this.buttonCycleOption(Button.CYCLE_SHINY);
    actions[Button.CYCLE_FORM] = () => this.buttonCycleOption(Button.CYCLE_FORM);
    actions[Button.CYCLE_GENDER] = () => this.buttonCycleOption(Button.CYCLE_GENDER);
    actions[Button.CYCLE_ABILITY] = () => this.buttonCycleOption(Button.CYCLE_ABILITY);
    actions[Button.CYCLE_NATURE] = () => this.buttonCycleOption(Button.CYCLE_NATURE);
    actions[Button.CYCLE_VARIANT] = () => this.buttonCycleOption(Button.CYCLE_VARIANT);
    actions[Button.SPEED_UP] = () => this.buttonSpeedChange();
    actions[Button.SLOW_DOWN] = () => this.buttonSpeedChange(false);
    return actions;
  }

  getActionsKeyUp(): ActionKeys {
    const actions = {};
    actions[Button.STATS] = () => this.buttonStats(false);
    return actions;
  }

  buttonDirection(direction: Button): void {
    const inputSuccess = this.scene.ui.processInput(direction);
    const vibrationLength = 5;
    this.doVibration(inputSuccess, vibrationLength);
  }

  buttonAb(button: Button): void {
    this.scene.ui.processInput(button);
  }

  buttonTouch(): void {
    this.scene.ui.processInput(Button.SUBMIT) || this.scene.ui.processInput(Button.ACTION);
  }

  buttonStats(pressed: boolean = true): void {
    if (pressed) {
      for (const p of this.scene.getField().filter(p => p?.isActive(true))) {
        p.toggleStats(true);
      }
    } else {
      for (const p of this.scene.getField().filter(p => p?.isActive(true))) {
        p.toggleStats(false);
      }
    }
  }

  buttonMenu(): void {
    if (this.scene.disableMenu) {
      return;
    }
    switch (this.scene.ui?.getMode()) {
    case Mode.MESSAGE:
      if (!(this.scene.ui.getHandler() as MessageUiHandler).pendingPrompt) {
        return;
      }
    case Mode.TITLE:
    case Mode.COMMAND:
    case Mode.FIGHT:
    case Mode.BALL:
    case Mode.TARGET_SELECT:
    case Mode.SAVE_SLOT:
    case Mode.PARTY:
    case Mode.SUMMARY:
    case Mode.STARTER_SELECT:
    case Mode.OPTION_SELECT:
      this.scene.ui.setOverlayMode(Mode.MENU);
      break;
    case Mode.CONFIRM:
    case Mode.MENU:
    case Mode.SETTINGS:
    case Mode.ACHIEVEMENTS:
      this.scene.ui.revertMode();
      this.scene.playSound("select");
      break;
    default:
      return;
    }
  }

  buttonCycleOption(button: Button): void {
    if (this.scene.ui?.getHandler() instanceof StarterSelectUiHandler) {
      this.scene.ui.processInput(button);
    }
  }

  buttonSpeedChange(up = true): void {
    if (up) {
      if (this.scene.gameSpeed < 5) {
        this.scene.gameData.saveSetting(Setting.Game_Speed, settingOptions[Setting.Game_Speed].indexOf(`${this.scene.gameSpeed}x`) + 1);
        if (this.scene.ui?.getMode() === Mode.SETTINGS) {
          (this.scene.ui.getHandler() as SettingsUiHandler).show([]);
        }
      }
      return;
    }
    if (this.scene.gameSpeed > 1) {
      this.scene.gameData.saveSetting(Setting.Game_Speed, Math.max(settingOptions[Setting.Game_Speed].indexOf(`${this.scene.gameSpeed}x`) - 1, 0));
      if (this.scene.ui?.getMode() === Mode.SETTINGS) {
        (this.scene.ui.getHandler() as SettingsUiHandler).show([]);
      }
    }
  }

}
