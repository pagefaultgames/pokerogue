import type { BattlerIndex } from "#enums/battler-index";
import { getMoveTargets } from "#app/data/moves/move-utils";
import type Pokemon from "#app/field/pokemon";
import { PokemonMove } from "#app/data/moves/pokemon-move";
import Overrides from "#app/overrides";
import type { CommandPhase } from "#app/phases/command-phase";
import type { EnemyCommandPhase } from "#app/phases/enemy-command-phase";
import { MoveEffectPhase } from "#app/phases/move-effect-phase";
import { Command } from "#enums/command";
import { MoveId } from "#enums/move-id";
import { UiMode } from "#enums/ui-mode";
import { getMovePosition } from "#test/testUtils/gameManagerUtils";
import { GameManagerHelper } from "#test/testUtils/helpers/gameManagerHelper";
import { vi } from "vitest";
import { coerceArray } from "#app/utils/common";
import { MoveUseMode } from "#enums/move-use-mode";

/**
 * Helper to handle a Pokemon's move
 */
export class MoveHelper extends GameManagerHelper {
  /**
   * Intercepts {@linkcode MoveEffectPhase} and mocks the phase's move's
   * accuracy to -1, guaranteeing a hit.
   * @returns A promise that resolves once the next MoveEffectPhase has been reached (not run).
   */
  public async forceHit(): Promise<void> {
    await this.game.phaseInterceptor.to(MoveEffectPhase, false);
    const moveEffectPhase = this.game.scene.phaseManager.getCurrentPhase() as MoveEffectPhase;
    vi.spyOn(moveEffectPhase.move, "calculateBattleAccuracy").mockReturnValue(-1);
  }

  /**
   * Intercepts {@linkcode MoveEffectPhase} and mocks the phase's move's accuracy
   * to 0, guaranteeing a miss.
   * @param firstTargetOnly - Whether to only force a miss on the first target hit; default `false`.
   * @returns A promise that resolves once the next MoveEffectPhase has been reached (not run).
   */
  public async forceMiss(firstTargetOnly = false): Promise<void> {
    await this.game.phaseInterceptor.to(MoveEffectPhase, false);
    const moveEffectPhase = this.game.scene.phaseManager.getCurrentPhase() as MoveEffectPhase;
    const accuracy = vi.spyOn(moveEffectPhase.move, "calculateBattleAccuracy");

    if (firstTargetOnly) {
      accuracy.mockReturnValueOnce(0);
    } else {
      accuracy.mockReturnValue(0);
    }
  }

  /**
   * Select the move to be used by the given Pokemon(-index). Triggers during the next {@linkcode CommandPhase}
   * @param move - the move to use
   * @param pkmIndex - the pokemon index. Relevant for double-battles only (defaults to 0)
   * @param targetIndex - The {@linkcode BattlerIndex} of the Pokemon to target for single-target moves, or `null` if a manual call to `selectTarget()` is required
   */
  public select(move: MoveId, pkmIndex: 0 | 1 = 0, targetIndex?: BattlerIndex | null) {
    const movePosition = getMovePosition(this.game.scene, pkmIndex, move);

    this.game.onNextPrompt("CommandPhase", UiMode.COMMAND, () => {
      this.game.scene.ui.setMode(
        UiMode.FIGHT,
        (this.game.scene.phaseManager.getCurrentPhase() as CommandPhase).getFieldIndex(),
      );
    });
    this.game.onNextPrompt("CommandPhase", UiMode.FIGHT, () => {
      (this.game.scene.phaseManager.getCurrentPhase() as CommandPhase).handleCommand(
        Command.FIGHT,
        movePosition,
        MoveUseMode.NORMAL,
      );
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
  public selectWithTera(move: MoveId, pkmIndex: 0 | 1 = 0, targetIndex?: BattlerIndex | null) {
    const movePosition = getMovePosition(this.game.scene, pkmIndex, move);
    this.game.scene.getPlayerParty()[pkmIndex].isTerastallized = false;

    this.game.onNextPrompt("CommandPhase", UiMode.COMMAND, () => {
      this.game.scene.ui.setMode(
        UiMode.FIGHT,
        (this.game.scene.phaseManager.getCurrentPhase() as CommandPhase).getFieldIndex(),
        Command.TERA,
      );
    });
    this.game.onNextPrompt("CommandPhase", UiMode.FIGHT, () => {
      (this.game.scene.phaseManager.getCurrentPhase() as CommandPhase).handleCommand(
        Command.TERA,
        movePosition,
        MoveUseMode.NORMAL,
      );
    });

    if (targetIndex !== null) {
      this.game.selectTarget(movePosition, targetIndex);
    }
  }

  /**
   * Modifies a player pokemon's moveset to contain only the selected move and then
   * selects it to be used during the next {@linkcode CommandPhase}.
   *
   * Warning: Will disable the player moveset override if it is enabled!
   *
   * Note: If you need to check for changes in the player's moveset as part of the test, it may be
   * best to use {@linkcode changeMoveset} and {@linkcode select} instead.
   * @param moveId - the move to use
   * @param pkmIndex - the pokemon index. Relevant for double-battles only (defaults to 0)
   * @param targetIndex - (optional) The {@linkcode BattlerIndex} of the Pokemon to target for single-target moves, or `null` if a manual call to `selectTarget()` is required
   * @param useTera - If `true`, the Pokemon also chooses to Terastallize. This does not require a Tera Orb. Default: `false`.
   */
  public use(moveId: MoveId, pkmIndex: 0 | 1 = 0, targetIndex?: BattlerIndex | null, useTera = false): void {
    if ([Overrides.MOVESET_OVERRIDE].flat().length > 0) {
      vi.spyOn(Overrides, "MOVESET_OVERRIDE", "get").mockReturnValue([]);
      console.warn("Warning: `use` overwrites the Pokemon's moveset and disables the player moveset override!");
    }

    const pokemon = this.game.scene.getPlayerField()[pkmIndex];
    pokemon.moveset = [new PokemonMove(moveId)];

    if (useTera) {
      this.selectWithTera(moveId, pkmIndex, targetIndex);
      return;
    }
    this.select(moveId, pkmIndex, targetIndex);
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
   * @param moveset - The {@linkcode MoveId} (single or array) to change the Pokemon's moveset to.
   */
  public changeMoveset(pokemon: Pokemon, moveset: MoveId | MoveId[]): void {
    moveset = coerceArray(moveset);
    pokemon.moveset = [];
    moveset.forEach(move => {
      pokemon.moveset.push(new PokemonMove(move));
    });
    const movesetStr = moveset.map(moveId => MoveId[moveId]).join(", ");
    console.log(`Pokemon ${pokemon.species.name}'s moveset manually set to ${movesetStr} (=[${moveset.join(", ")}])!`);
  }

  /**
   * Forces the next enemy selecting a move to use the given move _in its moveset_
   * against the given target (if applicable).
   * @param moveId - The {@linkcode Move | move ID} the enemy will be forced to use.
   * @param target - The {@linkcode BattlerIndex | target} against which the enemy will use the given move;
   * defaults to normal target selection priorities if omitted or not single-target.
   * @remarks
   * If you do not need to check for changes in the enemy's moveset as part of the test, it may be
   * best to use {@linkcode forceEnemyMove} instead.
   */
  public async selectEnemyMove(moveId: MoveId, target?: BattlerIndex) {
    // Wait for the next EnemyCommandPhase to start
    await this.game.phaseInterceptor.to("EnemyCommandPhase", false);
    const enemy =
      this.game.scene.getEnemyField()[
        (this.game.scene.phaseManager.getCurrentPhase() as EnemyCommandPhase).getFieldIndex()
      ];
    const legalTargets = getMoveTargets(enemy, moveId);

    vi.spyOn(enemy, "getNextMove").mockReturnValueOnce({
      move: moveId,
      targets:
        target !== undefined && !legalTargets.multiple && legalTargets.targets.includes(target)
          ? [target]
          : enemy.getNextTargets(moveId),
      useMode: MoveUseMode.NORMAL,
    });

    /**
     * Run the EnemyCommandPhase to completion.
     * This allows this function to be called consecutively to
     * force a move for each enemy in a double battle.
     */
    await this.game.phaseInterceptor.to("EnemyCommandPhase");
  }

  /**
   * Modify the moveset of the next enemy selecting a move to contain only the given move, and then
   * selects it to be used during the next {@linkcode EnemyCommandPhase} against the given targets.
   *
   * Does not require the given move to be in the enemy's moveset beforehand,
   * but **overwrites the pokemon's moveset** and **disables any prior moveset overrides**!
   *
   * @param moveId - The {@linkcode Move | move ID} the enemy will be forced to use.
   * @param target - The {@linkcode BattlerIndex | target} against which the enemy will use the given move;
   * defaults to normal target selection priorities if omitted or not single-target.
   * @remarks
   * If you need to check for changes in the enemy's moveset as part of the test, it may be
   * best to use {@linkcode changeMoveset} and {@linkcode selectEnemyMove} instead.
   */
  public async forceEnemyMove(moveId: MoveId, target?: BattlerIndex) {
    // Wait for the next EnemyCommandPhase to start
    await this.game.phaseInterceptor.to("EnemyCommandPhase", false);

    const enemy =
      this.game.scene.getEnemyField()[
        (this.game.scene.phaseManager.getCurrentPhase() as EnemyCommandPhase).getFieldIndex()
      ];

    if ([Overrides.OPP_MOVESET_OVERRIDE].flat().length > 0) {
      vi.spyOn(Overrides, "OPP_MOVESET_OVERRIDE", "get").mockReturnValue([]);
      console.warn(
        "Warning: `forceEnemyMove` overwrites the Pokemon's moveset and disables the enemy moveset override!",
      );
    }
    enemy.moveset = [new PokemonMove(moveId)];
    const legalTargets = getMoveTargets(enemy, moveId);

    vi.spyOn(enemy, "getNextMove").mockReturnValueOnce({
      move: moveId,
      targets:
        target !== undefined && !legalTargets.multiple && legalTargets.targets.includes(target)
          ? [target]
          : enemy.getNextTargets(moveId),
      useMode: MoveUseMode.NORMAL,
    });

    /**
     * Run the EnemyCommandPhase to completion.
     * This allows this function to be called consecutively to
     * force a move for each enemy in a double battle.
     */
    await this.game.phaseInterceptor.to("EnemyCommandPhase");
  }
}
