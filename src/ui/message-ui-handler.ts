import BattleScene from "../battle-scene";
import AwaitableUiHandler from "./awaitable-ui-handler";
import { Mode } from "./ui";
import * as Utils from "../utils";

export default abstract class MessageUiHandler extends AwaitableUiHandler {
  protected textTimer: Phaser.Time.TimerEvent;
  protected textCallbackTimer: Phaser.Time.TimerEvent;
  public pendingPrompt: boolean;

  public message: Phaser.GameObjects.Text;
  public prompt: Phaser.GameObjects.Sprite;

  constructor(scene: BattleScene, mode: Mode) {
    super(scene, mode);

    this.pendingPrompt = false;
  }

  showText(text: string, delay?: integer, callback?: Function, callbackDelay?: integer, prompt?: boolean, promptDelay?: integer) {
    this.showTextInternal(text, delay, callback, callbackDelay, prompt, promptDelay);
  }

  showDialogue(text: string, name: string, delay?: integer, callback?: Function, callbackDelay?: integer, prompt?: boolean, promptDelay?: integer) {
    this.showTextInternal(text, delay, callback, callbackDelay, prompt, promptDelay);
  }

  private showTextInternal(text: string, delay: integer, callback: Function, callbackDelay: integer, prompt: boolean, promptDelay: integer) {
    if (delay === null || delay === undefined) {
      delay = 20;
    }
    const charVarMap = new Map<integer, string>();
    const delayMap = new Map<integer, integer>();
    const soundMap = new Map<integer, string>();
    const actionPattern = /@(c|d|s)\{(.*?)\}/;
    let actionMatch: RegExpExecArray;
    while ((actionMatch = actionPattern.exec(text))) {
      switch (actionMatch[1]) {
      case "c":
        charVarMap.set(actionMatch.index, actionMatch[2]);
        break;
      case "d":
        delayMap.set(actionMatch.index, parseInt(actionMatch[2]));
        break;
      case "s":
        soundMap.set(actionMatch.index, actionMatch[2]);
        break;
      }
      text = text.slice(0, actionMatch.index) + text.slice(actionMatch.index + actionMatch[2].length + 4);
    }

    if (text) {
      // Predetermine overflow line breaks to avoid words breaking while displaying
      const textWords = text.split(" ");
      let lastLineCount = 1;
      let newText = "";
      for (let w = 0; w < textWords.length; w++) {
        const nextWordText = newText ? `${newText} ${textWords[w]}` : textWords[w];

        if (textWords[w].includes("\n")) {
          newText = nextWordText;
          lastLineCount++;
        } else {
          const lineCount = this.message.runWordWrap(nextWordText).split(/\n/g).length;
          if (lineCount > lastLineCount) {
            lastLineCount = lineCount;
            newText = `${newText}\n${textWords[w]}`;
          } else {
            newText = nextWordText;
          }
        }
      }

      text = newText;
    }

    if (this.textTimer) {
      this.textTimer.remove();
      if (this.textCallbackTimer) {
        this.textCallbackTimer.callback();
      }
    }
    if (prompt) {
      const originalCallback = callback;
      callback = () => {
        const showPrompt = () => this.showPrompt(originalCallback, callbackDelay);
        if (promptDelay) {
          this.scene.time.delayedCall(promptDelay, showPrompt);
        } else {
          showPrompt();
        }
      };
    }
    if (delay) {
      this.clearText();
      if (prompt) {
        this.pendingPrompt = true;
      }
      this.textTimer = this.scene.time.addEvent({
        delay: delay,
        callback: () => {
          const charIndex = text.length - this.textTimer.repeatCount;
          const charVar = charVarMap.get(charIndex);
          const charSound = soundMap.get(charIndex);
          const charDelay = delayMap.get(charIndex);
          this.message.setText(text.slice(0, charIndex));
          const advance = () => {
            if (charVar) {
              this.scene.charSprite.setVariant(charVar);
            }
            if (charSound) {
              this.scene.playSound(charSound);
            }
            if (callback && !this.textTimer.repeatCount) {
              if (callbackDelay && !prompt) {
                this.textCallbackTimer = this.scene.time.delayedCall(callbackDelay, () => {
                  if (this.textCallbackTimer) {
                    this.textCallbackTimer.destroy();
                    this.textCallbackTimer = null;
                  }
                  callback();
                });
              } else {
                callback();
              }
            }
          };
          if (charDelay) {
            this.textTimer.paused = true;
            this.scene.tweens.addCounter({
              duration: Utils.getFrameMs(charDelay),
              onComplete: () => {
                this.textTimer.paused = false;
                advance();
              }
            });
          } else {
            advance();
          }
        },
        repeat: text.length
      });
    } else {
      this.message.setText(text);
      if (prompt) {
        this.pendingPrompt = true;
      }
      if (callback) {
        callback();
      }
    }
  }

  showPrompt(callback: Function, callbackDelay: integer) {
    const wrappedTextLines = this.message.runWordWrap(this.message.text).split(/\n/g);
    const textLinesCount = wrappedTextLines.length;
    const lastTextLine = wrappedTextLines[wrappedTextLines.length - 1];
    const lastLineTest = this.scene.add.text(0, 0, lastTextLine, { font: "96px emerald" });
    lastLineTest.setScale(this.message.scale);
    const lastLineWidth = lastLineTest.displayWidth;
    lastLineTest.destroy();
    if (this.prompt) {
      this.prompt.setPosition(lastLineWidth + 2, (textLinesCount - 1) * 18 + 2);
      this.prompt.play("prompt");
    }
    this.pendingPrompt = false;
    this.awaitingActionInput = true;
    this.onActionInput = () => {
      if (this.prompt) {
        this.prompt.anims.stop();
        this.prompt.setVisible(false);
      }
      if (callback) {
        if (callbackDelay) {
          this.textCallbackTimer = this.scene.time.delayedCall(callbackDelay, () => {
            if (this.textCallbackTimer) {
              this.textCallbackTimer.destroy();
              this.textCallbackTimer = null;
            }
            callback();
          });
        } else {
          callback();
        }
      }
    };
  }

  clearText() {
    this.message.setText("");
    this.pendingPrompt = false;
  }

  clear() {
    super.clear();
  }
}
