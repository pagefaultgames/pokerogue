import { Button } from "#enums/buttons";
import { MoveId } from "#enums/move-id";
import { ShopCursorTarget } from "#enums/shop-cursor-target";
import { SpeciesId } from "#enums/species-id";
import { TrainerItemId } from "#enums/trainer-item-id";
import { UiMode } from "#enums/ui-mode";
import { GameManager } from "#test/test-utils/game-manager";
import type { RewardSelectUiHandler } from "#ui/reward-select-ui-handler";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";

describe("Items - Double Battle Chance Boosters", () => {
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
  });

  it("should guarantee double battle with 2 unique tiers", async () => {
    game.override
      .startingTrainerItems([{ entry: TrainerItemId.LURE }, { entry: TrainerItemId.SUPER_LURE }])
      .startingWave(2);

    await game.classicMode.startBattle();

    expect(game.scene.getEnemyField()).toHaveLength(2);
  });

  it("should guarantee double boss battle with 3 unique tiers", async () => {
    game.override
      .startingTrainerItems([
        { entry: TrainerItemId.LURE },
        { entry: TrainerItemId.SUPER_LURE },
        { entry: TrainerItemId.MAX_LURE },
      ])
      .startingWave(10);

    await game.classicMode.startBattle();

    const enemyField = game.scene.getEnemyField();

    expect(enemyField).toHaveLength(2);
    expect(enemyField[0].isBoss()).toBe(true);
    expect(enemyField[1].isBoss()).toBe(true);
  });

  it("should renew how many battles are left of existing booster when picking up new booster of same tier", async () => {
    game.override
      .startingTrainerItems([{ entry: TrainerItemId.LURE }])
      .itemRewards([{ name: "LURE" }])
      .moveset(MoveId.SPLASH)
      .startingLevel(200);

    await game.classicMode.startBattle([SpeciesId.PIKACHU]);

    game.move.select(MoveId.SPLASH);

    await game.doKillOpponents();

    await game.phaseInterceptor.to("BattleEndPhase");

    const stack = game.scene.trainerItems.getStack(TrainerItemId.LURE);
    expect(stack).toBe(9);

    // Forced LURE to spawn in the first slot with override
    game.onNextPrompt(
      "SelectRewardPhase",
      UiMode.REWARD_SELECT,
      () => {
        const handler = game.scene.ui.getHandler() as RewardSelectUiHandler;
        // Traverse to first modifier slot
        handler.setCursor(0);
        handler.setRowCursor(ShopCursorTarget.REWARDS);
        handler.processInput(Button.ACTION);
      },
      () => game.isCurrentPhase("CommandPhase") || game.isCurrentPhase("NewBattlePhase"),
      true,
    );

    await game.phaseInterceptor.to("TurnInitPhase");

    // Making sure only one booster is in the modifier list even after picking up another
    const newStack = game.scene.trainerItems.getStack(TrainerItemId.LURE);
    expect(newStack).toBe(10);
  });
});
