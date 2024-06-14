import { BattlerIndex } from "../battle";
import BattleScene from "../battle-scene";
import { Mode } from "./ui";
import UiHandler from "./ui-handler";
import * as Utils from "../utils";
import { getMoveTargets } from "../data/move";
import {Button} from "#enums/buttons";
import { Moves } from "#enums/moves";

export type TargetSelectCallback = (cursor: integer) => void;

export default class TargetSelectUiHandler extends UiHandler {
  private fieldIndex: integer;
  private move: Moves;
  private targetSelectCallback: TargetSelectCallback;

  private targets: BattlerIndex[];
  private targetFlashTween: Phaser.Tweens.Tween;
  private targetBattleInfoMoveTween: Phaser.Tweens.Tween;

  constructor(scene: BattleScene) {
    super(scene, Mode.TARGET_SELECT);

    this.cursor = -1;
  }

  setup(): void { }

  show(args: any[]): boolean {
    if (args.length < 3) {
      return false;
    }

    super.show(args);

    this.fieldIndex = args[0] as integer;
    this.move = args[1] as Moves;
    this.targetSelectCallback = args[2] as TargetSelectCallback;

    this.targets = getMoveTargets(this.scene.getPlayerField()[this.fieldIndex], this.move).targets;

    if (!this.targets.length) {
      return false;
    }

    this.setCursor(this.targets.indexOf(this.cursor) > -1 ? this.cursor : this.targets[0]);

    return true;
  }

  processInput(button: Button): boolean {
    const ui = this.getUi();

    let success = false;

    if (button === Button.ACTION || button === Button.CANCEL) {
      this.targetSelectCallback(button === Button.ACTION ? this.cursor : -1);
      success = true;
    } else {
      switch (button) {
      case Button.UP:
        if (this.cursor < BattlerIndex.ENEMY && this.targets.findIndex(t => t >= BattlerIndex.ENEMY) > -1) {
          success = this.setCursor(this.targets.find(t => t >= BattlerIndex.ENEMY));
        }
        break;
      case Button.DOWN:
        if (this.cursor >= BattlerIndex.ENEMY && this.targets.findIndex(t => t < BattlerIndex.ENEMY) > -1) {
          success = this.setCursor(this.targets.find(t => t < BattlerIndex.ENEMY));
        }
        break;
      case Button.LEFT:
        if (this.cursor % 2 && this.targets.findIndex(t => t === this.cursor - 1) > -1) {
          success = this.setCursor(this.cursor - 1);
        }
        break;
      case Button.RIGHT:
        if (!(this.cursor % 2) && this.targets.findIndex(t => t === this.cursor + 1) > -1) {
          success = this.setCursor(this.cursor + 1);
        }
        break;
      }
    }

    if (success) {
      ui.playSelect();
    }

    return success;
  }

  setCursor(cursor: integer): boolean {
    const lastCursor = this.cursor;

    const ret = super.setCursor(cursor);

    if (this.targetFlashTween) {
      this.targetFlashTween.stop();
      const lastTarget = this.scene.getField()[lastCursor];
      if (lastTarget) {
        lastTarget.setAlpha(1);
      }
    }

    const target = this.scene.getField()[cursor];

    this.targetFlashTween = this.scene.tweens.add({
      targets: [ target ],
      alpha: 0,
      loop: -1,
      duration: Utils.fixedInt(250),
      ease: "Sine.easeIn",
      yoyo: true,
      onUpdate: t => {
        if (target) {
          target.setAlpha(t.getValue());
        }
      }
    });

    if (this.targetBattleInfoMoveTween) {
      this.targetBattleInfoMoveTween.stop();
      const lastTarget = this.scene.getField()[lastCursor];
      if (lastTarget) {
        lastTarget.getBattleInfo().resetY();
      }
    }

    const targetBattleInfo = target.getBattleInfo();

    this.targetBattleInfoMoveTween = this.scene.tweens.add({
      targets: [ targetBattleInfo ],
      y: { start: targetBattleInfo.getBaseY(), to: targetBattleInfo.getBaseY() + 1 },
      loop: -1,
      duration: Utils.fixedInt(250),
      ease: "Linear",
      yoyo: true
    });

    return ret;
  }

  eraseCursor() {
    const target = this.scene.getField()[this.cursor];
    if (this.targetFlashTween) {
      this.targetFlashTween.stop();
      this.targetFlashTween = null;
    }
    if (target) {
      target.setAlpha(1);
    }

    const targetBattleInfo = target.getBattleInfo();
    if (this.targetBattleInfoMoveTween) {
      this.targetBattleInfoMoveTween.stop();
      this.targetBattleInfoMoveTween = null;
    }
    if (targetBattleInfo) {
      targetBattleInfo.resetY();
    }
  }

  clear() {
    super.clear();
    this.eraseCursor();
  }
}
