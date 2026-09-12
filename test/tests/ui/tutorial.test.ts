import { globalScene } from "#app/global-scene";
import { activeOverrides } from "#app/overrides";
import { handleTutorial, Tutorial } from "#app/tutorial";
import { SpeciesId } from "#enums/species-id";
import { UiMode } from "#enums/ui-mode";
import { GameManager } from "#test/framework/game-manager";
import type { EggGachaUiHandler } from "#ui/egg-gacha-ui-handler";
import type { MenuUiHandler } from "#ui/menu-ui-handler";
import i18next from "i18next";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Test suite for UI Tutorial Labels (Issue #7309).
 *
 * @remarks
 * Ensures that tutorial dialogue boxes display the correct speaker label ("Tutorial").
 * It also verifies that context-specific handlers (such as the Menu or Egg Gacha overlays)
 * correctly render the dialogue without causing UI soft-locks, and that the skip logic
 * works when a tutorial has already been seen by the player.
 */
describe("UI - Tutorial Labels", () => {
  let phaserGame: Phaser.Game;
  let game: GameManager;

  beforeAll(() => {
    phaserGame = new Phaser.Game({
      type: Phaser.HEADLESS,
    });
  });

  beforeEach(() => {
    game = new GameManager(phaserGame);

    globalScene.enableTutorials = true;
    (activeOverrides as any).BYPASS_TUTORIAL_SKIP_OVERRIDE = true;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("Tutorial Label Rendering Logic", () => {
    it("should NOT display a name label for the INTRO tutorial", async () => {
      await game.classicMode.startBattle(SpeciesId.CHARIZARD, SpeciesId.VENUSAUR);

      const showTextSpy = vi.spyOn(globalScene.ui, "showText");
      const showDialogueSpy = vi.spyOn(globalScene.ui, "showDialogue");

      // The Intro tutorial acts as general info and resolves instantly without user input.
      await handleTutorial(Tutorial.INTRO);

      expect(showTextSpy).toHaveBeenCalled();
      expect(showDialogueSpy).not.toHaveBeenCalled();
    });

    it("should display the 'Tutorial' label safely for field tutorials", async () => {
      await game.classicMode.startBattle(SpeciesId.CHARIZARD, SpeciesId.VENUSAUR);

      // Mock showDialogue to execute callback immediately, simulating user click
      const showDialogueSpy = vi
        .spyOn(globalScene.ui, "showDialogue")
        .mockImplementation((_text, _name, _delay, cb) => {
          if (cb) {
            cb();
          }
        });

      await handleTutorial(Tutorial.ACCESS_MENU);

      expect(showDialogueSpy).toHaveBeenCalled();
      expect(showDialogueSpy.mock.calls[0][1]).toBe(i18next.t("tutorial:name"));
    });

    it("should display the 'Tutorial' label via Custom Handler for MENU overlay", async () => {
      await game.classicMode.startBattle(SpeciesId.CHARIZARD, SpeciesId.VENUSAUR);
      await globalScene.ui.setMode(UiMode.MENU);
      const menuHandler = globalScene.ui.getHandler() as MenuUiHandler;

      const customShowDialogueSpy = vi
        .spyOn(menuHandler, "showDialogue")
        .mockImplementation((_text, _name, _delay, cb) => {
          if (cb) {
            cb();
          }
        });

      await handleTutorial(Tutorial.MENU);

      expect(customShowDialogueSpy).toHaveBeenCalled();
      expect(customShowDialogueSpy.mock.calls[0][1]).toBe(i18next.t("tutorial:name"));
    });

    it("should display the 'Tutorial' label via Custom Handler for EGG_GACHA overlay", async () => {
      await game.classicMode.startBattle(SpeciesId.CHARIZARD, SpeciesId.VENUSAUR);

      await globalScene.ui.setMode(UiMode.EGG_GACHA);
      const gachaHandler = globalScene.ui.getHandler() as EggGachaUiHandler;

      const customShowDialogueSpy = vi
        .spyOn(gachaHandler, "showDialogue")
        .mockImplementation((_text, _name, _delay, cb) => {
          if (cb) {
            cb();
          }
        });

      await handleTutorial(Tutorial.EGG_GACHA);

      expect(customShowDialogueSpy).toHaveBeenCalled();
      expect(customShowDialogueSpy.mock.calls[0][1]).toBe(i18next.t("tutorial:name"));
    });

    it("should display the tutorial text for STARTER_SELECT", async () => {
      await globalScene.ui.setMode(UiMode.STARTER_SELECT);
      const showTextSpy = vi.spyOn(globalScene.ui, "showText").mockImplementation((_text, _delay, cb) => {
        if (cb) {
          cb();
        }
      });

      await handleTutorial(Tutorial.STARTER_SELECT);

      expect(showTextSpy).toHaveBeenCalled();
      expect(showTextSpy.mock.calls[0][0]).toBe(i18next.t("tutorial:starterSelect"));
    });
  });

  describe("Regression additional tutorials", () => {
    const fieldTutorials: Tutorial[] = [Tutorial.STAT_CHANGE, Tutorial.POKERUS, Tutorial.SELECT_ITEM];

    for (const tutorial of fieldTutorials) {
      it(`should display the 'Tutorial' label for ${Tutorial[tutorial]}`, async () => {
        await game.classicMode.startBattle(SpeciesId.CHARIZARD, SpeciesId.VENUSAUR);

        const showDialogueSpy = vi
          .spyOn(globalScene.ui, "showDialogue")
          .mockImplementation((_text, _name, _delay, cb) => {
            if (cb) {
              cb();
            }
          });

        await handleTutorial(tutorial);

        expect(showDialogueSpy).toHaveBeenCalled();

        const [_text, speakerName] = showDialogueSpy.mock.calls[0];
        expect(speakerName).toBe(i18next.t("tutorial:name"));
      });
    }
  });

  describe("Tutorial Pagination (`$` delimiter)", () => {
    it("should show speakerBox with correct name during active dialogue", async () => {
      await game.classicMode.startBattle(SpeciesId.CHARIZARD, SpeciesId.VENUSAUR);

      await globalScene.ui.setMode(UiMode.MENU);
      const menuHandler = globalScene.ui.getHandler() as MenuUiHandler;

      // Mock showText without callback so speakerBox stays visible for inspection
      vi.spyOn(menuHandler, "showText").mockImplementation((_text, _delay, _cb) => {});

      // Execute a paginated string directly to test the new override logic
      menuHandler.showDialogue("tutorial:menu", "tutorial:name", 0, () => {});

      const speakerBox = menuHandler["speakerBox"];
      const speakerText = menuHandler["speakerText"];

      expect(speakerBox.visible).toBe(true);
      expect(speakerText.text).toBe("tutorial:name");
    });

    it("should split paginated text and call showText for each page", async () => {
      const simpletext = "Page 1$Page 2";

      await game.classicMode.startBattle(SpeciesId.CHARIZARD, SpeciesId.VENUSAUR);

      await globalScene.ui.setMode(UiMode.MENU);
      const menuHandler = globalScene.ui.getHandler() as MenuUiHandler;
      const showTextSpy = vi.spyOn(menuHandler, "showText").mockImplementation((_text, _delay, cb) => {
        if (cb) {
          cb();
        }
      });

      menuHandler.showDialogue(simpletext, "tutorial:name", 0, () => {});

      expect(showTextSpy).toHaveBeenCalledTimes(2);
      expect(showTextSpy.mock.calls[0][0]).toBe("Page 1");
      expect(showTextSpy.mock.calls[1][0]).toBe("Page 2");
    });

    it("should hide the speaker box when dialogue is closed", async () => {
      await game.classicMode.startBattle(SpeciesId.CHARIZARD, SpeciesId.VENUSAUR);
      await globalScene.ui.setMode(UiMode.MENU);
      const menuHandler = globalScene.ui.getHandler() as MenuUiHandler;

      let capturedCallback: (() => void) | undefined;
      vi.spyOn(menuHandler, "showText").mockImplementation((_text, _delay, cb) => {
        capturedCallback = cb; // Catch the close dialogue callback
      });

      menuHandler.showDialogue("Hello", "Professor", 0, () => {});
      const speakerBox = menuHandler["speakerBox"];

      expect(speakerBox.visible).toBe(true); // Should be visible initially

      // Simulate user advancing the dialogue
      if (capturedCallback) {
        capturedCallback();
      }

      expect(speakerBox.visible).toBe(false); // Should be hidden after callback
    });

    it("should pass the speaker name to every page in a paginated dialogue", async () => {
      const simpletext = "Page 1$Page 2$Page 3";
      await game.classicMode.startBattle(SpeciesId.CHARIZARD, SpeciesId.VENUSAUR);

      await globalScene.ui.setMode(UiMode.MENU);
      const menuHandler = globalScene.ui.getHandler() as MenuUiHandler;

      // Collect the name argument seen by speakerText on each recursive call.
      const capturedNames: string[] = [];
      vi.spyOn(menuHandler, "showText").mockImplementation((_text, _delay, cb) => {
        capturedNames.push(menuHandler["speakerText"].text);
        if (cb) {
          cb();
        }
      });

      const tutorialName = i18next.t("tutorial:name");
      menuHandler.showDialogue(simpletext, tutorialName, 0, () => {});

      expect(capturedNames).toHaveLength(3);
      for (const name of capturedNames) {
        expect(name).toBe(tutorialName);
      }
    });

    it("should hide speakerBox when no name is provided", async () => {
      await game.classicMode.startBattle(SpeciesId.CHARIZARD, SpeciesId.VENUSAUR);

      await globalScene.ui.setMode(UiMode.MENU);
      const menuHandler = globalScene.ui.getHandler() as MenuUiHandler;

      vi.spyOn(menuHandler, "showText").mockImplementation((_text, _delay, cb) => {
        if (cb) {
          cb();
        }
      });

      menuHandler.showDialogue("Some text without a speaker", undefined, 0, () => {});

      const speakerBox = menuHandler["speakerBox"];
      const speakerText = menuHandler["speakerText"];

      expect(speakerBox.visible).toBe(false);
      expect(speakerText.visible).toBeUndefined(); // speakerText visibility is controlled by speakerBox, so it may be undefined in some handlers. We just want to ensure no errors occur and the box is hidden.
    });
  });

  describe("Tutorial Skip Behavior", () => {
    it("should skip all tutorials when enableTutorials is false and override is off", async () => {
      await game.classicMode.startBattle(SpeciesId.CHARIZARD, SpeciesId.VENUSAUR);

      globalScene.enableTutorials = false;
      (activeOverrides as any).BYPASS_TUTORIAL_SKIP_OVERRIDE = false;

      const showDialogueSpy = vi.spyOn(globalScene.ui, "showDialogue");

      const result = await handleTutorial(Tutorial.POKERUS);

      // The guard at the top of handleTutorial must short-circuit immediately.
      expect(result).toBe(false);
      expect(showDialogueSpy).not.toHaveBeenCalled();
    });

    it("should skip tutorial that the player has already seen", async () => {
      await game.classicMode.startBattle(SpeciesId.CHARIZARD, SpeciesId.VENUSAUR);

      const showDialogueSpy = vi.spyOn(globalScene.ui, "showDialogue");

      // Disable the bypass to simulate a standard player environment.
      (activeOverrides as any).BYPASS_TUTORIAL_SKIP_OVERRIDE = false;

      // Mock the game data to simulate that the player has already seen this specific tutorial.
      // This avoids relying on actual IndexedDB/LocalStorage I/O, which can be flaky in headless tests.
      vi.spyOn(globalScene.gameData, "getTutorialFlags").mockReturnValue({
        [Tutorial.POKERUS]: true,
      } as Record<Tutorial, boolean>);

      const result = await handleTutorial(Tutorial.POKERUS);

      // The system must return false and abort rendering the tutorial.
      expect(result).toBe(false);
      expect(showDialogueSpy).not.toHaveBeenCalled();
    });

    it("should Not skip tutorial that the player has not seen", async () => {
      await game.classicMode.startBattle(SpeciesId.CHARIZARD, SpeciesId.VENUSAUR);

      const showDialogueSpy = vi.spyOn(globalScene.ui, "showDialogue");

      // Disable the bypass to simulate a standard player environment.
      (activeOverrides as any).BYPASS_TUTORIAL_SKIP_OVERRIDE = false;

      // Mock the game data to simulate that the player has not seen this specific tutorial.
      vi.spyOn(globalScene.gameData, "getTutorialFlags").mockReturnValue({
        [Tutorial.POKERUS]: false,
      } as Record<Tutorial, boolean>);

      const result = await handleTutorial(Tutorial.POKERUS);

      // The system must return true and render the tutorial.
      expect(result).toBe(true);
      expect(showDialogueSpy).toHaveBeenCalled();
    });

    it("should always show tutorial if BYPASS_TUTORIAL_SKIP_OVERRIDE is enabled, regardless of seen status", async () => {
      await game.classicMode.startBattle(SpeciesId.CHARIZARD, SpeciesId.VENUSAUR);

      const showDialogueSpy = vi.spyOn(globalScene.ui, "showDialogue");

      // Enable the bypass to force the tutorial to show.
      (activeOverrides as any).BYPASS_TUTORIAL_SKIP_OVERRIDE = true;

      // Mock the game data to simulate that the player has already seen this specific tutorial.
      vi.spyOn(globalScene.gameData, "getTutorialFlags").mockReturnValue({
        [Tutorial.POKERUS]: true,
      } as Record<Tutorial, boolean>);

      const result = await handleTutorial(Tutorial.POKERUS);

      // The system must return true and render the tutorial due to the override.
      expect(result).toBe(true);
      expect(showDialogueSpy).toHaveBeenCalled();
    });
  });
});
