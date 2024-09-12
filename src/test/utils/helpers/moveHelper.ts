import { BattlerIndex } from "#app/battle";
import { Moves } from "#app/enums/moves";
import { CommandPhase } from "#app/phases/command-phase";
import { MoveEffectPhase } from "#app/phases/move-effect-phase";
import { Command } from "#app/ui/command-ui-handler";
import { Mode } from "#app/ui/ui";
import { vi } from "vitest";
import { getMovePosition } from "../gameManagerUtils";
import { GameManagerHelper } from "./gameManagerHelper";

/**
 * Helper to handle a Pokemon's move
 */
export class MoveHelper extends GameManagerHelper {
  /**
   * Intercepts `MoveEffectPhase` and mocks the hitCheck's
   * return value to `true` {@linkcode MoveEffectPhase.hitCheck}.
   * Used to force a move to hit.
   */
  async forceHit(): Promise<void> {
    await this.game.phaseInterceptor.to(MoveEffectPhase, false);
    vi.spyOn(this.game.scene.getCurrentPhase() as MoveEffectPhase, "hitCheck").mockReturnValue(true);
  }

  /**
   * Intercepts `MoveEffectPhase` and mocks the hitCheck's
   * return value to `false` {@linkcode MoveEffectPhase.hitCheck}.
   * Used to force a move to miss.
   * @param firstTargetOnly Whether the move should force miss on the first target only, in the case of multi-target moves.
   */
  async forceMiss(firstTargetOnly: boolean = false): Promise<void> {
    await this.game.phaseInterceptor.to(MoveEffectPhase, false);
    const hitCheck = vi.spyOn(this.game.scene.getCurrentPhase() as MoveEffectPhase, "hitCheck");

    if (firstTargetOnly) {
      hitCheck.mockReturnValueOnce(false);
    } else {
      hitCheck.mockReturnValue(false);
    }
  }

  /**
     * Select the move to be used by the given Pokemon(-index). Triggers during the next {@linkcode CommandPhase}
     * @param move the move to use
     * @param pkmIndex the pokemon index. Relevant for double-battles only (defaults to 0)
     * @param targetIndex The {@linkcode BattlerIndex} of the Pokemon to target for single-target moves, or `null` if a manual call to `selectTarget()` is required
     */
  select(move: Moves, pkmIndex: 0 | 1 = 0, targetIndex?: BattlerIndex | null) {
    const movePosition = getMovePosition(this.game.scene, pkmIndex, move);

    this.game.onNextPrompt("CommandPhase", Mode.COMMAND, () => {
      this.game.scene.ui.setMode(Mode.FIGHT, (this.game.scene.getCurrentPhase() as CommandPhase).getFieldIndex());
    });
    this.game.onNextPrompt("CommandPhase", Mode.FIGHT, () => {
      (this.game.scene.getCurrentPhase() as CommandPhase).handleCommand(Command.FIGHT, movePosition, false);
    });

    if (targetIndex !== null) {
      this.game.selectTarget(movePosition, targetIndex);
    }
  }
}
