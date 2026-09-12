import { globalScene } from "#app/global-scene";
import { fixedInt } from "#app/utils/common";
import type { TextStyle } from "#enums/text-style";
import { addBBCodeTextObject } from "#ui/text";
import { addWindow } from "#ui/ui-theme";
import type BBCodeText from "phaser3-rex-plugins/plugins/bbcodetext";

interface ScrollingTextParameters {
  /** The x coordinate relative to the parent container */
  x: number;
  /** The y coordinate relative to the parent container */
  y: number;
  /** The width of the text box */
  width: number;
  /** The height of the text box */
  height: number;
  /** How many lines can be displayed on the screen at once */
  maxLineCount: number;
  /** The text shown initially; can be modified later */
  content: string;
  /** The style of the text */
  style: TextStyle;
  /** Whether to add a background box */
  showBackground?: boolean;
  /** Extra style options */
  extraStyleOptions?: Phaser.Types.GameObjects.Text.TextStyle;
}

const BORDER = 8;

export class ScrollingText extends Phaser.GameObjects.Container {
  private descBg: Phaser.GameObjects.NineSlice;
  public text: BBCodeText;
  private descScroll: Phaser.Tweens.Tween | null = null;
  private maxLineCount: number;
  private anchorBottom: boolean;

  private offsetX: number;
  private offsetY: number;

  private maskHeight: number;
  // These are stored so that the mask can be updated automatically after being created.
  private maskGlobalX: number;
  private maskGlobalY: number;

  /**
   * This constructor sets up a background element, plus the text. By default, the background is invisible.
   * If the `showBackground` option is set to `true`, an offset is automatically added
   * between the background and the text; otherwise, there is no offset.
   *
   * In order for scrolling to work, it is also necessary to set up a mask, which define the region
   * of the screen where the text is visible. This is done through a separate method, so that the mask
   * can be adjusted if the `ScrollingText` container is repositioned at some point.
   *
   * The text can be updated using
   *
   * @param params A set of {@linkcode ScrollingTextParameters}.
   */
  constructor(params: ScrollingTextParameters) {
    const { x, y, width, maxLineCount, content, style } = params;
    const showBackground = !!params.showBackground;
    const extraStyleOptions: Phaser.Types.GameObjects.Text.TextStyle = params.extraStyleOptions ?? {};

    super(globalScene, x, y);

    this.offsetX = showBackground ? BORDER : 0;
    this.offsetY = showBackground ? BORDER - 2 : 0;

    // Adding the text element
    const wrapWidth = (width - (this.offsetX - 2) * 2) * 6;

    this.text = addBBCodeTextObject(this.offsetX, this.offsetY, content, style, {
      wordWrap: {
        width: wrapWidth,
      },
      ...extraStyleOptions,
    });
    this.maxLineCount = maxLineCount;

    const height = this.calculateMaxTextHeight() + this.offsetY * 2;
    // Adding the background
    this.descBg = addWindow(0, 0, width, height).setOrigin(0, 0).setVisible(showBackground);
    this.add(this.descBg);

    this.add(this.text);
  }

  /**
   * This method must be passed as input the global coordinates of the scrolling text object.
   * It is done this way because of two reasons:
   * 1) the mask must be positioned relative to the scene, not to a parent container;
   * 2) there is no simple way to recover the global coordinates from inside the ScrollingText container.
   * The latter would be much more desirable if possible.
   *
   * @param globalX
   * @param globalY
   */
  createMask(globalX: number, globalY: number) {
    // Remove existing mask
    this.text.clearMask(true);

    this.maskGlobalX = globalX;
    this.maskGlobalY = globalY;

    // Adding the mask for the scrolling effect
    const globalMaskX = globalX + this.offsetX;
    const globalMaskY = globalY + this.offsetY;

    const visibleWidth = this.descBg.width - (this.offsetX - 2) * 2;
    this.maskHeight = this.calculateMaxTextHeight();
    const visibleHeight = this.maskHeight;

    const maskGraphics = globalScene.make.graphics({ x: 0, y: 0 });
    maskGraphics.fillRect(globalMaskX, globalMaskY, visibleWidth, visibleHeight).setScale(6);

    globalScene.add.existing(maskGraphics);
    const mask = this.createGeometryMask(maskGraphics);
    this.text.setMask(mask);
  }

  /**
   * Method to update the text after the scrolling object and mask have been created.
   * if `fitHeight` is `true`, the background box is automatically adjusted to fit the text
   * (only if the text is shorter than the maximum number of lines).
   * When resizing, by default the top of the box is fixed. To change this behavior, and keep
   * the bottom fixed, set `anchorBottom` to `true` instead.
   *
   * @param content
   * @param fitHeight
   * @param anchorBottom
   */
  updateText(content: string, fitHeight?: boolean, anchorBottom?: boolean) {
    this.text.setText(content);

    if (!fitHeight) {
      return;
    }

    // Update the height of the background
    const height = this.calculateTextHeight();
    if (height > this.calculateMaxTextHeight()) {
      return;
    }
    const bgHeight = height + this.offsetY * 2;
    const oldBgHeight = this.descBg.height;
    this.descBg.height = bgHeight;

    if (!anchorBottom) {
      return;
    }

    // If anchoring at the bottom, reposition this container and the mask
    const heightDifference = oldBgHeight - bgHeight;
    this.y += heightDifference;
    this.createMask(this.maskGlobalX, this.maskGlobalY + heightDifference);
  }

  /**
   * The total height of the text if displayed fully, regardless of the maximum line count.
   */
  calculateTextHeight(): number {
    const lineHeight = this.text.style.lineHeight / 6;
    // This is necessary because this.text.displayHeight does not correspond to
    // number of lines * lineHeight, and this causes issues when a custom lineSpacing is used.
    return lineHeight * Math.round(this.text.displayHeight / lineHeight);
  }

  /**
   * The maximum height of the text that can be displayed, based on the maximum line count.
   */
  calculateMaxTextHeight(): number {
    const lineHeight = this.text.style.lineHeight / 6;
    return lineHeight * this.maxLineCount;
  }

  /**
   * Start the scrolling animation.
   */
  activate() {
    // stop previous scrolling effects and reset y position
    if (this.descScroll) {
      this.descScroll.remove();
      this.descScroll = null;
      this.text.y = this.offsetY;
    }

    // determine if we need to add new scrolling effects
    const lineHeight = this.text.style.lineHeight / 6;
    const displayHeight = this.calculateTextHeight();
    const scrollAmount = displayHeight - this.maskHeight;

    if (scrollAmount > 0) {
      this.descScroll = globalScene.tweens.add({
        targets: this.text,
        delay: fixedInt(2000),
        loop: -1,
        hold: fixedInt(2000),
        duration: fixedInt((scrollAmount / lineHeight) * 2000),
        y: `-=${scrollAmount}`,
      });
    }
  }
}
