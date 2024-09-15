import BattleScene from "../battle-scene";
import AwaitableUiHandler from "./awaitable-ui-handler";
import { Mode } from "./ui";
import * as Utils from "../utils";

export default abstract class MessageUiHandler extends AwaitableUiHandler {
  protected textTimer: Phaser.Time.TimerEvent | null;
  protected textCallbackTimer: Phaser.Time.TimerEvent | null;
  public pendingPrompt: boolean;

  public message: Phaser.GameObjects.Text;
  public prompt: Phaser.GameObjects.Sprite;

  constructor(scene: BattleScene, mode: Mode | null = null) {
    super(scene, mode);

    this.pendingPrompt = false;
  }

  showText(text: string, delay?: integer | null, callback?: Function | null, callbackDelay?: integer | null, prompt?: boolean | null, promptDelay?: integer | null) {
    this.showTextInternal(text, delay, callback, callbackDelay, prompt, promptDelay);
  }

  showDialogue(text: string, name?: string, delay?: integer | null, callback?: Function | null, callbackDelay?: integer | null, prompt?: boolean | null, promptDelay?: integer | null) {
    this.showTextInternal(text, delay, callback, callbackDelay, prompt, promptDelay);
  }

  private showTextInternal(text: string, delay?: integer | null, callback?: Function | null, callbackDelay?: integer | null, prompt?: boolean | null, promptDelay?: integer | null) {
    if (delay === null || delay === undefined) {
      delay = 20;
    }

    // Pattern matching regex that checks for @c{}, @f{}, @s{}, and @f{} patterns within message text and parses them to their respective behaviors.
    const charVarMap = new Map<integer, string>();
    const delayMap = new Map<integer, integer>();
    const soundMap = new Map<integer, string>();
    const fadeMap = new Map<integer, integer>();
    const actionPattern = /@(c|d|s|f)\{(.*?)\}/;
    let actionMatch: RegExpExecArray | null;
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
      case "f":
        fadeMap.set(actionMatch.index, parseInt(actionMatch[2]));
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
          const charIndex = text.length - (this.textTimer?.repeatCount!); // TODO: is this bang correct?
          const charVar = charVarMap.get(charIndex);
          const charSound = soundMap.get(charIndex);
          const charDelay = delayMap.get(charIndex);
          const charFade = fadeMap.get(charIndex);
          this.message.setText(text.slice(0, charIndex));
          const advance = () => {
            if (charVar) {
              this.scene.charSprite.setVariant(charVar);
            }
            if (charSound) {
              this.scene.playSound(charSound);
            }
            if (callback && !this.textTimer?.repeatCount) {
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
            this.textTimer!.paused = true; // TODO: is the bang correct?
            this.scene.tweens.addCounter({
              duration: Utils.getFrameMs(charDelay),
              onComplete: () => {
                this.textTimer!.paused = false; // TODO: is the bang correct?
                advance();
              }
            });
          } else if (charFade) {
            this.textTimer!.paused = true;
            this.scene.time.delayedCall(150, () => {
              this.scene.ui.fadeOut(750).then(() => {
                const delay = Utils.getFrameMs(charFade);
                this.scene.time.delayedCall(delay, () => {
                  this.scene.ui.fadeIn(500).then(() => {
                    this.textTimer!.paused = false;
                    advance();
                  });
                });
              });
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

  showPrompt(callback?: Function | null, callbackDelay?: integer | null) {
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
