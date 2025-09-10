import { allMoves } from "#data/data-lists";
import { AbilityId } from "#enums/ability-id";
import { BattlerTagType } from "#enums/battler-tag-type";
import { MoveId } from "#enums/move-id";
import { MoveResult } from "#enums/move-result";
import { SpeciesId } from "#enums/species-id";
import { WeatherType } from "#enums/weather-type";
import { GameManager } from "#test/test-utils/game-manager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

describe("Moves - Solar Beam", () => {
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
      .moveset(MoveId.SOLAR_BEAM)
      .battleStyle("single")
      .startingLevel(100)
      .enemySpecies(SpeciesId.SNORLAX)
      .enemyLevel(100)
      .enemyAbility(AbilityId.BALL_FETCH)
      .enemyMoveset(MoveId.SPLASH);
  });

  it("should deal damage in two turns if no weather is active", async () => {
    await game.classicMode.startBattle([SpeciesId.MAGIKARP]);

    const playerPokemon = game.field.getPlayerPokemon();
    const enemyPokemon = game.field.getEnemyPokemon();

    game.move.select(MoveId.SOLAR_BEAM);

    await game.phaseInterceptor.to("TurnEndPhase");
    expect(playerPokemon.getTag(BattlerTagType.CHARGING)).toBeDefined();
    expect(enemyPokemon.hp).toBe(enemyPokemon.getMaxHp());
    expect(playerPokemon.getLastXMoves(1)[0].result).toBe(MoveResult.OTHER);

    await game.phaseInterceptor.to("TurnEndPhase");
    expect(playerPokemon.getTag(BattlerTagType.CHARGING)).toBeUndefined();
    expect(enemyPokemon.hp).toBeLessThan(enemyPokemon.getMaxHp());
    expect(playerPokemon.getMoveHistory()).toHaveLength(2);
    expect(playerPokemon.getLastXMoves(1)[0].result).toBe(MoveResult.SUCCESS);

    const playerSolarBeam = playerPokemon.getMoveset().find(mv => mv && mv.moveId === MoveId.SOLAR_BEAM);
    expect(playerSolarBeam?.ppUsed).toBe(1);
  });

  it.each([
    { weatherType: WeatherType.SUNNY, name: "Sun" },
    { weatherType: WeatherType.HARSH_SUN, name: "Harsh Sun" },
  ])("should deal damage in one turn if $name is active", async ({ weatherType }) => {
    game.override.weather(weatherType);

    await game.classicMode.startBattle([SpeciesId.MAGIKARP]);

    const playerPokemon = game.field.getPlayerPokemon();
    const enemyPokemon = game.field.getEnemyPokemon();

    game.move.select(MoveId.SOLAR_BEAM);

    await game.phaseInterceptor.to("TurnEndPhase");
    expect(playerPokemon.getTag(BattlerTagType.CHARGING)).toBeUndefined();
    expect(enemyPokemon.hp).toBeLessThan(enemyPokemon.getMaxHp());
    expect(playerPokemon.getMoveHistory()).toHaveLength(2);
    expect(playerPokemon.getLastXMoves(1)[0].result).toBe(MoveResult.SUCCESS);

    const playerSolarBeam = playerPokemon.getMoveset().find(mv => mv && mv.moveId === MoveId.SOLAR_BEAM);
    expect(playerSolarBeam?.ppUsed).toBe(1);
  });

  it.each([
    { weatherType: WeatherType.RAIN, name: "Rain" },
    { weatherType: WeatherType.HEAVY_RAIN, name: "Heavy Rain" },
  ])("should have its power halved in $name", async ({ weatherType }) => {
    game.override.weather(weatherType);

    await game.classicMode.startBattle([SpeciesId.MAGIKARP]);

    const solarBeam = allMoves[MoveId.SOLAR_BEAM];

    vi.spyOn(solarBeam, "calculateBattlePower");

    game.move.select(MoveId.SOLAR_BEAM);

    await game.phaseInterceptor.to("TurnEndPhase");
    await game.phaseInterceptor.to("TurnEndPhase");
    expect(solarBeam.calculateBattlePower).toHaveLastReturnedWith(60);
  });
});
