import GameManager from "#test/testUtils/gameManager";
import { Moves } from "#enums/moves";
import { Species } from "#enums/species";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";

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
      .battleStyle("single")
      .enemySpecies(Species.CORVIKNIGHT)
      .moveset([Moves.FAKE_OUT, Moves.SPLASH])
      .enemyMoveset(Moves.SPLASH)
      .enemyLevel(10)
      .startingLevel(1) // prevent LevelUpPhase from happening
      .disableCrits();
  });

  it("should only work the first turn a pokemon is sent out in a battle", async () => {
    await game.classicMode.startBattle([Species.FEEBAS]);

    const corv = game.scene.getEnemyPokemon()!;

    game.move.select(Moves.FAKE_OUT);
    await game.toNextTurn();

    expect(corv.hp).toBeLessThan(corv.getMaxHp());
    const postTurnOneHp = corv.hp;

    game.move.select(Moves.FAKE_OUT);
    await game.toNextTurn();

    expect(corv.hp).toBe(postTurnOneHp);
  });

  // This is a PokeRogue buff to Fake Out
  it("should succeed at the start of each new wave, even if user wasn't recalled", async () => {
    await game.classicMode.startBattle([Species.FEEBAS]);

    // set hp to 1 for easy knockout
    game.scene.getEnemyPokemon()!.hp = 1;
    game.move.select(Moves.FAKE_OUT);
    await game.toNextWave();

    game.move.select(Moves.FAKE_OUT);
    await game.toNextTurn();

    const corv = game.scene.getEnemyPokemon()!;
    expect(corv).toBeDefined();
    expect(corv?.hp).toBeLessThan(corv?.getMaxHp());
  });

  // This is a PokeRogue buff to Fake Out
  it("should succeed at the start of each new wave, even if user wasn't recalled", async () => {
    await game.classicMode.startBattle([Species.FEEBAS]);

    // set hp to 1 for easy knockout
    game.scene.getEnemyPokemon()!.hp = 1;
    game.move.select(Moves.FAKE_OUT);
    await game.toNextWave();

    game.move.select(Moves.FAKE_OUT);
    await game.toNextTurn();

    const corv = game.scene.getEnemyPokemon()!;
    expect(corv).toBeDefined();
    expect(corv.hp).toBeLessThan(corv.getMaxHp());
  });

  it("should succeed if recalled and sent back out", async () => {
    await game.classicMode.startBattle([Species.FEEBAS, Species.MAGIKARP]);

    game.move.select(Moves.FAKE_OUT);
    await game.toNextTurn();

    const corv = game.scene.getEnemyPokemon()!;

    expect(corv.hp).toBeLessThan(corv.getMaxHp());
    corv.hp = corv.getMaxHp();

    game.doSwitchPokemon(1);
    await game.toNextTurn();

    game.doSwitchPokemon(1);
    await game.toNextTurn();

    game.move.select(Moves.FAKE_OUT);
    await game.toNextTurn();

    expect(corv.hp).toBeLessThan(corv.getMaxHp());
  });
});
