import { TurnEndPhase } from "#app/phases/turn-end-phase";
import { MoveId } from "#enums/move-id";
import { SpeciesId } from "#enums/species-id";
import GameManager from "#test/testUtils/gameManager";
import Phase from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { BattleEndPhase } from "#app/phases/battle-end-phase";
import { TempCritBoosterModifier } from "#app/modifier/modifier";
import { UiMode } from "#enums/ui-mode";
import type ModifierSelectUiHandler from "#app/ui/modifier-select-ui-handler";
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
      .enemySpecies(SpeciesId.MAGIKARP)
      .enemyMoveset(MoveId.SPLASH)
      .moveset([MoveId.POUND])
      .startingHeldItems([{ name: "DIRE_HIT" }])
      .battleStyle("single");
  });

  it("should raise CRIT stage by 1", async () => {
    await game.classicMode.startBattle([SpeciesId.GASTLY]);

    const enemyPokemon = game.scene.getEnemyPokemon()!;

    vi.spyOn(enemyPokemon, "getCritStage");

    game.move.select(MoveId.POUND);

    await game.phaseInterceptor.to(TurnEndPhase);

    expect(enemyPokemon.getCritStage).toHaveReturnedWith(1);
  });

  it("should renew how many battles are left of existing DIRE_HIT when picking up new DIRE_HIT", async () => {
    game.override.itemRewards([{ name: "DIRE_HIT" }]);

    await game.classicMode.startBattle([SpeciesId.PIKACHU]);

    game.move.select(MoveId.SPLASH);

    await game.doKillOpponents();

    await game.phaseInterceptor.to(BattleEndPhase);

    const modifier = game.scene.findModifier(m => m instanceof TempCritBoosterModifier) as TempCritBoosterModifier;
    expect(modifier.getBattleCount()).toBe(4);

    // Forced DIRE_HIT to spawn in the first slot with override
    game.onNextPrompt(
      "SelectModifierPhase",
      UiMode.MODIFIER_SELECT,
      () => {
        const handler = game.scene.ui.getHandler() as ModifierSelectUiHandler;
        // Traverse to first modifier slot
        handler.setCursor(0);
        handler.setRowCursor(ShopCursorTarget.REWARDS);
        handler.processInput(Button.ACTION);
      },
      () => game.isCurrentPhase(CommandPhase) || game.isCurrentPhase(NewBattlePhase),
      true,
    );

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
  });
});
