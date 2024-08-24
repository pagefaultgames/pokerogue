import { TurnEndPhase } from "#app/phases/turn-end-phase";
import { Moves } from "#enums/moves";
import { Species } from "#enums/species";
import GameManager from "#test/utils/gameManager";
import Phase from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { SPLASH_ONLY } from "../utils/testUtils";

describe("Items - Scope Lens", () => {
  let phaserGame: Phaser.Game;
  let game: GameManager;

  beforeAll(() => {
    phaserGame = new Phase.Game({
      type: Phaser.HEADLESS,
    });
  });

  afterEach(() => {
    game.phaseInterceptor.restoreOg();
  });

  beforeEach(() => {
    game = new GameManager(phaserGame);

    game.override
      .enemySpecies(Species.MAGIKARP)
      .enemyMoveset(SPLASH_ONLY)
      .moveset([ Moves.POUND ])
      .startingHeldItems([{ name: "SCOPE_LENS" }])
      .battleType("single")
      .disableCrits();

  }, 20000);

  it("should raise CRIT stage by 1", async () => {
    await game.startBattle([
      Species.GASTLY
    ]);

    const enemyPokemon = game.scene.getEnemyPokemon()!;

    vi.spyOn(enemyPokemon, "getCritStage");

    game.move.select(Moves.POUND);

    await game.phaseInterceptor.to(TurnEndPhase);

    expect(enemyPokemon.getCritStage).toHaveReturnedWith(1);
  }, 20000);
});
