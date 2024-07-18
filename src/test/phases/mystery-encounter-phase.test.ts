import {afterEach, beforeAll, beforeEach, expect, describe, it, vi} from "vitest";
import * as overrides from "../../overrides";
import GameManager from "#app/test/utils/gameManager";
import Phaser from "phaser";
import {Species} from "#enums/species";
import {MysteryEncounterOptionSelectedPhase, MysteryEncounterPhase} from "#app/phases/mystery-encounter-phase";
import {Mode} from "#app/ui/ui";
import {Button} from "#enums/buttons";
import MysteryEncounterUiHandler from "#app/ui/mystery-encounter-ui-handler";
import {MysteryEncounterType} from "#enums/mystery-encounter-type";
import {MysteryEncounterTier} from "#app/data/mystery-encounters/mystery-encounter";

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
    vi.spyOn(overrides, "MYSTERY_ENCOUNTER_RATE_OVERRIDE", "get").mockReturnValue(256);
    vi.spyOn(overrides, "STARTING_WAVE_OVERRIDE", "get").mockReturnValue(11);
    vi.spyOn(overrides, "MYSTERY_ENCOUNTER_OVERRIDE", "get").mockReturnValue(MysteryEncounterType.MYSTERIOUS_CHALLENGERS);

    // Seed guarantees wild encounter to be replaced by ME
    vi.spyOn(game.scene, "resetSeed").mockImplementation(() => {
      game.scene.waveSeed = "test";
      Phaser.Math.RND.sow([ game.scene.waveSeed ]);
      game.scene.rngCounter = 0;
    });
  });

  describe("MysteryEncounterPhase", () => {
    it("Runs to MysteryEncounterPhase", async() => {
      await game.runToMysteryEncounter([
        Species.CHARIZARD,
        Species.VOLCARONA
      ]);

      await game.phaseInterceptor.to(MysteryEncounterPhase, false);
      expect(game.scene.getCurrentPhase().constructor.name).toBe(MysteryEncounterPhase.name);
    });

    it("Runs MysteryEncounterPhase", async() => {
      await game.runToMysteryEncounter([
        Species.CHARIZARD,
        Species.VOLCARONA
      ]);

      game.onNextPrompt("MysteryEncounterPhase", Mode.MYSTERY_ENCOUNTER, () => {
        // End phase early for test
        game.phaseInterceptor.superEndPhase();
      });
      await game.phaseInterceptor.run(MysteryEncounterPhase);

      expect(game.scene.mysteryEncounterData.encounteredEvents.length).toBeGreaterThan(0);
      expect(game.scene.mysteryEncounterData.encounteredEvents[0][0]).toEqual(MysteryEncounterType.MYSTERIOUS_CHALLENGERS);
      expect(game.scene.mysteryEncounterData.encounteredEvents[0][1]).toEqual(MysteryEncounterTier.GREAT);
      expect(game.scene.ui.getMode()).toBe(Mode.MYSTERY_ENCOUNTER);
    });

    it("Selects an option for MysteryEncounterPhase", async() => {
      const dialogueSpy = vi.spyOn(game.scene.ui, "showDialogue");
      const messageSpy = vi.spyOn(game.scene.ui, "showText");
      await game.runToMysteryEncounter([
        Species.CHARIZARD,
        Species.VOLCARONA
      ]);

      game.onNextPrompt("MysteryEncounterPhase", Mode.MYSTERY_ENCOUNTER, () => {
        // Select option 1 for encounter
        const handler = game.scene.ui.getHandler() as MysteryEncounterUiHandler;
        handler.unblockInput();
        handler.processInput(Button.ACTION);
      }, () => !game.isCurrentPhase(MysteryEncounterPhase));
      await game.phaseInterceptor.run(MysteryEncounterPhase);

      // After option selected
      expect(game.scene.getCurrentPhase().constructor.name).toBe(MysteryEncounterOptionSelectedPhase.name);
      expect(game.scene.ui.getMode()).toBe(Mode.MESSAGE);
      expect(dialogueSpy).toHaveBeenCalledTimes(1);
      expect(messageSpy).toHaveBeenCalledTimes(2);
      expect(dialogueSpy).toHaveBeenCalledWith("What's this?", "???", null, expect.any(Function));
      expect(messageSpy).toHaveBeenCalledWith("Mysterious challengers have appeared!", null, expect.any(Function), 300, true);
      expect(messageSpy).toHaveBeenCalledWith("The trainer steps forward...", null, expect.any(Function), 300, true);
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

