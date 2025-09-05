import { globalScene } from "#app/global-scene";
import { SubstituteTag } from "#data/battler-tags";
import { BattlerIndex } from "#enums/battler-index";
import { Button } from "#enums/buttons";
import type { MoveId } from "#enums/move-id";
import { UiMode } from "#enums/ui-mode";
import type { Pokemon } from "#field/pokemon";
import type { ModifierBar } from "#modifiers/modifier";
import { getMoveTargets } from "#moves/move-utils";
import { UiHandler } from "#ui/handlers/ui-handler";
import { fixedInt, isNullOrUndefined } from "#utils/common";

export type TargetSelectCallback = (targets: BattlerIndex[]) => void;

export class TargetSelectUiHandler extends UiHandler {
  private fieldIndex: number;
  private move: MoveId;
  private targetSelectCallback: TargetSelectCallback;
  private cursor0: number; // associated with BattlerIndex.PLAYER
  private cursor1: number; // associated with BattlerIndex.PLAYER_2

  private isMultipleTargets = false;
  private targets: BattlerIndex[];
  private targetsHighlighted: Pokemon[];
  private targetFlashTween: Phaser.Tweens.Tween | null;
  private enemyModifiers: ModifierBar;
  private targetBattleInfoMoveTween: Phaser.Tweens.Tween[] = [];

  constructor() {
    super(UiMode.TARGET_SELECT);

    this.cursor = -1;
  }

  setup(): void {}

  show(args: any[]): boolean {
    if (args.length < 3) {
      return false;
    }

    super.show(args);

    this.fieldIndex = args[0] as number;
    this.move = args[1] as MoveId;
    this.targetSelectCallback = args[2] as TargetSelectCallback;
    const user = globalScene.getPlayerField()[this.fieldIndex];

    const moveTargets = getMoveTargets(user, this.move);
    this.targets = moveTargets.targets;
    this.isMultipleTargets = moveTargets.multiple ?? false;

    if (this.targets.length === 0) {
      return false;
    }

    this.enemyModifiers = globalScene.getModifierBar(true);

    if (this.fieldIndex === BattlerIndex.PLAYER) {
      this.resetCursor(this.cursor0, user);
    } else if (this.fieldIndex === BattlerIndex.PLAYER_2) {
      this.resetCursor(this.cursor1, user);
    }
    return true;
  }

  /**
   * Determines what value to assign the main cursor based on the previous turn's target or the user's status
   * @param cursorN the cursor associated with the user's field index
   * @param user the Pokemon using the move
   */
  resetCursor(cursorN: number, user: Pokemon): void {
    if (
      !isNullOrUndefined(cursorN)
      && ([BattlerIndex.PLAYER, BattlerIndex.PLAYER_2].includes(cursorN) || user.tempSummonData.waveTurnCount === 1)
    ) {
      // Reset cursor on the first turn of a fight or if an ally was targeted last turn
      cursorN = -1;
    }
    this.setCursor(this.targets.includes(cursorN) ? cursorN : this.targets[0]);
  }

  processInput(button: Button): boolean {
    const ui = this.getUi();

    let success = false;

    if (button === Button.ACTION || button === Button.CANCEL) {
      const targetIndexes: BattlerIndex[] = this.isMultipleTargets ? this.targets : [this.cursor];
      this.targetSelectCallback(button === Button.ACTION ? targetIndexes : []);
      success = true;
      if (this.fieldIndex === BattlerIndex.PLAYER) {
        if (isNullOrUndefined(this.cursor0) || this.cursor0 !== this.cursor) {
          this.cursor0 = this.cursor;
        }
      } else if (
        this.fieldIndex === BattlerIndex.PLAYER_2
        && (isNullOrUndefined(this.cursor1) || this.cursor1 !== this.cursor)
      ) {
        this.cursor1 = this.cursor;
      }
    } else if (this.isMultipleTargets) {
      success = false;
    } else {
      switch (button) {
        case Button.UP:
          if (this.cursor < BattlerIndex.ENEMY && this.targets.findIndex(t => t >= BattlerIndex.ENEMY) > -1) {
            success = this.setCursor(this.targets.find(t => t >= BattlerIndex.ENEMY)!); // TODO: is the bang correct here?
          }
          break;
        case Button.DOWN:
          if (this.cursor >= BattlerIndex.ENEMY && this.targets.findIndex(t => t < BattlerIndex.ENEMY) > -1) {
            success = this.setCursor(this.targets.find(t => t < BattlerIndex.ENEMY)!); // TODO: is the bang correct here?
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

  setCursor(cursor: number): boolean {
    const singleTarget = globalScene.getField()[cursor];
    const multipleTargets = this.targets.map(index => globalScene.getField()[index]);

    this.targetsHighlighted = this.isMultipleTargets ? multipleTargets : [singleTarget];

    const ret = super.setCursor(cursor);

    if (this.targetFlashTween) {
      this.targetFlashTween.stop();
      for (const pokemon of multipleTargets) {
        pokemon.setAlpha(pokemon.getTag(SubstituteTag) ? 0.5 : 1);
        this.highlightItems(pokemon.id, 1);
      }
    }

    this.targetFlashTween = globalScene.tweens.add({
      targets: this.targetsHighlighted,
      key: { start: 1, to: 0.25 },
      loop: -1,
      loopDelay: 150,
      duration: fixedInt(450),
      ease: "Sine.easeInOut",
      yoyo: true,
      onUpdate: t => {
        for (const target of this.targetsHighlighted) {
          target.setAlpha(t.getValue() ?? 1);
          this.highlightItems(target.id, t.getValue() ?? 1);
        }
      },
    });

    if (this.targetBattleInfoMoveTween.length > 0) {
      this.targetBattleInfoMoveTween.filter(t => t !== undefined).forEach(tween => tween.stop());
      for (const pokemon of multipleTargets) {
        pokemon.getBattleInfo().resetY();
      }
    }

    const targetsBattleInfo = this.targetsHighlighted.map(target => target.getBattleInfo());

    targetsBattleInfo.map(info => {
      this.targetBattleInfoMoveTween.push(
        globalScene.tweens.add({
          targets: [info],
          y: { start: info.getBaseY(), to: info.getBaseY() + 1 },
          loop: -1,
          duration: fixedInt(250),
          ease: "Linear",
          yoyo: true,
        }),
      );
    });
    return ret;
  }

  eraseCursor() {
    if (this.targetFlashTween) {
      this.targetFlashTween.stop();
      this.targetFlashTween = null;
    }

    for (const pokemon of this.targetsHighlighted) {
      pokemon.setAlpha(pokemon.getTag(SubstituteTag) ? 0.5 : 1);
      this.highlightItems(pokemon.id, 1);
    }

    if (this.targetBattleInfoMoveTween.length > 0) {
      this.targetBattleInfoMoveTween.filter(t => t !== undefined).forEach(tween => tween.stop());
      this.targetBattleInfoMoveTween = [];
    }
    for (const pokemon of this.targetsHighlighted) {
      pokemon.getBattleInfo().resetY();
    }
  }

  private highlightItems(targetId: number, val: number): void {
    const targetItems = this.enemyModifiers.getAll("name", targetId.toString());
    for (const item of targetItems as Phaser.GameObjects.Container[]) {
      item.setAlpha(val);
    }
  }

  clear() {
    super.clear();
    this.eraseCursor();
  }
}
