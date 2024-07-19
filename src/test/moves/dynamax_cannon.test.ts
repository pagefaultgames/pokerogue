import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import Phaser from "phaser";
import GameManager from "#app/test/utils/gameManager";
import overrides from "#app/overrides";
import { MoveEffectPhase, DamagePhase, TurnStartPhase } from "#app/phases";
import { getMovePosition } from "#app/test/utils/gameManagerUtils";
import { allMoves } from "#app/data/move";
import { Moves } from "#enums/moves";
import { Species } from "#enums/species";
import { BattlerIndex } from "#app/battle";

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

    vi.spyOn(overrides, "MOVESET_OVERRIDE", "get").mockReturnValue([ dynamaxCannon.id ]);
    vi.spyOn(overrides, "STARTING_LEVEL_OVERRIDE", "get").mockReturnValue(200);

    // Note that, for Waves 1-10, the level cap is 10
    vi.spyOn(overrides, "STARTING_WAVE_OVERRIDE", "get").mockReturnValue(1);
    vi.spyOn(overrides, "SINGLE_BATTLE_OVERRIDE", "get").mockReturnValue(true);
    vi.spyOn(overrides, "NEVER_CRIT_OVERRIDE", "get").mockReturnValue(true);

    vi.spyOn(overrides, "OPP_SPECIES_OVERRIDE", "get").mockReturnValue(Species.MAGIKARP);
    vi.spyOn(overrides, "OPP_MOVESET_OVERRIDE", "get").mockReturnValue([ Moves.SPLASH, Moves.SPLASH, Moves.SPLASH, Moves.SPLASH ]);

    vi.spyOn(dynamaxCannon, "calculateBattlePower");
  });

  it("DYNAMAX CANNON against enemy below level cap", async() => {
    vi.spyOn(overrides, "OPP_LEVEL_OVERRIDE", "get").mockReturnValue(1);
    await game.startBattle([
      Species.ETERNATUS,
    ]);

    game.doAttack(getMovePosition(game.scene, 0, dynamaxCannon.id));

    await game.phaseInterceptor.to(MoveEffectPhase, false);
    expect((game.scene.getCurrentPhase() as MoveEffectPhase).move.moveId).toBe(dynamaxCannon.id);
    await game.phaseInterceptor.to(DamagePhase, false);
    expect(dynamaxCannon.calculateBattlePower).toHaveLastReturnedWith(100);
  }, 20000);

  it("DYNAMAX CANNON against enemy exactly at level cap", async() => {
    vi.spyOn(overrides, "OPP_LEVEL_OVERRIDE", "get").mockReturnValue(10);
    await game.startBattle([
      Species.ETERNATUS,
    ]);

    game.doAttack(getMovePosition(game.scene, 0, dynamaxCannon.id));

    await game.phaseInterceptor.to(MoveEffectPhase, false);
    expect((game.scene.getCurrentPhase() as MoveEffectPhase).move.moveId).toBe(dynamaxCannon.id);
    await game.phaseInterceptor.to(DamagePhase, false);
    expect(dynamaxCannon.calculateBattlePower).toHaveLastReturnedWith(100);
  }, 20000);

  it("DYNAMAX CANNON against enemy exactly at 1% above level cap", async() => {
    vi.spyOn(overrides, "OPP_LEVEL_OVERRIDE", "get").mockReturnValue(101);
    await game.startBattle([
      Species.ETERNATUS,
    ]);

    game.doAttack(getMovePosition(game.scene, 0, dynamaxCannon.id));

    await game.phaseInterceptor.to(MoveEffectPhase, false);
    const phase = game.scene.getCurrentPhase() as MoveEffectPhase;
    expect(phase.move.moveId).toBe(dynamaxCannon.id);
    // Force level cap to be 100
    vi.spyOn(phase.getTarget().scene, "getMaxExpLevel").mockReturnValue(100);
    await game.phaseInterceptor.to(DamagePhase, false);
    expect(dynamaxCannon.calculateBattlePower).toHaveLastReturnedWith(120);
  }, 20000);

  it("DYNAMAX CANNON against enemy exactly at 2% above level cap", async() => {
    vi.spyOn(overrides, "OPP_LEVEL_OVERRIDE", "get").mockReturnValue(102);
    await game.startBattle([
      Species.ETERNATUS,
    ]);

    game.doAttack(getMovePosition(game.scene, 0, dynamaxCannon.id));

    await game.phaseInterceptor.to(MoveEffectPhase, false);
    const phase = game.scene.getCurrentPhase() as MoveEffectPhase;
    expect(phase.move.moveId).toBe(dynamaxCannon.id);
    // Force level cap to be 100
    vi.spyOn(phase.getTarget().scene, "getMaxExpLevel").mockReturnValue(100);
    await game.phaseInterceptor.to(DamagePhase, false);
    expect(dynamaxCannon.calculateBattlePower).toHaveLastReturnedWith(140);
  }, 20000);

  it("DYNAMAX CANNON against enemy exactly at 3% above level cap", async() => {
    vi.spyOn(overrides, "OPP_LEVEL_OVERRIDE", "get").mockReturnValue(103);
    await game.startBattle([
      Species.ETERNATUS,
    ]);

    game.doAttack(getMovePosition(game.scene, 0, dynamaxCannon.id));

    await game.phaseInterceptor.to(MoveEffectPhase, false);
    const phase = game.scene.getCurrentPhase() as MoveEffectPhase;
    expect(phase.move.moveId).toBe(dynamaxCannon.id);
    // Force level cap to be 100
    vi.spyOn(phase.getTarget().scene, "getMaxExpLevel").mockReturnValue(100);
    await game.phaseInterceptor.to(DamagePhase, false);
    expect(dynamaxCannon.calculateBattlePower).toHaveLastReturnedWith(160);
  }, 20000);

  it("DYNAMAX CANNON against enemy exactly at 4% above level cap", async() => {
    vi.spyOn(overrides, "OPP_LEVEL_OVERRIDE", "get").mockReturnValue(104);
    await game.startBattle([
      Species.ETERNATUS,
    ]);

    game.doAttack(getMovePosition(game.scene, 0, dynamaxCannon.id));

    await game.phaseInterceptor.to(MoveEffectPhase, false);
    const phase = game.scene.getCurrentPhase() as MoveEffectPhase;
    expect(phase.move.moveId).toBe(dynamaxCannon.id);
    // Force level cap to be 100
    vi.spyOn(phase.getTarget().scene, "getMaxExpLevel").mockReturnValue(100);
    await game.phaseInterceptor.to(DamagePhase, false);
    expect(dynamaxCannon.calculateBattlePower).toHaveLastReturnedWith(180);
  }, 20000);

  it("DYNAMAX CANNON against enemy exactly at 5% above level cap", async() => {
    vi.spyOn(overrides, "OPP_LEVEL_OVERRIDE", "get").mockReturnValue(105);
    await game.startBattle([
      Species.ETERNATUS,
    ]);

    game.doAttack(getMovePosition(game.scene, 0, dynamaxCannon.id));

    await game.phaseInterceptor.to(MoveEffectPhase, false);
    const phase = game.scene.getCurrentPhase() as MoveEffectPhase;
    expect(phase.move.moveId).toBe(dynamaxCannon.id);
    // Force level cap to be 100
    vi.spyOn(phase.getTarget().scene, "getMaxExpLevel").mockReturnValue(100);
    await game.phaseInterceptor.to(DamagePhase, false);
    expect(dynamaxCannon.calculateBattlePower).toHaveLastReturnedWith(200);
  }, 20000);

  it("DYNAMAX CANNON against enemy way above level cap", async() => {
    vi.spyOn(overrides, "OPP_LEVEL_OVERRIDE", "get").mockReturnValue(999);
    await game.startBattle([
      Species.ETERNATUS,
    ]);

    game.doAttack(getMovePosition(game.scene, 0, dynamaxCannon.id));

    await game.phaseInterceptor.to(TurnStartPhase, false);
    // Force user to act before enemy
    vi.spyOn((game.scene.getCurrentPhase() as TurnStartPhase), "getOrder").mockReturnValue([ BattlerIndex.PLAYER, BattlerIndex. ENEMY]);

    await game.phaseInterceptor.to(MoveEffectPhase, false);
    expect((game.scene.getCurrentPhase() as MoveEffectPhase).move.moveId).toBe(dynamaxCannon.id);
    await game.phaseInterceptor.to(DamagePhase, false);
    expect(dynamaxCannon.calculateBattlePower).toHaveLastReturnedWith(200);
  }, 20000);
});
