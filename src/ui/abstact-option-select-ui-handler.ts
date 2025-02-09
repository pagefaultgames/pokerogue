import { globalScene } from "#app/global-scene";
import { TextStyle, addBBCodeTextObject, getTextColor, getTextStyleOptions } from "./text";
import { Mode } from "./ui";
import UiHandler from "./ui-handler";
import { addWindow } from "./ui-theme";
import * as Utils from "../utils";
import { argbFromRgba } from "@material/material-color-utilities";
import { Button } from "#enums/buttons";
import BBCodeText from "phaser3-rex-plugins/plugins/bbcodetext";

export interface OptionSelectConfig {
  xOffset?: number;
  yOffset?: number;
  options: OptionSelectItem[];
  maxOptions?: number;
  delay?: number;
  noCancel?: boolean;
  supportHover?: boolean;
}

export interface OptionSelectItem {
  label: string;
  handler: () => boolean;
  onHover?: () => void;
  skip?: boolean;
  keepOpen?: boolean;
  overrideSound?: boolean;
  style?: TextStyle;
  item?: string;
  itemArgs?: any[];
}

const scrollUpLabel = "↑";
const scrollDownLabel = "↓";

export default abstract class AbstractOptionSelectUiHandler extends UiHandler {
  protected optionSelectContainer: Phaser.GameObjects.Container;
  protected optionSelectBg: Phaser.GameObjects.NineSlice;
  protected optionSelectText: BBCodeText;
  protected optionSelectIcons: Phaser.GameObjects.Sprite[];

  protected config: OptionSelectConfig | null;

  protected blockInput: boolean;

  protected scrollCursor: number = 0;
  protected fullCursor: number = 0;

  protected scale: number = 0.1666666667;

  private cursorObj: Phaser.GameObjects.Image | null;

  protected unskippedIndices: number[] = [];

  protected defaultTextStyle: TextStyle = TextStyle.WINDOW;


  constructor(mode: Mode | null) {
    super(mode);
  }

  abstract getWindowWidth(): number;

  getWindowHeight(): number {
    return (Math.min((this.config?.options || []).length, this.config?.maxOptions || 99) + 1) * 96 * this.scale;
  }

  setup() {
    const ui = this.getUi();

    this.optionSelectContainer = globalScene.add.container((globalScene.game.canvas.width / 6) - 1, -48);
    this.optionSelectContainer.setName(`option-select-${this.mode ? Mode[this.mode] : "UNKNOWN"}`);
    this.optionSelectContainer.setVisible(false);
    ui.add(this.optionSelectContainer);

    this.optionSelectBg = addWindow(0, 0, this.getWindowWidth(), this.getWindowHeight());
    this.optionSelectBg.setName("option-select-bg");
    this.optionSelectBg.setOrigin(1, 1);
    this.optionSelectContainer.add(this.optionSelectBg);

    this.optionSelectIcons = [];

    this.scale = getTextStyleOptions(TextStyle.WINDOW, globalScene.uiTheme).scale;

    this.setCursor(0);
  }

  protected setupOptions() {
    const configOptions = this.config?.options ?? [];

    const options: OptionSelectItem[] = configOptions;

    this.unskippedIndices = this.getUnskippedIndices(configOptions);

    if (this.optionSelectText) {
      if (this.optionSelectText instanceof BBCodeText) {
        try {
          this.optionSelectText.destroy();
        } catch (error) {
          console.error("Error while destroying optionSelectText:", error);
        }
      } else {
        console.warn("optionSelectText is not an instance of BBCodeText.");
      }
    }

    if (this.optionSelectIcons?.length) {
      this.optionSelectIcons.map(i => i.destroy());
      this.optionSelectIcons.splice(0, this.optionSelectIcons.length);
    }

    const optionsWithScroll = (this.config?.options && this.config?.options.length > (this.config?.maxOptions!)) ? this.getOptionsWithScroll() : options;

    // Setting the initial text to establish the width of the select object. We consider all options, even ones that are not displayed,
    // Except in the case of autocomplete, where we don't want to set up a text element with potentially hundreds of lines.
    const optionsForWidth = globalScene.ui.getMode() === Mode.AUTO_COMPLETE ? optionsWithScroll : options;
    this.optionSelectText = addBBCodeTextObject(
      0, 0, optionsForWidth.map(o => o.item
        ? `[shadow=${getTextColor(o.style ?? this.defaultTextStyle, true, globalScene.uiTheme)}][color=${getTextColor(o.style ?? TextStyle.WINDOW, false, globalScene.uiTheme)}]    ${o.label}[/color][/shadow]`
        : `[shadow=${getTextColor(o.style ?? this.defaultTextStyle, true, globalScene.uiTheme)}][color=${getTextColor(o.style ?? TextStyle.WINDOW, false, globalScene.uiTheme)}]${o.label}[/color][/shadow]`
      ).join("\n"),
      TextStyle.WINDOW, { maxLines: options.length, lineSpacing: 12 }
    );
    this.optionSelectText.setOrigin(0, 0);
    this.optionSelectText.setName("text-option-select");
    this.optionSelectContainer.add(this.optionSelectText);
    this.optionSelectContainer.setPosition((globalScene.game.canvas.width / 6) - 1 - (this.config?.xOffset || 0), -48 + (this.config?.yOffset || 0));
    this.optionSelectBg.width = Math.max(this.optionSelectText.displayWidth + 24, this.getWindowWidth());
    this.optionSelectBg.height = this.getWindowHeight();
    this.optionSelectText.setPosition(this.optionSelectBg.x - this.optionSelectBg.width + 12 + 24 * this.scale, this.optionSelectBg.y - this.optionSelectBg.height + 2 + 42 * this.scale);

    // Now that the container and background widths are established, we can set up the proper text restricted to visible options
    this.optionSelectText.setText(optionsWithScroll.map(o => o.item
      ? `[shadow=${getTextColor(o.style ?? this.defaultTextStyle, true, globalScene.uiTheme)}][color=${getTextColor(o.style ?? TextStyle.WINDOW, false, globalScene.uiTheme)}]    ${o.label}[/color][/shadow]`
      : `[shadow=${getTextColor(o.style ?? this.defaultTextStyle, true, globalScene.uiTheme)}][color=${getTextColor(o.style ?? TextStyle.WINDOW, false, globalScene.uiTheme)}]${o.label}[/color][/shadow]`
    ).join("\n")

    );

    options.forEach((option: OptionSelectItem, i: number) => {
      if (option.item) {
        const itemIcon = globalScene.add.sprite(0, 0, "items", option.item);
        itemIcon.setScale(3 * this.scale);
        this.optionSelectIcons.push(itemIcon);

        this.optionSelectContainer.add(itemIcon);

        itemIcon.setPositionRelative(this.optionSelectText, 36 * this.scale, 7 + i * (114 * this.scale - 3));

        if (option.item === "candy") {
          const itemOverlayIcon = globalScene.add.sprite(0, 0, "items", "candy_overlay");
          itemOverlayIcon.setScale(3 * this.scale);
          this.optionSelectIcons.push(itemOverlayIcon);

          this.optionSelectContainer.add(itemOverlayIcon);

          itemOverlayIcon.setPositionRelative(this.optionSelectText, 36 * this.scale, 7 + i * (114 * this.scale - 3));

          if (option.itemArgs) {
            itemIcon.setTint(argbFromRgba(Utils.rgbHexToRgba(option.itemArgs[0])));
            itemOverlayIcon.setTint(argbFromRgba(Utils.rgbHexToRgba(option.itemArgs[1])));
          }
        }
      }
    });
  }

  show(args: any[]): boolean {
    if (!args.length || !args[0].hasOwnProperty("options") || !args[0].options.length) {
      return false;
    }

    super.show(args);

    this.config = args[0] as OptionSelectConfig;
    this.setupOptions();

    globalScene.ui.bringToTop(this.optionSelectContainer);

    this.optionSelectContainer.setVisible(true);
    this.scrollCursor = 0;
    this.fullCursor = 0;
    this.setCursor(0);

    if (this.config.delay) {
      this.blockInput = true;
      this.optionSelectText.setAlpha(0.5);
      this.cursorObj?.setAlpha(0.8);
      globalScene.time.delayedCall(Utils.fixedInt(this.config.delay), () => this.unblockInput());
    }

    if (this.config?.supportHover) {
      // handle hover code if the element supports hover-handlers and the option has the optional hover-handler set.
      this.config?.options[this.unskippedIndices[this.fullCursor]]?.onHover?.();
    }

    return true;
  }

  processInput(button: Button): boolean {
    const ui = this.getUi();

    let success = false;

    let playSound = true;

    if (button === Button.ACTION || button === Button.CANCEL) {
      if (this.blockInput) {
        ui.playError();
        return false;
      }

      success = true;
      if (button === Button.CANCEL) {
        if (this.config?.maxOptions && this.config.options.length > this.config.maxOptions) {
          this.setCursor(this.unskippedIndices.length - 1);
        } else if (!this.config?.noCancel) {
          this.setCursor(this.unskippedIndices.length - 1);
        } else {
          return false;
        }
      }
      const option = this.config?.options[this.unskippedIndices[this.fullCursor]];
      if (option?.handler()) {
        if (!option.keepOpen) {
          this.clear();
        }
        playSound = !option.overrideSound;
      } else {
        ui.playError();
      }
    } else if (button === Button.SUBMIT && ui.getMode() === Mode.AUTO_COMPLETE) {
      // this is here to differentiate between a Button.SUBMIT vs Button.ACTION within the autocomplete handler
      // this is here because Button.ACTION is picked up as z on the keyboard, meaning if you're typing and hit z, it'll select the option you've chosen
      success = true;
      const option = this.config?.options[this.unskippedIndices[this.fullCursor]];
      if (option?.handler()) {
        if (!option.keepOpen) {
          this.clear();
        }
        playSound = !option.overrideSound;
      } else {
        ui.playError();
      }
    } else {
      switch (button) {
        case Button.UP:
          if (this.fullCursor === 0) {
            success = this.setCursor(this.unskippedIndices.length - 1);
          } else if (this.fullCursor) {
            success = this.setCursor(this.fullCursor - 1);
          }
          break;
        case Button.DOWN:
          if (this.fullCursor < this.unskippedIndices.length - 1) {
            success = this.setCursor(this.fullCursor + 1);
          } else {
            success = this.setCursor(0);
          }
          break;
      }
      if (this.config?.supportHover) {
        // handle hover code if the element supports hover-handlers and the option has the optional hover-handler set.
        this.config?.options[this.unskippedIndices[this.fullCursor]]?.onHover?.();
      }
    }

    if (success && playSound) {
      ui.playSelect();
    }

    return success;
  }

  unblockInput(): void {
    if (!this.blockInput) {
      return;
    }

    this.blockInput = false;
    this.optionSelectText.setAlpha(1);
    this.cursorObj?.setAlpha(1);
  }

  getOptionsWithScroll(): OptionSelectItem[] {
    if (!this.config) {
      return [];
    }

    const options = this.config.options.slice(0);

    if (!this.config.maxOptions || this.config.options.length < this.config.maxOptions) {
      return options;
    }

    const optionsScrollTotal = options.length;
    const optionStartIndex = this.scrollCursor;
    const optionEndIndex = Math.min(optionsScrollTotal, optionStartIndex +
      (!optionStartIndex || this.scrollCursor + (this.config.maxOptions - 1) >= optionsScrollTotal ? this.config.maxOptions - 1 : this.config.maxOptions - 2)
    );

    if (this.config?.maxOptions && options.length > this.config.maxOptions) {
      options.splice(optionEndIndex, optionsScrollTotal);
      options.splice(0, optionStartIndex);
      if (optionStartIndex) {
        options.unshift({
          label: scrollUpLabel,
          handler: () => true,
          style: this.defaultTextStyle
        });
      }
      if (optionEndIndex < optionsScrollTotal) {
        options.push({
          label: scrollDownLabel,
          handler: () => true,
          style: this.defaultTextStyle
        });
      }
    }

    return options;
  }

  getUnskippedIndices(options: OptionSelectItem[]) {
    const unskippedIndices = options
      .map((option, index) => (option.skip ? null : index)) // Map to index or null if skipped
      .filter(index => index !== null) as number[];
    return unskippedIndices;
  }

  setCursor(fullCursor: number): boolean {
    const changed = this.fullCursor !== fullCursor;

    if (changed && this.config?.maxOptions && this.config.options.length > this.config.maxOptions) {

      // If the fullCursor is the last possible value, we go to the bottom
      if (fullCursor === this.unskippedIndices.length - 1) {
        this.fullCursor = fullCursor;
        this.cursor = this.config.maxOptions - (this.config.options.length - this.unskippedIndices[fullCursor]);
        this.scrollCursor = this.config.options.length - this.config.maxOptions + 1;
      // If the fullCursor is the first possible value, we go to the top
      } else if (fullCursor === 0) {
        this.fullCursor = fullCursor;
        this.cursor = this.unskippedIndices[fullCursor];
        this.scrollCursor = 0;
      } else {
        const isDown = fullCursor && fullCursor > this.fullCursor;

        if (isDown) {
          // If there are skipped options under the next selection, we show them
          const jumpFromCurrent = this.unskippedIndices[fullCursor] - this.unskippedIndices[this.fullCursor];
          const skipsFromNext = this.unskippedIndices[fullCursor + 1] - this.unskippedIndices[fullCursor] - 1;

          if (this.cursor + jumpFromCurrent + skipsFromNext >= this.config.maxOptions - 1) {
            this.fullCursor = fullCursor;
            this.cursor = this.config.maxOptions - 2 - skipsFromNext;
            this.scrollCursor = this.unskippedIndices[this.fullCursor] - this.cursor + 1;
          } else {
            this.fullCursor = fullCursor;
            this.cursor = this.unskippedIndices[fullCursor] - this.scrollCursor + (this.scrollCursor ? 1 : 0);
          }
        } else {
          const jumpFromPrevious = this.unskippedIndices[fullCursor] - this.unskippedIndices[fullCursor - 1];

          if (this.cursor - jumpFromPrevious < 1) {
            this.fullCursor = fullCursor;
            this.cursor = 1;
            this.scrollCursor = this.unskippedIndices[this.fullCursor] - this.cursor + 1;
          } else {
            this.fullCursor = fullCursor;
            this.cursor = this.unskippedIndices[fullCursor] - this.scrollCursor + (this.scrollCursor ? 1 : 0);
          }
        }
      }
    } else {
      this.fullCursor = fullCursor;
      this.cursor = this.unskippedIndices[fullCursor];
    }

    this.setupOptions();

    if (!this.cursorObj) {
      this.cursorObj = globalScene.add.image(0, 0, "cursor");
      this.optionSelectContainer.add(this.cursorObj);
    }

    this.cursorObj.setScale(this.scale * 6);
    this.cursorObj.setPositionRelative(this.optionSelectBg, 12, 102 * this.scale + this.cursor * (114 * this.scale - 3));

    return changed;
  }

  clear() {
    super.clear();
    this.config = null;
    this.optionSelectContainer.setVisible(false);
    this.fullCursor = 0;
    this.scrollCursor = 0;
    this.eraseCursor();
  }

  eraseCursor() {
    if (this.cursorObj) {
      this.cursorObj.destroy();
    }
    this.cursorObj = null;
  }
}
