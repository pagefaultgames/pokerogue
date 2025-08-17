import { globalScene } from "#app/global-scene";
import { fixedInt } from "#app/utils/common";
import type { TextStyle } from "#enums/text-style";
import i18next from "i18next";
import { addTextObject } from "./text";
import { addWindow } from "./ui-theme";

/*
This takes various coordinates:
- The x and y coordinates relative to the parent container, this is typical behavior for Phaser.GameObjects.Container.
- The width and height of the box; these are needed to create the background.
The mask is not created right away (although this is possible in principle). Instead, we have a separate function,
which takes as input the _global_ coordinates of the parent. This is necessary to correctly position the mask in the scene.
 */

const BORDER = 8;
const DESC_X = BORDER;
const DESC_Y = BORDER - 2;
const SCALE_PROPERTY = 96 / 72 / 14.83;

export default class ScrollingText extends Phaser.GameObjects.Container {
  private descBg: Phaser.GameObjects.NineSlice;
  public text: Phaser.GameObjects.Text;
  private descScroll: Phaser.Tweens.Tween | null = null;
  private maxLineCount: number;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    width: number,
    height: number,
    maxLineCount: number,
    content: string,
    style: TextStyle,
  ) {
    super(scene, x, y);

    // Adding the background
    this.descBg = addWindow(0, 0, width, height);
    this.descBg.setOrigin(0, 0);
    this.descBg.setVisible(true);
    this.add(this.descBg);

    // Adding the text element
    const wrapWidth = (width - (DESC_X - 2) * 2) * 6;

    this.text = addTextObject(DESC_X, DESC_Y, content, style, {
      wordWrap: {
        width: wrapWidth,
      },
    });
    this.maxLineCount = maxLineCount;
    this.text.setLineSpacing(i18next.resolvedLanguage === "ja" ? 25 : 5);
    this.add(this.text);
  }

  createMask(scene: Phaser.Scene, parentX: number, parentY: number) {
    // Adding the mask for the scrolling effect
    const visibleX = parentX < 0 ? parentX + globalScene.scaledCanvas.width : parentX;
    const visibleY = parentY < 0 ? parentY + globalScene.scaledCanvas.height : parentY;
    const globalMaskX = visibleX + this.x + DESC_X;
    const globalMaskY = visibleY + this.y + DESC_Y;

    const visibleWidth = this.descBg.width - (BORDER - 2) * 2;
    const visibleHeight = this.descBg.height - (BORDER - 2) * 2;

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
      this.text.y = BORDER - 2;
    }

    // determine if we need to add new scrolling effects
    const lineCount = Math.floor(this.text.displayHeight * SCALE_PROPERTY);

    if (lineCount > this.maxLineCount) {
      // generate scrolling effects
      this.descScroll = globalScene.tweens.add({
        targets: this.text,
        delay: fixedInt(2000),
        loop: -1,
        hold: fixedInt(2000),
        duration: fixedInt((lineCount - this.maxLineCount) * 2000),
        y: `-=${(lineCount - this.maxLineCount) / SCALE_PROPERTY}`,
      });
    }
  }

  hideBg() {
    this.descBg.setVisible(false);
  }
}
