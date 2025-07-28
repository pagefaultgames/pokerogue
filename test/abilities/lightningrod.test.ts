import { AbilityId } from "#enums/ability-id";
import { BattlerIndex } from "#enums/battler-index";
import { MoveId } from "#enums/move-id";
import { SpeciesId } from "#enums/species-id";
import { Stat } from "#enums/stat";
import { GameManager } from "#test/test-utils/game-manager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";

describe("Abilities - Lightningrod", () => {
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
      .moveset([MoveId.SPLASH, MoveId.SHOCK_WAVE])
      .ability(AbilityId.BALL_FETCH)
      .battleStyle("double")
      .criticalHits(false)
      .enemySpecies(SpeciesId.MAGIKARP)
      .enemyAbility(AbilityId.BALL_FETCH)
      .enemyMoveset(MoveId.SPLASH);
  });

  it("should redirect electric type moves", async () => {
    await game.classicMode.startBattle([SpeciesId.FEEBAS, SpeciesId.MAGIKARP]);

    const [enemy1, enemy2] = game.scene.getEnemyField();
    game.field.mockAbility(enemy2, AbilityId.LIGHTNING_ROD);

    game.move.select(MoveId.SHOCK_WAVE, BattlerIndex.PLAYER, BattlerIndex.ENEMY);
    game.move.select(MoveId.SPLASH, BattlerIndex.PLAYER_2);
    await game.phaseInterceptor.to("BerryPhase");

    expect(enemy1.isFullHp()).toBe(true);
  });

  it("should not redirect non-electric type moves", async () => {
    game.override.moveset([MoveId.SPLASH, MoveId.AERIAL_ACE]);
    await game.classicMode.startBattle([SpeciesId.FEEBAS, SpeciesId.MAGIKARP]);

    const [enemy1, enemy2] = game.scene.getEnemyField();
    game.field.mockAbility(enemy2, AbilityId.LIGHTNING_ROD);

    game.move.select(MoveId.AERIAL_ACE, BattlerIndex.PLAYER, BattlerIndex.ENEMY);
    game.move.select(MoveId.SPLASH, BattlerIndex.PLAYER_2);
    await game.phaseInterceptor.to("BerryPhase");

    expect(enemy1.isFullHp()).toBe(false);
  });

  it("should boost the user's spatk without damaging", async () => {
    await game.classicMode.startBattle([SpeciesId.FEEBAS, SpeciesId.MAGIKARP]);

    const enemy2 = game.scene.getEnemyField()[1];
    game.field.mockAbility(enemy2, AbilityId.LIGHTNING_ROD);

    game.move.select(MoveId.SHOCK_WAVE, BattlerIndex.PLAYER, BattlerIndex.ENEMY);
    game.move.select(MoveId.SPLASH, BattlerIndex.PLAYER_2);
    await game.phaseInterceptor.to("BerryPhase");

    expect(enemy2.isFullHp()).toBe(true);
    expect(enemy2.getStatStage(Stat.SPATK)).toBe(1);
  });

  it("should not redirect moves changed from electric type via ability", async () => {
    game.override.ability(AbilityId.NORMALIZE);
    await game.classicMode.startBattle([SpeciesId.FEEBAS]);

    const [enemy1, enemy2] = game.scene.getEnemyField();
    game.field.mockAbility(enemy2, AbilityId.LIGHTNING_ROD);

    game.move.select(MoveId.SHOCK_WAVE, BattlerIndex.PLAYER, BattlerIndex.ENEMY);
    await game.phaseInterceptor.to("BerryPhase");

    expect(enemy1.isFullHp()).toBe(false);
  });

  it("should redirect moves changed to electric type via ability", async () => {
    game.override.ability(AbilityId.GALVANIZE);
    await game.classicMode.startBattle([SpeciesId.FEEBAS]);

    const [enemy1, enemy2] = game.scene.getEnemyField();
    game.field.mockAbility(enemy2, AbilityId.LIGHTNING_ROD);

    game.move.use(MoveId.TACKLE, BattlerIndex.PLAYER, BattlerIndex.ENEMY);
    await game.phaseInterceptor.to("BerryPhase");

    expect(enemy1.isFullHp()).toBe(true);
    expect(enemy2.getStatStage(Stat.SPATK)).toBe(1);
  });
});
