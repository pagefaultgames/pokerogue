import { globalScene } from "#app/global-scene";
import { Button } from "#enums/buttons";
import { TextStyle } from "#enums/text-style";
import { UiMode } from "#enums/ui-mode";
import type { OptionSelectItem, OptionSelectModeConfig, UIOptionSelectItem } from "#types/ui-types";
import { MessageUiHandler } from "#ui/message-ui-handler";
import { ScrollBar } from "#ui/scroll-bar";
import { addBBCodeTextObject, getBBCodeFrag, getTextStyleOptions } from "#ui/text";
import { addWindow } from "#ui/ui-theme";
import { fixedInt } from "#utils/common";
import type BBCodeText from "phaser3-rex-plugins/plugins/gameobjects/tagtext/bbcodetext/BBCodeText";

const SCROLLBAR_PADDING = 5;
const SCROLLBAR_WIDTH = 3;
const WINDOW_PADDING = 23;
const DEFAULT_MAX_OPTIONS = 10;
const NUM_PRE_COMPUTED_OPTIONS = 15;
const DEFAULT_TEXT_STYLE = TextStyle.WINDOW;

/**
 * Generic handler for a menu with several options to choose from with a cursor.
 *
 * Given the proper {@linkcode OptionSelectModeConfig} the handler will:
 *  - Measure the size of all elements in the menu, including the size of any icon.
 *  - Apply the required BBCode if an elements asks for a specific color.
 *  - Create the window of the appropriate size to hold all elements.
 *  - Handle scrolling through the menu items, resizing as needed.
 *  - Handle selecting the menu items, or cancelling out of the menu.
 *
 * At initialization the size of the first {@linkcode NUM_PRE_COMPUTED_OPTIONS} is measured. \
 * Then the window's size is updated as needed when a non initialized option needs to be displayed.
 *
 * @template T - The specifc type of {@linkcode OptionSelectItem} that this handler displays
 */
export abstract class BaseOptionSelectUiHandler<T extends OptionSelectItem> extends MessageUiHandler {
  private config: OptionSelectModeConfig<T> | null;
  private options: (UIOptionSelectItem & T)[] = [];
  private maxOptions: number;

  private repeatInput = false;

  protected fullyInitialized: boolean;

  protected optionSelectContainer: Phaser.GameObjects.Container;
  protected optionSelectBg: Phaser.GameObjects.NineSlice;
  protected optionSelectText: BBCodeText;
  protected optionSelectIcons: Phaser.GameObjects.Sprite[] = [];
  protected cursorObj: Phaser.GameObjects.Image | null;
  protected scrollBar: ScrollBar | null;

  protected blockInput: boolean;

  protected scrollCursor = 0;

  protected scale = 0.1666666667;

  constructor(mode: UiMode = UiMode.OPTION_SELECT) {
    super(mode);
  }

  protected get windowHeight(): number {
    return (this.maxOptions + 1) * 96 * this.scale - 2;
  }

  protected get currentOption(): (UIOptionSelectItem & T) | undefined {
    return this.options.at(this.cursor + this.scrollCursor);
  }

  public override setup(): void {
    const ui = this.getUi();

    this.scale = getTextStyleOptions(DEFAULT_TEXT_STYLE).scale;

    this.optionSelectContainer = globalScene.add
      .container(globalScene.scaledCanvas.width - 1, -1)
      .setName(`option-select-${this.mode == null ? "UNKNOWN" : UiMode[this.mode]}`)
      .setVisible(false);
    ui.add(this.optionSelectContainer);

    this.optionSelectBg = addWindow(0, 0, 0, 0) //
      .setName("option-select-bg")
      .setOrigin(1, 1);
    this.optionSelectContainer.add(this.optionSelectBg);

    this.optionSelectText = addBBCodeTextObject(0, 0, "", DEFAULT_TEXT_STYLE, { lineSpacing: this.scale * 72 })
      .setOrigin(0)
      .setName("text-option-select");
    this.optionSelectContainer.add(this.optionSelectText);

    this.setCursor(0);
  }

  public override show(args: any[]): boolean {
    const config: OptionSelectModeConfig<T> | undefined = args[0];

    // biome-ignore lint/style/useExplicitLengthCheck: doubles as a nullish check
    if (!config?.options?.length) {
      console.warn("Missing `OptionSelectModeConfig` argument for `UiMode.OPTION_SELECT`");
      return false;
    }

    super.show(args);

    this.initOptions(config);

    globalScene.ui.bringToTop(this.optionSelectContainer);

    this.optionSelectContainer.setVisible(true);
    this.scrollCursor = 0;
    this.initCursor();

    if (this.config?.inputDelay) {
      this.blockInput = true;
      this.optionSelectText.setAlpha(0.5);
      this.cursorObj?.setAlpha(0.8);
      globalScene.time.delayedCall(fixedInt(this.config.inputDelay), () => this.unblockInput());
    }

    return true;
  }

  private initOptions(config: OptionSelectModeConfig<T>): void {
    this.config = config;
    this.options = (config.options ?? []).map(option => {
      return {
        ...option,
        initialized: false,
        displayLabel: option.label,
        selectable: option.selectable ?? true,
      } satisfies UIOptionSelectItem & T as UIOptionSelectItem & T;
    });
    if (this.options.every(v => !v.selectable)) {
      throw new Error("There must be at least one selectable option!");
    }
    this.maxOptions = Math.min(this.options.length, config.maxOptions ?? DEFAULT_MAX_OPTIONS);

    this.optionSelectText.setMaxLines(this.maxOptions);

    // Set window size based on the first `DEFAULT_PRE_COMPUTED_OPTIONS` options
    this.updateSizeForOptions(this.options.slice(0, Math.max(this.maxOptions, NUM_PRE_COMPUTED_OPTIONS)));
    this.displayCurrentOptions(true);

    if (this.options.length > this.maxOptions) {
      this.scrollBar = new ScrollBar(
        0,
        0,
        SCROLLBAR_WIDTH,
        this.optionSelectBg.displayHeight - SCROLLBAR_PADDING * 2,
        this.maxOptions,
      );
      this.scrollBar.setTotalRows(this.options.length);
      this.scrollBar.setPositionRelative(
        this.optionSelectBg,
        this.optionSelectBg.displayWidth - SCROLLBAR_PADDING * 2,
        SCROLLBAR_PADDING,
      );
      this.optionSelectContainer.add(this.scrollBar);
    }
  }

  /**
   * Automatically set the menu's size for the given options.
   * @remarks
   * Preserves the current size if they are all smaller, otherwise expands as needed.
   * @param options - Array of {@linkcode UIOptionSelectItem}s to consider
   */
  protected updateSizeForOptions(options: (UIOptionSelectItem & T)[]): void {
    const currentWidth = this.optionSelectBg.displayWidth;
    const scrollBarWidth = this.options.length > this.maxOptions ? SCROLLBAR_PADDING : 0;

    // Get the max width amongst the given options, and use it for everything
    const maxWidth = this.getOptionsMaxWidth(options) + WINDOW_PADDING + scrollBarWidth;

    if (maxWidth <= currentWidth) {
      return;
    }

    const xOffset = Math.abs(this.config?.xOffset ?? 0);
    const yOffset = Math.abs(this.config?.yOffset ?? 0);

    // Make sure the window is not larger than the screen
    const bgWidth = Math.min(maxWidth, globalScene.scaledCanvas.width - 2);
    const bgHeight = this.windowHeight;
    // Make sure the window doesn't go past the left side of the screen
    const xPosition = Math.max(bgWidth + 1, globalScene.scaledCanvas.width - 1 - xOffset);

    this.optionSelectContainer.setPosition(xPosition, -yOffset);
    this.optionSelectText.setPosition(
      this.optionSelectBg.x - bgWidth + 11 + 24 * this.scale,
      this.optionSelectBg.y - bgHeight + 42 * this.scale,
    );

    this.optionSelectBg.setSize(bgWidth, bgHeight);

    if (this.cursorObj) {
      this.updateCursorPlacement();
    }

    if (this.config?.onResize) {
      this.config.onResize(bgWidth, bgHeight);
    }
  }

  /**
   * Place the cursor in front of the currently selected option.
   * @remarks
   * Initializes the cursor sprite if it doesn't exist.
   */
  private updateCursorPlacement() {
    if (!this.cursorObj) {
      this.cursorObj = globalScene.add //
        .image(0, 0, "cursor")
        .setScale(this.scale * 6);
      this.optionSelectContainer.add(this.cursorObj);
    }

    this.cursorObj.setPositionRelative(
      this.optionSelectBg,
      10,
      102 * this.scale + this.cursor * (114 * this.scale - 3) - 2,
    );
  }

  /**
   * Compute the width required to display all given options and readies them for display.
   *
   * Creates temporary sprite and Text objects and set to be able to infer the required space.
   *
   * Only considers the options that have not been initialized, and marks them as initialized once done.
   * @param configOptions - Array of {@linkcode UIOptionSelectItem}s to consider
   * @returns the maximum width that will be taken by those elements
   */
  private getOptionsMaxWidth(configOptions: (UIOptionSelectItem & T)[]): number {
    const nonInitializedOptions = configOptions.filter(o => !o.initialized);
    if (nonInitializedOptions.length === 0) {
      return 0;
    }

    const tempTextObject = addBBCodeTextObject(0, 0, " ", DEFAULT_TEXT_STYLE);
    const tempSprite = globalScene.add.sprite(0, 0, "items");
    const singleSpaceWidth = tempTextObject.displayWidth;

    for (const option of nonInitializedOptions) {
      this.initializeOption(option, singleSpaceWidth, tempSprite);
    }

    // Check if all options are now initialized.
    this.fullyInitialized = this.options.every(o => o.initialized);

    tempTextObject.setText(nonInitializedOptions.map(o => o.displayLabel).join("\n"));
    const totalWidth = tempTextObject.displayWidth;

    tempTextObject.destroy();
    tempSprite.destroy();

    return totalWidth;
  }

  /**
   * Readies the given `UIOptionSelectItem` for display.
   * @remarks
   * For options with icon(s), adds the appropriate number of space before the label to give the sprite the space it needs
   *
   * For options with color, adds the appropriate BBCode to the label
   * @param option - The {@linkcode UIOptionSelectItem} to consider
   * @param singleSpaceWidth - The width of a single space, used to offset the label if there is a icon to show
   * @param tempSprite - A `Sprite` object that can be used to measure the needed space of the item's icon, if any
   */
  protected initializeOption(
    option: UIOptionSelectItem & T,
    singleSpaceWidth: number,
    tempSprite: Phaser.GameObjects.Sprite,
  ): void {
    let label = option.displayLabel ?? option.label;

    // Measure the width of the icon(s) to show before the label
    if (option.iconsConfig) {
      let maxIconWidth = 0;
      for (const iconConfig of option.iconsConfig) {
        tempSprite //
          .setTexture(iconConfig.name, iconConfig.frame)
          .setScale(iconConfig.scale);
        maxIconWidth = Math.max(maxIconWidth, tempSprite.frame.width * tempSprite.scale);
      }
      // Pad the label with as many spaces as needed to make room for the icon
      if (maxIconWidth > 0) {
        const neededSpaces = Math.ceil(maxIconWidth / singleSpaceWidth);
        label = label.padStart(label.length + neededSpaces);
        // Change the label color to fit the required text style
        if (option.color != null && option.color !== DEFAULT_TEXT_STYLE) {
          label = getBBCodeFrag(label, option.color, true);
        }
      }
      option.iconsWidth = maxIconWidth;
    }

    option.displayLabel = label;
    option.initialized = true;
  }

  /**
   * Display the current options based on the cursor and scroll cursor.
   * @remarks
   * Can handle automatic resizing of the menu window as needed.
   * @param skipResizing - (Default `false`) Whether to skip the automatic resizing step
   */
  protected displayCurrentOptions(skipResizing = false): void {
    const currentOptions = this.options.slice(this.scrollCursor, this.scrollCursor + this.maxOptions);

    if (!skipResizing && !this.fullyInitialized) {
      this.updateSizeForOptions(currentOptions);
    }

    this.optionSelectText.setText(currentOptions.map(o => o.displayLabel).join("\n"));

    // Hide existing icons
    for (const iconSprite of this.optionSelectIcons) {
      iconSprite.setVisible(false);
    }

    // Display the icons before each option, if any
    let currentIconIndex = 0;
    currentOptions.forEach((option: UIOptionSelectItem, index: number) => {
      if (option.iconsConfig) {
        const iconY = 7 + index * (114 * this.scale - 3);
        const iconX = Math.floor((option.iconsWidth ?? 0) / 2);

        for (const config of option.iconsConfig) {
          let iconSprite = this.optionSelectIcons[currentIconIndex++];
          if (iconSprite) {
            iconSprite //
              .setTexture(config.name, config.frame)
              .setVisible(true);
          } else {
            iconSprite = globalScene.add.sprite(0, 0, config.name, config.frame);
            this.optionSelectIcons.push(iconSprite);
            this.optionSelectContainer.add(iconSprite);
          }

          iconSprite //
            .setScale(config.scale)
            .setPositionRelative(this.optionSelectText, iconX, iconY);

          if (config.tint) {
            iconSprite.setTint(config.tint);
          }
        }
      }
    });
  }

  public override processInput(button: Button): boolean {
    const ui = this.getUi();

    let success = false;
    let playSound = true;

    if (button === Button.ACTION || button === Button.CANCEL) {
      if (this.blockInput) {
        if (button === Button.CANCEL && this.config?.canBypassInputDelay) {
          this.unblockInput();
        } else {
          ui.playError();
          return false;
        }
      }

      success = true;
      if (button === Button.CANCEL) {
        if (this.config?.blockCancelButton) {
          return false;
        }
        // Cancelling, move the cursors to the last option to act as if it was being selected
        if (this.options.length > this.maxOptions) {
          this.scrollCursor = this.options.length - this.maxOptions;
        }
        this.cursor = this.maxOptions - 1;
      }

      const option = this.currentOption;
      if (option?.handler()) {
        if (!option.keepOpen) {
          this.clear();
        }
        playSound = !option.noSoundEffects && !!option.selectable;
      } else {
        ui.playError();
      }
    } else {
      success = this.handleCursorUpDown(button);
    }

    if (success && playSound) {
      ui.playSelect();
    }

    // skip over unselectable options
    if (this.repeatInput) {
      this.repeatInput = false;
      success = this.processInput(button);
    }

    return success;
  }

  private handleCursorUpDown(button: Button): boolean {
    if (button === Button.UP) {
      if (this.cursor > 0) {
        return this.setCursor(this.cursor - 1);
      }

      if (this.scrollCursor > 0) {
        return this.setScrollCursor(this.scrollCursor - 1);
      }

      if (this.options.length > this.maxOptions) {
        this.setScrollCursor(this.options.length - this.maxOptions);
      }
      return this.setCursor(this.maxOptions - 1);
    }

    if (button === Button.DOWN) {
      if (this.cursor < this.maxOptions - 1) {
        return this.setCursor(this.cursor + 1);
      }

      if (this.scrollCursor < this.options.length - this.maxOptions) {
        return this.setScrollCursor(this.scrollCursor + 1);
      }

      if (this.scrollCursor > 0) {
        this.setScrollCursor(0);
      }
      return this.setCursor(0);
    }

    return false;
  }

  protected unblockInput(): void {
    if (!this.blockInput) {
      return;
    }

    this.blockInput = false;
    this.optionSelectText.setAlpha(1);
    this.cursorObj?.setAlpha(1);
  }

  /** Initializes the cursor when opening the menu. MUST only be called *after* `this.initOptions()`! */
  protected initCursor(): void {
    this.cursor = 0;
    this.scrollCursor = 0;

    let cursor = 0;
    let scrollCursor = 0;

    while (!this.options[cursor + scrollCursor]?.selectable) {
      if (cursor < this.maxOptions - 1) {
        cursor++;
        continue;
      }
      if (scrollCursor < this.options.length - this.maxOptions) {
        scrollCursor++;
        continue;
      }
      throw new Error("Unable to find a selectable option!");
    }

    this.setScrollCursor(scrollCursor);
    this.setCursor(cursor);
  }

  public override setCursor(cursor: number): boolean {
    const changed = this.cursor !== cursor;

    if (changed) {
      this.cursor = cursor;
    }

    if (!this.currentOption?.selectable) {
      if (!this.fullyInitialized) {
        return changed;
      }
      this.repeatInput = true;
      this.clearCursor();
      return changed;
    }

    this.updateCursorPlacement();

    this.currentOption?.onHover?.();

    return changed;
  }

  protected setScrollCursor(scrollCursor: number): boolean {
    if (scrollCursor === this.scrollCursor) {
      return false;
    }

    this.scrollCursor = scrollCursor;
    this.displayCurrentOptions();
    this.scrollBar?.setScrollCursor(this.scrollCursor);

    if (!this.currentOption?.selectable) {
      if (!this.fullyInitialized) {
        return true;
      }
      this.repeatInput = true;
      this.clearCursor();
    }

    this.currentOption?.onHover?.();

    return true;
  }

  public override clear(): void {
    super.clear();

    this.config = null;
    this.options = [];
    this.maxOptions = DEFAULT_MAX_OPTIONS;
    this.fullyInitialized = false;

    this.optionSelectBg.setSize(0, 0);
    this.optionSelectContainer.setVisible(false);
    this.scrollCursor = 0;
    this.clearIconSprites();
    this.clearCursor();
    this.clearScrollBar();
  }

  protected clearIconSprites(): void {
    for (const iconSprite of this.optionSelectIcons) {
      iconSprite.destroy();
    }
    this.optionSelectIcons = [];
  }

  protected clearCursor(): void {
    this.cursorObj?.destroy();
    this.cursorObj = null;
  }

  protected clearScrollBar(): void {
    this.scrollBar?.destroy();
    this.scrollBar = null;
  }
}
