import { AbilityId } from "#enums/ability-id";
import { HeldItemEffect } from "#enums/held-item-effect";
import { HeldItemId } from "#enums/held-item-id";
import { MoveId } from "#enums/move-id";
import { SpeciesId } from "#enums/species-id";
import { GameManager } from "#test/framework/game-manager";
import { applySingleHeldItem } from "#test/utils/item-test-utils";
import { ValueHolder } from "#utils/value-holder";
import Phaser from "phaser";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";

describe("Items - Wide Lens", () => {
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
      .criticalHits(false)
      .ability(AbilityId.BALL_FETCH)
      .enemySpecies(SpeciesId.MAGIKARP)
      .enemyAbility(AbilityId.BALL_FETCH)
      .enemyMoveset(MoveId.SPLASH);
  });

  it.each([1, 2, 3])("should boost move accuracy by 5 per stack (%d)", async stacks => {
    game.override.startingHeldItems([{ entry: HeldItemId.WIDE_LENS, count: stacks }]);
    await game.classicMode.startBattle(SpeciesId.MAGIKARP);

    const player = game.field.getPlayerPokemon();
    const moveAccuracy = new ValueHolder(100);

    applySingleHeldItem(HeldItemId.WIDE_LENS, HeldItemEffect.ACCURACY_BOOSTER, { pokemon: player, moveAccuracy });

    expect(moveAccuracy.value).toBe(100 + 5 * stacks);
  });
});
