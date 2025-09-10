import Overrides from "#app/overrides";
import { allMoves } from "#data/data-lists";
import { BattlerIndex } from "#enums/battler-index";
import { Command } from "#enums/command";
import { MoveId } from "#enums/move-id";
import { MoveUseMode } from "#enums/move-use-mode";
import { UiMode } from "#enums/ui-mode";
import type { Pokemon } from "#field/pokemon";
import { getMoveTargets } from "#moves/move-utils";
import { PokemonMove } from "#moves/pokemon-move";
import type { CommandPhase } from "#phases/command-phase";
import type { EnemyCommandPhase } from "#phases/enemy-command-phase";
import { MoveEffectPhase } from "#phases/move-effect-phase";
import { GameManagerHelper } from "#test/test-utils/helpers/game-manager-helper";
import { coerceArray } from "#utils/common";
import { toTitleCase } from "#utils/strings";
import type { MockInstance } from "vitest";
import { expect, vi } from "vitest";

/**
 * Helper to handle using a Pokemon's moves.
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
   * Select a move _already in the player's moveset_ to be used during the next {@linkcode CommandPhase}.
   * @param move - The {@linkcode MoveId} to use.
   * @param pkmIndex - The {@linkcode BattlerIndex} of the player Pokemon using the move. Relevant for double battles only and defaults to {@linkcode BattlerIndex.PLAYER} if not specified.
   * @param targetIndex - The {@linkcode BattlerIndex} of the Pokemon to target for single-target moves; should be omitted for multi-target moves.
   * If set to `null`, will forgo normal target selection entirely (useful for UI tests).
   * @remarks
   * Will fail the current test if the move being selected is not in the user's moveset.
   */
  public select(
    move: MoveId,
    pkmIndex: BattlerIndex.PLAYER | BattlerIndex.PLAYER_2 = BattlerIndex.PLAYER,
    targetIndex?: BattlerIndex | null,
  ) {
    const movePosition = this.getMovePosition(pkmIndex, move);
    if (movePosition === -1) {
      expect.fail(
        // biome-ignore lint/complexity/noUselessStringConcat: Biome does not currently detect this as multiline (BUG)
        `MoveHelper.select called with move '${toTitleCase(MoveId[move])}' not in moveset!`
          + `\nBattler Index: ${toTitleCase(BattlerIndex[pkmIndex])}`
          + `\nMoveset: [${this.game.scene
            .getPlayerParty()
            [pkmIndex].getMoveset()
            .map(pm => toTitleCase(MoveId[pm.moveId]))
            .join(", ")}]`,
      );
    }

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
   * Select a move _already in the player's moveset_ to be used during the next {@linkcode CommandPhase}, **which will also terastallize on this turn**.
   * @param move - The {@linkcode MoveId} to use.
   * @param pkmIndex - The {@linkcode BattlerIndex} of the player Pokemon using the move. Relevant for double battles only and defaults to {@linkcode BattlerIndex.PLAYER} if not specified.
   * @param targetIndex - The {@linkcode BattlerIndex} of the Pokemon to target for single-target moves; should be omitted for multi-target moves.
   * If set to `null`, will forgo normal target selection entirely (useful for UI tests)
   */
  public selectWithTera(
    move: MoveId,
    pkmIndex: BattlerIndex.PLAYER | BattlerIndex.PLAYER_2 = BattlerIndex.PLAYER,
    targetIndex?: BattlerIndex | null,
  ) {
    const movePosition = this.getMovePosition(pkmIndex, move);
    if (movePosition === -1) {
      expect.fail(
        // biome-ignore lint/complexity/noUselessStringConcat: Biome does not currently detect this as multiline (BUG)
        `MoveHelper.selectWithTera called with move '${toTitleCase(MoveId[move])}' not in moveset!`
          + `\nBattler Index: ${toTitleCase(BattlerIndex[pkmIndex])}`
          + `\nMoveset: [${this.game.scene
            .getPlayerParty()
            [pkmIndex].getMoveset()
            .map(pm => toTitleCase(MoveId[pm.moveId]))
            .join(", ")}]`,
      );
    }

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

  /** Helper function to get the index of the selected move in the selected party member's moveset. */
  private getMovePosition(pokemonIndex: BattlerIndex.PLAYER | BattlerIndex.PLAYER_2, move: MoveId): number {
    const playerPokemon = this.game.scene.getPlayerField()[pokemonIndex];
    const moveset = playerPokemon.getMoveset();
    const index = moveset.findIndex(m => m.moveId === move && m.ppUsed < m.getMovePp());
    console.log(`Move position for ${MoveId[move]} (=${move}):`, index);
    return index;
  }

  /**
   * Modifies a player pokemon's moveset to contain only the selected move, and then
   * selects it to be used during the next {@linkcode CommandPhase}.
   *
   * **Warning**: Will disable the player moveset override if it is enabled, as well as any mid-battle moveset changes!
   *
   * @param moveId - The {@linkcode MoveId} to use
   * @param pkmIndex - The {@linkcode BattlerIndex} of the player Pokemon using the move. Relevant for double battles only and defaults to {@linkcode BattlerIndex.PLAYER} if not specified
   * @param targetIndex - The {@linkcode BattlerIndex} of the Pokemon to target for single-target moves; should be omitted for multi-target moves
   * @param useTera - If `true`, the Pokemon will attempt to Terastallize even without a Tera Orb; default `false`
   * @remarks
   * If you need to check for changes in the player's moveset as part of the test, it may be
   * better to use {@linkcode changeMoveset} and {@linkcode select} instead.
   */
  public use(
    moveId: MoveId,
    pkmIndex: BattlerIndex.PLAYER | BattlerIndex.PLAYER_2 = BattlerIndex.PLAYER,
    targetIndex?: BattlerIndex,
    useTera = false,
  ): void {
    if ([Overrides.MOVESET_OVERRIDE].flat().length > 0) {
      vi.spyOn(Overrides, "MOVESET_OVERRIDE", "get").mockReturnValue([]);
      console.warn("Warning: `MoveHelper.use` overwriting player pokemon moveset and disabling moveset override!");
    }

    // Clear out both the normal and temporary movesets before setting the move.
    const pokemon = this.game.scene.getPlayerField()[pkmIndex];
    pokemon.moveset.splice(0);
    pokemon.summonData.moveset?.splice(0);
    pokemon.setMove(0, moveId);

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
   *
   * Useful when normal moveset overrides can't be used (such as when it's necessary to check or update properties of the moveset).
   *
   * **Note**: Will disable the moveset override matching the pokemon's party.
   * @param pokemon - The {@linkcode Pokemon} being modified
   * @param moveset - The {@linkcode MoveId} (single or array) to change the Pokemon's moveset to.
   */
  public changeMoveset(pokemon: Pokemon, moveset: MoveId | MoveId[]): void {
    if (pokemon.isPlayer()) {
      if (coerceArray(Overrides.MOVESET_OVERRIDE).length > 0) {
        vi.spyOn(Overrides, "MOVESET_OVERRIDE", "get").mockReturnValue([]);
        console.warn("Player moveset override disabled due to use of `game.move.changeMoveset`!");
      }
    } else if (coerceArray(Overrides.ENEMY_MOVESET_OVERRIDE).length > 0) {
      vi.spyOn(Overrides, "ENEMY_MOVESET_OVERRIDE", "get").mockReturnValue([]);
      console.warn("Enemy moveset override disabled due to use of `game.move.changeMoveset`!");
    }
    moveset = coerceArray(moveset);
    expect(moveset.length, "Cannot assign more than 4 moves to a moveset!").toBeLessThanOrEqual(4);
    pokemon.moveset = [];
    moveset.forEach((move, i) => {
      pokemon.setMove(i, move);
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

    if ([Overrides.ENEMY_MOVESET_OVERRIDE].flat().length > 0) {
      vi.spyOn(Overrides, "ENEMY_MOVESET_OVERRIDE", "get").mockReturnValue([]);
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

  /**
   * Force the next move(s) used by Metronome to be a specific move. \
   * Triggers during the next upcoming {@linkcode MoveEffectPhase} that Metronome is used.
   * @param move - The move to force Metronome to call
   * @param once - If `true`, mocks the return value exactly once; default `false`
   * @returns The spy that for Metronome that was mocked (Usually unneeded).
   * @example
   * ```ts
   * game.move.use(MoveId.METRONOME);
   * game.move.forceMetronomeMove(MoveId.FUTURE_SIGHT); // Can be in any order
   * ```
   */
  public forceMetronomeMove(move: MoveId, once = false): MockInstance {
    const spy = vi.spyOn(allMoves[MoveId.METRONOME].getAttrs("RandomMoveAttr")[0], "getMoveOverride");
    if (once) {
      spy.mockReturnValueOnce(move);
    } else {
      spy.mockReturnValue(move);
    }
    return spy;
  }
}
