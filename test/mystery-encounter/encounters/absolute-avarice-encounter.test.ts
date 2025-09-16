import type { BattleScene } from "#app/battle-scene";
import { BerryType } from "#enums/berry-type";
import { BiomeId } from "#enums/biome-id";
import { MoveId } from "#enums/move-id";
import { MysteryEncounterOptionMode } from "#enums/mystery-encounter-option-mode";
import { MysteryEncounterTier } from "#enums/mystery-encounter-tier";
import { MysteryEncounterType } from "#enums/mystery-encounter-type";
import { SpeciesId } from "#enums/species-id";
import { BerryModifier, PokemonHeldItemModifier } from "#modifiers/modifier";
import { AbsoluteAvariceEncounter } from "#mystery-encounters/absolute-avarice-encounter";
import * as EncounterPhaseUtils from "#mystery-encounters/encounter-phase-utils";
import * as MysteryEncounters from "#mystery-encounters/mystery-encounters";
import { MovePhase } from "#phases/move-phase";
import { SelectModifierPhase } from "#phases/select-modifier-phase";
import {
  runMysteryEncounterToEnd,
  skipBattleRunMysteryEncounterRewardsPhase,
} from "#test/mystery-encounter/encounter-test-utils";
import { GameManager } from "#test/test-utils/game-manager";
import i18next from "i18next";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

const namespace = "mysteryEncounters/absoluteAvarice";
const defaultParty = [SpeciesId.LAPRAS, SpeciesId.GENGAR, SpeciesId.ABRA];
const defaultBiome = BiomeId.TALL_GRASS;
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
    game.override
      .mysteryEncounterChance(100)
      .startingWave(defaultWave)
      .startingBiome(defaultBiome)
      .disableTrainerWaves();

    vi.spyOn(MysteryEncounters, "mysteryEncountersByBiome", "get").mockReturnValue(
      new Map<BiomeId, MysteryEncounterType[]>([
        [BiomeId.TALL_GRASS, [MysteryEncounterType.ABSOLUTE_AVARICE]],
        [BiomeId.VOLCANO, [MysteryEncounterType.MYSTERIOUS_CHALLENGERS]],
      ]),
    );
  });

  afterEach(() => {
    game.phaseInterceptor.restoreOg();
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
    game.override.mysteryEncounterTier(MysteryEncounterTier.GREAT).startingBiome(BiomeId.VOLCANO);
    await game.runToMysteryEncounter();

    expect(game.scene.currentBattle.mysteryEncounter?.encounterType).not.toBe(MysteryEncounterType.ABSOLUTE_AVARICE);
  });

  it("should not spawn if player does not have enough berries", async () => {
    scene.modifiers = [];

    await game.runToMysteryEncounter();

    expect(scene.currentBattle?.mysteryEncounter?.encounterType).not.toBe(MysteryEncounterType.ABSOLUTE_AVARICE);
  });

  it("should spawn if player has enough berries", async () => {
    game.override.mysteryEncounterTier(MysteryEncounterTier.GREAT).startingHeldItems([
      { name: "BERRY", count: 2, type: BerryType.SITRUS },
      { name: "BERRY", count: 3, type: BerryType.GANLON },
      { name: "BERRY", count: 2, type: BerryType.APICOT },
    ]);

    await game.runToMysteryEncounter();

    expect(scene.currentBattle?.mysteryEncounter?.encounterType).toBe(MysteryEncounterType.ABSOLUTE_AVARICE);
  });

  it("should remove all player's berries at the start of the encounter", async () => {
    game.override.startingHeldItems([
      { name: "BERRY", count: 2, type: BerryType.SITRUS },
      { name: "BERRY", count: 3, type: BerryType.GANLON },
      { name: "BERRY", count: 2, type: BerryType.APICOT },
    ]);

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
      const phaseSpy = vi.spyOn(scene.phaseManager, "pushPhase");

      await game.runToMysteryEncounter(MysteryEncounterType.ABSOLUTE_AVARICE, defaultParty);
      await runMysteryEncounterToEnd(game, 1, undefined, true);

      const enemyField = scene.getEnemyField();
      expect(game).toBeAtPhase("CommandPhase");
      expect(enemyField.length).toBe(1);
      expect(enemyField[0].species.speciesId).toBe(SpeciesId.GREEDENT);
      const moveset = enemyField[0].moveset.map(m => m.moveId);
      expect(moveset).toEqual([MoveId.THRASH, MoveId.CRUNCH, MoveId.BODY_PRESS, MoveId.SLACK_OFF]);

      const movePhases = phaseSpy.mock.calls.filter(p => p[0] instanceof MovePhase).map(p => p[0]);
      expect(movePhases.length).toBe(1);
      expect(movePhases.filter(p => (p as MovePhase).move.moveId === MoveId.STUFF_CHEEKS).length).toBe(1); // Stuff Cheeks used before battle
    });

    it("should give reviver seed to each pokemon after battle", async () => {
      await game.runToMysteryEncounter(MysteryEncounterType.ABSOLUTE_AVARICE, defaultParty);
      await runMysteryEncounterToEnd(game, 1, undefined, true);
      await skipBattleRunMysteryEncounterRewardsPhase(game);
      await game.phaseInterceptor.to(SelectModifierPhase, false);
      expect(game).toBeAtPhase("SelectModifierPhase");

      for (const partyPokemon of scene.getPlayerParty()) {
        const pokemonId = partyPokemon.id;
        const pokemonItems = scene.findModifiers(
          m => m instanceof PokemonHeldItemModifier && (m as PokemonHeldItemModifier).pokemonId === pokemonId,
          true,
        ) as PokemonHeldItemModifier[];
        const revSeed = pokemonItems.find(
          i => i.type.name === i18next.t("modifierType:ModifierType.REVIVER_SEED.name"),
        );
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

    it("Should return 3 (2/5ths floored) berries if 8 were stolen", { retry: 5 }, async () => {
      game.override.startingHeldItems([
        { name: "BERRY", count: 2, type: BerryType.SITRUS },
        { name: "BERRY", count: 3, type: BerryType.GANLON },
        { name: "BERRY", count: 3, type: BerryType.APICOT },
      ]);

      await game.runToMysteryEncounter(MysteryEncounterType.ABSOLUTE_AVARICE, defaultParty);

      expect(scene.currentBattle?.mysteryEncounter?.encounterType).toBe(MysteryEncounterType.ABSOLUTE_AVARICE);
      expect(scene.modifiers?.length).toBe(0);

      await runMysteryEncounterToEnd(game, 2);

      const berriesAfter = scene.findModifiers(m => m instanceof BerryModifier);
      const berryCountAfter = berriesAfter.reduce((a, b) => a + b.stackCount, 0);
      expect(berriesAfter).toBeDefined();
      expect(berryCountAfter).toBe(3);
    });

    it("Should return 2 (2/5ths floored) berries if 7 were stolen", { retry: 5 }, async () => {
      game.override.startingHeldItems([
        { name: "BERRY", count: 2, type: BerryType.SITRUS },
        { name: "BERRY", count: 3, type: BerryType.GANLON },
        { name: "BERRY", count: 2, type: BerryType.APICOT },
      ]);

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
      const partyCountBefore = scene.getPlayerParty().length;

      await runMysteryEncounterToEnd(game, 3);
      const partyCountAfter = scene.getPlayerParty().length;

      expect(partyCountBefore + 1).toBe(partyCountAfter);
      const greedent = scene.getPlayerParty()[scene.getPlayerParty().length - 1];
      expect(greedent.species.speciesId).toBe(SpeciesId.GREEDENT);
      const moveset = greedent.moveset.map(m => m.moveId);
      expect(moveset?.length).toBe(4);
      expect(moveset).toEqual([MoveId.THRASH, MoveId.BODY_PRESS, MoveId.STUFF_CHEEKS, MoveId.SLACK_OFF]);
    });

    it("should leave encounter without battle", async () => {
      const leaveEncounterWithoutBattleSpy = vi.spyOn(EncounterPhaseUtils, "leaveEncounterWithoutBattle");

      await game.runToMysteryEncounter(MysteryEncounterType.ABSOLUTE_AVARICE, defaultParty);
      await runMysteryEncounterToEnd(game, 3);

      expect(leaveEncounterWithoutBattleSpy).toBeCalled();
    });
  });
});
