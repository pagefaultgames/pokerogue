import { Abilities } from "#app/enums/abilities";
import { Moves } from "#enums/moves";
import { Species } from "#enums/species";
import { WeatherType } from "#enums/weather-type";
import GameManager from "#test/testUtils/gameManager";
import Phaser from "phaser";
//import { TurnInitPhase } from "#app/phases/turn-init-phase";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";

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
    game.override
      .battleStyle("single")
      .moveset([Moves.CHILLY_RECEPTION, Moves.SNOWSCAPE])
      .enemyMoveset(Array(4).fill(Moves.SPLASH))
      .enemyAbility(Abilities.BALL_FETCH)
      .ability(Abilities.BALL_FETCH);
  });

  it("should still change the weather if user can't switch out", async () => {
    await game.classicMode.startBattle([Species.SLOWKING]);

    game.move.select(Moves.CHILLY_RECEPTION);

    await game.phaseInterceptor.to("BerryPhase", false);
    expect(game.scene.arena.weather?.weatherType).toBe(WeatherType.SNOW);
  });

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
  });

  it("happy case - switch out and weather changes", async () => {
    await game.classicMode.startBattle([Species.SLOWKING, Species.MEOWTH]);

    game.move.select(Moves.CHILLY_RECEPTION);
    game.doSelectPartyPokemon(1);

    await game.phaseInterceptor.to("BerryPhase", false);
    expect(game.scene.arena.weather?.weatherType).toBe(WeatherType.SNOW);
    expect(game.scene.getPlayerField()[0].species.speciesId).toBe(Species.MEOWTH);
  });

  // enemy uses another move and weather doesn't change
  it("check case - enemy not selecting chilly reception doesn't change weather ", async () => {
    game.override
      .battleStyle("single")
      .enemyMoveset([Moves.CHILLY_RECEPTION, Moves.TACKLE])
      .moveset(Array(4).fill(Moves.SPLASH));

    await game.classicMode.startBattle([Species.SLOWKING, Species.MEOWTH]);

    game.move.select(Moves.SPLASH);
    await game.forceEnemyMove(Moves.TACKLE);

    await game.phaseInterceptor.to("BerryPhase", false);
    expect(game.scene.arena.weather?.weatherType).toBe(undefined);
  });

  it("enemy trainer - expected behavior ", async () => {
    game.override
      .battleStyle("single")
      .startingWave(8)
      .enemyMoveset(Array(4).fill(Moves.CHILLY_RECEPTION))
      .enemySpecies(Species.MAGIKARP)
      .moveset([Moves.SPLASH, Moves.THUNDERBOLT]);

    await game.classicMode.startBattle([Species.JOLTEON]);
    const RIVAL_MAGIKARP1 = game.scene.getEnemyPokemon()?.id;

    game.move.select(Moves.SPLASH);
    await game.phaseInterceptor.to("BerryPhase", false);
    expect(game.scene.arena.weather?.weatherType).toBe(WeatherType.SNOW);
    expect(game.scene.getEnemyPokemon()?.id !== RIVAL_MAGIKARP1);

    await game.phaseInterceptor.to("TurnInitPhase", false);
    game.move.select(Moves.SPLASH);

    // second chilly reception should still switch out
    await game.phaseInterceptor.to("BerryPhase", false);
    expect(game.scene.arena.weather?.weatherType).toBe(WeatherType.SNOW);
    await game.phaseInterceptor.to("TurnInitPhase", false);
    expect(game.scene.getEnemyPokemon()?.id === RIVAL_MAGIKARP1);
    game.move.select(Moves.THUNDERBOLT);

    // enemy chilly recep move should fail: it's snowing and no option to switch out
    // no crashing
    await game.phaseInterceptor.to("BerryPhase", false);
    expect(game.scene.arena.weather?.weatherType).toBe(WeatherType.SNOW);
    await game.phaseInterceptor.to("TurnInitPhase", false);
    expect(game.scene.arena.weather?.weatherType).toBe(WeatherType.SNOW);
    game.move.select(Moves.SPLASH);
    await game.phaseInterceptor.to("BerryPhase", false);
    expect(game.scene.arena.weather?.weatherType).toBe(WeatherType.SNOW);
  });
});
