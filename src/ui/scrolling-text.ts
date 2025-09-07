import { globalScene } from "#app/global-scene";
import { fixedInt } from "#app/utils/common";
import type { TextStyle } from "#enums/text-style";
import i18next from "i18next";
import type BBCodeText from "phaser3-rex-plugins/plugins/bbcodetext";
import { addBBCodeTextObject } from "./text";
import { addWindow } from "./ui-theme";

/*
This takes various coordinates:
- The x and y coordinates relative to the parent container, this is typical behavior for Phaser.GameObjects.Container.
- The width and height of the box; these are needed to create the background.
The mask is not created right away (although this is possible in principle). Instead, we have a separate function,
which takes as input the _global_ coordinates of scrolling text object. This is necessary to correctly position the mask in the scene.
 */

const BORDER = 8;

export default class ScrollingText extends Phaser.GameObjects.Container {
  private descBg: Phaser.GameObjects.NineSlice;
  public text: BBCodeText;
  private descScroll: Phaser.Tweens.Tween | null = null;
  private maxLineCount: number;

  private offsetX: number;
  private offsetY: number;
  maskHeight: number;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    width: number,
    height: number,
    maxLineCount: number,
    content: string,
    style: TextStyle,
    hasBackground = false,
    extraStyleOptions: Phaser.Types.GameObjects.Text.TextStyle = {},
  ) {
    super(scene, x, y);

    this.offsetX = hasBackground ? BORDER : 0;
    this.offsetY = hasBackground ? BORDER - 2 : 0;

    // Adding the background
    this.descBg = addWindow(0, 0, width, height);
    this.descBg.setOrigin(0, 0);
    this.descBg.setVisible(hasBackground);
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
    maskGraphics.fillRect(globalMaskX, globalMaskY, visibleWidth, visibleHeight);
    maskGraphics.setScale(6);

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
    // TODO: The scale property may need to be adjusted based on the height of the font
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
