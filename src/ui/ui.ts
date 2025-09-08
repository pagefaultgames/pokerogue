import { globalScene } from "#app/global-scene";
import type { Button } from "#enums/buttons";
import { Device } from "#enums/devices";
import { PlayerGender } from "#enums/player-gender";
import { TextStyle } from "#enums/text-style";
import { UiMode } from "#enums/ui-mode";
import { AchvBar } from "#ui/containers/achv-bar";
import type { BgmBar } from "#ui/containers/bgm-bar";
import { PokedexPageUiHandler } from "#ui/containers/pokedex-page-ui-handler";
import { SavingIconHandler } from "#ui/containers/saving-icon-handler";
import { GamepadBindingUiHandler } from "#ui/gamepad-binding-ui-handler";
import { AchvsUiHandler } from "#ui/handlers/achvs-ui-handler";
import { AutoCompleteUiHandler } from "#ui/handlers/autocomplete-ui-handler";
import { AwaitableUiHandler } from "#ui/handlers/awaitable-ui-handler";
import { BallUiHandler } from "#ui/handlers/ball-ui-handler";
import { BattleMessageUiHandler } from "#ui/handlers/battle-message-ui-handler";
import { GameChallengesUiHandler } from "#ui/handlers/challenges-select-ui-handler";
import { ChangePasswordFormUiHandler } from "#ui/handlers/change-password-form-ui-handler";
import { CommandUiHandler } from "#ui/handlers/command-ui-handler";
import { ConfirmUiHandler } from "#ui/handlers/confirm-ui-handler";
import { EggGachaUiHandler } from "#ui/handlers/egg-gacha-ui-handler";
import { EggHatchSceneHandler } from "#ui/handlers/egg-hatch-scene-handler";
import { EggListUiHandler } from "#ui/handlers/egg-list-ui-handler";
import { EggSummaryUiHandler } from "#ui/handlers/egg-summary-ui-handler";
import { EvolutionSceneHandler } from "#ui/handlers/evolution-scene-handler";
import { FightUiHandler } from "#ui/handlers/fight-ui-handler";
import { GameStatsUiHandler } from "#ui/handlers/game-stats-ui-handler";
import { LoadingModalUiHandler } from "#ui/handlers/loading-modal-ui-handler";
import { LoginFormUiHandler } from "#ui/handlers/login-form-ui-handler";
import { MenuUiHandler } from "#ui/handlers/menu-ui-handler";
import { MessageUiHandler } from "#ui/handlers/message-ui-handler";
import { ModifierSelectUiHandler } from "#ui/handlers/modifier-select-ui-handler";
import { MysteryEncounterUiHandler } from "#ui/handlers/mystery-encounter-ui-handler";
import { PartyUiHandler } from "#ui/handlers/party-ui-handler";
import { PokedexScanUiHandler } from "#ui/handlers/pokedex-scan-ui-handler";
import { PokedexUiHandler } from "#ui/handlers/pokedex-ui-handler";
import { RegistrationFormUiHandler } from "#ui/handlers/registration-form-ui-handler";
import { RenameFormUiHandler } from "#ui/handlers/rename-form-ui-handler";
import { RunHistoryUiHandler } from "#ui/handlers/run-history-ui-handler";
import { RunInfoUiHandler } from "#ui/handlers/run-info-ui-handler";
import { SaveSlotSelectUiHandler } from "#ui/handlers/save-slot-select-ui-handler";
import { SessionReloadModalUiHandler } from "#ui/handlers/session-reload-modal-ui-handler";
import { StarterSelectUiHandler } from "#ui/handlers/starter-select-ui-handler";
import { SummaryUiHandler } from "#ui/handlers/summary-ui-handler";
import { TargetSelectUiHandler } from "#ui/handlers/target-select-ui-handler";
import { TestDialogueUiHandler } from "#ui/handlers/test-dialogue-ui-handler";
import { TitleUiHandler } from "#ui/handlers/title-ui-handler";
import type { UiHandler } from "#ui/handlers/ui-handler";
import { UnavailableModalUiHandler } from "#ui/handlers/unavailable-modal-ui-handler";
import { KeyboardBindingUiHandler } from "#ui/keyboard-binding-ui-handler";
import { NavigationManager } from "#ui/navigation-menu";
import { OptionSelectUiHandler } from "#ui/option-select-ui-handler";
import { SettingsAudioUiHandler } from "#ui/settings-audio-ui-handler";
import { SettingsDisplayUiHandler } from "#ui/settings-display-ui-handler";
import { SettingsGamepadUiHandler } from "#ui/settings-gamepad-ui-handler";
import { SettingsKeyboardUiHandler } from "#ui/settings-keyboard-ui-handler";
import { SettingsUiHandler } from "#ui/settings-ui-handler";
import { addTextObject } from "#ui/text";
import { addWindow } from "#ui/ui-theme";
import { executeIf } from "#utils/common";
import i18next from "i18next";
import { AdminUiHandler } from "./handlers/admin-ui-handler";
import { RenameRunFormUiHandler } from "./handlers/rename-run-ui-handler";

const transitionModes = [
  UiMode.SAVE_SLOT,
  UiMode.PARTY,
  UiMode.SUMMARY,
  UiMode.STARTER_SELECT,
  UiMode.EVOLUTION_SCENE,
  UiMode.EGG_HATCH_SCENE,
  UiMode.EGG_LIST,
  UiMode.EGG_GACHA,
  UiMode.POKEDEX,
  UiMode.POKEDEX_PAGE,
  UiMode.CHALLENGE_SELECT,
  UiMode.RUN_HISTORY,
];

const noTransitionModes = [
  UiMode.TITLE,
  UiMode.CONFIRM,
  UiMode.OPTION_SELECT,
  UiMode.MENU,
  UiMode.MENU_OPTION_SELECT,
  UiMode.GAMEPAD_BINDING,
  UiMode.KEYBOARD_BINDING,
  UiMode.SETTINGS,
  UiMode.SETTINGS_AUDIO,
  UiMode.SETTINGS_DISPLAY,
  UiMode.SETTINGS_GAMEPAD,
  UiMode.SETTINGS_KEYBOARD,
  UiMode.ACHIEVEMENTS,
  UiMode.GAME_STATS,
  UiMode.POKEDEX_SCAN,
  UiMode.LOGIN_FORM,
  UiMode.REGISTRATION_FORM,
  UiMode.LOADING,
  UiMode.SESSION_RELOAD,
  UiMode.UNAVAILABLE,
  UiMode.RENAME_POKEMON,
  UiMode.RENAME_RUN,
  UiMode.TEST_DIALOGUE,
  UiMode.AUTO_COMPLETE,
  UiMode.ADMIN,
  UiMode.MYSTERY_ENCOUNTER,
  UiMode.RUN_INFO,
  UiMode.CHANGE_PASSWORD_FORM,
];

export class UI extends Phaser.GameObjects.Container {
  private mode: UiMode;
  private modeChain: UiMode[];
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
    super(globalScene, 0, globalScene.scaledCanvas.height);

    this.mode = UiMode.MESSAGE;
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
      new OptionSelectUiHandler(UiMode.MENU_OPTION_SELECT),
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
      new PokedexUiHandler(),
      new PokedexScanUiHandler(UiMode.TEST_DIALOGUE),
      new PokedexPageUiHandler(),
      new LoginFormUiHandler(),
      new RegistrationFormUiHandler(),
      new LoadingModalUiHandler(),
      new SessionReloadModalUiHandler(),
      new UnavailableModalUiHandler(),
      new GameChallengesUiHandler(),
      new RenameFormUiHandler(),
      new RenameRunFormUiHandler(),
      new RunHistoryUiHandler(),
      new RunInfoUiHandler(),
      new TestDialogueUiHandler(UiMode.TEST_DIALOGUE),
      new AutoCompleteUiHandler(),
      new AdminUiHandler(),
      new MysteryEncounterUiHandler(),
      new ChangePasswordFormUiHandler(),
    ];
  }

  setup(): void {
    this.setName(`ui-${UiMode[this.mode]}`);
    for (const handler of this.handlers) {
      handler.setup();
    }
    this.overlay = globalScene.add.rectangle(0, 0, globalScene.scaledCanvas.width, globalScene.scaledCanvas.height, 0);
    this.overlay.setName("rect-ui-overlay");
    this.overlay.setOrigin(0, 0);
    globalScene.uiContainer.add(this.overlay);
    this.overlay.setVisible(false);
    this.setupTooltip();

    this.achvBar = new AchvBar();
    this.achvBar.setup();

    globalScene.uiContainer.add(this.achvBar);

    this.savingIcon = new SavingIconHandler();
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
    return this.handlers[UiMode.MESSAGE] as BattleMessageUiHandler;
  }

  processInfoButton(pressed: boolean) {
    if (this.overlayActive) {
      return false;
    }

    if ([UiMode.CONFIRM, UiMode.COMMAND, UiMode.FIGHT, UiMode.MESSAGE, UiMode.TARGET_SELECT].includes(this.mode)) {
      globalScene?.processInfoButton(pressed);
      return true;
    }
    globalScene?.processInfoButton(false);
    return true;
  }

  /**
   * Process a player input of a button (delivering it to the current UI handler for processing)
   * @param button The {@linkcode Button} being inputted
   * @returns true if the input attempt succeeds
   */
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

  showTextPromise(text: string, callbackDelay = 0, prompt = true, promptDelay?: number | null): Promise<void> {
    return new Promise<void>(resolve => {
      this.showText(text ?? "", null, () => resolve(), callbackDelay, prompt, promptDelay);
    });
  }

  showText(
    text: string,
    delay?: number | null,
    callback?: Function | null,
    callbackDelay?: number | null,
    prompt?: boolean | null,
    promptDelay?: number | null,
  ): void {
    const pokename: string[] = [];
    const repname = ["#POKEMON1", "#POKEMON2"];
    for (let p = 0; p < globalScene.getPlayerField().length; p++) {
      pokename.push(globalScene.getPlayerField()[p].getNameToRender());
      text = text.split(pokename[p]).join(repname[p]);
    }
    if (prompt && text.indexOf("$") > -1) {
      const messagePages = text.split(/\$/g).map(m => m.trim());
      // biome-ignore lint/complexity/useOptionalChain: optional chain would change this to be null instead of undefined.
      let showMessageAndCallback = () => callback && callback();
      for (let p = messagePages.length - 1; p >= 0; p--) {
        const originalFunc = showMessageAndCallback;
        messagePages[p] = messagePages[p].split(repname[0]).join(pokename[0]);
        messagePages[p] = messagePages[p].split(repname[1]).join(pokename[1]);
        showMessageAndCallback = () => this.showText(messagePages[p], null, originalFunc, null, true);
      }
      showMessageAndCallback();
    } else {
      const handler = this.getHandler();
      for (let p = 0; p < globalScene.getPlayerField().length; p++) {
        text = text.split(repname[p]).join(pokename[p]);
      }
      if (handler instanceof MessageUiHandler) {
        (handler as MessageUiHandler).showText(text, delay, callback, callbackDelay, prompt, promptDelay);
      } else {
        this.getMessageHandler().showText(text, delay, callback, callbackDelay, prompt, promptDelay);
      }
    }
  }

  showDialogue(
    keyOrText: string,
    name: string | undefined,
    delay: number | null = 0,
    callback: Function,
    callbackDelay?: number,
    promptDelay?: number,
  ): void {
    // Get localized dialogue (if available)
    let hasi18n = false;
    let text = keyOrText;
    const genderIndex = globalScene.gameData.gender ?? PlayerGender.UNSET;
    const genderStr = PlayerGender[genderIndex].toLowerCase();

    if (i18next.exists(keyOrText)) {
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
        (handler as MessageUiHandler).showDialogue(
          text,
          name,
          delay,
          showMessageAndCallback,
          callbackDelay,
          true,
          promptDelay,
        );
      } else {
        this.getMessageHandler().showDialogue(
          text,
          name,
          delay,
          showMessageAndCallback,
          callbackDelay,
          true,
          promptDelay,
        );
      }
    }
  }

  shouldSkipDialogue(i18nKey: string): boolean {
    if (
      i18next.exists(i18nKey)
      && globalScene.skipSeenDialogues
      && globalScene.gameData.getSeenDialogues()[i18nKey] === true
    ) {
      return true;
    }
    return false;
  }

  getTooltip(): { visible: boolean; title: string; content: string } {
    return {
      visible: this.tooltipContainer.visible,
      title: this.tooltipTitle.text,
      content: this.tooltipContent.text,
    };
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
    this.tooltipBg.width = Math.min(
      Math.max(this.tooltipTitle.displayWidth, this.tooltipContent.displayWidth) + 12,
      838,
    );
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
          x = globalScene.scaledCanvas.width - tooltipWidth - padding;
        }
      } else {
        // If the tooltip would go offscreen on the right, or is close to it, move to the left of the cursor
        if (x + tooltipWidth + padding > globalScene.scaledCanvas.width) {
          x = Math.max(padding, pointerX / 6 - tooltipWidth - padding);
        }
        // If the tooltip would go offscreen at the bottom, or is close to it, move above the cursor
        if (y + tooltipHeight + padding > globalScene.scaledCanvas.height) {
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

  setCursor(cursor: number): boolean {
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

  fadeOut(duration: number): Promise<void> {
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
        duration,
        ease: "Sine.easeOut",
        onComplete: () => resolve(),
      });
    });
  }

  fadeIn(duration: number): Promise<void> {
    return new Promise(resolve => {
      if (!this.overlayActive) {
        return resolve();
      }
      globalScene.tweens.add({
        targets: this.overlay,
        alpha: 0,
        duration,
        ease: "Sine.easeIn",
        onComplete: () => {
          this.overlay.setVisible(false);
          resolve();
        },
      });
      this.overlayActive = false;
    });
  }

  private setModeInternal(
    mode: UiMode,
    clear: boolean,
    forceTransition: boolean,
    chainMode: boolean,
    args: any[],
  ): Promise<void> {
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
            touchControls.dataset.uiMode = UiMode[mode];
          }
          this.getHandler().show(args);
        }
        resolve();
      };
      if (
        (!chainMode
          && (transitionModes.indexOf(this.mode) > -1 || transitionModes.indexOf(mode) > -1)
          && noTransitionModes.indexOf(this.mode) === -1
          && noTransitionModes.indexOf(mode) === -1)
        || (chainMode && noTransitionModes.indexOf(mode) === -1)
      ) {
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

  getMode(): UiMode {
    return this.mode;
  }

  setMode(mode: UiMode, ...args: any[]): Promise<void> {
    return this.setModeInternal(mode, true, false, false, args);
  }

  setModeForceTransition(mode: UiMode, ...args: any[]): Promise<void> {
    return this.setModeInternal(mode, true, true, false, args);
  }

  setModeWithoutClear(mode: UiMode, ...args: any[]): Promise<void> {
    return this.setModeInternal(mode, false, false, false, args);
  }

  setOverlayMode(mode: UiMode, ...args: any[]): Promise<void> {
    return this.setModeInternal(mode, false, false, true, args);
  }

  resetModeChain(): void {
    this.modeChain = [];
    globalScene.updateGameInfo();
  }

  revertMode(): Promise<boolean> {
    return new Promise<boolean>(resolve => {
      if (this?.modeChain?.length === 0) {
        return resolve(false);
      }

      const lastMode = this.mode;

      const doRevertMode = () => {
        this.getHandler().clear();
        this.mode = this.modeChain.pop()!; // TODO: is this bang correct?
        globalScene.updateGameInfo();
        const touchControls = document.getElementById("touchControls");
        if (touchControls) {
          touchControls.dataset.uiMode = UiMode[this.mode];
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
      if (this?.modeChain?.length === 0) {
        return resolve();
      }
      this.revertMode().then(success => executeIf(success, this.revertModes).then(() => resolve()));
    });
  }

  public getModeChain(): UiMode[] {
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
    }
    return globalScene.inputMethod;
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
