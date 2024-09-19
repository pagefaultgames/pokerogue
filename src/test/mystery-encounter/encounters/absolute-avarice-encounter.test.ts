import { Biome } from "#app/enums/biome";
import { MysteryEncounterType } from "#app/enums/mystery-encounter-type";
import { Species } from "#app/enums/species";
import GameManager from "#app/test/utils/gameManager";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import * as EncounterPhaseUtils from "#app/data/mystery-encounters/utils/encounter-phase-utils";
import { runMysteryEncounterToEnd, skipBattleRunMysteryEncounterRewardsPhase } from "#test/mystery-encounter/encounter-test-utils";
import BattleScene from "#app/battle-scene";
import { MysteryEncounterOptionMode } from "#enums/mystery-encounter-option-mode";
import { MysteryEncounterTier } from "#enums/mystery-encounter-tier";
import * as MysteryEncounters from "#app/data/mystery-encounters/mystery-encounters";
import { BerryModifier, PokemonHeldItemModifier } from "#app/modifier/modifier";
import { BerryType } from "#enums/berry-type";
import { AbsoluteAvariceEncounter } from "#app/data/mystery-encounters/encounters/absolute-avarice-encounter";
import { Moves } from "#enums/moves";
import { CommandPhase } from "#app/phases/command-phase";
import { MovePhase } from "#app/phases/move-phase";
import { SelectModifierPhase } from "#app/phases/select-modifier-phase";

const namespace = "mysteryEncounters/absoluteAvarice";
const defaultParty = [Species.LAPRAS, Species.GENGAR, Species.ABRA];
const defaultBiome = Biome.PLAINS;
const defaultWave = 45;

describe("Absolute Avarice - Mystery Encounter", () => {
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
        [Biome.PLAINS, [MysteryEncounterType.ABSOLUTE_AVARICE]],
        [Biome.VOLCANO, [MysteryEncounterType.MYSTERIOUS_CHALLENGERS]],
      ])
    );
  });

  afterEach(() => {
    game.phaseInterceptor.restoreOg();
    vi.clearAllMocks();
    vi.resetAllMocks();
  });

  it("should have the correct properties", async () => {
    await game.runToMysteryEncounter(MysteryEncounterType.ABSOLUTE_AVARICE, defaultParty);

    expect(AbsoluteAvariceEncounter.encounterType).toBe(MysteryEncounterType.ABSOLUTE_AVARICE);
    expect(AbsoluteAvariceEncounter.encounterTier).toBe(MysteryEncounterTier.GREAT);
    expect(AbsoluteAvariceEncounter.dialogue).toBeDefined();
    expect(AbsoluteAvariceEncounter.dialogue.intro).toStrictEqual([{ text: `${namespace}:intro` }]);
    expect(AbsoluteAvariceEncounter.dialogue.encounterOptionsDialogue?.title).toBe(`${namespace}:title`);
    expect(AbsoluteAvariceEncounter.dialogue.encounterOptionsDialogue?.description).toBe(`${namespace}:description`);
    expect(AbsoluteAvariceEncounter.dialogue.encounterOptionsDialogue?.query).toBe(`${namespace}:query`);
    expect(AbsoluteAvariceEncounter.options.length).toBe(3);
  });

  it("should not spawn outside of proper biomes", async () => {
    game.override.mysteryEncounterTier(MysteryEncounterTier.GREAT);
    game.override.startingBiome(Biome.VOLCANO);
    await game.runToMysteryEncounter();

    expect(game.scene.currentBattle.mysteryEncounter?.encounterType).not.toBe(MysteryEncounterType.ABSOLUTE_AVARICE);
  });

  it("should not spawn if player does not have enough berries", async () => {
    scene.modifiers = [];

    await game.runToMysteryEncounter();

    expect(scene.currentBattle?.mysteryEncounter?.encounterType).not.toBe(MysteryEncounterType.ABSOLUTE_AVARICE);
  });

  it("should spawn if player has enough berries", async () => {
    game.override.mysteryEncounterTier(MysteryEncounterTier.GREAT);
    game.override.startingHeldItems([{name: "BERRY", count: 2, type: BerryType.SITRUS}, {name: "BERRY", count: 3, type: BerryType.GANLON}]);

    await game.runToMysteryEncounter();

    expect(scene.currentBattle?.mysteryEncounter?.encounterType).toBe(MysteryEncounterType.ABSOLUTE_AVARICE);
  });

  it("should remove all player's berries at the start of the encounter", async () => {
    game.override.startingHeldItems([{name: "BERRY", count: 2, type: BerryType.SITRUS}, {name: "BERRY", count: 3, type: BerryType.GANLON}]);

    await game.runToMysteryEncounter(MysteryEncounterType.ABSOLUTE_AVARICE, defaultParty);

    expect(scene.currentBattle?.mysteryEncounter?.encounterType).toBe(MysteryEncounterType.ABSOLUTE_AVARICE);
    expect(scene.modifiers?.length).toBe(0);
  });

  describe("Option 1 - Fight the Greedent", () => {
    it("should have the correct properties", () => {
      const option1 = AbsoluteAvariceEncounter.options[0];
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

    it("should start battle against Greedent", async () => {
      const phaseSpy = vi.spyOn(scene, "pushPhase");

      await game.runToMysteryEncounter(MysteryEncounterType.ABSOLUTE_AVARICE, defaultParty);
      await runMysteryEncounterToEnd(game, 1, undefined, true);

      const enemyField = scene.getEnemyField();
      expect(scene.getCurrentPhase()?.constructor.name).toBe(CommandPhase.name);
      expect(enemyField.length).toBe(1);
      expect(enemyField[0].species.speciesId).toBe(Species.GREEDENT);
      const moveset = enemyField[0].moveset.map(m => m?.moveId);
      expect(moveset?.length).toBe(4);
      expect(moveset).toEqual([Moves.THRASH, Moves.BODY_PRESS, Moves.STUFF_CHEEKS, Moves.SLACK_OFF]);

      const movePhases = phaseSpy.mock.calls.filter(p => p[0] instanceof MovePhase).map(p => p[0]);
      expect(movePhases.length).toBe(1);
      expect(movePhases.filter(p => (p as MovePhase).move.moveId === Moves.STUFF_CHEEKS).length).toBe(1); // Stuff Cheeks used before battle
    });

    it("should give reviver seed to each pokemon after battle", async () => {
      await game.runToMysteryEncounter(MysteryEncounterType.ABSOLUTE_AVARICE, defaultParty);
      await runMysteryEncounterToEnd(game, 1, undefined, true);
      await skipBattleRunMysteryEncounterRewardsPhase(game);
      await game.phaseInterceptor.to(SelectModifierPhase, false);
      expect(scene.getCurrentPhase()?.constructor.name).toBe(SelectModifierPhase.name);

      for (const partyPokemon of scene.getParty()) {
        const pokemonId = partyPokemon.id;
        const pokemonItems = scene.findModifiers(m => m instanceof PokemonHeldItemModifier
          && (m as PokemonHeldItemModifier).pokemonId === pokemonId, true) as PokemonHeldItemModifier[];
        const revSeed = pokemonItems.find(i => i.type.name === "modifierType:ModifierType.REVIVER_SEED.name");
        expect(revSeed).toBeDefined;
        expect(revSeed?.stackCount).toBe(1);
      }
    });
  });

  describe("Option 2 - Reason with It", () => {
    it("should have the correct properties", () => {
      const option = AbsoluteAvariceEncounter.options[1];
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

    it("Should return 3 (2/5ths floored) berries if 8 were stolen", {retry: 5}, async () => {
      game.override.startingHeldItems([{name: "BERRY", count: 2, type: BerryType.SITRUS}, {name: "BERRY", count: 3, type: BerryType.GANLON}, {name: "BERRY", count: 3, type: BerryType.APICOT}]);

      await game.runToMysteryEncounter(MysteryEncounterType.ABSOLUTE_AVARICE, defaultParty);

      expect(scene.currentBattle?.mysteryEncounter?.encounterType).toBe(MysteryEncounterType.ABSOLUTE_AVARICE);
      expect(scene.modifiers?.length).toBe(0);

      await runMysteryEncounterToEnd(game, 2);

      const berriesAfter = scene.findModifiers(m => m instanceof BerryModifier);
      const berryCountAfter = berriesAfter.reduce((a, b) => a + b.stackCount, 0);
      expect(berriesAfter).toBeDefined();
      expect(berryCountAfter).toBe(3);
    });

    it("Should return 2 (2/5ths floored) berries if 7 were stolen", {retry: 5}, async () => {
      game.override.startingHeldItems([{name: "BERRY", count: 2, type: BerryType.SITRUS}, {name: "BERRY", count: 3, type: BerryType.GANLON}, {name: "BERRY", count: 2, type: BerryType.APICOT}]);

      await game.runToMysteryEncounter(MysteryEncounterType.ABSOLUTE_AVARICE, defaultParty);

      expect(scene.currentBattle?.mysteryEncounter?.encounterType).toBe(MysteryEncounterType.ABSOLUTE_AVARICE);
      expect(scene.modifiers?.length).toBe(0);

      await runMysteryEncounterToEnd(game, 2);

      const berriesAfter = scene.findModifiers(m => m instanceof BerryModifier);
      const berryCountAfter = berriesAfter.reduce((a, b) => a + b.stackCount, 0);
      expect(berriesAfter).toBeDefined();
      expect(berryCountAfter).toBe(2);
    });

    it("should leave encounter without battle", async () => {
      const leaveEncounterWithoutBattleSpy = vi.spyOn(EncounterPhaseUtils, "leaveEncounterWithoutBattle");

      await game.runToMysteryEncounter(MysteryEncounterType.ABSOLUTE_AVARICE, defaultParty);
      await runMysteryEncounterToEnd(game, 2);

      expect(leaveEncounterWithoutBattleSpy).toBeCalled();
    });
  });

  describe("Option 3 - Let it have the food", () => {
    it("should have the correct properties", () => {
      const option = AbsoluteAvariceEncounter.options[2];
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

    it("should add Greedent to the party", async () => {
      await game.runToMysteryEncounter(MysteryEncounterType.ABSOLUTE_AVARICE, defaultParty);
      const partyCountBefore = scene.getParty().length;

      await runMysteryEncounterToEnd(game, 3);
      const partyCountAfter = scene.getParty().length;

      expect(partyCountBefore + 1).toBe(partyCountAfter);
      const greedent = scene.getParty()[scene.getParty().length - 1];
      expect(greedent.species.speciesId).toBe(Species.GREEDENT);
      const moveset = greedent.moveset.map(m => m?.moveId);
      expect(moveset?.length).toBe(4);
      expect(moveset).toEqual([Moves.THRASH, Moves.BODY_PRESS, Moves.STUFF_CHEEKS, Moves.SLACK_OFF]);
    });

    it("should leave encounter without battle", async () => {
      const leaveEncounterWithoutBattleSpy = vi.spyOn(EncounterPhaseUtils, "leaveEncounterWithoutBattle");

      await game.runToMysteryEncounter(MysteryEncounterType.ABSOLUTE_AVARICE, defaultParty);
      await runMysteryEncounterToEnd(game, 3);

      expect(leaveEncounterWithoutBattleSpy).toBeCalled();
    });
  });
});
