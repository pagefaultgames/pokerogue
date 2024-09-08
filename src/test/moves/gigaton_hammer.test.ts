import { BattlerIndex } from "#app/battle.js";
import GameManager from "#app/test/utils/gameManager";
import { Moves } from "#enums/moves";
import { Species } from "#enums/species";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { SPLASH_ONLY } from "../utils/testUtils";

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
      .battleType("single")
      .enemySpecies(Species.MAGIKARP)
      .starterSpecies(Species.FEEBAS)
      .moveset([Moves.GIGATON_HAMMER])
      .startingLevel(10)
      .enemyLevel(100)
      .enemyMoveset(SPLASH_ONLY)
      .disableCrits();
  });

  it("can't be used two turns in a row", async() => {
    await game.classicMode.startBattle();

    const enemy1 = game.scene.getEnemyPokemon()!;

    game.move.select(Moves.GIGATON_HAMMER);
    await game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.ENEMY]);
    await game.phaseInterceptor.to("MoveEndPhase");

    expect(enemy1.hp).toBeLessThan(enemy1.getMaxHp());

    await game.doKillOpponents();
    await game.toNextWave();

    game.move.select(Moves.GIGATON_HAMMER);
    await game.toNextTurn();

    const enemy2 = game.scene.getEnemyPokemon()!;

    expect(enemy2.hp).toBe(enemy2.getMaxHp());
  }, 20000);

  it("can be used again if recalled and sent back out", async() => {
    game.override.startingWave(4);
    await game.classicMode.startBattle();

    const enemy1 = game.scene.getEnemyPokemon()!;

    game.move.select(Moves.GIGATON_HAMMER);
    await game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.ENEMY]);
    await game.phaseInterceptor.to("MoveEndPhase");

    expect(enemy1.hp).toBeLessThan(enemy1.getMaxHp());

    await game.doKillOpponents();
    await game.toNextWave();

    game.move.select(Moves.GIGATON_HAMMER);
    await game.toNextTurn();

    const enemy2 = game.scene.getEnemyPokemon()!;

    expect(enemy2.hp).toBeLessThan(enemy2.getMaxHp());
  }, 20000);
});
