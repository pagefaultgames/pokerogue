import * as MysteryEncounters from "#app/data/mystery-encounters/mystery-encounters";
import { HUMAN_TRANSITABLE_BIOMES } from "#app/data/mystery-encounters/mystery-encounters";
import { Biome } from "#app/enums/biome";
import { MysteryEncounterType } from "#app/enums/mystery-encounter-type";
import { Species } from "#app/enums/species";
import GameManager from "#app/test/utils/gameManager";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { runMysteryEncounterToEnd, runSelectMysteryEncounterOption } from "#test/mystery-encounter/encounter-test-utils";
import BattleScene from "#app/battle-scene";
import { Mode } from "#app/ui/ui";
import { MysteryEncounterOptionMode } from "#enums/mystery-encounter-option-mode";
import { MysteryEncounterTier } from "#enums/mystery-encounter-tier";
import { initSceneWithoutEncounterPhase } from "#test/utils/gameManagerUtils";
import ModifierSelectUiHandler from "#app/ui/modifier-select-ui-handler";
import MysteryEncounter from "#app/data/mystery-encounters/mystery-encounter";
import { Nature } from "#enums/nature";
import { MysteryEncounterPhase } from "#app/phases/mystery-encounter-phases";
import { CommandPhase } from "#app/phases/command-phase";
import { SelectModifierPhase } from "#app/phases/select-modifier-phase";
import { FunAndGamesEncounter } from "#app/data/mystery-encounters/encounters/fun-and-games-encounter";
import { Moves } from "#enums/moves";
import { Command } from "#app/ui/command-ui-handler";
import * as EncounterPhaseUtils from "#app/data/mystery-encounters/utils/encounter-phase-utils";

const namespace = "mysteryEncounter:funAndGames";
const defaultParty = [Species.LAPRAS, Species.GENGAR, Species.ABRA];
const defaultBiome = Biome.CAVE;
const defaultWave = 45;

describe("Fun And Games! - Mystery Encounter", () => {
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
      biomeMap.set(biome, [MysteryEncounterType.FUN_AND_GAMES]);
    });
    vi.spyOn(MysteryEncounters, "mysteryEncountersByBiome", "get").mockReturnValue(biomeMap);
  });

  afterEach(() => {
    game.phaseInterceptor.restoreOg();
    vi.clearAllMocks();
    vi.resetAllMocks();
  });

  it("should have the correct properties", async () => {
    await game.runToMysteryEncounter(MysteryEncounterType.FUN_AND_GAMES, defaultParty);

    expect(FunAndGamesEncounter.encounterType).toBe(MysteryEncounterType.FUN_AND_GAMES);
    expect(FunAndGamesEncounter.encounterTier).toBe(MysteryEncounterTier.GREAT);
    expect(FunAndGamesEncounter.dialogue).toBeDefined();
    expect(FunAndGamesEncounter.dialogue.intro).toStrictEqual([
      {
        speaker: `${namespace}.speaker`,
        text: `${namespace}.intro_dialogue`,
      }
    ]);
    expect(FunAndGamesEncounter.dialogue.encounterOptionsDialogue?.title).toBe(`${namespace}.title`);
    expect(FunAndGamesEncounter.dialogue.encounterOptionsDialogue?.description).toBe(`${namespace}.description`);
    expect(FunAndGamesEncounter.dialogue.encounterOptionsDialogue?.query).toBe(`${namespace}.query`);
    expect(FunAndGamesEncounter.options.length).toBe(2);
  });

  it("should not spawn outside of CIVILIZATIONN biomes", async () => {
    game.override.mysteryEncounterTier(MysteryEncounterTier.GREAT);
    game.override.startingBiome(Biome.VOLCANO);
    await game.runToMysteryEncounter();

    expect(scene.currentBattle?.mysteryEncounter?.encounterType).not.toBe(MysteryEncounterType.FUN_AND_GAMES);
  });

  it("should initialize fully", async () => {
    initSceneWithoutEncounterPhase(scene, defaultParty);
    scene.currentBattle.mysteryEncounter = new MysteryEncounter(FunAndGamesEncounter);
    const encounter = scene.currentBattle.mysteryEncounter!;
    scene.currentBattle.waveIndex = defaultWave;

    const { onInit } = encounter;

    expect(encounter.onInit).toBeDefined();

    const onInitResult = onInit!(scene);
    expect(onInitResult).toBe(true);
  });

  describe("Option 1 - Play the Wobbuffet game", () => {
    it("should have the correct properties", () => {
      const option = FunAndGamesEncounter.options[0];
      expect(option.optionMode).toBe(MysteryEncounterOptionMode.DISABLED_OR_DEFAULT);
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

    it("should NOT be selectable if the player doesn't have enough money", async () => {
      game.scene.money = 0;
      await game.runToMysteryEncounter(MysteryEncounterType.FUN_AND_GAMES, defaultParty);
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

    it("should get 3 turns to attack the Wobbuffet for a reward", async () => {
      scene.money = 20000;
      game.override.moveset([Moves.TACKLE]);
      await game.runToMysteryEncounter(MysteryEncounterType.FUN_AND_GAMES, defaultParty);
      await runMysteryEncounterToEnd(game, 1, { pokemonNo: 1 }, true);

      expect(scene.getCurrentPhase()?.constructor.name).toBe(CommandPhase.name);
      expect(scene.getEnemyPokemon()?.species.speciesId).toBe(Species.WOBBUFFET);
      expect(scene.getEnemyPokemon()?.ivs).toEqual([0, 0, 0, 0, 0, 0]);
      expect(scene.getEnemyPokemon()?.nature).toBe(Nature.MILD);

      game.onNextPrompt("MessagePhase", Mode.MESSAGE, () => {
        game.endPhase();
      });

      // Turn 1
      (game.scene.getCurrentPhase() as CommandPhase).handleCommand(Command.FIGHT, 0, false);
      await game.phaseInterceptor.to(CommandPhase);

      // Turn 2
      (game.scene.getCurrentPhase() as CommandPhase).handleCommand(Command.FIGHT, 0, false);
      await game.phaseInterceptor.to(CommandPhase);

      // Turn 3
      (game.scene.getCurrentPhase() as CommandPhase).handleCommand(Command.FIGHT, 0, false);
      await game.phaseInterceptor.to(SelectModifierPhase, false);

      // Rewards
      expect(scene.getCurrentPhase()?.constructor.name).toBe(SelectModifierPhase.name);
    });

    it("should have no items in rewards if Wubboffet doesn't take enough damage", async () => {
      scene.money = 20000;
      await game.runToMysteryEncounter(MysteryEncounterType.FUN_AND_GAMES, defaultParty);
      await runMysteryEncounterToEnd(game, 1, { pokemonNo: 1 }, true);

      expect(scene.getCurrentPhase()?.constructor.name).toBe(CommandPhase.name);
      game.onNextPrompt("MessagePhase", Mode.MESSAGE, () => {
        game.endPhase();
      });

      // Skip minigame
      scene.currentBattle.mysteryEncounter!.misc.turnsRemaining = 0;
      (game.scene.getCurrentPhase() as CommandPhase).handleCommand(Command.FIGHT, 0, false);
      await game.phaseInterceptor.to(SelectModifierPhase, false);

      // Rewards
      expect(scene.getCurrentPhase()?.constructor.name).toBe(SelectModifierPhase.name);
      await game.phaseInterceptor.run(SelectModifierPhase);

      expect(scene.ui.getMode()).to.equal(Mode.MODIFIER_SELECT);
      const modifierSelectHandler = scene.ui.handlers.find(h => h instanceof ModifierSelectUiHandler) as ModifierSelectUiHandler;
      expect(modifierSelectHandler.options.length).toEqual(0);
    });

    it("should have Wide Lens item in rewards if Wubboffet is at 15-33% HP remaining", async () => {
      scene.money = 20000;
      game.override.moveset([Moves.SPLASH]);
      await game.runToMysteryEncounter(MysteryEncounterType.FUN_AND_GAMES, defaultParty);
      await runMysteryEncounterToEnd(game, 1, { pokemonNo: 1 }, true);

      expect(scene.getCurrentPhase()?.constructor.name).toBe(CommandPhase.name);
      game.onNextPrompt("MessagePhase", Mode.MESSAGE, () => {
        game.endPhase();
      });

      // Skip minigame
      const wobbuffet = scene.getEnemyPokemon()!;
      wobbuffet.hp = Math.floor(0.2 * wobbuffet.getMaxHp());
      scene.currentBattle.mysteryEncounter!.misc.turnsRemaining = 0;
      (game.scene.getCurrentPhase() as CommandPhase).handleCommand(Command.FIGHT, 0, false);
      await game.phaseInterceptor.to(SelectModifierPhase, false);

      // Rewards
      expect(scene.getCurrentPhase()?.constructor.name).toBe(SelectModifierPhase.name);
      await game.phaseInterceptor.run(SelectModifierPhase);

      expect(scene.ui.getMode()).to.equal(Mode.MODIFIER_SELECT);
      const modifierSelectHandler = scene.ui.handlers.find(h => h instanceof ModifierSelectUiHandler) as ModifierSelectUiHandler;
      expect(modifierSelectHandler.options.length).toEqual(1);
      expect(modifierSelectHandler.options[0].modifierTypeOption.type.id).toEqual("WIDE_LENS");
    });

    it("should have Scope Lens item in rewards if Wubboffet is at 3-15% HP remaining", async () => {
      scene.money = 20000;
      game.override.moveset([Moves.SPLASH]);
      await game.runToMysteryEncounter(MysteryEncounterType.FUN_AND_GAMES, defaultParty);
      await runMysteryEncounterToEnd(game, 1, { pokemonNo: 1 }, true);

      expect(scene.getCurrentPhase()?.constructor.name).toBe(CommandPhase.name);
      game.onNextPrompt("MessagePhase", Mode.MESSAGE, () => {
        game.endPhase();
      });

      // Skip minigame
      const wobbuffet = scene.getEnemyPokemon()!;
      wobbuffet.hp = Math.floor(0.1 * wobbuffet.getMaxHp());
      scene.currentBattle.mysteryEncounter!.misc.turnsRemaining = 0;
      (game.scene.getCurrentPhase() as CommandPhase).handleCommand(Command.FIGHT, 0, false);
      await game.phaseInterceptor.to(SelectModifierPhase, false);

      // Rewards
      expect(scene.getCurrentPhase()?.constructor.name).toBe(SelectModifierPhase.name);
      await game.phaseInterceptor.run(SelectModifierPhase);

      expect(scene.ui.getMode()).to.equal(Mode.MODIFIER_SELECT);
      const modifierSelectHandler = scene.ui.handlers.find(h => h instanceof ModifierSelectUiHandler) as ModifierSelectUiHandler;
      expect(modifierSelectHandler.options.length).toEqual(1);
      expect(modifierSelectHandler.options[0].modifierTypeOption.type.id).toEqual("SCOPE_LENS");
    });

    it("should have Multi Lens item in rewards if Wubboffet is at <3% HP remaining", async () => {
      scene.money = 20000;
      game.override.moveset([Moves.SPLASH]);
      await game.runToMysteryEncounter(MysteryEncounterType.FUN_AND_GAMES, defaultParty);
      await runMysteryEncounterToEnd(game, 1, { pokemonNo: 1 }, true);

      expect(scene.getCurrentPhase()?.constructor.name).toBe(CommandPhase.name);
      game.onNextPrompt("MessagePhase", Mode.MESSAGE, () => {
        game.endPhase();
      });

      // Skip minigame
      const wobbuffet = scene.getEnemyPokemon()!;
      wobbuffet.hp = 1;
      scene.currentBattle.mysteryEncounter!.misc.turnsRemaining = 0;
      (game.scene.getCurrentPhase() as CommandPhase).handleCommand(Command.FIGHT, 0, false);
      await game.phaseInterceptor.to(SelectModifierPhase, false);

      // Rewards
      expect(scene.getCurrentPhase()?.constructor.name).toBe(SelectModifierPhase.name);
      await game.phaseInterceptor.run(SelectModifierPhase);

      expect(scene.ui.getMode()).to.equal(Mode.MODIFIER_SELECT);
      const modifierSelectHandler = scene.ui.handlers.find(h => h instanceof ModifierSelectUiHandler) as ModifierSelectUiHandler;
      expect(modifierSelectHandler.options.length).toEqual(1);
      expect(modifierSelectHandler.options[0].modifierTypeOption.type.id).toEqual("MULTI_LENS");
    });
  });

  describe("Option 2 - Leave", () => {
    it("should leave encounter without battle", async () => {
      const leaveEncounterWithoutBattleSpy = vi.spyOn(EncounterPhaseUtils, "leaveEncounterWithoutBattle");

      await game.runToMysteryEncounter(MysteryEncounterType.FUN_AND_GAMES, defaultParty);
      await runMysteryEncounterToEnd(game, 2);

      expect(leaveEncounterWithoutBattleSpy).toBeCalled();
    });
  });
});
