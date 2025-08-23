import { allMoves } from "#data/data-lists";
import { AbilityId } from "#enums/ability-id";
import { MoveId } from "#enums/move-id";
import { SpeciesId } from "#enums/species-id";
import { GameManager } from "#test/test-utils/game-manager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

describe("Arena - Grassy Terrain", () => {
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
      .battleStyle("single")
      .criticalHits(false)
      .enemyLevel(1)
      .enemySpecies(SpeciesId.SHUCKLE)
      .enemyAbility(AbilityId.STURDY)
      .enemyMoveset(MoveId.FLY)
      .moveset([MoveId.GRASSY_TERRAIN, MoveId.EARTHQUAKE])
      .ability(AbilityId.NO_GUARD);
  });

  it("halves the damage of Earthquake", async () => {
    await game.classicMode.startBattle([SpeciesId.TAUROS]);

    const eq = allMoves[MoveId.EARTHQUAKE];
    vi.spyOn(eq, "calculateBattlePower");

    game.move.select(MoveId.EARTHQUAKE);
    await game.toNextTurn();

    expect(eq.calculateBattlePower).toHaveReturnedWith(100);

    game.move.select(MoveId.GRASSY_TERRAIN);
    await game.toNextTurn();

    game.move.select(MoveId.EARTHQUAKE);
    await game.phaseInterceptor.to("BerryPhase");

    expect(eq.calculateBattlePower).toHaveReturnedWith(50);
  });

  it("Does not halve the damage of Earthquake if opponent is not grounded", async () => {
    await game.classicMode.startBattle([SpeciesId.NINJASK]);

    const eq = allMoves[MoveId.EARTHQUAKE];
    vi.spyOn(eq, "calculateBattlePower");

    game.move.select(MoveId.GRASSY_TERRAIN);
    await game.toNextTurn();

    game.move.select(MoveId.EARTHQUAKE);
    await game.phaseInterceptor.to("BerryPhase");

    expect(eq.calculateBattlePower).toHaveReturnedWith(100);
  });
});
