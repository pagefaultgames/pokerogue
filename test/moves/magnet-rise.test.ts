import { MoveId } from "#enums/move-id";
import { SpeciesId } from "#enums/species-id";
import { GameManager } from "#test/test-utils/game-manager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";

describe("Moves - Magnet Rise", () => {
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
      .enemySpecies(SpeciesId.RATTATA)
      .enemyMoveset(MoveId.EARTHQUAKE)
      .criticalHits(false)
      .enemyLevel(1);
  });

  it("should make the user immune to ground-type moves", async () => {
    await game.classicMode.startBattle([SpeciesId.MAGNEZONE]);

    game.move.use(MoveId.MAGNET_RISE);
    await game.toEndOfTurn();

    const magnezone = game.field.getPlayerPokemon();
    expect(magnezone.hp).toBe(magnezone.getMaxHp());
    expect(magnezone.isGrounded()).toBe(false);
  });

  it("should be removed by gravity", async () => {
    await game.classicMode.startBattle([SpeciesId.MAGNEZONE]);

    game.move.use(MoveId.MAGNET_RISE);
    await game.toNextTurn();

    const magnezone = game.field.getPlayerPokemon();
    expect(magnezone.hp).toBe(magnezone.getMaxHp());

    game.move.use(MoveId.GRAVITY);
    await game.toEndOfTurn();

    expect(magnezone.hp).toBeLessThan(magnezone.getMaxHp());
    expect(magnezone.isGrounded()).toBe(true);
  });
});
