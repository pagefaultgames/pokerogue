import * as MysteryEncounters from "#app/data/mystery-encounters/mystery-encounters";
import { Biome } from "#app/enums/biome";
import { MysteryEncounterType } from "#app/enums/mystery-encounter-type";
import { Species } from "#app/enums/species";
import GameManager from "#app/test/utils/gameManager";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { runMysteryEncounterToEnd, skipBattleRunMysteryEncounterRewardsPhase } from "#test/mystery-encounter/encounter-test-utils";
import BattleScene from "#app/battle-scene";
import { Mode } from "#app/ui/ui";
import ModifierSelectUiHandler from "#app/ui/modifier-select-ui-handler";
import { BerryModifier } from "#app/modifier/modifier";
import { MysteryEncounterOptionMode } from "#enums/mystery-encounter-option-mode";
import { MysteryEncounterTier } from "#enums/mystery-encounter-tier";
import { initSceneWithoutEncounterPhase } from "#test/utils/gameManagerUtils";
import { BerriesAboundEncounter } from "#app/data/mystery-encounters/encounters/berries-abound-encounter";
import * as EncounterPhaseUtils from "#app/data/mystery-encounters/utils/encounter-phase-utils";
import * as EncounterDialogueUtils from "#app/data/mystery-encounters/utils/encounter-dialogue-utils";
import { CommandPhase } from "#app/phases/command-phase";
import { SelectModifierPhase } from "#app/phases/select-modifier-phase";
import { Abilities } from "#enums/abilities";

const namespace = "mysteryEncounters/berriesAbound";
const defaultParty = [ Species.PYUKUMUKU, Species.MAGIKARP, Species.PIKACHU ];
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
    game.override.mysteryEncounterChance(100)
      .mysteryEncounterTier(MysteryEncounterTier.COMMON)
      .startingWave(defaultWave)
      .startingBiome(defaultBiome)
      .disableTrainerWaves()
      .startingModifier([])
      .startingHeldItems([])
      .enemyAbility(Abilities.BALL_FETCH)
      .enemyPassiveAbility(Abilities.BALL_FETCH);

    vi.spyOn(MysteryEncounters, "mysteryEncountersByBiome", "get").mockReturnValue(
      new Map<Biome, MysteryEncounterType[]>([
        [ Biome.CAVE, [ MysteryEncounterType.BERRIES_ABOUND ]],
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

    BerriesAboundEncounter.populateDialogueTokensFromRequirements(scene);
    const onInitResult = onInit!(scene);

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
      expect(scene.getCurrentPhase()?.constructor.name).toBe(CommandPhase.name);
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
      await game.phaseInterceptor.to(SelectModifierPhase, false);
      expect(scene.getCurrentPhase()?.constructor.name).toBe(SelectModifierPhase.name);

      const berriesAfter = scene.findModifiers(m => m instanceof BerryModifier) as BerryModifier[];
      const berriesAfterCount = berriesAfter.reduce((a, b) => a + b.stackCount, 0);

      expect(numBerries).toBe(berriesAfterCount);
    });

    it("should spawn a shop with 5 berries", async () => {
      await game.runToMysteryEncounter(MysteryEncounterType.BERRIES_ABOUND, defaultParty);
      await runMysteryEncounterToEnd(game, 1, undefined, true);
      await skipBattleRunMysteryEncounterRewardsPhase(game);
      await game.phaseInterceptor.to(SelectModifierPhase, false);
      expect(scene.getCurrentPhase()?.constructor.name).toBe(SelectModifierPhase.name);
      await game.phaseInterceptor.run(SelectModifierPhase);

      expect(scene.ui.getMode()).to.equal(Mode.MODIFIER_SELECT);
      const modifierSelectHandler = scene.ui.handlers.find(h => h instanceof ModifierSelectUiHandler) as ModifierSelectUiHandler;
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
      game.override.startingWave(41);
      const encounterTextSpy = vi.spyOn(EncounterDialogueUtils, "showEncounterText");
      await game.runToMysteryEncounter(MysteryEncounterType.BERRIES_ABOUND, defaultParty);

      scene.getParty().forEach(pkm => {
        vi.spyOn(pkm, "getStat").mockReturnValue(1); // for ease return for every stat
      });

      const config = game.scene.currentBattle.mysteryEncounter!.enemyPartyConfigs[0];
      const speciesToSpawn = config.pokemonConfigs?.[0].species.speciesId;

      await runMysteryEncounterToEnd(game, 2, undefined, true);

      const enemyField = scene.getEnemyField();
      expect(scene.getCurrentPhase()?.constructor.name).toBe(CommandPhase.name);
      expect(enemyField.length).toBe(1);
      expect(enemyField[0].species.speciesId).toBe(speciesToSpawn);

      // Should be enraged
      expect(enemyField[0].summonData.statStages).toEqual([ 0, 1, 0, 1, 1, 0, 0 ]);
      expect(encounterTextSpy).toHaveBeenCalledWith(expect.any(BattleScene), `${namespace}:option.2.selected_bad`);
    });

    it("should start battle if fastest pokemon is slower than boss above wave 50", async () => {
      game.override.startingWave(57);
      const encounterTextSpy = vi.spyOn(EncounterDialogueUtils, "showEncounterText");
      await game.runToMysteryEncounter(MysteryEncounterType.BERRIES_ABOUND, defaultParty);

      scene.getParty().forEach(pkm => {
        vi.spyOn(pkm, "getStat").mockReturnValue(1); // for ease return for every stat
      });

      const config = game.scene.currentBattle.mysteryEncounter!.enemyPartyConfigs[0];
      const speciesToSpawn = config.pokemonConfigs?.[0].species.speciesId;

      await runMysteryEncounterToEnd(game, 2, undefined, true);

      const enemyField = scene.getEnemyField();
      expect(scene.getCurrentPhase()?.constructor.name).toBe(CommandPhase.name);
      expect(enemyField.length).toBe(1);
      expect(enemyField[0].species.speciesId).toBe(speciesToSpawn);

      // Should be enraged
      expect(enemyField[0].summonData.statStages).toEqual([ 1, 1, 1, 1, 1, 0, 0 ]);
      expect(encounterTextSpy).toHaveBeenCalledWith(expect.any(BattleScene), `${namespace}:option.2.selected_bad`);
    });

    it("Should skip battle when fastest pokemon is faster than boss", async () => {
      vi.spyOn(EncounterPhaseUtils, "leaveEncounterWithoutBattle");
      vi.spyOn(EncounterDialogueUtils, "showEncounterText");

      await game.runToMysteryEncounter(MysteryEncounterType.BERRIES_ABOUND, defaultParty);

      scene.getParty().forEach(pkm => {
        vi.spyOn(pkm, "getStat").mockReturnValue(9999); // for ease return for every stat
      });

      await runMysteryEncounterToEnd(game, 2);
      await game.phaseInterceptor.to(SelectModifierPhase, false);
      expect(scene.getCurrentPhase()?.constructor.name).toBe(SelectModifierPhase.name);
      await game.phaseInterceptor.run(SelectModifierPhase);

      expect(scene.ui.getMode()).to.equal(Mode.MODIFIER_SELECT);
      const modifierSelectHandler = scene.ui.handlers.find(h => h instanceof ModifierSelectUiHandler) as ModifierSelectUiHandler;
      expect(modifierSelectHandler.options.length).toEqual(5);
      for (const option of modifierSelectHandler.options) {
        expect(option.modifierTypeOption.type.id).toContain("BERRY");
      }

      expect(EncounterDialogueUtils.showEncounterText).toHaveBeenCalledWith(expect.any(BattleScene), `${namespace}:option.2.selected`);
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
