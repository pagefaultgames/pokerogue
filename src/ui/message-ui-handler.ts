import BattleScene from "../battle-scene";
import AwaitableUiHandler from "./awaitable-ui-handler";
import { Mode } from "./ui";
import * as Utils from "../utils";
import i18next from "i18next";

type argsAjustText = {
  padding?: number;
  ignoreTextBalance?: Array<string> | "all";
  ignoreLanguages?: Array<string>;
};

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
    const charVarMap = new Map<integer, string>();
    const delayMap = new Map<integer, integer>();
    const soundMap = new Map<integer, string>();
    const actionPattern = /@(c|d|s)\{(.*?)\}/;
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

  /**
   * @param text
   * @param textObject
   * @param maxWidth
   * @param opts options additional
   * @argument ignoreLanguages ignore adjust for some language.
   * @argument ignoreBalanceText ignore Text Balance for some languages or for all.
   * @argument padding default 0.
   */

  adjustText(text: string, textObject: Phaser.GameObjects.Text, maxWidth: number, opts: argsAjustText = {}): void {
    const currentLanguage = i18next.resolvedLanguage!;
    if (opts.ignoreLanguages && opts.ignoreLanguages[0] && !opts.ignoreLanguages.some(localKey => localKey === currentLanguage)) {
      return;
    }

    const fontSizeToNumber = (FS: number | string): number => {
      return parseInt(FS.toString().replace("px", ""));
    };

    // If fontSize was modified before, revert to original
    const fontSize = textObject.getData("originalFontSize") ?? fontSizeToNumber(textObject.style.fontSize);
    textObject.setData("originalFontSize", textObject.getData("originalFontSize") ?? fontSize);
    textObject.setFontSize(fontSize);

    const textWrapped = () => textObject.getWrappedText(text);
    const textSize = () => Phaser.GameObjects.GetTextSize(textObject, textObject.style.getTextMetrics(), textWrapped());
    const balanceText = typeof opts.ignoreTextBalance === "string" ? opts.ignoreTextBalance === "all" : (opts.ignoreTextBalance && opts.ignoreTextBalance[0] && opts.ignoreTextBalance.some(localKey => localKey === currentLanguage));

    // Text Balance
    if (!balanceText && textWrapped()[1] && textWrapped().length <= textObject.style.maxLines && textWrapped()[0].length * 0.25 > textWrapped()[1].length) {
      textObject.setWordWrapWidth(maxWidth * 0.65);
    }

    // If is very near to border add "padding", not need if border container appareance is nice
    const padding = opts.padding ?? 0;

    // Text ajust
    if (textWrapped().length > textObject.style.maxLines || (textSize().width + padding) > maxWidth) {

      let fontDecrement = fontSize;
      while (textWrapped().length > textObject.style.maxLines || (textSize().width + padding) > maxWidth) {
        fontDecrement -= 1;
        textObject.setFontSize(fontDecrement);
      }
      textObject.setFontSize(fontDecrement - padding / 2);

    }
  }
}
