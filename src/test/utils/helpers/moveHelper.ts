import { vi } from "vitest";
import { GameManagerHelper } from "./gameManagerHelper";
import { BattlerIndex } from "#app/battle.js";
import { EnemyPokemon } from "#app/field/pokemon.js";
import { MoveEffectPhase } from "#app/phases/move-effect-phase.js";

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
   * Forces an enemy Pokemon to attack into a certain slot
   * @param pokemon Pokemon to force the attack of
   * @param slot BattlerIndex to force the attack into
   */
  forceAiTargets(pokemon: EnemyPokemon | undefined, slot: BattlerIndex | BattlerIndex[]) {
    vi.spyOn(pokemon!, "getNextTargets").mockReturnValue(Array.isArray(slot) ? slot : [slot]);
  }
}
