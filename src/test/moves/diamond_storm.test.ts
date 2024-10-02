import { allMoves } from "#app/data/move";
import { Abilities } from "#enums/abilities";
import { Moves } from "#enums/moves";
import { Species } from "#enums/species";
import { Stat } from "#enums/stat";
import GameManager from "#test/utils/gameManager";
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
      .moveset([Moves.DIAMOND_STORM])
      .battleType("single")
      .enemySpecies(Species.MAGIKARP)
      .enemyAbility(Abilities.BALL_FETCH)
      .enemyMoveset(Moves.SPLASH);
  });

  it("should only increase defense once even if hitting 2 pokemon", async () => {
    game.override.battleType("double");
    const diamondStorm = allMoves[Moves.DIAMOND_STORM];
    vi.spyOn(diamondStorm, "chance", "get").mockReturnValue(100);
    vi.spyOn(diamondStorm, "accuracy", "get").mockReturnValue(100);
    await game.classicMode.startBattle([Species.FEEBAS]);

    game.move.select(Moves.DIAMOND_STORM);
    await game.phaseInterceptor.to("BerryPhase");

    expect(game.scene.getPlayerPokemon()!.getStatStage(Stat.DEF)).toBe(2);
  });
});
