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

describe("Items - Soothe Bell", () => {
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
      .startingHeldItems([{ entry: HeldItemId.SOOTHE_BELL }])
      .enemySpecies(SpeciesId.MAGIKARP)
      .enemyAbility(AbilityId.BALL_FETCH)
      .enemyMoveset(MoveId.SPLASH);
  });

  it("should boost friendship gained by 50% per stack", async () => {
    await game.classicMode.startBattle(SpeciesId.MAGIKARP);

    const player = game.field.getPlayerPokemon();
    const friendship = new ValueHolder(10);

    applySingleHeldItem(HeldItemId.SOOTHE_BELL, HeldItemEffect.FRIENDSHIP_BOOSTER, { pokemon: player, friendship });
    expect(friendship.value).toBe(15);

    friendship.value = 10;
    player.heldItemManager.add(HeldItemId.SOOTHE_BELL); // 2 stacks
    applySingleHeldItem(HeldItemId.SOOTHE_BELL, HeldItemEffect.FRIENDSHIP_BOOSTER, { pokemon: player, friendship });
    expect(friendship.value).toBe(20);
  });

  it.each([5, 21])("should floor the boosted friendship value (%s)", async value => {
    await game.classicMode.startBattle(SpeciesId.MAGIKARP);

    const player = game.field.getPlayerPokemon();
    const friendship = new ValueHolder(value);

    applySingleHeldItem(HeldItemId.SOOTHE_BELL, HeldItemEffect.FRIENDSHIP_BOOSTER, { pokemon: player, friendship });

    expect(friendship.value).toBe(Math.floor(value * 1.5));
  });
});
