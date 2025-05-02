import { BattlerIndex } from "#app/battle";
import { Abilities } from "#enums/abilities";
import { Moves } from "#enums/moves";
import { Species } from "#enums/species";
import { Stat } from "#enums/stat";
import GameManager from "#test/testUtils/gameManager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";

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
      .moveset([Moves.SPLASH, Moves.WATER_GUN])
      .ability(Abilities.BALL_FETCH)
      .battleStyle("double")
      .disableCrits()
      .enemySpecies(Species.MAGIKARP)
      .enemyAbility(Abilities.BALL_FETCH)
      .enemyMoveset(Moves.SPLASH);
  });

  it("should redirect water type moves", async () => {
    await game.classicMode.startBattle([Species.FEEBAS, Species.MAGIKARP]);

    const enemy1 = game.scene.getEnemyField()[0];
    const enemy2 = game.scene.getEnemyField()[1];

    enemy2.summonData.ability = Abilities.STORM_DRAIN;

    game.move.select(Moves.WATER_GUN, BattlerIndex.PLAYER, BattlerIndex.ENEMY);
    game.move.select(Moves.SPLASH, BattlerIndex.PLAYER_2);
    await game.phaseInterceptor.to("BerryPhase");

    expect(enemy1.isFullHp()).toBe(true);
  });

  it("should not redirect non-water type moves", async () => {
    game.override.moveset([Moves.SPLASH, Moves.AERIAL_ACE]);
    await game.classicMode.startBattle([Species.FEEBAS, Species.MAGIKARP]);

    const enemy1 = game.scene.getEnemyField()[0];
    const enemy2 = game.scene.getEnemyField()[1];

    enemy2.summonData.ability = Abilities.STORM_DRAIN;

    game.move.select(Moves.AERIAL_ACE, BattlerIndex.PLAYER, BattlerIndex.ENEMY);
    game.move.select(Moves.SPLASH, BattlerIndex.PLAYER_2);
    await game.phaseInterceptor.to("BerryPhase");

    expect(enemy1.isFullHp()).toBe(false);
  });

  it("should boost the user's spatk without damaging", async () => {
    await game.classicMode.startBattle([Species.FEEBAS, Species.MAGIKARP]);

    const enemy2 = game.scene.getEnemyField()[1];

    enemy2.summonData.ability = Abilities.STORM_DRAIN;

    game.move.select(Moves.WATER_GUN, BattlerIndex.PLAYER, BattlerIndex.ENEMY);
    game.move.select(Moves.SPLASH, BattlerIndex.PLAYER_2);
    await game.phaseInterceptor.to("BerryPhase");

    expect(enemy2.isFullHp()).toBe(true);
    expect(enemy2.getStatStage(Stat.SPATK)).toBe(1);
  });

  it("should not redirect moves changed from water type via ability", async () => {
    game.override.ability(Abilities.NORMALIZE);
    await game.classicMode.startBattle([Species.FEEBAS, Species.MAGIKARP]);

    const enemy1 = game.scene.getEnemyField()[0];
    const enemy2 = game.scene.getEnemyField()[1];

    enemy2.summonData.ability = Abilities.STORM_DRAIN;

    game.move.select(Moves.WATER_GUN, BattlerIndex.PLAYER, BattlerIndex.ENEMY);
    game.move.select(Moves.SPLASH, BattlerIndex.PLAYER_2);
    await game.phaseInterceptor.to("BerryPhase");

    expect(enemy1.isFullHp()).toBe(false);
  });

  it("should redirect moves changed to water type via ability", async () => {
    game.override.ability(Abilities.LIQUID_VOICE).moveset(Moves.PSYCHIC_NOISE);
    await game.classicMode.startBattle([Species.FEEBAS, Species.MAGIKARP]);

    const enemy1 = game.scene.getEnemyField()[0];
    const enemy2 = game.scene.getEnemyField()[1];

    enemy2.summonData.ability = Abilities.STORM_DRAIN;

    game.move.select(Moves.PSYCHIC_NOISE, BattlerIndex.PLAYER, BattlerIndex.ENEMY);
    game.move.select(Moves.SPLASH, BattlerIndex.PLAYER_2);
    await game.phaseInterceptor.to("BerryPhase");

    expect(enemy1.isFullHp()).toBe(true);
    expect(enemy2.getStatStage(Stat.SPATK)).toBe(1);
  });
});
