import { Biome } from "#app/enums/biome";
import { MysteryEncounterType } from "#app/enums/mystery-encounter-type";
import { Species } from "#app/enums/species";
import GameManager from "#app/test/utils/gameManager";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import * as EncounterPhaseUtils from "#app/data/mystery-encounters/utils/encounter-phase-utils";
import { runMysteryEncounterToEnd, runSelectMysteryEncounterOption } from "#test/mystery-encounter/encounter-test-utils";
import BattleScene from "#app/battle-scene";
import { MysteryEncounterOptionMode } from "#enums/mystery-encounter-option-mode";
import { MysteryEncounterTier } from "#enums/mystery-encounter-tier";
import { DelibirdyEncounter } from "#app/data/mystery-encounters/encounters/delibirdy-encounter";
import * as MysteryEncounters from "#app/data/mystery-encounters/mystery-encounters";
import { MoneyRequirement } from "#app/data/mystery-encounters/mystery-encounter-requirements";
import { BerryModifier, HealingBoosterModifier, HiddenAbilityRateBoosterModifier, HitHealModifier, LevelIncrementBoosterModifier, PokemonInstantReviveModifier, PokemonNatureWeightModifier, PreserveBerryModifier } from "#app/modifier/modifier";
import { MysteryEncounterPhase } from "#app/phases/mystery-encounter-phases";
import { generateModifierType } from "#app/data/mystery-encounters/utils/encounter-phase-utils";
import { modifierTypes } from "#app/modifier/modifier-type";
import { BerryType } from "#enums/berry-type";

const namespace = "mysteryEncounter:delibirdy";
const defaultParty = [Species.LAPRAS, Species.GENGAR, Species.ABRA];
const defaultBiome = Biome.CAVE;
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
    game.override.mysteryEncounterChance(100);
    game.override.startingWave(defaultWave);
    game.override.startingBiome(defaultBiome);
    game.override.disableTrainerWaves();

    vi.spyOn(MysteryEncounters, "mysteryEncountersByBiome", "get").mockReturnValue(
      new Map<Biome, MysteryEncounterType[]>([
        [Biome.CAVE, [MysteryEncounterType.DELIBIRDY]],
      ])
    );
  });

  afterEach(() => {
    game.phaseInterceptor.restoreOg();
    vi.clearAllMocks();
    vi.resetAllMocks();
  });

  it("should have the correct properties", async () => {
    await game.runToMysteryEncounter(MysteryEncounterType.DELIBIRDY, defaultParty);

    expect(DelibirdyEncounter.encounterType).toBe(MysteryEncounterType.DELIBIRDY);
    expect(DelibirdyEncounter.encounterTier).toBe(MysteryEncounterTier.GREAT);
    expect(DelibirdyEncounter.dialogue).toBeDefined();
    expect(DelibirdyEncounter.dialogue.intro).toStrictEqual([{ text: `${namespace}.intro` }]);
    expect(DelibirdyEncounter.dialogue.outro).toStrictEqual([{ text: `${namespace}.outro` }]);
    expect(DelibirdyEncounter.dialogue.encounterOptionsDialogue?.title).toBe(`${namespace}.title`);
    expect(DelibirdyEncounter.dialogue.encounterOptionsDialogue?.description).toBe(`${namespace}.description`);
    expect(DelibirdyEncounter.dialogue.encounterOptionsDialogue?.query).toBe(`${namespace}.query`);
    expect(DelibirdyEncounter.options.length).toBe(3);
  });

  it("should not run below wave 10", async () => {
    game.override.startingWave(9);

    await game.runToMysteryEncounter();

    expect(scene.currentBattle?.mysteryEncounter?.encounterType).not.toBe(MysteryEncounterType.DELIBIRDY);
  });

  it("should not run above wave 179", async () => {
    game.override.startingWave(181);

    await game.runToMysteryEncounter();

    expect(scene.currentBattle.mysteryEncounter).toBeUndefined();
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
        buttonLabel: `${namespace}.option.1.label`,
        buttonTooltip: `${namespace}.option.1.tooltip`,
        selected: [
          {
            text: `${namespace}.option.1.selected`,
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

      const price = (scene.currentBattle.mysteryEncounter?.options[0].requirements[0] as MoneyRequirement).requiredMoney;

      expect(updateMoneySpy).toHaveBeenCalledWith(scene, -price, true, false);
      expect(scene.money).toBe(initialMoney - price);
    });

    it("Should give the player a Hidden Ability Charm", async () => {
      scene.money = 200000;
      await game.runToMysteryEncounter(MysteryEncounterType.DELIBIRDY, defaultParty);
      await runMysteryEncounterToEnd(game, 1);

      const itemModifier = scene.findModifier(m => m instanceof HiddenAbilityRateBoosterModifier) as HiddenAbilityRateBoosterModifier;

      expect(itemModifier).toBeDefined();
      expect(itemModifier?.stackCount).toBe(1);
    });

    it("Should give the player a Shell Bell if they have max stacks of Berry Pouches", async () => {
      scene.money = 200000;
      await game.runToMysteryEncounter(MysteryEncounterType.DELIBIRDY, defaultParty);

      // 5 Healing Charms
      scene.modifiers = [];
      const abilityCharm = generateModifierType(scene, modifierTypes.ABILITY_CHARM)!.newModifier() as HiddenAbilityRateBoosterModifier;
      abilityCharm.stackCount = 4;
      await scene.addModifier(abilityCharm, true, false, false, true);
      await scene.updateModifiers(true);

      await runMysteryEncounterToEnd(game, 1);

      const abilityCharmAfter = scene.findModifier(m => m instanceof HiddenAbilityRateBoosterModifier);
      const shellBellAfter = scene.findModifier(m => m instanceof HitHealModifier);

      expect(abilityCharmAfter).toBeDefined();
      expect(abilityCharmAfter?.stackCount).toBe(4);
      expect(shellBellAfter).toBeDefined();
      expect(shellBellAfter?.stackCount).toBe(1);
    });

    it("should be disabled if player does not have enough money", async () => {
      scene.money = 0;
      await game.runToMysteryEncounter(MysteryEncounterType.DELIBIRDY, defaultParty);
      await game.phaseInterceptor.to(MysteryEncounterPhase, false);

      const encounterPhase = scene.getCurrentPhase();
      expect(encounterPhase?.constructor.name).toBe(MysteryEncounterPhase.name);
      const mysteryEncounterPhase = encounterPhase as MysteryEncounterPhase;
      vi.spyOn(mysteryEncounterPhase, "continueEncounter");
      vi.spyOn(mysteryEncounterPhase, "handleOptionSelect");
      vi.spyOn(scene.ui, "playError");

      await runSelectMysteryEncounterOption(game, 1);

      expect(scene.getCurrentPhase()?.constructor.name).toBe(MysteryEncounterPhase.name);
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
        buttonLabel: `${namespace}.option.2.label`,
        buttonTooltip: `${namespace}.option.2.tooltip`,
        secondOptionPrompt: `${namespace}.option.2.select_prompt`,
        selected: [
          {
            text: `${namespace}.option.2.selected`,
          },
        ],
      });
    });

    it("Should decrease Berry stacks and give the player a Candy Jar", async () => {
      await game.runToMysteryEncounter(MysteryEncounterType.DELIBIRDY, defaultParty);

      // Set 2 Sitrus berries on party lead
      scene.modifiers = [];
      const sitrus = generateModifierType(scene, modifierTypes.BERRY, [BerryType.SITRUS])!;
      const sitrusMod = sitrus.newModifier(scene.getParty()[0]) as BerryModifier;
      sitrusMod.stackCount = 2;
      await scene.addModifier(sitrusMod, true, false, false, true);
      await scene.updateModifiers(true);

      await runMysteryEncounterToEnd(game, 2, { pokemonNo: 1, optionNo: 1});

      const sitrusAfter = scene.findModifier(m => m instanceof BerryModifier);
      const candyJarAfter = scene.findModifier(m => m instanceof LevelIncrementBoosterModifier);

      expect(sitrusAfter?.stackCount).toBe(1);
      expect(candyJarAfter).toBeDefined();
      expect(candyJarAfter?.stackCount).toBe(1);
    });

    it("Should remove Reviver Seed and give the player a Healing Charm", async () => {
      await game.runToMysteryEncounter(MysteryEncounterType.DELIBIRDY, defaultParty);

      // Set 1 Reviver Seed on party lead
      scene.modifiers = [];
      const revSeed = generateModifierType(scene, modifierTypes.REVIVER_SEED)!;
      const modifier = revSeed.newModifier(scene.getParty()[0]) as PokemonInstantReviveModifier;
      modifier.stackCount = 1;
      await scene.addModifier(modifier, true, false, false, true);
      await scene.updateModifiers(true);

      await runMysteryEncounterToEnd(game, 2, { pokemonNo: 1, optionNo: 1});

      const reviverSeedAfter = scene.findModifier(m => m instanceof PokemonInstantReviveModifier);
      const healingCharmAfter = scene.findModifier(m => m instanceof HealingBoosterModifier);

      expect(reviverSeedAfter).toBeUndefined();
      expect(healingCharmAfter).toBeDefined();
      expect(healingCharmAfter?.stackCount).toBe(1);
    });

    it("Should give the player a Shell Bell if they have max stacks of Candy Jars", async () => {
      await game.runToMysteryEncounter(MysteryEncounterType.DELIBIRDY, defaultParty);

      // 99 Candy Jars
      scene.modifiers = [];
      const candyJar = generateModifierType(scene, modifierTypes.CANDY_JAR)!.newModifier() as LevelIncrementBoosterModifier;
      candyJar.stackCount = 99;
      await scene.addModifier(candyJar, true, false, false, true);
      const sitrus = generateModifierType(scene, modifierTypes.BERRY, [BerryType.SITRUS])!;

      // Sitrus berries on party
      const sitrusMod = sitrus.newModifier(scene.getParty()[0]) as BerryModifier;
      sitrusMod.stackCount = 2;
      await scene.addModifier(sitrusMod, true, false, false, true);
      await scene.updateModifiers(true);

      await runMysteryEncounterToEnd(game, 2, { pokemonNo: 1, optionNo: 1});

      const sitrusAfter = scene.findModifier(m => m instanceof BerryModifier);
      const candyJarAfter = scene.findModifier(m => m instanceof LevelIncrementBoosterModifier);
      const shellBellAfter = scene.findModifier(m => m instanceof HitHealModifier);

      expect(sitrusAfter?.stackCount).toBe(1);
      expect(candyJarAfter).toBeDefined();
      expect(candyJarAfter?.stackCount).toBe(99);
      expect(shellBellAfter).toBeDefined();
      expect(shellBellAfter?.stackCount).toBe(1);
    });

    it("Should give the player a Shell Bell if they have max stacks of Healing Charms", async () => {
      await game.runToMysteryEncounter(MysteryEncounterType.DELIBIRDY, defaultParty);

      // 5 Healing Charms
      scene.modifiers = [];
      const healingCharm = generateModifierType(scene, modifierTypes.HEALING_CHARM)!.newModifier() as HealingBoosterModifier;
      healingCharm.stackCount = 5;
      await scene.addModifier(healingCharm, true, false, false, true);

      // Set 1 Reviver Seed on party lead
      const revSeed = generateModifierType(scene, modifierTypes.REVIVER_SEED)!;
      const modifier = revSeed.newModifier(scene.getParty()[0]) as PokemonInstantReviveModifier;
      modifier.stackCount = 1;
      await scene.addModifier(modifier, true, false, false, true);
      await scene.updateModifiers(true);

      await runMysteryEncounterToEnd(game, 2, { pokemonNo: 1, optionNo: 1});

      const reviverSeedAfter = scene.findModifier(m => m instanceof PokemonInstantReviveModifier);
      const healingCharmAfter = scene.findModifier(m => m instanceof HealingBoosterModifier);
      const shellBellAfter = scene.findModifier(m => m instanceof HitHealModifier);

      expect(reviverSeedAfter).toBeUndefined();
      expect(healingCharmAfter).toBeDefined();
      expect(healingCharmAfter?.stackCount).toBe(5);
      expect(shellBellAfter).toBeDefined();
      expect(shellBellAfter?.stackCount).toBe(1);
    });

    it("should be disabled if player does not have any proper items", async () => {
      await game.runToMysteryEncounter(MysteryEncounterType.DELIBIRDY, defaultParty);

      // Set 1 Soul Dew on party lead
      scene.modifiers = [];
      const soulDew = generateModifierType(scene, modifierTypes.SOUL_DEW)!;
      const modifier = soulDew.newModifier(scene.getParty()[0]);
      await scene.addModifier(modifier, true, false, false, true);
      await scene.updateModifiers(true);

      await game.phaseInterceptor.to(MysteryEncounterPhase, false);

      const encounterPhase = scene.getCurrentPhase();
      expect(encounterPhase?.constructor.name).toBe(MysteryEncounterPhase.name);
      const mysteryEncounterPhase = encounterPhase as MysteryEncounterPhase;
      vi.spyOn(mysteryEncounterPhase, "continueEncounter");
      vi.spyOn(mysteryEncounterPhase, "handleOptionSelect");
      vi.spyOn(scene.ui, "playError");

      await runSelectMysteryEncounterOption(game, 2);

      expect(scene.getCurrentPhase()?.constructor.name).toBe(MysteryEncounterPhase.name);
      expect(scene.ui.playError).not.toHaveBeenCalled(); // No error sfx, option is disabled
      expect(mysteryEncounterPhase.handleOptionSelect).not.toHaveBeenCalled();
      expect(mysteryEncounterPhase.continueEncounter).not.toHaveBeenCalled();
    });

    it("should leave encounter without battle", async () => {
      const leaveEncounterWithoutBattleSpy = vi.spyOn(EncounterPhaseUtils, "leaveEncounterWithoutBattle");

      await game.runToMysteryEncounter(MysteryEncounterType.DELIBIRDY, defaultParty);

      // Set 1 Reviver Seed on party lead
      const revSeed = generateModifierType(scene, modifierTypes.REVIVER_SEED)!;
      const modifier = revSeed.newModifier(scene.getParty()[0]) as PokemonInstantReviveModifier;
      modifier.stackCount = 1;
      await scene.addModifier(modifier, true, false, false, true);
      await scene.updateModifiers(true);

      await runMysteryEncounterToEnd(game, 2, { pokemonNo: 1, optionNo: 1});

      expect(leaveEncounterWithoutBattleSpy).toBeCalled();
    });
  });

  describe("Option 3 - Give Item", () => {
    it("should have the correct properties", () => {
      const option = DelibirdyEncounter.options[2];
      expect(option.optionMode).toBe(MysteryEncounterOptionMode.DISABLED_OR_DEFAULT);
      expect(option.dialogue).toBeDefined();
      expect(option.dialogue).toStrictEqual({
        buttonLabel: `${namespace}.option.3.label`,
        buttonTooltip: `${namespace}.option.3.tooltip`,
        secondOptionPrompt: `${namespace}.option.3.select_prompt`,
        selected: [
          {
            text: `${namespace}.option.3.selected`,
          },
        ],
      });
    });

    it("Should decrease held item stacks and give the player a Berry Pouch", async () => {
      await game.runToMysteryEncounter(MysteryEncounterType.DELIBIRDY, defaultParty);

      // Set 2 Soul Dew on party lead
      scene.modifiers = [];
      const soulDew = generateModifierType(scene, modifierTypes.SOUL_DEW)!;
      const modifier = soulDew.newModifier(scene.getParty()[0]) as PokemonNatureWeightModifier;
      modifier.stackCount = 2;
      await scene.addModifier(modifier, true, false, false, true);
      await scene.updateModifiers(true);

      await runMysteryEncounterToEnd(game, 3, { pokemonNo: 1, optionNo: 1});

      const soulDewAfter = scene.findModifier(m => m instanceof PokemonNatureWeightModifier);
      const berryPouchAfter = scene.findModifier(m => m instanceof PreserveBerryModifier);

      expect(soulDewAfter?.stackCount).toBe(1);
      expect(berryPouchAfter).toBeDefined();
      expect(berryPouchAfter?.stackCount).toBe(1);
    });

    it("Should remove held item and give the player a Berry Pouch", async () => {
      await game.runToMysteryEncounter(MysteryEncounterType.DELIBIRDY, defaultParty);

      // Set 1 Soul Dew on party lead
      scene.modifiers = [];
      const soulDew = generateModifierType(scene, modifierTypes.SOUL_DEW)!;
      const modifier = soulDew.newModifier(scene.getParty()[0]) as PokemonNatureWeightModifier;
      modifier.stackCount = 1;
      await scene.addModifier(modifier, true, false, false, true);
      await scene.updateModifiers(true);

      await runMysteryEncounterToEnd(game, 3, { pokemonNo: 1, optionNo: 1});

      const soulDewAfter = scene.findModifier(m => m instanceof PokemonNatureWeightModifier);
      const berryPouchAfter = scene.findModifier(m => m instanceof PreserveBerryModifier);

      expect(soulDewAfter).toBeUndefined();
      expect(berryPouchAfter).toBeDefined();
      expect(berryPouchAfter?.stackCount).toBe(1);
    });

    it("Should give the player a Shell Bell if they have max stacks of Berry Pouches", async () => {
      await game.runToMysteryEncounter(MysteryEncounterType.DELIBIRDY, defaultParty);

      // 5 Healing Charms
      scene.modifiers = [];
      const healingCharm = generateModifierType(scene, modifierTypes.BERRY_POUCH)!.newModifier() as PreserveBerryModifier;
      healingCharm.stackCount = 3;
      await scene.addModifier(healingCharm, true, false, false, true);

      // Set 1 Soul Dew on party lead
      const soulDew = generateModifierType(scene, modifierTypes.SOUL_DEW)!;
      const modifier = soulDew.newModifier(scene.getParty()[0]) as PokemonNatureWeightModifier;
      modifier.stackCount = 1;
      await scene.addModifier(modifier, true, false, false, true);
      await scene.updateModifiers(true);

      await runMysteryEncounterToEnd(game, 3, { pokemonNo: 1, optionNo: 1});

      const soulDewAfter = scene.findModifier(m => m instanceof PokemonNatureWeightModifier);
      const berryPouchAfter = scene.findModifier(m => m instanceof PreserveBerryModifier);
      const shellBellAfter = scene.findModifier(m => m instanceof HitHealModifier);

      expect(soulDewAfter).toBeUndefined();
      expect(berryPouchAfter).toBeDefined();
      expect(berryPouchAfter?.stackCount).toBe(3);
      expect(shellBellAfter).toBeDefined();
      expect(shellBellAfter?.stackCount).toBe(1);
    });

    it("should be disabled if player does not have any proper items", async () => {
      await game.runToMysteryEncounter(MysteryEncounterType.DELIBIRDY, defaultParty);

      // Set 1 Reviver Seed on party lead
      scene.modifiers = [];
      const revSeed = generateModifierType(scene, modifierTypes.REVIVER_SEED)!;
      const modifier = revSeed.newModifier(scene.getParty()[0]);
      await scene.addModifier(modifier, true, false, false, true);
      await scene.updateModifiers(true);

      await game.phaseInterceptor.to(MysteryEncounterPhase, false);

      const encounterPhase = scene.getCurrentPhase();
      expect(encounterPhase?.constructor.name).toBe(MysteryEncounterPhase.name);
      const mysteryEncounterPhase = encounterPhase as MysteryEncounterPhase;
      vi.spyOn(mysteryEncounterPhase, "continueEncounter");
      vi.spyOn(mysteryEncounterPhase, "handleOptionSelect");
      vi.spyOn(scene.ui, "playError");

      await runSelectMysteryEncounterOption(game, 3);

      expect(scene.getCurrentPhase()?.constructor.name).toBe(MysteryEncounterPhase.name);
      expect(scene.ui.playError).not.toHaveBeenCalled(); // No error sfx, option is disabled
      expect(mysteryEncounterPhase.handleOptionSelect).not.toHaveBeenCalled();
      expect(mysteryEncounterPhase.continueEncounter).not.toHaveBeenCalled();
    });

    it("should leave encounter without battle", async () => {
      const leaveEncounterWithoutBattleSpy = vi.spyOn(EncounterPhaseUtils, "leaveEncounterWithoutBattle");

      await game.runToMysteryEncounter(MysteryEncounterType.DELIBIRDY, defaultParty);

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
});
