import { WeatherType } from "#app/data/weather";
import { Moves } from "#enums/moves";
import { Species } from "#enums/species";
import GameManager from "#test/utils/gameManager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";

describe("Weather - Sandstorm", () => {
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
      .weather(WeatherType.SANDSTORM)
      .battleType("single")
      .moveset(Moves.SPLASH)
      .enemyMoveset(Moves.SPLASH)
      .enemySpecies(Species.MAGIKARP);
  });

  it("inflicts damage equal to 1/16 of Pokemon's max HP at turn end", async () => {
    await game.classicMode.startBattle([Species.MAGIKARP]);

    game.move.select(Moves.SPLASH);

    await game.phaseInterceptor.to("TurnEndPhase");

    game.scene.getField(true).forEach(pokemon => {
      expect(pokemon.hp).toBeLessThan(pokemon.getMaxHp() - Math.floor(pokemon.getMaxHp() / 16));
    });
  });

  it("does not inflict damage to a Pokemon that is underwater (Dive) or underground (Dig)", async () => {
    game.override.moveset([Moves.DIVE]);
    await game.classicMode.startBattle([Species.MAGIKARP]);

    game.move.select(Moves.DIVE);

    await game.phaseInterceptor.to("TurnEndPhase");

    const playerPokemon = game.scene.getPlayerPokemon()!;
    const enemyPokemon = game.scene.getEnemyPokemon()!;

    expect(playerPokemon.hp).toBe(playerPokemon.getMaxHp());
    expect(enemyPokemon.hp).toBeLessThan(enemyPokemon.getMaxHp() - Math.floor(enemyPokemon.getMaxHp() / 16));
  });
});
