import { Button } from "#enums/buttons";
import { MoveId } from "#enums/move-id";
import { ShopCursorTarget } from "#enums/shop-cursor-target";
import { SpeciesId } from "#enums/species-id";
import { TrainerItemId } from "#enums/trainer-item-id";
import { UiMode } from "#enums/ui-mode";
import { BattleEndPhase } from "#phases/battle-end-phase";
import { CommandPhase } from "#phases/command-phase";
import { NewBattlePhase } from "#phases/new-battle-phase";
import { TurnEndPhase } from "#phases/turn-end-phase";
import { TurnInitPhase } from "#phases/turn-init-phase";
import { GameManager } from "#test/test-utils/game-manager";
import type { RewardSelectUiHandler } from "#ui/handlers/reward-select-ui-handler";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

describe("Items - Dire Hit", () => {
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
      .enemySpecies(SpeciesId.MAGIKARP)
      .enemyMoveset(MoveId.SPLASH)
      .moveset([MoveId.POUND])
      .startingTrainerItems([{ entry: TrainerItemId.DIRE_HIT }])
      .battleStyle("single");
  });

  it("should raise CRIT stage by 1", async () => {
    await game.classicMode.startBattle([SpeciesId.GASTLY]);

    const enemyPokemon = game.field.getEnemyPokemon();

    vi.spyOn(enemyPokemon, "getCritStage");

    game.move.select(MoveId.POUND);

    await game.phaseInterceptor.to(TurnEndPhase);

    expect(enemyPokemon.getCritStage).toHaveReturnedWith(1);
  });

  it("should renew how many battles are left of existing DIRE_HIT when picking up new DIRE_HIT", async () => {
    game.override.itemRewards([{ name: "DIRE_HIT" }]);

    await game.classicMode.startBattle([SpeciesId.PIKACHU]);

    game.move.use(MoveId.SPLASH);
    await game.doKillOpponents();

    await game.phaseInterceptor.to(BattleEndPhase);

    const stack = game.scene.trainerItems.getStack(TrainerItemId.DIRE_HIT);
    expect(stack).toBe(4);

    // Forced DIRE_HIT to spawn in the first slot with override
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
      () => game.isCurrentPhase(CommandPhase) || game.isCurrentPhase(NewBattlePhase),
      true,
    );

    await game.phaseInterceptor.to(TurnInitPhase);

    const newStack = game.scene.trainerItems.getStack(TrainerItemId.DIRE_HIT);
    expect(newStack).toBe(5);
  });
});
