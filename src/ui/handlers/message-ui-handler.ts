import { audioManager } from "#app/global-audio-manager";
import { globalScene } from "#app/global-scene";
import { settings } from "#app/global-settings-manager";
import { TextStyle } from "#enums/text-style";
import { AwaitableUiHandler } from "#ui/awaitable-ui-handler";
import { addBBCodeTextObject } from "#ui/text";
import { getFrameMs } from "#utils/common";
import type BBCodeText from "phaser3-rex-plugins/plugins/bbcodetext";

export abstract class MessageUiHandler extends AwaitableUiHandler {
  protected textTimer: Phaser.Time.TimerEvent | null;
  protected textCallbackTimer: Phaser.Time.TimerEvent | null;
  public pendingPrompt = false;

  public message: Phaser.GameObjects.Text;
  public prompt: Phaser.GameObjects.Sprite;
  public nameBoxContainer: Phaser.GameObjects.Container;
  private nameBox: Phaser.GameObjects.NineSlice;
  private nameIcon: Phaser.GameObjects.Sprite;
  private nameText: BBCodeText;

  public readonly wordWrapWidth: number = 1780;

  /**
   * Add the name box shown by {@linkcode showDialogue} to the given message container.
   * @param container - The container holding the message text
   * @param x - The x position of the name box
   * @param y - The y position of the name box
   * @remarks
   * When this method was not called, the name box will not be displayed.
   */
  public initNameBox(container: Phaser.GameObjects.Container, x = 0, y = -16): void {
    this.nameBoxContainer = globalScene.add.container(x, y);
    this.nameBoxContainer.setVisible(false);

    this.nameBox = globalScene.add.nineslice(0, 0, "namebox", settings.display.uiWindowStyle, 72, 16, 8, 8, 5, 5);
    this.nameBox.setOrigin(0, 0);

    this.nameIcon = globalScene.add.sprite(8, 0, "items", "");
    this.nameIcon.setOrigin(0, 0);
    this.nameIcon.setVisible(false);

    this.nameText = addBBCodeTextObject(8, 0, "Rival", TextStyle.MESSAGE, { maxLines: 1 });

    this.nameBoxContainer.add(this.nameBox);
    this.nameBoxContainer.add(this.nameIcon);
    this.nameBoxContainer.add(this.nameText);
    container.add(this.nameBoxContainer);
  }

  /**
   * Add the sprite to be displayed at the end of messages with prompts
   * @param container the container to add the sprite to
   */
  public initPromptSprite(container: Phaser.GameObjects.Container) {
    if (!this.prompt) {
      const promptSprite = globalScene.add.sprite(0, 0, "prompt");
      promptSprite.setVisible(false);
      promptSprite.setOrigin(0, 0);
      this.prompt = promptSprite;
    }

    if (container) {
      container.add(this.prompt);
    }
  }

  showText(
    text: string,
    delay?: number | null,
    callback?: (() => void) | null,
    callbackDelay?: number | null,
    prompt?: boolean | null,
    promptDelay?: number | null,
  ) {
    this.hideNameText();
    this.showTextInternal(text, delay, callback, callbackDelay, prompt, promptDelay);
  }

  showDialogue(
    text: string,
    name?: string,
    delay?: number | null,
    callback?: (() => void) | null,
    callbackDelay?: number | null,
    prompt?: boolean | null,
    promptDelay?: number | null,
  ) {
    this.showText(text, delay, callback, callbackDelay, prompt, promptDelay);
    if (name) {
      this.showNameText(name);
    }
  }

  private showTextInternal(
    text: string,
    delay?: number | null,
    callback?: (() => void) | null,
    callbackDelay?: number | null,
    prompt?: boolean | null,
    promptDelay?: number | null,
  ) {
    if (delay === null || delay === undefined) {
      delay = 20;
    }

    // Pattern matching regex that checks for @c{}, @f{}, @s{}, and @f{} patterns within message text and parses them to their respective behaviors.
    const charVarMap = new Map<number, string>();
    const delayMap = new Map<number, number>();
    const soundMap = new Map<number, string>();
    const fadeMap = new Map<number, number>();
    const actionPattern = /@(c|d|s|f)\{(.*?)\}/;
    let actionMatch: RegExpExecArray | null;
    const pokename: string[] = [];
    const repname = ["#POKEMON1", "#POKEMON2"];
    for (let p = 0; p < globalScene.getPlayerField().length; p++) {
      pokename.push(globalScene.getPlayerField()[p].getNameToRender());
      text = text.split(pokename[p]).join(repname[p]);
    }
    while ((actionMatch = actionPattern.exec(text))) {
      switch (actionMatch[1]) {
        case "c":
          charVarMap.set(actionMatch.index, actionMatch[2]);
          break;
        case "d":
          delayMap.set(actionMatch.index, Number.parseInt(actionMatch[2]));
          break;
        case "s":
          soundMap.set(actionMatch.index, actionMatch[2]);
          break;
        case "f":
          fadeMap.set(actionMatch.index, Number.parseInt(actionMatch[2]));
          break;
      }
      text = text.slice(0, actionMatch.index) + text.slice(actionMatch.index + actionMatch[2].length + 4);
    }

    for (let p = 0; p < globalScene.getPlayerField().length; p++) {
      text = text.split(repname[p]).join(pokename[p]);
    }
    if (text) {
      // Predetermine overflow line breaks to avoid words breaking while displaying
      const textWords = text.split(" ");
      let lastLineCount = 1;
      let newText = "";
      for (const textWord of textWords) {
        const nextWordText = newText ? `${newText} ${textWord}` : textWord;

        if (textWord.includes("\n")) {
          newText = nextWordText;
          lastLineCount++;
        } else {
          const lineCount = this.message.runWordWrap(nextWordText).split(/\n/g).length;
          if (lineCount > lastLineCount) {
            lastLineCount = lineCount;
            newText = `${newText}\n${textWord}`;
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
          globalScene.time.delayedCall(promptDelay, showPrompt);
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
      this.textTimer = globalScene.time.addEvent({
        delay,
        callback: () => {
          const charIndex = text.length - this.textTimer?.repeatCount!; // TODO: is this bang correct?
          const charVar = charVarMap.get(charIndex);
          const charSound = soundMap.get(charIndex);
          const charDelay = delayMap.get(charIndex);
          const charFade = fadeMap.get(charIndex);
          this.message.setText(text.slice(0, charIndex));
          const advance = () => {
            if (charVar) {
              globalScene.charSprite.setVariant(charVar);
            }
            if (charSound) {
              audioManager.playSound(charSound);
            }
            if (callback && !this.textTimer?.repeatCount) {
              if (callbackDelay && !prompt) {
                this.textCallbackTimer = globalScene.time.delayedCall(callbackDelay, () => {
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
            globalScene.tweens.addCounter({
              duration: getFrameMs(charDelay),
              onComplete: () => {
                this.textTimer!.paused = false; // TODO: is the bang correct?
                advance();
              },
            });
          } else if (charFade) {
            this.textTimer!.paused = true;
            globalScene.time.delayedCall(150, () => {
              globalScene.ui.fadeOut(750).then(() => {
                const delay = getFrameMs(charFade);
                globalScene.time.delayedCall(delay, () => {
                  globalScene.ui.fadeIn(500).then(() => {
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
        repeat: text.length,
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

  showPrompt(callback?: (() => void) | null, callbackDelay?: number | null) {
    const wrappedTextLines = this.message.runWordWrap(this.message.text).split(/\n/g);
    const textLinesCount = wrappedTextLines.length;
    const lastTextLine = wrappedTextLines.at(-1) ?? "";
    const lastLineTest = globalScene.add.text(0, 0, lastTextLine, {
      font: "96px emerald",
    });
    lastLineTest.setScale(this.message.scale);
    const lastLineWidth = lastLineTest.displayWidth;
    lastLineTest.destroy();
    if (this.prompt) {
      this.prompt.setPosition(this.message.x + lastLineWidth + 2, this.message.y + (textLinesCount - 1) * 18 + 2);
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
          this.textCallbackTimer = globalScene.time.delayedCall(callbackDelay, () => {
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

  /**
   * Show a name above the text.
   * @param name - The name to show
   * @param iconFrame - The frame of the icon to display next to the name
   * @remarks
   * the icon must be from the `items` atlas
   */
  public showNameText(name: string, iconFrame?: string): void {
    if (!this.nameBoxContainer) {
      console.warn("Called `showNameText` without initializing the name box");
      return;
    }
    this.nameBoxContainer.setVisible(true);
    this.nameText.setText(name);

    if (iconFrame) {
      this.nameIcon.setTexture("items", iconFrame);
      this.nameIcon.setVisible(true);
      this.nameIcon.setScale(0.5);
      this.nameText.x = this.nameIcon.x + this.nameIcon.displayWidth + 4;
    } else {
      this.nameIcon.setVisible(false);
      this.nameText.x = 8;
    }

    this.nameBox.width = this.nameText.displayWidth + (this.nameIcon.visible ? this.nameIcon.displayWidth + 4 : 0) + 16;
  }

  public hideNameText(): void {
    this.nameBoxContainer?.setVisible(false);
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
}
