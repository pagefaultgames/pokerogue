import * as MysteryEncounters from "#app/data/mystery-encounters/mystery-encounters";
import { Biome } from "#app/enums/biome";
import { MysteryEncounterType } from "#app/enums/mystery-encounter-type";
import { Species } from "#app/enums/species";
import GameManager from "#app/test/utils/gameManager";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { runMysteryEncounterToEnd, skipBattleRunMysteryEncounterRewardsPhase } from "#test/mystery-encounter/encounterTestUtils";
import { CommandPhase, SelectModifierPhase } from "#app/phases";
import { Moves } from "#enums/moves";
import BattleScene from "#app/battle-scene";
import { PokemonMove } from "#app/field/pokemon";
import { Mode } from "#app/ui/ui";
import ModifierSelectUiHandler from "#app/ui/modifier-select-ui-handler";
import { BerryModifier } from "#app/modifier/modifier";
import { MysteryEncounterOptionMode } from "#enums/mystery-encounter-option-mode";
import { MysteryEncounterTier } from "#enums/mystery-encounter-tier";
import { initSceneWithoutEncounterPhase } from "#test/utils/gameManagerUtils";
import { BerriesAboundEncounter } from "#app/data/mystery-encounters/encounters/berries-abound-encounter";
import * as Utils from "utils";
import { isNullOrUndefined } from "utils";
import * as EncounterPhaseUtils from "#app/data/mystery-encounters/utils/encounter-phase-utils";
import * as EncounterDialogueUtils from "#app/data/mystery-encounters/utils/encounter-dialogue-utils";

const namespace = "mysteryEncounter:berriesAbound";
const defaultParty = [Species.LAPRAS, Species.GENGAR, Species.ABRA];
const defaultBiome = Biome.CAVE;
const defaultWave = 45;

describe("Berries Abound - Mystery Encounter", () => {
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
    game.override.disableTrainerWaves(true);

    vi.spyOn(MysteryEncounters, "mysteryEncountersByBiome", "get").mockReturnValue(
      new Map<Biome, MysteryEncounterType[]>([
        [Biome.CAVE, [MysteryEncounterType.BERRIES_ABOUND]],
      ])
    );
  });

  afterEach(() => {
    game.phaseInterceptor.restoreOg();
    vi.clearAllMocks();
    vi.resetAllMocks();
  });

  it("should have the correct properties", async () => {
    await game.runToMysteryEncounter(MysteryEncounterType.BERRIES_ABOUND, defaultParty);

    expect(BerriesAboundEncounter.encounterType).toBe(MysteryEncounterType.BERRIES_ABOUND);
    expect(BerriesAboundEncounter.encounterTier).toBe(MysteryEncounterTier.COMMON);
    expect(BerriesAboundEncounter.dialogue).toBeDefined();
    expect(BerriesAboundEncounter.dialogue.intro).toStrictEqual([{ text: `${namespace}.intro` }]);
    expect(BerriesAboundEncounter.dialogue.encounterOptionsDialogue.title).toBe(`${namespace}.title`);
    expect(BerriesAboundEncounter.dialogue.encounterOptionsDialogue.description).toBe(`${namespace}.description`);
    expect(BerriesAboundEncounter.dialogue.encounterOptionsDialogue.query).toBe(`${namespace}.query`);
    expect(BerriesAboundEncounter.options.length).toBe(3);
  });

  it("should not run below wave 10", async () => {
    game.override.startingWave(9);

    await game.runToMysteryEncounter();

    expect(scene.currentBattle?.mysteryEncounter?.encounterType).not.toBe(MysteryEncounterType.BERRIES_ABOUND);
  });

  it("should not run above wave 179", async () => {
    game.override.startingWave(181);

    await game.runToMysteryEncounter();

    expect(scene.currentBattle.mysteryEncounter).toBeUndefined();
  });

  it("should initialize fully", async () => {
    initSceneWithoutEncounterPhase(scene, defaultParty);
    scene.currentBattle.mysteryEncounter = BerriesAboundEncounter;

    const { onInit } = BerriesAboundEncounter;

    expect(BerriesAboundEncounter.onInit).toBeDefined();

    BerriesAboundEncounter.populateDialogueTokensFromRequirements(scene);
    const onInitResult = onInit(scene);

    const config = BerriesAboundEncounter.enemyPartyConfigs[0];
    expect(config).toBeDefined();
    expect(config.levelAdditiveMultiplier).toBe(1);
    expect(config.pokemonConfigs[0].isBoss).toBe(true);
    expect(onInitResult).toBe(true);
  });

  describe("Option 1 - Fight", () => {
    it("should have the correct properties", () => {
      const option1 = BerriesAboundEncounter.options[0];
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

    it("should start a fight against the boss", async () => {
      await game.runToMysteryEncounter(MysteryEncounterType.BERRIES_ABOUND, defaultParty);

      const config = game.scene.currentBattle.mysteryEncounter.enemyPartyConfigs[0];
      const speciesToSpawn = config.pokemonConfigs[0].species.speciesId;

      await runMysteryEncounterToEnd(game, 1, null, true);

      const enemyField = scene.getEnemyField();
      expect(scene.getCurrentPhase().constructor.name).toBe(CommandPhase.name);
      expect(enemyField.length).toBe(1);
      expect(enemyField[0].species.speciesId).toBe(speciesToSpawn);
    });

    it("should reward the player with X berries based on wave", async () => {
      await game.runToMysteryEncounter(MysteryEncounterType.BERRIES_ABOUND, defaultParty);

      const numBerries = game.scene.currentBattle.mysteryEncounter.misc.numBerries;

      await runMysteryEncounterToEnd(game, 1, null, true);
      await skipBattleRunMysteryEncounterRewardsPhase(game);
      await game.phaseInterceptor.to(SelectModifierPhase, false);
      expect(scene.getCurrentPhase().constructor.name).toBe(SelectModifierPhase.name);

      const berriesAfter = scene.findModifiers(m => m instanceof BerryModifier) as BerryModifier[];
      const berriesAfterCount = berriesAfter.reduce((a, b) => a + b.stackCount, 0);

      expect(numBerries).toBe(berriesAfterCount);
    });

    it("should spawn a shop with 5 berries", async () => {
      await game.runToMysteryEncounter(MysteryEncounterType.BERRIES_ABOUND, defaultParty);
      await runMysteryEncounterToEnd(game, 1, null, true);
      await skipBattleRunMysteryEncounterRewardsPhase(game);
      await game.phaseInterceptor.to(SelectModifierPhase, false);
      expect(scene.getCurrentPhase().constructor.name).toBe(SelectModifierPhase.name);
      await game.phaseInterceptor.run(SelectModifierPhase);

      expect(scene.ui.getMode()).to.equal(Mode.MODIFIER_SELECT);
      const modifierSelectHandler = scene.ui.handlers.find(h => h instanceof ModifierSelectUiHandler) as ModifierSelectUiHandler;
      expect(modifierSelectHandler.options.length).toEqual(5);
      for (const option of modifierSelectHandler.options) {
        expect(option.modifierTypeOption.type.id).toContain("BERRY");
      }
    });
  });

  describe("Option 2 - Attempt to Steal", () => {
    it("should have the correct properties", () => {
      const option1 = BerriesAboundEncounter.options[1];
      expect(option1.optionMode).toBe(MysteryEncounterOptionMode.DEFAULT_OR_SPECIAL);
      expect(option1.dialogue).toBeDefined();
      expect(option1.dialogue).toStrictEqual({
        buttonLabel: `${namespace}.option.2.label`,
        buttonTooltip: `${namespace}.option.2.tooltip`,
      });
    });

    it("should start battle on failing to steal", async () => {
      await game.runToMysteryEncounter(MysteryEncounterType.BERRIES_ABOUND, defaultParty);

      const config = game.scene.currentBattle.mysteryEncounter.enemyPartyConfigs[0];
      const speciesToSpawn = config.pokemonConfigs[0].species.speciesId;

      const realFn = Utils.randSeedInt;
      vi.spyOn(Utils, "randSeedInt").mockImplementation((range, min) => {
        if (range === 16 && isNullOrUndefined(min)) {
          // Mock the steal roll
          return 12;
        } else {
          return realFn(range, min);
        }
      });

      await runMysteryEncounterToEnd(game, 2, null, true);

      const enemyField = scene.getEnemyField();
      expect(scene.getCurrentPhase().constructor.name).toBe(CommandPhase.name);
      expect(enemyField.length).toBe(1);
      expect(enemyField[0].species.speciesId).toBe(speciesToSpawn);

      // Should be enraged
      expect(enemyField[0].summonData.battleStats).toEqual([1, 1, 1, 1, 1, 0, 0]);
    });

    it("Should skip battle when succeed on steal", async () => {
      const leaveEncounterWithoutBattleSpy = vi.spyOn(EncounterPhaseUtils, "leaveEncounterWithoutBattle");

      await game.runToMysteryEncounter(MysteryEncounterType.BERRIES_ABOUND, defaultParty);

      const realFn = Utils.randSeedInt;
      vi.spyOn(Utils, "randSeedInt").mockImplementation((range, min) => {
        if (range === 16 && isNullOrUndefined(min)) {
          // Mock the steal roll
          return 6;
        } else {
          return realFn(range, min);
        }
      });

      await runMysteryEncounterToEnd(game, 2);
      await game.phaseInterceptor.to(SelectModifierPhase, false);
      expect(scene.getCurrentPhase().constructor.name).toBe(SelectModifierPhase.name);
      await game.phaseInterceptor.run(SelectModifierPhase);

      expect(scene.ui.getMode()).to.equal(Mode.MODIFIER_SELECT);
      const modifierSelectHandler = scene.ui.handlers.find(h => h instanceof ModifierSelectUiHandler) as ModifierSelectUiHandler;
      expect(modifierSelectHandler.options.length).toEqual(5);
      for (const option of modifierSelectHandler.options) {
        expect(option.modifierTypeOption.type.id).toContain("BERRY");
      }

      expect(leaveEncounterWithoutBattleSpy).toBeCalled();
    });

    it("Should skip fight when special requirements are met", async () => {
      const leaveEncounterWithoutBattleSpy = vi.spyOn(EncounterPhaseUtils, "leaveEncounterWithoutBattle");
      const encounterTextSpy = vi.spyOn(EncounterDialogueUtils, "showEncounterText");

      await game.runToMysteryEncounter(MysteryEncounterType.BERRIES_ABOUND, defaultParty);

      // Mock moveset
      scene.getParty()[0].moveset = [new PokemonMove(Moves.KNOCK_OFF)];

      await runMysteryEncounterToEnd(game, 2);
      await game.phaseInterceptor.to(SelectModifierPhase, false);
      expect(scene.getCurrentPhase().constructor.name).toBe(SelectModifierPhase.name);
      await game.phaseInterceptor.run(SelectModifierPhase);
      expect(scene.ui.getMode()).to.equal(Mode.MODIFIER_SELECT);

      const modifierSelectHandler = scene.ui.handlers.find(h => h instanceof ModifierSelectUiHandler) as ModifierSelectUiHandler;
      expect(modifierSelectHandler.options.length).toEqual(5);
      for (const option of modifierSelectHandler.options) {
        expect(option.modifierTypeOption.type.id).toContain("BERRY");
      }

      expect(encounterTextSpy).toHaveBeenCalledWith(expect.any(BattleScene), `${namespace}.option.2.special_result`);
      expect(leaveEncounterWithoutBattleSpy).toBeCalled();
    });
  });

  describe("Option 3 - Leave", () => {
    it("should leave encounter without battle", async () => {
      const leaveEncounterWithoutBattleSpy = vi.spyOn(EncounterPhaseUtils, "leaveEncounterWithoutBattle");

      await game.runToMysteryEncounter(MysteryEncounterType.BERRIES_ABOUND, defaultParty);
      await runMysteryEncounterToEnd(game, 3);

      expect(leaveEncounterWithoutBattleSpy).toBeCalled();
    });
  });
});
