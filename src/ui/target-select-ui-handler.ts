import { BattlerIndex } from "../battle";
import BattleScene from "../battle-scene";
import { Mode } from "./ui";
import UiHandler from "./ui-handler";
import * as Utils from "../utils";
import { getMoveTargets } from "../data/move";
import {Button} from "#enums/buttons";
import { Moves } from "#enums/moves";
import Pokemon from "#app/field/pokemon.js";

export type TargetSelectCallback = (targets: BattlerIndex[]) => void;

export default class TargetSelectUiHandler extends UiHandler {
  private fieldIndex: integer;
  private move: Moves;
  private targetSelectCallback: TargetSelectCallback;

  private isMultipleTargets: boolean = false;
  private targets: BattlerIndex[];
  private targetsHighlighted: Pokemon[];
  private targetFlashTween: Phaser.Tweens.Tween;
  private targetBattleInfoMoveTween: Phaser.Tweens.Tween[] = [];

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

    const moveTargets = getMoveTargets(this.scene.getPlayerField()[this.fieldIndex], this.move);
    this.targets = moveTargets.targets;
    this.isMultipleTargets = moveTargets.multiple ?? false;

    if (!this.targets.length) {
      return false;
    }

    this.setCursor(this.targets.includes(this.cursor) ? this.cursor : this.targets[0]);

    return true;
  }

  processInput(button: Button): boolean {
    const ui = this.getUi();

    let success = false;

    if (button === Button.ACTION || button === Button.CANCEL) {
      const targetIndexes: BattlerIndex[] = this.isMultipleTargets ? this.targets : [this.cursor];
      this.targetSelectCallback(button === Button.ACTION ? targetIndexes : []);
      success = true;
    } else if (this.isMultipleTargets) {
      success = false;
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
    const singleTarget = this.scene.getField()[cursor];
    const multipleTargets = this.targets.map(index => this.scene.getField()[index]);

    this.targetsHighlighted = this.isMultipleTargets ? multipleTargets : [ singleTarget ];

    const ret = super.setCursor(cursor);

    if (this.targetFlashTween) {
      this.targetFlashTween.stop();
      for (const pokemon of multipleTargets) {
        pokemon.setAlpha(1);
      }
    }

    this.targetFlashTween = this.scene.tweens.add({
      targets: this.targetsHighlighted,
      alpha: 0,
      loop: -1,
      duration: Utils.fixedInt(250),
      ease: "Sine.easeIn",
      yoyo: true,
      onUpdate: t => {
        for (const target of this.targetsHighlighted) {
          target.setAlpha(t.getValue());
        }
      }
    });
    if (this.targetBattleInfoMoveTween.length >= 1) {
      this.targetBattleInfoMoveTween.filter(t => t !== undefined).forEach(tween => tween.stop());
      for (const pokemon of multipleTargets) {
        pokemon.getBattleInfo().resetY();
      }
    }

    const targetsBattleInfo = this.targetsHighlighted.map(target => target.getBattleInfo());

    targetsBattleInfo.map(info => {
      this.targetBattleInfoMoveTween.push(this.scene.tweens.add({
        targets: [ info ],
        y: { start: info.getBaseY(), to: info.getBaseY() + 1 },
        loop: -1,
        duration: Utils.fixedInt(250),
        ease: "Linear",
        yoyo: true
      }));
    });

    return ret;
  }

  eraseCursor() {
    if (this.targetFlashTween) {
      this.targetFlashTween.stop();
      this.targetFlashTween = null;
    }
    for (const pokemon of this.targetsHighlighted) {
      pokemon.setAlpha(1);
    }

    if (this.targetBattleInfoMoveTween.length >= 1) {
      this.targetBattleInfoMoveTween.filter(t => t !== undefined).forEach(tween => tween.stop());
      this.targetBattleInfoMoveTween = [];
    }
    for (const pokemon of this.targetsHighlighted) {
      pokemon.getBattleInfo().resetY();
    }
  }

  clear() {
    super.clear();
    this.eraseCursor();
  }
}
