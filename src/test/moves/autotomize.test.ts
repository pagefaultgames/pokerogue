import { Abilities } from "#enums/abilities";
import { Moves } from "#enums/moves";
import { Species } from "#enums/species";
import GameManager from "#test/utils/gameManager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, it, expect } from "vitest";

describe("Moves - Autotomize", () => {
  let phaserGame: Phaser.Game;
  let game: GameManager;
  const TIMEOUT = 20 * 1000;

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
      .moveset([Moves.AUTOTOMIZE, Moves.KINGS_SHIELD, Moves.FALSE_SWIPE])
      .battleType("single")
      .enemyAbility(Abilities.BALL_FETCH)
      .enemyMoveset(Moves.SPLASH);
  });

  it("Autotomize should reduce weight", async () => {
    const baseDracozoltWeight = 190;
    const oneAutotomizeDracozoltWeight = 90;
    const twoAutotomizeDracozoltWeight = 0.1;
    const threeAutotomizeDracozoltWeight = 0.1;

    await game.classicMode.startBattle([Species.DRACOZOLT]);
    const playerPokemon = game.scene.getPlayerPokemon()!;
    expect(playerPokemon.getWeight()).toBe(baseDracozoltWeight);
    game.move.select(Moves.AUTOTOMIZE);
    // expect a queued message here
    expect(playerPokemon.getWeight()).toBe(oneAutotomizeDracozoltWeight);
    await game.toNextTurn();

    game.move.select(Moves.AUTOTOMIZE);
    //expect a queued message here
    expect(playerPokemon.getWeight()).toBe(twoAutotomizeDracozoltWeight);
    await game.toNextTurn();

    game.move.select(Moves.AUTOTOMIZE);
    // expect no queued message here
    expect(playerPokemon.getWeight()).toBe(threeAutotomizeDracozoltWeight);
  }, TIMEOUT);

  it("Changing forms should revert weight", async () => {
    const baseAegislashWeight = 53;
    const autotomizeAegislashWeight = 0.1;

    await game.classicMode.startBattle([Species.AEGISLASH]);
    const playerPokemon = game.scene.getPlayerPokemon()!;

    expect(playerPokemon.getWeight()).toBe(baseAegislashWeight);
    game.move.select(Moves.AUTOTOMIZE);
    expect(playerPokemon.getWeight()).toBe(autotomizeAegislashWeight);
    await game.toNextTurn();

    game.move.select(Moves.KINGS_SHIELD);
    expect(playerPokemon.getWeight()).toBe(baseAegislashWeight);
    await game.toNextTurn();

    game.move.select(Moves.AUTOTOMIZE);
    expect(playerPokemon.getWeight()).toBe(autotomizeAegislashWeight);

    game.move.select(Moves.FALSE_SWIPE);
    expect(playerPokemon.getWeight()).toBe(baseAegislashWeight);
    await game.toNextTurn();

    game.move.select(Moves.AUTOTOMIZE);
    expect(playerPokemon.getWeight()).toBe(autotomizeAegislashWeight);
  }, TIMEOUT);
});
