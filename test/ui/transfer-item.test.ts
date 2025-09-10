import { BerryType } from "#enums/berry-type";
import { Button } from "#enums/buttons";
import { MoveId } from "#enums/move-id";
import { SpeciesId } from "#enums/species-id";
import { UiMode } from "#enums/ui-mode";
import { GameManager } from "#test/test-utils/game-manager";
import { ModifierSelectUiHandler } from "#ui/handlers/modifier-select-ui-handler";
import { PartyUiHandler, PartyUiMode } from "#ui/handlers/party-ui-handler";
import Phaser from "phaser";
import type BBCodeText from "phaser3-rex-plugins/plugins/bbcodetext";
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
      .startingWave(1)
      .startingHeldItems([
        { name: "BERRY", count: 1, type: BerryType.SITRUS },
        { name: "BERRY", count: 2, type: BerryType.APICOT },
        { name: "BERRY", count: 2, type: BerryType.LUM },
      ])
      .moveset([MoveId.DRAGON_CLAW])
      .enemySpecies(SpeciesId.MAGIKARP)
      .enemyMoveset([MoveId.SPLASH]);

    await game.classicMode.startBattle([SpeciesId.RAYQUAZA, SpeciesId.RAYQUAZA, SpeciesId.RAYQUAZA]);

    game.move.select(MoveId.DRAGON_CLAW);

    game.onNextPrompt("SelectModifierPhase", UiMode.MODIFIER_SELECT, () => {
      expect(game.scene.ui.getHandler()).toBeInstanceOf(ModifierSelectUiHandler);

      const handler = game.scene.ui.getHandler() as ModifierSelectUiHandler;
      handler.setCursor(1);
      handler.processInput(Button.ACTION);

      void game.scene.ui.setModeWithoutClear(UiMode.PARTY, PartyUiMode.MODIFIER_TRANSFER);
    });

    await game.phaseInterceptor.to("BattleEndPhase");
  });

  it("check red tint for held item limit in transfer menu", async () => {
    game.onNextPrompt("SelectModifierPhase", UiMode.PARTY, () => {
      expect(game.scene.ui.getHandler()).toBeInstanceOf(PartyUiHandler);

      const handler = game.scene.ui.getHandler() as PartyUiHandler;
      handler.processInput(Button.ACTION);

      expect(handler.optionsContainer.list.some(option => (option as BBCodeText).text?.includes("Sitrus Berry"))).toBe(
        true,
      );
      expect(
        handler.optionsContainer.list.some(option => (option as BBCodeText).text?.includes("Apicot Berry (2)")),
      ).toBe(true);
      expect(
        handler.optionsContainer.list.some(option =>
          new RegExp(/Lum Berry\[color.*(2)/).exec((option as BBCodeText).text),
        ),
      ).toBe(true);
    });

    await game.phaseInterceptor.to("SelectModifierPhase");
  });

  it("check transfer option for pokemon to transfer to", async () => {
    game.onNextPrompt("SelectModifierPhase", UiMode.PARTY, () => {
      expect(game.scene.ui.getHandler()).toBeInstanceOf(PartyUiHandler);

      const handler = game.scene.ui.getHandler() as PartyUiHandler;
      handler.processInput(Button.ACTION); // select Pokemon
      handler.processInput(Button.ACTION); // select held item (Sitrus Berry)

      handler.setCursor(1); // move to other Pokemon
      handler.processInput(Button.ACTION); // select Pokemon

      expect(handler.optionsContainer.list.some(option => (option as BBCodeText).text?.includes("Transfer"))).toBe(
        true,
      );
    });

    await game.phaseInterceptor.to("SelectModifierPhase");
  });
});
