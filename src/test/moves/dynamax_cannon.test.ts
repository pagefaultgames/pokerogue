import { BattlerIndex } from "#app/battle";
import { allMoves } from "#app/data/move";
import { DamagePhase } from "#app/phases/damage-phase";
import { MoveEffectPhase } from "#app/phases/move-effect-phase";
import { Moves } from "#enums/moves";
import { Species } from "#enums/species";
import GameManager from "#test/utils/gameManager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

describe("Moves - Dynamax Cannon", () => {
  let phaserGame: Phaser.Game;
  let game: GameManager;

  const dynamaxCannon = allMoves[Moves.DYNAMAX_CANNON];

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

    game.override.moveset([dynamaxCannon.id]);
    game.override.startingLevel(200);

    // Note that, for Waves 1-10, the level cap is 10
    game.override.startingWave(1);
    game.override.battleType("single");
    game.override.disableCrits();

    game.override.enemySpecies(Species.MAGIKARP);
    game.override.enemyMoveset([Moves.SPLASH, Moves.SPLASH, Moves.SPLASH, Moves.SPLASH]);

    vi.spyOn(dynamaxCannon, "calculateBattlePower");
  });

  it("should return 100 power against an enemy below level cap", async () => {
    game.override.enemyLevel(1);
    await game.startBattle([
      Species.ETERNATUS,
    ]);

    game.move.select(dynamaxCannon.id);

    await game.phaseInterceptor.to(MoveEffectPhase, false);
    expect((game.scene.getCurrentPhase() as MoveEffectPhase).move.moveId).toBe(dynamaxCannon.id);
    await game.phaseInterceptor.to(DamagePhase, false);
    expect(dynamaxCannon.calculateBattlePower).toHaveLastReturnedWith(100);
  }, 20000);

  it("should return 100 power against an enemy at level cap", async () => {
    game.override.enemyLevel(10);
    await game.startBattle([
      Species.ETERNATUS,
    ]);

    game.move.select(dynamaxCannon.id);

    await game.phaseInterceptor.to(MoveEffectPhase, false);
    expect((game.scene.getCurrentPhase() as MoveEffectPhase).move.moveId).toBe(dynamaxCannon.id);
    await game.phaseInterceptor.to(DamagePhase, false);
    expect(dynamaxCannon.calculateBattlePower).toHaveLastReturnedWith(100);
  }, 20000);

  it("should return 120 power against an enemy 1% above level cap", async () => {
    game.override.enemyLevel(101);
    await game.startBattle([
      Species.ETERNATUS,
    ]);

    game.move.select(dynamaxCannon.id);

    await game.phaseInterceptor.to(MoveEffectPhase, false);
    const phase = game.scene.getCurrentPhase() as MoveEffectPhase;
    expect(phase.move.moveId).toBe(dynamaxCannon.id);
    // Force level cap to be 100
    vi.spyOn(phase.getTarget()!.scene, "getMaxExpLevel").mockReturnValue(100);
    await game.phaseInterceptor.to(DamagePhase, false);
    expect(dynamaxCannon.calculateBattlePower).toHaveLastReturnedWith(120);
  }, 20000);

  it("should return 140 power against an enemy 2% above level capp", async () => {
    game.override.enemyLevel(102);
    await game.startBattle([
      Species.ETERNATUS,
    ]);

    game.move.select(dynamaxCannon.id);

    await game.phaseInterceptor.to(MoveEffectPhase, false);
    const phase = game.scene.getCurrentPhase() as MoveEffectPhase;
    expect(phase.move.moveId).toBe(dynamaxCannon.id);
    // Force level cap to be 100
    vi.spyOn(phase.getTarget()!.scene, "getMaxExpLevel").mockReturnValue(100);
    await game.phaseInterceptor.to(DamagePhase, false);
    expect(dynamaxCannon.calculateBattlePower).toHaveLastReturnedWith(140);
  }, 20000);

  it("should return 160 power against an enemy 3% above level cap", async () => {
    game.override.enemyLevel(103);
    await game.startBattle([
      Species.ETERNATUS,
    ]);

    game.move.select(dynamaxCannon.id);

    await game.phaseInterceptor.to(MoveEffectPhase, false);
    const phase = game.scene.getCurrentPhase() as MoveEffectPhase;
    expect(phase.move.moveId).toBe(dynamaxCannon.id);
    // Force level cap to be 100
    vi.spyOn(phase.getTarget()!.scene, "getMaxExpLevel").mockReturnValue(100);
    await game.phaseInterceptor.to(DamagePhase, false);
    expect(dynamaxCannon.calculateBattlePower).toHaveLastReturnedWith(160);
  }, 20000);

  it("should return 180 power against an enemy 4% above level cap", async () => {
    game.override.enemyLevel(104);
    await game.startBattle([
      Species.ETERNATUS,
    ]);

    game.move.select(dynamaxCannon.id);

    await game.phaseInterceptor.to(MoveEffectPhase, false);
    const phase = game.scene.getCurrentPhase() as MoveEffectPhase;
    expect(phase.move.moveId).toBe(dynamaxCannon.id);
    // Force level cap to be 100
    vi.spyOn(phase.getTarget()!.scene, "getMaxExpLevel").mockReturnValue(100);
    await game.phaseInterceptor.to(DamagePhase, false);
    expect(dynamaxCannon.calculateBattlePower).toHaveLastReturnedWith(180);
  }, 20000);

  it("should return 200 power against an enemy 5% above level cap", async () => {
    game.override.enemyLevel(105);
    await game.startBattle([
      Species.ETERNATUS,
    ]);

    game.move.select(dynamaxCannon.id);

    await game.phaseInterceptor.to(MoveEffectPhase, false);
    const phase = game.scene.getCurrentPhase() as MoveEffectPhase;
    expect(phase.move.moveId).toBe(dynamaxCannon.id);
    // Force level cap to be 100
    vi.spyOn(phase.getTarget()!.scene, "getMaxExpLevel").mockReturnValue(100);
    await game.phaseInterceptor.to(DamagePhase, false);
    expect(dynamaxCannon.calculateBattlePower).toHaveLastReturnedWith(200);
  }, 20000);

  it("should return 200 power against an enemy way above level cap", async () => {
    game.override.enemyLevel(999);
    await game.startBattle([
      Species.ETERNATUS,
    ]);

    game.move.select(dynamaxCannon.id);
    await game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.ENEMY]);

    await game.phaseInterceptor.to(MoveEffectPhase, false);
    expect((game.scene.getCurrentPhase() as MoveEffectPhase).move.moveId).toBe(dynamaxCannon.id);
    await game.phaseInterceptor.to(DamagePhase, false);
    expect(dynamaxCannon.calculateBattlePower).toHaveLastReturnedWith(200);
  }, 20000);
});
