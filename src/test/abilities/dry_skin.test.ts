import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import Phaser from "phaser";
import GameManager from "#app/test/utils/gameManager";
import * as overrides from "#app/overrides";
import { TurnEndPhase } from "#app/phases";
import { Moves } from "#enums/moves";
import { getMovePosition } from "#app/test/utils/gameManagerUtils";
import { Abilities } from "#enums/abilities";

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
    vi.spyOn(overrides, "SINGLE_BATTLE_OVERRIDE", "get").mockReturnValue(true);
    vi.spyOn(overrides, "OPP_ABILITY_OVERRIDE", "get").mockReturnValue(Abilities.DRY_SKIN);
    vi.spyOn(overrides, "OPP_MOVESET_OVERRIDE", "get").mockReturnValue([Moves.SPLASH, Moves.SPLASH, Moves.SPLASH, Moves.SPLASH]);
  });

  it("during sunlight, lose 1/8 of maximum health at the end of each turn", async () => {
    vi.spyOn(overrides, "MOVESET_OVERRIDE", "get").mockReturnValue([Moves.SUNNY_DAY, Moves.SPLASH]);

    await game.startBattle();

    const enemy = game.scene.getEnemyPokemon();
    expect(enemy).not.toBe(undefined);

    // first turn
    let previousEnemyHp = enemy.hp;
    game.doAttack(getMovePosition(game.scene, 0, Moves.SUNNY_DAY));
    await game.phaseInterceptor.to(TurnEndPhase);
    expect(enemy.hp).toBeLessThan(previousEnemyHp);

    // second turn
    previousEnemyHp = enemy.hp;
    game.doAttack(getMovePosition(game.scene, 0, Moves.SPLASH));
    await game.phaseInterceptor.to(TurnEndPhase);
    expect(enemy.hp).toBeLessThan(previousEnemyHp);
  });

  it("during rain, gain 1/8 of maximum health at the end of each turn", async () => {
    vi.spyOn(overrides, "MOVESET_OVERRIDE", "get").mockReturnValue([Moves.RAIN_DANCE, Moves.SPLASH]);

    await game.startBattle();

    const enemy = game.scene.getEnemyPokemon();
    expect(enemy).not.toBe(undefined);

    enemy.hp = 1;

    // first turn
    let previousEnemyHp = enemy.hp;
    game.doAttack(getMovePosition(game.scene, 0, Moves.RAIN_DANCE));
    await game.phaseInterceptor.to(TurnEndPhase);
    expect(enemy.hp).toBeGreaterThan(previousEnemyHp);

    // second turn
    previousEnemyHp = enemy.hp;
    game.doAttack(getMovePosition(game.scene, 0, Moves.SPLASH));
    await game.phaseInterceptor.to(TurnEndPhase);
    expect(enemy.hp).toBeGreaterThan(previousEnemyHp);
  });

  it("opposing fire attacks do 25% more damage", async () => {
    vi.spyOn(overrides, "MOVESET_OVERRIDE", "get").mockReturnValue([Moves.EMBER]);

    // ensure the enemy doesn't die to this
    vi.spyOn(overrides, "OPP_LEVEL_OVERRIDE", "get").mockReturnValue(30);

    await game.startBattle();

    const enemy = game.scene.getEnemyPokemon();
    expect(enemy).not.toBe(undefined);

    // first turn
    game.doAttack(getMovePosition(game.scene, 0, Moves.EMBER));
    await game.phaseInterceptor.to(TurnEndPhase);
    const fireDamageTakenWithDrySkin = enemy.getMaxHp() - enemy.hp;

    expect(enemy.hp > 0);
    enemy.hp = enemy.getMaxHp();
    vi.spyOn(overrides, "OPP_ABILITY_OVERRIDE", "get").mockReturnValue(Abilities.NONE);

    // second turn
    game.doAttack(getMovePosition(game.scene, 0, Moves.EMBER));
    await game.phaseInterceptor.to(TurnEndPhase);
    const fireDamageTakenWithoutDrySkin = enemy.getMaxHp() - enemy.hp;

    expect(fireDamageTakenWithDrySkin).toBeGreaterThan(fireDamageTakenWithoutDrySkin);
  });

  it("opposing water attacks heal 1/4 of maximum health and deal no damage", async () => {
    vi.spyOn(overrides, "MOVESET_OVERRIDE", "get").mockReturnValue([Moves.WATER_GUN]);

    await game.startBattle();

    const enemy = game.scene.getEnemyPokemon();
    expect(enemy).not.toBe(undefined);

    enemy.hp = 1;

    game.doAttack(getMovePosition(game.scene, 0, Moves.WATER_GUN));
    await game.phaseInterceptor.to(TurnEndPhase);
    expect(enemy.hp).toBeGreaterThan(1);
  });

  it("opposing water attacks do not heal if they were protected from", async () => {
    vi.spyOn(overrides, "MOVESET_OVERRIDE", "get").mockReturnValue([Moves.WATER_GUN]);

    await game.startBattle();

    const enemy = game.scene.getEnemyPokemon();
    expect(enemy).not.toBe(undefined);

    enemy.hp = 1;
    vi.spyOn(overrides, "OPP_MOVESET_OVERRIDE", "get").mockReturnValue([Moves.PROTECT, Moves.PROTECT, Moves.PROTECT, Moves.PROTECT]);

    game.doAttack(getMovePosition(game.scene, 0, Moves.WATER_GUN));
    await game.phaseInterceptor.to(TurnEndPhase);
    expect(enemy.hp).toBe(1);
  });

  it("multi-strike water attacks only heal once", async () => {
    vi.spyOn(overrides, "MOVESET_OVERRIDE", "get").mockReturnValue([Moves.WATER_GUN, Moves.WATER_SHURIKEN]);

    await game.startBattle();

    const enemy = game.scene.getEnemyPokemon();
    expect(enemy).not.toBe(undefined);

    enemy.hp = 1;

    // first turn
    game.doAttack(getMovePosition(game.scene, 0, Moves.WATER_SHURIKEN));
    await game.phaseInterceptor.to(TurnEndPhase);
    const healthGainedFromWaterShuriken = enemy.hp - 1;

    enemy.hp = 1;

    // second turn
    game.doAttack(getMovePosition(game.scene, 0, Moves.WATER_GUN));
    await game.phaseInterceptor.to(TurnEndPhase);
    const healthGainedFromWaterGun = enemy.hp - 1;

    expect(healthGainedFromWaterShuriken).toBe(healthGainedFromWaterGun);
  });
});
