import { BattleTarget } from "../battle";
import BattleScene, { Button } from "../battle-scene";
import { Moves, getMoveTargets } from "../data/move";
import { Mode } from "./ui";
import UiHandler from "./uiHandler";
import * as Utils from "../utils";

export type TargetSelectCallback = (cursor: integer) => void;

export default class TargetSelectUiHandler extends UiHandler {
  private fieldIndex: integer;
  private move: Moves;
  private targetSelectCallback: TargetSelectCallback;

  private targets: BattleTarget[];
  private targetFlashTween: Phaser.Tweens.Tween;

  constructor(scene: BattleScene) {
    super(scene, Mode.TARGET_SELECT);
  }

  setup(): void { }

  show(args: any[]) {
    if (args.length < 3)
      return;

    super.show(args);

    this.fieldIndex = args[0] as integer;
    this.move = args[1] as Moves;
    this.targetSelectCallback = args[2] as TargetSelectCallback;

    this.targets = getMoveTargets(this.scene.getPlayerField()[this.fieldIndex], this.move).targets;

    if (!this.targets.length)
      return;

    console.log(this.targets);

    this.setCursor(this.targets.indexOf(this.cursor) > -1 ? this.cursor : this.targets[0]);
  }

  processInput(button: Button) {
    const ui = this.getUi();

    let success = false;

    if (button === Button.ACTION || button === Button.CANCEL) {
      this.targetSelectCallback(button === Button.ACTION ? this.cursor : -1);
      success = true;
    } else {
      switch (button) {
        case Button.UP:
          if (this.cursor < BattleTarget.ENEMY && this.targets.find(t => t >= BattleTarget.ENEMY))
            success = this.setCursor(this.targets.find(t => t >= BattleTarget.ENEMY));
          break;
        case Button.DOWN:
          if (this.cursor >= BattleTarget.ENEMY && this.targets.find(t => t < BattleTarget.ENEMY))
            success = this.setCursor(this.targets.find(t => t < BattleTarget.ENEMY));
          break;
        case Button.LEFT:
          if (this.cursor % 2 && this.targets.find(t => t === this.cursor - 1))
            success = this.setCursor(this.cursor - 1);
          break;
        case Button.RIGHT:
          if (!(this.cursor % 2) && this.targets.find(t => t === this.cursor + 1))
            success = this.setCursor(this.cursor + 1);
          break;
      }
    }

    if (success)
      ui.playSelect();
  }

  setCursor(cursor: integer): boolean {
    const lastCursor = this.cursor;

    const ret = super.setCursor(cursor);

    if (this.targetFlashTween) {
      this.targetFlashTween.stop();
      const lastTarget = this.scene.getField()[lastCursor];
      if (lastTarget)
        lastTarget.setAlpha(1);
    }

    const target = this.scene.getField()[cursor];

    this.targetFlashTween = this.scene.tweens.add({
      targets: [ target ],
      alpha: 0,
      loop: -1,
      duration: new Utils.FixedInt(250) as unknown as integer,
      ease: 'Sine.easeIn',
      yoyo: true,
      onUpdate: t => {
        if (target)
          target.setAlpha(t.getValue());
      }
    });

    return ret;
  }

  eraseCursor() {
    const target = this.scene.getField()[this.cursor];
    if (this.targetFlashTween) {
      this.targetFlashTween.stop();
      this.targetFlashTween = null;
    }
    if (target)
      target.setAlpha(1);
  }

  clear() {
    super.clear();
    this.eraseCursor();
  }
}