import { allMoves } from "#data/data-lists";
import { MoveId } from "#enums/move-id";
import { SpeciesId } from "#enums/species-id";
import type { Move } from "#moves/move";
import { GameManager } from "#test/test-utils/game-manager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

describe("Moves - Retaliate", () => {
  let phaserGame: Phaser.Game;
  let game: GameManager;

  let retaliate: Move;

  beforeAll(() => {
    phaserGame = new Phaser.Game({
      type: Phaser.HEADLESS,
    });
  });

  afterEach(() => {
    game.phaseInterceptor.restoreOg();
  });

  beforeEach(() => {
    retaliate = allMoves[MoveId.RETALIATE];
    game = new GameManager(phaserGame);
    game.override
      .battleStyle("single")
      .enemySpecies(SpeciesId.SNORLAX)
      .enemyMoveset(MoveId.RETALIATE)
      .enemyLevel(100)
      .moveset([MoveId.RETALIATE, MoveId.SPLASH])
      .startingLevel(80)
      .criticalHits(false);
  });

  it("increases power if ally died previous turn", async () => {
    vi.spyOn(retaliate, "calculateBattlePower");
    await game.classicMode.startBattle([SpeciesId.ABRA, SpeciesId.COBALION]);
    game.move.select(MoveId.RETALIATE);
    await game.phaseInterceptor.to("TurnEndPhase");
    expect(retaliate.calculateBattlePower).toHaveLastReturnedWith(70);
    game.doSelectPartyPokemon(1);

    await game.toNextTurn();
    game.move.select(MoveId.RETALIATE);
    await game.phaseInterceptor.to("MoveEffectPhase");
    expect(retaliate.calculateBattlePower).toHaveReturnedWith(140);
  });
});
