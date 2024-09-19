import * as MysteryEncounters from "#app/data/mystery-encounters/mystery-encounters";
import { HUMAN_TRANSITABLE_BIOMES } from "#app/data/mystery-encounters/mystery-encounters";
import { Biome } from "#app/enums/biome";
import { MysteryEncounterType } from "#app/enums/mystery-encounter-type";
import { Species } from "#app/enums/species";
import GameManager from "#app/test/utils/gameManager";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { runMysteryEncounterToEnd, skipBattleRunMysteryEncounterRewardsPhase } from "#test/mystery-encounter/encounter-test-utils";
import BattleScene from "#app/battle-scene";
import { Mode } from "#app/ui/ui";
import { MysteryEncounterOptionMode } from "#enums/mystery-encounter-option-mode";
import { MysteryEncounterTier } from "#enums/mystery-encounter-tier";
import { initSceneWithoutEncounterPhase } from "#test/utils/gameManagerUtils";
import { ModifierTier } from "#app/modifier/modifier-tier";
import { MysteriousChallengersEncounter } from "#app/data/mystery-encounters/encounters/mysterious-challengers-encounter";
import { TrainerConfig, TrainerPartyCompoundTemplate, TrainerPartyTemplate } from "#app/data/trainer-config";
import { PartyMemberStrength } from "#enums/party-member-strength";
import { MysteryEncounterMode } from "#enums/mystery-encounter-mode";
import ModifierSelectUiHandler from "#app/ui/modifier-select-ui-handler";
import MysteryEncounter from "#app/data/mystery-encounters/mystery-encounter";
import { CommandPhase } from "#app/phases/command-phase";
import { SelectModifierPhase } from "#app/phases/select-modifier-phase";

const namespace = "mysteryEncounters/mysteriousChallengers";
const defaultParty = [Species.LAPRAS, Species.GENGAR, Species.ABRA];
const defaultBiome = Biome.CAVE;
const defaultWave = 45;

describe("Mysterious Challengers - Mystery Encounter", () => {
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
      [Biome.VOLCANO, [MysteryEncounterType.FIGHT_OR_FLIGHT]],
    ]);
    HUMAN_TRANSITABLE_BIOMES.forEach(biome => {
      biomeMap.set(biome, [MysteryEncounterType.MYSTERIOUS_CHALLENGERS]);
    });
    vi.spyOn(MysteryEncounters, "mysteryEncountersByBiome", "get").mockReturnValue(biomeMap);
  });

  afterEach(() => {
    game.phaseInterceptor.restoreOg();
    vi.clearAllMocks();
    vi.resetAllMocks();
  });

  it("should have the correct properties", async () => {
    await game.runToMysteryEncounter(MysteryEncounterType.MYSTERIOUS_CHALLENGERS, defaultParty);

    expect(MysteriousChallengersEncounter.encounterType).toBe(MysteryEncounterType.MYSTERIOUS_CHALLENGERS);
    expect(MysteriousChallengersEncounter.encounterTier).toBe(MysteryEncounterTier.GREAT);
    expect(MysteriousChallengersEncounter.dialogue).toBeDefined();
    expect(MysteriousChallengersEncounter.dialogue.intro).toStrictEqual([{ text: `${namespace}:intro` }]);
    expect(MysteriousChallengersEncounter.dialogue.encounterOptionsDialogue?.title).toBe(`${namespace}:title`);
    expect(MysteriousChallengersEncounter.dialogue.encounterOptionsDialogue?.description).toBe(`${namespace}:description`);
    expect(MysteriousChallengersEncounter.dialogue.encounterOptionsDialogue?.query).toBe(`${namespace}:query`);
    expect(MysteriousChallengersEncounter.options.length).toBe(3);
  });

  it("should not spawn outside of HUMAN_TRANSITABLE_BIOMES", async () => {
    game.override.mysteryEncounterTier(MysteryEncounterTier.GREAT);
    game.override.startingBiome(Biome.VOLCANO);
    await game.runToMysteryEncounter();

    expect(scene.currentBattle?.mysteryEncounter?.encounterType).not.toBe(MysteryEncounterType.MYSTERIOUS_CHALLENGERS);
  });

  it("should not run below wave 10", async () => {
    game.override.startingWave(9);

    await game.runToMysteryEncounter();

    expect(scene.currentBattle?.mysteryEncounter?.encounterType).not.toBe(MysteryEncounterType.MYSTERIOUS_CHALLENGERS);
  });

  it("should not run above wave 179", async () => {
    game.override.startingWave(181);

    await game.runToMysteryEncounter();

    expect(scene.currentBattle.mysteryEncounter).toBeUndefined();
  });

  it("should initialize fully", async () => {
    initSceneWithoutEncounterPhase(scene, defaultParty);
    scene.currentBattle.mysteryEncounter = new MysteryEncounter(MysteriousChallengersEncounter);
    const encounter = scene.currentBattle.mysteryEncounter!;
    scene.currentBattle.waveIndex = defaultWave;

    const { onInit } = encounter;

    expect(encounter.onInit).toBeDefined();

    encounter.populateDialogueTokensFromRequirements(scene);
    const onInitResult = onInit!(scene);

    expect(encounter.enemyPartyConfigs).toBeDefined();
    expect(encounter.enemyPartyConfigs.length).toBe(3);
    expect(encounter.enemyPartyConfigs).toEqual([
      {
        trainerConfig: expect.any(TrainerConfig),
        female: expect.any(Boolean),
      },
      {
        trainerConfig: expect.any(TrainerConfig),
        levelAdditiveModifier: 1,
        female: expect.any(Boolean),
      },
      {
        trainerConfig: expect.any(TrainerConfig),
        levelAdditiveModifier: 1.5,
        female: expect.any(Boolean),
      }
    ]);
    expect(encounter.enemyPartyConfigs[1].trainerConfig?.partyTemplates[0]).toEqual(new TrainerPartyCompoundTemplate(
      new TrainerPartyTemplate(1, PartyMemberStrength.STRONGER, false, true),
      new TrainerPartyTemplate(3, PartyMemberStrength.AVERAGE, false, true)
    ));
    expect(encounter.enemyPartyConfigs[2].trainerConfig?.partyTemplates[0]).toEqual(new TrainerPartyCompoundTemplate(
      new TrainerPartyTemplate(2, PartyMemberStrength.AVERAGE),
      new TrainerPartyTemplate(3, PartyMemberStrength.STRONG),
      new TrainerPartyTemplate(1, PartyMemberStrength.STRONGER))
    );
    expect(encounter.spriteConfigs).toBeDefined();
    expect(encounter.spriteConfigs.length).toBe(3);
    expect(onInitResult).toBe(true);
  });

  describe("Option 1 - Normal Battle", () => {
    it("should have the correct properties", () => {
      const option = MysteriousChallengersEncounter.options[0];
      expect(option.optionMode).toBe(MysteryEncounterOptionMode.DEFAULT);
      expect(option.dialogue).toBeDefined();
      expect(option.dialogue).toStrictEqual({
        buttonLabel: `${namespace}:option.1.label`,
        buttonTooltip: `${namespace}:option.1.tooltip`,
        selected: [
          {
            text: `${namespace}:option.selected`,
          },
        ],
      });
    });

    it("should start battle against the trainer", async () => {
      await game.runToMysteryEncounter(MysteryEncounterType.MYSTERIOUS_CHALLENGERS, defaultParty);
      await runMysteryEncounterToEnd(game, 1, undefined, true);

      expect(scene.getCurrentPhase()?.constructor.name).toBe(CommandPhase.name);
      expect(scene.currentBattle.trainer).toBeDefined();
      expect(scene.currentBattle.mysteryEncounter?.encounterMode).toBe(MysteryEncounterMode.TRAINER_BATTLE);
    });

    it("should have normal trainer rewards after battle", async () => {
      await game.runToMysteryEncounter(MysteryEncounterType.MYSTERIOUS_CHALLENGERS, defaultParty);
      await runMysteryEncounterToEnd(game, 1, undefined, true);
      await skipBattleRunMysteryEncounterRewardsPhase(game);
      await game.phaseInterceptor.to(SelectModifierPhase, false);
      expect(scene.getCurrentPhase()?.constructor.name).toBe(SelectModifierPhase.name);
      await game.phaseInterceptor.run(SelectModifierPhase);

      expect(scene.ui.getMode()).to.equal(Mode.MODIFIER_SELECT);
      const modifierSelectHandler = scene.ui.handlers.find(h => h instanceof ModifierSelectUiHandler) as ModifierSelectUiHandler;
      expect(modifierSelectHandler.options.length).toEqual(3);
      expect(modifierSelectHandler.options[0].modifierTypeOption.type.id).toContain("TM_COMMON");
      expect(modifierSelectHandler.options[1].modifierTypeOption.type.id).toContain("TM_GREAT");
      expect(modifierSelectHandler.options[2].modifierTypeOption.type.id).toContain("MEMORY_MUSHROOM");
    });
  });

  describe("Option 2 - Hard Battle", () => {
    it("should have the correct properties", () => {
      const option = MysteriousChallengersEncounter.options[1];
      expect(option.optionMode).toBe(MysteryEncounterOptionMode.DEFAULT);
      expect(option.dialogue).toBeDefined();
      expect(option.dialogue).toStrictEqual({
        buttonLabel: `${namespace}:option.2.label`,
        buttonTooltip: `${namespace}:option.2.tooltip`,
        selected: [
          {
            text: `${namespace}:option.selected`,
          },
        ],
      });
    });

    it("should start battle against the trainer", async () => {
      await game.runToMysteryEncounter(MysteryEncounterType.MYSTERIOUS_CHALLENGERS, defaultParty);
      await runMysteryEncounterToEnd(game, 2, undefined, true);

      expect(scene.getCurrentPhase()?.constructor.name).toBe(CommandPhase.name);
      expect(scene.currentBattle.trainer).toBeDefined();
      expect(scene.currentBattle.mysteryEncounter?.encounterMode).toBe(MysteryEncounterMode.TRAINER_BATTLE);
    });

    it("should have hard trainer rewards after battle", async () => {
      await game.runToMysteryEncounter(MysteryEncounterType.MYSTERIOUS_CHALLENGERS, defaultParty);
      await runMysteryEncounterToEnd(game, 2, undefined, true);
      await skipBattleRunMysteryEncounterRewardsPhase(game);
      await game.phaseInterceptor.to(SelectModifierPhase, false);
      expect(scene.getCurrentPhase()?.constructor.name).toBe(SelectModifierPhase.name);
      await game.phaseInterceptor.run(SelectModifierPhase);

      expect(scene.ui.getMode()).to.equal(Mode.MODIFIER_SELECT);
      const modifierSelectHandler = scene.ui.handlers.find(h => h instanceof ModifierSelectUiHandler) as ModifierSelectUiHandler;
      expect(modifierSelectHandler.options.length).toEqual(4);
      expect(modifierSelectHandler.options[0].modifierTypeOption.type.tier - modifierSelectHandler.options[0].modifierTypeOption.upgradeCount).toBe(ModifierTier.ULTRA);
      expect(modifierSelectHandler.options[1].modifierTypeOption.type.tier - modifierSelectHandler.options[1].modifierTypeOption.upgradeCount).toBe(ModifierTier.ULTRA);
      expect(modifierSelectHandler.options[2].modifierTypeOption.type.tier - modifierSelectHandler.options[2].modifierTypeOption.upgradeCount).toBe(ModifierTier.GREAT);
      expect(modifierSelectHandler.options[3].modifierTypeOption.type.tier - modifierSelectHandler.options[3].modifierTypeOption.upgradeCount).toBe(ModifierTier.GREAT);
    });
  });

  describe("Option 3 - Brutal Battle", () => {
    it("should have the correct properties", () => {
      const option = MysteriousChallengersEncounter.options[2];
      expect(option.optionMode).toBe(MysteryEncounterOptionMode.DEFAULT);
      expect(option.dialogue).toBeDefined();
      expect(option.dialogue).toStrictEqual({
        buttonLabel: `${namespace}:option.3.label`,
        buttonTooltip: `${namespace}:option.3.tooltip`,
        selected: [
          {
            text: `${namespace}:option.selected`,
          },
        ],
      });
    });

    it("should start battle against the trainer", async () => {
      await game.runToMysteryEncounter(MysteryEncounterType.MYSTERIOUS_CHALLENGERS, defaultParty);
      await runMysteryEncounterToEnd(game, 3, undefined, true);

      expect(scene.getCurrentPhase()?.constructor.name).toBe(CommandPhase.name);
      expect(scene.currentBattle.trainer).toBeDefined();
      expect(scene.currentBattle.mysteryEncounter?.encounterMode).toBe(MysteryEncounterMode.TRAINER_BATTLE);
    });

    it("should have brutal trainer rewards after battle", async () => {
      await game.runToMysteryEncounter(MysteryEncounterType.MYSTERIOUS_CHALLENGERS, defaultParty);
      await runMysteryEncounterToEnd(game, 3, undefined, true);
      await skipBattleRunMysteryEncounterRewardsPhase(game);
      await game.phaseInterceptor.to(SelectModifierPhase, false);
      expect(scene.getCurrentPhase()?.constructor.name).toBe(SelectModifierPhase.name);
      await game.phaseInterceptor.run(SelectModifierPhase);

      expect(scene.ui.getMode()).to.equal(Mode.MODIFIER_SELECT);
      const modifierSelectHandler = scene.ui.handlers.find(h => h instanceof ModifierSelectUiHandler) as ModifierSelectUiHandler;
      expect(modifierSelectHandler.options.length).toEqual(4);
      expect(modifierSelectHandler.options[0].modifierTypeOption.type.tier - modifierSelectHandler.options[0].modifierTypeOption.upgradeCount).toBe(ModifierTier.ROGUE);
      expect(modifierSelectHandler.options[1].modifierTypeOption.type.tier - modifierSelectHandler.options[1].modifierTypeOption.upgradeCount).toBe(ModifierTier.ROGUE);
      expect(modifierSelectHandler.options[2].modifierTypeOption.type.tier - modifierSelectHandler.options[2].modifierTypeOption.upgradeCount).toBe(ModifierTier.ULTRA);
      expect(modifierSelectHandler.options[3].modifierTypeOption.type.tier - modifierSelectHandler.options[3].modifierTypeOption.upgradeCount).toBe(ModifierTier.GREAT);
    });
  });
});
