import { allMoves } from "#data/data-lists";
import { AbilityId } from "#enums/ability-id";
import { MoveId } from "#enums/move-id";
import { SpeciesId } from "#enums/species-id";
import { MoveEffectPhase } from "#phases/move-effect-phase";
import { TurnEndPhase } from "#phases/turn-end-phase";
import { GameManager } from "#test/test-utils/game-manager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

describe("Abilities - Power Spot", () => {
  let phaserGame: Phaser.Game;
  let game: GameManager;

  const powerSpotMultiplier = 1.3;

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
      .battleStyle("double")
      .moveset([MoveId.TACKLE, MoveId.BREAKING_SWIPE, MoveId.SPLASH, MoveId.DAZZLING_GLEAM])
      .enemyMoveset(MoveId.SPLASH)
      .enemySpecies(SpeciesId.SHUCKLE)
      .enemyAbility(AbilityId.BALL_FETCH);
  });

  it("raises the power of allies' special moves by 30%", async () => {
    const moveToCheck = allMoves[MoveId.DAZZLING_GLEAM];
    const basePower = moveToCheck.power;

    vi.spyOn(moveToCheck, "calculateBattlePower");

    await game.classicMode.startBattle([SpeciesId.REGIELEKI, SpeciesId.STONJOURNER]);
    game.move.select(MoveId.DAZZLING_GLEAM);
    game.move.select(MoveId.SPLASH, 1);
    await game.phaseInterceptor.to(MoveEffectPhase);

    expect(moveToCheck.calculateBattlePower).toHaveReturnedWith(basePower * powerSpotMultiplier);
  });

  it("raises the power of allies' physical moves by 30%", async () => {
    const moveToCheck = allMoves[MoveId.BREAKING_SWIPE];
    const basePower = moveToCheck.power;

    vi.spyOn(moveToCheck, "calculateBattlePower");

    await game.classicMode.startBattle([SpeciesId.REGIELEKI, SpeciesId.STONJOURNER]);
    game.move.select(MoveId.BREAKING_SWIPE);
    game.move.select(MoveId.SPLASH, 1);
    await game.phaseInterceptor.to(MoveEffectPhase);

    expect(moveToCheck.calculateBattlePower).toHaveReturnedWith(basePower * powerSpotMultiplier);
  });

  it("does not raise the power of the ability owner's moves", async () => {
    const moveToCheck = allMoves[MoveId.BREAKING_SWIPE];
    const basePower = moveToCheck.power;

    vi.spyOn(moveToCheck, "calculateBattlePower");

    await game.classicMode.startBattle([SpeciesId.STONJOURNER, SpeciesId.REGIELEKI]);
    game.move.select(MoveId.BREAKING_SWIPE);
    game.move.select(MoveId.SPLASH, 1);
    await game.phaseInterceptor.to(TurnEndPhase);

    expect(moveToCheck.calculateBattlePower).toHaveReturnedWith(basePower);
  });
});
