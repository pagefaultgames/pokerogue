import type { BattleScene } from "#app/battle-scene";
import * as BattleAnims from "#data/battle-anims";
import { BiomeId } from "#enums/biome-id";
import { HeldItemCategoryId, HeldItemId } from "#enums/held-item-id";
import { MoveId } from "#enums/move-id";
import { MysteryEncounterOptionMode } from "#enums/mystery-encounter-option-mode";
import { MysteryEncounterTier } from "#enums/mystery-encounter-tier";
import { MysteryEncounterType } from "#enums/mystery-encounter-type";
import { RarityTier } from "#enums/reward-tier";
import { SpeciesId } from "#enums/species-id";
import { TrainerItemId } from "#enums/trainer-item-id";
import { UiMode } from "#enums/ui-mode";
import { PokemonMove } from "#moves/pokemon-move";
import type { EnemyPartyConfig, EnemyPokemonConfig } from "#mystery-encounters/encounter-phase-utils";
import * as EncounterPhaseUtils from "#mystery-encounters/encounter-phase-utils";
import * as MysteryEncounters from "#mystery-encounters/mystery-encounters";
import { TrashToTreasureEncounter } from "#mystery-encounters/trash-to-treasure-encounter";
import { MovePhase } from "#phases/move-phase";
import {
  runMysteryEncounterToEnd,
  skipBattleRunMysteryEncounterRewardsPhase,
} from "#test/mystery-encounter/encounter-test-utils";
import { GameManager } from "#test/test-utils/game-manager";
import { initSceneWithoutEncounterPhase } from "#test/test-utils/game-manager-utils";
import { RewardSelectUiHandler } from "#ui/reward-select-ui-handler";
import * as Utils from "#utils/common";
import { randSeedInt } from "#utils/common";
import { getPokemonSpecies } from "#utils/pokemon-utils";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

const namespace = "mysteryEncounters/trashToTreasure";
const defaultParty = [SpeciesId.LAPRAS, SpeciesId.GENGAR, SpeciesId.ABRA];
const defaultBiome = BiomeId.CAVE;
const defaultWave = 45;

describe("Trash to Treasure - Mystery Encounter", () => {
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
      new Map<BiomeId, MysteryEncounterType[]>([[BiomeId.CAVE, [MysteryEncounterType.TRASH_TO_TREASURE]]]),
    );
  });

  afterEach(() => {
    game.phaseInterceptor.restoreOg();
  });

  it("should have the correct properties", async () => {
    await game.runToMysteryEncounter(MysteryEncounterType.TRASH_TO_TREASURE, defaultParty);

    expect(TrashToTreasureEncounter.encounterType).toBe(MysteryEncounterType.TRASH_TO_TREASURE);
    expect(TrashToTreasureEncounter.encounterTier).toBe(MysteryEncounterTier.ULTRA);
    expect(TrashToTreasureEncounter.dialogue).toBeDefined();
    expect(TrashToTreasureEncounter.dialogue.intro).toStrictEqual([{ text: `${namespace}:intro` }]);
    expect(TrashToTreasureEncounter.dialogue.encounterOptionsDialogue?.title).toBe(`${namespace}:title`);
    expect(TrashToTreasureEncounter.dialogue.encounterOptionsDialogue?.description).toBe(`${namespace}:description`);
    expect(TrashToTreasureEncounter.dialogue.encounterOptionsDialogue?.query).toBe(`${namespace}:query`);
    expect(TrashToTreasureEncounter.options.length).toBe(2);
  });

  it("should initialize fully", async () => {
    vi.spyOn(Utils, "randSeedInt").mockImplementation((range, min = 0) => min + range - 1);
    initSceneWithoutEncounterPhase(scene, defaultParty);
    scene.currentBattle.mysteryEncounter = TrashToTreasureEncounter;
    const moveInitSpy = vi.spyOn(BattleAnims, "initMoveAnim");
    const moveLoadSpy = vi.spyOn(BattleAnims, "loadMoveAnimAssets");

    const { onInit } = TrashToTreasureEncounter;

    expect(TrashToTreasureEncounter.onInit).toBeDefined();

    TrashToTreasureEncounter.populateDialogueTokensFromRequirements();
    const onInitResult = onInit!();

    const bossSpecies = getPokemonSpecies(SpeciesId.GARBODOR);
    const pokemonConfig: EnemyPokemonConfig = {
      species: bossSpecies,
      isBoss: true,
      shiny: false, // Shiny lock because of custom intro sprite
      formIndex: 1, // Gmax
      bossSegmentModifier: 1, // +1 Segment from normal
      moveSet: [MoveId.GUNK_SHOT, MoveId.STOMPING_TANTRUM, MoveId.HAMMER_ARM, MoveId.PAYBACK],
      heldItemConfig: [
        { entry: HeldItemCategoryId.BERRY, count: 4 },
        { entry: HeldItemCategoryId.BASE_STAT_BOOST, count: 2 },
        { entry: HeldItemId.TOXIC_ORB, count: randSeedInt(2, 0) },
        { entry: HeldItemId.SOOTHE_BELL, count: randSeedInt(2, 1) },
        { entry: HeldItemId.LUCKY_EGG, count: randSeedInt(3, 1) },
        { entry: HeldItemId.GOLDEN_EGG, count: randSeedInt(2, 0) },
      ],
    };
    const config: EnemyPartyConfig = {
      levelAdditiveModifier: 0.5,
      pokemonConfigs: [pokemonConfig],
      disableSwitch: true,
    };
    const enemyPartyConfigs = [config];

    expect(JSON.stringify(TrashToTreasureEncounter.enemyPartyConfigs, undefined, 2)).toEqual(
      JSON.stringify(enemyPartyConfigs, undefined, 2),
    );
    await vi.waitFor(() => expect(moveInitSpy).toHaveBeenCalled());
    await vi.waitFor(() => expect(moveLoadSpy).toHaveBeenCalled());
    expect(onInitResult).toBe(true);
  });

  describe("Option 1 - Dig for Valuables", () => {
    it("should have the correct properties", () => {
      const option1 = TrashToTreasureEncounter.options[0];
      expect(option1.optionMode).toBe(MysteryEncounterOptionMode.DEFAULT);
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

    it("should give 1 Leftovers, 1 Shell Bell, and Black Sludge", async () => {
      await game.runToMysteryEncounter(MysteryEncounterType.TRASH_TO_TREASURE, defaultParty);
      await runMysteryEncounterToEnd(game, 1);
      expect(game).toBeAtPhase("SelectRewardPhase");
      await game.phaseInterceptor.to("SelectRewardPhase");

      expect(scene.getPlayerParty()[0].heldItemManager.getStack(HeldItemId.LEFTOVERS)).toBe(1);

      expect(scene.getPlayerParty()[0].heldItemManager.getStack(HeldItemId.SHELL_BELL)).toBe(1);

      expect(scene.trainerItems.getStack(TrainerItemId.BLACK_SLUDGE)).toBe(1);
    });

    it("should leave encounter without battle", async () => {
      const leaveEncounterWithoutBattleSpy = vi.spyOn(EncounterPhaseUtils, "leaveEncounterWithoutBattle");

      await game.runToMysteryEncounter(MysteryEncounterType.TRASH_TO_TREASURE, defaultParty);
      await runMysteryEncounterToEnd(game, 1);

      expect(leaveEncounterWithoutBattleSpy).toBeCalled();
    });
  });

  describe("Option 2 - Battle Garbodor", () => {
    it("should have the correct properties", () => {
      const option1 = TrashToTreasureEncounter.options[1];
      expect(option1.optionMode).toBe(MysteryEncounterOptionMode.DEFAULT);
      expect(option1.dialogue).toBeDefined();
      expect(option1.dialogue).toStrictEqual({
        buttonLabel: `${namespace}:option.2.label`,
        buttonTooltip: `${namespace}:option.2.tooltip`,
        selected: [
          {
            text: `${namespace}:option.2.selected`,
          },
        ],
      });
    });

    it("should start battle against Garbodor", async () => {
      const phaseSpy = vi.spyOn(scene.phaseManager, "pushPhase");

      await game.runToMysteryEncounter(MysteryEncounterType.TRASH_TO_TREASURE, defaultParty);
      await runMysteryEncounterToEnd(game, 2, undefined, true);

      const enemyField = scene.getEnemyField();
      expect(game).toBeAtPhase("CommandPhase");
      expect(enemyField.length).toBe(1);
      expect(enemyField[0].species.speciesId).toBe(SpeciesId.GARBODOR);
      expect(enemyField[0].moveset).toEqual([
        new PokemonMove(MoveId.GUNK_SHOT),
        new PokemonMove(MoveId.STOMPING_TANTRUM),
        new PokemonMove(MoveId.HAMMER_ARM),
        new PokemonMove(MoveId.PAYBACK),
      ]);

      // Should have used moves pre-battle
      const movePhases = phaseSpy.mock.calls.filter(p => p[0] instanceof MovePhase).map(p => p[0]);
      expect(movePhases.length).toBe(2);
      expect(movePhases.filter(p => (p as MovePhase).move.moveId === MoveId.TOXIC).length).toBe(1);
      expect(movePhases.filter(p => (p as MovePhase).move.moveId === MoveId.STOCKPILE).length).toBe(1);
    });

    it("should have 2 Rogue, 1 Ultra, 1 Great in allRewards", async () => {
      await game.runToMysteryEncounter(MysteryEncounterType.TRASH_TO_TREASURE, defaultParty);
      await runMysteryEncounterToEnd(game, 2, undefined, true);
      await skipBattleRunMysteryEncounterRewardsPhase(game);
      await game.phaseInterceptor.to("SelectRewardPhase", false);
      expect(game).toBeAtPhase("SelectRewardPhase");
      await game.phaseInterceptor.to("SelectRewardPhase");

      expect(scene.ui.getMode()).to.equal(UiMode.REWARD_SELECT);
      const rewardSelectHandler = scene.ui.handlers.find(
        h => h instanceof RewardSelectUiHandler,
      ) as RewardSelectUiHandler;
      expect(rewardSelectHandler.options.length).toEqual(4);
      expect(
        rewardSelectHandler.options[0].rewardOption.type.tier -
          rewardSelectHandler.options[0].rewardOption.upgradeCount,
      ).toEqual(RarityTier.ROGUE);
      expect(
        rewardSelectHandler.options[1].rewardOption.type.tier -
          rewardSelectHandler.options[1].rewardOption.upgradeCount,
      ).toEqual(RarityTier.ROGUE);
      expect(
        rewardSelectHandler.options[2].rewardOption.type.tier -
          rewardSelectHandler.options[2].rewardOption.upgradeCount,
      ).toEqual(RarityTier.ULTRA);
      expect(
        rewardSelectHandler.options[3].rewardOption.type.tier -
          rewardSelectHandler.options[3].rewardOption.upgradeCount,
      ).toEqual(RarityTier.GREAT);
    });
  });
});
