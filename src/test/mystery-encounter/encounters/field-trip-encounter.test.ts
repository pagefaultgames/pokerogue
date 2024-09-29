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
import { FieldTripEncounter } from "#app/data/mystery-encounters/encounters/field-trip-encounter";
import { Moves } from "#enums/moves";
import { SelectModifierPhase } from "#app/phases/select-modifier-phase";
import { Mode } from "#app/ui/ui";
import ModifierSelectUiHandler from "#app/ui/modifier-select-ui-handler";

const namespace = "mysteryEncounter:fieldTrip";
const defaultParty = [Species.LAPRAS, Species.GENGAR, Species.ABRA];
const defaultBiome = Biome.CAVE;
const defaultWave = 45;

describe("Field Trip - Mystery Encounter", () => {
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
    game.override.moveset([Moves.TACKLE, Moves.UPROAR, Moves.SWORDS_DANCE]);

    vi.spyOn(MysteryEncounters, "mysteryEncountersByBiome", "get").mockReturnValue(
      new Map<Biome, MysteryEncounterType[]>([
        [Biome.CAVE, [MysteryEncounterType.FIELD_TRIP]],
      ])
    );
  });

  afterEach(() => {
    game.phaseInterceptor.restoreOg();
    vi.clearAllMocks();
    vi.resetAllMocks();
  });

  it("should have the correct properties", async () => {
    await game.runToMysteryEncounter(MysteryEncounterType.FIELD_TRIP, defaultParty);

    expect(FieldTripEncounter.encounterType).toBe(MysteryEncounterType.FIELD_TRIP);
    expect(FieldTripEncounter.encounterTier).toBe(MysteryEncounterTier.COMMON);
    expect(FieldTripEncounter.dialogue).toBeDefined();
    expect(FieldTripEncounter.dialogue.intro).toStrictEqual([
      {
        text: `${namespace}.intro`
      },
      {
        speaker: `${namespace}.speaker`,
        text: `${namespace}.intro_dialogue`
      }
    ]);
    expect(FieldTripEncounter.dialogue.encounterOptionsDialogue?.title).toBe(`${namespace}.title`);
    expect(FieldTripEncounter.dialogue.encounterOptionsDialogue?.description).toBe(`${namespace}.description`);
    expect(FieldTripEncounter.dialogue.encounterOptionsDialogue?.query).toBe(`${namespace}.query`);
    expect(FieldTripEncounter.options.length).toBe(3);
  });

  describe("Option 1 - Show off a physical move", () => {
    it("should have the correct properties", () => {
      const option = FieldTripEncounter.options[0];
      expect(option.optionMode).toBe(MysteryEncounterOptionMode.DEFAULT);
      expect(option.dialogue).toBeDefined();
      expect(option.dialogue).toStrictEqual({
        buttonLabel: `${namespace}.option.1.label`,
        buttonTooltip: `${namespace}.option.1.tooltip`,
        secondOptionPrompt: `${namespace}.second_option_prompt`,
      });
    });

    it("Should give no reward on incorrect option", async () => {
      await game.runToMysteryEncounter(MysteryEncounterType.FIELD_TRIP, defaultParty);
      await runMysteryEncounterToEnd(game, 1, { pokemonNo: 1, optionNo: 2 });
      await game.phaseInterceptor.to(SelectModifierPhase);

      expect(scene.ui.getMode()).to.equal(Mode.MODIFIER_SELECT);
      const modifierSelectHandler = scene.ui.handlers.find(h => h instanceof ModifierSelectUiHandler) as ModifierSelectUiHandler;
      expect(modifierSelectHandler.options.length).toEqual(0);
    });

    it("Should give proper rewards on correct Physical move option", async () => {
      await game.runToMysteryEncounter(MysteryEncounterType.FIELD_TRIP, defaultParty);
      await runMysteryEncounterToEnd(game, 1, { pokemonNo: 1, optionNo: 1 });
      await game.phaseInterceptor.to(SelectModifierPhase);

      expect(scene.ui.getMode()).to.equal(Mode.MODIFIER_SELECT);
      const modifierSelectHandler = scene.ui.handlers.find(h => h instanceof ModifierSelectUiHandler) as ModifierSelectUiHandler;
      expect(modifierSelectHandler.options.length).toEqual(5);
      expect(modifierSelectHandler.options[0].modifierTypeOption.type.name).toBe("X Attack");
      expect(modifierSelectHandler.options[1].modifierTypeOption.type.name).toBe("X Defense");
      expect(modifierSelectHandler.options[2].modifierTypeOption.type.name).toBe("X Speed");
      expect(modifierSelectHandler.options[3].modifierTypeOption.type.name).toBe("Dire Hit");
      expect(modifierSelectHandler.options[4].modifierTypeOption.type.name).toBe("Rarer Candy");
    });

    it("should leave encounter without battle", async () => {
      const leaveEncounterWithoutBattleSpy = vi.spyOn(EncounterPhaseUtils, "leaveEncounterWithoutBattle");

      await game.runToMysteryEncounter(MysteryEncounterType.FIELD_TRIP, defaultParty);
      await runMysteryEncounterToEnd(game, 1, { pokemonNo: 1, optionNo: 1 });

      expect(leaveEncounterWithoutBattleSpy).toBeCalled();
    });
  });

  describe("Option 2 - Give Food", () => {
    it("should have the correct properties", () => {
      const option = FieldTripEncounter.options[1];
      expect(option.optionMode).toBe(MysteryEncounterOptionMode.DEFAULT);
      expect(option.dialogue).toBeDefined();
      expect(option.dialogue).toStrictEqual({
        buttonLabel: `${namespace}.option.2.label`,
        buttonTooltip: `${namespace}.option.2.tooltip`,
        secondOptionPrompt: `${namespace}.second_option_prompt`,
      });
    });

    it("Should give no reward on incorrect option", async () => {
      await game.runToMysteryEncounter(MysteryEncounterType.FIELD_TRIP, defaultParty);
      await runMysteryEncounterToEnd(game, 2, { pokemonNo: 1, optionNo: 1 });
      await game.phaseInterceptor.to(SelectModifierPhase);

      expect(scene.ui.getMode()).to.equal(Mode.MODIFIER_SELECT);
      const modifierSelectHandler = scene.ui.handlers.find(h => h instanceof ModifierSelectUiHandler) as ModifierSelectUiHandler;
      expect(modifierSelectHandler.options.length).toEqual(0);
    });

    it("Should give proper rewards on correct Special move option", async () => {
      await game.runToMysteryEncounter(MysteryEncounterType.FIELD_TRIP, defaultParty);
      await runMysteryEncounterToEnd(game, 2, { pokemonNo: 1, optionNo: 2 });
      await game.phaseInterceptor.to(SelectModifierPhase);

      expect(scene.ui.getMode()).to.equal(Mode.MODIFIER_SELECT);
      const modifierSelectHandler = scene.ui.handlers.find(h => h instanceof ModifierSelectUiHandler) as ModifierSelectUiHandler;
      expect(modifierSelectHandler.options.length).toEqual(5);
      expect(modifierSelectHandler.options[0].modifierTypeOption.type.name).toBe("X Sp. Atk");
      expect(modifierSelectHandler.options[1].modifierTypeOption.type.name).toBe("X Sp. Def");
      expect(modifierSelectHandler.options[2].modifierTypeOption.type.name).toBe("X Speed");
      expect(modifierSelectHandler.options[3].modifierTypeOption.type.name).toBe("Dire Hit");
      expect(modifierSelectHandler.options[4].modifierTypeOption.type.name).toBe("Rarer Candy");
    });

    it("should leave encounter without battle", async () => {
      const leaveEncounterWithoutBattleSpy = vi.spyOn(EncounterPhaseUtils, "leaveEncounterWithoutBattle");

      await game.runToMysteryEncounter(MysteryEncounterType.FIELD_TRIP, defaultParty);
      await runMysteryEncounterToEnd(game, 2, { pokemonNo: 1, optionNo: 2 });

      expect(leaveEncounterWithoutBattleSpy).toBeCalled();
    });
  });

  describe("Option 3 - Give Item", () => {
    it("should have the correct properties", () => {
      const option = FieldTripEncounter.options[2];
      expect(option.optionMode).toBe(MysteryEncounterOptionMode.DEFAULT);
      expect(option.dialogue).toBeDefined();
      expect(option.dialogue).toStrictEqual({
        buttonLabel: `${namespace}.option.3.label`,
        buttonTooltip: `${namespace}.option.3.tooltip`,
        secondOptionPrompt: `${namespace}.second_option_prompt`,
      });
    });

    it("Should give no reward on incorrect option", async () => {
      await game.runToMysteryEncounter(MysteryEncounterType.FIELD_TRIP, defaultParty);
      await runMysteryEncounterToEnd(game, 3, { pokemonNo: 1, optionNo: 1 });
      await game.phaseInterceptor.to(SelectModifierPhase);

      expect(scene.ui.getMode()).to.equal(Mode.MODIFIER_SELECT);
      const modifierSelectHandler = scene.ui.handlers.find(h => h instanceof ModifierSelectUiHandler) as ModifierSelectUiHandler;
      expect(modifierSelectHandler.options.length).toEqual(0);
    });

    it("Should give proper rewards on correct Special move option", async () => {
      await game.runToMysteryEncounter(MysteryEncounterType.FIELD_TRIP, defaultParty);
      await runMysteryEncounterToEnd(game, 3, { pokemonNo: 1, optionNo: 3 });
      await game.phaseInterceptor.to(SelectModifierPhase);

      expect(scene.ui.getMode()).to.equal(Mode.MODIFIER_SELECT);
      const modifierSelectHandler = scene.ui.handlers.find(h => h instanceof ModifierSelectUiHandler) as ModifierSelectUiHandler;
      expect(modifierSelectHandler.options.length).toEqual(5);
      expect(modifierSelectHandler.options[0].modifierTypeOption.type.name).toBe("X Accuracy");
      expect(modifierSelectHandler.options[1].modifierTypeOption.type.name).toBe("X Speed");
      expect(modifierSelectHandler.options[2].modifierTypeOption.type.name).toBe("5x Great Ball");
      expect(modifierSelectHandler.options[3].modifierTypeOption.type.name).toBe("IV Scanner");
      expect(modifierSelectHandler.options[4].modifierTypeOption.type.name).toBe("Rarer Candy");
    });

    it("should leave encounter without battle", async () => {
      const leaveEncounterWithoutBattleSpy = vi.spyOn(EncounterPhaseUtils, "leaveEncounterWithoutBattle");

      await game.runToMysteryEncounter(MysteryEncounterType.FIELD_TRIP, defaultParty);
      await runMysteryEncounterToEnd(game, 2, { pokemonNo: 1, optionNo: 3 });

      expect(leaveEncounterWithoutBattleSpy).toBeCalled();
    });
  });
});
