import { allMoves } from "#app/data/data-lists";
import { AbilityId } from "#enums/ability-id";
import { MoveEffectPhase } from "#app/phases/move-effect-phase";
import { TurnEndPhase } from "#app/phases/turn-end-phase";
import { MoveId } from "#enums/move-id";
import { SpeciesId } from "#enums/species-id";
import GameManager from "#test/testUtils/gameManager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

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
    game.override.battleStyle("double");
    game.override.enemySpecies(SpeciesId.SHUCKLE);
    game.override.enemyAbility(AbilityId.BALL_FETCH);
    game.override.moveset([MoveId.TACKLE, MoveId.BREAKING_SWIPE, MoveId.SPLASH, MoveId.DAZZLING_GLEAM]);
    game.override.enemyMoveset(MoveId.SPLASH);
  });

  it("raises the power of allies' special moves by 30%", async () => {
    const moveToCheck = allMoves[MoveId.DAZZLING_GLEAM];
    const basePower = moveToCheck.power;

    vi.spyOn(moveToCheck, "calculateBattlePower");

    await game.classicMode.startBattle([SpeciesId.PIKACHU, SpeciesId.CHARJABUG]);

    game.move.select(MoveId.DAZZLING_GLEAM);
    game.move.select(MoveId.SPLASH, 1);
    await game.phaseInterceptor.to(MoveEffectPhase);

    expect(moveToCheck.calculateBattlePower).toHaveReturnedWith(basePower * batteryMultiplier);
  });

  it("does not raise the power of allies' non-special moves", async () => {
    const moveToCheck = allMoves[MoveId.BREAKING_SWIPE];
    const basePower = moveToCheck.power;

    vi.spyOn(moveToCheck, "calculateBattlePower");

    await game.classicMode.startBattle([SpeciesId.PIKACHU, SpeciesId.CHARJABUG]);

    game.move.select(MoveId.BREAKING_SWIPE);
    game.move.select(MoveId.SPLASH, 1);
    await game.phaseInterceptor.to(MoveEffectPhase);

    expect(moveToCheck.calculateBattlePower).toHaveReturnedWith(basePower);
  });

  it("does not raise the power of the ability owner's special moves", async () => {
    const moveToCheck = allMoves[MoveId.DAZZLING_GLEAM];
    const basePower = moveToCheck.power;

    vi.spyOn(moveToCheck, "calculateBattlePower");

    await game.classicMode.startBattle([SpeciesId.CHARJABUG, SpeciesId.PIKACHU]);

    game.move.select(MoveId.DAZZLING_GLEAM);
    game.move.select(MoveId.SPLASH, 1);
    await game.phaseInterceptor.to(TurnEndPhase);

    expect(moveToCheck.calculateBattlePower).toHaveReturnedWith(basePower);
  });
});
