import { AbilityId } from "#enums/ability-id";
import { BattlerTagType } from "#enums/battler-tag-type";
import { MoveId } from "#enums/move-id";
import { MoveResult } from "#enums/move-result";
import { SpeciesId } from "#enums/species-id";
import { Stat } from "#enums/stat";
import { WeatherType } from "#enums/weather-type";
import { GameManager } from "#test/test-utils/game-manager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";

describe("Moves - Electro Shot", () => {
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
      .moveset(MoveId.ELECTRO_SHOT)
      .battleStyle("single")
      .startingLevel(100)
      .enemySpecies(SpeciesId.SNORLAX)
      .enemyLevel(100)
      .enemyAbility(AbilityId.BALL_FETCH)
      .enemyMoveset(MoveId.SPLASH);
  });

  it("should increase the user's Sp. Atk on the first turn, then attack on the second turn", async () => {
    await game.classicMode.startBattle([SpeciesId.MAGIKARP]);

    const playerPokemon = game.field.getPlayerPokemon();
    const enemyPokemon = game.field.getEnemyPokemon();

    game.move.select(MoveId.ELECTRO_SHOT);

    await game.phaseInterceptor.to("TurnEndPhase");
    expect(playerPokemon.getTag(BattlerTagType.CHARGING)).toBeDefined();
    expect(enemyPokemon.hp).toBe(enemyPokemon.getMaxHp());
    expect(playerPokemon.getLastXMoves(1)[0].result).toBe(MoveResult.OTHER);
    expect(playerPokemon.getStatStage(Stat.SPATK)).toBe(1);

    await game.phaseInterceptor.to("TurnEndPhase");
    expect(playerPokemon.getTag(BattlerTagType.CHARGING)).toBeUndefined();
    expect(enemyPokemon.hp).toBeLessThan(enemyPokemon.getMaxHp());
    expect(playerPokemon.getMoveHistory()).toHaveLength(2);
    expect(playerPokemon.getStatStage(Stat.SPATK)).toBe(1);
    expect(playerPokemon.getLastXMoves(1)[0].result).toBe(MoveResult.SUCCESS);

    const playerElectroShot = playerPokemon.getMoveset().find(mv => mv && mv.moveId === MoveId.ELECTRO_SHOT);
    expect(playerElectroShot?.ppUsed).toBe(1);
  });

  it.each([
    { weatherType: WeatherType.RAIN, name: "Rain" },
    { weatherType: WeatherType.HEAVY_RAIN, name: "Heavy Rain" },
  ])("should fully resolve in one turn if $name is active", async ({ weatherType }) => {
    game.override.weather(weatherType);

    await game.classicMode.startBattle([SpeciesId.MAGIKARP]);

    const playerPokemon = game.field.getPlayerPokemon();
    const enemyPokemon = game.field.getEnemyPokemon();

    game.move.select(MoveId.ELECTRO_SHOT);

    await game.phaseInterceptor.to("MoveEffectPhase", false);
    expect(playerPokemon.getStatStage(Stat.SPATK)).toBe(1);

    await game.phaseInterceptor.to("MoveEndPhase");
    expect(playerPokemon.getTag(BattlerTagType.CHARGING)).toBeUndefined();
    expect(enemyPokemon.hp).toBeLessThan(enemyPokemon.getMaxHp());
    expect(playerPokemon.getMoveHistory()).toHaveLength(2);
    expect(playerPokemon.getLastXMoves()[0].result).toBe(MoveResult.SUCCESS);

    const playerElectroShot = playerPokemon.getMoveset().find(mv => mv && mv.moveId === MoveId.ELECTRO_SHOT);
    expect(playerElectroShot?.ppUsed).toBe(1);
  });

  it("should only increase Sp. Atk once with Multi-Lens", async () => {
    game.override.weather(WeatherType.RAIN).startingHeldItems([{ name: "MULTI_LENS", count: 1 }]);

    await game.classicMode.startBattle([SpeciesId.MAGIKARP]);

    const playerPokemon = game.field.getPlayerPokemon();

    game.move.select(MoveId.ELECTRO_SHOT);

    await game.phaseInterceptor.to("MoveEndPhase");
    expect(playerPokemon.turnData.hitCount).toBe(1);
    expect(playerPokemon.getStatStage(Stat.SPATK)).toBe(1);
  });
});
