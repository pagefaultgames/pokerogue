import { Moves } from "#app/enums/moves";
import { Species } from "#app/enums/species";
import { WeatherType } from "#app/enums/weather-type";
import { Abilities } from "#enums/abilities";
import GameManager from "#test/utils/gameManager";
import { SPLASH_ONLY } from "#test/utils/testUtils";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";

describe("Abilities - Delta Stream", () => {
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
      .battleType("double")
      .enemyAbility(Abilities.BALL_FETCH)
      .enemyMoveset(SPLASH_ONLY)
      .enemySpecies(Species.MAGIKARP)
      .moveset([Moves.SPLASH])
      .starterForms({
        [Species.RAYQUAZA]: 1
      });
  });

  it("no longer applies after transition from double to single battle", async () => {
    await game.startBattle([Species.FEEBAS, Species.RAYQUAZA]);

    expect(game.scene.arena.weather?.weatherType).toBe(WeatherType.STRONG_WINDS);

    game.move.select(Moves.SPLASH);
    game.move.select(Moves.SPLASH, 1);
    await game.doKillOpponents();
    game.override.battleType("single");
    await game.toNextWave();

    expect(game.scene.arena.weather?.weatherType).toBeUndefined();
  });
});
