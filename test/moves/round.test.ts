import { allMoves } from "#data/data-lists";
import { AbilityId } from "#enums/ability-id";
import { BattlerIndex } from "#enums/battler-index";
import { MoveId } from "#enums/move-id";
import { SpeciesId } from "#enums/species-id";
import type { MoveEffectPhase } from "#phases/move-effect-phase";
import { GameManager } from "#test/test-utils/game-manager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

describe("Moves - Round", () => {
  let phaserGame: Phaser.Game;
  let game: GameManager;

  beforeAll(() => {
    phaserGame = new Phaser.Game({
      type: Phaser.HEADLESS,
    });
  });

  afterEach(() => {
    game.phaseInterceptor.restoreOg();
  });

  beforeEach(() => {
    game = new GameManager(phaserGame);
    game.override
      .moveset([MoveId.SPLASH, MoveId.ROUND])
      .ability(AbilityId.BALL_FETCH)
      .battleStyle("double")
      .criticalHits(false)
      .enemySpecies(SpeciesId.MAGIKARP)
      .enemyAbility(AbilityId.BALL_FETCH)
      .enemyMoveset([MoveId.SPLASH, MoveId.ROUND])
      .startingLevel(100)
      .enemyLevel(100);
  });

  it("should cue other instances of Round together in Speed order", async () => {
    await game.classicMode.startBattle([SpeciesId.MAGIKARP, SpeciesId.FEEBAS]);

    const round = allMoves[MoveId.ROUND];
    const spy = vi.spyOn(round, "calculateBattlePower");

    game.move.select(MoveId.ROUND, 0, BattlerIndex.ENEMY);
    game.move.select(MoveId.ROUND, 1, BattlerIndex.ENEMY_2);

    await game.move.selectEnemyMove(MoveId.ROUND, BattlerIndex.PLAYER);
    await game.move.selectEnemyMove(MoveId.SPLASH);

    await game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.ENEMY_2, BattlerIndex.PLAYER_2, BattlerIndex.ENEMY]);

    const actualTurnOrder: BattlerIndex[] = [];

    for (let i = 0; i < 4; i++) {
      await game.phaseInterceptor.to("MoveEffectPhase", false);
      actualTurnOrder.push(
        (game.scene.phaseManager.getCurrentPhase() as MoveEffectPhase).getUserPokemon()!.getBattlerIndex(),
      );
      await game.phaseInterceptor.to("MoveEndPhase");
    }

    expect(actualTurnOrder).toEqual([
      BattlerIndex.PLAYER,
      BattlerIndex.PLAYER_2,
      BattlerIndex.ENEMY,
      BattlerIndex.ENEMY_2,
    ]);
    const powerResults = spy.mock.results.map(result => result.value);
    expect(powerResults).toEqual([60, 120, 120]);
  });
});
