import BattleScene, {InfoToggle} from "../battle-scene";
import { TextStyle, addTextObject } from "./text";
import { addWindow } from "./ui-theme";
import * as Utils from "../utils";
import Move, { MoveCategory } from "../data/move";
import { Type } from "../data/type";
import i18next from "i18next";

export interface MoveInfoOverlaySettings {
    delayVisibility?: boolean; // if true, showing the overlay will only set it to active and populate the fields and the handler using this field has to manually call setVisible later.
    scale?:number; // scale the box? A scale of 0.5 is recommended
    top?: boolean; // should the effect box be on top?
    right?: boolean; // should the effect box be on the right?
    //location and width of the component; unaffected by scaling
    x?: number;
    y?: number;
    width?: number; // default is always half the screen, regardless of scale
}

const EFF_HEIGHT = 82;
const EFF_WIDTH = 110;
const DESC_HEIGHT = 62;
const BORDER = 8;
const GLOBAL_SCALE = 6;

export default class MoveInfoOverlay extends Phaser.GameObjects.Container implements InfoToggle {
  public active: boolean = false;

  private move: Move;

  private desc: Phaser.GameObjects.Text;
  private descScroll : Phaser.Tweens.Tween = null;

  private val: Phaser.GameObjects.Container;
  private pow: Phaser.GameObjects.Text;
  private acc: Phaser.GameObjects.Text;
  private typ: Phaser.GameObjects.Sprite;
  private cat: Phaser.GameObjects.Sprite;

  private options : MoveInfoOverlaySettings;

  constructor(scene: BattleScene, options?: MoveInfoOverlaySettings) {
    //options.x = 10, options.y = 10;
    //options.scale = 1;
    super(scene, options?.x, options?.y);
    const scale = options?.scale || 1; // set up the scale
    this.setScale(scale);
    this.options = options || {};

    // prepare the description box
    const width = (options?.width || MoveInfoOverlay.getWidth(scale, this.scene)) / scale; // divide by scale as we always want this to be half a window wide
    const descBg = addWindow(this.scene, 0, options?.top ? EFF_HEIGHT : 0, width, DESC_HEIGHT);
    descBg.setOrigin(0, 0);
    this.add(descBg);

    // set up the description; wordWrap uses true pixels, unaffected by any scaling, while other values are affected
    this.desc = addTextObject(this.scene, BORDER, (options?.top ? EFF_HEIGHT : 0) + BORDER, "", TextStyle.WINDOW, { wordWrap: { width: (width * GLOBAL_SCALE) - (BORDER * GLOBAL_SCALE * 2) } });

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
      maskPointOrigin.x + BORDER * scale, maskPointOrigin.y + ((options?.top ? EFF_HEIGHT : 0) + BORDER) * scale,
      width - (BORDER * 2) * scale, (DESC_HEIGHT - BORDER * 2) * scale);
    moveDescriptionTextMaskRect.setScale(6);
    const moveDescriptionTextMask = this.createGeometryMask(moveDescriptionTextMaskRect);

    this.add(this.desc);
    this.desc.setMask(moveDescriptionTextMask);

    // prepare the effect box
    this.val = new Phaser.GameObjects.Container(scene, options?.right ? width - EFF_WIDTH : 0,  options?.top ? 0 : DESC_HEIGHT);
    this.add(this.val);

    const valuesBg = addWindow(this.scene, 0, 0, EFF_WIDTH, EFF_HEIGHT);
    valuesBg.setOrigin(0, 0);
    this.val.add(valuesBg);

    const subval = new Phaser.GameObjects.Container(scene, 5, 1);
    this.val.add(subval);

    const moveEffectBg = this.scene.add.image(0, 0, "summary_moves_effect_type");
    moveEffectBg.setOrigin(0, 0);
    subval.add(moveEffectBg);

    const moveEffectLabels = addTextObject(this.scene, 8, 12, "Power\nAccuracy\nType\nCategory", TextStyle.SUMMARY);
    moveEffectLabels.setLineSpacing(9);
    moveEffectLabels.setOrigin(0, 0);
    subval.add(moveEffectLabels);

    this.pow = addTextObject(this.scene, 99, 27, "0", TextStyle.WINDOW_ALT);
    this.pow.setOrigin(1, 1);
    subval.add(this.pow);

    this.acc = addTextObject(this.scene, 99, 43, "0", TextStyle.WINDOW_ALT);
    this.acc.setOrigin(1, 1);
    subval.add(this.acc);

    this.typ = this.scene.add.sprite(99, 58, `types${Utils.verifyLang(i18next.language) ? `_${i18next.language}` : ""}`, "unknown");
    this.typ.setOrigin(1, 1);
    subval.add(this.typ);

    this.cat = this.scene.add.sprite(99, 73, "categories");
    this.cat.setOrigin(1, 1);
    subval.add(this.cat);

    // hide this component for now
    this.setVisible(false);
  }

  // show this component with infos for the specific move
  show(move : Move):boolean {
    if (!this.scene.enableMoveInfo) {
      return; // move infos have been disabled
    }
    this.move = move;
    this.pow.setText(move.power >= 0 ? move.power.toString() : "---");
    this.acc.setText(move.accuracy >= 0 ? move.accuracy.toString() : "---");
    this.acc.setText(move.accuracy >= 0 ? move.accuracy.toString() : "---");
    this.typ.setTexture(`types${Utils.verifyLang(i18next.language) ? `_${i18next.language}` : ""}`, Type[move.type].toLowerCase());
    this.cat.setFrame(MoveCategory[move.category].toLowerCase());

    this.desc.setText(move?.effect || "");

    // stop previous scrolling effects
    if (this.descScroll) {
      this.descScroll.remove();
      this.descScroll = null;
    }

    // determine if we need to add new scrolling effects
    const moveDescriptionLineCount = Math.floor(this.desc.displayHeight / 14.83);
    if (moveDescriptionLineCount > 3) {
      // generate scrolling effects
      this.descScroll = this.scene.tweens.add({
        targets: this.desc,
        delay: Utils.fixedInt(2000),
        loop: -1,
        hold: Utils.fixedInt(2000),
        duration: Utils.fixedInt((moveDescriptionLineCount - 3) * 2000),
        y: `-=${14.83 * (moveDescriptionLineCount - 3)}`
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

  toggleInfo(force?: boolean): void {
    this.setVisible(force ?? !this.visible);
  }

  isActive(): boolean {
    return this.active;
  }

  // width of this element
  static getWidth(scale:number, scene: BattleScene):number {
    return scene.game.canvas.width / GLOBAL_SCALE / 2;
  }

  // height of this element
  static getHeight(scale:number):number {
    return (EFF_HEIGHT + DESC_HEIGHT) * scale;
  }
}
