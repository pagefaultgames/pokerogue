import BattleScene, { InfoToggle } from "../battle-scene";
import { TextStyle, addTextObject } from "./text";
import { addWindow } from "./ui-theme";
import * as Utils from "../utils";
import i18next from "i18next";

export interface PokedexInfoOverlaySettings {
    delayVisibility?: boolean; // if true, showing the overlay will only set it to active and populate the fields and the handler using this field has to manually call setVisible later.
    scale?:number; // scale the box? A scale of 0.5 is recommended
    top?: boolean; // should the effect box be on top?
    right?: boolean; // should the effect box be on the right?
    onSide?: boolean; // should the effect be on the side? ignores top argument if true
    //location and width of the component; unaffected by scaling
    x?: number;
    y?: number;
    /** Default is always half the screen, regardless of scale */
    width?: number;
    /** Determines whether to display the small secondary box */
    hideEffectBox?: boolean;
    hideBg?: boolean;
}

const EFF_HEIGHT = 36;
const EFF_WIDTH = 82;
const DESC_HEIGHT = 36;
const BORDER = 8;
const GLOBAL_SCALE = 6;

export default class PokedexInfoOverlay extends Phaser.GameObjects.Container implements InfoToggle {
  public active: boolean = false;

  private desc: Phaser.GameObjects.Text;
  private descScroll : Phaser.Tweens.Tween | null = null;

  private descBg: Phaser.GameObjects.NineSlice;

  private options : PokedexInfoOverlaySettings;

  constructor(scene: BattleScene, options?: PokedexInfoOverlaySettings) {
    if (options?.onSide) {
      options.top = false;
    }
    super(scene, options?.x, options?.y);
    const scale = options?.scale || 1; // set up the scale
    this.setScale(scale);
    this.options = options || {};

    // prepare the description box
    const width = (options?.width || PokedexInfoOverlay.getWidth(scale, scene)) / scale; // divide by scale as we always want this to be half a window wide
    this.descBg = addWindow(scene,  (options?.onSide && !options?.right ? EFF_WIDTH : 0), options?.top ? EFF_HEIGHT : 0, width - (options?.onSide ? EFF_WIDTH : 0), DESC_HEIGHT);
    this.descBg.setOrigin(0, 0);
    this.add(this.descBg);

    // set up the description; wordWrap uses true pixels, unaffected by any scaling, while other values are affected
    this.desc = addTextObject(scene, (options?.onSide && !options?.right ? EFF_WIDTH : 0) + BORDER, (options?.top ? EFF_HEIGHT : 0) + BORDER - 2, "", TextStyle.BATTLE_INFO, { wordWrap: { width: (width - (BORDER - 2) * 2 - (options?.onSide ? EFF_WIDTH : 0)) * GLOBAL_SCALE }});
    this.desc.setLineSpacing(i18next.resolvedLanguage === "ja" ? 25 : 5);

    // limit the text rendering, required for scrolling later on
    const maskPointOrigin = {
      x: (options?.x || 0),
      y: (options?.y || 0),
    };
    if (maskPointOrigin.x < 0) {
      maskPointOrigin.x += this.scene.game.canvas.width / GLOBAL_SCALE;
    }
    if (maskPointOrigin.y < 0) {
      maskPointOrigin.y += this.scene.game.canvas.height / GLOBAL_SCALE;
    }

    const moveDescriptionTextMaskRect = this.scene.make.graphics();
    moveDescriptionTextMaskRect.fillStyle(0xFF0000);
    moveDescriptionTextMaskRect.fillRect(
      maskPointOrigin.x + ((options?.onSide && !options?.right ? EFF_WIDTH : 0) + BORDER) * scale, maskPointOrigin.y + ((options?.top ? EFF_HEIGHT : 0) + BORDER - 2) * scale,
      width - ((options?.onSide ? EFF_WIDTH : 0) - BORDER * 2) * scale, (DESC_HEIGHT - (BORDER - 2) * 2) * scale);
    moveDescriptionTextMaskRect.setScale(6);
    const moveDescriptionTextMask = this.createGeometryMask(moveDescriptionTextMaskRect);

    this.add(this.desc);
    this.desc.setMask(moveDescriptionTextMask);

    if (options?.hideBg) {
      this.descBg.setVisible(false);
    }

    // hide this component for now
    this.setVisible(false);
  }

  // show this component with infos for the specific move
  show(text: string):boolean {
    if (!(this.scene as BattleScene).enableMoveInfo) {
      return false; // move infos have been disabled // TODO:: is `false` correct? i used to be `undeefined`
    }

    this.desc.setText(text ?? "");

    // stop previous scrolling effects and reset y position
    if (this.descScroll) {
      this.descScroll.remove();
      this.descScroll = null;
      this.desc.y = (this.options?.top ? EFF_HEIGHT : 0) + BORDER - 2;
    }

    // determine if we need to add new scrolling effects
    const moveDescriptionLineCount = Math.floor(this.desc.displayHeight * (96 / 72) / 14.83);
    if (moveDescriptionLineCount > 3) {
      // generate scrolling effects
      this.descScroll = this.scene.tweens.add({
        targets: this.desc,
        delay: Utils.fixedInt(2000),
        loop: -1,
        hold: Utils.fixedInt(2000),
        duration: Utils.fixedInt((moveDescriptionLineCount - 3) * 2000),
        y: `-=${14.83 * (72 / 96) * (moveDescriptionLineCount - 3)}`
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
    this.scene.tweens.add({
      targets: this.desc,
      duration: Utils.fixedInt(125),
      ease: "Sine.easeInOut",
      alpha: visible ? 1 : 0
    });
    if (!visible) {
      this.setVisible(false);
    }
  }

  isActive(): boolean {
    return this.active;
  }

  // width of this element
  static getWidth(scale:number, scene: BattleScene):number {
    return scene.game.canvas.width / GLOBAL_SCALE / 2;
  }

  // height of this element
  static getHeight(scale:number, onSide?: boolean):number {
    return (onSide ? Math.max(EFF_HEIGHT, DESC_HEIGHT) : (EFF_HEIGHT + DESC_HEIGHT)) * scale;
  }
}
