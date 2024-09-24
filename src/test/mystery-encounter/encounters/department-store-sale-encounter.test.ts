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
import { DepartmentStoreSaleEncounter } from "#app/data/mystery-encounters/encounters/department-store-sale-encounter";
import { CIVILIZATION_ENCOUNTER_BIOMES } from "#app/data/mystery-encounters/mystery-encounters";
import { MysteryEncounterOptionMode } from "#enums/mystery-encounter-option-mode";
import { MysteryEncounterTier } from "#enums/mystery-encounter-tier";
import { SelectModifierPhase } from "#app/phases/select-modifier-phase";

const namespace = "mysteryEncounters/departmentStoreSale";
const defaultParty = [Species.LAPRAS, Species.GENGAR, Species.ABRA];
const defaultBiome = Biome.PLAINS;
const defaultWave = 37;

describe("Department Store Sale - Mystery Encounter", () => {
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
      biomeMap.set(biome, [MysteryEncounterType.DEPARTMENT_STORE_SALE]);
    });
    vi.spyOn(MysteryEncounters, "mysteryEncountersByBiome", "get").mockReturnValue(biomeMap);
  });

  afterEach(() => {
    game.phaseInterceptor.restoreOg();
    vi.clearAllMocks();
    vi.resetAllMocks();
  });

  it("should have the correct properties", async () => {
    await game.runToMysteryEncounter(MysteryEncounterType.DEPARTMENT_STORE_SALE, defaultParty);

    expect(DepartmentStoreSaleEncounter.encounterType).toBe(MysteryEncounterType.DEPARTMENT_STORE_SALE);
    expect(DepartmentStoreSaleEncounter.encounterTier).toBe(MysteryEncounterTier.COMMON);
    expect(DepartmentStoreSaleEncounter.dialogue).toBeDefined();
    expect(DepartmentStoreSaleEncounter.dialogue.intro).toStrictEqual([
      { text: `${namespace}:intro` },
      {
        speaker: `${namespace}:speaker`,
        text: `${namespace}:intro_dialogue`,
      }
    ]);
    expect(DepartmentStoreSaleEncounter.dialogue.encounterOptionsDialogue?.title).toBe(`${namespace}:title`);
    expect(DepartmentStoreSaleEncounter.dialogue.encounterOptionsDialogue?.description).toBe(`${namespace}:description`);
    expect(DepartmentStoreSaleEncounter.dialogue.encounterOptionsDialogue?.query).toBe(`${namespace}:query`);
    expect(DepartmentStoreSaleEncounter.options.length).toBe(4);
  });

  it("should not spawn outside of CIVILIZATION_ENCOUNTER_BIOMES", async () => {
    game.override.mysteryEncounterTier(MysteryEncounterTier.COMMON);
    game.override.startingBiome(Biome.VOLCANO);
    await game.runToMysteryEncounter();

    expect(scene.currentBattle?.mysteryEncounter?.encounterType).not.toBe(MysteryEncounterType.DEPARTMENT_STORE_SALE);
  });

  describe("Option 1 - TM Shop", () => {
    it("should have the correct properties", () => {
      const option = DepartmentStoreSaleEncounter.options[0];
      expect(option.optionMode).toBe(MysteryEncounterOptionMode.DEFAULT);
      expect(option.dialogue).toBeDefined();
      expect(option.dialogue).toStrictEqual({
        buttonLabel: `${namespace}:option.1.label`,
        buttonTooltip: `${namespace}:option.1.tooltip`,
      });
    });

    it("should have shop with only TMs", async () => {
      await game.runToMysteryEncounter(MysteryEncounterType.DEPARTMENT_STORE_SALE, defaultParty);
      await runMysteryEncounterToEnd(game, 1);
      expect(scene.getCurrentPhase()?.constructor.name).toBe(SelectModifierPhase.name);
      await game.phaseInterceptor.run(SelectModifierPhase);

      expect(scene.ui.getMode()).to.equal(Mode.MODIFIER_SELECT);
      const modifierSelectHandler = scene.ui.handlers.find(h => h instanceof ModifierSelectUiHandler) as ModifierSelectUiHandler;
      expect(modifierSelectHandler.options.length).toEqual(5);
      for (const option of modifierSelectHandler.options) {
        expect(option.modifierTypeOption.type.id).toContain("TM_");
      }
    });

    it("should leave encounter without battle", async () => {
      const leaveEncounterWithoutBattleSpy = vi.spyOn(EncounterPhaseUtils, "leaveEncounterWithoutBattle");

      await game.runToMysteryEncounter(MysteryEncounterType.DEPARTMENT_STORE_SALE, defaultParty);
      await runMysteryEncounterToEnd(game, 1);

      expect(leaveEncounterWithoutBattleSpy).toBeCalled();
    });
  });

  describe("Option 2 - Vitamin Shop", () => {
    it("should have the correct properties", () => {
      const option = DepartmentStoreSaleEncounter.options[1];
      expect(option.optionMode).toBe(MysteryEncounterOptionMode.DEFAULT);
      expect(option.dialogue).toBeDefined();
      expect(option.dialogue).toStrictEqual({
        buttonLabel: `${namespace}:option.2.label`,
        buttonTooltip: `${namespace}:option.2.tooltip`,
      });
    });

    it("should have shop with only Vitamins", async () => {
      await game.runToMysteryEncounter(MysteryEncounterType.DEPARTMENT_STORE_SALE, defaultParty);
      await runMysteryEncounterToEnd(game, 2);
      expect(scene.getCurrentPhase()?.constructor.name).toBe(SelectModifierPhase.name);
      await game.phaseInterceptor.run(SelectModifierPhase);

      expect(scene.ui.getMode()).to.equal(Mode.MODIFIER_SELECT);
      const modifierSelectHandler = scene.ui.handlers.find(h => h instanceof ModifierSelectUiHandler) as ModifierSelectUiHandler;
      expect(modifierSelectHandler.options.length).toEqual(3);
      for (const option of modifierSelectHandler.options) {
        expect(option.modifierTypeOption.type.id.includes("PP_UP") ||
          option.modifierTypeOption.type.id.includes("BASE_STAT_BOOSTER")).toBeTruthy();
      }
    });

    it("should leave encounter without battle", async () => {
      const leaveEncounterWithoutBattleSpy = vi.spyOn(EncounterPhaseUtils, "leaveEncounterWithoutBattle");

      await game.runToMysteryEncounter(MysteryEncounterType.DEPARTMENT_STORE_SALE, defaultParty);
      await runMysteryEncounterToEnd(game, 2);

      expect(leaveEncounterWithoutBattleSpy).toBeCalled();
    });
  });

  describe("Option 3 - X Item Shop", () => {
    it("should have the correct properties", () => {
      const option = DepartmentStoreSaleEncounter.options[2];
      expect(option.optionMode).toBe(MysteryEncounterOptionMode.DEFAULT);
      expect(option.dialogue).toBeDefined();
      expect(option.dialogue).toStrictEqual({
        buttonLabel: `${namespace}:option.3.label`,
        buttonTooltip: `${namespace}:option.3.tooltip`,
      });
    });

    it("should have shop with only X Items", async () => {
      await game.runToMysteryEncounter(MysteryEncounterType.DEPARTMENT_STORE_SALE, defaultParty);
      await runMysteryEncounterToEnd(game, 3);
      expect(scene.getCurrentPhase()?.constructor.name).toBe(SelectModifierPhase.name);
      await game.phaseInterceptor.run(SelectModifierPhase);

      expect(scene.ui.getMode()).to.equal(Mode.MODIFIER_SELECT);
      const modifierSelectHandler = scene.ui.handlers.find(h => h instanceof ModifierSelectUiHandler) as ModifierSelectUiHandler;
      expect(modifierSelectHandler.options.length).toEqual(5);
      for (const option of modifierSelectHandler.options) {
        expect(option.modifierTypeOption.type.id.includes("DIRE_HIT") ||
          option.modifierTypeOption.type.id.includes("TEMP_STAT_STAGE_BOOSTER")).toBeTruthy();
      }
    });

    it("should leave encounter without battle", async () => {
      const leaveEncounterWithoutBattleSpy = vi.spyOn(EncounterPhaseUtils, "leaveEncounterWithoutBattle");

      await game.runToMysteryEncounter(MysteryEncounterType.DEPARTMENT_STORE_SALE, defaultParty);
      await runMysteryEncounterToEnd(game, 3);

      expect(leaveEncounterWithoutBattleSpy).toBeCalled();
    });
  });

  describe("Option 4 - Pokeball Shop", () => {
    it("should have the correct properties", () => {
      const option = DepartmentStoreSaleEncounter.options[3];
      expect(option.optionMode).toBe(MysteryEncounterOptionMode.DEFAULT);
      expect(option.dialogue).toBeDefined();
      expect(option.dialogue).toStrictEqual({
        buttonLabel: `${namespace}:option.4.label`,
        buttonTooltip: `${namespace}:option.4.tooltip`,
      });
    });

    it("should have shop with only Pokeballs", async () => {
      await game.runToMysteryEncounter(MysteryEncounterType.DEPARTMENT_STORE_SALE, defaultParty);
      await runMysteryEncounterToEnd(game, 4);
      expect(scene.getCurrentPhase()?.constructor.name).toBe(SelectModifierPhase.name);
      await game.phaseInterceptor.run(SelectModifierPhase);

      expect(scene.ui.getMode()).to.equal(Mode.MODIFIER_SELECT);
      const modifierSelectHandler = scene.ui.handlers.find(h => h instanceof ModifierSelectUiHandler) as ModifierSelectUiHandler;
      expect(modifierSelectHandler.options.length).toEqual(4);
      for (const option of modifierSelectHandler.options) {
        expect(option.modifierTypeOption.type.id).toContain("BALL");
      }
    });

    it("should leave encounter without battle", async () => {
      const leaveEncounterWithoutBattleSpy = vi.spyOn(EncounterPhaseUtils, "leaveEncounterWithoutBattle");

      await game.runToMysteryEncounter(MysteryEncounterType.DEPARTMENT_STORE_SALE, defaultParty);
      await runMysteryEncounterToEnd(game, 4);

      expect(leaveEncounterWithoutBattleSpy).toBeCalled();
    });
  });
});
