import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import Phaser from "phaser";
import GameManager from "#app/test/utils/gameManager";
import overrides from "#app/overrides";
import { Species } from "#enums/species";
import { Moves } from "#enums/moves";
import { getMovePosition } from "#app/test/utils/gameManagerUtils";
import { allMoves } from "#app/data/move.js";
import { MoveEffectPhase, TurnEndPhase } from "#app/phases.js";
import { Abilities } from "#app/enums/abilities.js";

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
    vi.spyOn(overrides, "DOUBLE_BATTLE_OVERRIDE", "get").mockReturnValue(true);
    vi.spyOn(overrides, "MOVESET_OVERRIDE", "get").mockReturnValue([Moves.TACKLE, Moves.BREAKING_SWIPE, Moves.SPLASH, Moves.DAZZLING_GLEAM]);
    vi.spyOn(overrides, "OPP_MOVESET_OVERRIDE", "get").mockReturnValue([Moves.SPLASH, Moves.SPLASH, Moves.SPLASH, Moves.SPLASH]);
    vi.spyOn(overrides, "OPP_SPECIES_OVERRIDE", "get").mockReturnValue(Species.SHUCKLE);
    vi.spyOn(overrides, "OPP_ABILITY_OVERRIDE", "get").mockReturnValue(Abilities.BALL_FETCH);
  });

  it("raises the power of allies' special moves by 30%", async () => {
    const moveToCheck = allMoves[Moves.DAZZLING_GLEAM];
    const basePower = moveToCheck.power;

    vi.spyOn(moveToCheck, "calculateBattlePower");

    await game.startBattle([Species.PIKACHU, Species.STONJOURNER]);
    game.doAttack(getMovePosition(game.scene, 0, Moves.DAZZLING_GLEAM));
    game.doAttack(getMovePosition(game.scene, 1, Moves.SPLASH));
    await game.phaseInterceptor.to(MoveEffectPhase);

    expect(moveToCheck.calculateBattlePower).toHaveReturnedWith(basePower * powerSpotMultiplier);
  });

  it("raises the power of allies' physical moves by 30%", async () => {
    const moveToCheck = allMoves[Moves.BREAKING_SWIPE];
    const basePower = moveToCheck.power;

    vi.spyOn(moveToCheck, "calculateBattlePower");

    await game.startBattle([Species.PIKACHU, Species.STONJOURNER]);
    game.doAttack(getMovePosition(game.scene, 0, Moves.BREAKING_SWIPE));
    game.doAttack(getMovePosition(game.scene, 1, Moves.SPLASH));
    await game.phaseInterceptor.to(MoveEffectPhase);

    expect(moveToCheck.calculateBattlePower).toHaveReturnedWith(basePower * powerSpotMultiplier);
  });

  it("does not raise the power of the ability owner's moves", async () => {
    const moveToCheck = allMoves[Moves.BREAKING_SWIPE];
    const basePower = moveToCheck.power;

    vi.spyOn(moveToCheck, "calculateBattlePower");

    await game.startBattle([Species.STONJOURNER, Species.PIKACHU]);
    game.doAttack(getMovePosition(game.scene, 0, Moves.BREAKING_SWIPE));
    game.doAttack(getMovePosition(game.scene, 1, Moves.SPLASH));
    await game.phaseInterceptor.to(TurnEndPhase);

    expect(moveToCheck.calculateBattlePower).toHaveReturnedWith(basePower);
  });
});
