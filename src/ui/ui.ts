import { Button, default as BattleScene } from '../battle-scene';
import UiHandler from './uiHandler';
import BattleMessageUiHandler from './battle-message-ui-handler';
import CommandUiHandler from './command-ui-handler';
import PartyUiHandler from './party-ui-handler';
import FightUiHandler from './fight-ui-handler';
import MessageUiHandler from './message-ui-handler';
import ConfirmUiHandler from './confirm-ui-handler';
import ModifierSelectUiHandler from './modifier-select-ui-handler';
import BallUiHandler from './ball-ui-handler';
import SummaryUiHandler from './summary-ui-handler';
import StarterSelectUiHandler from './starter-select-ui-handler';
import EvolutionSceneHandler from './evolution-scene-handler';
import BiomeSelectUiHandler from './biome-select-ui-handler';
import TargetSelectUiHandler from './target-select-ui-handler';
import GameModeSelectUiHandler from './game-mode-select-ui-handler';
import SettingsUiHandler from './settings-ui-handler';

export enum Mode {
  MESSAGE,
  COMMAND,
  FIGHT,
  BALL,
  TARGET_SELECT,
  MODIFIER_SELECT,
  PARTY,
  SUMMARY,
  BIOME_SELECT,
  STARTER_SELECT,
  EVOLUTION_SCENE,
  CONFIRM,
  GAME_MODE_SELECT,
  SETTINGS
};

const transitionModes = [
  Mode.PARTY,
  Mode.SUMMARY,
  Mode.STARTER_SELECT,
  Mode.EVOLUTION_SCENE
];

const noTransitionModes = [
  Mode.CONFIRM,
  Mode.GAME_MODE_SELECT,
  Mode.SETTINGS
];

export default class UI extends Phaser.GameObjects.Container {
  private mode: Mode;
  private lastMode: Mode;
  private handlers: UiHandler[];
  private overlay: Phaser.GameObjects.Rectangle;
  
  private overlayActive: boolean;

  constructor(scene: BattleScene) {
    super(scene, 0, scene.game.canvas.height / 6);

    this.mode = Mode.MESSAGE;
    this.handlers = [
      new BattleMessageUiHandler(scene),
      new CommandUiHandler(scene),
      new FightUiHandler(scene),
      new BallUiHandler(scene),
      new TargetSelectUiHandler(scene),
      new ModifierSelectUiHandler(scene),
      new PartyUiHandler(scene),
      new SummaryUiHandler(scene),
      new BiomeSelectUiHandler(scene),
      new StarterSelectUiHandler(scene),
      new EvolutionSceneHandler(scene),
      new ConfirmUiHandler(scene),
      new GameModeSelectUiHandler(scene),
      new SettingsUiHandler(scene)
    ];
  }

  setup(): void {
    for (let handler of this.handlers) {
      handler.setup();
    }
    this.overlay = this.scene.add.rectangle(0, 0, this.scene.game.canvas.width / 6, this.scene.game.canvas.height / 6, 0);
    this.overlay.setOrigin(0, 0);
    (this.scene as BattleScene).uiContainer.add(this.overlay);
    this.overlay.setVisible(false);
  }

  getHandler(): UiHandler {
    return this.handlers[this.mode];
  }

  getMessageHandler(): BattleMessageUiHandler {
    return this.handlers[Mode.MESSAGE] as BattleMessageUiHandler;
  }

  processInput(button: Button): void {
    if (this.overlayActive)
      return;

    this.getHandler().processInput(button);
  }

  showText(text: string, delay?: integer, callback?: Function, callbackDelay?: integer, prompt?: boolean, promptDelay?: integer): void {
    const handler = this.getHandler();
    if (handler instanceof MessageUiHandler)
      (handler as MessageUiHandler).showText(text, delay, callback, callbackDelay, prompt, promptDelay);
    else
      this.getMessageHandler().showText(text, delay, callback, callbackDelay, prompt, promptDelay);
  }

  showDialogue(text: string, name: string, delay?: integer, callback?: Function, callbackDelay?: integer, prompt?: boolean, promptDelay?: integer): void {
    const handler = this.getHandler();
    if (handler instanceof MessageUiHandler)
      (handler as MessageUiHandler).showDialogue(text, name, delay, callback, callbackDelay, prompt, promptDelay);
    else
      this.getMessageHandler().showDialogue(text, name, delay, callback, callbackDelay, prompt, promptDelay);
  }

  clearText(): void {
    const handler = this.getHandler();
    if (handler instanceof MessageUiHandler)
      (handler as MessageUiHandler).clearText();
    else
      this.getMessageHandler().clearText();
  }

  setCursor(cursor: integer): boolean {
    const changed = this.getHandler().setCursor(cursor);
    if (changed)
      this.playSelect();

    return changed;
  }

  playSelect(): void {
    (this.scene as BattleScene).playSound('select');
  }

  playError(): void {
    (this.scene as BattleScene).playSound('error');
  }

  fadeOut(duration: integer): Promise<void> {
    return new Promise(resolve => {
      if (this.overlayActive) {
        resolve();
        return;
      }
      this.overlayActive = true;
      this.overlay.setAlpha(0);
      this.overlay.setVisible(true);
      this.scene.tweens.add({
        targets: this.overlay,
        alpha: 1,
        duration: duration,
        ease: 'Sine.easeOut',
        onComplete: () => resolve()
      });
    });
  }

  fadeIn(duration: integer): Promise<void> {
    return new Promise(resolve => {
      this.scene.tweens.add({
        targets: this.overlay,
        alpha: 0,
        duration: duration,
        ease: 'Sine.easeIn',
        onComplete: () => {
          this.overlay.setVisible(false);
          resolve();
        }
      });
      this.overlayActive = false;
    });
  }

  private setModeInternal(mode: Mode, clear: boolean, forceTransition: boolean, args: any[]): Promise<void> {
    return new Promise(resolve => {
      if (this.mode === mode && !forceTransition) {
        resolve();
        return;
      }
      const doSetMode = () => {
        if (this.mode !== mode) {
          if (clear)
            this.getHandler().clear();
          this.lastMode = this.mode && !clear ? this.mode : undefined;
          this.mode = mode;
          this.getHandler().show(args);
        }
        resolve();
      };
      if ((transitionModes.indexOf(this.mode) > -1 || transitionModes.indexOf(mode) > -1)
        && (noTransitionModes.indexOf(this.mode) === -1 && noTransitionModes.indexOf(mode) === -1) && !(this.scene as BattleScene).auto) {
        this.fadeOut(250).then(() => {
          this.scene.time.delayedCall(100, () => {
            doSetMode();
            this.fadeIn(250);
          });
        })
      } else
        doSetMode();
    });
  }

  getMode(): Mode {
    return this.mode;
  }

  setMode(mode: Mode, ...args: any[]): Promise<void> {
    return this.setModeInternal(mode, true, false, args);
  }

  setModeForceTransition(mode: Mode, ...args: any[]): Promise<void> {
    return this.setModeInternal(mode, true, true, args);
  }

  setModeWithoutClear(mode: Mode, ...args: any[]): Promise<void> {
    return this.setModeInternal(mode, false, false, args);
  }

  revertMode(): void {
    if (!this.lastMode)
      return;
    
    this.getHandler().clear();
    this.mode = this.lastMode;
    this.lastMode = undefined;
  }
}