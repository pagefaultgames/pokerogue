import { AbilityId } from "#enums/ability-id";
import { HeldItemEffect } from "#enums/held-item-effect";
import { HeldItemId } from "#enums/held-item-id";
import { MoveId } from "#enums/move-id";
import { SpeciesId } from "#enums/species-id";
import { GameManager } from "#test/framework/game-manager";
import { applySingleHeldItem } from "#test/utils/item-test-utils";
import Phaser from "phaser";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";

describe("Items - Shuckle Juice", () => {
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

  it.each([
    { itemName: "Shuckle Juice (Good)", item: HeldItemId.SHUCKLE_JUICE_GOOD, expectedHp: 55, expectedOther: 60 },
    { itemName: "Shuckle Juice (Bad)", item: HeldItemId.SHUCKLE_JUICE_BAD, expectedHp: 42, expectedOther: 35 },
  ])("$itemName should modify all base stats", async ({ item, expectedHp, expectedOther }) => {
    game.override.startingHeldItems([{ entry: item }]);
    await game.classicMode.startBattle(SpeciesId.MAGIKARP);

    const player = game.field.getPlayerPokemon();
    const baseStats = [50, 50, 50, 50, 50, 50];

    applySingleHeldItem(item, HeldItemEffect.BASE_STAT_ADD, { pokemon: player, baseStats });

    expect(baseStats[0]).toBe(expectedHp);
    for (let i = 1; i < baseStats.length; i++) {
      expect(baseStats[i]).toBe(expectedOther);
    }
  });

  it("should clamp base stats to a minimum of 1", async () => {
    game.override.startingHeldItems([{ entry: HeldItemId.SHUCKLE_JUICE_BAD }]);
    await game.classicMode.startBattle(SpeciesId.MAGIKARP);

    const player = game.field.getPlayerPokemon();
    const baseStats = [1, 1, 1, 1, 1, 1];

    applySingleHeldItem(HeldItemId.SHUCKLE_JUICE_BAD, HeldItemEffect.BASE_STAT_ADD, { pokemon: player, baseStats });

    for (const stat of baseStats) {
      expect(stat).toBe(1);
    }
  });
});
