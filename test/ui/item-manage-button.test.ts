import { BerryType } from "#enums/berry-type";
import { Button } from "#enums/buttons";
import { MoveId } from "#enums/move-id";
import { SpeciesId } from "#enums/species-id";
import { UiMode } from "#enums/ui-mode";
import type { Pokemon } from "#field/pokemon";
import { GameManager } from "#test/test-utils/game-manager";
import type { ModifierSelectUiHandler } from "#ui/handlers/modifier-select-ui-handler";
import { type PartyUiHandler, PartyUiMode } from "#ui/handlers/party-ui-handler";
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

    await game.phaseInterceptor.to("SelectModifierPhase");
  });

  it("manage button exists in the proper screen", async () => {
    let handlerLength: Phaser.GameObjects.GameObject[] | undefined;

    await new Promise<void>(resolve => {
      //select manage items menu
      game.onNextPrompt("SelectModifierPhase", UiMode.MODIFIER_SELECT, async () => {
        await new Promise(r => setTimeout(r, 100));
        const handler = game.scene.ui.getHandler() as ModifierSelectUiHandler;

        handler.processInput(Button.DOWN);
        handler.setCursor(1);
        handler.processInput(Button.ACTION);
      });

      game.onNextPrompt("SelectModifierPhase", UiMode.PARTY, async () => {
        await new Promise(r => setTimeout(r, 100));
        const handler = game.scene.ui.getHandler() as PartyUiHandler;

        handler.processInput(Button.DOWN);
        handler.processInput(Button.ACTION);
        handlerLength = handler.optionsContainer.list;

        handler.processInput(Button.CANCEL);

        resolve();
      });
    });

    expect(handlerLength).toHaveLength(0); // should select manage button, which has no menu
  });

  it("manage button doesn't exist in the other screens", async () => {
    let handlerLength: Phaser.GameObjects.GameObject[] | undefined;

    await new Promise<void>(resolve => {
      game.onNextPrompt("SelectModifierPhase", UiMode.MODIFIER_SELECT, async () => {
        await new Promise(r => setTimeout(r, 100));
        const handler = game.scene.ui.getHandler() as ModifierSelectUiHandler;

        handler.processInput(Button.DOWN);
        handler.setCursor(2);
        handler.processInput(Button.ACTION);
      });

      game.onNextPrompt("SelectModifierPhase", UiMode.PARTY, async () => {
        await new Promise(r => setTimeout(r, 100));
        const handler = game.scene.ui.getHandler() as PartyUiHandler;

        handler.processInput(Button.DOWN);
        handler.processInput(Button.ACTION);
        handlerLength = handler.optionsContainer.list;

        handler.processInput(Button.CANCEL);
        handler.processInput(Button.CANCEL);

        resolve();
      });
    });

    expect(handlerLength).toHaveLength(6); // should select 2nd pokemon (length is 5 options + image)
  });

  // Test that the manage button actually discards items, needs proofreading
  it("should discard items when button is selected", async () => {
    let pokemon: Pokemon | undefined;

    await new Promise<void>(resolve => {
      game.onNextPrompt("SelectModifierPhase", UiMode.MODIFIER_SELECT, async () => {
        await new Promise(r => setTimeout(r, 100));
        const handler = game.scene.ui.getHandler() as ModifierSelectUiHandler;

        handler.processInput(Button.DOWN);
        handler.setCursor(1);
        handler.processInput(Button.ACTION);
      });
      game.onNextPrompt("SelectModifierPhase", UiMode.PARTY, async () => {
        await new Promise(r => setTimeout(r, 100));
        const handler = game.scene.ui.getHandler() as PartyUiHandler;

        // Enter discard mode and select first party member
        handler.setCursor(7);
        handler.processInput(Button.ACTION);
        handler.setCursor(0);
        handler.processInput(Button.ACTION);
        pokemon = game.field.getPlayerPokemon();

        resolve();
      });
    });

    expect(pokemon).toBeDefined();
    if (pokemon) {
      expect(pokemon.getHeldItems()).toHaveLength(3);
      expect(pokemon.getHeldItems().map(h => h.stackCount)).toEqual([1, 2, 2]);
    }

    await new Promise<void>(resolve => {
      game.onNextPrompt("SelectModifierPhase", UiMode.PARTY, async () => {
        await new Promise(r => setTimeout(r, 100));
        const handler = game.scene.ui.getHandler() as PartyUiHandler;
        handler.processInput(Button.ACTION);
        resolve();
      });
    });

    await new Promise<void>(resolve => {
      game.onNextPrompt("SelectModifierPhase", UiMode.PARTY, async () => {
        await new Promise(r => setTimeout(r, 100));
        const handler = game.scene.ui.getHandler() as PartyUiHandler;
        handler.processInput(Button.ACTION);

        pokemon = game.field.getPlayerPokemon();

        handler.processInput(Button.CANCEL);
        resolve();
      });
    });

    expect(pokemon).toBeDefined();
    if (pokemon) {
      // Sitrus berry was discarded, leaving 2 stacks of 2 berries behind
      expect(pokemon.getHeldItems()).toHaveLength(2);
      expect(pokemon.getHeldItems().map(h => h.stackCount)).toEqual([2, 2]);
    }
  });

  // TODO: This test breaks when running all tests on github. Fix this once hotfix period is over.
  it.todo("should not allow changing to discard mode when transfering items", async () => {
    let handler: PartyUiHandler | undefined;

    const { resolve, promise } = Promise.withResolvers<void>();

    game.onNextPrompt("SelectModifierPhase", UiMode.MODIFIER_SELECT, async () => {
      await new Promise(r => setTimeout(r, 100));
      const modifierHandler = game.scene.ui.getHandler() as ModifierSelectUiHandler;

      modifierHandler.processInput(Button.DOWN);
      modifierHandler.setCursor(1);
      modifierHandler.processInput(Button.ACTION);
    });

    game.onNextPrompt("SelectModifierPhase", UiMode.PARTY, async () => {
      await new Promise(r => setTimeout(r, 100));
      handler = game.scene.ui.getHandler() as PartyUiHandler;

      handler.setCursor(0);
      handler.processInput(Button.ACTION);

      await new Promise(r => setTimeout(r, 100));
      handler.processInput(Button.ACTION);

      resolve();
    });

    await promise;
    expect(handler).toBeDefined();
    if (handler) {
      const partyMode = handler["partyUiMode"];
      expect(partyMode).toBe(PartyUiMode.MODIFIER_TRANSFER);

      handler.setCursor(7);
      handler.processInput(Button.ACTION);
      // Should not change mode to discard
      expect(handler["partyUiMode"]).toBe(PartyUiMode.MODIFIER_TRANSFER);

      handler.processInput(Button.CANCEL);
      handler.setCursor(7);
      handler.processInput(Button.ACTION);
      // Should change mode to discard
      expect(handler["partyUiMode"]).toBe(PartyUiMode.DISCARD);
    }
  });
});
