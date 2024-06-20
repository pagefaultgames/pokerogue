import {afterEach, beforeAll, beforeEach, describe, expect, it} from "vitest";
import BattleScene from "../../battle-scene";
import { Egg, getLegendaryGachaSpeciesForTimestamp } from "#app/data/egg.js";
import { Species } from "#enums/species";
import Phaser from "phaser";
import { EggSourceType } from "#app/enums/egg-source-types.js";
import { EggTier } from "#app/enums/egg-type.js";
import { VariantTier } from "#app/enums/variant-tiers.js";
import GameManager from "../utils/gameManager";
import EggData from "#app/system/egg-data.js";

describe("Egg Generation Tests", () => {
  let phaserGame: Phaser.Game;
  let game: GameManager;

  beforeAll(() => {
    phaserGame = new Phaser.Game({
      type: Phaser.HEADLESS,
    });
  });

  afterEach(() => {
    game.phaseInterceptor.restoreOg();
  });

  beforeEach(async() => {
    game = new GameManager(phaserGame);
    await game.importData("src/test/utils/saves/everything.prsv");
  });

  it("should return Arceus for the 10th of June", () => {
    const scene = new BattleScene();
    const timestamp = new Date(2024, 5, 10, 15, 0, 0, 0).getTime();
    const expectedSpecies = Species.ARCEUS;

    const result = getLegendaryGachaSpeciesForTimestamp(scene, timestamp);

    expect(result).toBe(expectedSpecies);
  });
  it("should return Arceus for the 10th of July", () => {
    const scene = new BattleScene();
    const timestamp = new Date(2024, 6, 10, 15, 0, 0, 0).getTime();
    const expectedSpecies = Species.ARCEUS;

    const result = getLegendaryGachaSpeciesForTimestamp(scene, timestamp);

    expect(result).toBe(expectedSpecies);
  });
  it("should hatch an Arceus. Set from legendary gacha", async() => {
    const scene = game.scene;
    const timestamp = new Date(2024, 6, 10, 15, 0, 0, 0).getTime();
    const expectedSpecies = Species.ARCEUS;

    const result = new Egg({scene, timestamp, sourceType: EggSourceType.GACHA_LEGENDARY, tier: EggTier.MASTER}).generatePlayerPokemon(scene).species.speciesId;

    expect(result).toBe(expectedSpecies);
  });
  it("should hatch an Arceus. Set from species", () => {
    const scene = game.scene;
    const expectedSpecies = Species.ARCEUS;

    const result = new Egg({scene,species: expectedSpecies}).generatePlayerPokemon(scene).species.speciesId;

    expect(result).toBe(expectedSpecies);
  });
  it("should return an common tier egg", () => {
    const scene = game.scene;
    const expectedTier = EggTier.COMMON;

    const result = new Egg({scene, tier: expectedTier}).tier;

    expect(result).toBe(expectedTier);
  });
  it("should return an rare tier egg", () => {
    const scene = game.scene;
    const expectedTier = EggTier.GREAT;

    const result = new Egg({scene, tier: expectedTier}).tier;

    expect(result).toBe(expectedTier);
  });
  it("should return an epic tier egg", () => {
    const scene = game.scene;
    const expectedTier = EggTier.ULTRA;

    const result = new Egg({scene, tier: expectedTier}).tier;

    expect(result).toBe(expectedTier);
  });
  it("should return an legendary tier egg", () => {
    const scene = game.scene;
    const expectedTier = EggTier.MASTER;

    const result = new Egg({scene, tier: expectedTier}).tier;

    expect(result).toBe(expectedTier);
  });
  it("should return a manaphy egg set via species", () => {
    const scene = game.scene;
    const expectedResult = true;

    const result = new Egg({scene, species: Species.MANAPHY}).isManaphyEgg();

    expect(result).toBe(expectedResult);
  });
  it("should return a manaphy egg set via id", () => {
    const scene = game.scene;
    const expectedResult = true;

    const result = new Egg({scene, tier: EggTier.COMMON, id: 204}).isManaphyEgg();

    expect(result).toBe(expectedResult);
  });
  it("should return an egg with 1000 hatch waves", () => {
    const scene = game.scene;
    const expectedHatchWaves = 1000;

    const result = new Egg({scene, hatchWaves: expectedHatchWaves}).hatchWaves;

    expect(result).toBe(expectedHatchWaves);
  });
  it("should return an shiny pokemon", () => {
    const scene = game.scene;
    const expectedResult = true;

    const result = new Egg({scene, isShiny: expectedResult, species: Species.BULBASAUR}).generatePlayerPokemon(scene).isShiny();

    expect(result).toBe(expectedResult);
  });
  it("should return a shiny common variant", () => {
    const scene = game.scene;
    const expectedVariantTier = VariantTier.COMMON;

    const result = new Egg({scene, isShiny: true, variantTier: expectedVariantTier, species: Species.BULBASAUR}).generatePlayerPokemon(scene).variant;

    expect(result).toBe(expectedVariantTier);
  });
  it("should return a shiny rare variant", () => {
    const scene = game.scene;
    const expectedVariantTier = VariantTier.RARE;

    const result = new Egg({scene, isShiny: true, variantTier: expectedVariantTier, species: Species.BULBASAUR}).generatePlayerPokemon(scene).variant;

    expect(result).toBe(expectedVariantTier);
  });
  it("should return a shiny epic variant", () => {
    const scene = game.scene;
    const expectedVariantTier = VariantTier.EPIC;

    const result = new Egg({scene, isShiny: true, variantTier: expectedVariantTier, species: Species.BULBASAUR}).generatePlayerPokemon(scene).variant;

    expect(result).toBe(expectedVariantTier);
  });
  it("should return an egg with an egg move index of 0, 1, 2 or 3", () => {
    const scene = game.scene;

    const eggMoveIndex = new Egg({scene}).eggMoveIndex;
    const result = eggMoveIndex && eggMoveIndex >= 0 && eggMoveIndex <= 3;

    expect(result).toBe(true);
  });
  it("should return an egg with an rare egg move. Egg move index should be 3", () => {
    const scene = game.scene;
    const expectedEggMoveIndex = 3;

    const result = new Egg({scene, eggMoveIndex: expectedEggMoveIndex}).eggMoveIndex;

    expect(result).toBe(expectedEggMoveIndex);
  });
  it("should return a hatched pokemon with a hidden ability", () => {
    const scene = game.scene;

    const playerPokemon = new Egg({scene, overrideHiddenAbility: true, species: Species.BULBASAUR}).generatePlayerPokemon(scene);
    const expectedAbilityIndex = playerPokemon.species.ability2 ? 2 : 1;

    const result = playerPokemon.abilityIndex;

    expect(result).toBe(expectedAbilityIndex);
  });
  it("should add the egg to the game data", () => {
    const scene = game.scene;
    const expectedEggCount = 1;

    new Egg({scene, sourceType: EggSourceType.GACHA_LEGENDARY, pulled: true});

    const result = scene.gameData.eggs.length;

    expect(result).toBe(expectedEggCount);
  });
  it("should override the egg tier to common", () => {
    const scene = game.scene;
    const expectedEggTier = EggTier.COMMON;

    const result = new Egg({scene, tier: EggTier.MASTER, species: Species.BULBASAUR}).tier;

    expect(result).toBe(expectedEggTier);
  });
  it("should override the egg hatch waves", () => {
    const scene = game.scene;
    const expectedHatchWaves = 10;

    const result = new Egg({scene, tier: EggTier.MASTER, species: Species.BULBASAUR}).hatchWaves;

    expect(result).toBe(expectedHatchWaves);
  });
  it("should correctly load a legacy egg", () => {
    const legacyEgg = {
      gachaType: 1,
      hatchWaves: 25,
      id: 2077000788,
      timestamp: 1718908955085
    };

    const result = new EggData(legacyEgg);

    expect(result.tier).toBe(EggTier.GREAT);
    expect(result.id).toBe(legacyEgg.id);
    expect(result.timestamp).toBe(legacyEgg.timestamp);
    expect(result.hatchWaves).toBe(legacyEgg.hatchWaves);
    expect(result.sourceType).toBe(legacyEgg.gachaType);
  });
});
