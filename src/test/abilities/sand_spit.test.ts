import GameManager from "#test/utils/gameManager";
import { Abilities } from "#enums/abilities";
import { Moves } from "#enums/moves";
import { Species } from "#enums/species";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { getMovePosition } from "#test/utils/gameManagerUtils";
import { WeatherType } from "#app/enums/weather-type.js";


describe("Ability Timing", () => {
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
    game.override.battleType("single");
    game.override.disableCrits();

    game.override.enemySpecies(Species.MAGIKARP);
    game.override.enemyAbility(Abilities.BALL_FETCH);

    game.override.starterSpecies(Species.SILICOBRA);
    game.override.ability(Abilities.SAND_SPIT);
    game.override.moveset([Moves.SPLASH, Moves.COIL]);
  });

  it("should trigger when hit with damaging move", async() => {
    game.override.enemyMoveset(Array(4).fill(Moves.TACKLE));
    await game.startBattle();

    game.doAttack(getMovePosition(game.scene, 0, Moves.SPLASH));
    await game.toNextTurn();

    expect(game.scene.arena.weather.weatherType).toBe(WeatherType.SANDSTORM);
  }, 20000);

  it("should not trigger when targetted with status moves", async() => {
    game.override.enemyMoveset(Array(4).fill(Moves.GROWL));
    await game.startBattle();

    game.doAttack(getMovePosition(game.scene, 0, Moves.COIL));
    await game.toNextTurn();

    expect(game.scene.arena.weather?.weatherType).not.toBe(WeatherType.SANDSTORM);
  }, 20000);
});
