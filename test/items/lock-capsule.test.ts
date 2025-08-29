import { AbilityId } from "#enums/ability-id";
import { MoveId } from "#enums/move-id";
import { RarityTier } from "#enums/reward-tier";
import { TrainerItemId } from "#enums/trainer-item-id";
import { UiMode } from "#enums/ui-mode";
import { SelectRewardPhase } from "#phases/select-reward-phase";
import { GameManager } from "#test/test-utils/game-manager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";

describe("Items - Lock Capsule", () => {
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
      .startingLevel(200)
      .moveset([MoveId.SURF])
      .enemyAbility(AbilityId.BALL_FETCH)
      .startingTrainerItems([{ entry: TrainerItemId.LOCK_CAPSULE }]);
  });

  it("doesn't set the cost of common tier items to 0", async () => {
    await game.classicMode.startBattle();
    game.scene.phaseManager.overridePhase(
      new SelectRewardPhase(0, undefined, {
        guaranteedRarityTiers: [RarityTier.COMMON, RarityTier.COMMON, RarityTier.COMMON],
        fillRemaining: false,
      }),
    );

    game.onNextPrompt("SelectRewardPhase", UiMode.REWARD_SELECT, () => {
      const selectRewardPhase = game.scene.phaseManager.getCurrentPhase() as SelectRewardPhase;
      const rerollCost = selectRewardPhase.getRerollCost(true);
      expect(rerollCost).toBe(150);
    });

    game.doSelectModifier();
    await game.phaseInterceptor.to("SelectRewardPhase");
  });
});
