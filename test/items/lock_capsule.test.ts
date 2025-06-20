import { AbilityId } from "#enums/ability-id";
import { MoveId } from "#enums/move-id";
import { ModifierTier } from "#enums/modifier-tier";
import { SelectModifierPhase } from "#app/phases/select-modifier-phase";
import { UiMode } from "#enums/ui-mode";
import GameManager from "#test/testUtils/gameManager";
import Phase from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";

describe("Items - Lock Capsule", () => {
  let phaserGame: Phaser.Game;
  let game: GameManager;

  beforeAll(() => {
    phaserGame = new Phase.Game({
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
      .startingModifier([{ name: "LOCK_CAPSULE" }]);
  });

  it("doesn't set the cost of common tier items to 0", async () => {
    await game.classicMode.startBattle();
    game.scene.phaseManager.overridePhase(
      new SelectModifierPhase(0, undefined, {
        guaranteedModifierTiers: [ModifierTier.COMMON, ModifierTier.COMMON, ModifierTier.COMMON],
        fillRemaining: false,
      }),
    );

    game.onNextPrompt("SelectModifierPhase", UiMode.MODIFIER_SELECT, () => {
      const selectModifierPhase = game.scene.phaseManager.getCurrentPhase() as SelectModifierPhase;
      const rerollCost = selectModifierPhase.getRerollCost(true);
      expect(rerollCost).toBe(150);
    });

    game.doSelectModifier();
    await game.phaseInterceptor.to("SelectModifierPhase");
  });
});
