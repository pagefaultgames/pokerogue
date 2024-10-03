import BattleScene from "#app/battle-scene";
import { TeleportingHijinksEncounter } from "#app/data/mystery-encounters/encounters/teleporting-hijinks-encounter";
import * as MysteryEncounters from "#app/data/mystery-encounters/mystery-encounters";
import { Abilities } from "#enums/abilities";
import { Biome } from "#enums/biome";
import { MysteryEncounterType } from "#enums/mystery-encounter-type";
import { Species } from "#enums/species";
import { CommandPhase } from "#app/phases/command-phase";
import { MysteryEncounterPhase } from "#app/phases/mystery-encounter-phases";
import { SelectModifierPhase } from "#app/phases/select-modifier-phase";
import GameManager from "#app/test/utils/gameManager";
import ModifierSelectUiHandler from "#app/ui/modifier-select-ui-handler";
import { Mode } from "#app/ui/ui";
import { MysteryEncounterOptionMode } from "#enums/mystery-encounter-option-mode";
import { MysteryEncounterTier } from "#enums/mystery-encounter-tier";
import { runMysteryEncounterToEnd, runSelectMysteryEncounterOption, skipBattleRunMysteryEncounterRewardsPhase } from "#test/mystery-encounter/encounter-test-utils";
import { initSceneWithoutEncounterPhase } from "#test/utils/gameManagerUtils";
import i18next from "i18next";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

const namespace = "mysteryEncounters/teleportingHijinks";
const defaultParty = [Species.LAPRAS, Species.GENGAR, Species.ABRA];
const defaultBiome = Biome.CAVE;
const defaultWave = 45;

const TRANSPORT_BIOMES = [Biome.SPACE, Biome.ISLAND, Biome.LABORATORY, Biome.FAIRY_CAVE, Biome.WASTELAND, Biome.DOJO];

describe("Teleporting Hijinks - Mystery Encounter", () => {
  let phaserGame: Phaser.Game;
  let game: GameManager;
  let scene: BattleScene;

  beforeAll(() => {
    phaserGame = new Phaser.Game({ type: Phaser.HEADLESS });
  });

  beforeEach(async () => {
    game = new GameManager(phaserGame);
    scene = game.scene;
    scene.money = 20000;
    game.override
      .mysteryEncounterChance(100)
      .startingWave(defaultWave)
      .startingBiome(defaultBiome)
      .disableTrainerWaves()
      .enemyAbility(Abilities.BALL_FETCH)
      .enemyPassiveAbility(Abilities.BALL_FETCH);

    vi.spyOn(MysteryEncounters, "mysteryEncountersByBiome", "get").mockReturnValue(
      new Map<Biome, MysteryEncounterType[]>([
        [Biome.CAVE, [MysteryEncounterType.TELEPORTING_HIJINKS]],
      ])
    );
  });

  afterEach(() => {
    game.phaseInterceptor.restoreOg();
    vi.clearAllMocks();
    vi.resetAllMocks();
  });

  it("should have the correct properties", async () => {
    await game.runToMysteryEncounter(MysteryEncounterType.TELEPORTING_HIJINKS, defaultParty);

    expect(TeleportingHijinksEncounter.encounterType).toBe(MysteryEncounterType.TELEPORTING_HIJINKS);
    expect(TeleportingHijinksEncounter.encounterTier).toBe(MysteryEncounterTier.COMMON);
    expect(TeleportingHijinksEncounter.dialogue).toBeDefined();
    expect(TeleportingHijinksEncounter.dialogue.intro).toStrictEqual([{ text: `${namespace}:intro` }]);
    expect(TeleportingHijinksEncounter.dialogue.encounterOptionsDialogue?.title).toBe(`${namespace}:title`);
    expect(TeleportingHijinksEncounter.dialogue.encounterOptionsDialogue?.description).toBe(`${namespace}:description`);
    expect(TeleportingHijinksEncounter.dialogue.encounterOptionsDialogue?.query).toBe(`${namespace}:query`);
    expect(TeleportingHijinksEncounter.options.length).toBe(3);
  });

  it("should run in waves that are X1", async () => {
    game.override.startingWave(11);
    game.override.mysteryEncounterTier(MysteryEncounterTier.COMMON);

    await game.runToMysteryEncounter();

    expect(scene.currentBattle?.mysteryEncounter?.encounterType).toBe(MysteryEncounterType.TELEPORTING_HIJINKS);
  });

  it("should run in waves that are X2", async () => {
    game.override.startingWave(32);
    game.override.mysteryEncounterTier(MysteryEncounterTier.COMMON);

    await game.runToMysteryEncounter();

    expect(scene.currentBattle?.mysteryEncounter?.encounterType).toBe(MysteryEncounterType.TELEPORTING_HIJINKS);
  });

  it("should run in waves that are X3", async () => {
    game.override.startingWave(23);
    game.override.mysteryEncounterTier(MysteryEncounterTier.COMMON);

    await game.runToMysteryEncounter();

    expect(scene.currentBattle?.mysteryEncounter?.encounterType).toBe(MysteryEncounterType.TELEPORTING_HIJINKS);
  });

  it("should NOT run in waves that are not X1, X2, or X3", async () => {
    game.override.startingWave(54);

    await game.runToMysteryEncounter();

    expect(scene.currentBattle.mysteryEncounter).not.toBe(MysteryEncounterType.TELEPORTING_HIJINKS);
  });

  it("should initialize fully", async () => {
    initSceneWithoutEncounterPhase(scene, defaultParty);
    scene.currentBattle.mysteryEncounter = TeleportingHijinksEncounter;

    const { onInit } = TeleportingHijinksEncounter;

    expect(TeleportingHijinksEncounter.onInit).toBeDefined();

    TeleportingHijinksEncounter.populateDialogueTokensFromRequirements(scene);
    const onInitResult = onInit!(scene);

    expect(TeleportingHijinksEncounter.misc.price).toBeDefined();
    expect(TeleportingHijinksEncounter.dialogueTokens.price).toBeDefined();
    expect(onInitResult).toBe(true);
  });

  describe("Option 1 - Pay Money", () => {
    it("should have the correct properties", () => {
      const option = TeleportingHijinksEncounter.options[0];
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
      await game.runToMysteryEncounter(MysteryEncounterType.TELEPORTING_HIJINKS, defaultParty);
      await game.phaseInterceptor.to(MysteryEncounterPhase, false);

      const encounterPhase = scene.getCurrentPhase();
      expect(encounterPhase?.constructor.name).toBe(MysteryEncounterPhase.name);
      const mysteryEncounterPhase = encounterPhase as MysteryEncounterPhase;
      vi.spyOn(mysteryEncounterPhase, "continueEncounter");
      vi.spyOn(mysteryEncounterPhase, "handleOptionSelect");
      vi.spyOn(scene.ui, "playError");

      await runSelectMysteryEncounterOption(game, 1);

      expect(scene.getCurrentPhase()?.constructor.name).toBe(MysteryEncounterPhase.name);
      expect(scene.ui.playError).not.toHaveBeenCalled(); // No error sfx, option is disabled
      expect(mysteryEncounterPhase.handleOptionSelect).not.toHaveBeenCalled();
      expect(mysteryEncounterPhase.continueEncounter).not.toHaveBeenCalled();
    });

    it("should be selectable if the player has enough money", async () => {
      await game.runToMysteryEncounter(MysteryEncounterType.TELEPORTING_HIJINKS, defaultParty);
      await runMysteryEncounterToEnd(game, 1, undefined, true);

      expect(scene.getCurrentPhase()?.constructor.name).toBe(CommandPhase.name);
    });

    it("should transport to a new area", async () => {
      await game.runToMysteryEncounter(MysteryEncounterType.TELEPORTING_HIJINKS, defaultParty);

      const previousBiome = scene.arena.biomeType;

      await runMysteryEncounterToEnd(game, 1, undefined, true);

      expect(previousBiome).not.toBe(scene.arena.biomeType);
      expect(TRANSPORT_BIOMES).toContain(scene.arena.biomeType);
    });

    it("should start a battle against an enraged boss below wave 50", { retry: 5 }, async () => {
      await game.runToMysteryEncounter(MysteryEncounterType.TELEPORTING_HIJINKS, defaultParty);
      await runMysteryEncounterToEnd(game, 1, undefined, true);
      const enemyField = scene.getEnemyField();
      expect(enemyField[0].summonData.statStages).toEqual([0, 1, 0, 1, 1, 0, 0]);
      expect(enemyField[0].isBoss()).toBe(true);
    });

    it("should start a battle against an extra enraged boss above wave 50", { retry: 5 }, async () => {
      game.override.startingWave(56);
      await game.runToMysteryEncounter(MysteryEncounterType.TELEPORTING_HIJINKS, defaultParty);
      await runMysteryEncounterToEnd(game, 1, undefined, true);
      const enemyField = scene.getEnemyField();
      expect(enemyField[0].summonData.statStages).toEqual([1, 1, 1, 1, 1, 0, 0]);
      expect(enemyField[0].isBoss()).toBe(true);
    });
  });

  describe("Option 2 - Use Electric/Steel Typing", () => {
    it("should have the correct properties", () => {
      const option = TeleportingHijinksEncounter.options[1];
      expect(option.optionMode).toBe(MysteryEncounterOptionMode.DISABLED_OR_SPECIAL);
      expect(option.dialogue).toBeDefined();
      expect(option.dialogue).toStrictEqual({
        buttonLabel: `${namespace}:option.2.label`,
        buttonTooltip: `${namespace}:option.2.tooltip`,
        disabledButtonTooltip: `${namespace}:option.2.disabled_tooltip`,
        selected: [
          {
            text: `${namespace}:option.2.selected`,
          }
        ],
      });
    });

    it("should NOT be selectable if the player doesn't the right type pokemon", async () => {
      await game.runToMysteryEncounter(MysteryEncounterType.TELEPORTING_HIJINKS, [Species.BLASTOISE]);
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

    it("should be selectable if the player has the right type pokemon", async () => {
      await game.runToMysteryEncounter(MysteryEncounterType.TELEPORTING_HIJINKS, [Species.METAGROSS]);
      await runMysteryEncounterToEnd(game, 2, undefined, true);

      expect(scene.getCurrentPhase()?.constructor.name).toBe(CommandPhase.name);
    });

    it("should transport to a new area", async () => {
      await game.runToMysteryEncounter(MysteryEncounterType.TELEPORTING_HIJINKS, [Species.PIKACHU]);

      const previousBiome = scene.arena.biomeType;

      await runMysteryEncounterToEnd(game, 2, undefined, true);

      expect(previousBiome).not.toBe(scene.arena.biomeType);
      expect(TRANSPORT_BIOMES).toContain(scene.arena.biomeType);
    });

    it("should start a battle against an enraged boss below wave 50", async () => {
      await game.runToMysteryEncounter(MysteryEncounterType.TELEPORTING_HIJINKS, [Species.PIKACHU]);
      await runMysteryEncounterToEnd(game, 2, undefined, true);
      const enemyField = scene.getEnemyField();
      expect(enemyField[0].summonData.statStages).toEqual([0, 1, 0, 1, 1, 0, 0]);
      expect(enemyField[0].isBoss()).toBe(true);
    });

    it("should start a battle against an extra enraged boss above wave 50", { retry: 5 }, async () => {
      game.override.startingWave(56);
      await game.runToMysteryEncounter(MysteryEncounterType.TELEPORTING_HIJINKS, [Species.PIKACHU]);
      await runMysteryEncounterToEnd(game, 2, undefined, true);
      const enemyField = scene.getEnemyField();
      expect(enemyField[0].summonData.statStages).toEqual([1, 1, 1, 1, 1, 0, 0]);
      expect(enemyField[0].isBoss()).toBe(true);
    });
  });

  describe("Option 3 - Inspect the Machine", () => {
    it("should have the correct properties", () => {
      const option = TeleportingHijinksEncounter.options[2];
      expect(option.optionMode).toBe(MysteryEncounterOptionMode.DEFAULT);
      expect(option.dialogue).toBeDefined();
      expect(option.dialogue).toStrictEqual({
        buttonLabel: `${namespace}:option.3.label`,
        buttonTooltip: `${namespace}:option.3.tooltip`,
        selected: [
          {
            text: `${namespace}:option.3.selected`,
          },
        ],
      });
    });

    it("should start a battle against a boss", async () => {
      await game.runToMysteryEncounter(MysteryEncounterType.TELEPORTING_HIJINKS, defaultParty);
      await runMysteryEncounterToEnd(game, 3, undefined, true);
      const enemyField = scene.getEnemyField();
      expect(enemyField[0].summonData.statStages).toEqual([0, 0, 0, 0, 0, 0, 0]);
      expect(enemyField[0].isBoss()).toBe(true);
    });

    it("should have Magnet and Metal Coat in rewards after battle", async () => {
      await game.runToMysteryEncounter(MysteryEncounterType.TELEPORTING_HIJINKS, defaultParty);
      await runMysteryEncounterToEnd(game, 3, undefined, true);
      await skipBattleRunMysteryEncounterRewardsPhase(game);
      await game.phaseInterceptor.to(SelectModifierPhase, false);
      expect(scene.getCurrentPhase()?.constructor.name).toBe(SelectModifierPhase.name);
      await game.phaseInterceptor.run(SelectModifierPhase);

      expect(scene.ui.getMode()).to.equal(Mode.MODIFIER_SELECT);
      const modifierSelectHandler = scene.ui.handlers.find(h => h instanceof ModifierSelectUiHandler) as ModifierSelectUiHandler;
      expect(modifierSelectHandler.options.some(opt => opt.modifierTypeOption.type.name === i18next.t("modifierType:AttackTypeBoosterItem.metal_coat"))).toBe(true);
      expect(modifierSelectHandler.options.some(opt => opt.modifierTypeOption.type.name === i18next.t("modifierType:AttackTypeBoosterItem.magnet"))).toBe(true);
    });
  });
});
