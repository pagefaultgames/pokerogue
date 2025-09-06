import { AbilityId } from "#enums/ability-id";
import { getHeldItemCategory, HeldItemCategoryId } from "#enums/held-item-id";
import { MoveId } from "#enums/move-id";
import { RewardId } from "#enums/reward-id";
import { SpeciesId } from "#enums/species-id";
import { HeldItemReward } from "#items/rewards/held-item-reward";
import { GameManager } from "#test/test-utils/game-manager";
import { generateRewardForTest } from "#test/test-utils/reward-test-utils";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";

describe("{{description}}", () => {
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
      .ability(AbilityId.BALL_FETCH)
      .battleStyle("single")
      .criticalHits(false)
      .enemySpecies(SpeciesId.MAGIKARP)
      .enemyAbility(AbilityId.BALL_FETCH)
      .enemyMoveset(MoveId.SPLASH)
      .startingLevel(100)
      .enemyLevel(100);
  });

  it("should do XYZ when applied", async () => {
    await game.classicMode.startBattle([SpeciesId.FEEBAS]);

    const feebas = game.field.getPlayerPokemon();

    const reward = generateRewardForTest(RewardId.BERRY)!;
    expect(reward).toBeInstanceOf(HeldItemReward); // Replace with actual reward instance
    expect(getHeldItemCategory(reward["itemId"])).toBe(HeldItemCategoryId.BERRY);
    game.scene.applyReward(reward, { pokemon: feebas });

    expect(feebas).toHaveHeldItem(HeldItemCategoryId.BERRY);
  });
});
