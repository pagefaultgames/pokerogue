import { allMoves } from "#data/data-lists";
import { AbilityId } from "#enums/ability-id";
import { BattlerIndex } from "#enums/battler-index";
import { MoveId } from "#enums/move-id";
import { PokeballType } from "#enums/pokeball";
import { SpeciesId } from "#enums/species-id";
import { GameManager } from "#test/test-utils/game-manager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it, type MockInstance, vi } from "vitest";

describe("Move - Payback", () => {
  let phaserGame: Phaser.Game;
  let game: GameManager;
  let powerSpy: MockInstance;

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
      .ability(AbilityId.BALL_FETCH)
      .battleStyle("single")
      .criticalHits(false)
      .enemyLevel(100)
      .enemySpecies(SpeciesId.DRACOVISH)
      .enemyAbility(AbilityId.BALL_FETCH)
      .enemyMoveset(MoveId.SPLASH)
      .startingModifier([{ name: "POKEBALL", count: 5 }]);

    powerSpy = vi.spyOn(allMoves[MoveId.PAYBACK], "calculateBattlePower");
  });

  it("should double power if the user moves after the target", async () => {
    await game.classicMode.startBattle([SpeciesId.FEEBAS]);

    // turn 1: enemy, then player (boost)
    game.move.use(MoveId.PAYBACK);
    await game.setTurnOrder([BattlerIndex.ENEMY, BattlerIndex.PLAYER]);
    await game.toNextTurn();

    expect(powerSpy).toHaveLastReturnedWith(allMoves[MoveId.PAYBACK].power * 2);

    // turn 2: player, then enemy (no boost)
    game.move.use(MoveId.PAYBACK);
    await game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.ENEMY]);
    await game.toEndOfTurn();

    expect(powerSpy).toHaveLastReturnedWith(allMoves[MoveId.PAYBACK].power);
  });

  // TODO: Enable test once ability to force catch failure is added
  it.todo("should trigger for enemies on player failed ball catch", async () => {
    await game.classicMode.startBattle([SpeciesId.FEEBAS]);

    game.doThrowPokeball(PokeballType.POKEBALL);
    await game.move.forceEnemyMove(MoveId.PAYBACK);
    await game.toEndOfTurn();

    expect(powerSpy).toHaveLastReturnedWith(allMoves[MoveId.PAYBACK].power * 2);
  });
});
