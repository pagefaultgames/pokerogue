import type { BattleScene } from "#app/battle-scene";
import { NON_LEGEND_PARADOX_POKEMON } from "#balance/special-species-groups";
import { BiomeId } from "#enums/biome-id";
import { MysteryEncounterOptionMode } from "#enums/mystery-encounter-option-mode";
import { MysteryEncounterTier } from "#enums/mystery-encounter-tier";
import { MysteryEncounterType } from "#enums/mystery-encounter-type";
import { SpeciesId } from "#enums/species-id";
import * as EncounterPhaseUtils from "#mystery-encounters/encounter-phase-utils";
import * as MysteryEncounters from "#mystery-encounters/mystery-encounters";
import { HUMAN_TRANSITABLE_BIOMES } from "#mystery-encounters/mystery-encounters";
import {
  getSalesmanSpeciesOffer,
  ThePokemonSalesmanEncounter,
} from "#mystery-encounters/the-pokemon-salesman-encounter";
import { MysteryEncounterPhase } from "#phases/mystery-encounter-phases";
import {
  runMysteryEncounterToEnd,
  runSelectMysteryEncounterOption,
} from "#test/mystery-encounter/encounter-test-utils";
import { GameManager } from "#test/test-utils/game-manager";
import { initSceneWithoutEncounterPhase } from "#test/test-utils/game-manager-utils";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

const namespace = "mysteryEncounters/thePokemonSalesman";
const defaultParty = [SpeciesId.LAPRAS, SpeciesId.GENGAR, SpeciesId.ABRA];
const defaultBiome = BiomeId.CAVE;
const defaultWave = 45;

describe("The Pokemon Salesman - Mystery Encounter", () => {
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

    const biomeMap = new Map<BiomeId, MysteryEncounterType[]>([
      [BiomeId.VOLCANO, [MysteryEncounterType.MYSTERIOUS_CHALLENGERS]],
    ]);
    HUMAN_TRANSITABLE_BIOMES.forEach(biome => {
      biomeMap.set(biome, [MysteryEncounterType.THE_POKEMON_SALESMAN]);
    });
    vi.spyOn(MysteryEncounters, "mysteryEncountersByBiome", "get").mockReturnValue(biomeMap);
  });

  afterEach(() => {
    game.phaseInterceptor.restoreOg();
  });

  it("should have the correct properties", async () => {
    const { encounterType, encounterTier, dialogue, options } = ThePokemonSalesmanEncounter;

    await game.runToMysteryEncounter(MysteryEncounterType.THE_POKEMON_SALESMAN, defaultParty);

    expect(encounterType).toBe(MysteryEncounterType.THE_POKEMON_SALESMAN);
    expect(encounterTier).toBe(MysteryEncounterTier.ULTRA);
    expect(dialogue).toBeDefined();
    expect(dialogue.intro).toStrictEqual([
      { text: `${namespace}:intro` },
      { speaker: `${namespace}:speaker`, text: `${namespace}:introDialogue` },
    ]);
    const { title, description, query } = dialogue.encounterOptionsDialogue!;
    expect(title).toBe(`${namespace}:title`);
    expect(description).toMatch(new RegExp(`^${namespace}\\:description(Shiny)?$`));
    expect(query).toBe(`${namespace}:query`);
    expect(options.length).toBe(2);
  });

  it("should not spawn outside of HUMAN_TRANSITABLE_BIOMES", async () => {
    game.override.mysteryEncounterTier(MysteryEncounterTier.ULTRA).startingBiome(BiomeId.VOLCANO);
    await game.runToMysteryEncounter();

    expect(scene.currentBattle?.mysteryEncounter?.encounterType).not.toBe(MysteryEncounterType.THE_POKEMON_SALESMAN);
  });

  it("should initialize fully ", async () => {
    initSceneWithoutEncounterPhase(scene, defaultParty);
    scene.currentBattle.mysteryEncounter = ThePokemonSalesmanEncounter;

    const { onInit } = ThePokemonSalesmanEncounter;

    expect(ThePokemonSalesmanEncounter.onInit).toBeDefined();

    ThePokemonSalesmanEncounter.populateDialogueTokensFromRequirements();
    const onInitResult = onInit!();

    expect(ThePokemonSalesmanEncounter.dialogueTokens?.purchasePokemon).toBeDefined();
    expect(ThePokemonSalesmanEncounter.dialogueTokens?.price).toBeDefined();
    expect(ThePokemonSalesmanEncounter.misc.pokemon.isPlayer()).toBeTruthy();
    expect(ThePokemonSalesmanEncounter.misc?.price?.toString()).toBe(ThePokemonSalesmanEncounter.dialogueTokens?.price);
    expect(onInitResult).toBe(true);
  });

  it("should not spawn if player does not have enough money", async () => {
    scene.money = 0;

    await game.runToMysteryEncounter();

    expect(scene.currentBattle?.mysteryEncounter?.encounterType).not.toBe(MysteryEncounterType.THE_POKEMON_SALESMAN);
  });

  describe("Option 1 - Purchase the pokemon", () => {
    it("should have the correct properties", () => {
      const { optionMode, dialogue } = ThePokemonSalesmanEncounter.options[0];

      expect(optionMode).toBe(MysteryEncounterOptionMode.DISABLED_OR_DEFAULT);
      expect(dialogue).toBeDefined();
      expect(dialogue).toStrictEqual({
        buttonLabel: `${namespace}:option.1.label`,
        buttonTooltip: expect.stringMatching(new RegExp(`^${namespace}\\:option\\.1\\.tooltip(Shiny)?$`)),
        selected: [
          {
            text: `${namespace}:option.1.selectedMessage`,
          },
        ],
      });
    });

    it("should update the player's money properly", async () => {
      const initialMoney = 20000;
      scene.money = initialMoney;
      const updateMoneySpy = vi.spyOn(EncounterPhaseUtils, "updatePlayerMoney");

      await game.runToMysteryEncounter(MysteryEncounterType.THE_POKEMON_SALESMAN, defaultParty);
      await runMysteryEncounterToEnd(game, 1);

      const price = scene.currentBattle.mysteryEncounter!.misc.price;

      expect(updateMoneySpy).toHaveBeenCalledWith(-price, true, false);
      expect(scene.money).toBe(initialMoney - price);
    });

    it("should add the Pokemon to the party", async () => {
      scene.money = 20000;
      await game.runToMysteryEncounter(MysteryEncounterType.THE_POKEMON_SALESMAN, defaultParty);

      const initialPartySize = scene.getPlayerParty().length;
      const pokemonName = scene.currentBattle.mysteryEncounter!.misc.pokemon.name;

      await runMysteryEncounterToEnd(game, 1);

      expect(scene.getPlayerParty().length).toBe(initialPartySize + 1);

      const newlyPurchasedPokemon = scene.getPlayerParty()[scene.getPlayerParty().length - 1];
      expect(newlyPurchasedPokemon.name).toBe(pokemonName);
      expect(newlyPurchasedPokemon!.moveset.length > 0).toBeTruthy();
    });

    it("should give the purchased Pokemon its HA or make it shiny", async () => {
      scene.money = 20000;
      await game.runToMysteryEncounter(MysteryEncounterType.THE_POKEMON_SALESMAN, defaultParty);
      await runMysteryEncounterToEnd(game, 1);

      const newlyPurchasedPokemon = scene.getPlayerParty()[scene.getPlayerParty().length - 1];
      const isshiny = newlyPurchasedPokemon.shiny;
      const hasHA = newlyPurchasedPokemon.abilityIndex === 2;
      expect(isshiny || hasHA).toBeTruthy();
      expect(isshiny && hasHA).toBeFalsy();
    });

    it("should be disabled if player does not have enough money", async () => {
      scene.money = 0;
      await game.runToMysteryEncounter(MysteryEncounterType.THE_POKEMON_SALESMAN, defaultParty);
      await game.phaseInterceptor.to(MysteryEncounterPhase, false);

      const encounterPhase = scene.phaseManager.getCurrentPhase();
      expect(encounterPhase?.constructor.name).toBe(MysteryEncounterPhase.name);
      const mysteryEncounterPhase = encounterPhase as MysteryEncounterPhase;
      vi.spyOn(mysteryEncounterPhase, "continueEncounter");
      vi.spyOn(mysteryEncounterPhase, "handleOptionSelect");
      vi.spyOn(scene.ui, "playError");

      await runSelectMysteryEncounterOption(game, 1);

      expect(game).toBeAtPhase("MysteryEncounterPhase");
      expect(scene.ui.playError).not.toHaveBeenCalled(); // No error sfx, option is disabled
      expect(mysteryEncounterPhase.handleOptionSelect).not.toHaveBeenCalled();
      expect(mysteryEncounterPhase.continueEncounter).not.toHaveBeenCalled();
    });

    it("should not offer any Paradox Pokemon", async () => {
      const NUM_ROLLS = 2000; // As long as this is greater than total number of species, this should cover all possible RNG rolls
      let rngSweepProgress = 0; // Will simulate full range of RNG rolls by steadily increasing from 0 to 1

      vi.spyOn(Phaser.Math.RND, "realInRange").mockImplementation((min: number, max: number) => {
        return rngSweepProgress * (max - min) + min;
      });
      vi.spyOn(Phaser.Math.RND, "shuffle").mockImplementation((arr: any[]) => arr);

      for (let i = 0; i < NUM_ROLLS; i++) {
        rngSweepProgress = (2 * i + 1) / (2 * NUM_ROLLS);
        const simSpecies = getSalesmanSpeciesOffer().speciesId;
        expect(NON_LEGEND_PARADOX_POKEMON).not.toContain(simSpecies);
      }
    });

    it("should leave encounter without battle", async () => {
      scene.money = 20000;
      const leaveEncounterWithoutBattleSpy = vi.spyOn(EncounterPhaseUtils, "leaveEncounterWithoutBattle");

      await game.runToMysteryEncounter(MysteryEncounterType.THE_POKEMON_SALESMAN, defaultParty);
      await runMysteryEncounterToEnd(game, 1);

      expect(leaveEncounterWithoutBattleSpy).toBeCalled();
    });
  });

  describe("Option 2 - Leave", () => {
    it("should leave encounter without battle", async () => {
      const leaveEncounterWithoutBattleSpy = vi.spyOn(EncounterPhaseUtils, "leaveEncounterWithoutBattle");

      await game.runToMysteryEncounter(MysteryEncounterType.THE_POKEMON_SALESMAN, defaultParty);
      await runMysteryEncounterToEnd(game, 2);

      expect(leaveEncounterWithoutBattleSpy).toBeCalled();
    });
  });
});
