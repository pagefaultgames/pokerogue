import { globalScene } from "#app/global-scene";
import type UiHandler from "./ui-handler";
import BattleMessageUiHandler from "./battle-message-ui-handler";
import CommandUiHandler from "./command-ui-handler";
import PartyUiHandler from "./party-ui-handler";
import FightUiHandler from "./fight-ui-handler";
import MessageUiHandler from "./message-ui-handler";
import ConfirmUiHandler from "./confirm-ui-handler";
import ModifierSelectUiHandler from "./modifier-select-ui-handler";
import BallUiHandler from "./ball-ui-handler";
import SummaryUiHandler from "./summary-ui-handler";
import StarterSelectUiHandler from "./starter-select-ui-handler";
import EvolutionSceneHandler from "./evolution-scene-handler";
import TargetSelectUiHandler from "./target-select-ui-handler";
import SettingsUiHandler from "./settings/settings-ui-handler";
import SettingsGamepadUiHandler from "./settings/settings-gamepad-ui-handler";
import GameChallengesUiHandler from "./challenges-select-ui-handler";
import { TextStyle, addTextObject } from "./text";
import AchvBar from "./achv-bar";
import MenuUiHandler from "./menu-ui-handler";
import AchvsUiHandler from "./achvs-ui-handler";
import OptionSelectUiHandler from "./settings/option-select-ui-handler";
import EggHatchSceneHandler from "./egg-hatch-scene-handler";
import EggListUiHandler from "./egg-list-ui-handler";
import EggGachaUiHandler from "./egg-gacha-ui-handler";
import { addWindow } from "./ui-theme";
import LoginFormUiHandler from "./login-form-ui-handler";
import RegistrationFormUiHandler from "./registration-form-ui-handler";
import LoadingModalUiHandler from "./loading-modal-ui-handler";
import * as Utils from "../utils";
import GameStatsUiHandler from "./game-stats-ui-handler";
import AwaitableUiHandler from "./awaitable-ui-handler";
import SaveSlotSelectUiHandler from "./save-slot-select-ui-handler";
import TitleUiHandler from "./title-ui-handler";
import SavingIconHandler from "./saving-icon-handler";
import UnavailableModalUiHandler from "./unavailable-modal-ui-handler";
import SessionReloadModalUiHandler from "./session-reload-modal-ui-handler";
import type { Button } from "#enums/buttons";
import i18next from "i18next";
import GamepadBindingUiHandler from "./settings/gamepad-binding-ui-handler";
import SettingsKeyboardUiHandler from "#app/ui/settings/settings-keyboard-ui-handler";
import KeyboardBindingUiHandler from "#app/ui/settings/keyboard-binding-ui-handler";
import SettingsDisplayUiHandler from "./settings/settings-display-ui-handler";
import SettingsAudioUiHandler from "./settings/settings-audio-ui-handler";
import { PlayerGender } from "#enums/player-gender";
import type BgmBar from "#app/ui/bgm-bar";
import RenameFormUiHandler from "./rename-form-ui-handler";
import AdminUiHandler from "./admin-ui-handler";
import RunHistoryUiHandler from "./run-history-ui-handler";
import RunInfoUiHandler from "./run-info-ui-handler";
import EggSummaryUiHandler from "./egg-summary-ui-handler";
import TestDialogueUiHandler from "#app/ui/test-dialogue-ui-handler";
import AutoCompleteUiHandler from "./autocomplete-ui-handler";
import { Device } from "#enums/devices";
import MysteryEncounterUiHandler from "./mystery-encounter-ui-handler";
import { NavigationManager } from "./settings/navigationMenu";

export enum Mode {
  MESSAGE,
  TITLE,
  COMMAND,
  FIGHT,
  BALL,
  TARGET_SELECT,
  MODIFIER_SELECT,
  SAVE_SLOT,
  PARTY,
  SUMMARY,
  STARTER_SELECT,
  EVOLUTION_SCENE,
  EGG_HATCH_SCENE,
  EGG_HATCH_SUMMARY,
  CONFIRM,
  OPTION_SELECT,
  MENU,
  MENU_OPTION_SELECT,
  SETTINGS,
  SETTINGS_DISPLAY,
  SETTINGS_AUDIO,
  SETTINGS_GAMEPAD,
  GAMEPAD_BINDING,
  SETTINGS_KEYBOARD,
  KEYBOARD_BINDING,
  ACHIEVEMENTS,
  GAME_STATS,
  EGG_LIST,
  EGG_GACHA,
  LOGIN_FORM,
  REGISTRATION_FORM,
  LOADING,
  SESSION_RELOAD,
  UNAVAILABLE,
  CHALLENGE_SELECT,
  RENAME_POKEMON,
  RUN_HISTORY,
  RUN_INFO,
  TEST_DIALOGUE,
  AUTO_COMPLETE,
  ADMIN,
  MYSTERY_ENCOUNTER
}

const transitionModes = [
  Mode.SAVE_SLOT,
  Mode.PARTY,
  Mode.SUMMARY,
  Mode.STARTER_SELECT,
  Mode.EVOLUTION_SCENE,
  Mode.EGG_HATCH_SCENE,
  Mode.EGG_LIST,
  Mode.EGG_GACHA,
  Mode.CHALLENGE_SELECT,
  Mode.RUN_HISTORY,
];

const noTransitionModes = [
  Mode.TITLE,
  Mode.CONFIRM,
  Mode.OPTION_SELECT,
  Mode.MENU,
  Mode.MENU_OPTION_SELECT,
  Mode.GAMEPAD_BINDING,
  Mode.KEYBOARD_BINDING,
  Mode.SETTINGS,
  Mode.SETTINGS_AUDIO,
  Mode.SETTINGS_DISPLAY,
  Mode.SETTINGS_GAMEPAD,
  Mode.SETTINGS_KEYBOARD,
  Mode.ACHIEVEMENTS,
  Mode.GAME_STATS,
  Mode.LOGIN_FORM,
  Mode.REGISTRATION_FORM,
  Mode.LOADING,
  Mode.SESSION_RELOAD,
  Mode.UNAVAILABLE,
  Mode.RENAME_POKEMON,
  Mode.TEST_DIALOGUE,
  Mode.AUTO_COMPLETE,
  Mode.ADMIN,
  Mode.MYSTERY_ENCOUNTER,
  Mode.RUN_INFO
];

export default class UI extends Phaser.GameObjects.Container {
  private mode: Mode;
  private modeChain: Mode[];
  public handlers: UiHandler[];
  private overlay: Phaser.GameObjects.Rectangle;
  public achvBar: AchvBar;
  public bgmBar: BgmBar;
  public savingIcon: SavingIconHandler;

  private tooltipContainer: Phaser.GameObjects.Container;
  private tooltipBg: Phaser.GameObjects.NineSlice;
  private tooltipTitle: Phaser.GameObjects.Text;
  private tooltipContent: Phaser.GameObjects.Text;

  private overlayActive: boolean;

  constructor() {
    super(globalScene, 0, globalScene.game.canvas.height / 6);

    this.mode = Mode.MESSAGE;
    this.modeChain = [];
    this.handlers = [
      new BattleMessageUiHandler(),
      new TitleUiHandler(),
      new CommandUiHandler(),
      new FightUiHandler(),
      new BallUiHandler(),
      new TargetSelectUiHandler(),
      new ModifierSelectUiHandler(),
      new SaveSlotSelectUiHandler(),
      new PartyUiHandler(),
      new SummaryUiHandler(),
      new StarterSelectUiHandler(),
      new EvolutionSceneHandler(),
      new EggHatchSceneHandler(),
      new EggSummaryUiHandler(),
      new ConfirmUiHandler(),
      new OptionSelectUiHandler(),
      new MenuUiHandler(),
      new OptionSelectUiHandler(Mode.MENU_OPTION_SELECT),
      // settings
      new SettingsUiHandler(),
      new SettingsDisplayUiHandler(),
      new SettingsAudioUiHandler(),
      new SettingsGamepadUiHandler(),
      new GamepadBindingUiHandler(),
      new SettingsKeyboardUiHandler(),
      new KeyboardBindingUiHandler(),
      new AchvsUiHandler(),
      new GameStatsUiHandler(),
      new EggListUiHandler(),
      new EggGachaUiHandler(),
      new LoginFormUiHandler(),
      new RegistrationFormUiHandler(),
      new LoadingModalUiHandler(),
      new SessionReloadModalUiHandler(),
      new UnavailableModalUiHandler(),
      new GameChallengesUiHandler(),
      new RenameFormUiHandler(),
      new RunHistoryUiHandler(),
      new RunInfoUiHandler(),
      new TestDialogueUiHandler(Mode.TEST_DIALOGUE),
      new AutoCompleteUiHandler(),
      new AdminUiHandler(),
      new MysteryEncounterUiHandler(),
    ];
  }

  setup(): void {
    this.setName(`ui-${Mode[this.mode]}`);
    for (const handler of this.handlers) {
      handler.setup();
    }
    this.overlay = globalScene.add.rectangle(0, 0, globalScene.game.canvas.width / 6, globalScene.game.canvas.height / 6, 0);
    this.overlay.setName("rect-ui-overlay");
    this.overlay.setOrigin(0, 0);
    globalScene.uiContainer.add(this.overlay);
    this.overlay.setVisible(false);
    this.setupTooltip();

    this.achvBar = new AchvBar;
    this.achvBar.setup();

    globalScene.uiContainer.add(this.achvBar);

    this.savingIcon = new SavingIconHandler;
    this.savingIcon.setup();

    globalScene.uiContainer.add(this.savingIcon);
  }

  private setupTooltip() {
    this.tooltipContainer = globalScene.add.container(0, 0);
    this.tooltipContainer.setName("tooltip");
    this.tooltipContainer.setVisible(false);

    this.tooltipBg = addWindow(0, 0, 128, 31);
    this.tooltipBg.setName("window-tooltip-bg");
    this.tooltipBg.setOrigin(0, 0);

    this.tooltipTitle = addTextObject(64, 4, "", TextStyle.TOOLTIP_TITLE);
    this.tooltipTitle.setName("text-tooltip-title");
    this.tooltipTitle.setOrigin(0.5, 0);

    this.tooltipContent = addTextObject(6, 16, "", TextStyle.TOOLTIP_CONTENT);
    this.tooltipContent.setName("text-tooltip-content");
    this.tooltipContent.setWordWrapWidth(850);

    this.tooltipContainer.add(this.tooltipBg);
    this.tooltipContainer.add(this.tooltipTitle);
    this.tooltipContainer.add(this.tooltipContent);

    globalScene.uiContainer.add(this.tooltipContainer);
  }

  getHandler<H extends UiHandler = UiHandler>(): H {
    return this.handlers[this.mode] as H;
  }

  getMessageHandler(): BattleMessageUiHandler {
    return this.handlers[Mode.MESSAGE] as BattleMessageUiHandler;
  }

  processInfoButton(pressed: boolean) {
    if (this.overlayActive) {
      return false;
    }

    if ([ Mode.CONFIRM, Mode.COMMAND, Mode.FIGHT, Mode.MESSAGE ].includes(this.mode)) {
      globalScene?.processInfoButton(pressed);
      return true;
    }
    globalScene?.processInfoButton(false);
    return true;
  }

  processInput(button: Button): boolean {
    if (this.overlayActive) {
      return false;
    }

    const handler = this.getHandler();

    if (handler instanceof AwaitableUiHandler && handler.tutorialActive) {
      return handler.processTutorialInput(button);
    }

    return handler.processInput(button);
  }

  showTextPromise(text: string, callbackDelay: number = 0, prompt: boolean = true, promptDelay?: integer | null): Promise<void> {
    return new Promise<void>(resolve => {
      this.showText(text ?? "", null, () => resolve(), callbackDelay, prompt, promptDelay);
    });
  }

  showText(text: string, delay?: integer | null, callback?: Function | null, callbackDelay?: integer | null, prompt?: boolean | null, promptDelay?: integer | null): void {
    if (prompt && text.indexOf("$") > -1) {
      const messagePages = text.split(/\$/g).map(m => m.trim());
      let showMessageAndCallback = () => callback && callback();
      for (let p = messagePages.length - 1; p >= 0; p--) {
        const originalFunc = showMessageAndCallback;
        showMessageAndCallback = () => this.showText(messagePages[p], null, originalFunc, null, true);
      }
      showMessageAndCallback();
    } else {
      const handler = this.getHandler();
      if (handler instanceof MessageUiHandler) {
        (handler as MessageUiHandler).showText(text, delay, callback, callbackDelay, prompt, promptDelay);
      } else {
        this.getMessageHandler().showText(text, delay, callback, callbackDelay, prompt, promptDelay);
      }

    }
  }

  showDialogue(keyOrText: string, name: string | undefined, delay: integer | null = 0, callback: Function, callbackDelay?: integer, promptDelay?: integer): void {
    // Get localized dialogue (if available)
    let hasi18n = false;
    let text = keyOrText;
    const genderIndex = globalScene.gameData.gender ?? PlayerGender.UNSET;
    const genderStr = PlayerGender[genderIndex].toLowerCase();

    if (i18next.exists(keyOrText) ) {
      const i18nKey = keyOrText;
      hasi18n = true;

      text = i18next.t(i18nKey, { context: genderStr }); // override text with translation

      // Skip dialogue if the player has enabled the option and the dialogue has been already seen
      if (this.shouldSkipDialogue(i18nKey)) {
        console.log(`Dialogue ${i18nKey} skipped`);
        callback();
        return;
      }
    }
    let showMessageAndCallback = () => {
      hasi18n && globalScene.gameData.saveSeenDialogue(keyOrText);
      callback();
    };
    if (text.indexOf("$") > -1) {
      const messagePages = text.split(/\$/g).map(m => m.trim());
      for (let p = messagePages.length - 1; p >= 0; p--) {
        const originalFunc = showMessageAndCallback;
        showMessageAndCallback = () => this.showDialogue(messagePages[p], name, null, originalFunc);
      }
      showMessageAndCallback();
    } else {
      const handler = this.getHandler();
      if (handler instanceof MessageUiHandler) {
        (handler as MessageUiHandler).showDialogue(text, name, delay, showMessageAndCallback, callbackDelay, true, promptDelay);
      } else {
        this.getMessageHandler().showDialogue(text, name, delay, showMessageAndCallback, callbackDelay, true, promptDelay);
      }
    }
  }

  shouldSkipDialogue(i18nKey: string): boolean {
    if (i18next.exists(i18nKey) ) {
      if (globalScene.skipSeenDialogues && globalScene.gameData.getSeenDialogues()[i18nKey] === true) {
        return true;
      }
    }
    return false;
  }

  getTooltip(): { visible: boolean; title: string; content: string } {
    return { visible: this.tooltipContainer.visible, title: this.tooltipTitle.text, content: this.tooltipContent.text };
  }

  showTooltip(title: string, content: string, overlap?: boolean): void {
    this.tooltipContainer.setVisible(true);
    this.editTooltip(title, content);
    if (overlap) {
      globalScene.uiContainer.moveAbove(this.tooltipContainer, this);
    } else {
      globalScene.uiContainer.moveBelow(this.tooltipContainer, this);
    }
  }

  editTooltip(title: string, content: string): void {
    this.tooltipTitle.setText(title || "");
    const wrappedContent = this.tooltipContent.runWordWrap(content);
    this.tooltipContent.setText(wrappedContent);
    this.tooltipContent.y = title ? 16 : 4;
    this.tooltipBg.width = Math.min(Math.max(this.tooltipTitle.displayWidth, this.tooltipContent.displayWidth) + 12, 838);
    this.tooltipBg.height = (title ? 31 : 19) + 10.5 * (wrappedContent.split("\n").length - 1);
    this.tooltipTitle.x = this.tooltipBg.width / 2;
  }

  hideTooltip(): void {
    this.tooltipContainer.setVisible(false);
    this.tooltipTitle.clearTint();
  }

  update(): void {
    if (this.tooltipContainer.visible) {
      const isTouch = globalScene.inputMethod === "touch";
      const pointerX = globalScene.game.input.activePointer.x;
      const pointerY = globalScene.game.input.activePointer.y;
      const tooltipWidth = this.tooltipBg.width;
      const tooltipHeight = this.tooltipBg.height;
      const padding = 2;

      // Default placement is top left corner of the screen on mobile. Otherwise below the cursor, to the right
      let x = isTouch ? padding : pointerX / 6 + padding;
      let y = isTouch ? padding : pointerY / 6 + padding;

      if (isTouch) {
        // If we are in the top left quadrant on mobile, move the tooltip to the top right corner
        if (pointerX <= globalScene.game.canvas.width / 2 && pointerY <= globalScene.game.canvas.height / 2) {
          x = globalScene.game.canvas.width / 6 - tooltipWidth - padding;
        }
      } else {
        // If the tooltip would go offscreen on the right, or is close to it, move to the left of the cursor
        if (x + tooltipWidth + padding > globalScene.game.canvas.width / 6) {
          x = Math.max(padding, pointerX / 6 - tooltipWidth - padding);
        }
        // If the tooltip would go offscreen at the bottom, or is close to it, move above the cursor
        if (y + tooltipHeight + padding > globalScene.game.canvas.height / 6) {
          y = Math.max(padding, pointerY / 6 - tooltipHeight - padding);
        }
      }

      this.tooltipContainer.setPosition(x, y);
    }
  }

  clearText(): void {
    const handler = this.getHandler();
    if (handler instanceof MessageUiHandler) {
      (handler as MessageUiHandler).clearText();
    } else {
      this.getMessageHandler().clearText();
    }
  }

  setCursor(cursor: integer): boolean {
    const changed = this.getHandler().setCursor(cursor);
    if (changed) {
      this.playSelect();
    }

    return changed;
  }

  playSelect(): void {
    globalScene.playSound("ui/select");
  }

  playError(): void {
    globalScene.playSound("ui/error");
  }

  fadeOut(duration: integer): Promise<void> {
    return new Promise(resolve => {
      if (this.overlayActive) {
        return resolve();
      }
      this.overlayActive = true;
      this.overlay.setAlpha(0);
      this.overlay.setVisible(true);
      globalScene.tweens.add({
        targets: this.overlay,
        alpha: 1,
        duration: duration,
        ease: "Sine.easeOut",
        onComplete: () => resolve()
      });
    });
  }

  fadeIn(duration: integer): Promise<void> {
    return new Promise(resolve => {
      if (!this.overlayActive) {
        return resolve();
      }
      globalScene.tweens.add({
        targets: this.overlay,
        alpha: 0,
        duration: duration,
        ease: "Sine.easeIn",
        onComplete: () => {
          this.overlay.setVisible(false);
          resolve();
        }
      });
      this.overlayActive = false;
    });
  }

  private setModeInternal(mode: Mode, clear: boolean, forceTransition: boolean, chainMode: boolean, args: any[]): Promise<void> {
    return new Promise(resolve => {
      if (this.mode === mode && !forceTransition) {
        resolve();
        return;
      }
      const doSetMode = () => {
        if (this.mode !== mode) {
          if (clear) {
            this.getHandler().clear();
          }
          if (chainMode && this.mode && !clear) {
            this.modeChain.push(this.mode);
            globalScene.updateGameInfo();
          }
          this.mode = mode;
          const touchControls = document?.getElementById("touchControls");
          if (touchControls) {
            touchControls.dataset.uiMode = Mode[mode];
          }
          this.getHandler().show(args);
        }
        resolve();
      };
      if (((!chainMode && ((transitionModes.indexOf(this.mode) > -1 || transitionModes.indexOf(mode) > -1)
        && (noTransitionModes.indexOf(this.mode) === -1 && noTransitionModes.indexOf(mode) === -1)))
        || (chainMode && noTransitionModes.indexOf(mode) === -1))) {
        this.fadeOut(250).then(() => {
          globalScene.time.delayedCall(100, () => {
            doSetMode();
            this.fadeIn(250);
          });
        });
      } else {
        doSetMode();
      }
    });
  }

  getMode(): Mode {
    return this.mode;
  }

  setMode(mode: Mode, ...args: any[]): Promise<void> {
    return this.setModeInternal(mode, true, false, false, args);
  }

  setModeForceTransition(mode: Mode, ...args: any[]): Promise<void> {
    return this.setModeInternal(mode, true, true, false, args);
  }

  setModeWithoutClear(mode: Mode, ...args: any[]): Promise<void> {
    return this.setModeInternal(mode, false, false, false, args);
  }

  setOverlayMode(mode: Mode, ...args: any[]): Promise<void> {
    return this.setModeInternal(mode, false, false, true, args);
  }

  resetModeChain(): void {
    this.modeChain = [];
    globalScene.updateGameInfo();
  }

  revertMode(): Promise<boolean> {
    return new Promise<boolean>(resolve => {
      if (!this?.modeChain?.length) {
        return resolve(false);
      }

      const lastMode = this.mode;

      const doRevertMode = () => {
        this.getHandler().clear();
        this.mode = this.modeChain.pop()!; // TODO: is this bang correct?
        globalScene.updateGameInfo();
        const touchControls = document.getElementById("touchControls");
        if (touchControls) {
          touchControls.dataset.uiMode = Mode[this.mode];
        }
        resolve(true);
      };

      if (noTransitionModes.indexOf(lastMode) === -1) {
        this.fadeOut(250).then(() => {
          globalScene.time.delayedCall(100, () => {
            doRevertMode();
            this.fadeIn(250);
          });
        });
      } else {
        doRevertMode();
      }
    });
  }

  revertModes(): Promise<void> {
    return new Promise<void>(resolve => {
      if (!this?.modeChain?.length) {
        return resolve();
      }
      this.revertMode().then(success => Utils.executeIf(success, this.revertModes).then(() => resolve()));
    });
  }

  public getModeChain(): Mode[] {
    return this.modeChain;
  }

  /**
   * getGamepadType - returns the type of gamepad being used
   * inputMethod could be "keyboard" or "touch" or "gamepad"
   * if inputMethod is "keyboard" or "touch", then the inputMethod is returned
   * if inputMethod is "gamepad", then the gamepad type is returned it could be "xbox" or "dualshock"
   * @returns gamepad type
   */
  public getGamepadType(): string {
    if (globalScene.inputMethod === "gamepad") {
      return globalScene.inputController.getConfig(globalScene.inputController.selectedDevice[Device.GAMEPAD]).padType;
    } else {
      return globalScene.inputMethod;
    }
  }

  /**
   * Attempts to free memory held by UI handlers
   * and clears menus from {@linkcode NavigationManager} to prepare for reset
   */
  public freeUIData(): void {
    this.handlers.forEach(h => h.destroy());
    this.handlers = [];
    NavigationManager.getInstance().clearNavigationMenus();
  }
}
