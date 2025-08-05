import { allMoves } from "#data/data-lists";
import { AbilityId } from "#enums/ability-id";
import { MoveId } from "#enums/move-id";
import { SpeciesId } from "#enums/species-id";
import { Stat } from "#enums/stat";
import { StatusEffect } from "#enums/status-effect";
import { WeatherType } from "#enums/weather-type";
import { GameManager } from "#test/test-utils/game-manager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

describe("Moves - Fell Stinger", () => {
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
      .moveset([MoveId.FELL_STINGER, MoveId.SALT_CURE, MoveId.BIND, MoveId.LEECH_SEED])
      .startingLevel(50)
      .criticalHits(false)
      .enemyAbility(AbilityId.STURDY)
      .enemySpecies(SpeciesId.HYPNO)
      .enemyMoveset(MoveId.SPLASH)
      .enemyLevel(5);
  });

  it("should not grant stat boost if opponent gets KO'd by recoil", async () => {
    game.override.enemyMoveset([MoveId.DOUBLE_EDGE]);

    await game.classicMode.startBattle([SpeciesId.LEAVANNY]);
    const leadPokemon = game.field.getPlayerPokemon();
    game.move.select(MoveId.FELL_STINGER);

    await game.phaseInterceptor.to("VictoryPhase");

    expect(leadPokemon.getStatStage(Stat.ATK)).toBe(0);
  });

  it("should not grant stat boost if enemy is KO'd by status effect", async () => {
    game.override.enemyMoveset(MoveId.SPLASH).enemyStatusEffect(StatusEffect.BURN);

    await game.classicMode.startBattle([SpeciesId.LEAVANNY]);
    const leadPokemon = game.field.getPlayerPokemon();
    game.move.select(MoveId.FELL_STINGER);

    await game.phaseInterceptor.to("VictoryPhase");

    expect(leadPokemon.getStatStage(Stat.ATK)).toBe(0);
  });

  it("should not grant stat boost if enemy is KO'd by damaging weather", async () => {
    game.override.weather(WeatherType.HAIL);

    await game.classicMode.startBattle([SpeciesId.LEAVANNY]);
    const leadPokemon = game.field.getPlayerPokemon();

    game.move.select(MoveId.FELL_STINGER);

    await game.phaseInterceptor.to("VictoryPhase");

    expect(leadPokemon.getStatStage(Stat.ATK)).toBe(0);
  });

  it("should not grant stat boost if enemy is KO'd by Dry Skin + Harsh Sunlight", async () => {
    game.override.enemyPassiveAbility(AbilityId.STURDY).enemyAbility(AbilityId.DRY_SKIN).weather(WeatherType.HARSH_SUN);

    await game.challengeMode.startBattle([SpeciesId.LEAVANNY]);
    const leadPokemon = game.field.getPlayerPokemon();

    game.move.select(MoveId.FELL_STINGER);

    await game.phaseInterceptor.to("VictoryPhase");

    expect(leadPokemon.getStatStage(Stat.ATK)).toBe(0);
  });

  it("should not grant stat boost if enemy is saved by Reviver Seed", async () => {
    game.override.enemyAbility(AbilityId.BALL_FETCH).enemyHeldItems([{ name: "REVIVER_SEED" }]);

    await game.classicMode.startBattle([SpeciesId.LEAVANNY]);
    const leadPokemon = game.field.getPlayerPokemon();
    game.move.select(MoveId.FELL_STINGER);

    await game.phaseInterceptor.to("TurnEndPhase");
    expect(leadPokemon.getStatStage(Stat.ATK)).toBe(0);
  });

  it("should not grant stat boost if enemy is KO'd by Salt Cure", async () => {
    game.override.battleStyle("double").startingLevel(5);
    const saltCure = allMoves[MoveId.SALT_CURE];
    const fellStinger = allMoves[MoveId.FELL_STINGER];
    vi.spyOn(saltCure, "accuracy", "get").mockReturnValue(100);
    vi.spyOn(fellStinger, "power", "get").mockReturnValue(50000);

    await game.classicMode.startBattle([SpeciesId.LEAVANNY]);
    const leadPokemon = game.field.getPlayerPokemon();
    const leftEnemy = game.scene.getEnemyField()[0]!;

    //  Turn 1: set Salt Cure, enemy splashes and does nothing
    game.move.select(MoveId.SALT_CURE, 0, leftEnemy.getBattlerIndex());

    //  Turn 2: enemy Endures Fell Stinger, then dies to Salt Cure
    await game.toNextTurn();
    expect(leftEnemy.isFainted()).toBe(false);
    leftEnemy.heal(leftEnemy.getMaxHp());
    game.move.select(MoveId.FELL_STINGER);
    await game.toNextTurn();

    expect(leftEnemy.isFainted()).toBe(true);
    expect(leadPokemon.getStatStage(Stat.ATK)).toBe(0);
  });

  it("should not grant stat boost if enemy dies to Bind or a similar effect", async () => {
    game.override.battleStyle("double").startingLevel(5);
    vi.spyOn(allMoves[MoveId.BIND], "accuracy", "get").mockReturnValue(100);
    vi.spyOn(allMoves[MoveId.FELL_STINGER], "power", "get").mockReturnValue(50000);

    await game.classicMode.startBattle([SpeciesId.LEAVANNY]);
    const leadPokemon = game.field.getPlayerPokemon();
    const leftEnemy = game.scene.getEnemyField()[0]!;

    // Turn 1: set Bind, enemy splashes and does nothing
    game.move.select(MoveId.BIND, 0, leftEnemy.getBattlerIndex());

    // Turn 2: enemy Endures Fell Stinger, then dies to Bind
    await game.toNextTurn();
    expect(leftEnemy.isFainted()).toBe(false);
    leftEnemy.heal(leftEnemy.getMaxHp());
    game.move.select(MoveId.FELL_STINGER, 0, leftEnemy.getBattlerIndex());
    await game.toNextTurn();

    expect(leftEnemy.isFainted()).toBe(true);
    expect(leadPokemon.getStatStage(Stat.ATK)).toBe(0);
  });

  it("should not grant stat boost if enemy dies to Leech Seed", async () => {
    game.override.battleStyle("double").startingLevel(5);
    vi.spyOn(allMoves[MoveId.LEECH_SEED], "accuracy", "get").mockReturnValue(100);
    vi.spyOn(allMoves[MoveId.FELL_STINGER], "power", "get").mockReturnValue(50000);

    await game.classicMode.startBattle([SpeciesId.LEAVANNY]);
    const leadPokemon = game.field.getPlayerPokemon();
    const leftEnemy = game.scene.getEnemyField()[0]!;

    // Turn 1: set Leech Seed, enemy splashes and does nothing
    game.move.select(MoveId.LEECH_SEED, 0, leftEnemy.getBattlerIndex());

    // Turn 2: enemy Endures Fell Stinger, then dies to Leech Seed
    await game.toNextTurn();
    expect(leftEnemy.isFainted()).toBe(false);
    leftEnemy.heal(leftEnemy.getMaxHp());
    game.move.select(MoveId.FELL_STINGER, 0, leftEnemy.getBattlerIndex());
    await game.toNextTurn();

    expect(leftEnemy.isFainted()).toBe(true);
    expect(leadPokemon.getStatStage(Stat.ATK)).toBe(0);
  });

  it("should grant stat boost if enemy dies directly to hit", async () => {
    game.override.enemyAbility(AbilityId.KLUTZ);

    await game.classicMode.startBattle([SpeciesId.LEAVANNY]);
    const leadPokemon = game.field.getPlayerPokemon();
    game.move.select(MoveId.FELL_STINGER);

    await game.phaseInterceptor.to("TurnEndPhase");

    expect(leadPokemon.getStatStage(Stat.ATK)).toBe(3);
  });
});
