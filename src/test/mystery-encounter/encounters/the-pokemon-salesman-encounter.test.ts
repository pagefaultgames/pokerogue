import * as MysteryEncounters from "#app/data/mystery-encounters/mystery-encounters";
import { Biome } from "#app/enums/biome";
import { MysteryEncounterType } from "#app/enums/mystery-encounter-type";
import { Species } from "#app/enums/species";
import GameManager from "#app/test/utils/gameManager";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import * as EncounterPhaseUtils from "#app/data/mystery-encounters/utils/encounter-phase-utils";
import { runMysteryEncounterToEnd, runSelectMysteryEncounterOption } from "#test/mystery-encounter/encounter-test-utils";
import BattleScene from "#app/battle-scene";
import { PlayerPokemon } from "#app/field/pokemon";
import { HUMAN_TRANSITABLE_BIOMES } from "#app/data/mystery-encounters/mystery-encounters";
import { ThePokemonSalesmanEncounter } from "#app/data/mystery-encounters/encounters/the-pokemon-salesman-encounter";
import { MysteryEncounterOptionMode } from "#enums/mystery-encounter-option-mode";
import { MysteryEncounterTier } from "#enums/mystery-encounter-tier";
import { initSceneWithoutEncounterPhase } from "#test/utils/gameManagerUtils";
import { MysteryEncounterPhase } from "#app/phases/mystery-encounter-phases";

const namespace = "mysteryEncounter:pokemonSalesman";
const defaultParty = [Species.LAPRAS, Species.GENGAR, Species.ABRA];
const defaultBiome = Biome.CAVE;
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
    game.override.mysteryEncounterChance(100);
    game.override.startingWave(defaultWave);
    game.override.startingBiome(defaultBiome);
    game.override.disableTrainerWaves();

    const biomeMap = new Map<Biome, MysteryEncounterType[]>([
      [Biome.VOLCANO, [MysteryEncounterType.MYSTERIOUS_CHALLENGERS]],
    ]);
    HUMAN_TRANSITABLE_BIOMES.forEach(biome => {
      biomeMap.set(biome, [MysteryEncounterType.THE_POKEMON_SALESMAN]);
    });
    vi.spyOn(MysteryEncounters, "mysteryEncountersByBiome", "get").mockReturnValue(biomeMap);
  });

  afterEach(() => {
    game.phaseInterceptor.restoreOg();
    vi.clearAllMocks();
    vi.resetAllMocks();
  });

  it("should have the correct properties", async () => {
    await game.runToMysteryEncounter(MysteryEncounterType.THE_POKEMON_SALESMAN, defaultParty);

    expect(ThePokemonSalesmanEncounter.encounterType).toBe(MysteryEncounterType.THE_POKEMON_SALESMAN);
    expect(ThePokemonSalesmanEncounter.encounterTier).toBe(MysteryEncounterTier.ULTRA);
    expect(ThePokemonSalesmanEncounter.dialogue).toBeDefined();
    expect(ThePokemonSalesmanEncounter.dialogue.intro).toStrictEqual([
      { text: `${namespace}.intro` },
      { speaker: `${namespace}.speaker`, text: `${namespace}.intro_dialogue` }
    ]);
    expect(ThePokemonSalesmanEncounter.dialogue.encounterOptionsDialogue?.title).toBe(`${namespace}.title`);
    expect(ThePokemonSalesmanEncounter.dialogue.encounterOptionsDialogue?.description).toBe(`${namespace}.description`);
    expect(ThePokemonSalesmanEncounter.dialogue.encounterOptionsDialogue?.query).toBe(`${namespace}.query`);
    expect(ThePokemonSalesmanEncounter.options.length).toBe(2);
  });

  it("should not spawn outside of HUMAN_TRANSITABLE_BIOMES", async () => {
    game.override.mysteryEncounterTier(MysteryEncounterTier.ULTRA);
    game.override.startingBiome(Biome.VOLCANO);
    await game.runToMysteryEncounter();

    expect(scene.currentBattle?.mysteryEncounter?.encounterType).not.toBe(MysteryEncounterType.THE_POKEMON_SALESMAN);
  });

  it("should not run below wave 10", async () => {
    game.override.startingWave(9);

    await game.runToMysteryEncounter();

    expect(scene.currentBattle?.mysteryEncounter?.encounterType).not.toBe(MysteryEncounterType.THE_POKEMON_SALESMAN);
  });

  it("should not run above wave 179", async () => {
    game.override.startingWave(181);

    await game.runToMysteryEncounter();

    expect(scene.currentBattle.mysteryEncounter).toBeUndefined();
  });

  it("should initialize fully ", async () => {
    initSceneWithoutEncounterPhase(scene, defaultParty);
    scene.currentBattle.mysteryEncounter = ThePokemonSalesmanEncounter;

    const { onInit } = ThePokemonSalesmanEncounter;

    expect(ThePokemonSalesmanEncounter.onInit).toBeDefined();

    ThePokemonSalesmanEncounter.populateDialogueTokensFromRequirements(scene);
    const onInitResult = onInit!(scene);

    expect(ThePokemonSalesmanEncounter.dialogueTokens?.purchasePokemon).toBeDefined();
    expect(ThePokemonSalesmanEncounter.dialogueTokens?.price).toBeDefined();
    expect(ThePokemonSalesmanEncounter.misc.pokemon instanceof PlayerPokemon).toBeTruthy();
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
      const option = ThePokemonSalesmanEncounter.options[0];
      expect(option.optionMode).toBe(MysteryEncounterOptionMode.DISABLED_OR_DEFAULT);
      expect(option.dialogue).toBeDefined();
      expect(option.dialogue).toStrictEqual({
        buttonLabel: `${namespace}.option.1.label`,
        buttonTooltip: `${namespace}.option.1.tooltip`,
        selected: [
          {
            text: `${namespace}.option.1.selected_message`,
          },
        ],
      });
    });

    it("Should update the player's money properly", async () => {
      const initialMoney = 20000;
      scene.money = initialMoney;
      const updateMoneySpy = vi.spyOn(EncounterPhaseUtils, "updatePlayerMoney");

      await game.runToMysteryEncounter(MysteryEncounterType.THE_POKEMON_SALESMAN, defaultParty);
      await runMysteryEncounterToEnd(game, 1);

      const price = scene.currentBattle.mysteryEncounter!.misc.price;

      expect(updateMoneySpy).toHaveBeenCalledWith(scene, -price, true, false);
      expect(scene.money).toBe(initialMoney - price);
    });

    it("Should add the Pokemon to the party", async () => {
      scene.money = 20000;
      await game.runToMysteryEncounter(MysteryEncounterType.THE_POKEMON_SALESMAN, defaultParty);

      const initialPartySize = scene.getParty().length;
      const pokemonName = scene.currentBattle.mysteryEncounter!.misc.pokemon.name;

      await runMysteryEncounterToEnd(game, 1);

      expect(scene.getParty().length).toBe(initialPartySize + 1);

      const newlyPurchasedPokemon = scene.getParty().find(p => p.name === pokemonName);
      expect(newlyPurchasedPokemon).toBeDefined();
      expect(newlyPurchasedPokemon!.moveset.length > 0).toBeTruthy();
    });

    it("should be disabled if player does not have enough money", async () => {
      scene.money = 0;
      await game.runToMysteryEncounter(MysteryEncounterType.THE_POKEMON_SALESMAN, defaultParty);
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
