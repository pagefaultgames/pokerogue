import * as MysteryEncounters from "#app/data/mystery-encounters/mystery-encounters";
import { Biome } from "#app/enums/biome";
import { MysteryEncounterType } from "#app/enums/mystery-encounter-type";
import { Species } from "#app/enums/species";
import GameManager from "#app/test/utils/gameManager";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { getPokemonSpecies } from "#app/data/pokemon-species";
import * as BattleAnims from "#app/data/battle-anims";
import * as EncounterPhaseUtils from "#app/data/mystery-encounters/utils/encounter-phase-utils";
import { runMysteryEncounterToEnd, skipBattleRunMysteryEncounterRewardsPhase } from "#test/mystery-encounter/encounter-test-utils";
import { Moves } from "#enums/moves";
import BattleScene from "#app/battle-scene";
import { TheStrongStuffEncounter } from "#app/data/mystery-encounters/encounters/the-strong-stuff-encounter";
import { Nature } from "#app/data/nature";
import { BerryType } from "#enums/berry-type";
import { BattlerTagType } from "#enums/battler-tag-type";
import { PokemonMove } from "#app/field/pokemon";
import { Mode } from "#app/ui/ui";
import ModifierSelectUiHandler from "#app/ui/modifier-select-ui-handler";
import { BerryModifier, PokemonBaseStatTotalModifier } from "#app/modifier/modifier";
import { MysteryEncounterOptionMode } from "#enums/mystery-encounter-option-mode";
import { MysteryEncounterTier } from "#enums/mystery-encounter-tier";
import { initSceneWithoutEncounterPhase } from "#test/utils/gameManagerUtils";
import { MysteryEncounterPokemonData } from "#app/data/mystery-encounters/mystery-encounter-pokemon-data";
import { CommandPhase } from "#app/phases/command-phase";
import { MovePhase } from "#app/phases/move-phase";
import { SelectModifierPhase } from "#app/phases/select-modifier-phase";

const namespace = "mysteryEncounter:theStrongStuff";
const defaultParty = [Species.LAPRAS, Species.GENGAR, Species.ABRA];
const defaultBiome = Biome.CAVE;
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
    game.override.mysteryEncounterChance(100);
    game.override.startingWave(defaultWave);
    game.override.startingBiome(defaultBiome);
    game.override.disableTrainerWaves();

    vi.spyOn(MysteryEncounters, "mysteryEncountersByBiome", "get").mockReturnValue(
      new Map<Biome, MysteryEncounterType[]>([
        [Biome.CAVE, [MysteryEncounterType.THE_STRONG_STUFF]],
        [Biome.MOUNTAIN, [MysteryEncounterType.MYSTERIOUS_CHALLENGERS]],
      ])
    );
  });

  afterEach(() => {
    game.phaseInterceptor.restoreOg();
    vi.clearAllMocks();
    vi.resetAllMocks();
  });

  it("should have the correct properties", async () => {
    await game.runToMysteryEncounter(MysteryEncounterType.THE_STRONG_STUFF, defaultParty);

    expect(TheStrongStuffEncounter.encounterType).toBe(MysteryEncounterType.THE_STRONG_STUFF);
    expect(TheStrongStuffEncounter.encounterTier).toBe(MysteryEncounterTier.GREAT);
    expect(TheStrongStuffEncounter.dialogue).toBeDefined();
    expect(TheStrongStuffEncounter.dialogue.intro).toStrictEqual([{ text: `${namespace}.intro` }]);
    expect(TheStrongStuffEncounter.dialogue.encounterOptionsDialogue?.title).toBe(`${namespace}.title`);
    expect(TheStrongStuffEncounter.dialogue.encounterOptionsDialogue?.description).toBe(`${namespace}.description`);
    expect(TheStrongStuffEncounter.dialogue.encounterOptionsDialogue?.query).toBe(`${namespace}.query`);
    expect(TheStrongStuffEncounter.options.length).toBe(2);
  });

  it("should not spawn outside of CAVE biome", async () => {
    game.override.mysteryEncounterTier(MysteryEncounterTier.COMMON);
    game.override.startingBiome(Biome.MOUNTAIN);
    await game.runToMysteryEncounter();

    expect(scene.currentBattle?.mysteryEncounter?.encounterType).not.toBe(MysteryEncounterType.THE_STRONG_STUFF);
  });

  it("should not run below wave 10", async () => {
    game.override.startingWave(9);

    await game.runToMysteryEncounter();

    expect(scene.currentBattle?.mysteryEncounter?.encounterType).not.toBe(MysteryEncounterType.THE_STRONG_STUFF);
  });

  it("should not run above wave 179", async () => {
    game.override.startingWave(181);

    await game.runToMysteryEncounter();

    expect(scene.currentBattle.mysteryEncounter).toBeUndefined();
  });

  it("should initialize fully ", async () => {
    initSceneWithoutEncounterPhase(scene, defaultParty);
    scene.currentBattle.mysteryEncounter = TheStrongStuffEncounter;
    const moveInitSpy = vi.spyOn(BattleAnims, "initMoveAnim");
    const moveLoadSpy = vi.spyOn(BattleAnims, "loadMoveAnimAssets");

    const { onInit } = TheStrongStuffEncounter;

    expect(TheStrongStuffEncounter.onInit).toBeDefined();

    TheStrongStuffEncounter.populateDialogueTokensFromRequirements(scene);
    const onInitResult = onInit!(scene);

    expect(TheStrongStuffEncounter.enemyPartyConfigs).toEqual([
      {
        levelAdditiveMultiplier: 1,
        disableSwitch: true,
        pokemonConfigs: [
          {
            species: getPokemonSpecies(Species.SHUCKLE),
            isBoss: true,
            bossSegments: 5,
            mysteryEncounterData: new MysteryEncounterPokemonData(1.25),
            nature: Nature.BOLD,
            moveSet: [Moves.INFESTATION, Moves.SALT_CURE, Moves.GASTRO_ACID, Moves.HEAL_ORDER],
            modifierConfigs: expect.any(Array),
            tags: [BattlerTagType.MYSTERY_ENCOUNTER_POST_SUMMON],
            mysteryEncounterBattleEffects: expect.any(Function)
          }
        ],
      }
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
        buttonLabel: `${namespace}.option.1.label`,
        buttonTooltip: `${namespace}.option.1.tooltip`,
        selected: [
          {
            text: `${namespace}.option.1.selected`,
          },
        ],
      });
    });

    it("should lower stats of 2 highest BST and raise stats for rest of party", async () => {
      await game.runToMysteryEncounter(MysteryEncounterType.THE_STRONG_STUFF, defaultParty);

      const bstsPrior = scene.getParty().map(p => p.getSpeciesForm().getBaseStatTotal());
      await runMysteryEncounterToEnd(game, 1);

      const bstsAfter = scene.getParty().map(p => {
        const baseStats = p.getSpeciesForm().baseStats.slice(0);
        scene.applyModifiers(PokemonBaseStatTotalModifier, true, p, baseStats);
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
        buttonLabel: `${namespace}.option.2.label`,
        buttonTooltip: `${namespace}.option.2.tooltip`,
        selected: [
          {
            text: `${namespace}.option.2.selected`,
          },
        ],
      });
    });

    it("should start battle against Shuckle", async () => {
      const phaseSpy = vi.spyOn(scene, "pushPhase");

      await game.runToMysteryEncounter(MysteryEncounterType.THE_STRONG_STUFF, defaultParty);
      await runMysteryEncounterToEnd(game, 2, undefined, true);

      const enemyField = scene.getEnemyField();
      expect(scene.getCurrentPhase()?.constructor.name).toBe(CommandPhase.name);
      expect(enemyField.length).toBe(1);
      expect(enemyField[0].species.speciesId).toBe(Species.SHUCKLE);
      expect(enemyField[0].summonData.statStages).toEqual([0, 2, 0, 2, 0, 0, 0]);
      const shuckleItems = enemyField[0].getHeldItems();
      expect(shuckleItems.length).toBe(4);
      expect(shuckleItems.find(m => m instanceof BerryModifier && m.berryType === BerryType.SITRUS)?.stackCount).toBe(1);
      expect(shuckleItems.find(m => m instanceof BerryModifier && m.berryType === BerryType.GANLON)?.stackCount).toBe(1);
      expect(shuckleItems.find(m => m instanceof BerryModifier && m.berryType === BerryType.APICOT)?.stackCount).toBe(1);
      expect(shuckleItems.find(m => m instanceof BerryModifier && m.berryType === BerryType.LUM)?.stackCount).toBe(2);
      expect(enemyField[0].moveset).toEqual([new PokemonMove(Moves.INFESTATION), new PokemonMove(Moves.SALT_CURE), new PokemonMove(Moves.GASTRO_ACID), new PokemonMove(Moves.HEAL_ORDER)]);

      // Should have used moves pre-battle
      const movePhases = phaseSpy.mock.calls.filter(p => p[0] instanceof MovePhase).map(p => p[0]);
      expect(movePhases.length).toBe(2);
      expect(movePhases.filter(p => (p as MovePhase).move.moveId === Moves.GASTRO_ACID).length).toBe(1);
      expect(movePhases.filter(p => (p as MovePhase).move.moveId === Moves.STEALTH_ROCK).length).toBe(1);
    });

    it("should have Soul Dew in rewards", async () => {
      await game.runToMysteryEncounter(MysteryEncounterType.THE_STRONG_STUFF, defaultParty);
      await runMysteryEncounterToEnd(game, 2, undefined, true);
      await skipBattleRunMysteryEncounterRewardsPhase(game);
      await game.phaseInterceptor.to(SelectModifierPhase, false);
      expect(scene.getCurrentPhase()?.constructor.name).toBe(SelectModifierPhase.name);
      await game.phaseInterceptor.run(SelectModifierPhase);

      expect(scene.ui.getMode()).to.equal(Mode.MODIFIER_SELECT);
      const modifierSelectHandler = scene.ui.handlers.find(h => h instanceof ModifierSelectUiHandler) as ModifierSelectUiHandler;
      expect(modifierSelectHandler.options.length).toEqual(3);
      expect(modifierSelectHandler.options[0].modifierTypeOption.type.id).toEqual("SOUL_DEW");
    });
  });
});
