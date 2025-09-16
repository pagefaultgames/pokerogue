import { MoveId } from "#enums/move-id";
import { SpeciesId } from "#enums/species-id";
import { GameManager } from "#test/test-utils/game-manager";
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
      .enemySpecies(SpeciesId.CORVIKNIGHT)
      .moveset([MoveId.FAKE_OUT, MoveId.SPLASH])
      .enemyMoveset(MoveId.SPLASH)
      .enemyLevel(10)
      .startingLevel(1) // prevent LevelUpPhase from happening
      .criticalHits(false);
  });

  it("should only work the first turn a pokemon is sent out in a battle", async () => {
    await game.classicMode.startBattle([SpeciesId.FEEBAS]);

    const corv = game.field.getEnemyPokemon();

    game.move.select(MoveId.FAKE_OUT);
    await game.toNextTurn();

    expect(corv.hp).toBeLessThan(corv.getMaxHp());
    const postTurnOneHp = corv.hp;

    game.move.select(MoveId.FAKE_OUT);
    await game.toNextTurn();

    expect(corv.hp).toBe(postTurnOneHp);
  });

  // This is a PokeRogue buff to Fake Out
  it("should succeed at the start of each new wave, even if user wasn't recalled", async () => {
    await game.classicMode.startBattle([SpeciesId.FEEBAS]);

    // set hp to 1 for easy knockout
    game.field.getEnemyPokemon().hp = 1;
    game.move.select(MoveId.FAKE_OUT);
    await game.toNextWave();

    game.move.select(MoveId.FAKE_OUT);
    await game.toNextTurn();

    const corv = game.field.getEnemyPokemon();
    expect(corv).toBeDefined();
    expect(corv?.hp).toBeLessThan(corv?.getMaxHp());
  });

  // This is a PokeRogue buff to Fake Out
  it("should succeed at the start of each new wave, even if user wasn't recalled", async () => {
    await game.classicMode.startBattle([SpeciesId.FEEBAS]);

    // set hp to 1 for easy knockout
    game.field.getEnemyPokemon().hp = 1;
    game.move.select(MoveId.FAKE_OUT);
    await game.toNextWave();

    game.move.select(MoveId.FAKE_OUT);
    await game.toNextTurn();

    const corv = game.field.getEnemyPokemon();
    expect(corv).toBeDefined();
    expect(corv.hp).toBeLessThan(corv.getMaxHp());
  });

  it("should succeed if recalled and sent back out", async () => {
    await game.classicMode.startBattle([SpeciesId.FEEBAS, SpeciesId.MAGIKARP]);

    game.move.select(MoveId.FAKE_OUT);
    await game.toNextTurn();

    const corv = game.field.getEnemyPokemon();

    expect(corv.hp).toBeLessThan(corv.getMaxHp());
    corv.hp = corv.getMaxHp();

    game.doSwitchPokemon(1);
    await game.toNextTurn();

    game.doSwitchPokemon(1);
    await game.toNextTurn();

    game.move.select(MoveId.FAKE_OUT);
    await game.toNextTurn();

    expect(corv.hp).toBeLessThan(corv.getMaxHp());
  });
});
