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
import {Gender} from "#app/data/gender";
import {allSpecies} from "#app/data/pokemon-species";
import {Nature} from "#app/data/nature";
import {Abilities} from "#app/data/enums/abilities";


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

  it("Bulbasaur - shiny - variant 2 male", async() => {
    await game.importData("src/test/utils/saves/everything.prsv");
    const caughtCount = Object.keys(game.scene.gameData.dexData).filter((key) => {
      const species = game.scene.gameData.dexData[key];
      return species.caughtAttr !== 0n;
    }).length;
    expect(caughtCount).toBe(Object.keys(allSpecies).length);
    await game.runToTitle();
    game.onNextPrompt("TitlePhase", Mode.TITLE, () => {
      const currentPhase = game.scene.getCurrentPhase() as TitlePhase;
      currentPhase.gameMode = GameModes.CLASSIC;
      currentPhase.end();
    });
    game.onNextPrompt("SelectStarterPhase", Mode.STARTER_SELECT, () => {
      const handler = game.scene.ui.getHandler() as StarterSelectUiHandler;
      handler.processInput(Button.RIGHT);
      handler.processInput(Button.ACTION);
      game.phaseInterceptor.unlock();
    });
    await game.phaseInterceptor.run(SelectStarterPhase);
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

    await new Promise<void>((resolve) => {
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
        resolve();
      });
    });
    await game.phaseInterceptor.whenAboutToRun(EncounterPhase);

    expect(game.scene.getParty()[0].species.speciesId).toBe(Species.BULBASAUR);
    expect(game.scene.getParty()[0].shiny).toBe(true);
    expect(game.scene.getParty()[0].variant).toBe(2);
    expect(game.scene.getParty()[0].gender).toBe(Gender.MALE);
  }, 20000);

  it("Bulbasaur - shiny - variant 2 female hardy overgrow", async() => {
    await game.importData("src/test/utils/saves/everything.prsv");
    const caughtCount = Object.keys(game.scene.gameData.dexData).filter((key) => {
      const species = game.scene.gameData.dexData[key];
      return species.caughtAttr !== 0n;
    }).length;
    expect(caughtCount).toBe(Object.keys(allSpecies).length);
    await game.runToTitle();
    game.onNextPrompt("TitlePhase", Mode.TITLE, () => {
      const currentPhase = game.scene.getCurrentPhase() as TitlePhase;
      currentPhase.gameMode = GameModes.CLASSIC;
      currentPhase.end();
    });
    game.onNextPrompt("SelectStarterPhase", Mode.STARTER_SELECT, () => {
      const handler = game.scene.ui.getHandler() as StarterSelectUiHandler;
      handler.processInput(Button.RIGHT);
      handler.processInput(Button.CYCLE_GENDER);
      handler.processInput(Button.ACTION);
      game.phaseInterceptor.unlock();
    });
    await game.phaseInterceptor.run(SelectStarterPhase);
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

    await new Promise<void>((resolve) => {
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
        resolve();
      });
    });
    await game.phaseInterceptor.whenAboutToRun(EncounterPhase);

    expect(game.scene.getParty()[0].species.speciesId).toBe(Species.BULBASAUR);
    expect(game.scene.getParty()[0].shiny).toBe(true);
    expect(game.scene.getParty()[0].variant).toBe(2);
    expect(game.scene.getParty()[0].nature).toBe(Nature.HARDY);
    expect(game.scene.getParty()[0].getAbility().id).toBe(Abilities.OVERGROW);
  }, 20000);

  it("Bulbasaur - shiny - variant 2 female lonely chlorophyl", async() => {
    await game.importData("src/test/utils/saves/everything.prsv");
    const caughtCount = Object.keys(game.scene.gameData.dexData).filter((key) => {
      const species = game.scene.gameData.dexData[key];
      return species.caughtAttr !== 0n;
    }).length;
    expect(caughtCount).toBe(Object.keys(allSpecies).length);
    await game.runToTitle();
    game.onNextPrompt("TitlePhase", Mode.TITLE, () => {
      const currentPhase = game.scene.getCurrentPhase() as TitlePhase;
      currentPhase.gameMode = GameModes.CLASSIC;
      currentPhase.end();
    });
    game.onNextPrompt("SelectStarterPhase", Mode.STARTER_SELECT, () => {
      const handler = game.scene.ui.getHandler() as StarterSelectUiHandler;
      handler.processInput(Button.RIGHT);
      handler.processInput(Button.CYCLE_GENDER);
      handler.processInput(Button.CYCLE_NATURE);
      handler.processInput(Button.CYCLE_ABILITY);
      handler.processInput(Button.ACTION);
      game.phaseInterceptor.unlock();
    });
    await game.phaseInterceptor.run(SelectStarterPhase);
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

    await new Promise<void>((resolve) => {
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
        resolve();
      });
    });
    await game.phaseInterceptor.whenAboutToRun(EncounterPhase);

    expect(game.scene.getParty()[0].species.speciesId).toBe(Species.BULBASAUR);
    expect(game.scene.getParty()[0].shiny).toBe(true);
    expect(game.scene.getParty()[0].variant).toBe(2);
    expect(game.scene.getParty()[0].nature).toBe(Nature.LONELY);
    expect(game.scene.getParty()[0].getAbility().id).toBe(Abilities.CHLOROPHYLL);
  }, 20000);

  it("Bulbasaur - shiny - variant 2 female lonely chlorophyl", async() => {
    await game.importData("src/test/utils/saves/everything.prsv");
    const caughtCount = Object.keys(game.scene.gameData.dexData).filter((key) => {
      const species = game.scene.gameData.dexData[key];
      return species.caughtAttr !== 0n;
    }).length;
    expect(caughtCount).toBe(Object.keys(allSpecies).length);
    await game.runToTitle();
    game.onNextPrompt("TitlePhase", Mode.TITLE, () => {
      const currentPhase = game.scene.getCurrentPhase() as TitlePhase;
      currentPhase.gameMode = GameModes.CLASSIC;
      currentPhase.end();
    });
    game.onNextPrompt("SelectStarterPhase", Mode.STARTER_SELECT, () => {
      const handler = game.scene.ui.getHandler() as StarterSelectUiHandler;
      handler.processInput(Button.RIGHT);
      handler.processInput(Button.CYCLE_GENDER);
      handler.processInput(Button.ACTION);
      game.phaseInterceptor.unlock();
    });
    await game.phaseInterceptor.run(SelectStarterPhase);
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

    await new Promise<void>((resolve) => {
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
        resolve();
      });
    });
    await game.phaseInterceptor.whenAboutToRun(EncounterPhase);

    expect(game.scene.getParty()[0].species.speciesId).toBe(Species.BULBASAUR);
    expect(game.scene.getParty()[0].shiny).toBe(true);
    expect(game.scene.getParty()[0].variant).toBe(2);
    expect(game.scene.getParty()[0].gender).toBe(Gender.FEMALE);
  }, 20000);

  it("Bulbasaur - not shiny", async() => {
    await game.importData("src/test/utils/saves/everything.prsv");
    const caughtCount = Object.keys(game.scene.gameData.dexData).filter((key) => {
      const species = game.scene.gameData.dexData[key];
      return species.caughtAttr !== 0n;
    }).length;
    expect(caughtCount).toBe(Object.keys(allSpecies).length);
    await game.runToTitle();
    game.onNextPrompt("TitlePhase", Mode.TITLE, () => {
      const currentPhase = game.scene.getCurrentPhase() as TitlePhase;
      currentPhase.gameMode = GameModes.CLASSIC;
      currentPhase.end();
    });
    game.onNextPrompt("SelectStarterPhase", Mode.STARTER_SELECT, () => {
      const handler = game.scene.ui.getHandler() as StarterSelectUiHandler;
      handler.processInput(Button.RIGHT);
      handler.processInput(Button.CYCLE_SHINY);
      handler.processInput(Button.ACTION);
      game.phaseInterceptor.unlock();
    });
    await game.phaseInterceptor.run(SelectStarterPhase);
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

    await new Promise<void>((resolve) => {
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
        resolve();
      });
    });
    await game.phaseInterceptor.whenAboutToRun(EncounterPhase);

    expect(game.scene.getParty()[0].species.speciesId).toBe(Species.BULBASAUR);
    expect(game.scene.getParty()[0].shiny).toBe(false);
    expect(game.scene.getParty()[0].variant).toBe(0);
  }, 20000);

  it("Bulbasaur - shiny - variant 1", async() => {
    await game.importData("src/test/utils/saves/everything.prsv");
    const caughtCount = Object.keys(game.scene.gameData.dexData).filter((key) => {
      const species = game.scene.gameData.dexData[key];
      return species.caughtAttr !== 0n;
    }).length;
    expect(caughtCount).toBe(Object.keys(allSpecies).length);
    await game.runToTitle();
    game.onNextPrompt("TitlePhase", Mode.TITLE, () => {
      const currentPhase = game.scene.getCurrentPhase() as TitlePhase;
      currentPhase.gameMode = GameModes.CLASSIC;
      currentPhase.end();
    });
    game.onNextPrompt("SelectStarterPhase", Mode.STARTER_SELECT, () => {
      const handler = game.scene.ui.getHandler() as StarterSelectUiHandler;
      handler.processInput(Button.RIGHT);
      handler.processInput(Button.V);
      handler.processInput(Button.V);
      handler.processInput(Button.ACTION);
      game.phaseInterceptor.unlock();
    });
    await game.phaseInterceptor.run(SelectStarterPhase);
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

    await new Promise<void>((resolve) => {
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
        resolve();
      });
    });
    await game.phaseInterceptor.whenAboutToRun(EncounterPhase);

    expect(game.scene.getParty()[0].species.speciesId).toBe(Species.BULBASAUR);
    expect(game.scene.getParty()[0].shiny).toBe(true);
    expect(game.scene.getParty()[0].variant).toBe(1);
  }, 20000);

  it("Bulbasaur - shiny - variant 2", async() => {
    await game.importData("src/test/utils/saves/everything.prsv");
    const caughtCount = Object.keys(game.scene.gameData.dexData).filter((key) => {
      const species = game.scene.gameData.dexData[key];
      return species.caughtAttr !== 0n;
    }).length;
    expect(caughtCount).toBe(Object.keys(allSpecies).length);
    await game.runToTitle();
    game.onNextPrompt("TitlePhase", Mode.TITLE, () => {
      const currentPhase = game.scene.getCurrentPhase() as TitlePhase;
      currentPhase.gameMode = GameModes.CLASSIC;
      currentPhase.end();
    });
    game.onNextPrompt("SelectStarterPhase", Mode.STARTER_SELECT, () => {
      const handler = game.scene.ui.getHandler() as StarterSelectUiHandler;
      handler.processInput(Button.RIGHT);
      handler.processInput(Button.V);
      handler.processInput(Button.V);
      handler.processInput(Button.V);
      handler.processInput(Button.ACTION);
      game.phaseInterceptor.unlock();
    });
    await game.phaseInterceptor.run(SelectStarterPhase);
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

    await new Promise<void>((resolve) => {
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
        resolve();
      });
    });
    await game.phaseInterceptor.whenAboutToRun(EncounterPhase);

    expect(game.scene.getParty()[0].species.speciesId).toBe(Species.BULBASAUR);
    expect(game.scene.getParty()[0].shiny).toBe(true);
    expect(game.scene.getParty()[0].variant).toBe(2);
  }, 20000);

  it("Check if first pokemon in party is caterpie from gen 1 and 1rd row, 3rd column", async() => {
    await game.importData("src/test/utils/saves/everything.prsv");
    const caughtCount = Object.keys(game.scene.gameData.dexData).filter((key) => {
      const species = game.scene.gameData.dexData[key];
      return species.caughtAttr !== 0n;
    }).length;
    expect(caughtCount).toBe(Object.keys(allSpecies).length);
    await game.runToTitle();
    game.onNextPrompt("TitlePhase", Mode.TITLE, () => {
      const currentPhase = game.scene.getCurrentPhase() as TitlePhase;
      currentPhase.gameMode = GameModes.CLASSIC;
      currentPhase.end();
    });
    game.onNextPrompt("SelectStarterPhase", Mode.STARTER_SELECT, () => {
      const handler = game.scene.ui.getHandler() as StarterSelectUiHandler;
      handler.processInput(Button.RIGHT);
      handler.processInput(Button.RIGHT);
      handler.processInput(Button.RIGHT);
      handler.processInput(Button.RIGHT);
      handler.processInput(Button.ACTION);
      game.phaseInterceptor.unlock();
    });
    await game.phaseInterceptor.run(SelectStarterPhase);
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

    let starterSelectUiHandler: StarterSelectUiHandler;
    await new Promise<void>((resolve) => {
      game.onNextPrompt("SelectStarterPhase", Mode.STARTER_SELECT, () => {
        starterSelectUiHandler = game.scene.ui.getHandler() as StarterSelectUiHandler;
        starterSelectUiHandler.processInput(Button.SUBMIT);
        resolve();
      });
    });

    expect(starterSelectUiHandler.starterGens[0]).toBe(0);
    expect(starterSelectUiHandler.starterCursors[0]).toBe(3);
    expect(starterSelectUiHandler.cursorObj.x).toBe(132 + 4 * 18);
    expect(starterSelectUiHandler.cursorObj.y).toBe(10);

    game.onNextPrompt("SelectStarterPhase", Mode.CONFIRM, () => {
      const handler = game.scene.ui.getHandler() as StarterSelectUiHandler;
      handler.processInput(Button.ACTION);
    });
    game.onNextPrompt("SelectStarterPhase", Mode.SAVE_SLOT, () => {
      const saveSlotSelectUiHandler = game.scene.ui.getHandler() as SaveSlotSelectUiHandler;
      saveSlotSelectUiHandler.processInput(Button.ACTION);
    });
    await game.phaseInterceptor.whenAboutToRun(EncounterPhase);
    expect(game.scene.getParty()[0].species.speciesId).toBe(Species.CATERPIE);
  }, 20000);

  it("Check if first pokemon in party is nidoran_m from gen 1 and 2nd row, 4th column (cursor (9+4)-1)", async() => {
    await game.importData("src/test/utils/saves/everything.prsv");
    const caughtCount = Object.keys(game.scene.gameData.dexData).filter((key) => {
      const species = game.scene.gameData.dexData[key];
      return species.caughtAttr !== 0n;
    }).length;
    expect(caughtCount).toBe(Object.keys(allSpecies).length);
    await game.runToTitle();
    game.onNextPrompt("TitlePhase", Mode.TITLE, () => {
      const currentPhase = game.scene.getCurrentPhase() as TitlePhase;
      currentPhase.gameMode = GameModes.CLASSIC;
      currentPhase.end();
    });
    game.onNextPrompt("SelectStarterPhase", Mode.STARTER_SELECT, () => {
      const handler = game.scene.ui.getHandler() as StarterSelectUiHandler;
      handler.processInput(Button.RIGHT);
      handler.processInput(Button.RIGHT);
      handler.processInput(Button.RIGHT);
      handler.processInput(Button.RIGHT);
      handler.processInput(Button.DOWN);
      handler.processInput(Button.ACTION);
      game.phaseInterceptor.unlock();
    });
    await game.phaseInterceptor.run(SelectStarterPhase);
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

    let starterSelectUiHandler: StarterSelectUiHandler;
    await new Promise<void>((resolve) => {
      game.onNextPrompt("SelectStarterPhase", Mode.STARTER_SELECT, () => {
        starterSelectUiHandler = game.scene.ui.getHandler() as StarterSelectUiHandler;
        starterSelectUiHandler.processInput(Button.SUBMIT);
        resolve();
      });
    });

    expect(starterSelectUiHandler.starterGens[0]).toBe(0);
    expect(starterSelectUiHandler.starterCursors[0]).toBe(12);
    expect(starterSelectUiHandler.cursorObj.x).toBe(132 + 4 * 18);
    expect(starterSelectUiHandler.cursorObj.y).toBe(28);

    game.onNextPrompt("SelectStarterPhase", Mode.CONFIRM, () => {
      const handler = game.scene.ui.getHandler() as StarterSelectUiHandler;
      handler.processInput(Button.ACTION);
    });
    game.onNextPrompt("SelectStarterPhase", Mode.SAVE_SLOT, () => {
      const saveSlotSelectUiHandler = game.scene.ui.getHandler() as SaveSlotSelectUiHandler;
      saveSlotSelectUiHandler.processInput(Button.ACTION);
    });
    await game.phaseInterceptor.whenAboutToRun(EncounterPhase);
    expect(game.scene.getParty()[0].species.speciesId).toBe(Species.NIDORAN_M);
  }, 20000);
});
