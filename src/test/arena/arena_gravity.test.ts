import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import Phaser from "phaser";
import GameManager from "#app/test/utils/gameManager";
import * as overrides from "#app/overrides";
import { Species } from "#enums/species";
import {
  TurnEndPhase,
} from "#app/phases";
import { Moves } from "#enums/moves";
import { getMovePosition } from "#app/test/utils/gameManagerUtils";
import { allMoves } from "#app/data/move.js";
import { ArenaTagType } from "#app/enums/arena-tag-type.js";

describe("Arena - Gravity", () => {
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
    vi.spyOn(overrides, "SINGLE_BATTLE_OVERRIDE", "get").mockReturnValue(true);
    vi.spyOn(overrides, "OPP_SPECIES_OVERRIDE", "get").mockReturnValue(Species.MAGIKARP);
    vi.spyOn(overrides, "MOVESET_OVERRIDE", "get").mockReturnValue([Moves.TACKLE, Moves.GRAVITY]);
    vi.spyOn(overrides, "OPP_MOVESET_OVERRIDE", "get").mockReturnValue(new Array(4).fill(Moves.SPLASH));
  });

  it("non-OHKO move accuracy is multiplied by 1.67", async () => {
    const moveToCheck = allMoves[Moves.TACKLE];
    await game.startBattle([Species.MAGIKARP]);

    const preGravityMoveAccuracy = moveToCheck.calculateAccuracy(game.scene.getPlayerPokemon(), game.scene.getEnemyPokemon());
    expect(preGravityMoveAccuracy).toBe(moveToCheck.accuracy);
    expect(preGravityMoveAccuracy).not.toBe(moveToCheck.accuracy * 1.67);

    game.doAttack(getMovePosition(game.scene, 0, Moves.GRAVITY));

    await game.phaseInterceptor.to(TurnEndPhase);
    await game.toNextTurn();

    expect(game.scene.arena.getTag(ArenaTagType.GRAVITY)).toBeDefined();

    const postGravityMoveAccuracy = moveToCheck.calculateAccuracy(game.scene.getPlayerPokemon(), game.scene.getEnemyPokemon());
    expect(postGravityMoveAccuracy).not.toBe(moveToCheck.accuracy);
    expect(postGravityMoveAccuracy).toBe(Math.floor(moveToCheck.accuracy * 1.67));
  });
});
