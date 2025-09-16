import type { BattleScene } from "#app/battle-scene";
import { FRIENDSHIP_GAIN_FROM_BATTLE } from "#balance/starters";
import { BiomeId } from "#enums/biome-id";
import { EggTier } from "#enums/egg-type";
import { MysteryEncounterMode } from "#enums/mystery-encounter-mode";
import { MysteryEncounterOptionMode } from "#enums/mystery-encounter-option-mode";
import { MysteryEncounterTier } from "#enums/mystery-encounter-tier";
import { MysteryEncounterType } from "#enums/mystery-encounter-type";
import { SpeciesId } from "#enums/species-id";
import { TrainerType } from "#enums/trainer-type";
import { MysteryEncounter } from "#mystery-encounters/mystery-encounter";
import * as MysteryEncounters from "#mystery-encounters/mystery-encounters";
import { HUMAN_TRANSITABLE_BIOMES } from "#mystery-encounters/mystery-encounters";
import { TheExpertPokemonBreederEncounter } from "#mystery-encounters/the-expert-pokemon-breeder-encounter";
import {
  runMysteryEncounterToEnd,
  skipBattleRunMysteryEncounterRewardsPhase,
} from "#test/mystery-encounter/encounter-test-utils";
import { GameManager } from "#test/test-utils/game-manager";
import { initSceneWithoutEncounterPhase } from "#test/test-utils/game-manager-utils";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

const namespace = "mysteryEncounters/theExpertPokemonBreeder";
const defaultParty = [SpeciesId.LAPRAS, SpeciesId.GENGAR, SpeciesId.ABRA];
const defaultBiome = BiomeId.CAVE;
const defaultWave = 45;

describe("The Expert Pokémon Breeder - Mystery Encounter", () => {
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
      [BiomeId.VOLCANO, [MysteryEncounterType.FIGHT_OR_FLIGHT]],
    ]);
    HUMAN_TRANSITABLE_BIOMES.forEach(biome => {
      biomeMap.set(biome, [MysteryEncounterType.THE_EXPERT_POKEMON_BREEDER]);
    });
    vi.spyOn(MysteryEncounters, "mysteryEncountersByBiome", "get").mockReturnValue(biomeMap);
  });

  afterEach(() => {
    game.phaseInterceptor.restoreOg();
  });

  it("should have the correct properties", async () => {
    await game.runToMysteryEncounter(MysteryEncounterType.THE_EXPERT_POKEMON_BREEDER, defaultParty);

    expect(TheExpertPokemonBreederEncounter.encounterType).toBe(MysteryEncounterType.THE_EXPERT_POKEMON_BREEDER);
    expect(TheExpertPokemonBreederEncounter.encounterTier).toBe(MysteryEncounterTier.ULTRA);
    expect(TheExpertPokemonBreederEncounter.dialogue).toBeDefined();
    expect(TheExpertPokemonBreederEncounter.dialogue.intro).toStrictEqual([
      {
        text: `${namespace}:intro`,
      },
      {
        speaker: "trainerNames:expertPokemonBreeder",
        text: `${namespace}:introDialogue`,
      },
    ]);
    expect(TheExpertPokemonBreederEncounter.dialogue.encounterOptionsDialogue?.title).toBe(`${namespace}:title`);
    expect(TheExpertPokemonBreederEncounter.dialogue.encounterOptionsDialogue?.description).toBe(
      `${namespace}:description`,
    );
    expect(TheExpertPokemonBreederEncounter.dialogue.encounterOptionsDialogue?.query).toBe(`${namespace}:query`);
    expect(TheExpertPokemonBreederEncounter.options.length).toBe(3);
  });

  it("should not spawn outside of HUMAN_TRANSITABLE_BIOMES", async () => {
    game.override.mysteryEncounterTier(MysteryEncounterTier.GREAT).startingBiome(BiomeId.VOLCANO);
    await game.runToMysteryEncounter();

    expect(scene.currentBattle?.mysteryEncounter?.encounterType).not.toBe(
      MysteryEncounterType.THE_EXPERT_POKEMON_BREEDER,
    );
  });

  it("should initialize fully", async () => {
    initSceneWithoutEncounterPhase(scene, defaultParty);
    scene.currentBattle.mysteryEncounter = new MysteryEncounter(TheExpertPokemonBreederEncounter);
    const encounter = scene.currentBattle.mysteryEncounter!;
    scene.currentBattle.waveIndex = defaultWave;

    const { onInit } = encounter;

    expect(encounter.onInit).toBeDefined();

    encounter.populateDialogueTokensFromRequirements();
    const onInitResult = onInit!();

    expect(encounter.enemyPartyConfigs).toBeDefined();
    expect(encounter.enemyPartyConfigs.length).toBe(1);
    expect(encounter.enemyPartyConfigs[0].trainerType).toBe(TrainerType.EXPERT_POKEMON_BREEDER);
    expect(encounter.enemyPartyConfigs[0].pokemonConfigs?.length).toBe(3);
    expect(encounter.spriteConfigs).toBeDefined();
    expect(encounter.spriteConfigs.length).toBe(2);
    expect(onInitResult).toBe(true);
  });

  describe("Option 1 - Battle with Pokemon 1", () => {
    it("should have the correct properties", () => {
      const option = TheExpertPokemonBreederEncounter.options[0];
      expect(option.optionMode).toBe(MysteryEncounterOptionMode.DEFAULT);
      expect(option.dialogue).toBeDefined();
      expect(option.dialogue).toStrictEqual({
        buttonLabel: `${namespace}:option.1.label`,
        buttonTooltip: expect.any(String), // Varies based on pokemon
        selected: [
          {
            speaker: "trainerNames:expertPokemonBreeder",
            text: `${namespace}:option.selected`,
          },
        ],
      });
    });

    it("should start battle against the trainer with correctly loaded assets", async () => {
      await game.runToMysteryEncounter(MysteryEncounterType.THE_EXPERT_POKEMON_BREEDER, defaultParty);

      let successfullyLoaded = false;
      vi.spyOn(scene, "getEnemyParty").mockImplementation(() => {
        const ace = scene.currentBattle?.enemyParty[0];
        if (ace) {
          // Pretend that loading assets takes an extra 500ms
          vi.spyOn(ace, "loadAssets").mockImplementation(
            () =>
              new Promise(resolve => {
                setTimeout(() => {
                  successfullyLoaded = true;
                  resolve();
                }, 500);
              }),
          );
        }

        return scene.currentBattle?.enemyParty ?? [];
      });

      await runMysteryEncounterToEnd(game, 1, undefined, true);

      // Check that assets are successfully loaded
      expect(successfullyLoaded).toBe(true);

      // Check usual battle stuff
      expect(game).toBeAtPhase("CommandPhase");
      expect(scene.currentBattle.trainer).toBeDefined();
      expect(scene.currentBattle.mysteryEncounter?.encounterMode).toBe(MysteryEncounterMode.TRAINER_BATTLE);
      expect(scene.getPlayerParty().length).toBe(1);
    });

    it("Should reward the player with friendship and eggs based on pokemon selected", async () => {
      await game.runToMysteryEncounter(MysteryEncounterType.THE_EXPERT_POKEMON_BREEDER, defaultParty);

      const friendshipBefore = scene.currentBattle.mysteryEncounter!.misc.pokemon1.friendship;

      scene.gameData.eggs = [];
      const eggsBefore = scene.gameData.eggs;
      expect(eggsBefore).toBeDefined();
      const eggsBeforeLength = eggsBefore.length;

      await runMysteryEncounterToEnd(game, 1, undefined, true);
      await skipBattleRunMysteryEncounterRewardsPhase(game);
      expect(game).toBeAtPhase("SelectModifierPhase");
      await game.phaseInterceptor.to("SelectModifierPhase");

      const eggsAfter = scene.gameData.eggs;
      const commonEggs = scene.currentBattle.mysteryEncounter!.misc.pokemon1CommonEggs;
      const rareEggs = scene.currentBattle.mysteryEncounter!.misc.pokemon1RareEggs;
      expect(eggsAfter).toBeDefined();
      expect(eggsBeforeLength + commonEggs + rareEggs).toBe(eggsAfter.length);
      expect(eggsAfter.filter(egg => egg.tier === EggTier.COMMON).length).toBe(commonEggs);
      expect(eggsAfter.filter(egg => egg.tier === EggTier.RARE).length).toBe(rareEggs);

      game.endPhase();
      await game.phaseInterceptor.to("PostMysteryEncounterPhase");

      const friendshipAfter = scene.currentBattle.mysteryEncounter!.misc.pokemon1.friendship;
      // 20 from ME + extra from winning battle (that extra is not accurate to what happens in game.
      // The Pokemon normally gets FRIENDSHIP_GAIN_FROM_BATTLE 3 times, once for each defeated Pokemon
      // but due to how skipBattleRunMysteryEncounterRewardsPhase is implemented, it only receives it once)
      expect(friendshipAfter).toBe(friendshipBefore + 20 + FRIENDSHIP_GAIN_FROM_BATTLE);
    });
  });

  describe("Option 2 - Battle with Pokemon 2", () => {
    it("should have the correct properties", () => {
      const option = TheExpertPokemonBreederEncounter.options[1];
      expect(option.optionMode).toBe(MysteryEncounterOptionMode.DEFAULT);
      expect(option.dialogue).toBeDefined();
      expect(option.dialogue).toStrictEqual({
        buttonLabel: `${namespace}:option.2.label`,
        buttonTooltip: expect.any(String), // Varies based on pokemon
        selected: [
          {
            speaker: "trainerNames:expertPokemonBreeder",
            text: `${namespace}:option.selected`,
          },
        ],
      });
    });

    it("should start battle against the trainer with correctly loaded assets", async () => {
      await game.runToMysteryEncounter(MysteryEncounterType.THE_EXPERT_POKEMON_BREEDER, defaultParty);

      let successfullyLoaded = false;
      vi.spyOn(scene, "getEnemyParty").mockImplementation(() => {
        const ace = scene.currentBattle?.enemyParty[0];
        if (ace) {
          // Pretend that loading assets takes an extra 500ms
          vi.spyOn(ace, "loadAssets").mockImplementation(
            () =>
              new Promise(resolve => {
                setTimeout(() => {
                  successfullyLoaded = true;
                  resolve();
                }, 500);
              }),
          );
        }

        return scene.currentBattle?.enemyParty ?? [];
      });

      await runMysteryEncounterToEnd(game, 2, undefined, true);

      // Check that assets are successfully loaded
      expect(successfullyLoaded).toBe(true);

      // Check usual battle stuff
      expect(game).toBeAtPhase("CommandPhase");
      expect(scene.currentBattle.trainer).toBeDefined();
      expect(scene.currentBattle.mysteryEncounter?.encounterMode).toBe(MysteryEncounterMode.TRAINER_BATTLE);
      expect(scene.getPlayerParty().length).toBe(1);
    });

    it("Should reward the player with friendship and eggs based on pokemon selected", async () => {
      await game.runToMysteryEncounter(MysteryEncounterType.THE_EXPERT_POKEMON_BREEDER, defaultParty);

      const friendshipBefore = scene.currentBattle.mysteryEncounter!.misc.pokemon2.friendship;

      scene.gameData.eggs = [];
      const eggsBefore = scene.gameData.eggs;
      expect(eggsBefore).toBeDefined();
      const eggsBeforeLength = eggsBefore.length;

      await runMysteryEncounterToEnd(game, 2, undefined, true);
      await skipBattleRunMysteryEncounterRewardsPhase(game);
      expect(game).toBeAtPhase("SelectModifierPhase");
      await game.phaseInterceptor.to("SelectModifierPhase");

      const eggsAfter = scene.gameData.eggs;
      const commonEggs = scene.currentBattle.mysteryEncounter!.misc.pokemon2CommonEggs;
      const rareEggs = scene.currentBattle.mysteryEncounter!.misc.pokemon2RareEggs;
      expect(eggsAfter).toBeDefined();
      expect(eggsBeforeLength + commonEggs + rareEggs).toBe(eggsAfter.length);
      expect(eggsAfter.filter(egg => egg.tier === EggTier.COMMON).length).toBe(commonEggs);
      expect(eggsAfter.filter(egg => egg.tier === EggTier.RARE).length).toBe(rareEggs);

      game.endPhase();
      await game.phaseInterceptor.to("PostMysteryEncounterPhase");

      const friendshipAfter = scene.currentBattle.mysteryEncounter!.misc.pokemon2.friendship;
      expect(friendshipAfter).toBe(friendshipBefore + 20 + FRIENDSHIP_GAIN_FROM_BATTLE); // 20 from ME + extra for friendship gained from winning battle
    });
  });

  describe("Option 3 - Battle with Pokemon 3", () => {
    it("should have the correct properties", () => {
      const option = TheExpertPokemonBreederEncounter.options[2];
      expect(option.optionMode).toBe(MysteryEncounterOptionMode.DEFAULT);
      expect(option.dialogue).toBeDefined();
      expect(option.dialogue).toStrictEqual({
        buttonLabel: `${namespace}:option.3.label`,
        buttonTooltip: expect.any(String), // Varies based on pokemon
        selected: [
          {
            speaker: "trainerNames:expertPokemonBreeder",
            text: `${namespace}:option.selected`,
          },
        ],
      });
    });

    it("should start battle against the trainer with correctly loaded assets", async () => {
      await game.runToMysteryEncounter(MysteryEncounterType.THE_EXPERT_POKEMON_BREEDER, defaultParty);

      let successfullyLoaded = false;
      vi.spyOn(scene, "getEnemyParty").mockImplementation(() => {
        const ace = scene.currentBattle?.enemyParty[0];
        if (ace) {
          // Pretend that loading assets takes an extra 500ms
          vi.spyOn(ace, "loadAssets").mockImplementation(
            () =>
              new Promise(resolve => {
                setTimeout(() => {
                  successfullyLoaded = true;
                  resolve();
                }, 500);
              }),
          );
        }

        return scene.currentBattle?.enemyParty ?? [];
      });

      await runMysteryEncounterToEnd(game, 3, undefined, true);

      // Check that assets are successfully loaded
      expect(successfullyLoaded).toBe(true);

      // Check usual battle stuff
      expect(game).toBeAtPhase("CommandPhase");
      expect(scene.currentBattle.trainer).toBeDefined();
      expect(scene.currentBattle.mysteryEncounter?.encounterMode).toBe(MysteryEncounterMode.TRAINER_BATTLE);
      expect(scene.getPlayerParty().length).toBe(1);
    });

    it("Should reward the player with friendship and eggs based on pokemon selected", async () => {
      await game.runToMysteryEncounter(MysteryEncounterType.THE_EXPERT_POKEMON_BREEDER, defaultParty);

      const friendshipBefore = scene.currentBattle.mysteryEncounter!.misc.pokemon3.friendship;

      scene.gameData.eggs = [];
      const eggsBefore = scene.gameData.eggs;
      expect(eggsBefore).toBeDefined();
      const eggsBeforeLength = eggsBefore.length;

      await runMysteryEncounterToEnd(game, 3, undefined, true);
      await skipBattleRunMysteryEncounterRewardsPhase(game);
      expect(game).toBeAtPhase("SelectModifierPhase");
      await game.phaseInterceptor.to("SelectModifierPhase");

      const eggsAfter = scene.gameData.eggs;
      const commonEggs = scene.currentBattle.mysteryEncounter!.misc.pokemon3CommonEggs;
      const rareEggs = scene.currentBattle.mysteryEncounter!.misc.pokemon3RareEggs;
      expect(eggsAfter).toBeDefined();
      expect(eggsBeforeLength + commonEggs + rareEggs).toBe(eggsAfter.length);
      expect(eggsAfter.filter(egg => egg.tier === EggTier.COMMON).length).toBe(commonEggs);
      expect(eggsAfter.filter(egg => egg.tier === EggTier.RARE).length).toBe(rareEggs);

      game.endPhase();
      await game.phaseInterceptor.to("PostMysteryEncounterPhase");

      const friendshipAfter = scene.currentBattle.mysteryEncounter!.misc.pokemon3.friendship;
      expect(friendshipAfter).toBe(friendshipBefore + 20 + FRIENDSHIP_GAIN_FROM_BATTLE); // 20 + extra for friendship gained from winning battle
    });
  });
});
