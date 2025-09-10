import { Button } from "#enums/buttons";
import { MysteryEncounterTier } from "#enums/mystery-encounter-tier";
import { MysteryEncounterType } from "#enums/mystery-encounter-type";
import { SpeciesId } from "#enums/species-id";
import { UiMode } from "#enums/ui-mode";
import { MysteryEncounterOptionSelectedPhase } from "#phases/mystery-encounter-phases";
import { GameManager } from "#test/test-utils/game-manager";
import type { MessageUiHandler } from "#ui/handlers/message-ui-handler";
import type { MysteryEncounterUiHandler } from "#ui/handlers/mystery-encounter-ui-handler";
import i18next from "i18next";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

describe("Mystery Encounter Phases", () => {
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

  beforeEach(() => {
    game = new GameManager(phaserGame);
    game.override.startingWave(12).mysteryEncounterChance(100).seed("test"); // Seed guarantees wild encounter to be replaced by ME
  });

  describe("MysteryEncounterPhase", () => {
    it("Runs to MysteryEncounterPhase", async () => {
      await game.runToMysteryEncounter(MysteryEncounterType.MYSTERIOUS_CHALLENGERS, [
        SpeciesId.CHARIZARD,
        SpeciesId.VOLCARONA,
      ]);

      await game.phaseInterceptor.to("MysteryEncounterPhase", false);
      expect(game).toBeAtPhase("MysteryEncounterPhase");
    });

    it("Runs MysteryEncounterPhase", async () => {
      await game.runToMysteryEncounter(MysteryEncounterType.MYSTERIOUS_CHALLENGERS, [
        SpeciesId.CHARIZARD,
        SpeciesId.VOLCARONA,
      ]);

      game.onNextPrompt("MysteryEncounterPhase", UiMode.MYSTERY_ENCOUNTER, () => {
        // End phase early for test
        game.endPhase();
      });
      await game.phaseInterceptor.to("MysteryEncounterPhase");

      expect(game.scene.mysteryEncounterSaveData.encounteredEvents.length).toBeGreaterThan(0);
      expect(game.scene.mysteryEncounterSaveData.encounteredEvents[0].type).toEqual(
        MysteryEncounterType.MYSTERIOUS_CHALLENGERS,
      );
      expect(game.scene.mysteryEncounterSaveData.encounteredEvents[0].tier).toEqual(MysteryEncounterTier.GREAT);
      expect(game.scene.ui.getMode()).toBe(UiMode.MYSTERY_ENCOUNTER);
    });

    it("Selects an option for MysteryEncounterPhase", async () => {
      const { ui } = game.scene;
      vi.spyOn(ui, "showDialogue");
      vi.spyOn(ui, "showText");
      await game.runToMysteryEncounter(MysteryEncounterType.MYSTERIOUS_CHALLENGERS, [
        SpeciesId.CHARIZARD,
        SpeciesId.VOLCARONA,
      ]);

      game.onNextPrompt("MysteryEncounterPhase", UiMode.MESSAGE, () => {
        const handler = game.scene.ui.getHandler() as MessageUiHandler;
        handler.processInput(Button.ACTION);
      });

      await game.phaseInterceptor.to("MysteryEncounterPhase");

      // Select option 1 for encounter
      const handler = game.scene.ui.getHandler() as MysteryEncounterUiHandler;
      handler.unblockInput();
      handler.processInput(Button.ACTION);

      // Waitfor required so that option select messages and preOptionPhase logic are handled
      await vi.waitFor(() =>
        expect(game.scene.phaseManager.getCurrentPhase()?.constructor.name).toBe(
          MysteryEncounterOptionSelectedPhase.name,
        ),
      );
      expect(ui.getMode()).toBe(UiMode.MESSAGE);
      expect(ui.showDialogue).toHaveBeenCalledTimes(1);
      expect(ui.showText).toHaveBeenCalledTimes(2);
      expect(ui.showDialogue).toHaveBeenCalledWith(
        i18next.t("battle:mysteryEncounterAppeared"),
        "???",
        null,
        expect.any(Function),
      );
      expect(ui.showText).toHaveBeenCalledWith(
        i18next.t("mysteryEncounters/mysteriousChallengers:intro"),
        null,
        expect.any(Function),
        750,
        true,
      );
      expect(ui.showText).toHaveBeenCalledWith(
        i18next.t("mysteryEncounters/mysteriousChallengers:option.selected"),
        null,
        expect.any(Function),
        300,
        true,
      );
    });
  });

  describe("MysteryEncounterOptionSelectedPhase", () => {
    it("runs phase", () => {});

    it("handles onOptionSelect execution", () => {});

    it("hides intro visuals", () => {});

    it("does not hide intro visuals if option disabled", () => {});
  });

  describe("MysteryEncounterBattlePhase", () => {
    it("runs phase", () => {});

    it("handles TRAINER_BATTLE variant", () => {});

    it("handles BOSS_BATTLE variant", () => {});

    it("handles WILD_BATTLE variant", () => {});

    it("handles double battle", () => {});
  });

  describe("MysteryEncounterRewardsPhase", () => {
    it("runs phase", () => {});

    it("handles doEncounterRewards", () => {});

    it("handles heal phase if enabled", () => {});
  });

  describe("PostMysteryEncounterPhase", () => {
    it("runs phase", () => {});

    it("handles onPostOptionSelect execution", () => {});

    it("runs to next EncounterPhase", () => {});
  });
});
