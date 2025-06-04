import { BattlerIndex } from "#app/battle";
import { AbilityId } from "#enums/ability-id";
import { MoveResult } from "#app/field/pokemon";
import { MovePhase } from "#app/phases/move-phase";
import { MoveId } from "#enums/move-id";
import { SpeciesId } from "#enums/species-id";
import GameManager from "#test/testUtils/gameManager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";

describe("Moves - After You", () => {
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
    game.override
      .battleStyle("double")
      .enemyLevel(5)
      .enemySpecies(SpeciesId.PIKACHU)
      .enemyAbility(AbilityId.BALL_FETCH)
      .enemyMoveset(MoveId.SPLASH)
      .ability(AbilityId.BALL_FETCH)
      .moveset([MoveId.AFTER_YOU, MoveId.SPLASH]);
  });

  it("makes the target move immediately after the user", async () => {
    await game.classicMode.startBattle([SpeciesId.REGIELEKI, SpeciesId.SHUCKLE]);

    game.move.select(MoveId.AFTER_YOU, 0, BattlerIndex.PLAYER_2);
    game.move.select(MoveId.SPLASH, 1);

    await game.phaseInterceptor.to("MoveEffectPhase");
    await game.phaseInterceptor.to(MovePhase, false);
    const phase = game.scene.getCurrentPhase() as MovePhase;
    expect(phase.pokemon).toBe(game.scene.getPlayerField()[1]);
    await game.phaseInterceptor.to("MoveEndPhase");
  });

  it("fails if target already moved", async () => {
    game.override.enemySpecies(SpeciesId.SHUCKLE);
    await game.classicMode.startBattle([SpeciesId.REGIELEKI, SpeciesId.PIKACHU]);

    game.move.select(MoveId.SPLASH);
    game.move.select(MoveId.AFTER_YOU, 1, BattlerIndex.PLAYER);

    await game.phaseInterceptor.to("MoveEndPhase");
    await game.phaseInterceptor.to("MoveEndPhase");
    await game.phaseInterceptor.to(MovePhase);

    expect(game.scene.getPlayerField()[1].getLastXMoves(1)[0].result).toBe(MoveResult.FAIL);
  });
});
