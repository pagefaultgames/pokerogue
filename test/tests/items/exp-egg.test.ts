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

describe("Items - Exp Eggs", () => {
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
    { itemName: "Lucky Egg", item: HeldItemId.LUCKY_EGG, boostMultiplier: 1.4 },
    { itemName: "Golden Egg", item: HeldItemId.GOLDEN_EGG, boostMultiplier: 2 },
  ])("$itemName should multiply exp gained by $boostMultiplier per stack", async ({ item, boostMultiplier }) => {
    game.override.startingHeldItems([{ entry: item }]);
    await game.classicMode.startBattle(SpeciesId.MAGIKARP);

    const player = game.field.getPlayerPokemon();
    const expAmount = new ValueHolder(1000);

    applySingleHeldItem(item, HeldItemEffect.EXP_BOOSTER, { pokemon: player, expAmount });

    expect(expAmount.value).toBe(1000 * boostMultiplier);
  });

  it("should add the boost multiplier per stack", async () => {
    game.override.startingHeldItems([{ entry: HeldItemId.LUCKY_EGG, count: 2 }]);
    await game.classicMode.startBattle(SpeciesId.MAGIKARP);

    const player = game.field.getPlayerPokemon();
    const expAmount = new ValueHolder(1000);

    applySingleHeldItem(HeldItemId.LUCKY_EGG, HeldItemEffect.EXP_BOOSTER, { pokemon: player, expAmount });

    expect(expAmount.value).toBe(1800);
  });
});
