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
      .moveset([Moves.AUTOTOMIZE])
      .battleType("single")
      .enemyAbility(Abilities.BALL_FETCH)
      .enemyMoveset(Moves.SPLASH);
  });

  it("Autotomize should reduce weight", async () => {
    const baseDracozoltWeight = 190;
    const oneAutotomizeDracozoltWeight = 90;
    const twoAutotomizeDracozoltWeight = 0.1;
    const threeAutotomizeDracozoltWeight = 0.1;
    const playerPokemon = game.scene.getPlayerPokemon()!;

    await game.classicMode.startBattle([Species.DRACOZOLT]);
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
});
