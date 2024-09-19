import {afterEach, beforeAll, beforeEach, expect, describe, it, vi } from "vitest";
import GameManager from "#app/test/utils/gameManager";
import Phaser from "phaser";
import {Species} from "#enums/species";
import { MysteryEncounterOptionSelectedPhase, MysteryEncounterPhase } from "#app/phases/mystery-encounter-phases";
import {Mode} from "#app/ui/ui";
import {Button} from "#enums/buttons";
import MysteryEncounterUiHandler from "#app/ui/mystery-encounter-ui-handler";
import {MysteryEncounterType} from "#enums/mystery-encounter-type";
import MessageUiHandler from "#app/ui/message-ui-handler";
import { MysteryEncounterTier } from "#enums/mystery-encounter-tier";

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
    game.override.startingWave(11);
    game.override.mysteryEncounterChance(100);
    // Seed guarantees wild encounter to be replaced by ME
    game.override.seed("test");
  });

  describe("MysteryEncounterPhase", () => {
    it("Runs to MysteryEncounterPhase", async() => {
      await game.runToMysteryEncounter(MysteryEncounterType.MYSTERIOUS_CHALLENGERS, [Species.CHARIZARD, Species.VOLCARONA]);

      await game.phaseInterceptor.to(MysteryEncounterPhase, false);
      expect(game.scene.getCurrentPhase()?.constructor.name).toBe(MysteryEncounterPhase.name);
    });

    it("Runs MysteryEncounterPhase", async() => {
      await game.runToMysteryEncounter(MysteryEncounterType.MYSTERIOUS_CHALLENGERS, [Species.CHARIZARD, Species.VOLCARONA]);

      game.onNextPrompt("MysteryEncounterPhase", Mode.MYSTERY_ENCOUNTER, () => {
        // End phase early for test
        game.phaseInterceptor.superEndPhase();
      });
      await game.phaseInterceptor.run(MysteryEncounterPhase);

      expect(game.scene.mysteryEncounterSaveData.encounteredEvents.length).toBeGreaterThan(0);
      expect(game.scene.mysteryEncounterSaveData.encounteredEvents[0].type).toEqual(MysteryEncounterType.MYSTERIOUS_CHALLENGERS);
      expect(game.scene.mysteryEncounterSaveData.encounteredEvents[0].tier).toEqual(MysteryEncounterTier.GREAT);
      expect(game.scene.ui.getMode()).toBe(Mode.MYSTERY_ENCOUNTER);
    });

    it("Selects an option for MysteryEncounterPhase", async() => {
      const { ui } = game.scene;
      vi.spyOn(ui, "showDialogue");
      vi.spyOn(ui, "showText");
      await game.runToMysteryEncounter(MysteryEncounterType.MYSTERIOUS_CHALLENGERS, [Species.CHARIZARD, Species.VOLCARONA]);

      game.onNextPrompt("MysteryEncounterPhase", Mode.MESSAGE, () => {
        const handler = game.scene.ui.getHandler() as MessageUiHandler;
        handler.processInput(Button.ACTION);
      });

      await game.phaseInterceptor.run(MysteryEncounterPhase);

      // Select option 1 for encounter
      const handler = game.scene.ui.getHandler() as MysteryEncounterUiHandler;
      handler.unblockInput();
      handler.processInput(Button.ACTION);

      // Waitfor required so that option select messages and preOptionPhase logic are handled
      await vi.waitFor(() => expect(game.scene.getCurrentPhase()?.constructor.name).toBe(MysteryEncounterOptionSelectedPhase.name));
      expect(ui.getMode()).toBe(Mode.MESSAGE);
      expect(ui.showDialogue).toHaveBeenCalledTimes(1);
      expect(ui.showText).toHaveBeenCalledTimes(2);
      expect(ui.showDialogue).toHaveBeenCalledWith("battle:mysteryEncounterAppeared", "???", null, expect.any(Function));
      expect(ui.showText).toHaveBeenCalledWith("mysteryEncounter:mysteriousChallengers.intro", null, expect.any(Function), 750, true);
      expect(ui.showText).toHaveBeenCalledWith("mysteryEncounter:mysteriousChallengers.option.selected", null, expect.any(Function), 300, true);
    });
  });

  describe("MysteryEncounterOptionSelectedPhase", () => {
    it("runs phase", () => {

    });

    it("handles onOptionSelect execution", () => {

    });

    it("hides intro visuals", () => {

    });

    it("does not hide intro visuals if option disabled", () => {

    });
  });

  describe("MysteryEncounterBattlePhase", () => {
    it("runs phase", () => {

    });

    it("handles TRAINER_BATTLE variant", () => {

    });

    it("handles BOSS_BATTLE variant", () => {

    });

    it("handles WILD_BATTLE variant", () => {

    });

    it("handles double battle", () => {

    });
  });

  describe("MysteryEncounterRewardsPhase", () => {
    it("runs phase", () => {

    });

    it("handles doEncounterRewards", () => {

    });

    it("handles heal phase if enabled", () => {

    });
  });

  describe("PostMysteryEncounterPhase", () => {
    it("runs phase", () => {

    });

    it("handles onPostOptionSelect execution", () => {

    });

    it("runs to next EncounterPhase", () => {

    });
  });
});

