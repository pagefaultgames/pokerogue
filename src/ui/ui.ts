import { default as BattleScene } from '../battle-scene';
import UiHandler from './uiHandler';
import BattleMessageUiHandler from './battle-message-ui-handler';
import CommandUiHandler from './command-ui-handler';
import PartyUiHandler from './party-ui-handler';
import FightUiHandler from './fight-ui-handler';
import MessageUiHandler from './message-ui-handler';
import SwitchCheckUiHandler from './switch-check-ui-handler';
import ModifierSelectUiHandler from './modifier-select-ui-handler';
import BallUiHandler from './ball-ui-handler';
import SummaryUiHandler from './summary-ui-handler';

export enum Mode {
  MESSAGE = 0,
  COMMAND,
  FIGHT,
  BALL,
  SWITCH_CHECK,
  MODIFIER_SELECT,
  PARTY,
  SUMMARY
};

export default class UI extends Phaser.GameObjects.Container {
  private mode: Mode;
  private handlers: UiHandler[];

  constructor(scene: BattleScene) {
    super(scene, 0, scene.game.canvas.height / 6);

    this.mode = Mode.MESSAGE;
    this.handlers = [
      new BattleMessageUiHandler(scene),
      new CommandUiHandler(scene),
      new FightUiHandler(scene),
      new BallUiHandler(scene),
      new SwitchCheckUiHandler(scene),
      new ModifierSelectUiHandler(scene),
      new PartyUiHandler(scene),
      new SummaryUiHandler(scene)
    ];
  }

  setup() {
    for (let handler of this.handlers) {
      handler.setup();
    }
  }

  getHandler() {
    return this.handlers[this.mode];
  }

  getMessageHandler() {
    return this.handlers[Mode.MESSAGE] as BattleMessageUiHandler;
  }

  processInput(keyCode: integer) {
    this.getHandler().processInput(keyCode);
  }

  showText(text: string, delay?: integer, callback?: Function, callbackDelay?: integer, prompt?: boolean) {
    const handler = this.getHandler();
    if (handler instanceof MessageUiHandler)
      (handler as MessageUiHandler).showText(text, delay, callback, callbackDelay, prompt);
    else
      this.getMessageHandler().showText(text, delay, callback, callbackDelay, prompt);
  }

  clearText() {
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

  playSelect() {
    this.scene.sound.play('select');
  }

  playError() {
    this.scene.sound.play('error');
  }

  setMode(mode: Mode, ...args: any[]) {
    if (this.mode === mode)
      return;
    this.getHandler().clear();
    this.mode = mode;
    this.getHandler().show(args);
  }

  setModeWithoutClear(mode: Mode, ...args: any[]) {
    if (this.mode === mode)
      return;
    this.mode = mode;
    this.getHandler().show(args);
  }
}