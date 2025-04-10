import { Abilities } from "#enums/abilities";
import { Moves } from "#enums/moves";
import { Species } from "#enums/species";
import GameManager from "#test/testUtils/gameManager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";

describe("Abilities - Mummy", () => {
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
      .moveset([Moves.SPLASH])
      .ability(Abilities.MUMMY)
      .battleStyle("single")
      .disableCrits()
      .enemySpecies(Species.MAGIKARP)
      .enemyAbility(Abilities.BALL_FETCH)
      .enemyMoveset(Moves.TACKLE);
  });

  it("should set the enemy's ability to mummy when hit by a contact move", async () => {
    await game.classicMode.startBattle([Species.FEEBAS]);

    game.move.select(Moves.SPLASH);
    await game.phaseInterceptor.to("BerryPhase");

    expect(game.scene.getEnemyPokemon()?.getAbility().id).toBe(Abilities.MUMMY);
  });

  it("should not change the enemy's ability hit by a non-contact move", async () => {
    game.override.enemyMoveset(Moves.EARTHQUAKE);
    await game.classicMode.startBattle([Species.FEEBAS]);

    game.move.select(Moves.SPLASH);
    await game.phaseInterceptor.to("BerryPhase");

    expect(game.scene.getEnemyPokemon()?.getAbility().id).toBe(Abilities.BALL_FETCH);
  });
});
