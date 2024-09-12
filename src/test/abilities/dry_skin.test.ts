import { Species } from "#app/enums/species";
import { Abilities } from "#enums/abilities";
import { Moves } from "#enums/moves";
import GameManager from "#test/utils/gameManager";
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
      .battleType("single")
      .disableCrits()
      .enemyAbility(Abilities.DRY_SKIN)
      .enemyMoveset(Moves.SPLASH)
      .enemySpecies(Species.CHARMANDER)
      .ability(Abilities.BALL_FETCH)
      .moveset([Moves.SUNNY_DAY, Moves.RAIN_DANCE, Moves.SPLASH, Moves.WATER_GUN])
      .starterSpecies(Species.CHANDELURE);
  });

  it("during sunlight, lose 1/8 of maximum health at the end of each turn", async () => {
    await game.classicMode.startBattle();

    const enemy = game.scene.getEnemyPokemon()!;

    // first turn
    game.move.select(Moves.SUNNY_DAY);
    await game.phaseInterceptor.to("TurnEndPhase");
    expect(enemy.hp).toBeLessThan(enemy.getMaxHp());

    // second turn
    enemy.hp = enemy.getMaxHp();
    game.move.select(Moves.SPLASH);
    await game.phaseInterceptor.to("TurnEndPhase");
    expect(enemy.hp).toBeLessThan(enemy.getMaxHp());
  });

  it("during rain, gain 1/8 of maximum health at the end of each turn", async () => {
    await game.classicMode.startBattle();

    const enemy = game.scene.getEnemyPokemon()!;

    enemy.hp = 1;

    // first turn
    game.move.select(Moves.RAIN_DANCE);
    await game.phaseInterceptor.to("TurnEndPhase");
    expect(enemy.hp).toBeGreaterThan(1);

    // second turn
    enemy.hp = 1;
    game.move.select(Moves.SPLASH);
    await game.phaseInterceptor.to("TurnEndPhase");
    expect(enemy.hp).toBeGreaterThan(1);
  });

  it("opposing fire attacks do 25% more damage", async () => {
    game.override.moveset([Moves.FLAMETHROWER]);
    await game.classicMode.startBattle();

    const enemy = game.scene.getEnemyPokemon()!;
    const initialHP = 1000;
    enemy.hp = initialHP;

    // first turn
    game.move.select(Moves.FLAMETHROWER);
    await game.phaseInterceptor.to("TurnEndPhase");
    const fireDamageTakenWithDrySkin = initialHP - enemy.hp;

    enemy.hp = initialHP;
    game.override.enemyAbility(Abilities.NONE);

    // second turn
    game.move.select(Moves.FLAMETHROWER);
    await game.phaseInterceptor.to("TurnEndPhase");
    const fireDamageTakenWithoutDrySkin = initialHP - enemy.hp;

    expect(fireDamageTakenWithDrySkin).toBeGreaterThan(fireDamageTakenWithoutDrySkin);
  });

  it("opposing water attacks heal 1/4 of maximum health and deal no damage", async () => {
    await game.classicMode.startBattle();

    const enemy = game.scene.getEnemyPokemon()!;

    enemy.hp = 1;

    game.move.select(Moves.WATER_GUN);
    await game.phaseInterceptor.to("TurnEndPhase");
    expect(enemy.hp).toBeGreaterThan(1);
  });

  it("opposing water attacks do not heal if they were protected from", async () => {
    game.override.enemyMoveset([Moves.PROTECT]);

    await game.classicMode.startBattle();

    const enemy = game.scene.getEnemyPokemon()!;

    enemy.hp = 1;

    game.move.select(Moves.WATER_GUN);
    await game.phaseInterceptor.to("TurnEndPhase");
    expect(enemy.hp).toBe(1);
  });

  it("multi-strike water attacks only heal once", async () => {
    game.override.moveset([Moves.WATER_GUN, Moves.WATER_SHURIKEN]);

    await game.classicMode.startBattle();

    const enemy = game.scene.getEnemyPokemon()!;

    enemy.hp = 1;

    // first turn
    game.move.select(Moves.WATER_SHURIKEN);
    await game.phaseInterceptor.to("TurnEndPhase");
    const healthGainedFromWaterShuriken = enemy.hp - 1;

    enemy.hp = 1;

    // second turn
    game.move.select(Moves.WATER_GUN);
    await game.phaseInterceptor.to("TurnEndPhase");
    const healthGainedFromWaterGun = enemy.hp - 1;

    expect(healthGainedFromWaterShuriken).toBe(healthGainedFromWaterGun);
  });
});
