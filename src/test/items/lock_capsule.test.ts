import { Abilities } from "#app/enums/abilities";
import { Moves } from "#app/enums/moves";
import { ModifierTypeOption, modifierTypes } from "#app/modifier/modifier-type";
import { SelectModifierPhase } from "#app/phases/select-modifier-phase";
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
      .moveset([Moves.SURF])
      .enemyAbility(Abilities.BALL_FETCH)
      .startingModifier([{ name: "LOCK_CAPSULE" }]);
  });

  it("doesn't set the cost of common tier items to 0", async () => {
    await game.startBattle();

    game.move.select(Moves.SURF);
    await game.phaseInterceptor.to(SelectModifierPhase, false);

    const rewards = game.scene.getCurrentPhase() as SelectModifierPhase;
    const potion = new ModifierTypeOption(modifierTypes.POTION(), 0, 40); // Common tier item
    const rerollCost = rewards.getRerollCost([potion, potion, potion], true);

    expect(rerollCost).toBe(150);
  }, 20000);
});
