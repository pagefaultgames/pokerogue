import { allMoves } from "#app/data/moves/move";
import { BattlerTagType } from "#enums/battler-tag-type";
import { WeatherType } from "#enums/weather-type";
import { MoveResult } from "#app/field/pokemon";
import { Abilities } from "#enums/abilities";
import { Moves } from "#enums/moves";
import { Species } from "#enums/species";
import GameManager from "#test/testUtils/gameManager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, it, expect, vi } from "vitest";

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
      .moveset(Moves.SOLAR_BEAM)
      .battleStyle("single")
      .startingLevel(100)
      .enemySpecies(Species.SNORLAX)
      .enemyLevel(100)
      .enemyAbility(Abilities.BALL_FETCH)
      .enemyMoveset(Moves.SPLASH);
  });

  it("should deal damage in two turns if no weather is active", async () => {
    await game.classicMode.startBattle([Species.MAGIKARP]);

    const playerPokemon = game.scene.getPlayerPokemon()!;
    const enemyPokemon = game.scene.getEnemyPokemon()!;

    game.move.select(Moves.SOLAR_BEAM);

    await game.phaseInterceptor.to("TurnEndPhase");
    expect(playerPokemon.getTag(BattlerTagType.CHARGING)).toBeDefined();
    expect(enemyPokemon.hp).toBe(enemyPokemon.getMaxHp());
    expect(playerPokemon.getLastXMoves(1)[0].result).toBe(MoveResult.OTHER);

    await game.phaseInterceptor.to("TurnEndPhase");
    expect(playerPokemon.getTag(BattlerTagType.CHARGING)).toBeUndefined();
    expect(enemyPokemon.hp).toBeLessThan(enemyPokemon.getMaxHp());
    expect(playerPokemon.getMoveHistory()).toHaveLength(2);
    expect(playerPokemon.getLastXMoves(1)[0].result).toBe(MoveResult.SUCCESS);

    const playerSolarBeam = playerPokemon.getMoveset().find(mv => mv && mv.moveId === Moves.SOLAR_BEAM);
    expect(playerSolarBeam?.ppUsed).toBe(1);
  });

  it.each([
    { weatherType: WeatherType.SUNNY, name: "Sun" },
    { weatherType: WeatherType.HARSH_SUN, name: "Harsh Sun" },
  ])("should deal damage in one turn if $name is active", async ({ weatherType }) => {
    game.override.weather(weatherType);

    await game.classicMode.startBattle([Species.MAGIKARP]);

    const playerPokemon = game.scene.getPlayerPokemon()!;
    const enemyPokemon = game.scene.getEnemyPokemon()!;

    game.move.select(Moves.SOLAR_BEAM);

    await game.phaseInterceptor.to("TurnEndPhase");
    expect(playerPokemon.getTag(BattlerTagType.CHARGING)).toBeUndefined();
    expect(enemyPokemon.hp).toBeLessThan(enemyPokemon.getMaxHp());
    expect(playerPokemon.getMoveHistory()).toHaveLength(2);
    expect(playerPokemon.getLastXMoves(1)[0].result).toBe(MoveResult.SUCCESS);

    const playerSolarBeam = playerPokemon.getMoveset().find(mv => mv && mv.moveId === Moves.SOLAR_BEAM);
    expect(playerSolarBeam?.ppUsed).toBe(1);
  });

  it.each([
    { weatherType: WeatherType.RAIN, name: "Rain" },
    { weatherType: WeatherType.HEAVY_RAIN, name: "Heavy Rain" },
  ])("should have its power halved in $name", async ({ weatherType }) => {
    game.override.weather(weatherType);

    await game.classicMode.startBattle([Species.MAGIKARP]);

    const solarBeam = allMoves[Moves.SOLAR_BEAM];

    vi.spyOn(solarBeam, "calculateBattlePower");

    game.move.select(Moves.SOLAR_BEAM);

    await game.phaseInterceptor.to("TurnEndPhase");
    await game.phaseInterceptor.to("TurnEndPhase");
    expect(solarBeam.calculateBattlePower).toHaveLastReturnedWith(60);
  });
});
