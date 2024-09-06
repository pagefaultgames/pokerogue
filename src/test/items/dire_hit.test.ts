import { TurnEndPhase } from "#app/phases/turn-end-phase";
import { Moves } from "#enums/moves";
import { Species } from "#enums/species";
import GameManager from "#test/utils/gameManager";
import Phase from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { SPLASH_ONLY } from "../utils/testUtils";
import { BattleEndPhase } from "#app/phases/battle-end-phase";
import { TempCritBoosterModifier } from "#app/modifier/modifier";
import { Mode } from "#app/ui/ui";
import ModifierSelectUiHandler from "#app/ui/modifier-select-ui-handler";
import { Button } from "#app/enums/buttons";
import { CommandPhase } from "#app/phases/command-phase";
import { NewBattlePhase } from "#app/phases/new-battle-phase";
import { TurnInitPhase } from "#app/phases/turn-init-phase";
import { ShopCursorTarget } from "#app/enums/shop-cursor-target";

describe("Items - Dire Hit", () => {
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
      .enemySpecies(Species.MAGIKARP)
      .enemyMoveset(SPLASH_ONLY)
      .moveset([ Moves.POUND ])
      .startingHeldItems([{ name: "DIRE_HIT" }])
      .battleType("single")
      .disableCrits();

  }, 20000);

  it("should raise CRIT stage by 1", async () => {
    await game.startBattle([
      Species.GASTLY
    ]);

    const enemyPokemon = game.scene.getEnemyPokemon()!;

    vi.spyOn(enemyPokemon, "getCritStage");

    game.move.select(Moves.POUND);

    await game.phaseInterceptor.to(TurnEndPhase);

    expect(enemyPokemon.getCritStage).toHaveReturnedWith(1);
  }, 20000);

  it("should renew how many battles are left of existing DIRE_HIT when picking up new DIRE_HIT", async() => {
    game.override.itemRewards([{ name: "DIRE_HIT" }]);

    await game.startBattle([
      Species.PIKACHU
    ]);

    game.move.select(Moves.SPLASH);

    await game.doKillOpponents();

    await game.phaseInterceptor.to(BattleEndPhase);

    const modifier = game.scene.findModifier(m => m instanceof TempCritBoosterModifier) as TempCritBoosterModifier;
    expect(modifier.getBattleCount()).toBe(4);

    // Forced DIRE_HIT to spawn in the first slot with override
    game.onNextPrompt("SelectModifierPhase", Mode.MODIFIER_SELECT, () => {
      const handler = game.scene.ui.getHandler() as ModifierSelectUiHandler;
      // Traverse to first modifier slot
      handler.setCursor(0);
      handler.setRowCursor(ShopCursorTarget.REWARDS);
      handler.processInput(Button.ACTION);
    }, () => game.isCurrentPhase(CommandPhase) || game.isCurrentPhase(NewBattlePhase), true);

    await game.phaseInterceptor.to(TurnInitPhase);

    // Making sure only one booster is in the modifier list even after picking up another
    let count = 0;
    for (const m of game.scene.modifiers) {
      if (m instanceof TempCritBoosterModifier) {
        count++;
        expect((m as TempCritBoosterModifier).getBattleCount()).toBe(5);
      }
    }
    expect(count).toBe(1);
  }, 20000);
});
