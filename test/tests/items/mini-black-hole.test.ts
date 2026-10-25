import { AbilityId } from "#enums/ability-id";
import { HeldItemId } from "#enums/held-item-id";
import { MoveId } from "#enums/move-id";
import { SpeciesId } from "#enums/species-id";
import { GameManager } from "#test/framework/game-manager";
import Phaser from "phaser";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";

describe("Items - Mini Black Hole", () => {
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
      .ability(AbilityId.NO_GUARD)
      .startingHeldItems([{ entry: HeldItemId.WIDE_LENS, count: 3 }])
      .enemyHeldItems([{ entry: HeldItemId.MINI_BLACK_HOLE }])
      .battleStyle("single")
      .criticalHits(false)
      .enemySpecies(SpeciesId.MAGIKARP)
      .enemyAbility(AbilityId.BALL_FETCH)
      .enemyMoveset(MoveId.SPLASH);
  });

  it("should not steal from the opponent when the holder is fainted", async () => {
    await game.classicMode.startBattle(SpeciesId.FEEBAS);

    game.field.getEnemyPokemon().hp = 1;

    const player = game.field.getPlayerPokemon();
    expect(player.heldItemManager.getStack(HeldItemId.WIDE_LENS)).toBe(3);

    game.move.use(MoveId.SPLASH);
    await game.toNextTurn();

    expect(player.heldItemManager.getStack(HeldItemId.WIDE_LENS)).toBe(2);
    expect(game.field.getEnemyPokemon().heldItemManager.getStack(HeldItemId.WIDE_LENS)).toBe(1);

    game.move.use(MoveId.LEECH_SEED);
    await game.toNextWave();

    expect(game.field.getPlayerPokemon().heldItemManager.getStack(HeldItemId.WIDE_LENS)).toBe(2);
  });
});
