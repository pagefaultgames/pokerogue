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
      // text = this.runWrapSpecialCase(text); // TODO
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
          const runWrap = this.message.runWordWrap(nextWordText);
          const lineCount = runWrap.split(/\n/g).length;
          if (lineCount > lastLineCount) {
            lastLineCount = lineCount;
            newText = `${newText}\n${textWords[w]}`;
          } else {
            newText = nextWordText;
          }
        }
      }

      const wasTextAdjusted = this.message.getData("originalMaxWidth") || this.message.getData("originalFontSize") || this.message.getData("originalMaxLines");
      if (!!wasTextAdjusted) {
        const isWidthOverflow = (this.message.style.wordWrapWidth && this.textSize(newText).width > this.message.style.wordWrapWidth);
        const isHeightOverflow = (this.textHeight(newText) + (this.message.y / this.message.scale) > this.textHeight(text));
        const isOverflow = isWidthOverflow || isHeightOverflow;
        if (!isOverflow) {
          text = newText;
        }
      } else {
        text = newText;
      }
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
      const fontScale = parseInt(this.message.style.fontSize.toString()) / 100 + 0.04;
      const scale = this.message.scale;
      this.prompt.setScale(fontScale);
      const textSize = this.textSize(this.message.text);
      const lastLineWidth = textSize.lineWidths[textSize.lineWidths.length - 1];

      let x = lastLineWidth * scale + this.message.x + 2;
      let y = this.message.y + (textSize.lineHeight * scale * (textSize.lines - 1)) + (textSize.lineSpacing * scale * (textSize.lines - 1)) + 2;
      // wrap prompt
      if (this.message.style.wordWrapWidth) {
        if (lastLineWidth + this.prompt.getBounds().width >= this.message.style.wordWrapWidth) {
          x = this.message.x;
          y = y * 1.5;
        }
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
        this.prompt.setScale(1);
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
   * @example Use before showText():
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
   * @description It tests a text before showing it to adjust it to a graphic element
   * @param text
   * @param opts options additional
   * @argument ignoreLanguages ignore adjust for some languages or for all.
   * @argument maxWidth default this.message.style.wordWrapWidth or this.message.parentContainer.getBounds().width.
   * @argument guideHeight default this.message.parentContainer, If the container has many elements or `this.message` does not have a clear guide, use the parent container as a reference guide by default.
   * @argument padding default { right: this.message.x, bottom: this.message.y }.
   */

  tryAdjustText(text: string, opts?: argsAdjustText): void {
    const currentLanguage = i18next.resolvedLanguage!;
    if (opts?.ignoreLanguages && opts.ignoreLanguages[0] && (opts.ignoreLanguages === "all" || opts.ignoreLanguages.some(localKey => localKey === currentLanguage)) || !text) {
      return;
    }

    const textPaddingScale = 1.2;
    const posX = (opts?.padding?.right ?? this.message.x) * textPaddingScale || 1;
    const posY = (opts?.padding?.bottom ?? this.message.y) * textPaddingScale || 1;

    // text = this.runWrapSpecialCase(text); // TODO

    const referenceGuide = opts?.guideHeight ?? this.message.parentContainer;

    // If any style changes were made in previous tryAdjustText() calls, revert to the original data.
    // [Note] Be aware that if dynamic styles are being applied to the same this.message from another source for attributes such as fontSize, maxLines, wordWrap, this may cause issues.
    if (this.message.getData("originalMaxLines")) {
      this.message.style.setMaxLines(this.message.getData("originalMaxLines"));
      this.message.data.remove("originalMaxLines");
    }

    const paddingX = posX / this.message.scale;
    const paddingY = posY / this.message.scale - this.message.lineSpacing;

    const maxHeight = referenceGuide.getBounds().height - (paddingY * 2);
    const maxWidth = this.message.getData("originalMaxWidth") ?? Math.floor(opts?.maxWidth ?? this.message.style.wordWrapWidth ?? referenceGuide.getBounds().width) - paddingX;
    this.message.setData("originalMaxWidth", this.message.getData("originalMaxWidth") ?? maxWidth);
    this.message.setWordWrapWidth(maxWidth);

    const fontSize = this.message.getData("originalFontSize") ?? parseInt(this.message.style.fontSize.toString());
    this.message.setData("originalFontSize", fontSize);
    this.message.setFontSize(fontSize);

    const getFontSize = () => parseInt(this.message.style.fontSize.toString());

    const wrapWidthAdjust = () => {
      if (this.textSize(text).width
        + Math.ceil(this.message.style.wordWrapWidth! + (paddingX / (posX / 2)) - this.textSize(text).width)
        >= maxWidth) {
        while (
          this.textSize(text).width
          + Math.ceil(this.message.style.wordWrapWidth! + (paddingX / (posX / 2)) - this.textSize(text).width)
          >= maxWidth
          && this.message.style.wordWrapWidth! > 10) {
          this.message.setWordWrapWidth(--this.message.style.wordWrapWidth!);
        }

      }
      // If after trying to adjust the wordWrapWidth it remains the same, it means that..
      //.. there is no space between words, so the fontSize is adjusted to fit.
      if (this.textSize(text).width + (posX * 2) >= maxWidth) {
        if (this.textSize(text).width >= maxWidth) {
          this.message.setWordWrapWidth(maxWidth);
        }
        while (this.textSize(text).width + (posX * 2) >= maxWidth && getFontSize() > 30) {
          this.message.setFontSize(getFontSize() - 1);
        }
      }
    };
    wrapWidthAdjust();

    if (
      this.textHeight(text) > maxHeight
      + Math.floor(this.textHeight(text) + (paddingY / posY) - this.textSize(text).height)
      || this.textWrapped(text).length > this.message.style.maxLines
    ) {

      while (
        this.textHeight(text) > maxHeight
        + Math.floor(this.textHeight(text) + (paddingY / posY) - this.textSize(text).height)
        || this.textWrapped(text).length > this.message.style.maxLines
        && getFontSize() > 10
      ) {
        this.message.setFontSize(getFontSize() - 1);

        if (!this.message.getData("originalMaxLines")) {
          this.message.setData("originalMaxLines", this.message.style.maxLines);
        }
        this.message.setMaxLines(Math.ceil(this.textHeight(text) / (this.textSize(text).lineHeight + posY + this.textWrapped(text).length)));


        if (this.textSize(text).width >= maxWidth) {
          this.message.setWordWrapWidth(maxWidth);
        }
        wrapWidthAdjust();
      }

    }
  }


  protected textWrapped(text: string): string[] {
    return this.message.getWrappedText(text);
  }

  protected textSize(text: string): Phaser.Types.GameObjects.Text.GetTextSizeObject {
    return Phaser.GameObjects.GetTextSize(this.message, this.message.style.getTextMetrics(), this.textWrapped(text));
  }

  protected textHeight(text: string): number {
    return this.textSize(text).lineHeight * this.textWrapped(text).length + (this.textSize(text).lineSpacing * (this.textWrapped(text).length - 1));
  }

  // // TODO: Line breaking rules about the beginning/end of a line, for more information see  https://en.wikipedia.org/wiki/Line_breaking_rules_in_East_Asian_languages#Line_breaking_rules_in_Japanese_text_(Kinsoku_Shori)
  // private runWrapSpecialCase(text: string): string {
  //   let newText = "";
  //   if (text) {

  //     const textWords = text.split(/[ 　。？！!.,-]/g);
  //     const space = text.match(/[ 　。？！!.,-]/g);
  //     for (let w = 0; w < textWords.length; w++) {
  //       let spaceType: string = " ";
  //       if (space?.[0]) {
  //         spaceType = space[w - 1];
  //       }
  //       let nextWordText: string = newText ? `${newText}${spaceType}${textWords[w]}` : textWords[w];

  //       const sizeNewText = this.textSize(nextWordText);
  //       const isWidthOverflow = this.message.style.wordWrapWidth && sizeNewText.width > this.message.style.wordWrapWidth;
  //       if (isWidthOverflow && textWords[w]) {
  //         nextWordText = newText !== "" ? `${newText}${spaceType}\n${textWords[w]}` : textWords[w];
  //       }

  //       newText = nextWordText;
  //     }
  //   }

  //   return newText;
  // }
}

interface argsAdjustText {
  ignoreLanguages?: Array<string> | "all" | null;
  maxWidth?: number;
  guideHeight?: Phaser.GameObjects.Container | Phaser.GameObjects.Sprite | Phaser.GameObjects.NineSlice;
  padding?: { right?: number, bottom?: number };
}
