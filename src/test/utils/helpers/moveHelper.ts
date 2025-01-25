import type { BattlerIndex } from "#app/battle";
import { Button } from "#app/enums/buttons";
import type Pokemon from "#app/field/pokemon";
import { PokemonMove } from "#app/field/pokemon";
import Overrides from "#app/overrides";
import type { CommandPhase } from "#app/phases/command-phase";
import { LearnMovePhase } from "#app/phases/learn-move-phase";
import { MoveEffectPhase } from "#app/phases/move-effect-phase";
import { Command } from "#app/ui/command-ui-handler";
import { Mode } from "#app/ui/ui";
import { Moves } from "#enums/moves";
import { getMovePosition } from "#test/utils/gameManagerUtils";
import { GameManagerHelper } from "#test/utils/helpers/gameManagerHelper";
import { vi } from "vitest";

/**
 * Helper to handle a Pokemon's move
 */
export class MoveHelper extends GameManagerHelper {
  /**
   * Intercepts {@linkcode MoveEffectPhase} and mocks the
   * {@linkcode MoveEffectPhase.hitCheck | hitCheck}'s return value to `true`.
   * Used to force a move to hit.
   */
  public async forceHit(): Promise<void> {
    await this.game.phaseInterceptor.to(MoveEffectPhase, false);
    vi.spyOn(this.game.scene.getCurrentPhase() as MoveEffectPhase, "hitCheck").mockReturnValue(true);
  }

  /**
   * Intercepts {@linkcode MoveEffectPhase} and mocks the
   * {@linkcode MoveEffectPhase.hitCheck | hitCheck}'s return value to `false`.
   * Used to force a move to miss.
   * @param firstTargetOnly - Whether the move should force miss on the first target only, in the case of multi-target moves.
   */
  public async forceMiss(firstTargetOnly: boolean = false): Promise<void> {
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
   * @param move - the move to use
   * @param pkmIndex - the pokemon index. Relevant for double-battles only (defaults to 0)
   * @param targetIndex - The {@linkcode BattlerIndex} of the Pokemon to target for single-target moves, or `null` if a manual call to `selectTarget()` is required
   */
  public select(move: Moves, pkmIndex: 0 | 1 = 0, targetIndex?: BattlerIndex | null) {
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

  /**
   * Forces the Paralysis or Freeze status to activate on the next move by temporarily mocking {@linkcode Overrides.STATUS_ACTIVATION_OVERRIDE},
   * advancing to the next `MovePhase`, and then resetting the override to `null`
   * @param activated - `true` to force the status to activate, `false` to force the status to not activate (will cause Freeze to heal)
   */
  public async forceStatusActivation(activated: boolean): Promise<void> {
    vi.spyOn(Overrides, "STATUS_ACTIVATION_OVERRIDE", "get").mockReturnValue(activated);
    await this.game.phaseInterceptor.to("MovePhase");
    vi.spyOn(Overrides, "STATUS_ACTIVATION_OVERRIDE", "get").mockReturnValue(null);
  }

  /**
   * Changes a pokemon's moveset to the given move(s).
   * Used when the normal moveset override can't be used (such as when it's necessary to check or update properties of the moveset).
   * @param pokemon - The {@linkcode Pokemon} being modified
   * @param moveset - The {@linkcode Moves} (single or array) to change the Pokemon's moveset to
   */
  public changeMoveset(pokemon: Pokemon, moveset: Moves | Moves[]): void {
    if (!Array.isArray(moveset)) {
      moveset = [ moveset ];
    }
    pokemon.moveset = [];
    moveset.forEach((move) => {
      pokemon.moveset.push(new PokemonMove(move));
    });
    const movesetStr = moveset.map((moveId) => Moves[moveId]).join(", ");
    console.log(`Pokemon ${pokemon.species.name}'s moveset manually set to ${movesetStr} (=[${moveset.join(", ")}])!`);
  }

  /**
  * Simulates learning a move for a player pokemon.
  * @param move The {@linkcode Moves} being learnt
  * @param partyIndex The party position of the {@linkcode PlayerPokemon} learning the move (defaults to 0)
  * @param moveSlotIndex The INDEX (0-4) of the move slot to replace if existent move slots are full;
  * defaults to 0 (first slot) and 4 aborts the procedure
  * @returns a promise that resolves once the move has been successfully learnt
 */
  public async learnMove(move: Moves | integer, partyIndex: integer = 0, moveSlotIndex: integer = 0) {
    return new Promise<void>(async (resolve, reject) => {
      this.game.scene.pushPhase(new LearnMovePhase(partyIndex, move));

      // if slots are full, queue up inputs to replace existing moves
      if (this.game.scene.getPlayerParty()[partyIndex].moveset.filter(m => m).length === 4) {
        this.game.onNextPrompt("LearnMovePhase", Mode.CONFIRM, () => {
          this.game.scene.ui.processInput(Button.ACTION); // "Should a move be forgotten and replaced with XXX?"
        });
        this.game.onNextPrompt("LearnMovePhase", Mode.SUMMARY, () => {
          for (let x = 0; x < (moveSlotIndex ?? 0); x++) {
            this.game.scene.ui.processInput(Button.DOWN); // Scrolling in summary pane to move position
          }
          this.game.scene.ui.processInput(Button.ACTION);
          if (moveSlotIndex === 4) {
            this.game.onNextPrompt("LearnMovePhase", Mode.CONFIRM, () => {
              this.game.scene.ui.processInput(Button.ACTION); // "Give up on learning XXX?"
            });
          }
        });
      }

      await this.game.phaseInterceptor.to(LearnMovePhase).catch(e => reject(e));
      resolve();
    });
  }

}
