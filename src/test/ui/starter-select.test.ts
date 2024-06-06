import {afterEach, beforeAll, beforeEach, describe, expect, it} from "vitest";
import Phaser from "phaser";
import GameManager from "#app/test/utils/gameManager";
import {Species} from "#app/data/enums/species";
import {
  EncounterPhase,
  SelectStarterPhase,
  TitlePhase,
} from "#app/phases";
import {Mode} from "#app/ui/ui";
import {GameModes} from "#app/game-mode";
import StarterSelectUiHandler from "#app/ui/starter-select-ui-handler";
import {Button} from "#app/enums/buttons";
import OptionSelectUiHandler from "#app/ui/settings/option-select-ui-handler";
import SaveSlotSelectUiHandler from "#app/ui/save-slot-select-ui-handler";
import {OptionSelectItem} from "#app/ui/abstact-option-select-ui-handler";


describe("UI - Starter select", () => {
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
  });

  it("Bulbasaur - shiny - variant 2", async() => {
    await game.importData("src/test/utils/saves/everything.prsv");
    await game.runToTitle();
    game.onNextPrompt("TitlePhase", Mode.TITLE, () => {
      const currentPhase = game.scene.getCurrentPhase() as TitlePhase;
      currentPhase.gameMode = GameModes.CLASSIC;
      currentPhase.end();
    });
    await game.phaseInterceptor.mustRun(SelectStarterPhase).catch((error) => expect(error).toBe(SelectStarterPhase));
    game.onNextPrompt("SelectStarterPhase", Mode.STARTER_SELECT, () => {
      const handler = game.scene.ui.getHandler() as StarterSelectUiHandler;
      handler.processInput(Button.RIGHT);
      handler.processInput(Button.ACTION);
    });
    let options: OptionSelectItem[];
    let optionSelectUiHandler: OptionSelectUiHandler;
    await new Promise<void>((resolve) => {
      game.onNextPrompt("SelectStarterPhase", Mode.OPTION_SELECT, () => {
        optionSelectUiHandler = game.scene.ui.getHandler() as OptionSelectUiHandler;
        options = optionSelectUiHandler.getOptionsWithScroll();
        resolve();
      });
    });
    expect(options.some(option => option.label === "Add to Party")).toBe(true);
    expect(options.some(option => option.label === "Toggle IVs")).toBe(true);
    expect(options.some(option => option.label === "Manage Moves")).toBe(true);
    expect(options.some(option => option.label === "Use Candies")).toBe(true);
    expect(options.some(option => option.label === "Cancel")).toBe(true);
    optionSelectUiHandler.processInput(Button.ACTION);

    game.onNextPrompt("SelectStarterPhase", Mode.STARTER_SELECT, () => {
      const handler = game.scene.ui.getHandler() as StarterSelectUiHandler;
      handler.processInput(Button.SUBMIT);
    });
    game.onNextPrompt("SelectStarterPhase", Mode.CONFIRM, () => {
      const handler = game.scene.ui.getHandler() as StarterSelectUiHandler;
      handler.processInput(Button.ACTION);
    });
    game.onNextPrompt("SelectStarterPhase", Mode.SAVE_SLOT, () => {
      const saveSlotSelectUiHandler = game.scene.ui.getHandler() as SaveSlotSelectUiHandler;
      saveSlotSelectUiHandler.processInput(Button.ACTION);
    });
    game.onNextPrompt("SelectStarterPhase", Mode.CONFIRM, () => {
      const handler = game.scene.ui.getHandler() as StarterSelectUiHandler;
      handler.processInput(Button.ACTION);
    });
    await game.phaseInterceptor.whenAboutToRun(EncounterPhase);

    expect(game.scene.getParty()[0].species.speciesId).toBe(Species.BULBASAUR);
    expect(game.scene.getParty()[0].shiny).toBe(true);
    expect(game.scene.getParty()[0].variant).toBe(2);
  }, 20000);

  it("Bulbasaur - not shiny", async() => {
    await game.importData("src/test/utils/saves/everything.prsv");
    await game.runToTitle();
    game.onNextPrompt("TitlePhase", Mode.TITLE, () => {
      const currentPhase = game.scene.getCurrentPhase() as TitlePhase;
      currentPhase.gameMode = GameModes.CLASSIC;
      currentPhase.end();
    });
    await game.phaseInterceptor.mustRun(SelectStarterPhase).catch((error) => expect(error).toBe(SelectStarterPhase));
    game.onNextPrompt("SelectStarterPhase", Mode.STARTER_SELECT, () => {
      const handler = game.scene.ui.getHandler() as StarterSelectUiHandler;
      handler.processInput(Button.RIGHT);
      handler.processInput(Button.CYCLE_SHINY);
      handler.processInput(Button.ACTION);
    });
    let options: OptionSelectItem[];
    let optionSelectUiHandler: OptionSelectUiHandler;
    await new Promise<void>((resolve) => {
      game.onNextPrompt("SelectStarterPhase", Mode.OPTION_SELECT, () => {
        optionSelectUiHandler = game.scene.ui.getHandler() as OptionSelectUiHandler;
        options = optionSelectUiHandler.getOptionsWithScroll();
        resolve();
      });
    });
    expect(options.some(option => option.label === "Add to Party")).toBe(true);
    expect(options.some(option => option.label === "Toggle IVs")).toBe(true);
    expect(options.some(option => option.label === "Manage Moves")).toBe(true);
    expect(options.some(option => option.label === "Use Candies")).toBe(true);
    expect(options.some(option => option.label === "Cancel")).toBe(true);
    optionSelectUiHandler.processInput(Button.ACTION);

    game.onNextPrompt("SelectStarterPhase", Mode.STARTER_SELECT, () => {
      const handler = game.scene.ui.getHandler() as StarterSelectUiHandler;
      handler.processInput(Button.SUBMIT);
    });
    game.onNextPrompt("SelectStarterPhase", Mode.CONFIRM, () => {
      const handler = game.scene.ui.getHandler() as StarterSelectUiHandler;
      handler.processInput(Button.ACTION);
    });
    game.onNextPrompt("SelectStarterPhase", Mode.SAVE_SLOT, () => {
      const saveSlotSelectUiHandler = game.scene.ui.getHandler() as SaveSlotSelectUiHandler;
      saveSlotSelectUiHandler.processInput(Button.ACTION);
    });
    game.onNextPrompt("SelectStarterPhase", Mode.CONFIRM, () => {
      const handler = game.scene.ui.getHandler() as StarterSelectUiHandler;
      handler.processInput(Button.ACTION);
    });
    await game.phaseInterceptor.whenAboutToRun(EncounterPhase);

    expect(game.scene.getParty()[0].species.speciesId).toBe(Species.BULBASAUR);
    expect(game.scene.getParty()[0].shiny).toBe(false);
    expect(game.scene.getParty()[0].variant).toBe(0);
  }, 20000);
});
