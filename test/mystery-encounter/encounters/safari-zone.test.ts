import type { BattleScene } from "#app/battle-scene";
import { NON_LEGEND_PARADOX_POKEMON } from "#balance/special-species-groups";
import { BiomeId } from "#enums/biome-id";
import { MysteryEncounterOptionMode } from "#enums/mystery-encounter-option-mode";
import { MysteryEncounterTier } from "#enums/mystery-encounter-tier";
import { MysteryEncounterType } from "#enums/mystery-encounter-type";
import { SpeciesId } from "#enums/species-id";
import * as EncounterPhaseUtils from "#mystery-encounters/encounter-phase-utils";
import { MysteryEncounter } from "#mystery-encounters/mystery-encounter";
import * as MysteryEncounters from "#mystery-encounters/mystery-encounters";
import { getSafariSpeciesSpawn, SafariZoneEncounter } from "#mystery-encounters/safari-zone-encounter";
import { MysteryEncounterPhase } from "#phases/mystery-encounter-phases";
import {
  runMysteryEncounterToEnd,
  runSelectMysteryEncounterOption,
} from "#test/mystery-encounter/encounter-test-utils";
import { GameManager } from "#test/test-utils/game-manager";
import { initSceneWithoutEncounterPhase } from "#test/test-utils/game-manager-utils";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

const namespace = "mysteryEncounters/safariZone";
const defaultParty = [SpeciesId.LAPRAS, SpeciesId.GENGAR, SpeciesId.ABRA];
const defaultBiome = BiomeId.SWAMP;
const defaultWave = 45;

describe("Safari Zone - Mystery Encounter", () => {
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
      [BiomeId.FOREST, [MysteryEncounterType.SAFARI_ZONE]],
      [BiomeId.SWAMP, [MysteryEncounterType.SAFARI_ZONE]],
      [BiomeId.JUNGLE, [MysteryEncounterType.SAFARI_ZONE]],
    ]);
    vi.spyOn(MysteryEncounters, "mysteryEncountersByBiome", "get").mockReturnValue(biomeMap);
  });

  afterEach(() => {
    game.phaseInterceptor.restoreOg();
  });

  it("should have the correct properties", async () => {
    await game.runToMysteryEncounter(MysteryEncounterType.SAFARI_ZONE, defaultParty);

    expect(SafariZoneEncounter.encounterType).toBe(MysteryEncounterType.SAFARI_ZONE);
    expect(SafariZoneEncounter.encounterTier).toBe(MysteryEncounterTier.GREAT);
    expect(SafariZoneEncounter.dialogue).toBeDefined();
    expect(SafariZoneEncounter.dialogue.intro).toStrictEqual([{ text: `${namespace}:intro` }]);
    expect(SafariZoneEncounter.dialogue.encounterOptionsDialogue?.title).toBe(`${namespace}:title`);
    expect(SafariZoneEncounter.dialogue.encounterOptionsDialogue?.description).toBe(`${namespace}:description`);
    expect(SafariZoneEncounter.dialogue.encounterOptionsDialogue?.query).toBe(`${namespace}:query`);
    expect(SafariZoneEncounter.options.length).toBe(2);
  });

  it("should not spawn outside of the forest, swamp, or jungle biomes", async () => {
    game.override.mysteryEncounterTier(MysteryEncounterTier.GREAT).startingBiome(BiomeId.VOLCANO);
    await game.runToMysteryEncounter();

    expect(scene.currentBattle?.mysteryEncounter?.encounterType).not.toBe(MysteryEncounterType.SAFARI_ZONE);
  });

  it("should initialize fully", async () => {
    initSceneWithoutEncounterPhase(scene, defaultParty);
    scene.currentBattle.mysteryEncounter = new MysteryEncounter(SafariZoneEncounter);
    const encounter = scene.currentBattle.mysteryEncounter!;
    scene.currentBattle.waveIndex = defaultWave;

    const { onInit } = encounter;

    expect(encounter.onInit).toBeDefined();

    encounter.populateDialogueTokensFromRequirements();
    const onInitResult = onInit!();
    expect(onInitResult).toBe(true);
  });

  describe("Option 1 - Enter", () => {
    it("should have the correct properties", () => {
      const option = SafariZoneEncounter.options[0];
      expect(option.optionMode).toBe(MysteryEncounterOptionMode.DISABLED_OR_DEFAULT);
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

    it("should NOT be selectable if the player doesn't have enough money", async () => {
      game.scene.money = 0;
      await game.runToMysteryEncounter(MysteryEncounterType.SAFARI_ZONE, defaultParty);
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

    it("should not spawn any Paradox Pokemon", async () => {
      const NUM_ROLLS = 2000; // As long as this is greater than total number of species, this should cover all possible RNG rolls
      let rngSweepProgress = 0; // Will simulate full range of RNG rolls by steadily increasing from 0 to 1

      vi.spyOn(Phaser.Math.RND, "realInRange").mockImplementation((min: number, max: number) => {
        return rngSweepProgress * (max - min) + min;
      });
      vi.spyOn(Phaser.Math.RND, "shuffle").mockImplementation((arr: any[]) => arr);

      for (let i = 0; i < NUM_ROLLS; i++) {
        rngSweepProgress = (2 * i + 1) / (2 * NUM_ROLLS);
        const simSpecies = getSafariSpeciesSpawn().speciesId;
        expect(NON_LEGEND_PARADOX_POKEMON).not.toContain(simSpecies);
      }
    });

    // TODO: Tests for player actions inside the Safari Zone (Pokeball, Mud, Bait, Flee)
  });

  describe("Option 2 - Leave", () => {
    it("should have the correct properties", () => {
      const option = SafariZoneEncounter.options[1];
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

    it("should leave encounter without battle", async () => {
      const leaveEncounterWithoutBattleSpy = vi.spyOn(EncounterPhaseUtils, "leaveEncounterWithoutBattle");

      await game.runToMysteryEncounter(MysteryEncounterType.SAFARI_ZONE, defaultParty);
      await runMysteryEncounterToEnd(game, 2);

      expect(leaveEncounterWithoutBattleSpy).toBeCalled();
    });
  });
});
