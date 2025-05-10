import { globalScene } from "#app/global-scene";
import type { BattlerIndex } from "#app/battle";
import { MoveChargeAnim } from "#app/data/battle-anims";
import { applyMoveChargeAttrs, MoveEffectAttr, InstantChargeAttr, type ChargingMove } from "#app/data/moves/move";
import type { PokemonMove } from "#app/field/pokemon";
import type Pokemon from "#app/field/pokemon";
import { MoveResult } from "#app/field/pokemon";
import { BooleanHolder } from "#app/utils/common";
import { MovePhase } from "#app/phases/move-phase";
import { PokemonPhase } from "#app/phases/pokemon-phase";
import { BattlerTagType } from "#enums/battler-tag-type";
import { MoveEndPhase } from "#app/phases/move-end-phase";
import type { MoveUseType } from "#enums/move-use-type";

/**
 * Phase for the "charging turn" of two-turn moves (e.g. Dig).
 */
export class MoveChargePhase extends PokemonPhase {
  /** The move instance that this phase applies */
  public move: PokemonMove;
  /** The field index targeted by the move (Charging moves assume single target) */
  public targetIndex: BattlerIndex;

  /** The {@linkcode MoveUseType} of the move that triggered the charge; passed on from move phase */
  private useType: MoveUseType;

  /**
   * Create a new MoveChargePhase.
   * @param battlerIndex - The {@linkcode BattlerIndex} of the user.
   * @param targetIndex - The {@linkcode BattlerIndex} of the target.
   * @param move - The {@linkcode PokemonMove} being used
   * @param useType - The move's {@linkcode MoveUseType}
   */
  constructor(battlerIndex: BattlerIndex, targetIndex: BattlerIndex, move: PokemonMove, useType: MoveUseType) {
    super(battlerIndex);
    this.move = move;
    this.targetIndex = targetIndex;
    this.useType = useType;
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
      super.end();
      return;
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
    const move = this.move.getMove() as ChargingMove;

    const instantCharge = new BooleanHolder(false);
    applyMoveChargeAttrs(InstantChargeAttr, user, null, move, instantCharge);

    // If instantly charging, remove the pending MoveEndPhase and queue a new MovePhase for the "attack" portion of the move.
    // Otherwise, add the attack portion to the user's move queue to execute next turn.
    if (instantCharge.value) {
      globalScene.tryRemovePhase(phase => phase instanceof MoveEndPhase && phase.getPokemon() === user);
      globalScene.unshiftPhase(new MovePhase(user, [this.targetIndex], this.move, this.useType));
    } else {
      user.pushMoveQueue({ move: move.id, targets: [this.targetIndex], useType: this.useType });
    }

    // Add this move's charging phase to the user's move history
    user.pushMoveHistory({
      move: this.move.moveId,
      targets: [this.targetIndex],
      result: MoveResult.OTHER,
      useType: this.useType,
    });
  }

  public getUserPokemon(): Pokemon {
    return (this.player ? globalScene.getPlayerField() : globalScene.getEnemyField())[this.fieldIndex];
  }

  public getTargetPokemon(): Pokemon | undefined {
    return globalScene.getField(true).find(p => this.targetIndex === p.getBattlerIndex());
  }
}
