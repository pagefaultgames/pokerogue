import * as MysteryEncounters from "#app/data/mystery-encounters/mystery-encounters";
import { Biome } from "#app/enums/biome";
import { MysteryEncounterType } from "#app/enums/mystery-encounter-type";
import { Species } from "#app/enums/species";
import GameManager from "#app/test/utils/gameManager";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import * as EncounterPhaseUtils from "#app/data/mystery-encounters/utils/encounter-phase-utils";
import { runMysteryEncounterToEnd } from "#test/mystery-encounter/encounter-test-utils";
import BattleScene from "#app/battle-scene";
import { Mode } from "#app/ui/ui";
import ModifierSelectUiHandler from "#app/ui/modifier-select-ui-handler";
import { MysteryEncounterOptionMode } from "#enums/mystery-encounter-option-mode";
import { MysteryEncounterTier } from "#enums/mystery-encounter-tier";
import { initSceneWithoutEncounterPhase } from "#test/utils/gameManagerUtils";
import { WeirdDreamEncounter } from "#app/data/mystery-encounters/encounters/weird-dream-encounter";
import * as EncounterTransformationSequence from "#app/data/mystery-encounters/utils/encounter-transformation-sequence";
import { SelectModifierPhase } from "#app/phases/select-modifier-phase";

const namespace = "mysteryEncounters/weirdDream";
const defaultParty = [Species.MAGBY, Species.HAUNTER, Species.ABRA];
const defaultBiome = Biome.CAVE;
const defaultWave = 45;

describe("Weird Dream - Mystery Encounter", () => {
  let phaserGame: Phaser.Game;
  let game: GameManager;
  let scene: BattleScene;

  beforeAll(() => {
    phaserGame = new Phaser.Game({ type: Phaser.HEADLESS });
  });

  beforeEach(async () => {
    game = new GameManager(phaserGame);
    scene = game.scene;
    game.override.mysteryEncounterChance(100);
    game.override.startingWave(defaultWave);
    game.override.startingBiome(defaultBiome);
    game.override.disableTrainerWaves();
    vi.spyOn(EncounterTransformationSequence, "doPokemonTransformationSequence").mockImplementation(() => new Promise<void>(resolve => resolve()));

    vi.spyOn(MysteryEncounters, "mysteryEncountersByBiome", "get").mockReturnValue(
      new Map<Biome, MysteryEncounterType[]>([
        [Biome.CAVE, [MysteryEncounterType.WEIRD_DREAM]],
      ])
    );
  });

  afterEach(() => {
    game.phaseInterceptor.restoreOg();
    vi.clearAllMocks();
    vi.resetAllMocks();
  });

  it("should have the correct properties", async () => {
    await game.runToMysteryEncounter(MysteryEncounterType.WEIRD_DREAM, defaultParty);

    expect(WeirdDreamEncounter.encounterType).toBe(MysteryEncounterType.WEIRD_DREAM);
    expect(WeirdDreamEncounter.encounterTier).toBe(MysteryEncounterTier.ROGUE);
    expect(WeirdDreamEncounter.dialogue).toBeDefined();
    expect(WeirdDreamEncounter.dialogue.intro).toStrictEqual([
      {
        text: `${namespace}:intro`
      },
      {
        speaker: `${namespace}:speaker`,
        text: `${namespace}:intro_dialogue`,
      },
    ]);
    expect(WeirdDreamEncounter.dialogue.encounterOptionsDialogue?.title).toBe(`${namespace}:title`);
    expect(WeirdDreamEncounter.dialogue.encounterOptionsDialogue?.description).toBe(`${namespace}:description`);
    expect(WeirdDreamEncounter.dialogue.encounterOptionsDialogue?.query).toBe(`${namespace}:query`);
    expect(WeirdDreamEncounter.options.length).toBe(2);
  });

  it("should initialize fully", async () => {
    initSceneWithoutEncounterPhase(scene, defaultParty);
    scene.currentBattle.mysteryEncounter = WeirdDreamEncounter;
    const loadBgmSpy = vi.spyOn(scene, "loadBgm");

    const { onInit } = WeirdDreamEncounter;

    expect(WeirdDreamEncounter.onInit).toBeDefined();

    WeirdDreamEncounter.populateDialogueTokensFromRequirements(scene);
    const onInitResult = onInit!(scene);

    expect(loadBgmSpy).toHaveBeenCalled();
    expect(onInitResult).toBe(true);
  });

  describe("Option 1 - Accept Transformation", () => {
    it("should have the correct properties", () => {
      const option = WeirdDreamEncounter.options[0];
      expect(option.optionMode).toBe(MysteryEncounterOptionMode.DEFAULT);
      expect(option.dialogue).toBeDefined();
      expect(option.dialogue).toStrictEqual({
        buttonLabel: `${namespace}:option.1.label`,
        buttonTooltip: `${namespace}:option.1.tooltip`,
        selected: [
          {
            text: `${namespace}:option.1.selected`,
          },
        ],
      });
    });

    it("should transform the new party into new species, 2 at +90/+110, the rest at +40/50 BST", async () => {
      await game.runToMysteryEncounter(MysteryEncounterType.WEIRD_DREAM, defaultParty);

      const pokemonPrior = scene.getParty().map(pokemon => pokemon);
      const bstsPrior = pokemonPrior.map(species => species.getSpeciesForm().getBaseStatTotal());

      await runMysteryEncounterToEnd(game, 1);
      await game.phaseInterceptor.to(SelectModifierPhase, false);
      expect(scene.getCurrentPhase()?.constructor.name).toBe(SelectModifierPhase.name);

      const pokemonAfter = scene.getParty();
      const bstsAfter = pokemonAfter.map(pokemon => pokemon.getSpeciesForm().getBaseStatTotal());
      const bstDiff = bstsAfter.map((bst, index) => bst - bstsPrior[index]);

      for (let i = 0; i < pokemonAfter.length; i++) {
        const newPokemon = pokemonAfter[i];
        expect(newPokemon.getSpeciesForm().speciesId).not.toBe(pokemonPrior[i].getSpeciesForm().speciesId);
        expect(newPokemon.mysteryEncounterPokemonData?.types.length).toBe(2);
      }

      const plus90To110 = bstDiff.filter(bst => bst > 80);
      const plus40To50 = bstDiff.filter(bst => bst < 80);

      expect(plus90To110.length).toBe(2);
      expect(plus40To50.length).toBe(1);
    });

    it("should have 1 Memory Mushroom, 5 Rogue Balls, and 2 Mints in rewards", async () => {
      await game.runToMysteryEncounter(MysteryEncounterType.WEIRD_DREAM, defaultParty);
      await runMysteryEncounterToEnd(game, 1);
      await game.phaseInterceptor.to(SelectModifierPhase, false);
      expect(scene.getCurrentPhase()?.constructor.name).toBe(SelectModifierPhase.name);
      await game.phaseInterceptor.run(SelectModifierPhase);

      expect(scene.ui.getMode()).to.equal(Mode.MODIFIER_SELECT);
      const modifierSelectHandler = scene.ui.handlers.find(h => h instanceof ModifierSelectUiHandler) as ModifierSelectUiHandler;
      expect(modifierSelectHandler.options.length).toEqual(4);
      expect(modifierSelectHandler.options[0].modifierTypeOption.type.id).toEqual("MEMORY_MUSHROOM");
      expect(modifierSelectHandler.options[1].modifierTypeOption.type.id).toEqual("ROGUE_BALL");
      expect(modifierSelectHandler.options[2].modifierTypeOption.type.id).toEqual("MINT");
      expect(modifierSelectHandler.options[3].modifierTypeOption.type.id).toEqual("MINT");
    });

    it("should leave encounter without battle", async () => {
      const leaveEncounterWithoutBattleSpy = vi.spyOn(EncounterPhaseUtils, "leaveEncounterWithoutBattle");

      await game.runToMysteryEncounter(MysteryEncounterType.WEIRD_DREAM, defaultParty);
      await runMysteryEncounterToEnd(game, 1);

      expect(leaveEncounterWithoutBattleSpy).toBeCalled();
    });
  });

  describe("Option 2 - Leave", () => {
    it("should have the correct properties", () => {
      const option = WeirdDreamEncounter.options[1];
      expect(option.optionMode).toBe(MysteryEncounterOptionMode.DEFAULT);
      expect(option.dialogue).toBeDefined();
      expect(option.dialogue).toStrictEqual({
        buttonLabel: `${namespace}:option.2.label`,
        buttonTooltip: `${namespace}:option.2.tooltip`,
        selected: [
          {
            text: `${namespace}:option.2.selected`,
          },
        ],
      });
    });

    it("should reduce party levels by 20%", async () => {
      const leaveEncounterWithoutBattleSpy = vi.spyOn(EncounterPhaseUtils, "leaveEncounterWithoutBattle");

      await game.runToMysteryEncounter(MysteryEncounterType.WEIRD_DREAM, defaultParty);
      const levelsPrior = scene.getParty().map(p => p.level);
      await runMysteryEncounterToEnd(game, 2);

      const levelsAfter = scene.getParty().map(p => p.level);

      for (let i = 0; i < levelsPrior.length; i++) {
        expect(Math.max(Math.ceil(0.8 * levelsPrior[i]), 1)).toBe(levelsAfter[i]);
        expect(scene.getParty()[i].levelExp).toBe(0);
      }

      expect(leaveEncounterWithoutBattleSpy).toBeCalled();
    });

    it("should leave encounter without battle", async () => {
      const leaveEncounterWithoutBattleSpy = vi.spyOn(EncounterPhaseUtils, "leaveEncounterWithoutBattle");

      await game.runToMysteryEncounter(MysteryEncounterType.WEIRD_DREAM, defaultParty);
      await runMysteryEncounterToEnd(game, 2);

      expect(leaveEncounterWithoutBattleSpy).toBeCalled();
    });
  });
});
