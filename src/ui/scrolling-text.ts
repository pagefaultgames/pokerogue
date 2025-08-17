import { globalScene } from "#app/global-scene";
import { fixedInt } from "#app/utils/common";
import type { TextStyle } from "#enums/text-style";
import { addTextObject } from "./text";

/*
 */

export default class ScrollingText extends Phaser.GameObjects.Container {
  public text: Phaser.GameObjects.Text;
  private descScroll: Phaser.Tweens.Tween | null = null;
  private maxLineCount: number;
  private scale_property: number;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    globalMaskX: number,
    globalMaskY: number,
    visibleWidth: number,
    visibleHeight: number,
    maxLineCount: number,
    scale_property: number,
    content: string,
    style: TextStyle,
    extraStyleOptions?: Phaser.Types.GameObjects.Text.TextStyle,
  ) {
    super(scene, x, y);
    this.text = addTextObject(0, 0, content, style, extraStyleOptions);
    this.maxLineCount = maxLineCount;
    this.scale_property = scale_property;
    this.add(this.text);

    const maskGraphics = scene.make.graphics({ x: 0, y: 0 });
    //TODO: Remove, this line is for testing
    maskGraphics.fillStyle(0xffffff);
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
      this.text.y = 0;
    }

    // determine if we need to add new scrolling effects
    const lineCount = Math.floor(this.text.displayHeight * this.scale_property);

    if (lineCount > this.maxLineCount) {
      // generate scrolling effects
      this.descScroll = globalScene.tweens.add({
        targets: this.text,
        delay: fixedInt(2000),
        loop: -1,
        hold: fixedInt(2000),
        duration: fixedInt((lineCount - this.maxLineCount) * 2000),
        y: `-=${(lineCount - this.maxLineCount) / this.scale_property}`,
      });
    }
  }
}
