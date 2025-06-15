import { BerryType } from "#app/enums/berry-type";
import { Button } from "#app/enums/buttons";
import { MoveId } from "#enums/move-id";
import { SpeciesId } from "#enums/species-id";
import ModifierSelectUiHandler from "#app/ui/modifier-select-ui-handler";
import PartyUiHandler, { PartyUiMode } from "#app/ui/party-ui-handler";
import { UiMode } from "#enums/ui-mode";
import GameManager from "#test/testUtils/gameManager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";

describe("UI - Transfer Items", () => {
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

  beforeEach(async () => {
    game = new GameManager(phaserGame);
    game.override.battleStyle("single");
    game.override.startingLevel(100);
    game.override.startingWave(1);
    game.override.startingHeldItems([
      { name: "BERRY", count: 1, type: BerryType.SITRUS },
      { name: "BERRY", count: 2, type: BerryType.APICOT },
      { name: "BERRY", count: 2, type: BerryType.LUM },
    ]);
    game.override.moveset([MoveId.DRAGON_CLAW]);
    game.override.enemySpecies(SpeciesId.MAGIKARP);
    game.override.enemyMoveset([MoveId.SPLASH]);

    await game.classicMode.startBattle([SpeciesId.RAYQUAZA, SpeciesId.RAYQUAZA, SpeciesId.RAYQUAZA]);

    game.move.select(MoveId.DRAGON_CLAW);
  });

  it("manage button exists in the proper screen", async () => {
    game.onNextPrompt("SelectModifierPhase", UiMode.MODIFIER_SELECT, () => {
      expect(game.scene.ui.getHandler()).toBeInstanceOf(ModifierSelectUiHandler);

      const handler = game.scene.ui.getHandler() as ModifierSelectUiHandler;
      handler.setCursor(1); //manage items menu, manage button should exist
      handler.processInput(Button.ACTION);

      void game.scene.ui.setModeWithoutClear(UiMode.PARTY, PartyUiMode.MODIFIER_TRANSFER);
    });

    await game.phaseInterceptor.to("BattleEndPhase");

    game.phaseInterceptor.addToNextPrompt("SelectModifierPhase", UiMode.PARTY, () => {
      expect(game.scene.ui.getHandler()).toBeInstanceOf(PartyUiHandler);
      const handler = game.scene.ui.getHandler() as PartyUiHandler;

      handler.processInput(Button.DOWN);
      handler.processInput(Button.ACTION);
      expect(handler.optionsContainer.list.length).toBe(0); //should select manage button,which has no menu

      game.phaseInterceptor.unlock();
    });

    await game.phaseInterceptor.to("SelectModifierPhase");
  }, 20000);

  it("manage button doesn't exist in the other screens", async () => {
    game.onNextPrompt("SelectModifierPhase", UiMode.MODIFIER_SELECT, () => {
      expect(game.scene.ui.getHandler()).toBeInstanceOf(ModifierSelectUiHandler);

      const handler = game.scene.ui.getHandler() as ModifierSelectUiHandler;
      handler.setCursor(2); //check team menu,manage button shouldn't exist
      handler.processInput(Button.ACTION);

      void game.scene.ui.setModeWithoutClear(UiMode.PARTY, PartyUiMode.MODIFIER_TRANSFER);
    });

    await game.phaseInterceptor.to("BattleEndPhase");

    game.phaseInterceptor.addToNextPrompt("SelectModifierPhase", UiMode.PARTY, () => {
      expect(game.scene.ui.getHandler()).toBeInstanceOf(PartyUiHandler);
      const handler = game.scene.ui.getHandler() as PartyUiHandler;

      handler.processInput(Button.DOWN);
      handler.processInput(Button.ACTION);
      expect(handler.optionsContainer.list.length).toBeGreaterThan(0); //should select a pokemon, which has at least the cancel option

      game.phaseInterceptor.unlock();
    });

    await game.phaseInterceptor.to("SelectModifierPhase");
  }, 20000);
});
