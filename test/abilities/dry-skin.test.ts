import { AbilityId } from "#enums/ability-id";
import { MoveId } from "#enums/move-id";
import { SpeciesId } from "#enums/species-id";
import { GameManager } from "#test/test-utils/game-manager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";

describe("Abilities - Dry Skin", () => {
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
      .criticalHits(false)
      .enemyAbility(AbilityId.DRY_SKIN)
      .enemyMoveset(MoveId.SPLASH)
      .enemySpecies(SpeciesId.CHARMANDER)
      .ability(AbilityId.BALL_FETCH)
      .moveset([MoveId.SUNNY_DAY, MoveId.RAIN_DANCE, MoveId.SPLASH, MoveId.WATER_GUN])
      .starterSpecies(SpeciesId.CHANDELURE);
  });

  it("during sunlight, lose 1/8 of maximum health at the end of each turn", async () => {
    await game.classicMode.startBattle();

    const enemy = game.field.getEnemyPokemon();

    // first turn
    game.move.select(MoveId.SUNNY_DAY);
    await game.phaseInterceptor.to("TurnEndPhase");
    expect(enemy.hp).toBeLessThan(enemy.getMaxHp());

    // second turn
    enemy.hp = enemy.getMaxHp();
    game.move.select(MoveId.SPLASH);
    await game.phaseInterceptor.to("TurnEndPhase");
    expect(enemy.hp).toBeLessThan(enemy.getMaxHp());
  });

  it("during rain, gain 1/8 of maximum health at the end of each turn", async () => {
    await game.classicMode.startBattle();

    const enemy = game.field.getEnemyPokemon();

    enemy.hp = 1;

    // first turn
    game.move.select(MoveId.RAIN_DANCE);
    await game.phaseInterceptor.to("TurnEndPhase");
    expect(enemy.hp).toBeGreaterThan(1);

    // second turn
    enemy.hp = 1;
    game.move.select(MoveId.SPLASH);
    await game.phaseInterceptor.to("TurnEndPhase");
    expect(enemy.hp).toBeGreaterThan(1);
  });

  it("opposing fire attacks do 25% more damage", async () => {
    game.override.moveset([MoveId.FLAMETHROWER]);
    await game.classicMode.startBattle();

    const enemy = game.field.getEnemyPokemon();
    const initialHP = 1000;
    enemy.hp = initialHP;

    // first turn
    game.move.select(MoveId.FLAMETHROWER);
    await game.phaseInterceptor.to("TurnEndPhase");
    const fireDamageTakenWithDrySkin = initialHP - enemy.hp;

    enemy.hp = initialHP;
    game.override.enemyAbility(AbilityId.NONE);

    // second turn
    game.move.select(MoveId.FLAMETHROWER);
    await game.phaseInterceptor.to("TurnEndPhase");
    const fireDamageTakenWithoutDrySkin = initialHP - enemy.hp;

    expect(fireDamageTakenWithDrySkin).toBeGreaterThan(fireDamageTakenWithoutDrySkin);
  });

  it("opposing water attacks heal 1/4 of maximum health and deal no damage", async () => {
    await game.classicMode.startBattle();

    const enemy = game.field.getEnemyPokemon();

    enemy.hp = 1;

    game.move.select(MoveId.WATER_GUN);
    await game.phaseInterceptor.to("TurnEndPhase");
    expect(enemy.hp).toBeGreaterThan(1);
  });

  it("opposing water attacks do not heal if they were protected from", async () => {
    game.override.enemyMoveset([MoveId.PROTECT]);

    await game.classicMode.startBattle();

    const enemy = game.field.getEnemyPokemon();

    enemy.hp = 1;

    game.move.select(MoveId.WATER_GUN);
    await game.phaseInterceptor.to("TurnEndPhase");
    expect(enemy.hp).toBe(1);
  });

  it("multi-strike water attacks only heal once", async () => {
    game.override.moveset([MoveId.WATER_GUN, MoveId.WATER_SHURIKEN]);

    await game.classicMode.startBattle();

    const enemy = game.field.getEnemyPokemon();

    enemy.hp = 1;

    // first turn
    game.move.select(MoveId.WATER_SHURIKEN);
    await game.phaseInterceptor.to("TurnEndPhase");
    const healthGainedFromWaterShuriken = enemy.hp - 1;

    enemy.hp = 1;

    // second turn
    game.move.select(MoveId.WATER_GUN);
    await game.phaseInterceptor.to("TurnEndPhase");
    const healthGainedFromWaterGun = enemy.hp - 1;

    expect(healthGainedFromWaterShuriken).toBe(healthGainedFromWaterGun);
  });

  it("opposing water moves still heal regardless of accuracy check", async () => {
    await game.classicMode.startBattle();

    const enemy = game.field.getEnemyPokemon();

    game.move.select(MoveId.WATER_GUN);
    enemy.hp = enemy.hp - 1;
    await game.phaseInterceptor.to("MoveEffectPhase");

    await game.move.forceMiss();
    await game.phaseInterceptor.to("BerryPhase", false);
    expect(enemy.hp).toBe(enemy.getMaxHp());
  });
});
