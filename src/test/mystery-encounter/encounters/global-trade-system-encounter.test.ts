import { Biome } from "#app/enums/biome";
import { MysteryEncounterType } from "#app/enums/mystery-encounter-type";
import { Species } from "#app/enums/species";
import GameManager from "#app/test/utils/gameManager";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import * as EncounterPhaseUtils from "#app/data/mystery-encounters/utils/encounter-phase-utils";
import { runMysteryEncounterToEnd } from "#test/mystery-encounter/encounter-test-utils";
import BattleScene from "#app/battle-scene";
import { MysteryEncounterOptionMode } from "#enums/mystery-encounter-option-mode";
import { MysteryEncounterTier } from "#enums/mystery-encounter-tier";
import * as MysteryEncounters from "#app/data/mystery-encounters/mystery-encounters";
import { PokemonNatureWeightModifier } from "#app/modifier/modifier";
import { generateModifierType } from "#app/data/mystery-encounters/utils/encounter-phase-utils";
import { modifierTypes } from "#app/modifier/modifier-type";
import { GlobalTradeSystemEncounter } from "#app/data/mystery-encounters/encounters/global-trade-system-encounter";
import { CIVILIZATION_ENCOUNTER_BIOMES } from "#app/data/mystery-encounters/mystery-encounters";
import { SelectModifierPhase } from "#app/phases/select-modifier-phase";
import { Mode } from "#app/ui/ui";
import ModifierSelectUiHandler from "#app/ui/modifier-select-ui-handler";
import { ModifierTier } from "#app/modifier/modifier-tier";

const namespace = "mysteryEncounter:globalTradeSystem";
const defaultParty = [Species.LAPRAS, Species.GENGAR, Species.ABRA];
const defaultBiome = Biome.CAVE;
const defaultWave = 45;

describe("Global Trade System - Mystery Encounter", () => {
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

    const biomeMap = new Map<Biome, MysteryEncounterType[]>([
      [Biome.VOLCANO, [MysteryEncounterType.MYSTERIOUS_CHALLENGERS]],
    ]);
    CIVILIZATION_ENCOUNTER_BIOMES.forEach(biome => {
      biomeMap.set(biome, [MysteryEncounterType.GLOBAL_TRADE_SYSTEM]);
    });
    vi.spyOn(MysteryEncounters, "mysteryEncountersByBiome", "get").mockReturnValue(biomeMap);
  });

  afterEach(() => {
    game.phaseInterceptor.restoreOg();
    vi.clearAllMocks();
    vi.resetAllMocks();
  });

  it("should have the correct properties", async () => {
    await game.runToMysteryEncounter(MysteryEncounterType.GLOBAL_TRADE_SYSTEM, defaultParty);

    expect(GlobalTradeSystemEncounter.encounterType).toBe(MysteryEncounterType.GLOBAL_TRADE_SYSTEM);
    expect(GlobalTradeSystemEncounter.encounterTier).toBe(MysteryEncounterTier.COMMON);
    expect(GlobalTradeSystemEncounter.dialogue).toBeDefined();
    expect(GlobalTradeSystemEncounter.dialogue.intro).toStrictEqual([{ text: `${namespace}.intro` }]);
    expect(GlobalTradeSystemEncounter.dialogue.encounterOptionsDialogue?.title).toBe(`${namespace}.title`);
    expect(GlobalTradeSystemEncounter.dialogue.encounterOptionsDialogue?.description).toBe(`${namespace}.description`);
    expect(GlobalTradeSystemEncounter.dialogue.encounterOptionsDialogue?.query).toBe(`${namespace}.query`);
    expect(GlobalTradeSystemEncounter.options.length).toBe(4);
  });

  it("should not loop infinitely when generating trade options for extreme BST non-legendaries", async () => {
    const extremeBstTeam = [Species.SLAKING, Species.WISHIWASHI, Species.SUNKERN];
    await game.runToMysteryEncounter(MysteryEncounterType.GLOBAL_TRADE_SYSTEM, extremeBstTeam);

    expect(GlobalTradeSystemEncounter.encounterType).toBe(MysteryEncounterType.GLOBAL_TRADE_SYSTEM);
    expect(GlobalTradeSystemEncounter.encounterTier).toBe(MysteryEncounterTier.COMMON);
    expect(GlobalTradeSystemEncounter.dialogue).toBeDefined();
    expect(GlobalTradeSystemEncounter.dialogue.intro).toStrictEqual([{ text: `${namespace}.intro` }]);
    expect(GlobalTradeSystemEncounter.dialogue.encounterOptionsDialogue?.title).toBe(`${namespace}.title`);
    expect(GlobalTradeSystemEncounter.dialogue.encounterOptionsDialogue?.description).toBe(`${namespace}.description`);
    expect(GlobalTradeSystemEncounter.dialogue.encounterOptionsDialogue?.query).toBe(`${namespace}.query`);
    expect(GlobalTradeSystemEncounter.options.length).toBe(4);
  });

  it("should not spawn outside of CIVILIZATION_ENCOUNTER_BIOMES", async () => {
    game.override.mysteryEncounterTier(MysteryEncounterTier.COMMON);
    game.override.startingBiome(Biome.VOLCANO);
    await game.runToMysteryEncounter();

    expect(scene.currentBattle?.mysteryEncounter?.encounterType).not.toBe(MysteryEncounterType.GLOBAL_TRADE_SYSTEM);
  });

  describe("Option 1 - Check Trade Offers", () => {
    it("should have the correct properties", () => {
      const option = GlobalTradeSystemEncounter.options[0];
      expect(option.optionMode).toBe(MysteryEncounterOptionMode.DEFAULT);
      expect(option.dialogue).toBeDefined();
      expect(option.dialogue).toStrictEqual({
        buttonLabel: `${namespace}.option.1.label`,
        buttonTooltip: `${namespace}.option.1.tooltip`,
        secondOptionPrompt: `${namespace}.option.1.trade_options_prompt`,
      });
    });

    it("Should trade a Pokemon from the player's party for the first of 3 Pokemon options", async () => {
      await game.runToMysteryEncounter(MysteryEncounterType.GLOBAL_TRADE_SYSTEM, defaultParty);

      const speciesBefore = scene.getParty()[0].species.speciesId;
      await runMysteryEncounterToEnd(game, 1, { pokemonNo: 1, optionNo: 1 });

      const speciesAfter = scene.getParty().at(-1)?.species.speciesId;

      expect(speciesAfter).toBeDefined();
      expect(speciesBefore).not.toBe(speciesAfter);
      expect(defaultParty.includes(speciesAfter!)).toBeFalsy();
    });

    it("Should trade a Pokemon from the player's party for the second of 3 Pokemon options", async () => {
      await game.runToMysteryEncounter(MysteryEncounterType.GLOBAL_TRADE_SYSTEM, defaultParty);

      const speciesBefore = scene.getParty()[1].species.speciesId;
      await runMysteryEncounterToEnd(game, 1, { pokemonNo: 2, optionNo: 2 });

      const speciesAfter = scene.getParty().at(-1)?.species.speciesId;

      expect(speciesAfter).toBeDefined();
      expect(speciesBefore).not.toBe(speciesAfter);
      expect(defaultParty.includes(speciesAfter!)).toBeFalsy();
    });

    it("Should trade a Pokemon from the player's party for the third of 3 Pokemon options", async () => {
      await game.runToMysteryEncounter(MysteryEncounterType.GLOBAL_TRADE_SYSTEM, defaultParty);

      const speciesBefore = scene.getParty()[2].species.speciesId;
      await runMysteryEncounterToEnd(game, 1, { pokemonNo: 3, optionNo: 3 });

      const speciesAfter = scene.getParty().at(-1)?.species.speciesId;

      expect(speciesAfter).toBeDefined();
      expect(speciesBefore).not.toBe(speciesAfter);
      expect(defaultParty.includes(speciesAfter!)).toBeFalsy();
    });

    it("should leave encounter without battle", async () => {
      const leaveEncounterWithoutBattleSpy = vi.spyOn(EncounterPhaseUtils, "leaveEncounterWithoutBattle");

      await game.runToMysteryEncounter(MysteryEncounterType.GLOBAL_TRADE_SYSTEM, defaultParty);
      await runMysteryEncounterToEnd(game, 1, { pokemonNo: 1, optionNo: 1 });

      expect(leaveEncounterWithoutBattleSpy).toBeCalled();
    });
  });

  describe("Option 2 - Wonder Trade", () => {
    it("should have the correct properties", () => {
      const option = GlobalTradeSystemEncounter.options[1];
      expect(option.optionMode).toBe(MysteryEncounterOptionMode.DEFAULT);
      expect(option.dialogue).toBeDefined();
      expect(option.dialogue).toStrictEqual({
        buttonLabel: `${namespace}.option.2.label`,
        buttonTooltip: `${namespace}.option.2.tooltip`
      });
    });

    it("Should trade a Pokemon from the player's party for a random wonder trade Pokemon", async () => {
      await game.runToMysteryEncounter(MysteryEncounterType.GLOBAL_TRADE_SYSTEM, defaultParty);

      const speciesBefore = scene.getParty()[2].species.speciesId;
      await runMysteryEncounterToEnd(game, 2, { pokemonNo: 1 });

      const speciesAfter = scene.getParty().at(-1)?.species.speciesId;

      expect(speciesAfter).toBeDefined();
      expect(speciesBefore).not.toBe(speciesAfter);
      expect(defaultParty.includes(speciesAfter!)).toBeFalsy();
    });

    it("should leave encounter without battle", async () => {
      const leaveEncounterWithoutBattleSpy = vi.spyOn(EncounterPhaseUtils, "leaveEncounterWithoutBattle");

      await game.runToMysteryEncounter(MysteryEncounterType.GLOBAL_TRADE_SYSTEM, defaultParty);
      await runMysteryEncounterToEnd(game, 2, { pokemonNo: 2 });

      expect(leaveEncounterWithoutBattleSpy).toBeCalled();
    });
  });

  describe("Option 3 - Trade an Item", () => {
    it("should have the correct properties", () => {
      const option = GlobalTradeSystemEncounter.options[2];
      expect(option.optionMode).toBe(MysteryEncounterOptionMode.DEFAULT);
      expect(option.dialogue).toBeDefined();
      expect(option.dialogue).toStrictEqual({
        buttonLabel: `${namespace}.option.3.label`,
        buttonTooltip: `${namespace}.option.3.tooltip`,
        secondOptionPrompt: `${namespace}.option.3.trade_options_prompt`,
      });
    });

    it("should decrease item stacks of chosen item and have a tiered up item in rewards", async () => {
      await game.runToMysteryEncounter(MysteryEncounterType.GLOBAL_TRADE_SYSTEM, defaultParty);

      // Set 2 Soul Dew on party lead
      scene.modifiers = [];
      const soulDew = generateModifierType(scene, modifierTypes.SOUL_DEW)!;
      const modifier = soulDew.newModifier(scene.getParty()[0]) as PokemonNatureWeightModifier;
      modifier.stackCount = 2;
      await scene.addModifier(modifier, true, false, false, true);
      await scene.updateModifiers(true);

      await runMysteryEncounterToEnd(game, 3, { pokemonNo: 1, optionNo: 1});
      expect(scene.getCurrentPhase()?.constructor.name).toBe(SelectModifierPhase.name);
      await game.phaseInterceptor.run(SelectModifierPhase);

      expect(scene.ui.getMode()).to.equal(Mode.MODIFIER_SELECT);
      const modifierSelectHandler = scene.ui.handlers.find(h => h instanceof ModifierSelectUiHandler) as ModifierSelectUiHandler;
      expect(modifierSelectHandler.options.length).toEqual(1);
      expect(modifierSelectHandler.options[0].modifierTypeOption.type.tier).toBe(ModifierTier.MASTER);
      const soulDewAfter = scene.findModifier(m => m instanceof PokemonNatureWeightModifier);
      expect(soulDewAfter?.stackCount).toBe(1);
    });

    it("should leave encounter without battle", async () => {
      const leaveEncounterWithoutBattleSpy = vi.spyOn(EncounterPhaseUtils, "leaveEncounterWithoutBattle");

      await game.runToMysteryEncounter(MysteryEncounterType.GLOBAL_TRADE_SYSTEM, defaultParty);

      // Set 1 Soul Dew on party lead
      scene.modifiers = [];
      const soulDew = generateModifierType(scene, modifierTypes.SOUL_DEW)!;
      const modifier = soulDew.newModifier(scene.getParty()[0]) as PokemonNatureWeightModifier;
      modifier.stackCount = 1;
      await scene.addModifier(modifier, true, false, false, true);
      await scene.updateModifiers(true);

      await runMysteryEncounterToEnd(game, 3, { pokemonNo: 1, optionNo: 1});

      expect(leaveEncounterWithoutBattleSpy).toBeCalled();
    });
  });

  describe("Option 4 - Leave", () => {
    it("should have the correct properties", () => {
      const option = GlobalTradeSystemEncounter.options[3];
      expect(option.optionMode).toBe(MysteryEncounterOptionMode.DEFAULT);
      expect(option.dialogue).toBeDefined();
      expect(option.dialogue).toStrictEqual({
        buttonLabel: `${namespace}.option.4.label`,
        buttonTooltip: `${namespace}.option.4.tooltip`,
        selected: [
          {
            text: `${namespace}.option.4.selected`,
          },
        ],
      });
    });

    it("should leave encounter without battle", async () => {
      const leaveEncounterWithoutBattleSpy = vi.spyOn(EncounterPhaseUtils, "leaveEncounterWithoutBattle");

      await game.runToMysteryEncounter(MysteryEncounterType.GLOBAL_TRADE_SYSTEM, defaultParty);
      await runMysteryEncounterToEnd(game, 4);

      expect(leaveEncounterWithoutBattleSpy).toBeCalled();
    });
  });
});
