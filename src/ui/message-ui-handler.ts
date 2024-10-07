import BattleScene from "../battle-scene";
import AwaitableUiHandler from "./awaitable-ui-handler";
import { Mode } from "./ui";
import * as Utils from "../utils";
import i18next from "i18next";

export default abstract class MessageUiHandler extends AwaitableUiHandler {
  protected textTimer: Phaser.Time.TimerEvent | null;
  protected textCallbackTimer: Phaser.Time.TimerEvent | null;
  public pendingPrompt: boolean;

  public message: Phaser.GameObjects.Text;
  public prompt: Phaser.GameObjects.Sprite;
  protected promptOut: { x: number, y: number } | null;

  constructor(scene: BattleScene, mode: Mode | null = null) {
    super(scene, mode);

    this.pendingPrompt = false;
  }

  /**
   * Add the sprite to be displayed at the end of messages with prompts
   * @param container the container to add the sprite to
   */
  initPromptSprite(container: Phaser.GameObjects.Container) {
    if (!this.prompt) {
      const promptSprite = this.scene.add.sprite(0, 0, "prompt");
      promptSprite.setVisible(false);
      promptSprite.setOrigin(0, 0);
      this.prompt = promptSprite;
    }

    if (container) {
      container.add(this.prompt);
    }
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
    if (this.prompt) {
      this.prompt.setScale(parseInt(this.message.style.fontSize.toString()) / 100 + 0.04);
      const textSize = Phaser.GameObjects.GetTextSize(this.message, this.message.style.getTextMetrics(), this.message.getWrappedText(this.message.text));
      const lastLineWidth = textSize.lineWidths[textSize.lineWidths.length - 1];
      let x = lastLineWidth * this.message.scale + this.message.x + 2;
      let y = this.message.y + (textSize.height * this.message.scale / (20 - textSize.lines) - 0.5) * 18;
      if (this.promptOut) {
        x = this.promptOut.x * this.message.scale - (this.message.x * 2) + 2;
        y = (this.promptOut.y - (this.message.y * 2)) * this.message.scale / 1.3;
        this.promptOut = null;
      }
      this.prompt.setPosition(x, y);
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

  isTextAnimationInProgress() {
    if (this.textTimer) {
      return this.textTimer.repeatCount < this.textTimer.repeat;
    }

    return false;
  }

  clearText() {
    this.message.setText("");
    this.pendingPrompt = false;
  }

  clear() {
    super.clear();
  }

  /**
   * Use before showText(), ex:
   * ``` ts
   *  // Handler extends MessageUiHandler.ts...
   *  const ui = this.getUi();
   *  this.tryAdjustText(text, opts); // Or ui.getMessageHandler().tryAdjustText()...
   *  ui.showText(...);
   *
   *  // Or in showText():
   *  showText(...) {
   *    this.tryAdjustText(text, opts);
   *    super.showText(...);
   *  }
   * ```
   * @param text
   * @param opts options additional
   * @argument ignoreLanguages ignore adjust for some languages or for all.
   * @argument maxWidth default this.message.style.wordWrapWidth or this.message.parentContainer.getBounds().width.
   * @argument guideHeight default this.message.parentContainer, If the container has many elements or `this.message` does not have a clear guide, use the parent container as a reference guide by default.
   */

  tryAdjustText(text: string, opts?: argsAdjustText): void {
    const currentLanguage = i18next.resolvedLanguage!;
    if (opts?.ignoreLanguages && opts.ignoreLanguages[0] && (opts.ignoreLanguages === "all" || !opts.ignoreLanguages.some(localKey => localKey === currentLanguage))) {
      return;
    }

    const referenceGuide = opts?.guideHeight ?? this.message.parentContainer;

    // If any style changes were made in previous tryAdjustText() calls, revert to the original data.
    // [Note] Be aware that if dynamic styles are being applied to the same this.message from another source for attributes such as fontSize, maxLines, wordWrap, this may cause issues.
    if (this.message.getData("originalMaxLines")) {
      this.message.style.setMaxLines(this.message.getData("originalMaxLines"));
      this.message.data.remove("originalMaxLines");
    }
    const maxWidth = this.message.getData("originalMaxWidth") ?? Math.floor(opts?.maxWidth ?? this.message.style.wordWrapWidth ?? referenceGuide.getBounds().width);
    this.message.setData("originalMaxWidth", this.message.getData("originalMaxWidth") ?? maxWidth);
    this.message.setWordWrapWidth(maxWidth);

    const fontSize = this.message.getData("originalFontSize") ?? parseInt(this.message.style.fontSize.toString());
    this.message.setData("originalFontSize", fontSize);
    this.message.setFontSize(fontSize);

    const scale = this.message.scale;

    const textWrapped = () => this.message.getWrappedText(text);
    const textSize = () => Phaser.GameObjects.GetTextSize(this.message, this.message.style.getTextMetrics(), textWrapped());

    const xToPaddingX = ((this.message.x ** 2) - this.message.x / 2) * 2; // Approximate equivalent to what the padding.x (padding.left + padding.right) should be
    const paddingX = (xToPaddingX * 1.5) / (this.message.x * scale) - this.message.x * 8 || 0; // If it's too large, scale it down to maintain aspect ratio with x

    const yToPaddingY = ((this.message.y ** 2) - this.message.y / 2) * 2; // Approximate equivalent to what the padding.y (padding.top + padding.bottom) should be
    const paddingY = (yToPaddingY * 1.5) / (this.message.y * scale) - this.message.y * 2 || 0; // If it's too large, scale it down to maintain aspect ratio with y

    // FontSize adjust
    let fontDecrement = fontSize;
    const adjustFontSize = (condition: () => boolean = () => (textWrapped().length > this.message.style.maxLines)): void => {
      if (Utils.isNullOrUndefined(text) || text === "") {
        return;
      }
      const minFontSize = 40;
      while (condition() && fontDecrement > minFontSize) {
        fontDecrement--;
        this.message.setFontSize(fontDecrement);

        // If the text has been shrunk so much that another line can fit in the text, add it
        // This is to preserve the maximum possible font size.
        if ((textSize().height + textSize().lineHeight + paddingY) < referenceGuide.getBounds().height) {
          const linesNeed = Math.round((textSize().height + paddingY) / textSize().lineHeight);
          if (linesNeed > this.message.style.maxLines) {
            if (!this.message.getData("originalMaxLines")) {
              // We save the current value as it will be modified, so we can return it in the next showText()
              this.message.setData("originalMaxLines", this.message.style.maxLines);
            }
            this.message.style.setMaxLines(linesNeed);
          }
        }

        if (textSize().height + paddingY - 15 > referenceGuide.getBounds().height) {
          if (!this.message.getData("originalMaxLines")) {
            // We save the current value as it will be modified, so we can return it in the next showText()
            this.message.setData("originalMaxLines", this.message.style.maxLines);
          }
          this.message.style.setMaxLines(--this.message.style.maxLines);
          adjustFontSize();
          break;
        }

        // checking the maximum width
        this.message.setWordWrapWidth(maxWidth);
        adjustWordWrap();
      }

    };

    // wordWrapWidth adjust
    let widthDecrement = maxWidth;
    const adjustWordWrap = (): void => {
      if (Utils.isNullOrUndefined(text) || text === "") {
        return;
      }

      if (textSize().width + paddingX + Math.round((widthDecrement - textSize().width) / 1.15) >= maxWidth) {
        while (textSize().width + paddingX + Math.round((widthDecrement - textSize().width) / 1.15) >= maxWidth && widthDecrement > 100) {
          widthDecrement--;
          this.message.setWordWrapWidth(widthDecrement);
        }

      }

      // If after trying to adjust the wordWrapWidth it remains the same, it means that..
      //.. there is no space between words, so the fontSize is adjusted to fit.
      if (textSize().width + (paddingX * 1.2) >= maxWidth) {
        this.message.setWordWrapWidth(maxWidth);
        adjustFontSize(() => textSize().width + (paddingX * 1.2) >= maxWidth);
      }
    };
    adjustWordWrap();

    if (textWrapped().length > this.message.style.maxLines) {

      adjustFontSize();

      adjustWordWrap(); // after adjustFontSize, respect "padding"

      // Some line breaks (\n) may also prevent the text from being displayed..
      //.. so if the text is still too large due to the previous issue, adjust it.
      if (textSize().height + paddingY - 15 > referenceGuide.getBounds().height) {
        adjustFontSize(() => (textSize().height + paddingY - 15 > referenceGuide.getBounds().height));
      }

    }

    const lastLine = textSize().lineWidths[textSize().lineWidths.length - 1];

    // If when adjusting the text the prompt goes outside..
    // .. save the data to put the prompt in the bottom right corner
    if (!this.promptOut && lastLine + (paddingX * 1.5) >= maxWidth) {
      this.promptOut = {
        x: maxWidth,
        y: referenceGuide.getBounds().height
      };
    } else {
      this.promptOut = null;
    }

  }
}

interface argsAdjustText {
  ignoreLanguages?: Array<string> | "all" | null;
  maxWidth?: number;
  guideHeight?: Phaser.GameObjects.Container | Phaser.GameObjects.Sprite | Phaser.GameObjects.NineSlice
}
