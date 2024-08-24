import { Species } from "#app/enums/species";
import { TurnEndPhase } from "#app/phases/turn-end-phase";
import { Abilities } from "#enums/abilities";
import { Moves } from "#enums/moves";
import GameManager from "#test/utils/gameManager";
import { SPLASH_ONLY } from "#test/utils/testUtils";
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
    game.override.battleType("single");
    game.override.disableCrits();
    game.override.enemyAbility(Abilities.DRY_SKIN);
    game.override.enemyMoveset(SPLASH_ONLY);
    game.override.enemySpecies(Species.CHARMANDER);
    game.override.ability(Abilities.UNNERVE);
    game.override.starterSpecies(Species.CHANDELURE);
  });

  it("during sunlight, lose 1/8 of maximum health at the end of each turn", async () => {
    game.override.moveset([Moves.SUNNY_DAY, Moves.SPLASH]);

    await game.startBattle();

    const enemy = game.scene.getEnemyPokemon()!;
    expect(enemy).not.toBe(undefined);

    // first turn
    let previousEnemyHp = enemy.hp;
    game.move.select(Moves.SUNNY_DAY);
    await game.phaseInterceptor.to(TurnEndPhase);
    expect(enemy.hp).toBeLessThan(previousEnemyHp);

    // second turn
    previousEnemyHp = enemy.hp;
    game.move.select(Moves.SPLASH);
    await game.phaseInterceptor.to(TurnEndPhase);
    expect(enemy.hp).toBeLessThan(previousEnemyHp);
  });

  it("during rain, gain 1/8 of maximum health at the end of each turn", async () => {
    game.override.moveset([Moves.RAIN_DANCE, Moves.SPLASH]);

    await game.startBattle();

    const enemy = game.scene.getEnemyPokemon()!;
    expect(enemy).not.toBe(undefined);

    enemy.hp = 1;

    // first turn
    let previousEnemyHp = enemy.hp;
    game.move.select(Moves.RAIN_DANCE);
    await game.phaseInterceptor.to(TurnEndPhase);
    expect(enemy.hp).toBeGreaterThan(previousEnemyHp);

    // second turn
    previousEnemyHp = enemy.hp;
    game.move.select(Moves.SPLASH);
    await game.phaseInterceptor.to(TurnEndPhase);
    expect(enemy.hp).toBeGreaterThan(previousEnemyHp);
  });

  it("opposing fire attacks do 25% more damage", async () => {
    game.override.moveset([Moves.FLAMETHROWER]);

    await game.startBattle();

    const enemy = game.scene.getEnemyPokemon()!;
    const initialHP = 1000;
    enemy.hp = initialHP;

    // first turn
    game.move.select(Moves.FLAMETHROWER);
    await game.phaseInterceptor.to(TurnEndPhase);
    const fireDamageTakenWithDrySkin = initialHP - enemy.hp;

    expect(enemy.hp > 0);
    enemy.hp = initialHP;
    game.override.enemyAbility(Abilities.NONE);

    // second turn
    game.move.select(Moves.FLAMETHROWER);
    await game.phaseInterceptor.to(TurnEndPhase);
    const fireDamageTakenWithoutDrySkin = initialHP - enemy.hp;

    expect(fireDamageTakenWithDrySkin).toBeGreaterThan(fireDamageTakenWithoutDrySkin);
  });

  it("opposing water attacks heal 1/4 of maximum health and deal no damage", async () => {
    game.override.moveset([Moves.WATER_GUN]);

    await game.startBattle();

    const enemy = game.scene.getEnemyPokemon()!;
    expect(enemy).not.toBe(undefined);

    enemy.hp = 1;

    game.move.select(Moves.WATER_GUN);
    await game.phaseInterceptor.to(TurnEndPhase);
    expect(enemy.hp).toBeGreaterThan(1);
  });

  it("opposing water attacks do not heal if they were protected from", async () => {
    game.override.moveset([Moves.WATER_GUN]);

    await game.startBattle();

    const enemy = game.scene.getEnemyPokemon()!;
    expect(enemy).not.toBe(undefined);

    enemy.hp = 1;
    game.override.enemyMoveset([Moves.PROTECT, Moves.PROTECT, Moves.PROTECT, Moves.PROTECT]);

    game.move.select(Moves.WATER_GUN);
    await game.phaseInterceptor.to(TurnEndPhase);
    expect(enemy.hp).toBe(1);
  });

  it("multi-strike water attacks only heal once", async () => {
    game.override.moveset([Moves.WATER_GUN, Moves.WATER_SHURIKEN]);

    await game.startBattle();

    const enemy = game.scene.getEnemyPokemon()!;
    expect(enemy).not.toBe(undefined);

    enemy.hp = 1;

    // first turn
    game.move.select(Moves.WATER_SHURIKEN);
    await game.phaseInterceptor.to(TurnEndPhase);
    const healthGainedFromWaterShuriken = enemy.hp - 1;

    enemy.hp = 1;

    // second turn
    game.move.select(Moves.WATER_GUN);
    await game.phaseInterceptor.to(TurnEndPhase);
    const healthGainedFromWaterGun = enemy.hp - 1;

    expect(healthGainedFromWaterShuriken).toBe(healthGainedFromWaterGun);
  });
});
