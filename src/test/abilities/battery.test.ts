import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import Phaser from "phaser";
import GameManager from "#app/test/utils/gameManager";
import overrides from "#app/overrides";
import { Species } from "#enums/species";
import { Moves } from "#enums/moves";
import { getMovePosition } from "#app/test/utils/gameManagerUtils";
import { allMoves } from "#app/data/move.js";
import { Abilities } from "#app/enums/abilities.js";
import { MoveEffectPhase, TurnEndPhase } from "#app/phases.js";

describe("Abilities - Battery", () => {
  let phaserGame: Phaser.Game;
  let game: GameManager;

  const batteryMultiplier = 1.3;

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
    vi.spyOn(overrides, "OPP_SPECIES_OVERRIDE", "get").mockReturnValue(Species.SHUCKLE);
    vi.spyOn(overrides, "OPP_ABILITY_OVERRIDE", "get").mockReturnValue(Abilities.BALL_FETCH);
    vi.spyOn(overrides, "MOVESET_OVERRIDE", "get").mockReturnValue([Moves.TACKLE, Moves.BREAKING_SWIPE, Moves.SPLASH, Moves.DAZZLING_GLEAM]);
    vi.spyOn(overrides, "OPP_MOVESET_OVERRIDE", "get").mockReturnValue([Moves.SPLASH, Moves.SPLASH, Moves.SPLASH, Moves.SPLASH]);
  });

  it("raises the power of allies' special moves by 30%", async () => {
    const moveToCheck = allMoves[Moves.DAZZLING_GLEAM];
    const basePower = moveToCheck.power;

    vi.spyOn(moveToCheck, "calculateBattlePower");

    await game.startBattle([Species.PIKACHU, Species.CHARJABUG]);

    game.doAttack(getMovePosition(game.scene, 0, Moves.DAZZLING_GLEAM));
    game.doAttack(getMovePosition(game.scene, 1, Moves.SPLASH));
    await game.phaseInterceptor.to(MoveEffectPhase);

    expect(moveToCheck.calculateBattlePower).toHaveReturnedWith(basePower * batteryMultiplier);
  });

  it("does not raise the power of allies' non-special moves", async () => {
    const moveToCheck = allMoves[Moves.BREAKING_SWIPE];
    const basePower = moveToCheck.power;

    vi.spyOn(moveToCheck, "calculateBattlePower");

    await game.startBattle([Species.PIKACHU, Species.CHARJABUG]);

    game.doAttack(getMovePosition(game.scene, 0, Moves.BREAKING_SWIPE));
    game.doAttack(getMovePosition(game.scene, 1, Moves.SPLASH));
    await game.phaseInterceptor.to(MoveEffectPhase);

    expect(moveToCheck.calculateBattlePower).toHaveReturnedWith(basePower);
  });

  it("does not raise the power of the ability owner's special moves", async () => {
    const moveToCheck = allMoves[Moves.DAZZLING_GLEAM];
    const basePower = moveToCheck.power;

    vi.spyOn(moveToCheck, "calculateBattlePower");

    await game.startBattle([Species.CHARJABUG, Species.PIKACHU]);

    game.doAttack(getMovePosition(game.scene, 0, Moves.DAZZLING_GLEAM));
    game.doAttack(getMovePosition(game.scene, 1, Moves.SPLASH));
    await game.phaseInterceptor.to(TurnEndPhase);

    expect(moveToCheck.calculateBattlePower).toHaveReturnedWith(basePower);
  });
});
