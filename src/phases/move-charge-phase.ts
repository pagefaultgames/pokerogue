import { globalScene } from "#app/global-scene";
import type { BattlerIndex } from "#app/battle";
import { MoveChargeAnim } from "#app/data/battle-anims";
import { applyMoveChargeAttrs, MoveEffectAttr, InstantChargeAttr } from "#app/data/moves/move";
import type { PokemonMove } from "#app/field/pokemon";
import type Pokemon from "#app/field/pokemon";
import { MoveResult } from "#app/field/pokemon";
import { BooleanHolder } from "#app/utils/common";
import { MovePhase } from "#app/phases/move-phase";
import { PokemonPhase } from "#app/phases/pokemon-phase";
import { BattlerTagType } from "#enums/battler-tag-type";
import { MoveEndPhase } from "#app/phases/move-end-phase";

/**
 * Phase for the "charging turn" of two-turn moves (e.g. Dig).
 * @extends {@linkcode PokemonPhase}
 */
export class MoveChargePhase extends PokemonPhase {
  /** The move instance that this phase applies */
  public move: PokemonMove;
  /** The field index targeted by the move (Charging moves assume single target) */
  public targetIndex: BattlerIndex;

  constructor(battlerIndex: BattlerIndex, targetIndex: BattlerIndex, move: PokemonMove) {
    super(battlerIndex);
    this.move = move;
    this.targetIndex = targetIndex;
  }

  public override start() {
    super.start();

    const user = this.getUserPokemon();
    const target = this.getTargetPokemon();
    const move = this.move.getMove();

    // If the target is somehow not defined, or the move is somehow not a ChargingMove,
    // immediately end this phase.
    if (!target || !move.isChargingMove()) {
      console.warn("Invalid parameters for MoveChargePhase");
      return super.end();
    }

    new MoveChargeAnim(move.chargeAnim, move.id, user).play(false, () => {
      move.showChargeText(user, target);

      applyMoveChargeAttrs(MoveEffectAttr, user, target, move);
      user.addTag(BattlerTagType.CHARGING, 1, move.id, user.id);
      this.end();
    });
  }

  /** Checks the move's instant charge conditions, then ends this phase. */
  public override end() {
    const user = this.getUserPokemon();
    const move = this.move.getMove();

    if (move.isChargingMove()) {
      const instantCharge = new BooleanHolder(false);

      applyMoveChargeAttrs(InstantChargeAttr, user, null, move, instantCharge);

      if (instantCharge.value) {
        // this MoveEndPhase will be duplicated by the queued MovePhase if not removed
        globalScene.tryRemovePhase(phase => phase instanceof MoveEndPhase && phase.getPokemon() === user);
        // queue a new MovePhase for this move's attack phase
        globalScene.unshiftPhase(new MovePhase(user, [this.targetIndex], this.move, false));
      } else {
        user.getMoveQueue().push({ move: move.id, targets: [this.targetIndex] });
      }

      // Add this move's charging phase to the user's move history
      user.pushMoveHistory({
        move: this.move.moveId,
        targets: [this.targetIndex],
        result: MoveResult.OTHER,
      });
    }
    super.end();
  }

  public getUserPokemon(): Pokemon {
    return (this.player ? globalScene.getPlayerField() : globalScene.getEnemyField())[this.fieldIndex];
  }

  public getTargetPokemon(): Pokemon | undefined {
    return globalScene.getField(true).find(p => this.targetIndex === p.getBattlerIndex());
  }
}
