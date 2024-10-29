import { Abilities } from "#app/enums/abilities";
import { Moves } from "#app/enums/moves";
import { ModifierTier } from "#app/modifier/modifier-tier";
import { SelectModifierPhase } from "#app/phases/select-modifier-phase";
import { Mode } from "#app/ui/ui";
import GameManager from "#test/utils/gameManager";
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
      .battleType("single")
      .startingLevel(200)
      .moveset([ Moves.SURF ])
      .enemyAbility(Abilities.BALL_FETCH)
      .startingModifier([{ name: "LOCK_CAPSULE" }]);
  });

  it("doesn't set the cost of common tier items to 0", async () => {
    await game.classicMode.startBattle();
    game.scene.overridePhase(new SelectModifierPhase(game.scene, 0, undefined, { guaranteedModifierTiers: [ ModifierTier.COMMON, ModifierTier.COMMON, ModifierTier.COMMON ], fillRemaining: false }));

    game.onNextPrompt("SelectModifierPhase", Mode.MODIFIER_SELECT, () => {
      const selectModifierPhase = game.scene.getCurrentPhase() as SelectModifierPhase;
      const rerollCost = selectModifierPhase.getRerollCost(true);
      expect(rerollCost).toBe(150);
    });

    game.doSelectModifier();
    await game.phaseInterceptor.to("SelectModifierPhase");
  }, 20000);
});
