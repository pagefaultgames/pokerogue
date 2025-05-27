import { Abilities } from "#enums/abilities";
import { Moves } from "#enums/moves";
import { PokemonType } from "#enums/pokemon-type";
import { Species } from "#enums/species";
import GameManager from "#test/testUtils/gameManager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";

describe("Moves - Synchronoise", () => {
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
      .moveset([Moves.SYNCHRONOISE])
      .ability(Abilities.BALL_FETCH)
      .battleStyle("single")
      .disableCrits()
      .enemySpecies(Species.MAGIKARP)
      .enemyAbility(Abilities.BALL_FETCH)
      .enemyMoveset(Moves.SPLASH);
  });

  it("should consider the user's tera type if it is terastallized", async () => {
    await game.classicMode.startBattle([Species.BIDOOF]);
    const playerPokemon = game.scene.getPlayerPokemon()!;
    const enemyPokemon = game.scene.getEnemyPokemon()!;

    // force the player to be terastallized
    playerPokemon.teraType = PokemonType.WATER;
    playerPokemon.isTerastallized = true;
    game.move.select(Moves.SYNCHRONOISE);
    await game.phaseInterceptor.to("BerryPhase");
    expect(enemyPokemon.hp).toBeLessThan(enemyPokemon.getMaxHp());
  });
});
