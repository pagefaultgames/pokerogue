import { allMoves } from "#app/data/move";
import { Abilities } from "#enums/abilities";
import { Moves } from "#enums/moves";
import { Species } from "#enums/species";
import GameManager from "#test/utils/gameManager";
import { SPLASH_ONLY } from "#test/utils/testUtils";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

describe("Abilities - Aura Break", () => {
  let phaserGame: Phaser.Game;
  let game: GameManager;

  const auraBreakMultiplier = 9 / 16 * 4 / 3;

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
    game.override.battleType("single");
    game.override.moveset([Moves.MOONBLAST, Moves.DARK_PULSE, Moves.MOONBLAST, Moves.DARK_PULSE]);
    game.override.enemyMoveset(SPLASH_ONLY);
    game.override.enemyAbility(Abilities.AURA_BREAK);
    game.override.enemySpecies(Species.SHUCKLE);
  });

  it("reverses the effect of Fairy Aura", async () => {
    const moveToCheck = allMoves[Moves.MOONBLAST];
    const basePower = moveToCheck.power;

    game.override.ability(Abilities.FAIRY_AURA);
    vi.spyOn(moveToCheck, "calculateBattlePower");

    await game.classicMode.startBattle([Species.PIKACHU]);
    game.move.select(Moves.MOONBLAST);
    await game.phaseInterceptor.to("MoveEffectPhase");

    expect(moveToCheck.calculateBattlePower).toHaveReturnedWith(expect.closeTo(basePower * auraBreakMultiplier));
  });

  it("reverses the effect of Dark Aura", async () => {
    const moveToCheck = allMoves[Moves.DARK_PULSE];
    const basePower = moveToCheck.power;

    game.override.ability(Abilities.DARK_AURA);
    vi.spyOn(moveToCheck, "calculateBattlePower");

    await game.classicMode.startBattle([Species.PIKACHU]);
    game.move.select(Moves.DARK_PULSE);
    await game.phaseInterceptor.to("MoveEffectPhase");

    expect(moveToCheck.calculateBattlePower).toHaveReturnedWith(expect.closeTo(basePower * auraBreakMultiplier));
  });

  it("has no effect if neither Fairy Aura nor Dark Aura are present", async () => {
    const moveToCheck = allMoves[Moves.MOONBLAST];
    const basePower = moveToCheck.power;

    game.override.ability(Abilities.BALL_FETCH);
    vi.spyOn(moveToCheck, "calculateBattlePower");

    await game.classicMode.startBattle([Species.PIKACHU]);
    game.move.select(Moves.MOONBLAST);
    await game.phaseInterceptor.to("MoveEffectPhase");

    expect(moveToCheck.calculateBattlePower).toHaveReturnedWith(basePower);
  });
});
