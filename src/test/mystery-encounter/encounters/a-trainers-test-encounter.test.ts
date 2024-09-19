import * as MysteryEncounters from "#app/data/mystery-encounters/mystery-encounters";
import { HUMAN_TRANSITABLE_BIOMES } from "#app/data/mystery-encounters/mystery-encounters";
import { Biome } from "#app/enums/biome";
import { MysteryEncounterType } from "#app/enums/mystery-encounter-type";
import { Species } from "#app/enums/species";
import GameManager from "#app/test/utils/gameManager";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import * as EncounterPhaseUtils from "#app/data/mystery-encounters/utils/encounter-phase-utils";
import { runMysteryEncounterToEnd, skipBattleRunMysteryEncounterRewardsPhase } from "#test/mystery-encounter/encounter-test-utils";
import BattleScene from "#app/battle-scene";
import { MysteryEncounterOptionMode } from "#enums/mystery-encounter-option-mode";
import { MysteryEncounterTier } from "#enums/mystery-encounter-tier";
import { initSceneWithoutEncounterPhase } from "#test/utils/gameManagerUtils";
import { ATrainersTestEncounter } from "#app/data/mystery-encounters/encounters/a-trainers-test-encounter";
import { EggTier } from "#enums/egg-type";
import { CommandPhase } from "#app/phases/command-phase";
import { SelectModifierPhase } from "#app/phases/select-modifier-phase";
import { PartyHealPhase } from "#app/phases/party-heal-phase";

const namespace = "mysteryEncounter:aTrainersTest";
const defaultParty = [Species.LAPRAS, Species.GENGAR, Species.ABRA];
const defaultBiome = Biome.CAVE;
const defaultWave = 45;

describe("A Trainer's Test - Mystery Encounter", () => {
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
      [Biome.VOLCANO, [MysteryEncounterType.MYSTERIOUS_CHALLENGERS]],
    ]);
    HUMAN_TRANSITABLE_BIOMES.forEach(biome => {
      biomeMap.set(biome, [MysteryEncounterType.A_TRAINERS_TEST]);
    });
    vi.spyOn(MysteryEncounters, "mysteryEncountersByBiome", "get").mockReturnValue(biomeMap);
  });

  afterEach(() => {
    game.phaseInterceptor.restoreOg();
    vi.clearAllMocks();
    vi.resetAllMocks();
  });

  it("should have the correct properties", async () => {
    await game.runToMysteryEncounter(MysteryEncounterType.A_TRAINERS_TEST, defaultParty);

    expect(ATrainersTestEncounter.encounterType).toBe(MysteryEncounterType.A_TRAINERS_TEST);
    expect(ATrainersTestEncounter.encounterTier).toBe(MysteryEncounterTier.ROGUE);
    expect(ATrainersTestEncounter.dialogue).toBeDefined();
    expect(ATrainersTestEncounter.dialogue.intro).toBeDefined();
    expect(ATrainersTestEncounter.dialogue.intro?.[0].speaker).toBeDefined();
    expect(ATrainersTestEncounter.dialogue.intro?.[0].text).toBeDefined();
    expect(ATrainersTestEncounter.dialogue.encounterOptionsDialogue?.title).toBe(`${namespace}.title`);
    expect(ATrainersTestEncounter.dialogue.encounterOptionsDialogue?.description).toBe(`${namespace}.description`);
    expect(ATrainersTestEncounter.dialogue.encounterOptionsDialogue?.query).toBe(`${namespace}.query`);
    expect(ATrainersTestEncounter.options.length).toBe(2);
  });

  it("should initialize fully ", async () => {
    initSceneWithoutEncounterPhase(scene, defaultParty);
    scene.currentBattle.mysteryEncounter = ATrainersTestEncounter;

    const { onInit } = ATrainersTestEncounter;

    expect(ATrainersTestEncounter.onInit).toBeDefined();

    ATrainersTestEncounter.populateDialogueTokensFromRequirements(scene);
    const onInitResult = onInit!(scene);

    expect(ATrainersTestEncounter.dialogueTokens?.statTrainerName).toBeDefined();
    expect(ATrainersTestEncounter.misc.trainerType).toBeDefined();
    expect(ATrainersTestEncounter.misc.trainerNameKey).toBeDefined();
    expect(ATrainersTestEncounter.misc.trainerEggDescription).toBeDefined();
    expect(ATrainersTestEncounter.dialogue.intro).toBeDefined();
    expect(ATrainersTestEncounter.options[1].dialogue?.selected).toBeDefined();
    expect(onInitResult).toBe(true);
  });

  describe("Option 1 - Accept the Challenge", () => {
    it("should have the correct properties", () => {
      const option = ATrainersTestEncounter.options[0];
      expect(option.optionMode).toBe(MysteryEncounterOptionMode.DEFAULT);
      expect(option.dialogue).toBeDefined();
      expect(option.dialogue!.buttonLabel).toStrictEqual(`${namespace}.option.1.label`);
      expect(option.dialogue!.buttonTooltip).toStrictEqual(`${namespace}.option.1.tooltip`);
    });

    it("Should start battle against the trainer", async () => {
      await game.runToMysteryEncounter(MysteryEncounterType.A_TRAINERS_TEST, defaultParty);
      await runMysteryEncounterToEnd(game, 1, undefined, true);

      const enemyField = scene.getEnemyField();
      expect(scene.getCurrentPhase()?.constructor.name).toBe(CommandPhase.name);
      expect(enemyField.length).toBe(1);
      expect(scene.currentBattle.trainer).toBeDefined();
      expect(["buck", "cheryl", "marley", "mira", "riley"].includes(scene.currentBattle.trainer!.config.name.toLowerCase())).toBeTruthy();
      expect(enemyField[0]).toBeDefined();
    });

    it("Should reward the player with an Epic or Legendary egg", async () => {
      await game.runToMysteryEncounter(MysteryEncounterType.A_TRAINERS_TEST, defaultParty);

      const eggsBefore = scene.gameData.eggs;
      expect(eggsBefore).toBeDefined();
      const eggsBeforeLength = eggsBefore.length;

      await runMysteryEncounterToEnd(game, 1, undefined, true);
      await skipBattleRunMysteryEncounterRewardsPhase(game);
      await game.phaseInterceptor.to(SelectModifierPhase, false);
      expect(scene.getCurrentPhase()?.constructor.name).toBe(SelectModifierPhase.name);

      const eggsAfter = scene.gameData.eggs;
      expect(eggsAfter).toBeDefined();
      expect(eggsBeforeLength + 1).toBe(eggsAfter.length);
      const eggTier = eggsAfter[eggsAfter.length - 1].tier;
      expect(eggTier === EggTier.ULTRA || eggTier === EggTier.MASTER).toBeTruthy();
    });
  });

  describe("Option 2 - Decline the Challenge", () => {
    beforeEach(() => {
      // Mock sound object
      vi.spyOn(scene, "playSoundWithoutBgm").mockImplementation(() => {
        return {
          totalDuration: 1,
          destroy: () => null
        } as any;
      });
    });

    it("should have the correct properties", () => {
      const option = ATrainersTestEncounter.options[1];
      expect(option.optionMode).toBe(MysteryEncounterOptionMode.DEFAULT);
      expect(option.dialogue).toBeDefined();
      expect(option.dialogue?.buttonLabel).toStrictEqual(`${namespace}.option.2.label`);
      expect(option.dialogue?.buttonTooltip).toStrictEqual(`${namespace}.option.2.tooltip`);
    });

    it("Should fully heal the party", async () => {
      const phaseSpy = vi.spyOn(scene, "unshiftPhase");

      await game.runToMysteryEncounter(MysteryEncounterType.A_TRAINERS_TEST, defaultParty);
      await runMysteryEncounterToEnd(game, 2);

      const partyHealPhases = phaseSpy.mock.calls.filter(p => p[0] instanceof PartyHealPhase).map(p => p[0]);
      expect(partyHealPhases.length).toBe(1);
    });

    it("Should reward the player with a Rare egg", async () => {
      await game.runToMysteryEncounter(MysteryEncounterType.A_TRAINERS_TEST, defaultParty);

      const eggsBefore = scene.gameData.eggs;
      expect(eggsBefore).toBeDefined();
      const eggsBeforeLength = eggsBefore.length;

      await runMysteryEncounterToEnd(game, 2);
      await game.phaseInterceptor.to(SelectModifierPhase, false);
      expect(scene.getCurrentPhase()?.constructor.name).toBe(SelectModifierPhase.name);

      const eggsAfter = scene.gameData.eggs;
      expect(eggsAfter).toBeDefined();
      expect(eggsBeforeLength + 1).toBe(eggsAfter.length);
      const eggTier = eggsAfter[eggsAfter.length - 1].tier;
      expect(eggTier).toBe(EggTier.GREAT);
    });

    it("should leave encounter without battle", async () => {
      const leaveEncounterWithoutBattleSpy = vi.spyOn(EncounterPhaseUtils, "leaveEncounterWithoutBattle");

      await game.runToMysteryEncounter(MysteryEncounterType.A_TRAINERS_TEST, defaultParty);
      await runMysteryEncounterToEnd(game, 2);

      expect(leaveEncounterWithoutBattleSpy).toBeCalled();
    });
  });
});
