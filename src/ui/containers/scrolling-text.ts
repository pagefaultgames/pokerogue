import { globalScene } from "#app/global-scene";
import { fixedInt } from "#app/utils/common";
import type { TextStyle } from "#enums/text-style";
import { addBBCodeTextObject } from "#ui/text";
import { addWindow } from "#ui/ui-theme";
import i18next from "i18next";
import type BBCodeText from "phaser3-rex-plugins/plugins/bbcodetext";

interface ScrollingTextParameters {
  // The x coordinate relative to the parent container
  x: number;
  // The y coordinate relative to the parent container
  y: number;
  // The width of the text box
  width: number;
  // The height of the text box
  height: number;
  // How many lines can be displayed on the screen at once
  maxLineCount: number;
  // The text shown initially; can be modified later
  content: string;
  // The style of the text
  style: TextStyle;
  // Whether to add a background box
  hasBackground?: boolean;
  // Extra style options
  extraStyleOptions?: Phaser.Types.GameObjects.Text.TextStyle;
}

const BORDER = 8;

export class ScrollingText extends Phaser.GameObjects.Container {
  private descBg: Phaser.GameObjects.NineSlice;
  public text: BBCodeText;
  private descScroll: Phaser.Tweens.Tween | null = null;
  private maxLineCount: number;

  private offsetX: number;
  private offsetY: number;
  maskHeight: number;

  /*
  This takes various coordinates:
  The mask is not created right away (although this is possible in principle). Instead, we have a separate function,
  which takes as input the _global_ coordinates of scrolling text object. This is necessary to correctly position the mask in the scene.
  */
  constructor(params: ScrollingTextParameters) {
    const { x, y, width, height, maxLineCount, content, style } = params;
    const hasBackground = !!params.hasBackground;
    const extraStyleOptions: Phaser.Types.GameObjects.Text.TextStyle = params.extraStyleOptions ?? {};

    super(globalScene, x, y);

    this.offsetX = hasBackground ? BORDER : 0;
    this.offsetY = hasBackground ? BORDER - 2 : 0;

    // Adding the background
    this.descBg = addWindow(0, 0, width, height).setOrigin(0, 0).setVisible(hasBackground);
    this.add(this.descBg);

    // Adding the text element
    const wrapWidth = (width - (this.offsetX - 2) * 2) * 6;

    this.text = addBBCodeTextObject(this.offsetX, this.offsetY, content, style, {
      wordWrap: {
        width: wrapWidth,
      },
      ...extraStyleOptions,
    });
    this.maxLineCount = maxLineCount;
    // TODO: change this based on which text is being used, etc
    this.text.setLineSpacing(i18next.resolvedLanguage === "ja" ? 25 : 5);
    this.add(this.text);
  }

  createMask(scene: Phaser.Scene, globalX: number, globalY: number) {
    // Adding the mask for the scrolling effect
    const globalMaskX = globalX + this.offsetX;
    const globalMaskY = globalY + this.offsetY;

    const visibleWidth = this.descBg.width - (this.offsetX - 2) * 2;
    this.maskHeight = (this.text.style.lineHeight / 6) * this.maxLineCount;
    const visibleHeight = this.maskHeight;

    const maskGraphics = scene.make.graphics({ x: 0, y: 0 });
    maskGraphics.fillRect(globalMaskX, globalMaskY, visibleWidth, visibleHeight).setScale(6);

    scene.add.existing(maskGraphics);
    const mask = this.createGeometryMask(maskGraphics);
    this.text.setMask(mask);
  }

  activate() {
    // stop previous scrolling effects and reset y position
    if (this.descScroll) {
      this.descScroll.remove();
      this.descScroll = null;
      this.text.y = this.offsetY;
    }

    // determine if we need to add new scrolling effects
    const displayHeight = this.text.displayHeight;
    const scrollAmount = displayHeight - this.maskHeight;
    const lineHeight = this.text.style.lineHeight / 6;

    if (scrollAmount) {
      // generate scrolling effects
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
