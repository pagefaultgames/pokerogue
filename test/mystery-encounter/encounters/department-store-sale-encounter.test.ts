import type { BattleScene } from "#app/battle-scene";
import { BiomeId } from "#enums/biome-id";
import { MysteryEncounterOptionMode } from "#enums/mystery-encounter-option-mode";
import { MysteryEncounterTier } from "#enums/mystery-encounter-tier";
import { MysteryEncounterType } from "#enums/mystery-encounter-type";
import { SpeciesId } from "#enums/species-id";
import { UiMode } from "#enums/ui-mode";
import { DepartmentStoreSaleEncounter } from "#mystery-encounters/department-store-sale-encounter";
import * as EncounterPhaseUtils from "#mystery-encounters/encounter-phase-utils";
import * as MysteryEncounters from "#mystery-encounters/mystery-encounters";
import { CIVILIZATION_ENCOUNTER_BIOMES } from "#mystery-encounters/mystery-encounters";
import { runMysteryEncounterToEnd } from "#test/mystery-encounter/encounter-test-utils";
import { GameManager } from "#test/test-utils/game-manager";
import { ModifierSelectUiHandler } from "#ui/handlers/modifier-select-ui-handler";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

const namespace = "mysteryEncounters/departmentStoreSale";
const defaultParty = [SpeciesId.LAPRAS, SpeciesId.GENGAR, SpeciesId.ABRA];
const defaultBiome = BiomeId.PLAINS;
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
    game.override
      .mysteryEncounterChance(100)
      .startingWave(defaultWave)
      .startingBiome(defaultBiome)
      .disableTrainerWaves();

    const biomeMap = new Map<BiomeId, MysteryEncounterType[]>([
      [BiomeId.VOLCANO, [MysteryEncounterType.MYSTERIOUS_CHALLENGERS]],
    ]);
    CIVILIZATION_ENCOUNTER_BIOMES.forEach(biome => {
      biomeMap.set(biome, [MysteryEncounterType.DEPARTMENT_STORE_SALE]);
    });
    vi.spyOn(MysteryEncounters, "mysteryEncountersByBiome", "get").mockReturnValue(biomeMap);
  });

  afterEach(() => {
    game.phaseInterceptor.restoreOg();
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
        text: `${namespace}:introDialogue`,
      },
    ]);
    expect(DepartmentStoreSaleEncounter.dialogue.encounterOptionsDialogue?.title).toBe(`${namespace}:title`);
    expect(DepartmentStoreSaleEncounter.dialogue.encounterOptionsDialogue?.description).toBe(
      `${namespace}:description`,
    );
    expect(DepartmentStoreSaleEncounter.dialogue.encounterOptionsDialogue?.query).toBe(`${namespace}:query`);
    expect(DepartmentStoreSaleEncounter.options.length).toBe(4);
  });

  it("should not spawn outside of CIVILIZATION_ENCOUNTER_BIOMES", async () => {
    game.override.mysteryEncounterTier(MysteryEncounterTier.COMMON).startingBiome(BiomeId.VOLCANO);
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
      expect(game).toBeAtPhase("SelectModifierPhase");
      await game.phaseInterceptor.to("SelectModifierPhase");

      expect(scene.ui.getMode()).to.equal(UiMode.MODIFIER_SELECT);
      const modifierSelectHandler = scene.ui.handlers.find(
        h => h instanceof ModifierSelectUiHandler,
      ) as ModifierSelectUiHandler;
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
      expect(game).toBeAtPhase("SelectModifierPhase");
      await game.phaseInterceptor.to("SelectModifierPhase");

      expect(scene.ui.getMode()).to.equal(UiMode.MODIFIER_SELECT);
      const modifierSelectHandler = scene.ui.handlers.find(
        h => h instanceof ModifierSelectUiHandler,
      ) as ModifierSelectUiHandler;
      expect(modifierSelectHandler.options.length).toEqual(3);
      for (const option of modifierSelectHandler.options) {
        expect(
          option.modifierTypeOption.type.id.includes("PP_UP")
            || option.modifierTypeOption.type.id.includes("BASE_STAT_BOOSTER"),
        ).toBeTruthy();
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
      expect(game).toBeAtPhase("SelectModifierPhase");
      await game.phaseInterceptor.to("SelectModifierPhase");

      expect(scene.ui.getMode()).to.equal(UiMode.MODIFIER_SELECT);
      const modifierSelectHandler = scene.ui.handlers.find(
        h => h instanceof ModifierSelectUiHandler,
      ) as ModifierSelectUiHandler;
      expect(modifierSelectHandler.options.length).toEqual(5);
      for (const option of modifierSelectHandler.options) {
        expect(
          option.modifierTypeOption.type.id.includes("DIRE_HIT")
            || option.modifierTypeOption.type.id.includes("TEMP_STAT_STAGE_BOOSTER"),
        ).toBeTruthy();
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
      expect(game).toBeAtPhase("SelectModifierPhase");
      await game.phaseInterceptor.to("SelectModifierPhase");

      expect(scene.ui.getMode()).to.equal(UiMode.MODIFIER_SELECT);
      const modifierSelectHandler = scene.ui.handlers.find(
        h => h instanceof ModifierSelectUiHandler,
      ) as ModifierSelectUiHandler;
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
