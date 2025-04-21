import { BerryType } from "#app/enums/berry-type";
import { Button } from "#app/enums/buttons";
import { Moves } from "#app/enums/moves";
import { Species } from "#app/enums/species";
import ModifierSelectUiHandler from "#app/ui/modifier-select-ui-handler";
import PartyUiHandler, { PartyUiMode } from "#app/ui/party-ui-handler";
import { UiMode } from "#enums/ui-mode";
import GameManager from "#test/testUtils/gameManager";
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
    game.override.battleStyle("single");
    game.override.startingLevel(100);
    game.override.startingWave(1);
    game.override.startingHeldItems([
      { name: "BERRY", count: 1, type: BerryType.SITRUS },
      { name: "BERRY", count: 2, type: BerryType.APICOT },
      { name: "BERRY", count: 2, type: BerryType.LUM },
    ]);
    game.override.moveset([Moves.DRAGON_CLAW]);
    game.override.enemySpecies(Species.MAGIKARP);
    game.override.enemyMoveset([Moves.SPLASH]);

    await game.classicMode.startBattle([Species.RAYQUAZA, Species.RAYQUAZA, Species.RAYQUAZA]);

    game.move.select(Moves.DRAGON_CLAW);

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
        handler.optionsContainer.list.some(option => RegExp(/Lum Berry\[color.*(2)/).exec((option as BBCodeText).text)),
      ).toBe(true);

      game.phaseInterceptor.unlock();
    });

    await game.phaseInterceptor.to("SelectModifierPhase");
  }, 20000);

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

      game.phaseInterceptor.unlock();
    });

    await game.phaseInterceptor.to("SelectModifierPhase");
  }, 20000);
});
