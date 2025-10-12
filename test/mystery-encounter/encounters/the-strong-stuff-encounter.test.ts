import type { BattleScene } from "#app/battle-scene";
import * as BattleAnims from "#data/battle-anims";
import { CustomPokemonData } from "#data/pokemon-data";
import { AbilityId } from "#enums/ability-id";
import { BattlerTagType } from "#enums/battler-tag-type";
import { BiomeId } from "#enums/biome-id";
import { HeldItemEffect } from "#enums/held-item-effect";
import { HeldItemId } from "#enums/held-item-id";
import { MoveId } from "#enums/move-id";
import { MysteryEncounterOptionMode } from "#enums/mystery-encounter-option-mode";
import { MysteryEncounterTier } from "#enums/mystery-encounter-tier";
import { MysteryEncounterType } from "#enums/mystery-encounter-type";
import { Nature } from "#enums/nature";
import { SpeciesId } from "#enums/species-id";
import { UiMode } from "#enums/ui-mode";
import { PokemonMove } from "#moves/pokemon-move";
import * as EncounterPhaseUtils from "#mystery-encounters/encounter-phase-utils";
import * as MysteryEncounters from "#mystery-encounters/mystery-encounters";
import { TheStrongStuffEncounter } from "#mystery-encounters/the-strong-stuff-encounter";
import { MovePhase } from "#phases/move-phase";
import {
  runMysteryEncounterToEnd,
  skipBattleRunMysteryEncounterRewardsPhase,
} from "#test/mystery-encounter/encounter-test-utils";
import { GameManager } from "#test/test-utils/game-manager";
import { initSceneWithoutEncounterPhase } from "#test/test-utils/game-manager-utils";
import { RewardSelectUiHandler } from "#ui/reward-select-ui-handler";
import { applyHeldItems } from "#utils/items";
import { getPokemonSpecies } from "#utils/pokemon-utils";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

const namespace = "mysteryEncounters/theStrongStuff";
const defaultParty = [SpeciesId.LAPRAS, SpeciesId.GENGAR, SpeciesId.ABRA];
const defaultBiome = BiomeId.CAVE;
const defaultWave = 45;

describe("The Strong Stuff - Mystery Encounter", () => {
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
      .enemyAbility(AbilityId.BALL_FETCH)
      .enemyPassiveAbility(AbilityId.BALL_FETCH);

    vi.spyOn(MysteryEncounters, "mysteryEncountersByBiome", "get").mockReturnValue(
      new Map<BiomeId, MysteryEncounterType[]>([
        [BiomeId.CAVE, [MysteryEncounterType.THE_STRONG_STUFF]],
        [BiomeId.MOUNTAIN, [MysteryEncounterType.MYSTERIOUS_CHALLENGERS]],
      ]),
    );
  });

  afterEach(() => {
    game.phaseInterceptor.restoreOg();
  });

  it("should have the correct properties", async () => {
    await game.runToMysteryEncounter(MysteryEncounterType.THE_STRONG_STUFF, defaultParty);

    expect(TheStrongStuffEncounter.encounterType).toBe(MysteryEncounterType.THE_STRONG_STUFF);
    expect(TheStrongStuffEncounter.encounterTier).toBe(MysteryEncounterTier.COMMON);
    expect(TheStrongStuffEncounter.dialogue).toBeDefined();
    expect(TheStrongStuffEncounter.dialogue.intro).toStrictEqual([{ text: `${namespace}:intro` }]);
    expect(TheStrongStuffEncounter.dialogue.encounterOptionsDialogue?.title).toBe(`${namespace}:title`);
    expect(TheStrongStuffEncounter.dialogue.encounterOptionsDialogue?.description).toBe(`${namespace}:description`);
    expect(TheStrongStuffEncounter.dialogue.encounterOptionsDialogue?.query).toBe(`${namespace}:query`);
    expect(TheStrongStuffEncounter.options.length).toBe(2);
  });

  it("should not spawn outside of CAVE biome", async () => {
    game.override.mysteryEncounterTier(MysteryEncounterTier.COMMON).startingBiome(BiomeId.MOUNTAIN);
    await game.runToMysteryEncounter();

    expect(scene.currentBattle?.mysteryEncounter?.encounterType).not.toBe(MysteryEncounterType.THE_STRONG_STUFF);
  });

  it("should initialize fully ", async () => {
    initSceneWithoutEncounterPhase(scene, defaultParty);
    scene.currentBattle.mysteryEncounter = TheStrongStuffEncounter;
    const moveInitSpy = vi.spyOn(BattleAnims, "initMoveAnim");
    const moveLoadSpy = vi.spyOn(BattleAnims, "loadMoveAnimAssets");

    const { onInit } = TheStrongStuffEncounter;

    expect(TheStrongStuffEncounter.onInit).toBeDefined();

    TheStrongStuffEncounter.populateDialogueTokensFromRequirements();
    const onInitResult = onInit!();

    expect(TheStrongStuffEncounter.enemyPartyConfigs).toEqual([
      {
        levelAdditiveModifier: 1,
        disableSwitch: true,
        pokemonConfigs: [
          {
            species: getPokemonSpecies(SpeciesId.SHUCKLE),
            isBoss: true,
            bossSegments: 5,
            shiny: false,
            customPokemonData: new CustomPokemonData({ spriteScale: 1.25 }),
            nature: Nature.HARDY,
            moveSet: [MoveId.INFESTATION, MoveId.SALT_CURE, MoveId.GASTRO_ACID, MoveId.HEAL_ORDER],
            heldItemConfig: expect.any(Array),
            tags: [BattlerTagType.MYSTERY_ENCOUNTER_POST_SUMMON],
            mysteryEncounterBattleEffects: expect.any(Function),
          },
        ],
      },
    ]);
    await vi.waitFor(() => expect(moveInitSpy).toHaveBeenCalled());
    await vi.waitFor(() => expect(moveLoadSpy).toHaveBeenCalled());
    expect(onInitResult).toBe(true);
  });

  describe("Option 1 - Power Swap BSTs", () => {
    it("should have the correct properties", () => {
      const option1 = TheStrongStuffEncounter.options[0];
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

    it("should lower stats of 2 highest BST and raise stats for rest of party", async () => {
      await game.runToMysteryEncounter(MysteryEncounterType.THE_STRONG_STUFF, defaultParty);

      const bstsPrior = scene.getPlayerParty().map(p => p.getSpeciesForm().getBaseStatTotal());
      await runMysteryEncounterToEnd(game, 1);

      const bstsAfter = scene.getPlayerParty().map(p => {
        const baseStats = p.getSpeciesForm().baseStats.slice(0);
        applyHeldItems(HeldItemEffect.BASE_STAT_ADD, { pokemon: p, baseStats });
        return baseStats.reduce((a, b) => a + b);
      });

      // HP stat changes are halved compared to other values
      expect(bstsAfter[0]).toEqual(bstsPrior[0] - 15 * 5 - 8);
      expect(bstsAfter[1]).toEqual(bstsPrior[1] - 15 * 5 - 8);
      expect(bstsAfter[2]).toEqual(bstsPrior[2] + 10 * 5 + 5);
    });

    it("should leave encounter without battle", async () => {
      const leaveEncounterWithoutBattleSpy = vi.spyOn(EncounterPhaseUtils, "leaveEncounterWithoutBattle");

      await game.runToMysteryEncounter(MysteryEncounterType.THE_STRONG_STUFF, defaultParty);
      await runMysteryEncounterToEnd(game, 1);

      expect(leaveEncounterWithoutBattleSpy).toBeCalled();
    });
  });

  describe("Option 2 - battle the Shuckle", () => {
    it("should have the correct properties", () => {
      const option1 = TheStrongStuffEncounter.options[1];
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

    it("should start battle against Shuckle", async () => {
      const phaseSpy = vi.spyOn(scene.phaseManager, "pushPhase");

      await game.runToMysteryEncounter(MysteryEncounterType.THE_STRONG_STUFF, defaultParty);
      await runMysteryEncounterToEnd(game, 2, undefined, true);

      const enemyField = scene.getEnemyField();
      expect(game).toBeAtPhase("CommandPhase");
      expect(enemyField.length).toBe(1);
      expect(enemyField[0].species.speciesId).toBe(SpeciesId.SHUCKLE);
      expect(enemyField[0].summonData.statStages).toEqual([0, 1, 0, 1, 0, 0, 0]);
      const shuckleItems = enemyField[0].getHeldItems();
      expect(shuckleItems.length).toBe(5);
      expect(enemyField[0].heldItemManager.getStack(HeldItemId.SITRUS_BERRY)).toBe(1);
      expect(enemyField[0].heldItemManager.getStack(HeldItemId.ENIGMA_BERRY)).toBe(1);
      expect(enemyField[0].heldItemManager.getStack(HeldItemId.GANLON_BERRY)).toBe(1);
      expect(enemyField[0].heldItemManager.getStack(HeldItemId.APICOT_BERRY)).toBe(1);
      expect(enemyField[0].heldItemManager.getStack(HeldItemId.LUM_BERRY)).toBe(2);
      expect(enemyField[0].moveset).toEqual([
        new PokemonMove(MoveId.INFESTATION),
        new PokemonMove(MoveId.SALT_CURE),
        new PokemonMove(MoveId.GASTRO_ACID),
        new PokemonMove(MoveId.HEAL_ORDER),
      ]);

      // Should have used moves pre-battle
      const movePhases = phaseSpy.mock.calls.filter(p => p[0] instanceof MovePhase).map(p => p[0]);
      expect(movePhases.length).toBe(2);
      expect(movePhases.filter(p => (p as MovePhase).move.moveId === MoveId.GASTRO_ACID).length).toBe(1);
      expect(movePhases.filter(p => (p as MovePhase).move.moveId === MoveId.STEALTH_ROCK).length).toBe(1);
    });

    it("should have Soul Dew in allRewards", async () => {
      await game.runToMysteryEncounter(MysteryEncounterType.THE_STRONG_STUFF, defaultParty);
      await runMysteryEncounterToEnd(game, 2, undefined, true);
      await skipBattleRunMysteryEncounterRewardsPhase(game);
      await game.phaseInterceptor.to("SelectRewardPhase", false);
      expect(game).toBeAtPhase("SelectRewardPhase");
      await game.phaseInterceptor.to("SelectRewardPhase");

      expect(scene.ui.getMode()).to.equal(UiMode.REWARD_SELECT);
      const rewardSelectHandler = scene.ui.handlers.find(
        h => h instanceof RewardSelectUiHandler,
      ) as RewardSelectUiHandler;
      expect(rewardSelectHandler.options.length).toEqual(3);
      expect(rewardSelectHandler.options[0].rewardOption.type.id).toEqual("SOUL_DEW");
    });
  });
});
