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
    onSide?: boolean; // should the effect be on the side? ignores top argument if true
    //location and width of the component; unaffected by scaling
    x?: number;
    y?: number;
    width?: number; // default is always half the screen, regardless of scale
}

const EFF_HEIGHT = 46;
const EFF_WIDTH = 82;
const DESC_HEIGHT = 46;
const BORDER = 8;
const GLOBAL_SCALE = 6;

export default class MoveInfoOverlay extends Phaser.GameObjects.Container implements InfoToggle {
  public active: boolean = false;

  private move: Move;

  private desc: Phaser.GameObjects.Text;
  private descScroll : Phaser.Tweens.Tween = null;

  private val: Phaser.GameObjects.Container;
  private pp:  Phaser.GameObjects.Text;
  private pow: Phaser.GameObjects.Text;
  private acc: Phaser.GameObjects.Text;
  private typ: Phaser.GameObjects.Sprite;
  private cat: Phaser.GameObjects.Sprite;

  private options : MoveInfoOverlaySettings;

  constructor(scene: BattleScene, options?: MoveInfoOverlaySettings) {
    if (options?.onSide) {
      options.top = false;
    }
    super(scene, options?.x, options?.y);
    const scale = options?.scale || 1; // set up the scale
    this.setScale(scale);
    this.options = options || {};

    // prepare the description box
    const width = (options?.width || MoveInfoOverlay.getWidth(scale, scene)) / scale; // divide by scale as we always want this to be half a window wide
    const descBg = addWindow(scene,  (options?.onSide && !options?.right ? EFF_WIDTH : 0), options?.top ? EFF_HEIGHT : 0, width - (options?.onSide ? EFF_WIDTH : 0), DESC_HEIGHT);
    descBg.setOrigin(0, 0);
    this.add(descBg);

    // set up the description; wordWrap uses true pixels, unaffected by any scaling, while other values are affected
    this.desc = addTextObject(scene, (options?.onSide && !options?.right ? EFF_WIDTH : 0) + BORDER, (options?.top ? EFF_HEIGHT : 0) + BORDER - 2, "", TextStyle.BATTLE_INFO, { wordWrap: { width: (width - (BORDER - 2) * 2 - (options?.onSide ? EFF_WIDTH : 0)) * GLOBAL_SCALE } });

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

    // prepare the effect box
    this.val = new Phaser.GameObjects.Container(scene, options?.right ? width - EFF_WIDTH : 0,  options?.top || options?.onSide ? 0 : DESC_HEIGHT);
    this.add(this.val);

    const valuesBg = addWindow(scene, 0, 0, EFF_WIDTH, EFF_HEIGHT);
    valuesBg.setOrigin(0, 0);
    this.val.add(valuesBg);

    this.typ = this.scene.add.sprite(25, EFF_HEIGHT - 35,`types${Utils.verifyLang(i18next.language) ? `_${i18next.language}` : ""}` , "unknown");
    this.typ.setScale(0.8);
    this.val.add(this.typ);

    this.cat = this.scene.add.sprite(57, EFF_HEIGHT - 35, "categories", "physical");
    this.val.add(this.cat);

    const ppTxt = addTextObject(scene, 12, EFF_HEIGHT - 25, "PP", TextStyle.MOVE_INFO_CONTENT);
    ppTxt.setOrigin(0.0, 0.5);
    ppTxt.setText(i18next.t("fightUiHandler:pp"));
    this.val.add(ppTxt);

    this.pp = addTextObject(scene, 70, EFF_HEIGHT - 25, "--", TextStyle.MOVE_INFO_CONTENT);
    this.pp.setOrigin(1, 0.5);
    this.val.add(this.pp);

    const powTxt = addTextObject(scene, 12, EFF_HEIGHT - 17, "POWER", TextStyle.MOVE_INFO_CONTENT);
    powTxt.setOrigin(0.0, 0.5);
    powTxt.setText(i18next.t("fightUiHandler:power"));
    this.val.add(powTxt);

    this.pow = addTextObject(scene, 70, EFF_HEIGHT - 17, "---", TextStyle.MOVE_INFO_CONTENT);
    this.pow.setOrigin(1, 0.5);
    this.val.add(this.pow);

    const accTxt = addTextObject(scene, 12, EFF_HEIGHT - 9, "ACC", TextStyle.MOVE_INFO_CONTENT);
    accTxt.setOrigin(0.0, 0.5);
    accTxt.setText(i18next.t("fightUiHandler:accuracy"));
    this.val.add(accTxt);

    this.acc = addTextObject(scene, 70, EFF_HEIGHT - 9, "---", TextStyle.MOVE_INFO_CONTENT);
    this.acc.setOrigin(1, 0.5);
    this.val.add(this.acc);

    // hide this component for now
    this.setVisible(false);
  }

  // show this component with infos for the specific move
  show(move : Move):boolean {
    if (!(this.scene as BattleScene).enableMoveInfo) {
      return; // move infos have been disabled
    }
    this.move = move;
    this.pow.setText(move.power >= 0 ? move.power.toString() : "---");
    this.acc.setText(move.accuracy >= 0 ? move.accuracy.toString() : "---");
    this.pp.setText(move.pp >= 0 ? move.pp.toString() : "---");
    this.typ.setTexture(`types${Utils.verifyLang(i18next.language) ? `_${i18next.language}` : ""}`, Type[move.type].toLowerCase());
    this.cat.setFrame(MoveCategory[move.category].toLowerCase());

    this.desc.setText(move?.effect || "");

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
  static getHeight(scale:number, onSide?: boolean):number {
    return (onSide ? Math.max(EFF_HEIGHT, DESC_HEIGHT) : (EFF_HEIGHT + DESC_HEIGHT)) * scale;
  }
}
