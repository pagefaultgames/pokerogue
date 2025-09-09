import type { BattleScene } from "#app/battle-scene";
import { BiomeId } from "#enums/biome-id";
import { MoveId } from "#enums/move-id";
import { MysteryEncounterOptionMode } from "#enums/mystery-encounter-option-mode";
import { MysteryEncounterTier } from "#enums/mystery-encounter-tier";
import { MysteryEncounterType } from "#enums/mystery-encounter-type";
import { SpeciesId } from "#enums/species-id";
import { UiMode } from "#enums/ui-mode";
import { DancingLessonsEncounter } from "#mystery-encounters/dancing-lessons-encounter";
import * as EncounterPhaseUtils from "#mystery-encounters/encounter-phase-utils";
import * as MysteryEncounters from "#mystery-encounters/mystery-encounters";
import { LearnMovePhase } from "#phases/learn-move-phase";
import { MovePhase } from "#phases/move-phase";
import { MysteryEncounterPhase } from "#phases/mystery-encounter-phases";
import {
  runMysteryEncounterToEnd,
  runSelectMysteryEncounterOption,
  skipBattleRunMysteryEncounterRewardsPhase,
} from "#test/mystery-encounter/encounter-test-utils";
import { GameManager } from "#test/test-utils/game-manager";
import { ModifierSelectUiHandler } from "#ui/handlers/modifier-select-ui-handler";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

const namespace = "mysteryEncounters/dancingLessons";
const defaultParty = [SpeciesId.LAPRAS, SpeciesId.GENGAR, SpeciesId.ABRA];
const defaultBiome = BiomeId.PLAINS;
const defaultWave = 45;

describe("Dancing Lessons - Mystery Encounter", () => {
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
      new Map<BiomeId, MysteryEncounterType[]>([
        [BiomeId.PLAINS, [MysteryEncounterType.DANCING_LESSONS]],
        [BiomeId.SPACE, [MysteryEncounterType.MYSTERIOUS_CHALLENGERS]],
      ]),
    );
  });

  afterEach(() => {
    game.phaseInterceptor.restoreOg();
  });

  it("should have the correct properties", async () => {
    await game.runToMysteryEncounter(MysteryEncounterType.DANCING_LESSONS, defaultParty);

    expect(DancingLessonsEncounter.encounterType).toBe(MysteryEncounterType.DANCING_LESSONS);
    expect(DancingLessonsEncounter.encounterTier).toBe(MysteryEncounterTier.GREAT);
    expect(DancingLessonsEncounter.dialogue).toBeDefined();
    expect(DancingLessonsEncounter.dialogue.intro).toStrictEqual([{ text: `${namespace}:intro` }]);
    expect(DancingLessonsEncounter.dialogue.encounterOptionsDialogue?.title).toBe(`${namespace}:title`);
    expect(DancingLessonsEncounter.dialogue.encounterOptionsDialogue?.description).toBe(`${namespace}:description`);
    expect(DancingLessonsEncounter.dialogue.encounterOptionsDialogue?.query).toBe(`${namespace}:query`);
    expect(DancingLessonsEncounter.options.length).toBe(3);
  });

  it("should not spawn outside of proper biomes", async () => {
    game.override.mysteryEncounterTier(MysteryEncounterTier.GREAT).startingBiome(BiomeId.SPACE);
    await game.runToMysteryEncounter();

    expect(game.scene.currentBattle.mysteryEncounter?.encounterType).not.toBe(MysteryEncounterType.DANCING_LESSONS);
  });

  describe("Option 1 - Fight the Oricorio", () => {
    it("should have the correct properties", () => {
      const option1 = DancingLessonsEncounter.options[0];
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

    it("should start battle against Oricorio", async () => {
      const phaseSpy = vi.spyOn(scene.phaseManager, "pushPhase");

      await game.runToMysteryEncounter(MysteryEncounterType.DANCING_LESSONS, defaultParty);
      // Make party lead's level arbitrarily high to not get KOed by move
      const partyLead = game.field.getPlayerPokemon();
      partyLead.level = 1000;
      partyLead.calculateStats();
      await runMysteryEncounterToEnd(game, 1, undefined, true);

      const enemyField = scene.getEnemyField();
      expect(game).toBeAtPhase("CommandPhase");
      expect(enemyField.length).toBe(1);
      expect(enemyField[0].species.speciesId).toBe(SpeciesId.ORICORIO);
      expect(enemyField[0].summonData.statStages).toEqual([1, 1, 1, 1, 0, 0, 0]);
      const moveset = enemyField[0].moveset.map(m => m.moveId);
      expect(moveset.some(m => m === MoveId.REVELATION_DANCE)).toBeTruthy();

      const movePhases = phaseSpy.mock.calls.filter(p => p[0] instanceof MovePhase).map(p => p[0]);
      expect(movePhases.length).toBe(1);
      expect(movePhases.filter(p => (p as MovePhase).move.moveId === MoveId.REVELATION_DANCE).length).toBe(1); // Revelation Dance used before battle
    });

    it("should have a Baton in the rewards after battle", async () => {
      await game.runToMysteryEncounter(MysteryEncounterType.DANCING_LESSONS, defaultParty);
      // Make party lead's level arbitrarily high to not get KOed by move
      const partyLead = game.field.getPlayerPokemon();
      partyLead.level = 1000;
      partyLead.calculateStats();
      await runMysteryEncounterToEnd(game, 1, undefined, true);
      await skipBattleRunMysteryEncounterRewardsPhase(game);
      await game.phaseInterceptor.to("SelectModifierPhase", false);
      expect(game).toBeAtPhase("SelectModifierPhase");
      await game.phaseInterceptor.to("SelectModifierPhase");

      expect(scene.ui.getMode()).to.equal(UiMode.MODIFIER_SELECT);
      const modifierSelectHandler = scene.ui.handlers.find(
        h => h instanceof ModifierSelectUiHandler,
      ) as ModifierSelectUiHandler;
      expect(modifierSelectHandler.options.length).toEqual(3); // Should fill remaining
      expect(modifierSelectHandler.options[0].modifierTypeOption.type.id).toContain("BATON");
    });
  });

  describe("Option 2 - Learn its Dance", () => {
    it("should have the correct properties", () => {
      const option = DancingLessonsEncounter.options[1];
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

    it("Should select a pokemon to learn Revelation Dance", async () => {
      const phaseSpy = vi.spyOn(scene.phaseManager, "unshiftPhase");

      await game.runToMysteryEncounter(MysteryEncounterType.DANCING_LESSONS, defaultParty);
      game.field.getPlayerPokemon().moveset = [];
      await runMysteryEncounterToEnd(game, 2, { pokemonNo: 1 });

      const movePhases = phaseSpy.mock.calls.filter(p => p[0] instanceof LearnMovePhase).map(p => p[0]);
      expect(movePhases.length).toBe(1);
      expect(movePhases.filter(p => (p as LearnMovePhase)["moveId"] === MoveId.REVELATION_DANCE).length).toBe(1); // Revelation Dance taught to pokemon
    });

    it("should leave encounter without battle", async () => {
      const leaveEncounterWithoutBattleSpy = vi.spyOn(EncounterPhaseUtils, "leaveEncounterWithoutBattle");

      await game.runToMysteryEncounter(MysteryEncounterType.DANCING_LESSONS, defaultParty);
      game.field.getPlayerPokemon().moveset = [];
      await runMysteryEncounterToEnd(game, 2, { pokemonNo: 1 });

      expect(leaveEncounterWithoutBattleSpy).toBeCalled();
    });
  });

  describe("Option 3 - Teach it a Dance", () => {
    it("should have the correct properties", () => {
      const option = DancingLessonsEncounter.options[2];
      expect(option.optionMode).toBe(MysteryEncounterOptionMode.DISABLED_OR_SPECIAL);
      expect(option.dialogue).toBeDefined();
      expect(option.dialogue).toStrictEqual({
        buttonLabel: `${namespace}:option.3.label`,
        buttonTooltip: `${namespace}:option.3.tooltip`,
        disabledButtonTooltip: `${namespace}:option.3.disabledTooltip`,
        secondOptionPrompt: `${namespace}:option.3.selectPrompt`,
        selected: [
          {
            text: `${namespace}:option.3.selected`,
          },
        ],
      });
    });

    it("should add Oricorio to the party", async () => {
      await game.runToMysteryEncounter(MysteryEncounterType.DANCING_LESSONS, defaultParty);
      const partyCountBefore = scene.getPlayerParty().length;
      game.move.changeMoveset(game.field.getPlayerPokemon(), MoveId.DRAGON_DANCE);
      await runMysteryEncounterToEnd(game, 3, { pokemonNo: 1, optionNo: 1 });
      const partyCountAfter = scene.getPlayerParty().length;

      expect(partyCountBefore + 1).toBe(partyCountAfter);
      const oricorio = scene.getPlayerParty()[scene.getPlayerParty().length - 1];
      expect(oricorio.species.speciesId).toBe(SpeciesId.ORICORIO);
      const moveset = oricorio.moveset.map(m => m.moveId);
      expect(moveset?.some(m => m === MoveId.REVELATION_DANCE)).toBeTruthy();
      expect(moveset?.some(m => m === MoveId.DRAGON_DANCE)).toBeTruthy();
    });

    it("should NOT be selectable if the player doesn't have a Dance type move", async () => {
      await game.runToMysteryEncounter(MysteryEncounterType.DANCING_LESSONS, defaultParty);
      const partyCountBefore = scene.getPlayerParty().length;
      scene.getPlayerParty().forEach(p => (p.moveset = []));
      await game.phaseInterceptor.to("MysteryEncounterPhase", false);

      const encounterPhase = scene.phaseManager.getCurrentPhase();
      expect(encounterPhase?.constructor.name).toBe(MysteryEncounterPhase.name);
      const mysteryEncounterPhase = encounterPhase as MysteryEncounterPhase;
      vi.spyOn(mysteryEncounterPhase, "continueEncounter");
      vi.spyOn(mysteryEncounterPhase, "handleOptionSelect");
      vi.spyOn(scene.ui, "playError");

      await runSelectMysteryEncounterOption(game, 3);
      const partyCountAfter = scene.getPlayerParty().length;

      expect(game).toBeAtPhase("MysteryEncounterPhase");
      expect(scene.ui.playError).not.toHaveBeenCalled(); // No error sfx, option is disabled
      expect(mysteryEncounterPhase.handleOptionSelect).not.toHaveBeenCalled();
      expect(mysteryEncounterPhase.continueEncounter).not.toHaveBeenCalled();
      expect(partyCountBefore).toBe(partyCountAfter);
    });

    it("should leave encounter without battle", async () => {
      const leaveEncounterWithoutBattleSpy = vi.spyOn(EncounterPhaseUtils, "leaveEncounterWithoutBattle");

      await game.runToMysteryEncounter(MysteryEncounterType.DANCING_LESSONS, defaultParty);
      game.move.changeMoveset(game.field.getPlayerPokemon(), MoveId.DRAGON_DANCE);
      await runMysteryEncounterToEnd(game, 3, { pokemonNo: 1, optionNo: 1 });

      expect(leaveEncounterWithoutBattleSpy).toBeCalled();
    });
  });
});
