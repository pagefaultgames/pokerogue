import * as MysteryEncounters from "#app/data/mystery-encounters/mystery-encounters";
import { HUMAN_TRANSITABLE_BIOMES } from "#app/data/mystery-encounters/mystery-encounters";
import { Biome } from "#app/enums/biome";
import { MysteryEncounterType } from "#app/enums/mystery-encounter-type";
import { Species } from "#app/enums/species";
import GameManager from "#app/test/utils/gameManager";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { runMysteryEncounterToEnd, skipBattleRunMysteryEncounterRewardsPhase } from "#test/mystery-encounter/encounter-test-utils";
import BattleScene from "#app/battle-scene";
import { MysteryEncounterOptionMode } from "#enums/mystery-encounter-option-mode";
import { MysteryEncounterTier } from "#enums/mystery-encounter-tier";
import { initSceneWithoutEncounterPhase } from "#test/utils/gameManagerUtils";
import { MysteryEncounterMode } from "#enums/mystery-encounter-mode";
import MysteryEncounter from "#app/data/mystery-encounters/mystery-encounter";
import { CommandPhase } from "#app/phases/command-phase";
import { SelectModifierPhase } from "#app/phases/select-modifier-phase";
import { TheExpertPokemonBreederEncounter } from "#app/data/mystery-encounters/encounters/the-expert-pokemon-breeder-encounter";
import { TrainerType } from "#enums/trainer-type";
import { EggTier } from "#enums/egg-type";
import { PostMysteryEncounterPhase } from "#app/phases/mystery-encounter-phases";

const namespace = "mysteryEncounters/theExpertPokemonBreeder";
const defaultParty = [ Species.LAPRAS, Species.GENGAR, Species.ABRA ];
const defaultBiome = Biome.CAVE;
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
    game.override.mysteryEncounterChance(100);
    game.override.startingWave(defaultWave);
    game.override.startingBiome(defaultBiome);
    game.override.disableTrainerWaves();

    const biomeMap = new Map<Biome, MysteryEncounterType[]>([
      [ Biome.VOLCANO, [ MysteryEncounterType.FIGHT_OR_FLIGHT ]],
    ]);
    HUMAN_TRANSITABLE_BIOMES.forEach(biome => {
      biomeMap.set(biome, [ MysteryEncounterType.THE_EXPERT_POKEMON_BREEDER ]);
    });
    vi.spyOn(MysteryEncounters, "mysteryEncountersByBiome", "get").mockReturnValue(biomeMap);
  });

  afterEach(() => {
    game.phaseInterceptor.restoreOg();
    vi.clearAllMocks();
    vi.resetAllMocks();
  });

  it("should have the correct properties", async () => {
    await game.runToMysteryEncounter(MysteryEncounterType.THE_EXPERT_POKEMON_BREEDER, defaultParty);

    expect(TheExpertPokemonBreederEncounter.encounterType).toBe(MysteryEncounterType.THE_EXPERT_POKEMON_BREEDER);
    expect(TheExpertPokemonBreederEncounter.encounterTier).toBe(MysteryEncounterTier.ULTRA);
    expect(TheExpertPokemonBreederEncounter.dialogue).toBeDefined();
    expect(TheExpertPokemonBreederEncounter.dialogue.intro).toStrictEqual([
      {
        text: `${namespace}:intro`
      },
      {
        speaker: "trainerNames:expert_pokemon_breeder",
        text: `${namespace}:intro_dialogue`
      },
    ]);
    expect(TheExpertPokemonBreederEncounter.dialogue.encounterOptionsDialogue?.title).toBe(`${namespace}:title`);
    expect(TheExpertPokemonBreederEncounter.dialogue.encounterOptionsDialogue?.description).toBe(`${namespace}:description`);
    expect(TheExpertPokemonBreederEncounter.dialogue.encounterOptionsDialogue?.query).toBe(`${namespace}:query`);
    expect(TheExpertPokemonBreederEncounter.options.length).toBe(3);
  });

  it("should not spawn outside of HUMAN_TRANSITABLE_BIOMES", async () => {
    game.override.mysteryEncounterTier(MysteryEncounterTier.GREAT);
    game.override.startingBiome(Biome.VOLCANO);
    await game.runToMysteryEncounter();

    expect(scene.currentBattle?.mysteryEncounter?.encounterType).not.toBe(MysteryEncounterType.THE_EXPERT_POKEMON_BREEDER);
  });

  it("should initialize fully", async () => {
    initSceneWithoutEncounterPhase(scene, defaultParty);
    scene.currentBattle.mysteryEncounter = new MysteryEncounter(TheExpertPokemonBreederEncounter);
    const encounter = scene.currentBattle.mysteryEncounter!;
    scene.currentBattle.waveIndex = defaultWave;

    const { onInit } = encounter;

    expect(encounter.onInit).toBeDefined();

    encounter.populateDialogueTokensFromRequirements(scene);
    const onInitResult = onInit!(scene);

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
            speaker: "trainerNames:expert_pokemon_breeder",
            text: `${namespace}:option.selected`,
          },
        ],
      });
    });

    it("should start battle against the trainer", async () => {
      await game.runToMysteryEncounter(MysteryEncounterType.THE_EXPERT_POKEMON_BREEDER, defaultParty);
      await runMysteryEncounterToEnd(game, 1, undefined, true);

      expect(scene.getCurrentPhase()?.constructor.name).toBe(CommandPhase.name);
      expect(scene.currentBattle.trainer).toBeDefined();
      expect(scene.currentBattle.mysteryEncounter?.encounterMode).toBe(MysteryEncounterMode.TRAINER_BATTLE);
      expect(scene.getParty().length).toBe(1);
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
      await game.phaseInterceptor.to(SelectModifierPhase, false);
      expect(scene.getCurrentPhase()?.constructor.name).toBe(SelectModifierPhase.name);

      const eggsAfter = scene.gameData.eggs;
      const commonEggs = scene.currentBattle.mysteryEncounter!.misc.pokemon1CommonEggs;
      const rareEggs = scene.currentBattle.mysteryEncounter!.misc.pokemon1RareEggs;
      expect(eggsAfter).toBeDefined();
      expect(eggsBeforeLength + commonEggs + rareEggs).toBe(eggsAfter.length);
      expect(eggsAfter.filter(egg => egg.tier === EggTier.COMMON).length).toBe(commonEggs);
      expect(eggsAfter.filter(egg => egg.tier === EggTier.RARE).length).toBe(rareEggs);

      game.phaseInterceptor.superEndPhase();
      await game.phaseInterceptor.to(PostMysteryEncounterPhase);

      const friendshipAfter = scene.currentBattle.mysteryEncounter!.misc.pokemon1.friendship;
      expect(friendshipAfter).toBe(friendshipBefore + 20 + 2); // +2 extra for friendship gained from winning battle
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
            speaker: "trainerNames:expert_pokemon_breeder",
            text: `${namespace}:option.selected`,
          },
        ],
      });
    });

    it("should start battle against the trainer", async () => {
      await game.runToMysteryEncounter(MysteryEncounterType.THE_EXPERT_POKEMON_BREEDER, defaultParty);
      await runMysteryEncounterToEnd(game, 2, undefined, true);

      expect(scene.getCurrentPhase()?.constructor.name).toBe(CommandPhase.name);
      expect(scene.currentBattle.trainer).toBeDefined();
      expect(scene.currentBattle.mysteryEncounter?.encounterMode).toBe(MysteryEncounterMode.TRAINER_BATTLE);
      expect(scene.getParty().length).toBe(1);
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
      await game.phaseInterceptor.to(SelectModifierPhase, false);
      expect(scene.getCurrentPhase()?.constructor.name).toBe(SelectModifierPhase.name);

      const eggsAfter = scene.gameData.eggs;
      const commonEggs = scene.currentBattle.mysteryEncounter!.misc.pokemon2CommonEggs;
      const rareEggs = scene.currentBattle.mysteryEncounter!.misc.pokemon2RareEggs;
      expect(eggsAfter).toBeDefined();
      expect(eggsBeforeLength + commonEggs + rareEggs).toBe(eggsAfter.length);
      expect(eggsAfter.filter(egg => egg.tier === EggTier.COMMON).length).toBe(commonEggs);
      expect(eggsAfter.filter(egg => egg.tier === EggTier.RARE).length).toBe(rareEggs);

      game.phaseInterceptor.superEndPhase();
      await game.phaseInterceptor.to(PostMysteryEncounterPhase);

      const friendshipAfter = scene.currentBattle.mysteryEncounter!.misc.pokemon2.friendship;
      expect(friendshipAfter).toBe(friendshipBefore + 20 + 2); // +2 extra for friendship gained from winning battle
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
            speaker: "trainerNames:expert_pokemon_breeder",
            text: `${namespace}:option.selected`,
          },
        ],
      });
    });

    it("should start battle against the trainer", async () => {
      await game.runToMysteryEncounter(MysteryEncounterType.THE_EXPERT_POKEMON_BREEDER, defaultParty);
      await runMysteryEncounterToEnd(game, 3, undefined, true);

      expect(scene.getCurrentPhase()?.constructor.name).toBe(CommandPhase.name);
      expect(scene.currentBattle.trainer).toBeDefined();
      expect(scene.currentBattle.mysteryEncounter?.encounterMode).toBe(MysteryEncounterMode.TRAINER_BATTLE);
      expect(scene.getParty().length).toBe(1);
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
      await game.phaseInterceptor.to(SelectModifierPhase, false);
      expect(scene.getCurrentPhase()?.constructor.name).toBe(SelectModifierPhase.name);

      const eggsAfter = scene.gameData.eggs;
      const commonEggs = scene.currentBattle.mysteryEncounter!.misc.pokemon3CommonEggs;
      const rareEggs = scene.currentBattle.mysteryEncounter!.misc.pokemon3RareEggs;
      expect(eggsAfter).toBeDefined();
      expect(eggsBeforeLength + commonEggs + rareEggs).toBe(eggsAfter.length);
      expect(eggsAfter.filter(egg => egg.tier === EggTier.COMMON).length).toBe(commonEggs);
      expect(eggsAfter.filter(egg => egg.tier === EggTier.RARE).length).toBe(rareEggs);

      game.phaseInterceptor.superEndPhase();
      await game.phaseInterceptor.to(PostMysteryEncounterPhase);

      const friendshipAfter = scene.currentBattle.mysteryEncounter!.misc.pokemon3.friendship;
      expect(friendshipAfter).toBe(friendshipBefore + 20 + 2); // +2 extra for friendship gained from winning battle
    });
  });
});
