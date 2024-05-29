import BattleScene from "../battle-scene";
import { TextStyle, addTextObject } from "./text";
import { addWindow } from "./ui-theme";
import * as Utils from "../utils";
import Move, { MoveCategory } from "../data/move";
import { Type } from "../data/type";
import i18next from "i18next";

export interface MoveInfoOverlaySettings {
    scale?:number; // scale the box? A scale of 0.5 is recommended
    top?: boolean; // should the effect box be on top?
    right?: boolean; // should the effect box be on the right?
    //location of the component, unaffected by scaling
    x?: number;
    y?: number;
}

const EFF_HEIGHT = 82;
const EFF_WIDTH = 110;
const DESC_HEIGHT = 62;

export default class MoveInfoOverlay extends Phaser.GameObjects.Container {
  private move:Move;

  private desc: Phaser.GameObjects.Text;
  private descScroll : Phaser.Tweens.Tween = null;

  private val: Phaser.GameObjects.Container;
  private pow: Phaser.GameObjects.Text;
  private acc: Phaser.GameObjects.Text;
  private typ: Phaser.GameObjects.Sprite;
  private cat: Phaser.GameObjects.Sprite;

  constructor(scene: BattleScene, options?: MoveInfoOverlaySettings) {
    super(scene, options?.x, options?.y);
    const scale = options?.scale || 1; // set up the scale
    this.setScale(scale);

    // prepare the description box
    const descBg = addWindow(this.scene, 0, options?.top ? EFF_HEIGHT : 0, this.scene.game.canvas.height / (6 * scale), DESC_HEIGHT);
    descBg.setOrigin(0, 0);
    this.add(descBg);

    this.desc = addTextObject(this.scene, 8, (options?.top ? EFF_HEIGHT : 0) + 8, "", TextStyle.WINDOW, { wordWrap: { width: 1000/scale } });
    this.add(this.desc);

    // limit the text rendering, required for scrolling later on
    const moveDescriptionTextMaskRect = this.scene.make.graphics({});
    moveDescriptionTextMaskRect.setScale(6);
    moveDescriptionTextMaskRect.fillStyle(0xFFFFFF);
    moveDescriptionTextMaskRect.beginPath();
    moveDescriptionTextMaskRect.fillRect(8*scale, ((options?.top ? EFF_HEIGHT + 8 : 0)) + 8*scale, this.scene.game.canvas.height / (6 * scale) - (16*scale), DESC_HEIGHT-(16*scale));

    const moveDescriptionTextMask = moveDescriptionTextMaskRect.createGeometryMask();

    this.desc.setMask(moveDescriptionTextMask);

    // prepare the effect box
    this.val = new Phaser.GameObjects.Container(scene, options?.right ? this.scene.game.canvas.height / (6 * scale) - EFF_WIDTH : 0,  options?.top ? 0 : DESC_HEIGHT);
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

    this.setVisible(true);
    return true;
  }

  // width of this element
  static getWidth(scale:number):number {
    return this.scene.game.canvas.height / 6;
  }

  // height of this element
  static getHeight(scale:number):number {
    return (EFF_HEIGHT + DESC_HEIGHT) * scale;
  }

  clear() {
    this.setVisible(false);
  }
}
