import * as MysteryEncounters from "#app/data/mystery-encounters/mystery-encounters";
import { Biome } from "#app/enums/biome";
import { MysteryEncounterType } from "#app/enums/mystery-encounter-type";
import { Species } from "#app/enums/species";
import GameManager from "#app/test/utils/gameManager";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import * as EncounterPhaseUtils from "#app/data/mystery-encounters/utils/encounter-phase-utils";
import { runMysteryEncounterToEnd, runSelectMysteryEncounterOption } from "#test/mystery-encounter/encounter-test-utils";
import BattleScene from "#app/battle-scene";
import { CIVILIZATION_ENCOUNTER_BIOMES } from "#app/data/mystery-encounters/mystery-encounters";
import { MysteryEncounterOptionMode } from "#enums/mystery-encounter-option-mode";
import { MysteryEncounterTier } from "#enums/mystery-encounter-tier";
import { PartTimerEncounter } from "#app/data/mystery-encounters/encounters/part-timer-encounter";
import { PokemonMove } from "#app/field/pokemon";
import { Moves } from "#enums/moves";
import { MysteryEncounterPhase } from "#app/phases/mystery-encounter-phases";

const namespace = "mysteryEncounter:partTimer";
// Pyukumuku for lowest speed, Regieleki for highest speed, Feebas for lowest "bulk", Melmetal for highest "bulk"
const defaultParty = [Species.PYUKUMUKU, Species.REGIELEKI, Species.FEEBAS, Species.MELMETAL];
const defaultBiome = Biome.PLAINS;
const defaultWave = 37;

describe("Part-Timer - Mystery Encounter", () => {
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
    CIVILIZATION_ENCOUNTER_BIOMES.forEach(biome => {
      biomeMap.set(biome, [MysteryEncounterType.PART_TIMER]);
    });
    vi.spyOn(MysteryEncounters, "mysteryEncountersByBiome", "get").mockReturnValue(biomeMap);
  });

  afterEach(() => {
    game.phaseInterceptor.restoreOg();
    vi.clearAllMocks();
    vi.resetAllMocks();
  });

  it("should have the correct properties", async () => {
    await game.runToMysteryEncounter(MysteryEncounterType.PART_TIMER, defaultParty);

    expect(PartTimerEncounter.encounterType).toBe(MysteryEncounterType.PART_TIMER);
    expect(PartTimerEncounter.encounterTier).toBe(MysteryEncounterTier.COMMON);
    expect(PartTimerEncounter.dialogue).toBeDefined();
    expect(PartTimerEncounter.dialogue.intro).toStrictEqual([
      { text: `${namespace}.intro` },
      {
        speaker: `${namespace}.speaker`,
        text: `${namespace}.intro_dialogue`,
      }
    ]);
    expect(PartTimerEncounter.dialogue.encounterOptionsDialogue?.title).toBe(`${namespace}.title`);
    expect(PartTimerEncounter.dialogue.encounterOptionsDialogue?.description).toBe(`${namespace}.description`);
    expect(PartTimerEncounter.dialogue.encounterOptionsDialogue?.query).toBe(`${namespace}.query`);
    expect(PartTimerEncounter.options.length).toBe(3);
  });

  it("should not spawn outside of CIVILIZATION_ENCOUNTER_BIOMES", async () => {
    game.override.mysteryEncounterTier(MysteryEncounterTier.COMMON);
    game.override.startingBiome(Biome.VOLCANO);
    await game.runToMysteryEncounter();

    expect(scene.currentBattle?.mysteryEncounter?.encounterType).not.toBe(MysteryEncounterType.PART_TIMER);
  });

  it("should not run below wave 10", async () => {
    game.override.startingWave(9);

    await game.runToMysteryEncounter();

    expect(scene.currentBattle?.mysteryEncounter?.encounterType).not.toBe(MysteryEncounterType.PART_TIMER);
  });

  it("should not run above wave 179", async () => {
    game.override.startingWave(181);

    await game.runToMysteryEncounter();

    expect(scene.currentBattle.mysteryEncounter).toBeUndefined();
  });

  describe("Option 1 - Make Deliveries", () => {
    it("should have the correct properties", () => {
      const option = PartTimerEncounter.options[0];
      expect(option.optionMode).toBe(MysteryEncounterOptionMode.DEFAULT);
      expect(option.dialogue).toBeDefined();
      expect(option.dialogue).toStrictEqual({
        buttonLabel: `${namespace}.option.1.label`,
        buttonTooltip: `${namespace}.option.1.tooltip`,
        selected: [
          {
            text: `${namespace}.option.1.selected`
          }
        ]
      });
    });

    it("should give the player 1x money multiplier money with max slowest Pokemon", async () => {
      vi.spyOn(EncounterPhaseUtils, "updatePlayerMoney");

      await game.runToMysteryEncounter(MysteryEncounterType.PART_TIMER, defaultParty);
      // Override party levels to 50 so stats can be fully reflective
      scene.getParty().forEach(p => {
        p.level = 50;
        p.calculateStats();
      });
      await runMysteryEncounterToEnd(game, 1, { pokemonNo: 1 });

      expect(EncounterPhaseUtils.updatePlayerMoney).toHaveBeenCalledWith(scene, scene.getWaveMoneyAmount(1), true, false);
      // Expect PP of mon's moves to have been reduced to 2
      const moves = scene.getParty()[0].moveset;
      for (const move of moves) {
        expect((move?.getMovePp() ?? 0) - (move?.ppUsed ?? 0)).toBe(2);
      }
    });

    it("should give the player 4x money multiplier money with max fastest Pokemon", async () => {
      vi.spyOn(EncounterPhaseUtils, "updatePlayerMoney");

      await game.runToMysteryEncounter(MysteryEncounterType.PART_TIMER, defaultParty);
      // Override party levels to 50 so stats can be fully reflective
      scene.getParty().forEach(p => {
        p.level = 50;
        p.ivs = [20, 20, 20, 20, 20, 20];
        p.calculateStats();
      });
      await runMysteryEncounterToEnd(game, 1, { pokemonNo: 2 });

      expect(EncounterPhaseUtils.updatePlayerMoney).toHaveBeenCalledWith(scene, scene.getWaveMoneyAmount(4), true, false);
      // Expect PP of mon's moves to have been reduced to 2
      const moves = scene.getParty()[1].moveset;
      for (const move of moves) {
        expect((move?.getMovePp() ?? 0) - (move?.ppUsed ?? 0)).toBe(2);
      }
    });

    it("should leave encounter without battle", async () => {
      const leaveEncounterWithoutBattleSpy = vi.spyOn(EncounterPhaseUtils, "leaveEncounterWithoutBattle");

      await game.runToMysteryEncounter(MysteryEncounterType.PART_TIMER, defaultParty);
      await runMysteryEncounterToEnd(game, 1, { pokemonNo: 1 });

      expect(leaveEncounterWithoutBattleSpy).toBeCalled();
    });
  });

  describe("Option 2 - Help in the Warehouse", () => {
    it("should have the correct properties", () => {
      const option = PartTimerEncounter.options[1];
      expect(option.optionMode).toBe(MysteryEncounterOptionMode.DEFAULT);
      expect(option.dialogue).toBeDefined();
      expect(option.dialogue).toStrictEqual({
        buttonLabel: `${namespace}.option.2.label`,
        buttonTooltip: `${namespace}.option.2.tooltip`,
        selected: [
          {
            text: `${namespace}.option.2.selected`
          }
        ]
      });
    });

    it("should give the player 1x money multiplier money with least bulky Pokemon", async () => {
      vi.spyOn(EncounterPhaseUtils, "updatePlayerMoney");

      await game.runToMysteryEncounter(MysteryEncounterType.PART_TIMER, defaultParty);
      // Override party levels to 50 so stats can be fully reflective
      scene.getParty().forEach(p => {
        p.level = 50;
        p.calculateStats();
      });
      await runMysteryEncounterToEnd(game, 2, { pokemonNo: 3 });

      expect(EncounterPhaseUtils.updatePlayerMoney).toHaveBeenCalledWith(scene, scene.getWaveMoneyAmount(1), true, false);
      // Expect PP of mon's moves to have been reduced to 2
      const moves = scene.getParty()[2].moveset;
      for (const move of moves) {
        expect((move?.getMovePp() ?? 0) - (move?.ppUsed ?? 0)).toBe(2);
      }
    });

    it("should give the player 4x money multiplier money with bulkiest Pokemon", async () => {
      vi.spyOn(EncounterPhaseUtils, "updatePlayerMoney");

      await game.runToMysteryEncounter(MysteryEncounterType.PART_TIMER, defaultParty);
      // Override party levels to 50 so stats can be fully reflective
      scene.getParty().forEach(p => {
        p.level = 50;
        p.ivs = [20, 20, 20, 20, 20, 20];
        p.calculateStats();
      });
      await runMysteryEncounterToEnd(game, 2, { pokemonNo: 4 });

      expect(EncounterPhaseUtils.updatePlayerMoney).toHaveBeenCalledWith(scene, scene.getWaveMoneyAmount(4), true, false);
      // Expect PP of mon's moves to have been reduced to 2
      const moves = scene.getParty()[3].moveset;
      for (const move of moves) {
        expect((move?.getMovePp() ?? 0) - (move?.ppUsed ?? 0)).toBe(2);
      }
    });

    it("should leave encounter without battle", async () => {
      const leaveEncounterWithoutBattleSpy = vi.spyOn(EncounterPhaseUtils, "leaveEncounterWithoutBattle");

      await game.runToMysteryEncounter(MysteryEncounterType.PART_TIMER, defaultParty);
      await runMysteryEncounterToEnd(game, 2, { pokemonNo: 1 });

      expect(leaveEncounterWithoutBattleSpy).toBeCalled();
    });
  });

  describe("Option 3 - Assist with Sales", () => {
    it("should have the correct properties", () => {
      const option = PartTimerEncounter.options[2];
      expect(option.optionMode).toBe(MysteryEncounterOptionMode.DISABLED_OR_SPECIAL);
      expect(option.dialogue).toBeDefined();
      expect(option.dialogue).toStrictEqual({
        buttonLabel: `${namespace}.option.3.label`,
        buttonTooltip: `${namespace}.option.3.tooltip`,
        disabledButtonTooltip: `${namespace}.option.3.disabled_tooltip`,
        selected: [
          {
            text: `${namespace}.option.3.selected`
          }
        ]
      });
    });

    it("Should NOT be selectable when requirements are not met", async () => {
      vi.spyOn(EncounterPhaseUtils, "updatePlayerMoney");

      await game.runToMysteryEncounter(MysteryEncounterType.PART_TIMER, defaultParty);
      // Mock movesets
      scene.getParty().forEach(p => p.moveset = []);
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
      expect(EncounterPhaseUtils.updatePlayerMoney).not.toHaveBeenCalled();
    });

    it("should be selectable and give the player 2.5x money multiplier money with requirements met", async () => {
      vi.spyOn(EncounterPhaseUtils, "updatePlayerMoney");

      await game.runToMysteryEncounter(MysteryEncounterType.PART_TIMER, defaultParty);
      // Mock moveset
      scene.getParty()[0].moveset = [new PokemonMove(Moves.ATTRACT)];
      await runMysteryEncounterToEnd(game, 3);

      expect(EncounterPhaseUtils.updatePlayerMoney).toHaveBeenCalledWith(scene, scene.getWaveMoneyAmount(2.5), true, false);
      // Expect PP of mon's moves to have been reduced to 2
      const moves = scene.getParty()[0].moveset;
      for (const move of moves) {
        expect((move?.getMovePp() ?? 0) - (move?.ppUsed ?? 0)).toBe(2);
      }
    });

    it("should leave encounter without battle", async () => {
      const leaveEncounterWithoutBattleSpy = vi.spyOn(EncounterPhaseUtils, "leaveEncounterWithoutBattle");

      await game.runToMysteryEncounter(MysteryEncounterType.PART_TIMER, defaultParty);
      await runMysteryEncounterToEnd(game, 2, { pokemonNo: 1 });

      expect(leaveEncounterWithoutBattleSpy).toBeCalled();
    });
  });
});
