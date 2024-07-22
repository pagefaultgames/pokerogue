import * as MysteryEncounters from "#app/data/mystery-encounters/mystery-encounters";
import { Biome } from "#app/enums/biome";
import { MysteryEncounterType } from "#app/enums/mystery-encounter-type";
import { Species } from "#app/enums/species";
import GameManager from "#app/test/utils/gameManager";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import Battle from "#app/battle";
import * as EncounterPhaseUtils from "#app/data/mystery-encounters/utils/encounter-phase-utils";
import { EncounterOptionMode } from "#app/data/mystery-encounters/mystery-encounter-option";
import { runSelectMysteryEncounterOption } from "#test/mystery-encounter/encounterTestUtils";
import BattleScene from "#app/battle-scene";
import { MysteryEncounterTier } from "#app/data/mystery-encounters/mystery-encounter";
import { PlayerPokemon } from "#app/field/pokemon";
import { HUMAN_TRANSITABLE_BIOMES } from "#app/data/mystery-encounters/mystery-encounters";
import { PokemonSalesmanEncounter } from "#app/data/mystery-encounters/encounters/pokemon-salesman-encounter";

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
    game.override.mysteryEncounterTier(MysteryEncounterTier.COMMON);
    game.override.startingWave(defaultWave);
    game.override.startingBiome(defaultBiome);

    const biomeMap = new Map<Biome, MysteryEncounterType[]>([
      [Biome.VOLCANO, [MysteryEncounterType.MYSTERIOUS_CHALLENGERS]],
    ]);
    HUMAN_TRANSITABLE_BIOMES.forEach(biome => {
      biomeMap.set(biome, [MysteryEncounterType.POKEMON_SALESMAN]);
    });
    vi.spyOn(MysteryEncounters, "mysteryEncountersByBiome", "get").mockReturnValue(biomeMap);
  });

  afterEach(() => {
    game.phaseInterceptor.restoreOg();
    vi.clearAllMocks();
    vi.resetAllMocks();
  });

  it("should have the correct properties", async () => {
    await game.runToMysteryEncounter(MysteryEncounterType.POKEMON_SALESMAN, defaultParty);

    expect(PokemonSalesmanEncounter.encounterType).toBe(MysteryEncounterType.POKEMON_SALESMAN);
    expect(PokemonSalesmanEncounter.encounterTier).toBe(MysteryEncounterTier.ULTRA);
    expect(PokemonSalesmanEncounter.dialogue).toBeDefined();
    expect(PokemonSalesmanEncounter.dialogue.intro).toStrictEqual([
      { text: `${namespace}:intro` },
      { speaker: "mysteryEncounter:pokemonSalesman:speaker", text: "mysteryEncounter:pokemonSalesman:intro_dialogue" }
    ]);
    expect(PokemonSalesmanEncounter.dialogue.encounterOptionsDialogue.title).toBe(`${namespace}:title`);
    expect(PokemonSalesmanEncounter.dialogue.encounterOptionsDialogue.description).toBe(`${namespace}:description`);
    expect(PokemonSalesmanEncounter.dialogue.encounterOptionsDialogue.query).toBe(`${namespace}:query`);
    expect(PokemonSalesmanEncounter.options.length).toBe(2);
  });

  it("should not spawn outside of HUMAN_TRANSITABLE_BIOMES", async () => {
    game.override.startingBiome(Biome.VOLCANO);
    await game.runToMysteryEncounter();

    expect(scene.currentBattle?.mysteryEncounter?.encounterType).not.toBe(MysteryEncounterType.POKEMON_SALESMAN);
  });

  it("should not run below wave 10", async () => {
    game.override.startingWave(9);

    await game.runToMysteryEncounter();

    expect(scene.currentBattle?.mysteryEncounter?.encounterType).not.toBe(MysteryEncounterType.POKEMON_SALESMAN);
  });

  it("should not run above wave 179", async () => {
    game.override.startingWave(181);

    await game.runToMysteryEncounter();

    expect(scene.currentBattle.mysteryEncounter).toBeUndefined();
  });

  it("should initialize fully ", async () => {
    vi.spyOn(scene, "currentBattle", "get").mockReturnValue({ mysteryEncounter: PokemonSalesmanEncounter } as Battle);

    const { onInit } = PokemonSalesmanEncounter;

    expect(PokemonSalesmanEncounter.onInit).toBeDefined();

    const onInitResult = onInit(scene);

    expect(PokemonSalesmanEncounter.dialogueTokens?.purchasePokemon).toBeDefined();
    expect(PokemonSalesmanEncounter.dialogueTokens?.price).toBeDefined();
    expect(PokemonSalesmanEncounter.misc.pokemon instanceof PlayerPokemon).toBeTruthy();
    expect(PokemonSalesmanEncounter.misc?.price?.toString()).toBe(PokemonSalesmanEncounter.dialogueTokens?.price);
    expect(onInitResult).toBe(true);
  });

  describe("Option 1 - Purchase the pokemon", () => {
    it("should have the correct properties", () => {
      const option1 = PokemonSalesmanEncounter.options[0];
      expect(option1.optionMode).toBe(EncounterOptionMode.DEFAULT_OR_SPECIAL);
      expect(option1.dialogue).toBeDefined();
      expect(option1.dialogue).toStrictEqual({
        buttonLabel: `${namespace}:option:1:label`,
        buttonTooltip: `${namespace}:option:1:tooltip`,
        selected: [
          {
            text: `${namespace}:option:1:selected_message`,
          },
        ],
      });
    });

    it("Should update the player's money properly", async () => {
      const initialMoney = 20000;
      scene.money = initialMoney;
      const updateMoneySpy = vi.spyOn(EncounterPhaseUtils, "updatePlayerMoney");

      await game.runToMysteryEncounter(MysteryEncounterType.POKEMON_SALESMAN, defaultParty);
      await runSelectMysteryEncounterOption(game, 1);

      const price = scene.currentBattle.mysteryEncounter.misc.price;

      expect(updateMoneySpy).toHaveBeenCalledWith(scene, -price, true, false);
      expect(scene.money).toBe(initialMoney - price);
    });

    it("Should add the Pokemon to the party", async () => {
      await game.runToMysteryEncounter(MysteryEncounterType.POKEMON_SALESMAN, defaultParty);

      const initialPartySize = scene.getParty().length;
      const pokemonName = scene.currentBattle.mysteryEncounter.misc.pokemon.name;

      await runSelectMysteryEncounterOption(game, 1);

      expect(scene.getParty().length).toBe(initialPartySize + 1);
      expect(scene.getParty().find(p => p.name === pokemonName) instanceof PlayerPokemon).toBeTruthy();
    });

    it("should leave encounter without battle", async () => {
      const leaveEncounterWithoutBattleSpy = vi.spyOn(EncounterPhaseUtils, "leaveEncounterWithoutBattle");

      await game.runToMysteryEncounter(MysteryEncounterType.POKEMON_SALESMAN, defaultParty);
      await runSelectMysteryEncounterOption(game, 1);

      expect(leaveEncounterWithoutBattleSpy).toBeCalled();
    });
  });

  describe("Option 2 - Leave", () => {
    it("should leave encounter without battle", async () => {
      const leaveEncounterWithoutBattleSpy = vi.spyOn(EncounterPhaseUtils, "leaveEncounterWithoutBattle");

      await game.runToMysteryEncounter(MysteryEncounterType.POKEMON_SALESMAN, defaultParty);
      await runSelectMysteryEncounterOption(game, 2);

      expect(leaveEncounterWithoutBattleSpy).toBeCalled();
    });
  });
});
