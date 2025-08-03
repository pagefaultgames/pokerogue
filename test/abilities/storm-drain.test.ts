import { AbilityId } from "#enums/ability-id";
import { BattlerIndex } from "#enums/battler-index";
import { MoveId } from "#enums/move-id";
import { SpeciesId } from "#enums/species-id";
import { Stat } from "#enums/stat";
import { GameManager } from "#test/test-utils/game-manager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";

// TODO: Condense with lightning rod tests sometime
describe("Abilities - Storm Drain", () => {
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
      .moveset([MoveId.SPLASH, MoveId.WATER_GUN])
      .ability(AbilityId.BALL_FETCH)
      .battleStyle("double")
      .criticalHits(false)
      .enemySpecies(SpeciesId.MAGIKARP)
      .enemyAbility(AbilityId.BALL_FETCH)
      .enemyMoveset(MoveId.SPLASH);
  });

  it("should redirect water type moves", async () => {
    await game.classicMode.startBattle([SpeciesId.FEEBAS, SpeciesId.MAGIKARP]);

    const enemy1 = game.scene.getEnemyField()[0];
    const enemy2 = game.scene.getEnemyField()[1];

    game.field.mockAbility(enemy2, AbilityId.STORM_DRAIN);

    game.move.select(MoveId.WATER_GUN, BattlerIndex.PLAYER, BattlerIndex.ENEMY);
    game.move.select(MoveId.SPLASH, BattlerIndex.PLAYER_2);
    await game.phaseInterceptor.to("BerryPhase");

    expect(enemy1.isFullHp()).toBe(true);
  });

  it("should not redirect non-water type moves", async () => {
    game.override.moveset([MoveId.SPLASH, MoveId.AERIAL_ACE]);
    await game.classicMode.startBattle([SpeciesId.FEEBAS, SpeciesId.MAGIKARP]);

    const enemy1 = game.scene.getEnemyField()[0];
    const enemy2 = game.scene.getEnemyField()[1];

    game.field.mockAbility(enemy2, AbilityId.STORM_DRAIN);

    game.move.select(MoveId.AERIAL_ACE, BattlerIndex.PLAYER, BattlerIndex.ENEMY);
    game.move.select(MoveId.SPLASH, BattlerIndex.PLAYER_2);
    await game.phaseInterceptor.to("BerryPhase");

    expect(enemy1.isFullHp()).toBe(false);
  });

  it("should boost the user's spatk without damaging", async () => {
    await game.classicMode.startBattle([SpeciesId.FEEBAS, SpeciesId.MAGIKARP]);

    const enemy2 = game.scene.getEnemyField()[1];
    game.field.mockAbility(enemy2, AbilityId.STORM_DRAIN);

    game.move.select(MoveId.WATER_GUN, BattlerIndex.PLAYER, BattlerIndex.ENEMY);
    game.move.select(MoveId.SPLASH, BattlerIndex.PLAYER_2);
    await game.phaseInterceptor.to("BerryPhase");

    expect(enemy2.isFullHp()).toBe(true);
    expect(enemy2.getStatStage(Stat.SPATK)).toBe(1);
  });

  it("should not redirect moves changed from water type via ability", async () => {
    game.override.ability(AbilityId.NORMALIZE);
    await game.classicMode.startBattle([SpeciesId.FEEBAS, SpeciesId.MAGIKARP]);

    const enemy1 = game.scene.getEnemyField()[0];
    const enemy2 = game.scene.getEnemyField()[1];
    game.field.mockAbility(enemy2, AbilityId.STORM_DRAIN);

    game.move.select(MoveId.WATER_GUN, BattlerIndex.PLAYER, BattlerIndex.ENEMY);
    game.move.select(MoveId.SPLASH, BattlerIndex.PLAYER_2);
    await game.phaseInterceptor.to("BerryPhase");

    expect(enemy1.isFullHp()).toBe(false);
  });

  it("should redirect moves changed to water type via ability", async () => {
    game.override.ability(AbilityId.LIQUID_VOICE);
    await game.classicMode.startBattle([SpeciesId.FEEBAS]);

    const enemy1 = game.scene.getEnemyField()[0];
    const enemy2 = game.scene.getEnemyField()[1];

    game.field.mockAbility(enemy2, AbilityId.STORM_DRAIN);

    game.move.use(MoveId.ROUND, BattlerIndex.PLAYER, BattlerIndex.ENEMY);
    await game.phaseInterceptor.to("BerryPhase");

    expect(enemy1.isFullHp()).toBe(true);
    expect(enemy2.getStatStage(Stat.SPATK)).toBe(1);
  });
});
