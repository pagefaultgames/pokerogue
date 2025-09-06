import type { BattleScene } from "#app/battle-scene";
import { BiomeId } from "#enums/biome-id";
import { HeldItemId } from "#enums/held-item-id";
import { MysteryEncounterOptionMode } from "#enums/mystery-encounter-option-mode";
import { MysteryEncounterTier } from "#enums/mystery-encounter-tier";
import { MysteryEncounterType } from "#enums/mystery-encounter-type";
import { SpeciesId } from "#enums/species-id";
import { TrainerItemId } from "#enums/trainer-item-id";
import { DelibirdyEncounter } from "#mystery-encounters/delibirdy-encounter";
import * as EncounterPhaseUtils from "#mystery-encounters/encounter-phase-utils";
import type { MoneyRequirement } from "#mystery-encounters/mystery-encounter-requirements";
import * as MysteryEncounters from "#mystery-encounters/mystery-encounters";
import { MysteryEncounterPhase } from "#phases/mystery-encounter-phases";
import {
  runMysteryEncounterToEnd,
  runSelectMysteryEncounterOption,
} from "#test/mystery-encounter/encounter-test-utils";
import { GameManager } from "#test/test-utils/game-manager";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

const namespace = "mysteryEncounters/delibirdy";
const defaultParty = [SpeciesId.LAPRAS, SpeciesId.GENGAR, SpeciesId.ABRA];
const defaultBiome = BiomeId.CAVE;
const defaultWave = 45;

describe("Delibird-y - Mystery Encounter", () => {
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

    vi.spyOn(MysteryEncounters, "mysteryEncountersByBiome", "get").mockReturnValue(
      new Map<BiomeId, MysteryEncounterType[]>([[BiomeId.CAVE, [MysteryEncounterType.DELIBIRDY]]]),
    );
  });

  afterEach(() => {
    game.phaseInterceptor.restoreOg();
  });

  it("should have the correct properties", async () => {
    await game.runToMysteryEncounter(MysteryEncounterType.DELIBIRDY, defaultParty);

    expect(DelibirdyEncounter.encounterType).toBe(MysteryEncounterType.DELIBIRDY);
    expect(DelibirdyEncounter.encounterTier).toBe(MysteryEncounterTier.GREAT);
    expect(DelibirdyEncounter.dialogue).toBeDefined();
    expect(DelibirdyEncounter.dialogue.intro).toStrictEqual([{ text: `${namespace}:intro` }]);
    expect(DelibirdyEncounter.dialogue.outro).toStrictEqual([{ text: `${namespace}:outro` }]);
    expect(DelibirdyEncounter.dialogue.encounterOptionsDialogue?.title).toBe(`${namespace}:title`);
    expect(DelibirdyEncounter.dialogue.encounterOptionsDialogue?.description).toBe(`${namespace}:description`);
    expect(DelibirdyEncounter.dialogue.encounterOptionsDialogue?.query).toBe(`${namespace}:query`);
    expect(DelibirdyEncounter.options.length).toBe(3);
  });

  it("should not spawn if player does not have enough money", async () => {
    scene.money = 0;

    await game.runToMysteryEncounter();

    expect(scene.currentBattle?.mysteryEncounter?.encounterType).not.toBe(MysteryEncounterType.DELIBIRDY);
  });

  describe("Option 1 - Give them money", () => {
    it("should have the correct properties", () => {
      const option1 = DelibirdyEncounter.options[0];
      expect(option1.optionMode).toBe(MysteryEncounterOptionMode.DISABLED_OR_DEFAULT);
      expect(option1.dialogue).toBeDefined();
      expect(option1.dialogue).toStrictEqual({
        buttonLabel: `${namespace}:option.1.label`,
        buttonTooltip: `${namespace}:option.1.tooltip`,
        selected: [
          {
            text: `${namespace}:option.1.selected`,
          },
        ],
      });
    });

    it("Should update the player's money properly", async () => {
      const initialMoney = 20000;
      scene.money = initialMoney;
      const updateMoneySpy = vi.spyOn(EncounterPhaseUtils, "updatePlayerMoney");

      await game.runToMysteryEncounter(MysteryEncounterType.DELIBIRDY, defaultParty);
      await runMysteryEncounterToEnd(game, 1);

      const price = (scene.currentBattle.mysteryEncounter?.options[0].requirements[0] as MoneyRequirement)
        .requiredMoney;

      expect(updateMoneySpy).toHaveBeenCalledWith(-price, true, false);
      expect(scene.money).toBe(initialMoney - price);
    });

    it("Should give the player an Amulet Coin", async () => {
      scene.money = 200000;
      await game.runToMysteryEncounter(MysteryEncounterType.DELIBIRDY, defaultParty);
      await runMysteryEncounterToEnd(game, 1);

      expect(scene.trainerItems.getStack(TrainerItemId.AMULET_COIN)).toBe(1);
    });

    it("Should give the player a Shell Bell if they have max stacks of Amulet Coins", async () => {
      scene.money = 200000;
      await game.runToMysteryEncounter(MysteryEncounterType.DELIBIRDY, defaultParty);

      // Max Amulet Coins
      scene.clearAllItems();
      scene.trainerItems.add(TrainerItemId.AMULET_COIN, 5);
      scene.updateItems(true);

      await runMysteryEncounterToEnd(game, 1);

      expect(scene.trainerItems.getStack(TrainerItemId.AMULET_COIN)).toBe(5);
      expect(scene.getPlayerParty()[0].heldItemManager.getStack(HeldItemId.SHELL_BELL)).toBe(1);
    });

    it("should be disabled if player does not have enough money", async () => {
      scene.money = 0;
      await game.runToMysteryEncounter(MysteryEncounterType.DELIBIRDY, defaultParty);
      await game.phaseInterceptor.to(MysteryEncounterPhase, false);

      const encounterPhase = scene.phaseManager.getCurrentPhase();
      expect(encounterPhase?.constructor.name).toBe(MysteryEncounterPhase.name);
      const mysteryEncounterPhase = encounterPhase as MysteryEncounterPhase;
      vi.spyOn(mysteryEncounterPhase, "continueEncounter");
      vi.spyOn(mysteryEncounterPhase, "handleOptionSelect");
      vi.spyOn(scene.ui, "playError");

      await runSelectMysteryEncounterOption(game, 1);

      expect(game).toBeAtPhase("MysteryEncounterPhase");
      expect(scene.ui.playError).not.toHaveBeenCalled(); // No error sfx, option is disabled
      expect(mysteryEncounterPhase.handleOptionSelect).not.toHaveBeenCalled();
      expect(mysteryEncounterPhase.continueEncounter).not.toHaveBeenCalled();
    });

    it("should leave encounter without battle", async () => {
      scene.money = 200000;
      const leaveEncounterWithoutBattleSpy = vi.spyOn(EncounterPhaseUtils, "leaveEncounterWithoutBattle");

      await game.runToMysteryEncounter(MysteryEncounterType.DELIBIRDY, defaultParty);
      await runMysteryEncounterToEnd(game, 1);

      expect(leaveEncounterWithoutBattleSpy).toBeCalled();
    });
  });

  describe("Option 2 - Give Food", () => {
    it("should have the correct properties", () => {
      const option = DelibirdyEncounter.options[1];
      expect(option.optionMode).toBe(MysteryEncounterOptionMode.DISABLED_OR_DEFAULT);
      expect(option.dialogue).toBeDefined();
      expect(option.dialogue).toStrictEqual({
        buttonLabel: `${namespace}:option.2.label`,
        buttonTooltip: `${namespace}:option.2.tooltip`,
        secondOptionPrompt: `${namespace}:option.2.selectPrompt`,
        selected: [
          {
            text: `${namespace}:option.2.selected`,
          },
        ],
      });
    });

    it("Should decrease Berry stacks and give the player a Candy Jar", async () => {
      await game.runToMysteryEncounter(MysteryEncounterType.DELIBIRDY, defaultParty);

      // Set 2 Sitrus berries on party lead
      scene.clearAllItems();
      game.field.getPlayerPokemon().heldItemManager.add(HeldItemId.SITRUS_BERRY, 2);
      scene.updateItems(true);

      await runMysteryEncounterToEnd(game, 2, { pokemonNo: 1, optionNo: 1 });

      expect(scene.getPlayerParty()[0].heldItemManager.getStack(HeldItemId.SITRUS_BERRY)).toBe(1);
      expect(scene.trainerItems.getStack(TrainerItemId.CANDY_JAR)).toBe(1);
    });

    it("Should remove Reviver Seed and give the player a Berry Pouch", async () => {
      await game.runToMysteryEncounter(MysteryEncounterType.DELIBIRDY, defaultParty);

      // Set 1 Reviver Seed on party lead
      scene.clearAllItems();
      game.field.getPlayerPokemon().heldItemManager.add(HeldItemId.REVIVER_SEED);
      scene.updateItems(true);

      await runMysteryEncounterToEnd(game, 2, { pokemonNo: 1, optionNo: 1 });

      expect(scene.getPlayerParty()[0].heldItemManager.getStack(HeldItemId.REVIVER_SEED)).toBe(0);
      expect(scene.trainerItems.getStack(TrainerItemId.BERRY_POUCH)).toBe(1);
    });

    it("Should give the player a Shell Bell if they have max stacks of Candy Jars", async () => {
      await game.runToMysteryEncounter(MysteryEncounterType.DELIBIRDY, defaultParty);

      // 99 Candy Jars
      scene.clearAllItems();
      scene.trainerItems.add(TrainerItemId.CANDY_JAR, 99);

      // Sitrus berries on party
      game.field.getPlayerPokemon().heldItemManager.add(HeldItemId.SITRUS_BERRY, 2);
      scene.updateItems(true);

      await runMysteryEncounterToEnd(game, 2, { pokemonNo: 1, optionNo: 1 });

      expect(scene.getPlayerParty()[0].heldItemManager.getStack(HeldItemId.SITRUS_BERRY)).toBe(1);
      expect(scene.trainerItems.getStack(TrainerItemId.CANDY_JAR)).toBe(99);
      expect(scene.getPlayerParty()[0].heldItemManager.getStack(HeldItemId.SHELL_BELL)).toBe(1);
    });

    it("Should give the player a Shell Bell if they have max stacks of Berry Pouches", async () => {
      await game.runToMysteryEncounter(MysteryEncounterType.DELIBIRDY, defaultParty);

      // 3 Berry Pouches
      scene.clearAllItems();
      scene.trainerItems.add(TrainerItemId.BERRY_POUCH, 3);

      // Set 1 Reviver Seed on party lead
      game.field.getPlayerPokemon().heldItemManager.add(HeldItemId.REVIVER_SEED);
      scene.updateItems(true);

      await runMysteryEncounterToEnd(game, 2, { pokemonNo: 1, optionNo: 1 });

      expect(scene.getPlayerParty()[0].heldItemManager.getStack(HeldItemId.REVIVER_SEED)).toBe(0);
      expect(scene.trainerItems.getStack(TrainerItemId.BERRY_POUCH)).toBe(3);
      expect(scene.getPlayerParty()[0].heldItemManager.getStack(HeldItemId.SHELL_BELL)).toBe(1);
    });

    it("should be disabled if player does not have any proper items", async () => {
      await game.runToMysteryEncounter(MysteryEncounterType.DELIBIRDY, defaultParty);

      // Set 1 Soul Dew on party lead
      scene.clearAllItems();
      game.field.getPlayerPokemon().heldItemManager.add(HeldItemId.SOUL_DEW);
      scene.updateItems(true);

      await game.phaseInterceptor.to(MysteryEncounterPhase, false);

      const encounterPhase = scene.phaseManager.getCurrentPhase();
      expect(encounterPhase?.constructor.name).toBe(MysteryEncounterPhase.name);
      const mysteryEncounterPhase = encounterPhase as MysteryEncounterPhase;
      vi.spyOn(mysteryEncounterPhase, "continueEncounter");
      vi.spyOn(mysteryEncounterPhase, "handleOptionSelect");
      vi.spyOn(scene.ui, "playError");

      await runSelectMysteryEncounterOption(game, 2);

      expect(game).toBeAtPhase("MysteryEncounterPhase");
      expect(scene.ui.playError).not.toHaveBeenCalled(); // No error sfx, option is disabled
      expect(mysteryEncounterPhase.handleOptionSelect).not.toHaveBeenCalled();
      expect(mysteryEncounterPhase.continueEncounter).not.toHaveBeenCalled();
    });

    it("should leave encounter without battle", async () => {
      const leaveEncounterWithoutBattleSpy = vi.spyOn(EncounterPhaseUtils, "leaveEncounterWithoutBattle");

      await game.runToMysteryEncounter(MysteryEncounterType.DELIBIRDY, defaultParty);

      // Set 1 Reviver Seed on party lead
      game.field.getPlayerPokemon().heldItemManager.add(HeldItemId.REVIVER_SEED);
      scene.updateItems(true);

      await runMysteryEncounterToEnd(game, 2, { pokemonNo: 1, optionNo: 1 });

      expect(leaveEncounterWithoutBattleSpy).toBeCalled();
    });
  });

  describe("Option 3 - Give Item", () => {
    it("should have the correct properties", () => {
      const option = DelibirdyEncounter.options[2];
      expect(option.optionMode).toBe(MysteryEncounterOptionMode.DISABLED_OR_DEFAULT);
      expect(option.dialogue).toBeDefined();
      expect(option.dialogue).toStrictEqual({
        buttonLabel: `${namespace}:option.3.label`,
        buttonTooltip: `${namespace}:option.3.tooltip`,
        secondOptionPrompt: `${namespace}:option.3.selectPrompt`,
        selected: [
          {
            text: `${namespace}:option.3.selected`,
          },
        ],
      });
    });

    it("Should decrease held item stacks and give the player a Healing Charm", async () => {
      await game.runToMysteryEncounter(MysteryEncounterType.DELIBIRDY, defaultParty);

      // Set 2 Soul Dew on party lead
      scene.clearAllItems();
      game.field.getPlayerPokemon().heldItemManager.add(HeldItemId.SOUL_DEW, 2);
      scene.updateItems(true);

      await runMysteryEncounterToEnd(game, 3, { pokemonNo: 1, optionNo: 1 });

      expect(scene.getPlayerParty()[0].heldItemManager.getStack(HeldItemId.SOUL_DEW)).toBe(1);
      expect(scene.trainerItems.getStack(TrainerItemId.HEALING_CHARM)).toBe(1);
    });

    it("Should remove held item and give the player a Healing Charm", async () => {
      await game.runToMysteryEncounter(MysteryEncounterType.DELIBIRDY, defaultParty);

      // Set 1 Soul Dew on party lead
      scene.clearAllItems();
      game.field.getPlayerPokemon().heldItemManager.add(HeldItemId.SOUL_DEW);
      scene.updateItems(true);

      await runMysteryEncounterToEnd(game, 3, { pokemonNo: 1, optionNo: 1 });

      expect(scene.getPlayerParty()[0].heldItemManager.getStack(HeldItemId.SOUL_DEW)).toBe(0);
      expect(scene.trainerItems.getStack(TrainerItemId.HEALING_CHARM)).toBe(1);
    });

    it("Should give the player a Shell Bell if they have max stacks of Healing Charms", async () => {
      await game.runToMysteryEncounter(MysteryEncounterType.DELIBIRDY, defaultParty);

      // 5 Healing Charms
      scene.clearAllItems();
      scene.trainerItems.add(TrainerItemId.HEALING_CHARM, 5);

      // Set 1 Soul Dew on party lead
      game.field.getPlayerPokemon().heldItemManager.add(HeldItemId.SOUL_DEW);
      scene.updateItems(true);

      await runMysteryEncounterToEnd(game, 3, { pokemonNo: 1, optionNo: 1 });

      expect(scene.getPlayerParty()[0].heldItemManager.getStack(HeldItemId.SOUL_DEW)).toBe(0);
      expect(scene.trainerItems.getStack(TrainerItemId.HEALING_CHARM)).toBe(5);
      expect(scene.getPlayerParty()[0].heldItemManager.getStack(HeldItemId.SHELL_BELL)).toBe(1);
    });

    it("should be disabled if player does not have any proper items", async () => {
      await game.runToMysteryEncounter(MysteryEncounterType.DELIBIRDY, defaultParty);

      // Set 1 Reviver Seed on party lead
      scene.clearAllItems();
      game.field.getPlayerPokemon().heldItemManager.add(HeldItemId.REVIVER_SEED);
      scene.updateItems(true);

      await game.phaseInterceptor.to(MysteryEncounterPhase, false);

      const encounterPhase = scene.phaseManager.getCurrentPhase();
      expect(encounterPhase?.constructor.name).toBe(MysteryEncounterPhase.name);
      const mysteryEncounterPhase = encounterPhase as MysteryEncounterPhase;
      vi.spyOn(mysteryEncounterPhase, "continueEncounter");
      vi.spyOn(mysteryEncounterPhase, "handleOptionSelect");
      vi.spyOn(scene.ui, "playError");

      await runSelectMysteryEncounterOption(game, 3);

      expect(game).toBeAtPhase("MysteryEncounterPhase");
      expect(scene.ui.playError).not.toHaveBeenCalled(); // No error sfx, option is disabled
      expect(mysteryEncounterPhase.handleOptionSelect).not.toHaveBeenCalled();
      expect(mysteryEncounterPhase.continueEncounter).not.toHaveBeenCalled();
    });

    it("should leave encounter without battle", async () => {
      const leaveEncounterWithoutBattleSpy = vi.spyOn(EncounterPhaseUtils, "leaveEncounterWithoutBattle");

      await game.runToMysteryEncounter(MysteryEncounterType.DELIBIRDY, defaultParty);

      // Set 1 Soul Dew on party lead
      scene.clearAllItems();
      game.field.getPlayerPokemon().heldItemManager.add(HeldItemId.SOUL_DEW);
      scene.updateItems(true);

      await runMysteryEncounterToEnd(game, 3, { pokemonNo: 1, optionNo: 1 });

      expect(leaveEncounterWithoutBattleSpy).toBeCalled();
    });
  });
});
