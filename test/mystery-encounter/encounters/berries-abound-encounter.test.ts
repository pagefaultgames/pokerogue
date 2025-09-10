import type { BattleScene } from "#app/battle-scene";
import { AbilityId } from "#enums/ability-id";
import { BiomeId } from "#enums/biome-id";
import { MysteryEncounterOptionMode } from "#enums/mystery-encounter-option-mode";
import { MysteryEncounterTier } from "#enums/mystery-encounter-tier";
import { MysteryEncounterType } from "#enums/mystery-encounter-type";
import { SpeciesId } from "#enums/species-id";
import { UiMode } from "#enums/ui-mode";
import { BerryModifier } from "#modifiers/modifier";
import { BerriesAboundEncounter } from "#mystery-encounters/berries-abound-encounter";
import * as EncounterDialogueUtils from "#mystery-encounters/encounter-dialogue-utils";
import * as EncounterPhaseUtils from "#mystery-encounters/encounter-phase-utils";
import * as MysteryEncounters from "#mystery-encounters/mystery-encounters";
import {
  runMysteryEncounterToEnd,
  skipBattleRunMysteryEncounterRewardsPhase,
} from "#test/mystery-encounter/encounter-test-utils";
import { GameManager } from "#test/test-utils/game-manager";
import { initSceneWithoutEncounterPhase } from "#test/test-utils/game-manager-utils";
import { ModifierSelectUiHandler } from "#ui/handlers/modifier-select-ui-handler";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

const namespace = "mysteryEncounters/berriesAbound";
const defaultParty = [SpeciesId.PYUKUMUKU, SpeciesId.MAGIKARP, SpeciesId.PIKACHU];
const defaultBiome = BiomeId.CAVE;
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
    game.override
      .mysteryEncounterChance(100)
      .mysteryEncounterTier(MysteryEncounterTier.COMMON)
      .startingWave(defaultWave)
      .startingBiome(defaultBiome)
      .disableTrainerWaves()
      .startingModifier([])
      .startingHeldItems([])
      .enemyAbility(AbilityId.BALL_FETCH)
      .enemyPassiveAbility(AbilityId.BALL_FETCH);

    vi.spyOn(MysteryEncounters, "mysteryEncountersByBiome", "get").mockReturnValue(
      new Map<BiomeId, MysteryEncounterType[]>([[BiomeId.CAVE, [MysteryEncounterType.BERRIES_ABOUND]]]),
    );
  });

  afterEach(() => {
    game.phaseInterceptor.restoreOg();
  });

  it("should have the correct properties", async () => {
    await game.runToMysteryEncounter(MysteryEncounterType.BERRIES_ABOUND, defaultParty);

    expect(BerriesAboundEncounter.encounterType).toBe(MysteryEncounterType.BERRIES_ABOUND);
    expect(BerriesAboundEncounter.encounterTier).toBe(MysteryEncounterTier.COMMON);
    expect(BerriesAboundEncounter.dialogue).toBeDefined();
    expect(BerriesAboundEncounter.dialogue.intro).toStrictEqual([{ text: `${namespace}:intro` }]);
    expect(BerriesAboundEncounter.dialogue.encounterOptionsDialogue?.title).toBe(`${namespace}:title`);
    expect(BerriesAboundEncounter.dialogue.encounterOptionsDialogue?.description).toBe(`${namespace}:description`);
    expect(BerriesAboundEncounter.dialogue.encounterOptionsDialogue?.query).toBe(`${namespace}:query`);
    expect(BerriesAboundEncounter.options.length).toBe(3);
  });

  it("should initialize fully", async () => {
    initSceneWithoutEncounterPhase(scene, defaultParty);
    scene.currentBattle.mysteryEncounter = BerriesAboundEncounter;

    const { onInit } = BerriesAboundEncounter;

    expect(BerriesAboundEncounter.onInit).toBeDefined();

    BerriesAboundEncounter.populateDialogueTokensFromRequirements();
    const onInitResult = onInit!();

    const config = BerriesAboundEncounter.enemyPartyConfigs[0];
    expect(config).toBeDefined();
    expect(config.pokemonConfigs?.[0].isBoss).toBe(true);
    expect(onInitResult).toBe(true);
  });

  describe("Option 1 - Fight", () => {
    it("should have the correct properties", () => {
      const option = BerriesAboundEncounter.options[0];
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

    it("should start a fight against the boss", async () => {
      await game.runToMysteryEncounter(MysteryEncounterType.BERRIES_ABOUND, defaultParty);

      const config = game.scene.currentBattle.mysteryEncounter!.enemyPartyConfigs[0];
      const speciesToSpawn = config.pokemonConfigs?.[0].species.speciesId;

      await runMysteryEncounterToEnd(game, 1, undefined, true);

      const enemyField = scene.getEnemyField();
      expect(game).toBeAtPhase("CommandPhase");
      expect(enemyField.length).toBe(1);
      expect(enemyField[0].species.speciesId).toBe(speciesToSpawn);
    });

    /**
     * Related issue-comment: {@link https://github.com/pagefaultgames/pokerogue/issues/4300#issuecomment-2362849444}
     */
    it("should reward the player with X berries based on wave", async () => {
      await game.runToMysteryEncounter(MysteryEncounterType.BERRIES_ABOUND, defaultParty);

      const numBerries = game.scene.currentBattle.mysteryEncounter!.misc.numBerries;

      // Clear out any pesky mods that slipped through test spin-up
      scene.modifiers.forEach(mod => {
        scene.removeModifier(mod);
      });

      await runMysteryEncounterToEnd(game, 1, undefined, true);
      await skipBattleRunMysteryEncounterRewardsPhase(game);
      await game.phaseInterceptor.to("SelectModifierPhase", false);
      expect(game).toBeAtPhase("SelectModifierPhase");

      const berriesAfter = scene.findModifiers(m => m instanceof BerryModifier) as BerryModifier[];
      const berriesAfterCount = berriesAfter.reduce((a, b) => a + b.stackCount, 0);

      expect(numBerries).toBe(berriesAfterCount);
    });

    it("should spawn a shop with 5 berries", async () => {
      await game.runToMysteryEncounter(MysteryEncounterType.BERRIES_ABOUND, defaultParty);
      await runMysteryEncounterToEnd(game, 1, undefined, true);
      await skipBattleRunMysteryEncounterRewardsPhase(game);
      await game.phaseInterceptor.to("SelectModifierPhase");

      expect(scene.ui.getMode()).to.equal(UiMode.MODIFIER_SELECT);
      const modifierSelectHandler = scene.ui.handlers.find(
        h => h instanceof ModifierSelectUiHandler,
      ) as ModifierSelectUiHandler;
      expect(modifierSelectHandler.options.length).toEqual(5);
      for (const option of modifierSelectHandler.options) {
        expect(option.modifierTypeOption.type.id).toContain("BERRY");
      }
    });
  });

  describe("Option 2 - Race to the Bush", () => {
    it("should have the correct properties", () => {
      const option = BerriesAboundEncounter.options[1];
      expect(option.optionMode).toBe(MysteryEncounterOptionMode.DEFAULT);
      expect(option.dialogue).toBeDefined();
      expect(option.dialogue).toStrictEqual({
        buttonLabel: `${namespace}:option.2.label`,
        buttonTooltip: `${namespace}:option.2.tooltip`,
      });
    });

    it("should start battle if fastest pokemon is slower than boss below wave 50", async () => {
      game.override.startingWave(42);
      const encounterTextSpy = vi.spyOn(EncounterDialogueUtils, "showEncounterText");
      await game.runToMysteryEncounter(MysteryEncounterType.BERRIES_ABOUND, defaultParty);

      scene.getPlayerParty().forEach(pkm => {
        vi.spyOn(pkm, "getStat").mockReturnValue(1); // for ease return for every stat
      });

      const config = game.scene.currentBattle.mysteryEncounter!.enemyPartyConfigs[0];
      const speciesToSpawn = config.pokemonConfigs?.[0].species.speciesId;

      await runMysteryEncounterToEnd(game, 2, undefined, true);

      const enemyField = scene.getEnemyField();
      expect(game).toBeAtPhase("CommandPhase");
      expect(enemyField.length).toBe(1);
      expect(enemyField[0].species.speciesId).toBe(speciesToSpawn);

      // Should be enraged
      expect(enemyField[0].summonData.statStages).toEqual([0, 1, 0, 1, 1, 0, 0]);
      expect(encounterTextSpy).toHaveBeenCalledWith(`${namespace}:option.2.selectedBad`);
    });

    it("should start battle if fastest pokemon is slower than boss above wave 50", async () => {
      game.override.startingWave(57);
      const encounterTextSpy = vi.spyOn(EncounterDialogueUtils, "showEncounterText");
      await game.runToMysteryEncounter(MysteryEncounterType.BERRIES_ABOUND, defaultParty);

      scene.getPlayerParty().forEach(pkm => {
        vi.spyOn(pkm, "getStat").mockReturnValue(1); // for ease return for every stat
      });

      const config = game.scene.currentBattle.mysteryEncounter!.enemyPartyConfigs[0];
      const speciesToSpawn = config.pokemonConfigs?.[0].species.speciesId;

      await runMysteryEncounterToEnd(game, 2, undefined, true);

      const enemyField = scene.getEnemyField();
      expect(game).toBeAtPhase("CommandPhase");
      expect(enemyField.length).toBe(1);
      expect(enemyField[0].species.speciesId).toBe(speciesToSpawn);

      // Should be enraged
      expect(enemyField[0].summonData.statStages).toEqual([1, 1, 1, 1, 1, 0, 0]);
      expect(encounterTextSpy).toHaveBeenCalledWith(`${namespace}:option.2.selectedBad`);
    });

    it("Should skip battle when fastest pokemon is faster than boss", async () => {
      vi.spyOn(EncounterPhaseUtils, "leaveEncounterWithoutBattle");
      vi.spyOn(EncounterDialogueUtils, "showEncounterText");

      await game.runToMysteryEncounter(MysteryEncounterType.BERRIES_ABOUND, defaultParty);

      scene.getPlayerParty().forEach(pkm => {
        vi.spyOn(pkm, "getStat").mockReturnValue(9999); // for ease return for every stat
      });

      await runMysteryEncounterToEnd(game, 2);
      await game.phaseInterceptor.to("SelectModifierPhase");

      expect(scene.ui.getMode()).to.equal(UiMode.MODIFIER_SELECT);
      const modifierSelectHandler = scene.ui.handlers.find(
        h => h instanceof ModifierSelectUiHandler,
      ) as ModifierSelectUiHandler;
      expect(modifierSelectHandler.options.length).toEqual(5);
      for (const option of modifierSelectHandler.options) {
        expect(option.modifierTypeOption.type.id).toContain("BERRY");
      }

      expect(EncounterDialogueUtils.showEncounterText).toHaveBeenCalledWith(`${namespace}:option.2.selected`);
      expect(EncounterPhaseUtils.leaveEncounterWithoutBattle).toBeCalled();
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
