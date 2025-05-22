import { globalScene } from "#app/global-scene";

export interface FogOverlaySettings {
  delayVisibility?: boolean;
  scale?: number;
  top?: boolean;
  right?: boolean;
  onSide?: boolean;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
}

const EFF_HEIGHT = 48;
const EFF_WIDTH = 82;

export default class FogOverlay extends Phaser.GameObjects.Container {
  public active = false;

  private val: Phaser.GameObjects.Container;
  private typ: Phaser.GameObjects.Sprite;

  constructor(options?: FogOverlaySettings) {
    if (options?.onSide) {
      options.top = false;
    }
    super(globalScene, options?.x, options?.y);
    const scale = options?.scale || 1; // set up the scale
    this.setScale(scale);

    this.val = new Phaser.GameObjects.Container(
      globalScene,
      options?.onSide && !options?.right ? EFF_WIDTH : 0,
      options?.top ? EFF_HEIGHT : 0,
    );
    this.typ = globalScene.add.sprite(25, EFF_HEIGHT - 35, "heavy_fog");
    this.typ.setAlpha(1);
    this.setAlpha(0);
    this.typ.setScale(0.8);
    this.val.add(this.typ);
    this.add(this.val);
    this.setVisible(false);
  }
  clear() {
    this.setVisible(false);
    this.active = false;
  }
  isActive(): boolean {
    return this.active;
  }
}
