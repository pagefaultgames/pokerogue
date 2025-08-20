import { BattlerIndex } from "#enums/battler-index";
import { MoveId } from "#enums/move-id";
import { SpeciesId } from "#enums/species-id";
import { GameManager } from "#test/test-utils/game-manager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";

describe("Moves - Gigaton Hammer", () => {
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
      .battleStyle("single")
      .enemySpecies(SpeciesId.MAGIKARP)
      .starterSpecies(SpeciesId.FEEBAS)
      .moveset([MoveId.GIGATON_HAMMER])
      .startingLevel(10)
      .enemyLevel(100)
      .enemyMoveset(MoveId.SPLASH)
      .criticalHits(false);
  });

  it("can't be used two turns in a row", async () => {
    await game.classicMode.startBattle();

    const enemy1 = game.field.getEnemyPokemon();

    game.move.select(MoveId.GIGATON_HAMMER);
    await game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.ENEMY]);
    await game.phaseInterceptor.to("MoveEndPhase");

    expect(enemy1.hp).toBeLessThan(enemy1.getMaxHp());

    await game.doKillOpponents();
    await game.toNextWave();

    game.move.select(MoveId.GIGATON_HAMMER);
    await game.toNextTurn();

    const enemy2 = game.field.getEnemyPokemon();

    expect(enemy2.hp).toBe(enemy2.getMaxHp());
  });

  it("can be used again if recalled and sent back out", async () => {
    game.override.startingWave(4);
    await game.classicMode.startBattle();

    const enemy1 = game.field.getEnemyPokemon();

    game.move.select(MoveId.GIGATON_HAMMER);
    await game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.ENEMY]);
    await game.phaseInterceptor.to("MoveEndPhase");

    expect(enemy1.hp).toBeLessThan(enemy1.getMaxHp());

    await game.doKillOpponents();
    await game.toNextWave();

    game.move.select(MoveId.GIGATON_HAMMER);
    await game.toNextTurn();

    const enemy2 = game.field.getEnemyPokemon();

    expect(enemy2.hp).toBeLessThan(enemy2.getMaxHp());
  });
});
