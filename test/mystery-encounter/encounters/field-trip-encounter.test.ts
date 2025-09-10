import type { BattleScene } from "#app/battle-scene";
import { BiomeId } from "#enums/biome-id";
import { MoveId } from "#enums/move-id";
import { MysteryEncounterOptionMode } from "#enums/mystery-encounter-option-mode";
import { MysteryEncounterTier } from "#enums/mystery-encounter-tier";
import { MysteryEncounterType } from "#enums/mystery-encounter-type";
import { SpeciesId } from "#enums/species-id";
import { UiMode } from "#enums/ui-mode";
import * as EncounterPhaseUtils from "#mystery-encounters/encounter-phase-utils";
import { FieldTripEncounter } from "#mystery-encounters/field-trip-encounter";
import * as MysteryEncounters from "#mystery-encounters/mystery-encounters";
import { SelectModifierPhase } from "#phases/select-modifier-phase";
import { runMysteryEncounterToEnd } from "#test/mystery-encounter/encounter-test-utils";
import { GameManager } from "#test/test-utils/game-manager";
import { ModifierSelectUiHandler } from "#ui/handlers/modifier-select-ui-handler";
import i18next from "i18next";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

const namespace = "mysteryEncounters/fieldTrip";
const defaultParty = [SpeciesId.LAPRAS, SpeciesId.GENGAR, SpeciesId.ABRA];
const defaultBiome = BiomeId.CAVE;
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
    game.override
      .mysteryEncounterChance(100)
      .startingWave(defaultWave)
      .startingBiome(defaultBiome)
      .disableTrainerWaves()
      .moveset([MoveId.TACKLE, MoveId.UPROAR, MoveId.SWORDS_DANCE]);

    vi.spyOn(MysteryEncounters, "mysteryEncountersByBiome", "get").mockReturnValue(
      new Map<BiomeId, MysteryEncounterType[]>([[BiomeId.CAVE, [MysteryEncounterType.FIELD_TRIP]]]),
    );
  });

  afterEach(() => {
    game.phaseInterceptor.restoreOg();
  });

  it("should have the correct properties", async () => {
    await game.runToMysteryEncounter(MysteryEncounterType.FIELD_TRIP, defaultParty);

    expect(FieldTripEncounter.encounterType).toBe(MysteryEncounterType.FIELD_TRIP);
    expect(FieldTripEncounter.encounterTier).toBe(MysteryEncounterTier.COMMON);
    expect(FieldTripEncounter.dialogue).toBeDefined();
    expect(FieldTripEncounter.dialogue.intro).toStrictEqual([
      {
        text: `${namespace}:intro`,
      },
      {
        speaker: `${namespace}:speaker`,
        text: `${namespace}:introDialogue`,
      },
    ]);
    expect(FieldTripEncounter.dialogue.encounterOptionsDialogue?.title).toBe(`${namespace}:title`);
    expect(FieldTripEncounter.dialogue.encounterOptionsDialogue?.description).toBe(`${namespace}:description`);
    expect(FieldTripEncounter.dialogue.encounterOptionsDialogue?.query).toBe(`${namespace}:query`);
    expect(FieldTripEncounter.options.length).toBe(3);
  });

  describe("Option 1 - Show off a physical move", () => {
    it("should have the correct properties", () => {
      const option = FieldTripEncounter.options[0];
      expect(option.optionMode).toBe(MysteryEncounterOptionMode.DEFAULT);
      expect(option.dialogue).toBeDefined();
      expect(option.dialogue).toStrictEqual({
        buttonLabel: `${namespace}:option.1.label`,
        buttonTooltip: `${namespace}:option.1.tooltip`,
        secondOptionPrompt: `${namespace}:secondOptionPrompt`,
      });
    });

    it("Should give no reward on incorrect option", async () => {
      await game.runToMysteryEncounter(MysteryEncounterType.FIELD_TRIP, defaultParty);
      await runMysteryEncounterToEnd(game, 1, { pokemonNo: 1, optionNo: 2 });
      await game.phaseInterceptor.to(SelectModifierPhase);

      expect(scene.ui.getMode()).to.equal(UiMode.MODIFIER_SELECT);
      const modifierSelectHandler = scene.ui.handlers.find(
        h => h instanceof ModifierSelectUiHandler,
      ) as ModifierSelectUiHandler;
      expect(modifierSelectHandler.options.length).toEqual(0);
    });

    it("Should give proper rewards on correct Physical move option", async () => {
      await game.runToMysteryEncounter(MysteryEncounterType.FIELD_TRIP, defaultParty);
      await runMysteryEncounterToEnd(game, 1, { pokemonNo: 1, optionNo: 1 });
      await game.phaseInterceptor.to(SelectModifierPhase);

      expect(scene.ui.getMode()).to.equal(UiMode.MODIFIER_SELECT);
      const modifierSelectHandler = scene.ui.handlers.find(
        h => h instanceof ModifierSelectUiHandler,
      ) as ModifierSelectUiHandler;
      expect(modifierSelectHandler.options.length).toEqual(5);
      expect(modifierSelectHandler.options[0].modifierTypeOption.type.name).toBe(
        i18next.t("modifierType:TempStatStageBoosterItem.x_attack"),
      );
      expect(modifierSelectHandler.options[1].modifierTypeOption.type.name).toBe(
        i18next.t("modifierType:TempStatStageBoosterItem.x_defense"),
      );
      expect(modifierSelectHandler.options[2].modifierTypeOption.type.name).toBe(
        i18next.t("modifierType:TempStatStageBoosterItem.x_speed"),
      );
      expect(modifierSelectHandler.options[3].modifierTypeOption.type.name).toBe(
        i18next.t("modifierType:ModifierType.DIRE_HIT.name"),
      );
      expect(modifierSelectHandler.options[4].modifierTypeOption.type.name).toBe(
        i18next.t("modifierType:ModifierType.RARER_CANDY.name"),
      );
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
        buttonLabel: `${namespace}:option.2.label`,
        buttonTooltip: `${namespace}:option.2.tooltip`,
        secondOptionPrompt: `${namespace}:secondOptionPrompt`,
      });
    });

    it("Should give no reward on incorrect option", async () => {
      await game.runToMysteryEncounter(MysteryEncounterType.FIELD_TRIP, defaultParty);
      await runMysteryEncounterToEnd(game, 2, { pokemonNo: 1, optionNo: 1 });
      await game.phaseInterceptor.to(SelectModifierPhase);

      expect(scene.ui.getMode()).to.equal(UiMode.MODIFIER_SELECT);
      const modifierSelectHandler = scene.ui.handlers.find(
        h => h instanceof ModifierSelectUiHandler,
      ) as ModifierSelectUiHandler;
      expect(modifierSelectHandler.options.length).toEqual(0);
    });

    it("Should give proper rewards on correct Special move option", async () => {
      await game.runToMysteryEncounter(MysteryEncounterType.FIELD_TRIP, defaultParty);
      await runMysteryEncounterToEnd(game, 2, { pokemonNo: 1, optionNo: 2 });
      await game.phaseInterceptor.to(SelectModifierPhase);

      expect(scene.ui.getMode()).to.equal(UiMode.MODIFIER_SELECT);
      const modifierSelectHandler = scene.ui.handlers.find(
        h => h instanceof ModifierSelectUiHandler,
      ) as ModifierSelectUiHandler;
      expect(modifierSelectHandler.options.length).toEqual(5);
      expect(modifierSelectHandler.options[0].modifierTypeOption.type.name).toBe(
        i18next.t("modifierType:TempStatStageBoosterItem.x_sp_atk"),
      );
      expect(modifierSelectHandler.options[1].modifierTypeOption.type.name).toBe(
        i18next.t("modifierType:TempStatStageBoosterItem.x_sp_def"),
      );
      expect(modifierSelectHandler.options[2].modifierTypeOption.type.name).toBe(
        i18next.t("modifierType:TempStatStageBoosterItem.x_speed"),
      );
      expect(modifierSelectHandler.options[3].modifierTypeOption.type.name).toBe(
        i18next.t("modifierType:ModifierType.DIRE_HIT.name"),
      );
      expect(modifierSelectHandler.options[4].modifierTypeOption.type.name).toBe(
        i18next.t("modifierType:ModifierType.RARER_CANDY.name"),
      );
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
        buttonLabel: `${namespace}:option.3.label`,
        buttonTooltip: `${namespace}:option.3.tooltip`,
        secondOptionPrompt: `${namespace}:secondOptionPrompt`,
      });
    });

    it("Should give no reward on incorrect option", async () => {
      await game.runToMysteryEncounter(MysteryEncounterType.FIELD_TRIP, defaultParty);
      await runMysteryEncounterToEnd(game, 3, { pokemonNo: 1, optionNo: 1 });
      await game.phaseInterceptor.to(SelectModifierPhase);

      expect(scene.ui.getMode()).to.equal(UiMode.MODIFIER_SELECT);
      const modifierSelectHandler = scene.ui.handlers.find(
        h => h instanceof ModifierSelectUiHandler,
      ) as ModifierSelectUiHandler;
      expect(modifierSelectHandler.options.length).toEqual(0);
    });

    it("Should give proper rewards on correct Special move option", async () => {
      vi.spyOn(i18next, "t");
      await game.runToMysteryEncounter(MysteryEncounterType.FIELD_TRIP, defaultParty);
      await runMysteryEncounterToEnd(game, 3, { pokemonNo: 1, optionNo: 3 });
      await game.phaseInterceptor.to(SelectModifierPhase);

      expect(scene.ui.getMode()).to.equal(UiMode.MODIFIER_SELECT);
      const modifierSelectHandler = scene.ui.handlers.find(
        h => h instanceof ModifierSelectUiHandler,
      ) as ModifierSelectUiHandler;
      expect(modifierSelectHandler.options.length).toEqual(5);
      expect(modifierSelectHandler.options[0].modifierTypeOption.type.name).toBe(
        i18next.t("modifierType:TempStatStageBoosterItem.x_accuracy"),
      );
      expect(modifierSelectHandler.options[1].modifierTypeOption.type.name).toBe(
        i18next.t("modifierType:TempStatStageBoosterItem.x_speed"),
      );
      expect(modifierSelectHandler.options[2].modifierTypeOption.type.name).toBe(
        i18next.t("modifierType:ModifierType.AddPokeballModifierType.name", {
          modifierCount: 5,
          pokeballName: i18next.t("pokeball:greatBall"),
        }),
      );
      expect(i18next.t).toHaveBeenCalledWith(
        "modifierType:ModifierType.AddPokeballModifierType.name",
        expect.objectContaining({ modifierCount: 5 }),
      );
      expect(modifierSelectHandler.options[3].modifierTypeOption.type.name).toBe(
        i18next.t("modifierType:ModifierType.IV_SCANNER.name"),
      );
      expect(modifierSelectHandler.options[4].modifierTypeOption.type.name).toBe(
        i18next.t("modifierType:ModifierType.RARER_CANDY.name"),
      );
    });

    it("should leave encounter without battle", async () => {
      const leaveEncounterWithoutBattleSpy = vi.spyOn(EncounterPhaseUtils, "leaveEncounterWithoutBattle");

      await game.runToMysteryEncounter(MysteryEncounterType.FIELD_TRIP, defaultParty);
      await runMysteryEncounterToEnd(game, 2, { pokemonNo: 1, optionNo: 3 });

      expect(leaveEncounterWithoutBattleSpy).toBeCalled();
    });
  });
});
