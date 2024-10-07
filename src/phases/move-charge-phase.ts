import BattleScene from "#app/battle-scene";
import { BattlerIndex } from "#app/battle";
import { MoveChargeAnim } from "#app/data/battle-anims";
import { applyMoveChargeAttrs, MoveEffectAttr, InstantChargeAttr } from "#app/data/move";
import Pokemon, { MoveResult, PokemonMove } from "#app/field/pokemon";
import { BooleanHolder } from "#app/utils";
import { MovePhase } from "#app/phases/move-phase";
import { PokemonPhase } from "#app/phases/pokemon-phase";
import { BattlerTagType } from "#enums/battler-tag-type";


export class MoveChargePhase extends PokemonPhase {
  /** The move instance that this phase applies */
  public move: PokemonMove;
  /** The field index targeted by the move (Charging moves assume single target) */
  public targetIndex: BattlerIndex;

  constructor(scene: BattleScene, battlerIndex: BattlerIndex, targetIndex: BattlerIndex, move: PokemonMove) {
    super(scene, battlerIndex);
    this.move = move;
    this.targetIndex = targetIndex;
  }

  start() {
    super.start();

    const user = this.getUserPokemon();
    const target = this.getTargetPokemon();
    const move = this.move.getMove();

    if (!target || !(move.isChargingMove())) {
      return super.end();
    }

    new MoveChargeAnim(move.chargeAnim, move.id, user).play(this.scene, false, () => {
      move.showChargeText(user, target);
      user.getMoveQueue().push({ move: move.id, targets: [ target?.getBattlerIndex() ]});

      applyMoveChargeAttrs(MoveEffectAttr, user, target, move).then(() => {
        user.addTag(BattlerTagType.CHARGING, 1, move.id, user.id);
        this.end();
      });
    });
  }

  /** Checks the move's instant charge conditions, then ends this phase. */
  end() {
    const user = this.getUserPokemon();
    const move = this.move.getMove();

    if (move.isChargingMove()) {
      const instantCharge = new BooleanHolder(false);

      applyMoveChargeAttrs(InstantChargeAttr, user, null, move, instantCharge);

      if (instantCharge.value) {
        this.scene.unshiftPhase(new MovePhase(this.scene, user, [ this.targetIndex ], this.move, false));
      } else {
        user.getMoveQueue().push({ move: move.id, targets: [ this.targetIndex ]});
      }

      // Add this move's charging phase to the user's move history
      user.pushMoveHistory({ move: this.move.moveId, targets: [ this.targetIndex ], result: MoveResult.OTHER });
    }
    super.end();
  }

  protected getUserPokemon(): Pokemon {
    return (this.player ? this.scene.getPlayerField() : this.scene.getEnemyField())[this.fieldIndex];
  }

  protected getTargetPokemon(): Pokemon | undefined {
    return this.scene.getField(true).find((p) => this.targetIndex === p.getBattlerIndex());
  }
}
