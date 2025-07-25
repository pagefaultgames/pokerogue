import { allMoves } from "#data/data-lists";
import { BattlerIndex } from "#enums/battler-index";
import { MoveId } from "#enums/move-id";
import { SpeciesId } from "#enums/species-id";
import type { Move } from "#moves/move";
import { DamageAnimPhase } from "#phases/damage-anim-phase";
import { MoveEffectPhase } from "#phases/move-effect-phase";
import { GameManager } from "#test/test-utils/game-manager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

describe("Moves - Dynamax Cannon", () => {
  let phaserGame: Phaser.Game;
  let game: GameManager;

  let dynamaxCannon: Move;

  beforeAll(() => {
    phaserGame = new Phaser.Game({
      type: Phaser.HEADLESS,
    });
  });

  afterEach(() => {
    game.phaseInterceptor.restoreOg();
  });

  beforeEach(() => {
    dynamaxCannon = allMoves[MoveId.DYNAMAX_CANNON];
    game = new GameManager(phaserGame);

    game.override
      .moveset(MoveId.DYNAMAX_CANNON)
      .startingLevel(200)
      .levelCap(100)
      .battleStyle("single")
      .criticalHits(false)
      .enemySpecies(SpeciesId.MAGIKARP)
      .enemyMoveset(MoveId.SPLASH);

    vi.spyOn(dynamaxCannon, "calculateBattlePower");
  });

  it("should return 100 power against an enemy below level cap", async () => {
    game.override.enemyLevel(1);
    await game.classicMode.startBattle([SpeciesId.ETERNATUS]);

    game.move.select(dynamaxCannon.id);

    await game.phaseInterceptor.to(MoveEffectPhase, false);
    expect((game.scene.phaseManager.getCurrentPhase() as MoveEffectPhase).move.id).toBe(dynamaxCannon.id);
    await game.phaseInterceptor.to(DamageAnimPhase, false);
    expect(dynamaxCannon.calculateBattlePower).toHaveLastReturnedWith(100);
  });

  it("should return 100 power against an enemy at level cap", async () => {
    game.override.enemyLevel(100);
    await game.classicMode.startBattle([SpeciesId.ETERNATUS]);

    game.move.select(dynamaxCannon.id);

    await game.phaseInterceptor.to(MoveEffectPhase, false);
    expect((game.scene.phaseManager.getCurrentPhase() as MoveEffectPhase).move.id).toBe(dynamaxCannon.id);
    await game.phaseInterceptor.to(DamageAnimPhase, false);
    expect(dynamaxCannon.calculateBattlePower).toHaveLastReturnedWith(100);
  });

  it("should return 120 power against an enemy 1% above level cap", async () => {
    game.override.enemyLevel(101);
    await game.classicMode.startBattle([SpeciesId.ETERNATUS]);

    game.move.select(dynamaxCannon.id);

    await game.phaseInterceptor.to(MoveEffectPhase, false);
    const phase = game.scene.phaseManager.getCurrentPhase() as MoveEffectPhase;
    expect(phase.move.id).toBe(dynamaxCannon.id);
    // Force level cap to be 100
    vi.spyOn(game.scene, "getMaxExpLevel").mockReturnValue(100);
    await game.phaseInterceptor.to(DamageAnimPhase, false);
    expect(dynamaxCannon.calculateBattlePower).toHaveLastReturnedWith(120);
  });

  it("should return 140 power against an enemy 2% above level capp", async () => {
    game.override.enemyLevel(102);
    await game.classicMode.startBattle([SpeciesId.ETERNATUS]);

    game.move.select(dynamaxCannon.id);

    await game.phaseInterceptor.to(MoveEffectPhase, false);
    const phase = game.scene.phaseManager.getCurrentPhase() as MoveEffectPhase;
    expect(phase.move.id).toBe(dynamaxCannon.id);
    // Force level cap to be 100
    vi.spyOn(game.scene, "getMaxExpLevel").mockReturnValue(100);
    await game.phaseInterceptor.to(DamageAnimPhase, false);
    expect(dynamaxCannon.calculateBattlePower).toHaveLastReturnedWith(140);
  });

  it("should return 160 power against an enemy 3% above level cap", async () => {
    game.override.enemyLevel(103);
    await game.classicMode.startBattle([SpeciesId.ETERNATUS]);

    game.move.select(dynamaxCannon.id);

    await game.phaseInterceptor.to(MoveEffectPhase, false);
    const phase = game.scene.phaseManager.getCurrentPhase() as MoveEffectPhase;
    expect(phase.move.id).toBe(dynamaxCannon.id);
    // Force level cap to be 100
    vi.spyOn(game.scene, "getMaxExpLevel").mockReturnValue(100);
    await game.phaseInterceptor.to(DamageAnimPhase, false);
    expect(dynamaxCannon.calculateBattlePower).toHaveLastReturnedWith(160);
  });

  it("should return 180 power against an enemy 4% above level cap", async () => {
    game.override.enemyLevel(104);
    await game.classicMode.startBattle([SpeciesId.ETERNATUS]);

    game.move.select(dynamaxCannon.id);

    await game.phaseInterceptor.to(MoveEffectPhase, false);
    const phase = game.scene.phaseManager.getCurrentPhase() as MoveEffectPhase;
    expect(phase.move.id).toBe(dynamaxCannon.id);
    // Force level cap to be 100
    vi.spyOn(game.scene, "getMaxExpLevel").mockReturnValue(100);
    await game.phaseInterceptor.to(DamageAnimPhase, false);
    expect(dynamaxCannon.calculateBattlePower).toHaveLastReturnedWith(180);
  });

  it("should return 200 power against an enemy 5% above level cap", async () => {
    game.override.enemyLevel(105);
    await game.classicMode.startBattle([SpeciesId.ETERNATUS]);

    game.move.select(dynamaxCannon.id);

    await game.phaseInterceptor.to(MoveEffectPhase, false);
    const phase = game.scene.phaseManager.getCurrentPhase() as MoveEffectPhase;
    expect(phase.move.id).toBe(dynamaxCannon.id);
    // Force level cap to be 100
    vi.spyOn(game.scene, "getMaxExpLevel").mockReturnValue(100);
    await game.phaseInterceptor.to(DamageAnimPhase, false);
    expect(dynamaxCannon.calculateBattlePower).toHaveLastReturnedWith(200);
  });

  it("should return 200 power against an enemy way above level cap", async () => {
    game.override.enemyLevel(999);
    await game.classicMode.startBattle([SpeciesId.ETERNATUS]);

    game.move.select(dynamaxCannon.id);
    await game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.ENEMY]);

    await game.phaseInterceptor.to(MoveEffectPhase, false);
    expect((game.scene.phaseManager.getCurrentPhase() as MoveEffectPhase).move.id).toBe(dynamaxCannon.id);
    await game.phaseInterceptor.to(DamageAnimPhase, false);
    expect(dynamaxCannon.calculateBattlePower).toHaveLastReturnedWith(200);
  });
});
