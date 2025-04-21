import { PokeballType } from "#app/enums/pokeball";
import { WeatherType } from "#app/enums/weather-type";
import type { CommandPhase } from "#app/phases/command-phase";
import { Command } from "#app/ui/command-ui-handler";
import { Abilities } from "#enums/abilities";
import { Moves } from "#enums/moves";
import { Species } from "#enums/species";
import GameManager from "#test/testUtils/gameManager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, it, expect, vi } from "vitest";

describe("Abilities - Desolate Land", () => {
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
      .moveset(Moves.SPLASH)
      .hasPassiveAbility(true)
      .enemySpecies(Species.RALTS)
      .enemyAbility(Abilities.BALL_FETCH)
      .enemyMoveset(Moves.SPLASH);
  });

  /**
   * This checks that the weather has changed after the Enemy Pokemon with {@linkcode Abilities.DESOLATE_LAND}
   * is forcefully moved out of the field from moves such as Roar {@linkcode Moves.ROAR}
   */
  it("should lift only when all pokemon with this ability leave the field", async () => {
    game.override.battleStyle("double").enemyMoveset([Moves.SPLASH, Moves.ROAR]);
    await game.classicMode.startBattle([Species.MAGCARGO, Species.MAGCARGO, Species.MAGIKARP, Species.MAGIKARP]);

    expect(game.scene.arena.weather?.weatherType).toBe(WeatherType.HARSH_SUN);

    vi.spyOn(game.scene, "randBattleSeedInt").mockImplementation((_range, min = 0) => {
      return min;
    });

    game.move.select(Moves.SPLASH, 0, 2);
    game.move.select(Moves.SPLASH, 1, 2);

    await game.forceEnemyMove(Moves.ROAR, 0);
    await game.forceEnemyMove(Moves.SPLASH, 1);

    await game.phaseInterceptor.to("TurnEndPhase");

    expect(game.scene.arena.weather?.weatherType).toBe(WeatherType.HARSH_SUN);

    await game.toNextTurn();

    vi.spyOn(game.scene, "randBattleSeedInt").mockImplementation((_range, min = 0) => {
      return min + 1;
    });

    game.move.select(Moves.SPLASH, 0, 2);
    game.move.select(Moves.SPLASH, 1, 2);

    await game.forceEnemyMove(Moves.ROAR, 1);
    await game.forceEnemyMove(Moves.SPLASH, 0);

    await game.phaseInterceptor.to("TurnEndPhase");

    expect(game.scene.arena.weather?.weatherType).not.toBe(WeatherType.HARSH_SUN);
  });

  it("should lift when enemy faints", async () => {
    game.override
      .battleStyle("single")
      .moveset([Moves.SHEER_COLD])
      .ability(Abilities.NO_GUARD)
      .startingLevel(100)
      .enemyLevel(1)
      .enemyMoveset([Moves.SPLASH])
      .enemySpecies(Species.MAGCARGO)
      .enemyHasPassiveAbility(true);
    await game.classicMode.startBattle([Species.MAGIKARP]);

    expect(game.scene.arena.weather?.weatherType).toBe(WeatherType.HARSH_SUN);

    game.move.select(Moves.SHEER_COLD);

    await game.phaseInterceptor.to("TurnEndPhase");

    expect(game.scene.arena.weather?.weatherType).not.toBe(WeatherType.HARSH_SUN);
  });

  it("should lift when pokemon returns upon switching from double to single battle", async () => {
    game.override.battleStyle("even-doubles").enemyMoveset([Moves.SPLASH, Moves.MEMENTO]).startingWave(12);
    await game.classicMode.startBattle([Species.MAGIKARP, Species.MAGCARGO]);

    expect(game.scene.arena.weather?.weatherType).toBe(WeatherType.HARSH_SUN);

    game.move.select(Moves.SPLASH, 0, 2);
    game.move.select(Moves.SPLASH, 1, 2);
    await game.forceEnemyMove(Moves.MEMENTO, 0);
    await game.forceEnemyMove(Moves.MEMENTO, 1);

    await game.phaseInterceptor.to("TurnEndPhase");

    expect(game.scene.arena.weather?.weatherType).toBe(WeatherType.HARSH_SUN);

    await game.toNextWave();

    expect(game.scene.arena.weather?.weatherType).not.toBe(WeatherType.HARSH_SUN);
  });

  it("should lift when enemy is captured", async () => {
    game.override
      .battleStyle("single")
      .enemyMoveset([Moves.SPLASH])
      .enemySpecies(Species.MAGCARGO)
      .enemyHasPassiveAbility(true);
    await game.classicMode.startBattle([Species.MAGIKARP]);

    expect(game.scene.arena.weather?.weatherType).toBe(WeatherType.HARSH_SUN);

    game.scene.pokeballCounts[PokeballType.MASTER_BALL] = 1;

    game.doThrowPokeball(PokeballType.MASTER_BALL);

    await game.phaseInterceptor.to("TurnEndPhase");

    expect(game.scene.arena.weather?.weatherType).not.toBe(WeatherType.HARSH_SUN);
  });

  it("should lift after fleeing from a wild pokemon", async () => {
    game.override.enemyAbility(Abilities.DESOLATE_LAND).ability(Abilities.BALL_FETCH);
    await game.classicMode.startBattle([Species.MAGIKARP]);
    expect(game.scene.arena.weather?.weatherType).toBe(WeatherType.HARSH_SUN);

    vi.spyOn(game.scene.getPlayerPokemon()!, "randSeedInt").mockReturnValue(0);

    const commandPhase = game.scene.getCurrentPhase() as CommandPhase;
    commandPhase.handleCommand(Command.RUN, 0);
    await game.phaseInterceptor.to("BerryPhase");

    expect(game.scene.arena.weather?.weatherType).not.toBe(WeatherType.HARSH_SUN);
  });
});
