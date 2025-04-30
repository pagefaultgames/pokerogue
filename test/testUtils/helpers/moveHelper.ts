import type { BattlerIndex } from "#app/battle";
import type Pokemon from "#app/field/pokemon";
import { PokemonMove } from "#app/field/pokemon";
import Overrides from "#app/overrides";
import type { CommandPhase } from "#app/phases/command-phase";
import { MoveEffectPhase } from "#app/phases/move-effect-phase";
import { Command } from "#app/ui/command-ui-handler";
import { UiMode } from "#enums/ui-mode";
import { Moves } from "#enums/moves";
import { getMovePosition } from "#test/testUtils/gameManagerUtils";
import { GameManagerHelper } from "#test/testUtils/helpers/gameManagerHelper";
import { vi } from "vitest";

/**
 * Helper to help with move-related operations.
 */
export class MoveHelper extends GameManagerHelper {
  /**
   * Intercepts {@linkcode MoveEffectPhase} and mocks the phase's move's
   * accuracy to -1, guaranteeing a hit.
   */
  public async forceHit(): Promise<void> {
    await this.game.phaseInterceptor.to(MoveEffectPhase, false);
    const moveEffectPhase = this.game.scene.getCurrentPhase() as MoveEffectPhase;
    vi.spyOn(moveEffectPhase.move, "calculateBattleAccuracy").mockReturnValue(-1);
  }

  /**
   * Intercepts {@linkcode MoveEffectPhase} and mocks the phase's move's accuracy
   * to 0, guaranteeing a miss.
   * @param firstTargetOnly - Whether the move should force miss on the first target only, in the case of multi-target moves.
   */
  public async forceMiss(firstTargetOnly = false): Promise<void> {
    await this.game.phaseInterceptor.to(MoveEffectPhase, false);
    const moveEffectPhase = this.game.scene.getCurrentPhase() as MoveEffectPhase;
    const accuracy = vi.spyOn(moveEffectPhase.move, "calculateBattleAccuracy");

    if (firstTargetOnly) {
      accuracy.mockReturnValueOnce(0);
    } else {
      accuracy.mockReturnValue(0);
    }
  }

  /**
   * Select the move to be used by the given Pokemon(-index) to use during the next {@linkcode CommandPhase}.
   * The moveslot selected will be the first one containing the given move and not out of PP.
   * @param move - the move to use
   * @param pkmIndex - the pokemon index. Relevant for double-battles only (defaults to 0)
   * @param targetIndex - The {@linkcode BattlerIndex} of the Pokemon to target for single-target moves, or `null` if a manual call to `selectTarget()` is required
   */
  public select(move: Moves, pkmIndex: 0 | 1 = 0, targetIndex?: BattlerIndex | null) {
    const movePosition = getMovePosition(this.game.scene, pkmIndex, move);

    this.game.onNextPrompt("CommandPhase", UiMode.COMMAND, () => {
      this.game.scene.ui.setMode(UiMode.FIGHT, (this.game.scene.getCurrentPhase() as CommandPhase).getFieldIndex());
    });
    this.game.onNextPrompt("CommandPhase", UiMode.FIGHT, () => {
      (this.game.scene.getCurrentPhase() as CommandPhase).handleCommand(Command.FIGHT, movePosition, false);
    });

    if (targetIndex !== null) {
      this.game.selectTarget(movePosition, targetIndex);
    }
  }

  /**
   * Select the move to be used by the given Pokemon(-index), **which will also terastallize on this turn**.
   * Triggers during the next {@linkcode CommandPhase}
   * @param move - the move to use
   * @param pkmIndex - the pokemon index. Relevant for double-battles only (defaults to 0)
   * @param targetIndex - The {@linkcode BattlerIndex} of the Pokemon to target for single-target moves, or `null` if a manual call to `selectTarget()` is required
   */
  public selectWithTera(move: Moves, pkmIndex: 0 | 1 = 0, targetIndex?: BattlerIndex | null) {
    const movePosition = getMovePosition(this.game.scene, pkmIndex, move);
    this.game.scene.getPlayerParty()[pkmIndex].isTerastallized = false;

    this.game.onNextPrompt("CommandPhase", UiMode.COMMAND, () => {
      this.game.scene.ui.setMode(
        UiMode.FIGHT,
        (this.game.scene.getCurrentPhase() as CommandPhase).getFieldIndex(),
        Command.TERA,
      );
    });
    this.game.onNextPrompt("CommandPhase", UiMode.FIGHT, () => {
      (this.game.scene.getCurrentPhase() as CommandPhase).handleCommand(Command.TERA, movePosition, false);
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
   * Forces the Confusion status to activate on the next move by temporarily mocking {@linkcode Overrides.CONFUSION_ACTIVATION_OVERRIDE},
   * advancing to the next `MovePhase`, and then resetting the override to `null`
   * @param activated - `true` to force the Pokemon to hit themself, `false` to forcibly disable it
   */
  public async forceConfusionActivation(activated: boolean): Promise<void> {
    vi.spyOn(Overrides, "CONFUSION_ACTIVATION_OVERRIDE", "get").mockReturnValue(activated);
    await this.game.phaseInterceptor.to("MovePhase");
    vi.spyOn(Overrides, "CONFUSION_ACTIVATION_OVERRIDE", "get").mockReturnValue(null);
  }

  /**
   * Changes a pokemon's moveset to the given move(s).
   * Used when the normal moveset override can't be used (such as when it's necessary to check or update properties of the moveset).
   * @param pokemon - The {@linkcode Pokemon} being modified
   * @param moveset - The {@linkcode Moves} (single or array) to change the Pokemon's moveset to
   */
  public changeMoveset(pokemon: Pokemon, moveset: Moves | Moves[]): void {
    if (!Array.isArray(moveset)) {
      moveset = [moveset];
    }
    pokemon.moveset = [];
    moveset.forEach(move => {
      pokemon.moveset.push(new PokemonMove(move));
    });
    const movesetStr = moveset.map(moveId => Moves[moveId]).join(", ");
    console.log(`Pokemon ${pokemon.species.name}'s moveset manually set to ${movesetStr} (=[${moveset.join(", ")}])!`);
  }
}
