import { BattlerIndex } from "#app/battle";
import { allMoves } from "#app/data/moves/move";
import type { MoveEffectPhase } from "#app/phases/move-effect-phase";
import { Abilities } from "#enums/abilities";
import { Moves } from "#enums/moves";
import { Species } from "#enums/species";
import GameManager from "#test/testUtils/gameManager";
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
      .moveset([Moves.SPLASH, Moves.ROUND])
      .ability(Abilities.BALL_FETCH)
      .battleStyle("double")
      .disableCrits()
      .enemySpecies(Species.MAGIKARP)
      .enemyAbility(Abilities.BALL_FETCH)
      .enemyMoveset([Moves.SPLASH, Moves.ROUND])
      .startingLevel(100)
      .enemyLevel(100);
  });

  it("should cue other instances of Round together in Speed order", async () => {
    await game.classicMode.startBattle([Species.MAGIKARP, Species.FEEBAS]);

    const round = allMoves[Moves.ROUND];
    const spy = vi.spyOn(round, "calculateBattlePower");

    game.move.select(Moves.ROUND, 0, BattlerIndex.ENEMY);
    game.move.select(Moves.ROUND, 1, BattlerIndex.ENEMY_2);

    await game.forceEnemyMove(Moves.ROUND, BattlerIndex.PLAYER);
    await game.forceEnemyMove(Moves.SPLASH);

    await game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.ENEMY_2, BattlerIndex.PLAYER_2, BattlerIndex.ENEMY]);

    const actualTurnOrder: BattlerIndex[] = [];

    for (let i = 0; i < 4; i++) {
      await game.phaseInterceptor.to("MoveEffectPhase", false);
      actualTurnOrder.push((game.scene.getCurrentPhase() as MoveEffectPhase).getUserPokemon()!.getBattlerIndex());
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
