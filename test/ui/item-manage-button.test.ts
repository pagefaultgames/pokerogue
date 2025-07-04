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
    game.override
      .battleStyle("single")
      .startingLevel(100)
      .startingHeldItems([
        { name: "BERRY", count: 1, type: BerryType.SITRUS },
        { name: "BERRY", count: 2, type: BerryType.APICOT },
        { name: "BERRY", count: 2, type: BerryType.LUM },
      ])
      .enemySpecies(SpeciesId.MAGIKARP)
      .enemyMoveset(MoveId.SPLASH);

    await game.classicMode.startBattle([SpeciesId.RAYQUAZA, SpeciesId.RAYQUAZA, SpeciesId.RAYQUAZA]);

    game.move.use(MoveId.DRAGON_CLAW);
  });

  it("manage button exists in the proper screen", async () => {
    game.onNextPrompt("SelectModifierPhase", UiMode.MODIFIER_SELECT, () => {
      expect(game.scene.ui.getHandler()).toBeInstanceOf(ModifierSelectUiHandler);

      const handler = game.scene.ui.getHandler() as ModifierSelectUiHandler;
      handler.setCursor(1); // Select/click manage items button
      handler.processInput(Button.ACTION);

      void game.scene.ui.setModeWithoutClear(UiMode.PARTY, PartyUiMode.MODIFIER_TRANSFER);
    });

    await game.phaseInterceptor.to("BattleEndPhase");

    game.onNextPrompt("SelectModifierPhase", UiMode.PARTY, () => {
      expect(game.scene.ui.getHandler()).toBeInstanceOf(PartyUiHandler);
      const handler = game.scene.ui.getHandler() as PartyUiHandler;

      handler.processInput(Button.DOWN);
      handler.processInput(Button.ACTION);
      expect(handler.optionsContainer.list).toHaveLength(0); // should select manage button, which has no menu

      game.phaseInterceptor.unlock();
    });

    await game.phaseInterceptor.to("SelectModifierPhase");
  });

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
      expect(handler.optionsContainer.list.length).toBeGreaterThan(0); // should select a pokemon, which has at least the cancel option

      game.phaseInterceptor.unlock();
    });

    await game.phaseInterceptor.to("SelectModifierPhase");
  });

  // Test that the manage button actually discards items, needs proofreading
  it("should actually discard items", async () => {
    game.onNextPrompt("SelectModifierPhase", UiMode.MODIFIER_SELECT, () => {
      expect(game.scene.ui.getHandler()).toBeInstanceOf(ModifierSelectUiHandler);

      const handler = game.scene.ui.getHandler() as ModifierSelectUiHandler;
      handler.setCursor(1); //check team menu,manage button shouldn't exist
      handler.processInput(Button.ACTION);

      void game.scene.ui.setModeWithoutClear(UiMode.PARTY, PartyUiMode.MODIFIER_TRANSFER);
    });

    await game.phaseInterceptor.to("BattleEndPhase");

    game.phaseInterceptor.addToNextPrompt("SelectModifierPhase", UiMode.PARTY, () => {
      expect(game.scene.ui.getHandler()).toBeInstanceOf(Number.POSITIVE_INFINITY);
      const handler = game.scene.ui.getHandler() as PartyUiHandler;

      handler.processInput(Button.DOWN);
      handler.processInput(Button.ACTION); //activate discard mode
      handler.processInput(Button.UP);
      handler.processInput(Button.ACTION); //select pokemon's items

      const pokemon = game.scene.getPlayerParty()[0];
      expect.soft(pokemon.getHeldItems()[0].stackCount).toBe(1);
      handler.processInput(Button.ACTION); //discard the items

      handler.processInput(Button.ACTION); //reselect pokemon's items
      expect.soft(pokemon.getHeldItems()[0].stackCount).toBe(2); //second item has a different count

      game.phaseInterceptor.unlock();
    });

    await game.phaseInterceptor.to("SelectModifierPhase");
  });
});
