import type { InfoToggle } from "#app/battle-scene";
import { globalScene } from "#app/global-scene";
import { TextStyle } from "#enums/text-style";
import { ScrollingText } from "#ui/scrolling-text";
import { fixedInt } from "#utils/common";

export interface PokedexInfoOverlaySettings {
  delayVisibility?: boolean; // if true, showing the overlay will only set it to active and populate the fields and the handler using this field has to manually call setVisible later.
  //location and width of the component; unaffected by scaling
  x?: number;
  y?: number;
  /** Default is always half the screen, regardless of scale */
  width?: number;
  /** Determines whether to display the small secondary box */
  hideEffectBox?: boolean;
}

const DESC_HEIGHT = 48;

export class PokedexInfoOverlay extends Phaser.GameObjects.Container implements InfoToggle {
  public active = false;

  private desc: ScrollingText;
  private descScroll: Phaser.Tweens.Tween | null = null;

  private descBg: Phaser.GameObjects.NineSlice;

  private options: PokedexInfoOverlaySettings;

  private textMaskRect: Phaser.GameObjects.Graphics;

  private maskPointOriginX: number;
  private maskPointOriginY: number;

  constructor(options?: PokedexInfoOverlaySettings) {
    super(globalScene, options?.x, options?.y);
    this.setScale(1);
    this.options = options || {};

    const descBoxX = 0;
    const descBoxY = 0;
    const width = options?.width || PokedexInfoOverlay.getWidth();
    const descBoxWidth = width;
    const descBoxHeight = DESC_HEIGHT;

    // prepare the description box
    this.desc = new ScrollingText(
      globalScene,
      descBoxX,
      descBoxY,
      descBoxWidth,
      descBoxHeight,
      3, // maxLineCount
      "", // initial content
      TextStyle.BATTLE_INFO,
      true,
    );
    this.desc.createMask(globalScene, this.x + this.desc.x, this.y + this.desc.y);
    this.add(this.desc);

    // hide this component for now
    this.setVisible(false);
  }

  // show this component with infos for the specific move
  show(text: string): boolean {
    if (!globalScene.enableMoveInfo) {
      return false; // move infos have been disabled // TODO:: is `false` correct? i used to be `undeefined`
    }

    this.desc.text.setText(text ?? "");

    // stop previous scrolling effects and reset y position
    this.desc.activate();

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
  static getWidth(): number {
    return globalScene.scaledCanvas.width / 2;
  }

  // height of this element
  static getHeight(): number {
    return DESC_HEIGHT;
  }
}
