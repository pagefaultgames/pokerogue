import { vi } from "vitest";
import { MoveEffectPhase } from "#app/phases.js";
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
   */
  async forceMiss(): Promise<void> {
    await this.game.phaseInterceptor.to(MoveEffectPhase, false);
    vi.spyOn(this.game.scene.getCurrentPhase() as MoveEffectPhase, "hitCheck").mockReturnValue(false);
  }
}
