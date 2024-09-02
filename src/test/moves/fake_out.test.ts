import GameManager from "#app/test/utils/gameManager";
import { Moves } from "#enums/moves";
import { Species } from "#enums/species";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { SPLASH_ONLY } from "../utils/testUtils";

describe("Moves - Fake Out", () => {
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
      .enemySpecies(Species.CORVIKNIGHT)
      .starterSpecies(Species.FEEBAS)
      .moveset([Moves.FAKE_OUT, Moves.SPLASH])
      .enemyMoveset(SPLASH_ONLY)
      .disableCrits();
  });

  it("can only be used on the first turn a pokemon is sent out", async() => {
    await game.classicMode.startBattle();

    const enemy = game.scene.getEnemyPokemon()!;

    game.move.select(Moves.FAKE_OUT);
    await game.toNextTurn();

    expect(enemy.hp).toBeLessThan(enemy.getMaxHp());
    const postTurnOneHp = enemy.hp;

    game.move.select(Moves.FAKE_OUT);
    await game.toNextTurn();

    expect(enemy.hp).toBe(postTurnOneHp);

    game.move.select(Moves.SPLASH);
    await game.doKillOpponents();
    await game.toNextWave();

    const newEnemy = game.scene.getEnemyPokemon()!;

    game.move.select(Moves.FAKE_OUT);
    await game.toNextTurn();

    expect(newEnemy.hp).toBe(newEnemy.getMaxHp());
  }, 20000);

  it("can be used again if recalled and sent back out", async() => {
    game.override.startingWave(4);
    await game.classicMode.startBattle();

    const enemy1 = game.scene.getEnemyPokemon()!;

    game.move.select(Moves.FAKE_OUT);
    await game.phaseInterceptor.to("MoveEndPhase");

    expect(enemy1.hp).toBeLessThan(enemy1.getMaxHp());

    await game.doKillOpponents();
    await game.toNextWave();

    game.move.select(Moves.FAKE_OUT);
    await game.toNextTurn();

    const enemy2 = game.scene.getEnemyPokemon()!;

    expect(enemy2.hp).toBeLessThan(enemy2.getMaxHp());
  }, 20000);
});
