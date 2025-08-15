import { globalScene } from "#app/global-scene";
import { AbilityId } from "#enums/ability-id";
import { Command } from "#enums/command";
import { MoveId } from "#enums/move-id";
import { PokeballType } from "#enums/pokeball";
import { SpeciesId } from "#enums/species-id";
import { WeatherType } from "#enums/weather-type";
import type { CommandPhase } from "#phases/command-phase";
import { GameManager } from "#test/test-utils/game-manager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

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
      .moveset(MoveId.SPLASH)
      .hasPassiveAbility(true)
      .enemySpecies(SpeciesId.RALTS)
      .enemyAbility(AbilityId.BALL_FETCH)
      .enemyMoveset(MoveId.SPLASH);
  });

  /**
   * This checks that the weather has changed after the Enemy Pokemon with {@linkcode AbilityId.DESOLATE_LAND}
   * is forcefully moved out of the field from moves such as Roar {@linkcode MoveId.ROAR}
   */
  it("should lift only when all pokemon with this ability leave the field", async () => {
    game.override.battleStyle("double").enemyMoveset([MoveId.SPLASH, MoveId.ROAR]);
    await game.classicMode.startBattle([
      SpeciesId.MAGCARGO,
      SpeciesId.MAGCARGO,
      SpeciesId.MAGIKARP,
      SpeciesId.MAGIKARP,
    ]);

    expect(game.scene.arena.weather?.weatherType).toBe(WeatherType.HARSH_SUN);

    vi.spyOn(game.scene, "randBattleSeedInt").mockImplementation((_range, min = 0) => {
      return min;
    });

    game.move.select(MoveId.SPLASH, 0, 2);
    game.move.select(MoveId.SPLASH, 1, 2);

    await game.move.selectEnemyMove(MoveId.ROAR, 0);
    await game.move.selectEnemyMove(MoveId.SPLASH, 1);

    await game.phaseInterceptor.to("TurnEndPhase");

    expect(game.scene.arena.weather?.weatherType).toBe(WeatherType.HARSH_SUN);

    await game.toNextTurn();

    vi.spyOn(game.scene, "randBattleSeedInt").mockImplementation((_range, min = 0) => {
      return min + 1;
    });

    game.move.select(MoveId.SPLASH, 0, 2);
    game.move.select(MoveId.SPLASH, 1, 2);

    await game.move.selectEnemyMove(MoveId.ROAR, 1);
    await game.move.selectEnemyMove(MoveId.SPLASH, 0);

    await game.phaseInterceptor.to("TurnEndPhase");

    expect(game.scene.arena.weather?.weatherType).not.toBe(WeatherType.HARSH_SUN);
  });

  it("should lift when enemy faints", async () => {
    game.override
      .battleStyle("single")
      .moveset([MoveId.SHEER_COLD])
      .ability(AbilityId.NO_GUARD)
      .startingLevel(100)
      .enemyLevel(1)
      .enemyMoveset([MoveId.SPLASH])
      .enemySpecies(SpeciesId.MAGCARGO)
      .enemyHasPassiveAbility(true);
    await game.classicMode.startBattle([SpeciesId.MAGIKARP]);

    expect(game.scene.arena.weather?.weatherType).toBe(WeatherType.HARSH_SUN);

    game.move.select(MoveId.SHEER_COLD);

    await game.phaseInterceptor.to("TurnEndPhase");

    expect(game.scene.arena.weather?.weatherType).not.toBe(WeatherType.HARSH_SUN);
  });

  it("should lift when pokemon returns upon switching from double to single battle", async () => {
    game.override.battleStyle("even-doubles").enemyMoveset([MoveId.SPLASH, MoveId.MEMENTO]).startingWave(12);
    await game.classicMode.startBattle([SpeciesId.MAGIKARP, SpeciesId.MAGCARGO]);

    expect(game.scene.arena.weather?.weatherType).toBe(WeatherType.HARSH_SUN);

    game.move.select(MoveId.SPLASH, 0, 2);
    game.move.select(MoveId.SPLASH, 1, 2);
    await game.move.selectEnemyMove(MoveId.MEMENTO, 0);
    await game.move.selectEnemyMove(MoveId.MEMENTO, 1);

    await game.phaseInterceptor.to("TurnEndPhase");

    expect(game.scene.arena.weather?.weatherType).toBe(WeatherType.HARSH_SUN);

    await game.toNextWave();

    expect(game.scene.arena.weather?.weatherType).not.toBe(WeatherType.HARSH_SUN);
  });

  it("should lift when enemy is captured", async () => {
    game.override
      .battleStyle("single")
      .enemyMoveset([MoveId.SPLASH])
      .enemySpecies(SpeciesId.MAGCARGO)
      .enemyHasPassiveAbility(true);
    await game.classicMode.startBattle([SpeciesId.MAGIKARP]);

    expect(game.scene.arena.weather?.weatherType).toBe(WeatherType.HARSH_SUN);

    game.scene.pokeballCounts[PokeballType.MASTER_BALL] = 1;

    game.doThrowPokeball(PokeballType.MASTER_BALL);

    await game.phaseInterceptor.to("TurnEndPhase");

    expect(game.scene.arena.weather?.weatherType).not.toBe(WeatherType.HARSH_SUN);
  });

  it("should lift after fleeing from a wild pokemon", async () => {
    game.override.enemyAbility(AbilityId.DESOLATE_LAND).ability(AbilityId.BALL_FETCH);
    await game.classicMode.startBattle([SpeciesId.MAGIKARP]);
    expect(game.scene.arena.weather?.weatherType).toBe(WeatherType.HARSH_SUN);

    vi.spyOn(game.field.getPlayerPokemon(), "randBattleSeedInt").mockReturnValue(0);
    vi.spyOn(globalScene, "randBattleSeedInt").mockReturnValue(0);

    const commandPhase = game.scene.phaseManager.getCurrentPhase() as CommandPhase;
    commandPhase.handleCommand(Command.RUN, 0);
    await game.phaseInterceptor.to("BerryPhase");

    expect(game.scene.arena.weather?.weatherType).not.toBe(WeatherType.HARSH_SUN);
  });
});
