import { Abilities } from "#app/enums/abilities";
import { Moves } from "#enums/moves";
import { Species } from "#enums/species";
import { WeatherType } from "#enums/weather-type";
import GameManager from "#test/utils/gameManager";
import { SPLASH_ONLY } from "#test/utils/testUtils";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";

const TIMEOUT = 20 * 1000;

describe("Moves - Chilly Reception", () => {
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
    game.override.battleType("single")
      .moveset([Moves.CHILLY_RECEPTION, Moves.SNOWSCAPE])
      .enemyMoveset(SPLASH_ONLY)
      .enemyAbility(Abilities.NONE)
      .ability(Abilities.NONE);

  });

  it("should still change the weather if user can't switch out", async () => {
    await game.classicMode.startBattle([Species.SLOWKING]);

    game.move.select(Moves.CHILLY_RECEPTION);

    await game.phaseInterceptor.to("BerryPhase", false);
    expect(game.scene.arena.weather?.weatherType).toBe(WeatherType.SNOW);
  }, TIMEOUT);

  it("should switch out even if it's snowing", async () => {
    await game.classicMode.startBattle([Species.SLOWKING, Species.MEOWTH]);
    // first turn set up snow with snowscape, try chilly reception on second turn
    game.move.select(Moves.SNOWSCAPE);
    await game.phaseInterceptor.to("BerryPhase", false);
    expect(game.scene.arena.weather?.weatherType).toBe(WeatherType.SNOW);

    await game.phaseInterceptor.to("TurnInitPhase", false);
    game.move.select(Moves.CHILLY_RECEPTION);
    game.doSelectPartyPokemon(1);

    await game.phaseInterceptor.to("BerryPhase", false);
    expect(game.scene.arena.weather?.weatherType).toBe(WeatherType.SNOW);
    expect(game.scene.getPlayerField()[0].species.speciesId).toBe(Species.MEOWTH);
  }, TIMEOUT);

  it("happy case - switch out and weather changes", async () => {

    await game.classicMode.startBattle([Species.SLOWKING, Species.MEOWTH]);

    game.move.select(Moves.CHILLY_RECEPTION);
    game.doSelectPartyPokemon(1);

    await game.phaseInterceptor.to("BerryPhase", false);
    expect(game.scene.arena.weather?.weatherType).toBe(WeatherType.SNOW);
    expect(game.scene.getPlayerField()[0].species.speciesId).toBe(Species.MEOWTH);
  }, TIMEOUT);
});
