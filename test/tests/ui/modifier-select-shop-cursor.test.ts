import type { BattleScene } from "#app/battle-scene";
import { ShopCursorTarget } from "#enums/shop-cursor-target";
import { SpeciesId } from "#enums/species-id";
import { UiMode } from "#enums/ui-mode";
import { SelectModifierPhase } from "#phases/select-modifier-phase";
import { GameManager } from "#test/framework/game-manager";
import { initSceneWithoutEncounterPhase } from "#test/utils/game-manager-utils";
import { ModifierSelectUiHandler } from "#ui/modifier-select-ui-handler";
import Phaser from "phaser";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

describe("UI - ModifierSelectUiHandler - shop cursor target", () => {
  let phaserGame: Phaser.Game;
  let game: GameManager;
  let scene: BattleScene;

  beforeAll(() => {
    phaserGame = new Phaser.Game({
      type: Phaser.HEADLESS,
    });
  });

  beforeEach(() => {
    game = new GameManager(phaserGame);
    scene = game.scene;
  });

  // Regression test for #7409: on a wave with no shop items (e.g. a boss/Gym wave,
  // where `getPlayerShopModifierTypeOptionsForWave` returns []), having the
  // "Shop Cursor Target" setting on "Shop" pointed the row cursor at a shop row
  // that does not exist, crashing with a TypeError in `getRowItems`
  // (`shopOptionsRows.at(-1)!.length` on an empty array).
  it("does not crash when 'Shop' target is selected but no shop options exist", async () => {
    initSceneWithoutEncounterPhase(scene, [SpeciesId.ABRA, SpeciesId.VOLCARONA]);
    // Wave 10 is a boss wave -> `getPlayerShopModifierTypeOptionsForWave(10)` returns [],
    // leaving the shop with no rows even though the game mode still "has a shop".
    scene.currentBattle.waveIndex = 10;
    scene.shopCursorTarget = ShopCursorTarget.SHOP;

    const selectModifierPhase = new SelectModifierPhase();
    scene.phaseManager.unshiftPhase(selectModifierPhase);
    await game.phaseInterceptor.to("SelectModifierPhase");

    expect(scene.ui.getMode()).toBe(UiMode.MODIFIER_SELECT);

    const handler = scene.ui.handlers.find(h => h instanceof ModifierSelectUiHandler) as ModifierSelectUiHandler;

    // Precondition: this wave genuinely has no shop rows.
    expect(handler.shopOptionsRows).toHaveLength(0);

    // The initial cursor placement (`updateCursorTarget`) runs asynchronously once the
    // reward animations settle, and finishes by setting `awaitingActionInput`. Before the
    // fix, that async path threw an unhandled TypeError in `getRowItems`
    // (`shopOptionsRows.at(-1)!.length` on an empty array) and never reached this point.
    await vi.waitFor(() => expect(handler["awaitingActionInput"]).toBe(true));

    // The cursor must have fallen back to the rewards row, not a nonexistent shop row.
    expect(handler["rowCursor"]).toBe(ShopCursorTarget.REWARDS);
  });
});
