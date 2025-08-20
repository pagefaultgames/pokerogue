import { MoveId } from "#enums/move-id";
import { SpeciesId } from "#enums/species-id";
import { TurnEndPhase } from "#phases/turn-end-phase";
import { GameManager } from "#test/test-utils/game-manager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

describe("Items - Scope Lens", () => {
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
      .enemySpecies(SpeciesId.MAGIKARP)
      .enemyMoveset(MoveId.SPLASH)
      .moveset([MoveId.POUND])
      .startingHeldItems([{ name: "SCOPE_LENS" }])
      .battleStyle("single");
  });

  it("should raise CRIT stage by 1", async () => {
    await game.classicMode.startBattle([SpeciesId.GASTLY]);

    const enemyPokemon = game.field.getEnemyPokemon();

    vi.spyOn(enemyPokemon, "getCritStage");

    game.move.select(MoveId.POUND);

    await game.phaseInterceptor.to(TurnEndPhase);

    expect(enemyPokemon.getCritStage).toHaveReturnedWith(1);
  });
});
