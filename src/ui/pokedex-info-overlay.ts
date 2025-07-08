import type { InfoToggle } from "../battle-scene";
import { TextStyle, addTextObject } from "./text";
import { addWindow } from "./ui-theme";
import { fixedInt } from "#app/utils/common";
import i18next from "i18next";
import { globalScene } from "#app/global-scene";

export interface PokedexInfoOverlaySettings {
  delayVisibility?: boolean; // if true, showing the overlay will only set it to active and populate the fields and the handler using this field has to manually call setVisible later.
  scale?: number; // scale the box? A scale of 0.5 is recommended
  //location and width of the component; unaffected by scaling
  x?: number;
  y?: number;
  /** Default is always half the screen, regardless of scale */
  width?: number;
  /** Determines whether to display the small secondary box */
  hideEffectBox?: boolean;
  hideBg?: boolean;
}

const DESC_HEIGHT = 48;
const BORDER = 8;
const GLOBAL_SCALE = 6;

export default class PokedexInfoOverlay extends Phaser.GameObjects.Container implements InfoToggle {
  public active = false;

  private desc: Phaser.GameObjects.Text;
  private descScroll: Phaser.Tweens.Tween | null = null;

  private descBg: Phaser.GameObjects.NineSlice;

  private options: PokedexInfoOverlaySettings;

  private textMaskRect: Phaser.GameObjects.Graphics;

  private maskPointOriginX: number;
  private maskPointOriginY: number;
  public scale: number;
  public width: number;

  constructor(options?: PokedexInfoOverlaySettings) {
    super(globalScene, options?.x, options?.y);
    this.scale = options?.scale || 1; // set up the scale
    this.setScale(this.scale);
    this.options = options || {};

    // prepare the description box
    this.width = (options?.width || PokedexInfoOverlay.getWidth(this.scale)) / this.scale; // divide by scale as we always want this to be half a window wide
    this.descBg = addWindow(0, 0, this.width, DESC_HEIGHT);
    this.descBg.setOrigin(0, 0);
    this.add(this.descBg);

    // set up the description; wordWrap uses true pixels, unaffected by any scaling, while other values are affected
    this.desc = addTextObject(BORDER, BORDER - 2, "", TextStyle.BATTLE_INFO, {
      wordWrap: { width: (this.width - (BORDER - 2) * 2) * GLOBAL_SCALE },
    });
    this.desc.setLineSpacing(i18next.resolvedLanguage === "ja" ? 25 : 5);

    // limit the text rendering, required for scrolling later on
    this.maskPointOriginX = options?.x || 0;
    this.maskPointOriginY = options?.y || 0;

    if (this.maskPointOriginX < 0) {
      this.maskPointOriginX += globalScene.game.canvas.width / GLOBAL_SCALE;
    }
    if (this.maskPointOriginY < 0) {
      this.maskPointOriginY += globalScene.game.canvas.height / GLOBAL_SCALE;
    }

    this.textMaskRect = globalScene.make.graphics();
    this.textMaskRect.fillStyle(0xff0000);
    this.textMaskRect.fillRect(
      this.maskPointOriginX + BORDER * this.scale,
      this.maskPointOriginY + (BORDER - 2) * this.scale,
      this.width - BORDER * 2 * this.scale,
      (DESC_HEIGHT - (BORDER - 2) * 2) * this.scale,
    );
    this.textMaskRect.setScale(6);
    const textMask = this.createGeometryMask(this.textMaskRect);

    this.add(this.desc);
    this.desc.setMask(textMask);

    if (options?.hideBg) {
      this.descBg.setVisible(false);
    }

    // hide this component for now
    this.setVisible(false);
  }

  // show this component with infos for the specific move
  show(text: string): boolean {
    if (!globalScene.enableMoveInfo) {
      return false; // move infos have been disabled // TODO:: is `false` correct? i used to be `undeefined`
    }

    this.desc.setText(text ?? "");

    // stop previous scrolling effects and reset y position
    if (this.descScroll) {
      this.descScroll.remove();
      this.descScroll = null;
      this.desc.y = BORDER - 2;
    }

    // determine if we need to add new scrolling effects
    const lineCount = Math.floor((this.desc.displayHeight * (96 / 72)) / 14.83);

    const newHeight = lineCount >= 3 ? 48 : lineCount === 2 ? 36 : 24;
    this.textMaskRect.clear();
    this.textMaskRect.fillStyle(0xff0000);
    this.textMaskRect.fillRect(
      this.maskPointOriginX + BORDER * this.scale,
      this.maskPointOriginY + (BORDER - 2) * this.scale + (48 - newHeight),
      this.width - BORDER * 2 * this.scale,
      (newHeight - (BORDER - 2) * 2) * this.scale,
    );
    const updatedMask = this.createGeometryMask(this.textMaskRect);
    this.desc.setMask(updatedMask);

    this.descBg.setSize(this.descBg.width, newHeight);
    this.descBg.setY(48 - newHeight);
    this.desc.setY(BORDER - 2 + (48 - newHeight));

    if (lineCount > 3) {
      // generate scrolling effects
      this.descScroll = globalScene.tweens.add({
        targets: this.desc,
        delay: fixedInt(2000),
        loop: -1,
        hold: fixedInt(2000),
        duration: fixedInt((lineCount - 3) * 2000),
        y: `-=${14.83 * (72 / 96) * (lineCount - 3)}`,
      });
    }

    if (!this.options.delayVisibility) {
      this.setVisible(true);
    }
    this.active = true;
    return true;
  }

  clear() {
    this.setVisible(false);
    this.active = false;
  }

  toggleInfo(visible: boolean): void {
    if (visible) {
      this.setVisible(true);
    }
    globalScene.tweens.add({
      targets: this.desc,
      duration: fixedInt(125),
      ease: "Sine.easeInOut",
      alpha: visible ? 1 : 0,
    });
    if (!visible) {
      this.setVisible(false);
    }
  }

  isActive(): boolean {
    return this.active;
  }

  // width of this element
  static getWidth(_scale: number): number {
    return globalScene.game.canvas.width / GLOBAL_SCALE / 2;
  }

  // height of this element
  static getHeight(scale: number, _onSide?: boolean): number {
    return DESC_HEIGHT * scale;
  }
}
