import type { BattleScene } from "#app/battle-scene";
import { Status } from "#data/status-effect";
import { BiomeId } from "#enums/biome-id";
import { Challenges } from "#enums/challenges";
import { ModifierTier } from "#enums/modifier-tier";
import { MysteryEncounterOptionMode } from "#enums/mystery-encounter-option-mode";
import { MysteryEncounterTier } from "#enums/mystery-encounter-tier";
import { MysteryEncounterType } from "#enums/mystery-encounter-type";
import { SpeciesId } from "#enums/species-id";
import { StatusEffect } from "#enums/status-effect";
import { UiMode } from "#enums/ui-mode";
import type { PlayerPokemon } from "#field/pokemon";
import * as EncounterPhaseUtils from "#mystery-encounters/encounter-phase-utils";
import * as EncounterTransformationSequence from "#mystery-encounters/encounter-transformation-sequence";
import * as MysteryEncounters from "#mystery-encounters/mystery-encounter-biomes";
import { WeirdDreamEncounter } from "#mystery-encounters/weird-dream-encounter";
import { GameManager } from "#test/framework/game-manager";
import { runMysteryEncounterToEnd, skipBattleRunMysteryEncounterRewardsPhase } from "#test/utils/encounter-test-utils";
import { initSceneWithoutEncounterPhase } from "#test/utils/game-manager-utils";
import { ModifierSelectUiHandler } from "#ui/modifier-select-ui-handler";
import Phaser from "phaser";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

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

  function faint(...pokemon: PlayerPokemon[]) {
    for (const p of pokemon) {
      p.hp = 0;
      p.status = new Status(StatusEffect.FAINT);
    }
  }

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

    const { onInit } = WeirdDreamEncounter;

    expect(WeirdDreamEncounter.onInit).toBeDefined();

    WeirdDreamEncounter.populateDialogueTokensFromRequirements();
    const onInitResult = onInit!();

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

      expect(scene.ui.mode).toBe(UiMode.MODIFIER_SELECT);
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

  describe("Option 1 - Accept Transformation - passive reward", () => {
    /**
     * Start the encounter, then clear every passive in the player's party so that any passive found
     * after the transformation was unlocked by the encounter.
     * Transformed Pokemon keep their original's passive, and fainted Pokemon stay fainted.
     * @returns The player's party before the transformation, in `defaultParty` order (Magby, Haunter, Abra)
     */
    async function startEncounterWithoutPassives() {
      await game.runToMysteryEncounter(MysteryEncounterType.WEIRD_DREAM, defaultParty);

      const party = scene.getPlayerParty();
      for (const pokemon of party) {
        pokemon.passive = false;
      }
      return party;
    }

    /**
     * Accept the transformation.
     * @returns The transformed party, in the same order as before the transformation
     */
    async function acceptTransformation() {
      await runMysteryEncounterToEnd(game, 1);
      return scene.getPlayerParty();
    }

    // https://github.com/pagefaultgames/pokerogue/issues/7654
    it("should not unlock the passive of a fainted Pokemon in Hardcore", async () => {
      const [magby, haunter, abra] = await startEncounterWithoutPassives();
      // Magby is the only Pokemon without a passive
      faint(magby);
      haunter.passive = true;
      abra.passive = true;
      game.challengeMode.overrideGameWithChallenges(Challenges.HARDCORE, 1, 1);

      const [newMagby] = await acceptTransformation();

      expect(newMagby.passive).toBe(false);
    });

    it("should be able to unlock the passive of a fainted Pokemon outside of Hardcore", async () => {
      const [magby, haunter, abra] = await startEncounterWithoutPassives();
      // Magby is the only Pokemon without a passive
      faint(magby);
      haunter.passive = true;
      abra.passive = true;

      const [newMagby] = await acceptTransformation();

      expect(newMagby.passive).toBe(true);
    });

    it("should unlock the passive of a non-fainted Pokemon in Hardcore", async () => {
      const [magby, haunter] = await startEncounterWithoutPassives();
      // Abra is the only non-fainted Pokemon without a passive
      faint(magby);
      haunter.passive = true;
      game.challengeMode.overrideGameWithChallenges(Challenges.HARDCORE, 1, 1);

      const [newMagby, , newAbra] = await acceptTransformation();

      expect(newMagby.passive).toBe(false);
      expect(newAbra.passive).toBe(true);
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

      expect(scene.ui.mode).toBe(UiMode.MODIFIER_SELECT);
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

  describe("Option 2 - Battle Future Self - passive reward", () => {
    /**
     * Start the battle against the transformed team, then clear every passive in the player's party
     * so that any passive found after the rewards was unlocked by the encounter.
     * @returns The player's party, in `defaultParty` order (Magby, Haunter, Abra)
     */
    async function startBattleWithoutPassives() {
      await game.runToMysteryEncounter(MysteryEncounterType.WEIRD_DREAM, defaultParty);
      await runMysteryEncounterToEnd(game, 2, undefined, true);

      const party = scene.getPlayerParty();
      for (const pokemon of party) {
        pokemon.passive = false;
      }
      return party;
    }

    /** Win the battle and run the rewards phase, where the passive is unlocked */
    async function collectRewards() {
      await skipBattleRunMysteryEncounterRewardsPhase(game);
    }

    // https://github.com/pagefaultgames/pokerogue/issues/7654
    it("should not unlock the passive of a fainted Pokemon in Hardcore", async () => {
      const [magby, haunter, abra] = await startBattleWithoutPassives();
      // Magby is the only Pokemon without a passive
      faint(magby);
      haunter.passive = true;
      abra.passive = true;
      game.challengeMode.overrideGameWithChallenges(Challenges.HARDCORE, 1, 1);

      await collectRewards();

      expect(magby.passive).toBe(false);
    });

    it("should be able to unlock the passive of a fainted Pokemon outside of Hardcore", async () => {
      const [magby, haunter, abra] = await startBattleWithoutPassives();
      // Magby is the only Pokemon without a passive
      faint(magby);
      haunter.passive = true;
      abra.passive = true;

      await collectRewards();

      expect(magby.passive).toBe(true);
    });

    it("should unlock the passive of a non-fainted Pokemon in Hardcore", async () => {
      const [magby, haunter, abra] = await startBattleWithoutPassives();
      // Abra is the only non-fainted Pokemon without a passive
      faint(magby);
      haunter.passive = true;
      game.challengeMode.overrideGameWithChallenges(Challenges.HARDCORE, 1, 1);

      await collectRewards();

      expect(magby.passive).toBe(false);
      expect(abra.passive).toBe(true);
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
