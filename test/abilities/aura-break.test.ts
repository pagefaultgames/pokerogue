import { allMoves } from "#data/data-lists";
import { AbilityId } from "#enums/ability-id";
import { MoveId } from "#enums/move-id";
import { SpeciesId } from "#enums/species-id";
import { GameManager } from "#test/test-utils/game-manager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

describe("Abilities - Aura Break", () => {
  let phaserGame: Phaser.Game;
  let game: GameManager;

  const auraBreakMultiplier = ((9 / 16) * 4) / 3;

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
      .battleStyle("single")
      .moveset([MoveId.MOONBLAST, MoveId.DARK_PULSE])
      .enemyMoveset(MoveId.SPLASH)
      .enemyAbility(AbilityId.AURA_BREAK)
      .enemySpecies(SpeciesId.SHUCKLE);
  });

  it("reverses the effect of Fairy Aura", async () => {
    const moveToCheck = allMoves[MoveId.MOONBLAST];
    const basePower = moveToCheck.power;

    game.override.ability(AbilityId.FAIRY_AURA);
    vi.spyOn(moveToCheck, "calculateBattlePower");

    await game.classicMode.startBattle([SpeciesId.PIKACHU]);
    game.move.select(MoveId.MOONBLAST);
    await game.phaseInterceptor.to("MoveEffectPhase");

    expect(moveToCheck.calculateBattlePower).toHaveReturnedWith(expect.closeTo(basePower * auraBreakMultiplier));
  });

  it("reverses the effect of Dark Aura", async () => {
    const moveToCheck = allMoves[MoveId.DARK_PULSE];
    const basePower = moveToCheck.power;

    game.override.ability(AbilityId.DARK_AURA);
    vi.spyOn(moveToCheck, "calculateBattlePower");

    await game.classicMode.startBattle([SpeciesId.PIKACHU]);
    game.move.select(MoveId.DARK_PULSE);
    await game.phaseInterceptor.to("MoveEffectPhase");

    expect(moveToCheck.calculateBattlePower).toHaveReturnedWith(expect.closeTo(basePower * auraBreakMultiplier));
  });

  it("has no effect if neither Fairy Aura nor Dark Aura are present", async () => {
    const moveToCheck = allMoves[MoveId.MOONBLAST];
    const basePower = moveToCheck.power;

    game.override.ability(AbilityId.BALL_FETCH);
    vi.spyOn(moveToCheck, "calculateBattlePower");

    await game.classicMode.startBattle([SpeciesId.PIKACHU]);
    game.move.select(MoveId.MOONBLAST);
    await game.phaseInterceptor.to("MoveEffectPhase");

    expect(moveToCheck.calculateBattlePower).toHaveReturnedWith(basePower);
  });
});
