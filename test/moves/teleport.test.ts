import { AbilityId } from "#enums/ability-id";
import { BattlerIndex } from "#enums/battler-index";
import { MoveId } from "#enums/move-id";
import { MoveResult } from "#enums/move-result";
import { SpeciesId } from "#enums/species-id";
import { GameManager } from "#test/test-utils/game-manager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";

describe("Move - Teleport", () => {
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
      .ability(AbilityId.BALL_FETCH)
      .battleStyle("single")
      .criticalHits(false)
      .moveset(MoveId.SPLASH)
      .enemySpecies(SpeciesId.MAGIKARP)
      .enemyAbility(AbilityId.BALL_FETCH)
      .enemyMoveset([MoveId.SPLASH, MoveId.TELEPORT, MoveId.MEMENTO])
      .startingLevel(100)
      .enemyLevel(100);
  });

  describe("used by a wild pokemon", () => {
    it("should fail in a double battle", async () => {
      game.override.battleStyle("double");
      await game.classicMode.startBattle([SpeciesId.FEEBAS, SpeciesId.FEEBAS]);

      const [enemy1, enemy2] = game.scene.getEnemyField();

      game.move.select(MoveId.SPLASH);
      game.move.select(MoveId.SPLASH, 1);
      await game.move.selectEnemyMove(MoveId.TELEPORT);
      await game.move.selectEnemyMove(MoveId.MEMENTO, 1);
      await game.toEndOfTurn();
      expect(enemy1.getLastXMoves()[0].result).toBe(MoveResult.FAIL);
      expect(enemy2.isOnField()).toBe(false);

      // Fail teleport even if the other enemy faints
      game.move.select(MoveId.SPLASH);
      game.move.select(MoveId.SPLASH, 1);
      await game.move.selectEnemyMove(MoveId.TELEPORT);
      await game.toEndOfTurn();
      expect(enemy1.getLastXMoves()[0].result, "should fail even if last remaining pokemon").toBe(MoveResult.FAIL);
    });

    it("should fail if used by a wild pokemon under a trapping effect", async () => {
      await game.classicMode.startBattle([SpeciesId.FEEBAS]);

      const enemy = game.field.getEnemyPokemon();

      game.move.use(MoveId.FAIRY_LOCK);

      await game.move.selectEnemyMove(MoveId.TELEPORT);
      await game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.ENEMY]);
      await game.toEndOfTurn();
      expect(enemy.getLastXMoves()[0].result, "should fail while trapped").toBe(MoveResult.FAIL);
    });
  });

  it("should succeed if used by a trapped wild pokemon that is ghost type", async () => {
    game.override.enemySpecies(SpeciesId.GASTLY);
    await game.classicMode.startBattle([SpeciesId.FEEBAS]);

    const enemy = game.field.getEnemyPokemon();

    game.move.use(MoveId.FAIRY_LOCK);

    await game.move.selectEnemyMove(MoveId.TELEPORT);
    await game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.ENEMY]);
    await game.phaseInterceptor.to("BerryPhase", false);
    expect(enemy.isOnField(), "should not be on the field").toBe(false);
  });

  it("should succeed if used by a trapped wild pokemon that has run away", async () => {
    game.override.enemyAbility(AbilityId.RUN_AWAY);
    await game.classicMode.startBattle([SpeciesId.FEEBAS]);

    const enemy = game.field.getEnemyPokemon();

    game.move.use(MoveId.FAIRY_LOCK);

    await game.move.selectEnemyMove(MoveId.TELEPORT);
    await game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.ENEMY]);
    await game.phaseInterceptor.to("BerryPhase", false);
    expect(enemy.isOnField(), "should not be on the field").toBe(false);
  });
});
