import BattleScene from "../battle-scene";
import AwaitableUiHandler from "./awaitable-ui-handler";
import { Mode } from "./ui";

export default abstract class MessageUiHandler extends AwaitableUiHandler {
  protected textTimer: Phaser.Time.TimerEvent;
  protected textCallbackTimer: Phaser.Time.TimerEvent;
  protected pendingPrompt: boolean;

  public message: Phaser.GameObjects.Text;
  public prompt: Phaser.GameObjects.Sprite;

  constructor(scene: BattleScene, mode: Mode) {
    super(scene, mode);

    this.pendingPrompt = false;
  }

  showText(text: string, delay?: integer, callback?: Function, callbackDelay?: integer, prompt?: boolean) {
    if (delay === null || delay === undefined)
      delay = 20;
    if (this.textTimer) {
      this.textTimer.remove();
      if (this.textCallbackTimer)
        this.textCallbackTimer.callback();
    };
    if (prompt) {
      const originalCallback = callback;
      callback = () => {
        const wrappedTextLines = this.message.runWordWrap(this.message.text).split(/\n/g);
        const textLinesCount = wrappedTextLines.length;
        const lastTextLine = wrappedTextLines[wrappedTextLines.length - 1];
        const lastLineTest = this.scene.add.text(0, 0, lastTextLine, { font: '96px emerald' });
        lastLineTest.setScale(this.message.scale);
        const lastLineWidth = lastLineTest.displayWidth;
        lastLineTest.destroy();
        if (prompt) {
          if (this.prompt) {
            this.prompt.setPosition(lastLineWidth + 2, (textLinesCount - 1) * 18 + 2);
            this.prompt.play('prompt');
          }
          this.pendingPrompt = false;
        }
        this.awaitingActionInput = true;
        this.onActionInput = () => {
          if (this.prompt) {
            this.prompt.anims.stop();
            this.prompt.setVisible(false);
          }
          if (originalCallback) {
            if (callbackDelay) {
              this.textCallbackTimer = this.scene.time.delayedCall(callbackDelay, () => {
                if (this.textCallbackTimer) {
                  this.textCallbackTimer.destroy();
                  this.textCallbackTimer = null;
                }
                originalCallback();
              });
            } else
              originalCallback();
          }
        };
      };
    }
    if (delay) {
      this.clearText();
      if (prompt)
        this.pendingPrompt = true;
      this.textTimer = this.scene.time.addEvent({
        delay: delay,
        callback: () => {
          this.message.setText(text.slice(0, text.length - this.textTimer.repeatCount));
          if (callback && !this.textTimer.repeatCount) {
            if (callbackDelay && !prompt) {
              this.textCallbackTimer = this.scene.time.delayedCall(callbackDelay, () => {
                if (this.textCallbackTimer) {
                  this.textCallbackTimer.destroy();
                  this.textCallbackTimer = null;
                }
                callback();
              });
            } else
              callback();
          }
        },
        repeat: text.length
      });
    } else {
      this.message.setText(text);
      if (prompt)
        this.pendingPrompt = true;
      if (callback)
        callback();
    }
  }

  clearText() {
    this.message.setText('');
    this.pendingPrompt = false;
  }

  clear() {
    super.clear();
  }
}