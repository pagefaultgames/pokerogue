import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import Phaser from "phaser";
import GameManager from "#app/test/utils/gameManager";
import * as overrides from "#app/overrides";
import { Species } from "#enums/species";
import { MoveEffectPhase } from "#app/phases";
import { Moves } from "#enums/moves";
import { getMovePosition } from "#app/test/utils/gameManagerUtils";
import { Stat } from "#app/data/pokemon-stat";
import { applyMoveAttrs, VariablePowerAttr } from "#app/data/move";
import * as Utils from "#app/utils";

describe("Moves - Dynamax Cannon", () => {
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
    const moveToUse = Moves.DYNAMAX_CANNON;

    // Note that, for Waves 1-10, the level cap is 10
    vi.spyOn(overrides, "STARTING_WAVE_OVERRIDE", "get").mockReturnValue(1);
    vi.spyOn(overrides, "SINGLE_BATTLE_OVERRIDE", "get").mockReturnValue(true);
    vi.spyOn(overrides, "OPP_SPECIES_OVERRIDE", "get").mockReturnValue(Species.MAGIKARP);
    vi.spyOn(overrides, "STARTING_LEVEL_OVERRIDE", "get").mockReturnValue(200);
    vi.spyOn(overrides, "MOVESET_OVERRIDE", "get").mockReturnValue([ moveToUse ]);
    vi.spyOn(overrides, "OPP_MOVESET_OVERRIDE", "get").mockReturnValue([ Moves.SPLASH, Moves.SPLASH, Moves.SPLASH, Moves.SPLASH ]);
    vi.spyOn(overrides, "NEVER_CRIT_OVERRIDE", "get").mockReturnValue(true);
  });

  it("DYNAMAX CANNON against enemy below level cap", async() => {
    vi.spyOn(overrides, "OPP_LEVEL_OVERRIDE", "get").mockReturnValue(1);
    const moveToUse = Moves.DYNAMAX_CANNON;
    await game.startBattle([
      Species.ETERNATUS,
    ]);

    game.doAttack(getMovePosition(game.scene, 0, moveToUse));

    await game.phaseInterceptor.to(MoveEffectPhase, false);

    // Check initial base power of Dynamax Cannon
    const phase = game.scene.getCurrentPhase() as MoveEffectPhase;
    const move = phase.move.getMove();
    expect(move.id).toBe(moveToUse);
    expect(move.power).toBe(100);

    // Check base power of Dynamax Cannon in context
    const power = new Utils.IntegerHolder(move.power);
    applyMoveAttrs(VariablePowerAttr, phase.getUserPokemon(), phase.getTarget(), move, power);
    expect(power.value).toBe(100);
  }, 20000);

  it("DYNAMAX CANNON against enemy at level cap", async() => {
    vi.spyOn(overrides, "OPP_LEVEL_OVERRIDE", "get").mockReturnValue(10);
    const moveToUse = Moves.DYNAMAX_CANNON;
    await game.startBattle([
      Species.ETERNATUS,
    ]);

    game.doAttack(getMovePosition(game.scene, 0, moveToUse));

    await game.phaseInterceptor.to(MoveEffectPhase, false);

    // Check initial base power of Dynamax Cannon
    const phase = game.scene.getCurrentPhase() as MoveEffectPhase;
    const move = phase.move.getMove();
    expect(move.id).toBe(moveToUse);
    expect(move.power).toBe(100);

    // Check base power of Dynamax Cannon in context
    const power = new Utils.IntegerHolder(move.power);
    applyMoveAttrs(VariablePowerAttr, phase.getUserPokemon(), phase.getTarget(), move, power);
    expect(power.value).toBe(100);
  }, 20000);

  it("DYNAMAX CANNON against enemy at 1% above level cap", async() => {
    vi.spyOn(overrides, "OPP_LEVEL_OVERRIDE", "get").mockReturnValue(101);
    const moveToUse = Moves.DYNAMAX_CANNON;
    await game.startBattle([
      Species.ETERNATUS,
    ]);

    game.doAttack(getMovePosition(game.scene, 0, moveToUse));

    await game.phaseInterceptor.to(MoveEffectPhase, false);

    // Check initial base power of Dynamax Cannon
    const phase = game.scene.getCurrentPhase() as MoveEffectPhase;
    const move = phase.move.getMove();
    expect(move.id).toBe(moveToUse);
    expect(move.power).toBe(100);

    const target = phase.getTarget();
    // Force level cap to be 100; that is, level cap is no longer 10
    target.scene.getMaxExpLevel = vi.fn().mockReturnValue(100);

    // Check base power of Dynamax Cannon in context
    const power = new Utils.IntegerHolder(move.power);
    applyMoveAttrs(VariablePowerAttr, phase.getUserPokemon(), target, move, power);
    expect(power.value).toBe(120);
  }, 20000);

  it("DYNAMAX CANNON against enemy at 2% above level cap", async() => {
    vi.spyOn(overrides, "OPP_LEVEL_OVERRIDE", "get").mockReturnValue(102);
    const moveToUse = Moves.DYNAMAX_CANNON;
    await game.startBattle([
      Species.ETERNATUS,
    ]);

    game.doAttack(getMovePosition(game.scene, 0, moveToUse));

    await game.phaseInterceptor.to(MoveEffectPhase, false);

    // Check initial base power of Dynamax Cannon
    const phase = game.scene.getCurrentPhase() as MoveEffectPhase;
    const move = phase.move.getMove();
    expect(move.id).toBe(moveToUse);
    expect(move.power).toBe(100);

    const target = phase.getTarget();
    target.scene.getMaxExpLevel = vi.fn().mockReturnValue(100);

    // Check base power of Dynamax Cannon in context
    const power = new Utils.IntegerHolder(move.power);
    applyMoveAttrs(VariablePowerAttr, phase.getUserPokemon(), target, move, power);
    expect(power.value).toBe(140);
  }, 20000);

  it("DYNAMAX CANNON against enemy at 3% above level cap", async() => {
    vi.spyOn(overrides, "OPP_LEVEL_OVERRIDE", "get").mockReturnValue(103);
    const moveToUse = Moves.DYNAMAX_CANNON;
    await game.startBattle([
      Species.ETERNATUS,
    ]);

    game.doAttack(getMovePosition(game.scene, 0, moveToUse));

    await game.phaseInterceptor.to(MoveEffectPhase, false);

    // Check initial base power of Dynamax Cannon
    const phase = game.scene.getCurrentPhase() as MoveEffectPhase;
    const move = phase.move.getMove();
    expect(move.id).toBe(moveToUse);
    expect(move.power).toBe(100);

    const target = phase.getTarget();
    target.scene.getMaxExpLevel = vi.fn().mockReturnValue(100);

    // Check base power of Dynamax Cannon in context
    const power = new Utils.IntegerHolder(move.power);
    applyMoveAttrs(VariablePowerAttr, phase.getUserPokemon(), target, move, power);
    expect(power.value).toBe(160);
  }, 20000);

  it("DYNAMAX CANNON against enemy at 4% above level cap", async() => {
    vi.spyOn(overrides, "OPP_LEVEL_OVERRIDE", "get").mockReturnValue(104);
    const moveToUse = Moves.DYNAMAX_CANNON;
    await game.startBattle([
      Species.ETERNATUS,
    ]);

    game.doAttack(getMovePosition(game.scene, 0, moveToUse));

    await game.phaseInterceptor.to(MoveEffectPhase, false);

    // Check initial base power of Dynamax Cannon
    const phase = game.scene.getCurrentPhase() as MoveEffectPhase;
    const move = phase.move.getMove();
    expect(move.id).toBe(moveToUse);
    expect(move.power).toBe(100);

    const target = phase.getTarget();
    target.scene.getMaxExpLevel = vi.fn().mockReturnValue(100);

    // Check base power of Dynamax Cannon in context
    const power = new Utils.IntegerHolder(move.power);
    applyMoveAttrs(VariablePowerAttr, phase.getUserPokemon(), target, move, power);
    expect(power.value).toBe(180);
  }, 20000);

  it("DYNAMAX CANNON against enemy at 5% above level cap", async() => {
    vi.spyOn(overrides, "OPP_LEVEL_OVERRIDE", "get").mockReturnValue(105);
    const moveToUse = Moves.DYNAMAX_CANNON;
    await game.startBattle([
      Species.ETERNATUS,
    ]);

    game.doAttack(getMovePosition(game.scene, 0, moveToUse));

    await game.phaseInterceptor.to(MoveEffectPhase, false);

    // Check initial base power of Dynamax Cannon
    const phase = game.scene.getCurrentPhase() as MoveEffectPhase;
    const move = phase.move.getMove();
    expect(move.id).toBe(moveToUse);
    expect(move.power).toBe(100);

    const target = phase.getTarget();
    target.scene.getMaxExpLevel = vi.fn().mockReturnValue(100);

    // Check base power of Dynamax Cannon in context
    const power = new Utils.IntegerHolder(move.power);
    applyMoveAttrs(VariablePowerAttr, phase.getUserPokemon(), target, move, power);
    expect(power.value).toBe(200);
  }, 20000);

  it("DYNAMAX CANNON against enemy way above level cap", async() => {
    vi.spyOn(overrides, "OPP_LEVEL_OVERRIDE", "get").mockReturnValue(999);
    const moveToUse = Moves.DYNAMAX_CANNON;
    await game.startBattle([
      Species.ETERNATUS,
    ]);

    // Force enemy to go last
    game.scene.getEnemyParty()[0].stats[Stat.SPD] = 1;

    game.doAttack(getMovePosition(game.scene, 0, moveToUse));

    await game.phaseInterceptor.to(MoveEffectPhase, false);

    // Check initial base power of Dynamax Cannon
    const phase = game.scene.getCurrentPhase() as MoveEffectPhase;
    const move = phase.move.getMove();
    expect(move.id).toBe(moveToUse);
    expect(move.power).toBe(100);

    // Check base power of Dynamax Cannon in context
    const power = new Utils.IntegerHolder(move.power);
    applyMoveAttrs(VariablePowerAttr, phase.getUserPokemon(), phase.getTarget(), move, power);
    expect(power.value).toBe(200);
  }, 20000);
});
