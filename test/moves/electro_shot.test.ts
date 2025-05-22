import { BattlerTagType } from "#enums/battler-tag-type";
import { Stat } from "#enums/stat";
import { WeatherType } from "#enums/weather-type";
import { MoveResult } from "#app/field/pokemon";
import { Abilities } from "#enums/abilities";
import { Moves } from "#enums/moves";
import { Species } from "#enums/species";
import GameManager from "#test/testUtils/gameManager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, it, expect } from "vitest";

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
      .moveset(Moves.ELECTRO_SHOT)
      .battleStyle("single")
      .startingLevel(100)
      .enemySpecies(Species.SNORLAX)
      .enemyLevel(100)
      .enemyAbility(Abilities.BALL_FETCH)
      .enemyMoveset(Moves.SPLASH);
  });

  it("should increase the user's Sp. Atk on the first turn, then attack on the second turn", async () => {
    await game.classicMode.startBattle([Species.MAGIKARP]);

    const playerPokemon = game.scene.getPlayerPokemon()!;
    const enemyPokemon = game.scene.getEnemyPokemon()!;

    game.move.select(Moves.ELECTRO_SHOT);

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

    const playerElectroShot = playerPokemon.getMoveset().find(mv => mv && mv.moveId === Moves.ELECTRO_SHOT);
    expect(playerElectroShot?.ppUsed).toBe(1);
  });

  it.each([
    { weatherType: WeatherType.RAIN, name: "Rain" },
    { weatherType: WeatherType.HEAVY_RAIN, name: "Heavy Rain" },
  ])("should fully resolve in one turn if $name is active", async ({ weatherType }) => {
    game.override.weather(weatherType);

    await game.classicMode.startBattle([Species.MAGIKARP]);

    const playerPokemon = game.scene.getPlayerPokemon()!;
    const enemyPokemon = game.scene.getEnemyPokemon()!;

    game.move.select(Moves.ELECTRO_SHOT);

    await game.phaseInterceptor.to("MoveEffectPhase", false);
    expect(playerPokemon.getStatStage(Stat.SPATK)).toBe(1);

    await game.phaseInterceptor.to("MoveEndPhase");
    expect(playerPokemon.getTag(BattlerTagType.CHARGING)).toBeUndefined();
    expect(enemyPokemon.hp).toBeLessThan(enemyPokemon.getMaxHp());
    expect(playerPokemon.getMoveHistory()).toHaveLength(2);
    expect(playerPokemon.getLastXMoves(1)[0].result).toBe(MoveResult.SUCCESS);

    const playerElectroShot = playerPokemon.getMoveset().find(mv => mv && mv.moveId === Moves.ELECTRO_SHOT);
    expect(playerElectroShot?.ppUsed).toBe(1);
  });

  it("should only increase Sp. Atk once with Multi-Lens", async () => {
    game.override.weather(WeatherType.RAIN).startingHeldItems([{ name: "MULTI_LENS", count: 1 }]);

    await game.classicMode.startBattle([Species.MAGIKARP]);

    const playerPokemon = game.scene.getPlayerPokemon()!;

    game.move.select(Moves.ELECTRO_SHOT);

    await game.phaseInterceptor.to("MoveEndPhase");
    expect(playerPokemon.turnData.hitCount).toBe(1);
    expect(playerPokemon.getStatStage(Stat.SPATK)).toBe(1);
  });
});
