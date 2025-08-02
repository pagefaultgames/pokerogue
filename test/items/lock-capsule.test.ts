import { AbilityId } from "#enums/ability-id";
import { ModifierTier } from "#enums/modifier-tier";
import { MoveId } from "#enums/move-id";
import type { SelectModifierPhase } from "#phases/select-modifier-phase";
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
      .startingModifier([{ name: "LOCK_CAPSULE" }]);
  });

  it("doesn't set the cost of common tier items to 0", async () => {
    await game.classicMode.startBattle();
    game.scene.phaseManager.clearAllPhases();
    game.scene.phaseManager.unshiftNew("SelectModifierPhase", 0, undefined, {
      guaranteedModifierTiers: [ModifierTier.COMMON, ModifierTier.COMMON, ModifierTier.COMMON],
      fillRemaining: false,
    });

    game.doSelectModifier();
    await game.phaseInterceptor.to("SelectModifierPhase", false);

    const selectModifierPhase = game.scene.phaseManager.getCurrentPhase() as SelectModifierPhase;
    const rerollCost = selectModifierPhase.getRerollCost(true);
    expect(rerollCost).toBe(150);
  });
});
