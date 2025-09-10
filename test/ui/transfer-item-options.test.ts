import { BerryType } from "#enums/berry-type";
import { Button } from "#enums/buttons";
import { MoveId } from "#enums/move-id";
import { SpeciesId } from "#enums/species-id";
import { UiMode } from "#enums/ui-mode";
import { GameManager } from "#test/test-utils/game-manager";
import { type PartyUiHandler, PartyUiMode } from "#ui/handlers/party-ui-handler";
import type { RenameFormUiHandler } from "#ui/handlers/rename-form-ui-handler";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";

// todo: Some tests fail when running all tests at once, but pass when running individually. Seams like it's always the 2nd and 4th (non todo) tests that fail.
describe("UI - Transfer Item Options", () => {
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

    await game.classicMode.startBattle([SpeciesId.BULBASAUR, SpeciesId.SQUIRTLE, SpeciesId.CHARMANDER]);

    game.move.use(MoveId.DRAGON_CLAW);

    await game.phaseInterceptor.to("SelectModifierPhase");
    await game.scene.ui.setModeWithoutClear(UiMode.PARTY, PartyUiMode.MODIFIER_TRANSFER);
  });

  it.todo("should open the summary screen while transfering an item", async () => {
    await new Promise<void>(resolve => {
      game.onNextPrompt("SelectModifierPhase", UiMode.PARTY, async () => {
        await new Promise(r => setTimeout(r, 100));
        const handler = game.scene.ui.getHandler() as PartyUiHandler;

        // Select first party member
        handler.setCursor(0);
        handler.processInput(Button.ACTION);

        resolve();
      });
    });

    await new Promise<void>(resolve => {
      game.onNextPrompt("SelectModifierPhase", UiMode.PARTY, async () => {
        await new Promise(r => setTimeout(r, 100));
        const handler = game.scene.ui.getHandler() as PartyUiHandler;
        // select item to transfer
        handler.processInput(Button.ACTION);
        resolve();
      });
    });

    await new Promise(r => setTimeout(r, 100));
    const handler = game.scene.ui.getHandler() as PartyUiHandler;

    // move to second pokemon
    handler.setCursor(1);
    handler.processInput(Button.ACTION);

    // select summary
    handler.processInput(Button.DOWN);
    handler.processInput(Button.ACTION);

    await new Promise(r => setTimeout(r, 100));
    expect(game.scene.ui.getMode()).toBe(UiMode.SUMMARY);
  });

  it.todo("should open the pokèdex screen while transfering an item", async () => {
    await new Promise<void>(resolve => {
      game.onNextPrompt("SelectModifierPhase", UiMode.PARTY, async () => {
        await new Promise(r => setTimeout(r, 100));
        const handler = game.scene.ui.getHandler() as PartyUiHandler;

        // Select first party member
        handler.setCursor(0);
        handler.processInput(Button.ACTION);

        resolve();
      });
    });

    await new Promise<void>(resolve => {
      game.onNextPrompt("SelectModifierPhase", UiMode.PARTY, async () => {
        await new Promise(r => setTimeout(r, 100));
        const handler = game.scene.ui.getHandler() as PartyUiHandler;
        // select item to transfer
        handler.processInput(Button.ACTION);
        resolve();
      });
    });

    await new Promise(r => setTimeout(r, 100));
    const handler = game.scene.ui.getHandler() as PartyUiHandler;
    // move to second pokemon
    handler.setCursor(1);
    handler.processInput(Button.ACTION);

    // select pokèdex
    handler.processInput(Button.DOWN);
    handler.processInput(Button.DOWN);
    handler.processInput(Button.ACTION);

    await new Promise(r => setTimeout(r, 100));
    expect(game.scene.ui.getMode()).toBe(UiMode.POKEDEX_PAGE);
  });

  it.todo("should open the rename screen and rename the pokemon while transfering an item", async () => {
    await new Promise<void>(resolve => {
      game.onNextPrompt("SelectModifierPhase", UiMode.PARTY, async () => {
        await new Promise(r => setTimeout(r, 100));
        const handler = game.scene.ui.getHandler() as PartyUiHandler;

        // Select first party member
        handler.setCursor(0);
        handler.processInput(Button.ACTION);

        resolve();
      });
    });

    await new Promise<void>(resolve => {
      game.onNextPrompt("SelectModifierPhase", UiMode.PARTY, async () => {
        await new Promise(r => setTimeout(r, 100));
        const handler = game.scene.ui.getHandler() as PartyUiHandler;
        // select item to transfer
        handler.processInput(Button.ACTION);
        resolve();
      });
    });

    await new Promise(r => setTimeout(r, 100));
    let handler: PartyUiHandler | RenameFormUiHandler | undefined;
    handler = game.scene.ui.getHandler() as PartyUiHandler;

    // move to second pokemon
    handler.setCursor(1);
    handler.processInput(Button.ACTION);

    // select rename
    handler.processInput(Button.DOWN);
    handler.processInput(Button.DOWN);
    handler.processInput(Button.DOWN);
    handler.processInput(Button.ACTION);

    const pokemon = game.scene.getPlayerParty()[1];
    if (!pokemon) {
      expect.fail("Pokemon is undefined");
    }
    const nickname = pokemon.nickname;

    expect(nickname).toBe(undefined);

    await new Promise(r => setTimeout(r, 100));
    expect(game.scene.ui.getMode()).toBe(UiMode.RENAME_POKEMON);
    await new Promise(r => setTimeout(r, 100));
    handler = game.scene.ui.getHandler() as RenameFormUiHandler;
    handler["inputs"][0].setText("New nickname");
    handler.processInput(Button.SUBMIT);
    await new Promise(r => setTimeout(r, 100));
    // get the sanitized name
    const sanitizedName = btoa(unescape(encodeURIComponent("New nickname")));
    expect(pokemon.nickname).toBe(sanitizedName);
  });

  it.todo("should pause the evolution while transfering an item", async () => {
    await new Promise<void>(resolve => {
      game.onNextPrompt("SelectModifierPhase", UiMode.PARTY, async () => {
        await new Promise(r => setTimeout(r, 100));
        const handler = game.scene.ui.getHandler() as PartyUiHandler;

        // Select first party member
        handler.setCursor(0);
        handler.processInput(Button.ACTION);

        resolve();
      });
    });

    await new Promise<void>(resolve => {
      game.onNextPrompt("SelectModifierPhase", UiMode.PARTY, async () => {
        await new Promise(r => setTimeout(r, 100));
        const handler = game.scene.ui.getHandler() as PartyUiHandler;
        // select item to transfer
        handler.processInput(Button.ACTION);
        resolve();
      });
    });

    await new Promise(r => setTimeout(r, 100));
    const handler = game.scene.ui.getHandler() as PartyUiHandler;

    // move to second pokemon
    handler.setCursor(1);
    handler.processInput(Button.ACTION);

    const pokemon = game.scene.getPlayerParty()[1];

    if (!pokemon) {
      expect.fail("Pokemon is undefined");
    }
    if (pokemon.pauseEvolutions !== undefined) {
      expect(pokemon.pauseEvolutions).toBe(false);
    }

    // select pause evolution
    handler.processInput(Button.DOWN);
    handler.processInput(Button.DOWN);
    handler.processInput(Button.DOWN);
    handler.processInput(Button.DOWN);
    handler.processInput(Button.ACTION);

    await new Promise(r => setTimeout(r, 100));
    expect(game.scene.ui.getMode()).toBe(UiMode.PARTY);
    expect(pokemon.pauseEvolutions).toBe(true);
  });
});
