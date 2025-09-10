import type { BattleScene } from "#app/battle-scene";
import { BiomeId } from "#enums/biome-id";
import { ModifierTier } from "#enums/modifier-tier";
import { MysteryEncounterOptionMode } from "#enums/mystery-encounter-option-mode";
import { MysteryEncounterTier } from "#enums/mystery-encounter-tier";
import { MysteryEncounterType } from "#enums/mystery-encounter-type";
import { SpeciesId } from "#enums/species-id";
import { UiMode } from "#enums/ui-mode";
import * as EncounterPhaseUtils from "#mystery-encounters/encounter-phase-utils";
import * as EncounterTransformationSequence from "#mystery-encounters/encounter-transformation-sequence";
import * as MysteryEncounters from "#mystery-encounters/mystery-encounters";
import { WeirdDreamEncounter } from "#mystery-encounters/weird-dream-encounter";
import {
  runMysteryEncounterToEnd,
  skipBattleRunMysteryEncounterRewardsPhase,
} from "#test/mystery-encounter/encounter-test-utils";
import { GameManager } from "#test/test-utils/game-manager";
import { initSceneWithoutEncounterPhase } from "#test/test-utils/game-manager-utils";
import { ModifierSelectUiHandler } from "#ui/handlers/modifier-select-ui-handler";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

const namespace = "mysteryEncounters/weirdDream";
const defaultParty = [SpeciesId.MAGBY, SpeciesId.HAUNTER, SpeciesId.ABRA];
const defaultBiome = BiomeId.CAVE;
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
    game.override
      .mysteryEncounterChance(100)
      .startingWave(defaultWave)
      .startingBiome(defaultBiome)
      .disableTrainerWaves();
    vi.spyOn(EncounterTransformationSequence, "doPokemonTransformationSequence").mockImplementation(
      () => new Promise<void>(resolve => resolve()),
    );

    vi.spyOn(MysteryEncounters, "mysteryEncountersByBiome", "get").mockReturnValue(
      new Map<BiomeId, MysteryEncounterType[]>([[BiomeId.CAVE, [MysteryEncounterType.WEIRD_DREAM]]]),
    );
  });

  afterEach(() => {
    game.phaseInterceptor.restoreOg();
  });

  it("should have the correct properties", async () => {
    await game.runToMysteryEncounter(MysteryEncounterType.WEIRD_DREAM, defaultParty);

    expect(WeirdDreamEncounter.encounterType).toBe(MysteryEncounterType.WEIRD_DREAM);
    expect(WeirdDreamEncounter.encounterTier).toBe(MysteryEncounterTier.ROGUE);
    expect(WeirdDreamEncounter.dialogue).toBeDefined();
    expect(WeirdDreamEncounter.dialogue.intro).toStrictEqual([
      {
        text: `${namespace}:intro`,
      },
      {
        speaker: `${namespace}:speaker`,
        text: `${namespace}:introDialogue`,
      },
    ]);
    expect(WeirdDreamEncounter.dialogue.encounterOptionsDialogue?.title).toBe(`${namespace}:title`);
    expect(WeirdDreamEncounter.dialogue.encounterOptionsDialogue?.description).toBe(`${namespace}:description`);
    expect(WeirdDreamEncounter.dialogue.encounterOptionsDialogue?.query).toBe(`${namespace}:query`);
    expect(WeirdDreamEncounter.options.length).toBe(3);
  });

  it("should initialize fully", async () => {
    initSceneWithoutEncounterPhase(scene, defaultParty);
    scene.currentBattle.mysteryEncounter = WeirdDreamEncounter;
    const loadBgmSpy = vi.spyOn(scene, "loadBgm");

    const { onInit } = WeirdDreamEncounter;

    expect(WeirdDreamEncounter.onInit).toBeDefined();

    WeirdDreamEncounter.populateDialogueTokensFromRequirements();
    const onInitResult = onInit!();

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

      const pokemonPrior = scene.getPlayerParty().slice();
      const bstsPrior = pokemonPrior.map(species => species.getSpeciesForm().getBaseStatTotal());

      await runMysteryEncounterToEnd(game, 1);
      expect(game).toBeAtPhase("SelectModifierPhase");
      await game.phaseInterceptor.to("SelectModifierPhase");

      const pokemonAfter = scene.getPlayerParty();
      const bstsAfter = pokemonAfter.map(pokemon => pokemon.getSpeciesForm().getBaseStatTotal());
      const bstDiff = bstsAfter.map((bst, index) => bst - bstsPrior[index]);

      for (let i = 0; i < pokemonAfter.length; i++) {
        const newPokemon = pokemonAfter[i];
        expect(newPokemon.getSpeciesForm().speciesId).not.toBe(pokemonPrior[i].getSpeciesForm().speciesId);
        expect(newPokemon.customPokemonData?.types.length).toBe(2);
      }

      const plus90To110 = bstDiff.filter(bst => bst > 80);
      const plus40To50 = bstDiff.filter(bst => bst < 80);

      expect(plus90To110.length).toBe(2);
      expect(plus40To50.length).toBe(1);
    });

    it("should have 1 Memory Mushroom, 5 Rogue Balls, and 3 Mints in rewards", async () => {
      await game.runToMysteryEncounter(MysteryEncounterType.WEIRD_DREAM, defaultParty);
      await runMysteryEncounterToEnd(game, 1);
      await game.phaseInterceptor.to("SelectModifierPhase", false);
      expect(game).toBeAtPhase("SelectModifierPhase");
      await game.phaseInterceptor.to("SelectModifierPhase");

      expect(scene.ui.getMode()).to.equal(UiMode.MODIFIER_SELECT);
      const modifierSelectHandler = scene.ui.handlers.find(
        h => h instanceof ModifierSelectUiHandler,
      ) as ModifierSelectUiHandler;
      expect(modifierSelectHandler.options.length).toEqual(6);
      expect(modifierSelectHandler.options[0].modifierTypeOption.type.id).toEqual("MEMORY_MUSHROOM");
      expect(modifierSelectHandler.options[1].modifierTypeOption.type.id).toEqual("ROGUE_BALL");
      expect(modifierSelectHandler.options[2].modifierTypeOption.type.id).toEqual("MINT");
      expect(modifierSelectHandler.options[3].modifierTypeOption.type.id).toEqual("MINT");
      expect(modifierSelectHandler.options[4].modifierTypeOption.type.id).toEqual("MINT");
      expect(modifierSelectHandler.options[5].modifierTypeOption.type.id).toEqual("MINT");
    });

    it("should leave encounter without battle", async () => {
      const leaveEncounterWithoutBattleSpy = vi.spyOn(EncounterPhaseUtils, "leaveEncounterWithoutBattle");

      await game.runToMysteryEncounter(MysteryEncounterType.WEIRD_DREAM, defaultParty);
      await runMysteryEncounterToEnd(game, 1);

      expect(leaveEncounterWithoutBattleSpy).toBeCalled();
    });
  });

  describe("Option 2 - Battle Future Self", () => {
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

    it("should start a battle against the player's transformation team", async () => {
      await game.runToMysteryEncounter(MysteryEncounterType.WEIRD_DREAM, defaultParty);
      await runMysteryEncounterToEnd(game, 2, undefined, true);

      const enemyField = scene.getEnemyField();
      expect(game).toBeAtPhase("CommandPhase");
      expect(enemyField.length).toBe(1);
      expect(scene.getEnemyParty().length).toBe(scene.getPlayerParty().length);
    });

    it("should have 2 Rogue/2 Ultra/2 Great items in rewards", async () => {
      await game.runToMysteryEncounter(MysteryEncounterType.WEIRD_DREAM, defaultParty);
      await runMysteryEncounterToEnd(game, 2, undefined, true);
      await skipBattleRunMysteryEncounterRewardsPhase(game);
      await game.phaseInterceptor.to("SelectModifierPhase", false);
      expect(game).toBeAtPhase("SelectModifierPhase");
      await game.phaseInterceptor.to("SelectModifierPhase");

      expect(scene.ui.getMode()).to.equal(UiMode.MODIFIER_SELECT);
      const modifierSelectHandler = scene.ui.handlers.find(
        h => h instanceof ModifierSelectUiHandler,
      ) as ModifierSelectUiHandler;
      expect(modifierSelectHandler.options.length).toEqual(6);
      expect(
        modifierSelectHandler.options[0].modifierTypeOption.type.tier
          - modifierSelectHandler.options[0].modifierTypeOption.upgradeCount,
      ).toEqual(ModifierTier.ROGUE);
      expect(
        modifierSelectHandler.options[1].modifierTypeOption.type.tier
          - modifierSelectHandler.options[1].modifierTypeOption.upgradeCount,
      ).toEqual(ModifierTier.ROGUE);
      expect(
        modifierSelectHandler.options[2].modifierTypeOption.type.tier
          - modifierSelectHandler.options[2].modifierTypeOption.upgradeCount,
      ).toEqual(ModifierTier.ULTRA);
      expect(
        modifierSelectHandler.options[3].modifierTypeOption.type.tier
          - modifierSelectHandler.options[3].modifierTypeOption.upgradeCount,
      ).toEqual(ModifierTier.ULTRA);
      expect(
        modifierSelectHandler.options[4].modifierTypeOption.type.tier
          - modifierSelectHandler.options[4].modifierTypeOption.upgradeCount,
      ).toEqual(ModifierTier.GREAT);
      expect(
        modifierSelectHandler.options[5].modifierTypeOption.type.tier
          - modifierSelectHandler.options[5].modifierTypeOption.upgradeCount,
      ).toEqual(ModifierTier.GREAT);
    });
  });

  describe("Option 3 - Leave", () => {
    it("should have the correct properties", () => {
      const option = WeirdDreamEncounter.options[2];
      expect(option.optionMode).toBe(MysteryEncounterOptionMode.DEFAULT);
      expect(option.dialogue).toBeDefined();
      expect(option.dialogue).toStrictEqual({
        buttonLabel: `${namespace}:option.3.label`,
        buttonTooltip: `${namespace}:option.3.tooltip`,
        selected: [
          {
            text: `${namespace}:option.3.selected`,
          },
        ],
      });
    });

    it("should reduce party levels by 10%", async () => {
      const leaveEncounterWithoutBattleSpy = vi.spyOn(EncounterPhaseUtils, "leaveEncounterWithoutBattle");

      await game.runToMysteryEncounter(MysteryEncounterType.WEIRD_DREAM, defaultParty);
      const levelsPrior = scene.getPlayerParty().map(p => p.level);
      await runMysteryEncounterToEnd(game, 3);

      const levelsAfter = scene.getPlayerParty().map(p => p.level);

      for (let i = 0; i < levelsPrior.length; i++) {
        expect(Math.max(Math.ceil(0.9 * levelsPrior[i]), 1)).toBe(levelsAfter[i]);
        expect(scene.getPlayerParty()[i].levelExp).toBe(0);
      }

      expect(leaveEncounterWithoutBattleSpy).toBeCalled();
    });

    it("should leave encounter without battle", async () => {
      const leaveEncounterWithoutBattleSpy = vi.spyOn(EncounterPhaseUtils, "leaveEncounterWithoutBattle");

      await game.runToMysteryEncounter(MysteryEncounterType.WEIRD_DREAM, defaultParty);
      await runMysteryEncounterToEnd(game, 3);

      expect(leaveEncounterWithoutBattleSpy).toBeCalled();
    });
  });
});
