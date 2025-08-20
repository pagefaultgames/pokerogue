import { allMoves } from "#data/data-lists";
import { AbilityId } from "#enums/ability-id";
import { MoveId } from "#enums/move-id";
import { SpeciesId } from "#enums/species-id";
import { Stat } from "#enums/stat";
import { GameManager } from "#test/test-utils/game-manager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

describe("Moves - Diamond Storm", () => {
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
      .moveset([MoveId.DIAMOND_STORM])
      .battleStyle("single")
      .enemySpecies(SpeciesId.MAGIKARP)
      .enemyAbility(AbilityId.BALL_FETCH)
      .enemyMoveset(MoveId.SPLASH);
  });

  it("should only increase defense once even if hitting 2 pokemon", async () => {
    game.override.battleStyle("double");
    const diamondStorm = allMoves[MoveId.DIAMOND_STORM];
    vi.spyOn(diamondStorm, "chance", "get").mockReturnValue(100);
    vi.spyOn(diamondStorm, "accuracy", "get").mockReturnValue(100);
    await game.classicMode.startBattle([SpeciesId.FEEBAS]);

    game.move.select(MoveId.DIAMOND_STORM);
    await game.phaseInterceptor.to("BerryPhase");

    expect(game.field.getPlayerPokemon().getStatStage(Stat.DEF)).toBe(2);
  });
});
