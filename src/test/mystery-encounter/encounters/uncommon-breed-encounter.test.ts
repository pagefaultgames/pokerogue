import * as MysteryEncounters from "#app/data/mystery-encounters/mystery-encounters";
import { Biome } from "#app/enums/biome";
import { MysteryEncounterType } from "#app/enums/mystery-encounter-type";
import { Species } from "#app/enums/species";
import GameManager from "#app/test/utils/gameManager";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { runMysteryEncounterToEnd, runSelectMysteryEncounterOption } from "#test/mystery-encounter/encounter-test-utils";
import { Moves } from "#enums/moves";
import BattleScene from "#app/battle-scene";
import { PokemonMove } from "#app/field/pokemon";
import { MysteryEncounterOptionMode } from "#enums/mystery-encounter-option-mode";
import { MysteryEncounterTier } from "#enums/mystery-encounter-tier";
import { initSceneWithoutEncounterPhase } from "#test/utils/gameManagerUtils";
import * as EncounterPhaseUtils from "#app/data/mystery-encounters/utils/encounter-phase-utils";
import { generateModifierType } from "#app/data/mystery-encounters/utils/encounter-phase-utils";
import { MysteryEncounterPhase } from "#app/phases/mystery-encounter-phases";
import { CommandPhase } from "#app/phases/command-phase";
import { UncommonBreedEncounter } from "#app/data/mystery-encounters/encounters/uncommon-breed-encounter";
import { MovePhase } from "#app/phases/move-phase";
import { speciesEggMoves } from "#app/data/egg-moves";
import { getPokemonSpecies } from "#app/data/pokemon-species";
import { BerryType } from "#enums/berry-type";
import { StatStageChangePhase } from "#app/phases/stat-stage-change-phase";
import { Stat } from "#enums/stat";
import { BerryModifier } from "#app/modifier/modifier";
import { modifierTypes } from "#app/modifier/modifier-type";
import * as TextUtils from "#app/ui/text";
import BBCodeText from "phaser3-rex-plugins/plugins/bbcodetext";

const namespace = "mysteryEncounter:uncommonBreed";
const defaultParty = [Species.LAPRAS, Species.GENGAR, Species.ABRA];
const defaultBiome = Biome.CAVE;
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
    game.override.mysteryEncounterChance(100);
    game.override.mysteryEncounterTier(MysteryEncounterTier.COMMON);
    game.override.startingWave(defaultWave);
    game.override.startingBiome(defaultBiome);
    game.override.disableTrainerWaves();

    vi.spyOn(MysteryEncounters, "mysteryEncountersByBiome", "get").mockReturnValue(
      new Map<Biome, MysteryEncounterType[]>([
        [Biome.CAVE, [MysteryEncounterType.UNCOMMON_BREED]],
      ])
    );
  });

  afterEach(() => {
    game.phaseInterceptor.restoreOg();
    vi.clearAllMocks();
    vi.resetAllMocks();
  });

  it("should have the correct properties", async () => {
    await game.runToMysteryEncounter(MysteryEncounterType.UNCOMMON_BREED, defaultParty);

    expect(UncommonBreedEncounter.encounterType).toBe(MysteryEncounterType.UNCOMMON_BREED);
    expect(UncommonBreedEncounter.encounterTier).toBe(MysteryEncounterTier.COMMON);
    expect(UncommonBreedEncounter.dialogue).toBeDefined();
    expect(UncommonBreedEncounter.dialogue.intro).toStrictEqual([{ text: `${namespace}.intro` }]);
    expect(UncommonBreedEncounter.dialogue.encounterOptionsDialogue?.title).toBe(`${namespace}.title`);
    expect(UncommonBreedEncounter.dialogue.encounterOptionsDialogue?.description).toBe(`${namespace}.description`);
    expect(UncommonBreedEncounter.dialogue.encounterOptionsDialogue?.query).toBe(`${namespace}.query`);
    expect(UncommonBreedEncounter.options.length).toBe(3);
  });

  it("should not run below wave 10", async () => {
    game.override.startingWave(9);

    await game.runToMysteryEncounter();

    expect(scene.currentBattle?.mysteryEncounter?.encounterType).not.toBe(MysteryEncounterType.UNCOMMON_BREED);
  });

  it("should not run above wave 179", async () => {
    game.override.startingWave(181);

    await game.runToMysteryEncounter();

    expect(scene.currentBattle.mysteryEncounter).toBeUndefined();
  });

  it("should initialize fully", async () => {
    initSceneWithoutEncounterPhase(scene, defaultParty);
    scene.currentBattle.mysteryEncounter = UncommonBreedEncounter;

    const { onInit } = UncommonBreedEncounter;

    expect(UncommonBreedEncounter.onInit).toBeDefined();

    UncommonBreedEncounter.populateDialogueTokensFromRequirements(scene);
    const onInitResult = onInit!(scene);

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
        buttonLabel: `${namespace}.option.1.label`,
        buttonTooltip: `${namespace}.option.1.tooltip`,
        selected: [
          {
            text: `${namespace}.option.1.selected`,
          },
        ],
      });
    });

    it("should start a fight against the boss", async () => {
      const phaseSpy = vi.spyOn(scene, "pushPhase");
      const unshiftPhaseSpy = vi.spyOn(scene, "unshiftPhase");
      await game.runToMysteryEncounter(MysteryEncounterType.UNCOMMON_BREED, defaultParty);

      const config = game.scene.currentBattle.mysteryEncounter!.enemyPartyConfigs[0];
      const speciesToSpawn = config.pokemonConfigs?.[0].species.speciesId;

      await runMysteryEncounterToEnd(game, 1, undefined, true);

      const enemyField = scene.getEnemyField();
      expect(scene.getCurrentPhase()?.constructor.name).toBe(CommandPhase.name);
      expect(enemyField.length).toBe(1);
      expect(enemyField[0].species.speciesId).toBe(speciesToSpawn);

      const statStagePhases = unshiftPhaseSpy.mock.calls.filter(p => p[0] instanceof StatStageChangePhase)[0][0] as any;
      expect(statStagePhases.stats).toEqual([Stat.ATK, Stat.DEF, Stat.SPATK, Stat.SPDEF, Stat.SPD]);

      // Should have used its egg move pre-battle
      const movePhases = phaseSpy.mock.calls.filter(p => p[0] instanceof MovePhase).map(p => p[0]);
      expect(movePhases.length).toBe(1);
      const eggMoves: Moves[] = speciesEggMoves[getPokemonSpecies(speciesToSpawn).getRootSpeciesId()];
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
        buttonLabel: `${namespace}.option.2.label`,
        buttonTooltip: `${namespace}.option.2.tooltip`,
        disabledButtonTooltip: `${namespace}.option.2.disabled_tooltip`,
        selected: [
          {
            text: `${namespace}.option.2.selected`,
          }
        ],
      });
    });

    it("should NOT be selectable if the player doesn't have enough berries", async () => {
      // For some reason, BBCodeText has issues with this test
      vi.spyOn(TextUtils, "addBBCodeTextObject").mockImplementation(() => new BBCodeText(scene, 0, 0, "test"));

      await game.runToMysteryEncounter(MysteryEncounterType.UNCOMMON_BREED, defaultParty);
      // Clear out any pesky mods that slipped through test spin-up
      scene.modifiers.forEach(mod => {
        scene.removeModifier(mod);
      });
      await scene.updateModifiers(true);
      await game.phaseInterceptor.to(MysteryEncounterPhase, false);

      const encounterPhase = scene.getCurrentPhase();
      expect(encounterPhase?.constructor.name).toBe(MysteryEncounterPhase.name);
      const mysteryEncounterPhase = encounterPhase as MysteryEncounterPhase;
      vi.spyOn(mysteryEncounterPhase, "continueEncounter");
      vi.spyOn(mysteryEncounterPhase, "handleOptionSelect");
      vi.spyOn(scene.ui, "playError");

      await runSelectMysteryEncounterOption(game, 2);

      expect(scene.getCurrentPhase()?.constructor.name).toBe(MysteryEncounterPhase.name);
      expect(scene.ui.playError).not.toHaveBeenCalled(); // No error sfx, option is disabled
      expect(mysteryEncounterPhase.handleOptionSelect).not.toHaveBeenCalled();
      expect(mysteryEncounterPhase.continueEncounter).not.toHaveBeenCalled();
    });

    it("Should skip fight when player meets requirements", { retry: 5 }, async () => {
      const leaveEncounterWithoutBattleSpy = vi.spyOn(EncounterPhaseUtils, "leaveEncounterWithoutBattle");

      await game.runToMysteryEncounter(MysteryEncounterType.UNCOMMON_BREED, defaultParty);

      // Berries on party lead
      const sitrus = generateModifierType(scene, modifierTypes.BERRY, [BerryType.SITRUS])!;
      const sitrusMod = sitrus.newModifier(scene.getParty()[0]) as BerryModifier;
      sitrusMod.stackCount = 2;
      await scene.addModifier(sitrusMod, true, false, false, true);
      const ganlon = generateModifierType(scene, modifierTypes.BERRY, [BerryType.GANLON])!;
      const ganlonMod = ganlon.newModifier(scene.getParty()[0]) as BerryModifier;
      ganlonMod.stackCount = 3;
      await scene.addModifier(ganlonMod, true, false, false, true);
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
        buttonLabel: `${namespace}.option.3.label`,
        buttonTooltip: `${namespace}.option.3.tooltip`,
        disabledButtonTooltip: `${namespace}.option.3.disabled_tooltip`,
        selected: [
          {
            text: `${namespace}.option.3.selected`,
          }
        ],
      });
    });

    it("should NOT be selectable if the player doesn't have an Attracting move", async () => {
      await game.runToMysteryEncounter(MysteryEncounterType.UNCOMMON_BREED, defaultParty);
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
    });

    it("Should skip fight when player meets requirements", async () => {
      const leaveEncounterWithoutBattleSpy = vi.spyOn(EncounterPhaseUtils, "leaveEncounterWithoutBattle");
      await game.runToMysteryEncounter(MysteryEncounterType.UNCOMMON_BREED, defaultParty);
      // Mock moveset
      scene.getParty()[0].moveset = [new PokemonMove(Moves.CHARM)];
      await runMysteryEncounterToEnd(game, 3);

      expect(leaveEncounterWithoutBattleSpy).toBeCalled();
    });
  });
});
