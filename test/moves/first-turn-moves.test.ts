import { MoveId } from "#enums/move-id";
import { MoveResult } from "#enums/move-result";
import { SpeciesId } from "#enums/species-id";
import { GameManager } from "#test/test-utils/game-manager";
import Phaser from "phaser";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";

describe.each([
  { move: MoveId.FAKE_OUT, name: "Fake Out" },
  { move: MoveId.FIRST_IMPRESSION, name: "First Impression" },
  { move: MoveId.MAT_BLOCK, name: "Mat Block" },
])("Move - $name", ({ move }) => {
  let phaserGame: Phaser.Game;
  let game: GameManager;

  beforeAll(() => {
    phaserGame = new Phaser.Game({
      type: Phaser.HEADLESS,
    });
  });

  beforeEach(() => {
    game = new GameManager(phaserGame);
    game.override
      .battleStyle("single")
      .enemySpecies(SpeciesId.FEEBAS)
      .enemyMoveset(MoveId.SPLASH)
      .enemyLevel(100)
      .startingLevel(100)
      .criticalHits(false);
  });

  it("should only work the first turn a pokemon is sent out in a battle", async () => {
    await game.classicMode.startBattle(SpeciesId.FEEBAS);

    game.move.use(move);
    await game.toNextTurn();

    const feebas = game.field.getPlayerPokemon();
    expect(feebas).toHaveUsedMove({ move, result: MoveResult.SUCCESS });

    game.move.use(move);
    await game.toEndOfTurn();

    expect(feebas).toHaveUsedMove({ move, result: MoveResult.FAIL });
  });

  // This is a PokeRogue buff to Fake Out
  it("should succeed at the start of each new wave, even if user wasn't recalled", async () => {
    await game.classicMode.startBattle(SpeciesId.FEEBAS);

    game.move.use(MoveId.SPLASH);
    await game.doKillOpponents();
    await game.toNextWave();

    game.move.use(move);
    await game.toNextTurn();

    const feebas = game.field.getPlayerPokemon();
    expect(feebas).toHaveUsedMove({ move, result: MoveResult.SUCCESS });
  });

  it("should succeed if recalled and sent back out", async () => {
    await game.classicMode.startBattle(SpeciesId.FEEBAS, SpeciesId.MAGIKARP);

    game.doSwitchPokemon(1);
    await game.toNextTurn();

    game.doSwitchPokemon(1);
    await game.toNextTurn();

    game.move.use(move);
    await game.toNextTurn();

    const feebas = game.field.getPlayerPokemon();
    expect(feebas).toHaveUsedMove({ move, result: MoveResult.SUCCESS });
  });
});
