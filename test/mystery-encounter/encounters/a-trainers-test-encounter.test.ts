import type { BattleScene } from "#app/battle-scene";
import { BiomeId } from "#enums/biome-id";
import { EggTier } from "#enums/egg-type";
import { MysteryEncounterOptionMode } from "#enums/mystery-encounter-option-mode";
import { MysteryEncounterTier } from "#enums/mystery-encounter-tier";
import { MysteryEncounterType } from "#enums/mystery-encounter-type";
import { SpeciesId } from "#enums/species-id";
import { ATrainersTestEncounter } from "#mystery-encounters/a-trainers-test-encounter";
import * as EncounterPhaseUtils from "#mystery-encounters/encounter-phase-utils";
import * as MysteryEncounters from "#mystery-encounters/mystery-encounters";
import { HUMAN_TRANSITABLE_BIOMES } from "#mystery-encounters/mystery-encounters";
import { PartyHealPhase } from "#phases/party-heal-phase";
import { SelectModifierPhase } from "#phases/select-modifier-phase";
import {
  runMysteryEncounterToEnd,
  skipBattleRunMysteryEncounterRewardsPhase,
} from "#test/mystery-encounter/encounter-test-utils";
import { GameManager } from "#test/test-utils/game-manager";
import { initSceneWithoutEncounterPhase } from "#test/test-utils/game-manager-utils";
import i18next from "i18next";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

const namespace = "mysteryEncounters/aTrainersTest";
const defaultParty = [SpeciesId.LAPRAS, SpeciesId.GENGAR, SpeciesId.ABRA];
const defaultBiome = BiomeId.CAVE;
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
    game.override
      .mysteryEncounterChance(100)
      .startingWave(defaultWave)
      .startingBiome(defaultBiome)
      .disableTrainerWaves();

    const biomeMap = new Map<BiomeId, MysteryEncounterType[]>([
      [BiomeId.VOLCANO, [MysteryEncounterType.MYSTERIOUS_CHALLENGERS]],
    ]);
    HUMAN_TRANSITABLE_BIOMES.forEach(biome => {
      biomeMap.set(biome, [MysteryEncounterType.A_TRAINERS_TEST]);
    });
    vi.spyOn(MysteryEncounters, "mysteryEncountersByBiome", "get").mockReturnValue(biomeMap);
  });

  afterEach(() => {
    game.phaseInterceptor.restoreOg();
  });

  it("should have the correct properties", async () => {
    await game.runToMysteryEncounter(MysteryEncounterType.A_TRAINERS_TEST, defaultParty);

    expect(ATrainersTestEncounter.encounterType).toBe(MysteryEncounterType.A_TRAINERS_TEST);
    expect(ATrainersTestEncounter.encounterTier).toBe(MysteryEncounterTier.ROGUE);
    expect(ATrainersTestEncounter.dialogue).toBeDefined();
    expect(ATrainersTestEncounter.dialogue.intro).toBeDefined();
    expect(ATrainersTestEncounter.dialogue.intro?.[0].speaker).toBeDefined();
    expect(ATrainersTestEncounter.dialogue.intro?.[0].text).toBeDefined();
    expect(ATrainersTestEncounter.dialogue.encounterOptionsDialogue?.title).toBe(`${namespace}:title`);
    expect(ATrainersTestEncounter.dialogue.encounterOptionsDialogue?.description).toBe(`${namespace}:description`);
    expect(ATrainersTestEncounter.dialogue.encounterOptionsDialogue?.query).toBe(`${namespace}:query`);
    expect(ATrainersTestEncounter.options.length).toBe(2);
  });

  it("should initialize fully ", async () => {
    initSceneWithoutEncounterPhase(scene, defaultParty);
    scene.currentBattle.mysteryEncounter = ATrainersTestEncounter;

    const { onInit } = ATrainersTestEncounter;

    expect(ATrainersTestEncounter.onInit).toBeDefined();

    ATrainersTestEncounter.populateDialogueTokensFromRequirements();
    const onInitResult = onInit!();

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
      expect(option.dialogue!.buttonLabel).toStrictEqual(`${namespace}:option.1.label`);
      expect(option.dialogue!.buttonTooltip).toStrictEqual(`${namespace}:option.1.tooltip`);
    });

    it("Should start battle against the trainer", async () => {
      await game.runToMysteryEncounter(MysteryEncounterType.A_TRAINERS_TEST, defaultParty);
      await runMysteryEncounterToEnd(game, 1, undefined, true);

      const enemyField = scene.getEnemyField();
      expect(game).toBeAtPhase("CommandPhase");
      expect(enemyField.length).toBe(1);
      expect(scene.currentBattle.trainer).toBeDefined();
      expect(
        [
          i18next.t("trainerNames:buck"),
          i18next.t("trainerNames:cheryl"),
          i18next.t("trainerNames:marley"),
          i18next.t("trainerNames:mira"),
          i18next.t("trainerNames:riley"),
        ].map(name => name.toLowerCase()),
      ).toContain(scene.currentBattle.trainer!.config.name.toLowerCase());
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
      expect(game).toBeAtPhase("SelectModifierPhase");

      const eggsAfter = scene.gameData.eggs;
      expect(eggsAfter).toBeDefined();
      expect(eggsBeforeLength + 1).toBe(eggsAfter.length);
      const eggTier = eggsAfter.at(-1)?.tier;
      expect(eggTier).toBeOneOf([EggTier.EPIC, EggTier.LEGENDARY]);
    });
  });

  describe("Option 2 - Decline the Challenge", () => {
    beforeEach(() => {
      // Mock sound object
      vi.spyOn(scene, "playSoundWithoutBgm").mockImplementation(() => {
        return {
          totalDuration: 1,
          destroy: () => null,
        } as any;
      });
    });

    it("should have the correct properties", () => {
      const option = ATrainersTestEncounter.options[1];
      expect(option.optionMode).toBe(MysteryEncounterOptionMode.DEFAULT);
      expect(option.dialogue).toBeDefined();
      expect(option.dialogue?.buttonLabel).toStrictEqual(`${namespace}:option.2.label`);
      expect(option.dialogue?.buttonTooltip).toStrictEqual(`${namespace}:option.2.tooltip`);
    });

    it("Should fully heal the party", async () => {
      const phaseSpy = vi.spyOn(scene.phaseManager, "unshiftPhase");

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
      expect(game).toBeAtPhase("SelectModifierPhase");

      const eggsAfter = scene.gameData.eggs;
      expect(eggsAfter).toBeDefined();
      expect(eggsBeforeLength + 1).toBe(eggsAfter.length);
      const eggTier = eggsAfter.at(-1)?.tier;
      expect(eggTier).toBe(EggTier.RARE);
    });

    it("should leave encounter without battle", async () => {
      const leaveEncounterWithoutBattleSpy = vi.spyOn(EncounterPhaseUtils, "leaveEncounterWithoutBattle");

      await game.runToMysteryEncounter(MysteryEncounterType.A_TRAINERS_TEST, defaultParty);
      await runMysteryEncounterToEnd(game, 2);

      expect(leaveEncounterWithoutBattleSpy).toBeCalled();
    });
  });
});
