import type { BattleScene } from "#app/battle-scene";
import { speciesEggMoves } from "#balance/egg-moves";
import { modifierTypes } from "#data/data-lists";
import { AbilityId } from "#enums/ability-id";
import { BerryType } from "#enums/berry-type";
import { BiomeId } from "#enums/biome-id";
import { MoveId } from "#enums/move-id";
import { MysteryEncounterOptionMode } from "#enums/mystery-encounter-option-mode";
import { MysteryEncounterTier } from "#enums/mystery-encounter-tier";
import { MysteryEncounterType } from "#enums/mystery-encounter-type";
import { SpeciesId } from "#enums/species-id";
import { Stat } from "#enums/stat";
import type { BerryModifier } from "#modifiers/modifier";
import * as EncounterPhaseUtils from "#mystery-encounters/encounter-phase-utils";
import { generateModifierType } from "#mystery-encounters/encounter-phase-utils";
import * as MysteryEncounters from "#mystery-encounters/mystery-encounters";
import { UncommonBreedEncounter } from "#mystery-encounters/uncommon-breed-encounter";
import { MovePhase } from "#phases/move-phase";
import { MysteryEncounterPhase } from "#phases/mystery-encounter-phases";
import { StatStageChangePhase } from "#phases/stat-stage-change-phase";
import {
  runMysteryEncounterToEnd,
  runSelectMysteryEncounterOption,
} from "#test/mystery-encounter/encounter-test-utils";
import { GameManager } from "#test/test-utils/game-manager";
import { initSceneWithoutEncounterPhase } from "#test/test-utils/game-manager-utils";
import { getPokemonSpecies } from "#utils/pokemon-utils";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

const namespace = "mysteryEncounters/uncommonBreed";
const defaultParty = [SpeciesId.LAPRAS, SpeciesId.GENGAR, SpeciesId.ABRA];
const defaultBiome = BiomeId.CAVE;
const defaultWave = 45;

describe("Uncommon Breed - Mystery Encounter", () => {
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
      .mysteryEncounterTier(MysteryEncounterTier.COMMON)
      .startingWave(defaultWave)
      .startingBiome(defaultBiome)
      .disableTrainerWaves()
      .enemyAbility(AbilityId.BALL_FETCH)
      .enemyPassiveAbility(AbilityId.BALL_FETCH);

    vi.spyOn(MysteryEncounters, "mysteryEncountersByBiome", "get").mockReturnValue(
      new Map<BiomeId, MysteryEncounterType[]>([[BiomeId.CAVE, [MysteryEncounterType.UNCOMMON_BREED]]]),
    );
  });

  afterEach(() => {
    game.phaseInterceptor.restoreOg();
  });

  it("should have the correct properties", async () => {
    await game.runToMysteryEncounter(MysteryEncounterType.UNCOMMON_BREED, defaultParty);

    expect(UncommonBreedEncounter.encounterType).toBe(MysteryEncounterType.UNCOMMON_BREED);
    expect(UncommonBreedEncounter.encounterTier).toBe(MysteryEncounterTier.COMMON);
    expect(UncommonBreedEncounter.dialogue).toBeDefined();
    expect(UncommonBreedEncounter.dialogue.intro).toStrictEqual([{ text: `${namespace}:intro` }]);
    expect(UncommonBreedEncounter.dialogue.encounterOptionsDialogue?.title).toBe(`${namespace}:title`);
    expect(UncommonBreedEncounter.dialogue.encounterOptionsDialogue?.description).toBe(`${namespace}:description`);
    expect(UncommonBreedEncounter.dialogue.encounterOptionsDialogue?.query).toBe(`${namespace}:query`);
    expect(UncommonBreedEncounter.options.length).toBe(3);
  });

  it("should initialize fully", async () => {
    initSceneWithoutEncounterPhase(scene, defaultParty);
    scene.currentBattle.mysteryEncounter = UncommonBreedEncounter;

    const { onInit } = UncommonBreedEncounter;

    expect(UncommonBreedEncounter.onInit).toBeDefined();

    UncommonBreedEncounter.populateDialogueTokensFromRequirements();
    const onInitResult = onInit!();

    const config = UncommonBreedEncounter.enemyPartyConfigs[0];
    expect(config).toBeDefined();
    expect(config.pokemonConfigs?.[0].isBoss).toBe(false);
    expect(onInitResult).toBe(true);
  });

  describe("Option 1 - Fight", () => {
    it("should have the correct properties", () => {
      const option = UncommonBreedEncounter.options[0];
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

    it.skip("should start a fight against the boss below wave 50", async () => {
      const phaseSpy = vi.spyOn(scene.phaseManager, "pushPhase");
      const unshiftPhaseSpy = vi.spyOn(scene.phaseManager, "unshiftPhase");
      await game.runToMysteryEncounter(MysteryEncounterType.UNCOMMON_BREED, defaultParty);

      const config = game.scene.currentBattle.mysteryEncounter!.enemyPartyConfigs[0];
      const speciesToSpawn = config.pokemonConfigs?.[0].species.speciesId!;

      await runMysteryEncounterToEnd(game, 1, undefined, true);

      const enemyField = scene.getEnemyField();
      expect(game).toBeAtPhase("CommandPhase");
      expect(enemyField.length).toBe(1);
      expect(enemyField[0].species.speciesId).toBe(speciesToSpawn);

      const statStagePhases = unshiftPhaseSpy.mock.calls.filter(p => p[0] instanceof StatStageChangePhase)[0][0] as any;
      expect(statStagePhases.stats).toEqual([Stat.ATK, Stat.DEF, Stat.SPATK, Stat.SPDEF, Stat.SPD]);

      // Should have used its egg move pre-battle
      const movePhases = phaseSpy.mock.calls.filter(p => p[0] instanceof MovePhase).map(p => p[0]);
      expect(movePhases.length).toBe(1);
      const eggMoves: MoveId[] = speciesEggMoves[getPokemonSpecies(speciesToSpawn).getRootSpeciesId()];
      const usedMove = (movePhases[0] as MovePhase).move.moveId;
      expect(eggMoves.includes(usedMove)).toBe(true);
    });

    it.skip("should start a fight against the boss above wave 50", async () => {
      game.override.startingWave(57);
      const phaseSpy = vi.spyOn(scene.phaseManager, "pushPhase");
      const unshiftPhaseSpy = vi.spyOn(scene.phaseManager, "unshiftPhase");
      await game.runToMysteryEncounter(MysteryEncounterType.UNCOMMON_BREED, defaultParty);

      const config = game.scene.currentBattle.mysteryEncounter!.enemyPartyConfigs[0];
      const speciesToSpawn = config.pokemonConfigs?.[0].species.speciesId!;

      await runMysteryEncounterToEnd(game, 1, undefined, true);

      const enemyField = scene.getEnemyField();
      expect(game).toBeAtPhase("CommandPhase");
      expect(enemyField.length).toBe(1);
      expect(enemyField[0].species.speciesId).toBe(speciesToSpawn);

      const statStagePhases = unshiftPhaseSpy.mock.calls.filter(p => p[0] instanceof StatStageChangePhase)[0][0] as any;
      expect(statStagePhases.stats).toEqual([Stat.ATK, Stat.DEF, Stat.SPATK, Stat.SPDEF, Stat.SPD]);

      // Should have used its egg move pre-battle
      const movePhases = phaseSpy.mock.calls.filter(p => p[0] instanceof MovePhase).map(p => p[0]);
      expect(movePhases.length).toBe(1);
      const eggMoves: MoveId[] = speciesEggMoves[getPokemonSpecies(speciesToSpawn).getRootSpeciesId()];
      const usedMove = (movePhases[0] as MovePhase).move.moveId;
      expect(eggMoves.includes(usedMove)).toBe(true);
    });
  });

  describe("Option 2 - Give it Food", () => {
    it("should have the correct properties", () => {
      const option = UncommonBreedEncounter.options[1];
      expect(option.optionMode).toBe(MysteryEncounterOptionMode.DISABLED_OR_SPECIAL);
      expect(option.dialogue).toBeDefined();
      expect(option.dialogue).toStrictEqual({
        buttonLabel: `${namespace}:option.2.label`,
        buttonTooltip: `${namespace}:option.2.tooltip`,
        disabledButtonTooltip: `${namespace}:option.2.disabledTooltip`,
        selected: [
          {
            text: `${namespace}:option.2.selected`,
          },
        ],
      });
    });

    // TODO: there is some severe test flakiness occurring for this file, needs to be looked at/addressed in separate issue
    it.skip("should NOT be selectable if the player doesn't have enough berries", async () => {
      await game.runToMysteryEncounter(MysteryEncounterType.UNCOMMON_BREED, defaultParty);
      // Clear out any pesky mods that slipped through test spin-up
      scene.modifiers.forEach(mod => {
        scene.removeModifier(mod);
      });
      await scene.updateModifiers(true);
      await game.phaseInterceptor.to(MysteryEncounterPhase, false);

      const encounterPhase = scene.phaseManager.getCurrentPhase();
      expect(encounterPhase?.constructor.name).toBe(MysteryEncounterPhase.name);
      const mysteryEncounterPhase = encounterPhase as MysteryEncounterPhase;
      vi.spyOn(mysteryEncounterPhase, "continueEncounter");
      vi.spyOn(mysteryEncounterPhase, "handleOptionSelect");
      vi.spyOn(scene.ui, "playError");

      await runSelectMysteryEncounterOption(game, 2);

      expect(game).toBeAtPhase("MysteryEncounterPhase");
      expect(scene.ui.playError).not.toHaveBeenCalled(); // No error sfx, option is disabled
      expect(mysteryEncounterPhase.handleOptionSelect).not.toHaveBeenCalled();
      expect(mysteryEncounterPhase.continueEncounter).not.toHaveBeenCalled();
    });

    // TODO: there is some severe test flakiness occurring for this file, needs to be looked at/addressed in separate issue
    it.skip("Should skip fight when player meets requirements", { retry: 5 }, async () => {
      const leaveEncounterWithoutBattleSpy = vi.spyOn(EncounterPhaseUtils, "leaveEncounterWithoutBattle");

      await game.runToMysteryEncounter(MysteryEncounterType.UNCOMMON_BREED, defaultParty);

      // Berries on party lead
      const sitrus = generateModifierType(modifierTypes.BERRY, [BerryType.SITRUS])!;
      const sitrusMod = sitrus.newModifier(game.field.getPlayerPokemon()) as BerryModifier;
      sitrusMod.stackCount = 2;
      scene.addModifier(sitrusMod, true, false, false, true);
      const ganlon = generateModifierType(modifierTypes.BERRY, [BerryType.GANLON])!;
      const ganlonMod = ganlon.newModifier(game.field.getPlayerPokemon()) as BerryModifier;
      ganlonMod.stackCount = 3;
      scene.addModifier(ganlonMod, true, false, false, true);
      await scene.updateModifiers(true);

      await runMysteryEncounterToEnd(game, 2);

      expect(leaveEncounterWithoutBattleSpy).toBeCalled();
    });
  });

  describe("Option 3 - Use an Attracting Move", () => {
    it("should have the correct properties", () => {
      const option = UncommonBreedEncounter.options[2];
      expect(option.optionMode).toBe(MysteryEncounterOptionMode.DISABLED_OR_SPECIAL);
      expect(option.dialogue).toBeDefined();
      expect(option.dialogue).toStrictEqual({
        buttonLabel: `${namespace}:option.3.label`,
        buttonTooltip: `${namespace}:option.3.tooltip`,
        disabledButtonTooltip: `${namespace}:option.3.disabledTooltip`,
        selected: [
          {
            text: `${namespace}:option.3.selected`,
          },
        ],
      });
    });

    it("should NOT be selectable if the player doesn't have an Attracting move", async () => {
      await game.runToMysteryEncounter(MysteryEncounterType.UNCOMMON_BREED, defaultParty);
      scene.getPlayerParty().forEach(p => (p.moveset = []));
      await game.phaseInterceptor.to(MysteryEncounterPhase, false);

      const encounterPhase = scene.phaseManager.getCurrentPhase();
      expect(encounterPhase?.constructor.name).toBe(MysteryEncounterPhase.name);
      const mysteryEncounterPhase = encounterPhase as MysteryEncounterPhase;
      vi.spyOn(mysteryEncounterPhase, "continueEncounter");
      vi.spyOn(mysteryEncounterPhase, "handleOptionSelect");
      vi.spyOn(scene.ui, "playError");

      await runSelectMysteryEncounterOption(game, 3);

      expect(game).toBeAtPhase("MysteryEncounterPhase");
      expect(scene.ui.playError).not.toHaveBeenCalled(); // No error sfx, option is disabled
      expect(mysteryEncounterPhase.handleOptionSelect).not.toHaveBeenCalled();
      expect(mysteryEncounterPhase.continueEncounter).not.toHaveBeenCalled();
    });

    it("Should skip fight when player meets requirements", async () => {
      const leaveEncounterWithoutBattleSpy = vi.spyOn(EncounterPhaseUtils, "leaveEncounterWithoutBattle");
      await game.runToMysteryEncounter(MysteryEncounterType.UNCOMMON_BREED, defaultParty);
      // Mock moveset
      game.move.changeMoveset(game.field.getPlayerPokemon(), MoveId.CHARM);
      await runMysteryEncounterToEnd(game, 3);

      expect(leaveEncounterWithoutBattleSpy).toBeCalled();
    });
  });
});
