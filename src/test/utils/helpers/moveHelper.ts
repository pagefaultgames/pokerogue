import { vi } from "vitest";
import { MoveEffectPhase } from "#app/phases.js";
import { GameManagerHelper } from "./gameManagerHelper";
import { Moves } from "#app/enums/moves.js";
import { getMovePosition } from "../gameManagerUtils";

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
     * Select the move to be used by the given Pokemon(-index)
     * @param move the move to use
     * @param pkmIndex the pokemon index. Relevant for double-battles only (defaults to 0)
     */
  select(move: Moves, pkmIndex: 0 | 1 = 0) {
    this.game.selectMove(getMovePosition(this.game.scene, pkmIndex, move));
  }
}
