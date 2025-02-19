import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import GameManager from "../utils/gameManager";
import { Species } from "#enums/species";
import { Abilities } from "#enums/abilities";
import { Moves } from "#enums/moves";
import { Stat } from "#enums/stat";
import { StatusEffect } from "#app/enums/status-effect";
import { WeatherType } from "#app/enums/weather-type";
import { allMoves } from "#app/data/move";


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

    game.override.battleType("single")
      .moveset([
        Moves.FELL_STINGER,
        Moves.SALT_CURE,
        Moves.BIND,
        Moves.LEECH_SEED
      ])
      .startingLevel(50)
      .disableCrits()
      .enemyAbility(Abilities.STURDY)
      .enemySpecies(Species.HYPNO)
      .enemyMoveset(Moves.SPLASH)
      .enemyLevel(5);
  });

  it("should not grant stat boost if opponent gets KO'd by recoil", async () => {
    game.override.enemyMoveset([ Moves.DOUBLE_EDGE ]);

    await game.classicMode.startBattle([ Species.LEAVANNY ]);
    const leadPokemon = game.scene.getPlayerPokemon()!;
    game.move.select(Moves.FELL_STINGER);

    await game.phaseInterceptor.to("VictoryPhase");

    expect(leadPokemon.getStatStage(Stat.ATK)).toBe(0);
  });

  it("should not grant stat boost if enemy is KO'd by status effect", async () => {
    game.override
      .enemyMoveset(Moves.SPLASH)
      .enemyStatusEffect(StatusEffect.BURN);

    await game.classicMode.startBattle([ Species.LEAVANNY ]);
    const leadPokemon = game.scene.getPlayerPokemon()!;
    game.move.select(Moves.FELL_STINGER);

    await game.phaseInterceptor.to("VictoryPhase");

    expect(leadPokemon.getStatStage(Stat.ATK)).toBe(0);
  });

  it("should not grant stat boost if enemy is KO'd by damaging weather", async () => {
    game.override.weather(WeatherType.HAIL);

    await game.classicMode.startBattle([ Species.LEAVANNY ]);
    const leadPokemon = game.scene.getPlayerPokemon()!;

    game.move.select(Moves.FELL_STINGER);

    await game.phaseInterceptor.to("VictoryPhase");

    expect(leadPokemon.getStatStage(Stat.ATK)).toBe(0);
  });

  it("should not grant stat boost if enemy is KO'd by Dry Skin + Harsh Sunlight", async () => {
    game.override
      .enemyPassiveAbility(Abilities.STURDY)
      .enemyAbility(Abilities.DRY_SKIN)
      .weather(WeatherType.HARSH_SUN);

    await game.challengeMode.startBattle([ Species.LEAVANNY ]);
    const leadPokemon = game.scene.getPlayerPokemon()!;

    game.move.select(Moves.FELL_STINGER);

    await game.phaseInterceptor.to("VictoryPhase");

    expect(leadPokemon.getStatStage(Stat.ATK)).toBe(0);
  });

  it("should not grant stat boost if enemy is saved by Reviver Seed", async () => {
    game.override
      .enemyAbility(Abilities.BALL_FETCH)
      .enemyHeldItems([{ name: "REVIVER_SEED" }]);

    await game.classicMode.startBattle([ Species.LEAVANNY ]);
    const leadPokemon = game.scene.getPlayerPokemon()!;
    game.move.select(Moves.FELL_STINGER);

    await game.phaseInterceptor.to("TurnEndPhase");
    expect(leadPokemon.getStatStage(Stat.ATK)).toBe(0);
  });

  it("should not grant stat boost if enemy is KO'd by Salt Cure", async () => {
    game.override.battleType("double")
      .startingLevel(5);
    const saltCure = allMoves[Moves.SALT_CURE];
    const fellStinger = allMoves[Moves.FELL_STINGER];
    vi.spyOn(saltCure, "accuracy", "get").mockReturnValue(100);
    vi.spyOn(fellStinger, "power", "get").mockReturnValue(50000);

    await game.classicMode.startBattle([ Species.LEAVANNY ]);
    const leadPokemon = game.scene.getPlayerPokemon()!;
    const leftEnemy = game.scene.getEnemyField()[0]!;

    //  Turn 1: set Salt Cure, enemy splashes and does nothing
    game.move.select(Moves.SALT_CURE, 0, leftEnemy.getBattlerIndex());

    //  Turn 2: enemy Endures Fell Stinger, then dies to Salt Cure
    await game.toNextTurn();
    expect(leftEnemy.isFainted()).toBe(false);
    leftEnemy.heal(leftEnemy.getMaxHp());
    game.move.select(Moves.FELL_STINGER);
    await game.toNextTurn();

    expect(leftEnemy.isFainted()).toBe(true);
    expect(leadPokemon.getStatStage(Stat.ATK)).toBe(0);
  });

  it("should not grant stat boost if enemy dies to Bind or a similar effect", async () => {
    game.override.battleType("double")
      .startingLevel(5);
    vi.spyOn(allMoves[Moves.BIND], "accuracy", "get").mockReturnValue(100);
    vi.spyOn(allMoves[Moves.FELL_STINGER], "power", "get").mockReturnValue(50000);

    await game.classicMode.startBattle([ Species.LEAVANNY ]);
    const leadPokemon = game.scene.getPlayerPokemon()!;
    const leftEnemy = game.scene.getEnemyField()[0]!;

    // Turn 1: set Bind, enemy splashes and does nothing
    game.move.select(Moves.BIND, 0, leftEnemy.getBattlerIndex());

    // Turn 2: enemy Endures Fell Stinger, then dies to Bind
    await game.toNextTurn();
    expect(leftEnemy.isFainted()).toBe(false);
    leftEnemy.heal(leftEnemy.getMaxHp());
    game.move.select(Moves.FELL_STINGER, 0, leftEnemy.getBattlerIndex());
    await game.toNextTurn();

    expect(leftEnemy.isFainted()).toBe(true);
    expect(leadPokemon.getStatStage(Stat.ATK)).toBe(0);
  });

  it("should not grant stat boost if enemy dies to Leech Seed", async () => {
    game.override.battleType("double")
      .startingLevel(5);
    vi.spyOn(allMoves[Moves.LEECH_SEED], "accuracy", "get").mockReturnValue(100);
    vi.spyOn(allMoves[Moves.FELL_STINGER], "power", "get").mockReturnValue(50000);

    await game.classicMode.startBattle([ Species.LEAVANNY ]);
    const leadPokemon = game.scene.getPlayerPokemon()!;
    const leftEnemy = game.scene.getEnemyField()[0]!;

    // Turn 1: set Leech Seed, enemy splashes and does nothing
    game.move.select(Moves.LEECH_SEED, 0, leftEnemy.getBattlerIndex());

    // Turn 2: enemy Endures Fell Stinger, then dies to Leech Seed
    await game.toNextTurn();
    expect(leftEnemy.isFainted()).toBe(false);
    leftEnemy.heal(leftEnemy.getMaxHp());
    game.move.select(Moves.FELL_STINGER, 0, leftEnemy.getBattlerIndex());
    await game.toNextTurn();

    expect(leftEnemy.isFainted()).toBe(true);
    expect(leadPokemon.getStatStage(Stat.ATK)).toBe(0);
  });

  it("should grant stat boost if enemy dies directly to hit", async () => {
    game.override.enemyAbility(Abilities.KLUTZ);

    await game.classicMode.startBattle([ Species.LEAVANNY ]);
    const leadPokemon = game.scene.getPlayerPokemon();
    game.move.select(Moves.FELL_STINGER);

    await game.phaseInterceptor.to("TurnEndPhase");

    expect(leadPokemon?.getStatStage(Stat.ATK)).toBe(3);
  });
});
