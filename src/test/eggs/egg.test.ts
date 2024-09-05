import { Egg, getLegendaryGachaSpeciesForTimestamp } from "#app/data/egg";
import { EggSourceType } from "#app/enums/egg-source-types";
import { EggTier } from "#app/enums/egg-type";
import { VariantTier } from "#app/enums/variant-tiers";
import EggData from "#app/system/egg-data";
import * as Utils from "#app/utils";
import { Species } from "#enums/species";
import GameManager from "#test/utils/gameManager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

describe("Egg Generation Tests", () => {
  let phaserGame: Phaser.Game;
  let game: GameManager;
  const EGG_HATCH_COUNT: integer = 1000;

  beforeAll(() => {
    phaserGame = new Phaser.Game({
      type: Phaser.HEADLESS,
    });
    game = new GameManager(phaserGame);
  });

  afterEach(() => {
    game.phaseInterceptor.restoreOg();
    vi.restoreAllMocks();
  });

  beforeEach(async () => {
    await game.importData("src/test/utils/saves/everything.prsv");
  });

  it("should return Arceus for the 10th of June", () => {
    const scene = game.scene;
    const timestamp = new Date(2024, 5, 10, 15, 0, 0, 0).getTime();
    const expectedSpecies = Species.ARCEUS;

    const result = getLegendaryGachaSpeciesForTimestamp(scene, timestamp);

    expect(result).toBe(expectedSpecies);
  });
  it("should return Arceus for the 10th of July", () => {
    const scene = game.scene;
    const timestamp = new Date(2024, 6, 10, 15, 0, 0, 0).getTime();
    const expectedSpecies = Species.ARCEUS;

    const result = getLegendaryGachaSpeciesForTimestamp(scene, timestamp);

    expect(result).toBe(expectedSpecies);
  });
  it("should hatch an Arceus around half the time. Set from legendary gacha", async () => {
    const scene = game.scene;
    const timestamp = new Date(2024, 6, 10, 15, 0, 0, 0).getTime();
    const expectedSpecies = Species.ARCEUS;
    let gachaSpeciesCount = 0;

    for (let i = 0; i < EGG_HATCH_COUNT; i++) {
      const result = new Egg({ scene, timestamp, sourceType: EggSourceType.GACHA_LEGENDARY, tier: EggTier.MASTER }).generatePlayerPokemon(scene).species.speciesId;
      if (result === expectedSpecies) {
        gachaSpeciesCount++;
      }
    }

    expect(gachaSpeciesCount).toBeGreaterThan(0.4 * EGG_HATCH_COUNT);
    expect(gachaSpeciesCount).toBeLessThan(0.6 * EGG_HATCH_COUNT);
  });
  it("should hatch an Arceus. Set from species", () => {
    const scene = game.scene;
    const expectedSpecies = Species.ARCEUS;

    const result = new Egg({ scene, species: expectedSpecies }).generatePlayerPokemon(scene).species.speciesId;

    expect(result).toBe(expectedSpecies);
  });
  it("should return an common tier egg", () => {
    const scene = game.scene;
    const expectedTier = EggTier.COMMON;

    const result = new Egg({ scene, tier: expectedTier }).tier;

    expect(result).toBe(expectedTier);
  });
  it("should return an rare tier egg", () => {
    const scene = game.scene;
    const expectedTier = EggTier.GREAT;

    const result = new Egg({ scene, tier: expectedTier }).tier;

    expect(result).toBe(expectedTier);
  });
  it("should return an epic tier egg", () => {
    const scene = game.scene;
    const expectedTier = EggTier.ULTRA;

    const result = new Egg({ scene, tier: expectedTier }).tier;

    expect(result).toBe(expectedTier);
  });
  it("should return an legendary tier egg", () => {
    const scene = game.scene;
    const expectedTier = EggTier.MASTER;

    const result = new Egg({ scene, tier: expectedTier }).tier;

    expect(result).toBe(expectedTier);
  });
  it("should return a manaphy egg set via species", () => {
    const scene = game.scene;
    const expectedResult = true;

    const result = new Egg({ scene, species: Species.MANAPHY }).isManaphyEgg();

    expect(result).toBe(expectedResult);
  });
  it("should return a manaphy egg set via id", () => {
    const scene = game.scene;
    const expectedResult = true;

    const result = new Egg({ scene, tier: EggTier.COMMON, id: 204 }).isManaphyEgg();

    expect(result).toBe(expectedResult);
  });
  it("should return an egg with 1000 hatch waves", () => {
    const scene = game.scene;
    const expectedHatchWaves = 1000;

    const result = new Egg({ scene, hatchWaves: expectedHatchWaves }).hatchWaves;

    expect(result).toBe(expectedHatchWaves);
  });
  it("should return an shiny pokemon", () => {
    const scene = game.scene;
    const expectedResult = true;

    const result = new Egg({ scene, isShiny: expectedResult, species: Species.BULBASAUR }).generatePlayerPokemon(scene).isShiny();

    expect(result).toBe(expectedResult);
  });
  it("should return a shiny common variant", () => {
    const scene = game.scene;
    const expectedVariantTier = VariantTier.COMMON;

    const result = new Egg({ scene, isShiny: true, variantTier: expectedVariantTier, species: Species.BULBASAUR }).generatePlayerPokemon(scene).variant;

    expect(result).toBe(expectedVariantTier);
  });
  it("should return a shiny rare variant", () => {
    const scene = game.scene;
    const expectedVariantTier = VariantTier.RARE;

    const result = new Egg({ scene, isShiny: true, variantTier: expectedVariantTier, species: Species.BULBASAUR }).generatePlayerPokemon(scene).variant;

    expect(result).toBe(expectedVariantTier);
  });
  it("should return a shiny epic variant", () => {
    const scene = game.scene;
    const expectedVariantTier = VariantTier.EPIC;

    const result = new Egg({ scene, isShiny: true, variantTier: expectedVariantTier, species: Species.BULBASAUR }).generatePlayerPokemon(scene).variant;

    expect(result).toBe(expectedVariantTier);
  });
  it("should return an egg with an egg move index of 0, 1, 2 or 3", () => {
    const scene = game.scene;

    const eggMoveIndex = new Egg({ scene }).eggMoveIndex;
    const result = !Utils.isNullOrUndefined(eggMoveIndex) && eggMoveIndex >= 0 && eggMoveIndex <= 3;

    expect(result).toBe(true);
  });
  it("should return an egg with an rare egg move. Egg move index should be 3", () => {
    const scene = game.scene;
    const expectedEggMoveIndex = 3;

    const result = new Egg({ scene, eggMoveIndex: expectedEggMoveIndex }).eggMoveIndex;

    expect(result).toBe(expectedEggMoveIndex);
  });
  it("should return a hatched pokemon with a hidden ability", () => {
    const scene = game.scene;

    const playerPokemon = new Egg({ scene, overrideHiddenAbility: true, species: Species.BULBASAUR }).generatePlayerPokemon(scene);
    const expectedAbilityIndex = playerPokemon.species.ability2 ? 2 : 1;

    const result = playerPokemon.abilityIndex;

    expect(result).toBe(expectedAbilityIndex);
  });
  it("should add the egg to the game data", () => {
    const scene = game.scene;
    const expectedEggCount = 1;

    new Egg({ scene, sourceType: EggSourceType.GACHA_LEGENDARY, pulled: true });

    const result = scene.gameData.eggs.length;

    expect(result).toBe(expectedEggCount);
  });
  it("should override the egg tier to common", () => {
    const scene = game.scene;
    const expectedEggTier = EggTier.COMMON;

    const result = new Egg({ scene, tier: EggTier.MASTER, species: Species.BULBASAUR }).tier;

    expect(result).toBe(expectedEggTier);
  });
  it("should override the egg hatch waves", () => {
    const scene = game.scene;
    const expectedHatchWaves = 10;

    const result = new Egg({ scene, tier: EggTier.MASTER, species: Species.BULBASAUR }).hatchWaves;

    expect(result).toBe(expectedHatchWaves);
  });
  it("should correctly load a legacy egg", () => {
    const legacyEgg = {
      gachaType: 1,
      hatchWaves: 25,
      id: 2077000788,
      timestamp: 1718908955085,
      isShiny: false,
      overrideHiddenAbility: false,
      sourceType: 0,
      species: 0,
      tier: 0,
      variantTier: 0,
      eggMoveIndex: 0,
    };

    const result = new EggData(legacyEgg).toEgg();

    expect(result.tier).toBe(EggTier.GREAT);
    expect(result.id).toBe(legacyEgg.id);
    expect(result.timestamp).toBe(legacyEgg.timestamp);
    expect(result.hatchWaves).toBe(legacyEgg.hatchWaves);
    expect(result.sourceType).toBe(legacyEgg.gachaType);
  });
  it("should increase egg pity", () => {
    const scene = game.scene;
    const startPityValues = [...scene.gameData.eggPity];

    new Egg({ scene, sourceType: EggSourceType.GACHA_MOVE, pulled: true, tier: EggTier.COMMON });

    expect(scene.gameData.eggPity[EggTier.GREAT]).toBe(startPityValues[EggTier.GREAT] + 1);
    expect(scene.gameData.eggPity[EggTier.ULTRA]).toBe(startPityValues[EggTier.ULTRA] + 1);
    expect(scene.gameData.eggPity[EggTier.MASTER]).toBe(startPityValues[EggTier.MASTER] + 1);
  });
  it("should increase legendary egg pity by two", () => {
    const scene = game.scene;
    const startPityValues = [...scene.gameData.eggPity];

    new Egg({ scene, sourceType: EggSourceType.GACHA_LEGENDARY, pulled: true, tier: EggTier.COMMON });

    expect(scene.gameData.eggPity[EggTier.GREAT]).toBe(startPityValues[EggTier.GREAT] + 1);
    expect(scene.gameData.eggPity[EggTier.ULTRA]).toBe(startPityValues[EggTier.ULTRA] + 1);
    expect(scene.gameData.eggPity[EggTier.MASTER]).toBe(startPityValues[EggTier.MASTER] + 2);
  });
  it("should not increase manaphy egg count if bulbasaurs are pulled", () => {
    const scene = game.scene;
    const startingManaphyEggCount = scene.gameData.gameStats.manaphyEggsPulled;

    for (let i = 0; i < 200; i++) {
      new Egg({ scene, sourceType: EggSourceType.GACHA_MOVE, pulled: true, species: Species.BULBASAUR });
    }

    expect(scene.gameData.gameStats.manaphyEggsPulled).toBe(startingManaphyEggCount);
  });
  it("should increase manaphy egg count", () => {
    const scene = game.scene;
    const startingManaphyEggCount = scene.gameData.gameStats.manaphyEggsPulled;

    new Egg({ scene, sourceType: EggSourceType.GACHA_MOVE, pulled: true, id: 204, tier: EggTier.COMMON });

    expect(scene.gameData.gameStats.manaphyEggsPulled).toBe(startingManaphyEggCount + 1);
  });
  it("should increase rare eggs pulled statistic", () => {
    const scene = game.scene;
    const startingRareEggsPulled = scene.gameData.gameStats.rareEggsPulled;

    new Egg({ scene, sourceType: EggSourceType.GACHA_MOVE, pulled: true, tier: EggTier.GREAT });

    expect(scene.gameData.gameStats.rareEggsPulled).toBe(startingRareEggsPulled + 1);
  });
  it("should increase epic eggs pulled statistic", () => {
    const scene = game.scene;
    const startingEpicEggsPulled = scene.gameData.gameStats.epicEggsPulled;

    new Egg({ scene, sourceType: EggSourceType.GACHA_MOVE, pulled: true, tier: EggTier.ULTRA });

    expect(scene.gameData.gameStats.epicEggsPulled).toBe(startingEpicEggsPulled + 1);
  });
  it("should increase legendary eggs pulled statistic", () => {
    const scene = game.scene;
    const startingLegendaryEggsPulled = scene.gameData.gameStats.legendaryEggsPulled;

    new Egg({ scene, sourceType: EggSourceType.GACHA_MOVE, pulled: true, tier: EggTier.MASTER });

    expect(scene.gameData.gameStats.legendaryEggsPulled).toBe(startingLegendaryEggsPulled + 1);
  });
  it("should increase legendary egg rate", () => {
    vi.spyOn(Utils, "randInt").mockReturnValue(1);

    const scene = game.scene;
    const expectedTier1 = EggTier.MASTER;
    const expectedTier2 = EggTier.ULTRA;

    const result1 = new Egg({ scene, sourceType: EggSourceType.GACHA_LEGENDARY, pulled: true }).tier;
    const result2 = new Egg({ scene, sourceType: EggSourceType.GACHA_MOVE, pulled: true }).tier;

    expect(result1).toBe(expectedTier1);
    expect(result2).toBe(expectedTier2);
  });

  it("should generate an epic shiny from pokemon with a different form", () => {
    const scene = game.scene;
    const egg = new Egg({ scene, isShiny: true, variantTier: VariantTier.EPIC, species: Species.MIRAIDON });

    expect(egg.variantTier).toBe(VariantTier.EPIC);
  });

  it("should generate egg moves, species, shinyness, and ability unpredictably for the egg gacha", () => {
    const scene = game.scene;
    scene.setSeed("ABCDEFGHIJKLMNOPQRSTUVWXYZ");
    scene.resetSeed();

    const firstEgg = new Egg({scene, sourceType: EggSourceType.GACHA_SHINY, tier: EggTier.COMMON});
    const firstHatch = firstEgg.generatePlayerPokemon(scene);
    let diffEggMove = false;
    let diffSpecies = false;
    let diffShiny = false;
    let diffAbility = false;
    for (let i = 0; i < EGG_HATCH_COUNT; i++) {
      scene.gameData.unlockPity[EggTier.COMMON] = 0;
      scene.setSeed("ABCDEFGHIJKLMNOPQRSTUVWXYZ");
      scene.resetSeed(); // Make sure that eggs are unpredictable even if using same seed

      const newEgg = new Egg({scene, sourceType: EggSourceType.GACHA_SHINY, tier: EggTier.COMMON});
      const newHatch = newEgg.generatePlayerPokemon(scene);
      diffEggMove = diffEggMove || (newEgg.eggMoveIndex !== firstEgg.eggMoveIndex);
      diffSpecies = diffSpecies || (newHatch.species.speciesId !== firstHatch.species.speciesId);
      diffShiny = diffShiny || (newHatch.shiny !== firstHatch.shiny);
      diffAbility = diffAbility || (newHatch.abilityIndex !== firstHatch.abilityIndex);
    }

    expect(diffEggMove).toBe(true);
    expect(diffSpecies).toBe(true);
    expect(diffShiny).toBe(true);
    expect(diffAbility).toBe(true);
  });

  it("should generate egg moves, shinyness, and ability unpredictably for species eggs", () => {
    const scene = game.scene;
    scene.setSeed("ABCDEFGHIJKLMNOPQRSTUVWXYZ");
    scene.resetSeed();

    const firstEgg = new Egg({scene, species: Species.BULBASAUR});
    const firstHatch = firstEgg.generatePlayerPokemon(scene);
    let diffEggMove = false;
    let diffSpecies = false;
    let diffShiny = false;
    let diffAbility = false;
    for (let i = 0; i < EGG_HATCH_COUNT; i++) {
      scene.setSeed("ABCDEFGHIJKLMNOPQRSTUVWXYZ");
      scene.resetSeed(); // Make sure that eggs are unpredictable even if using same seed

      const newEgg = new Egg({scene, species: Species.BULBASAUR});
      const newHatch = newEgg.generatePlayerPokemon(scene);
      diffEggMove = diffEggMove || (newEgg.eggMoveIndex !== firstEgg.eggMoveIndex);
      diffSpecies = diffSpecies || (newHatch.species.speciesId !== firstHatch.species.speciesId);
      diffShiny = diffShiny || (newHatch.shiny !== firstHatch.shiny);
      diffAbility = diffAbility || (newHatch.abilityIndex !== firstHatch.abilityIndex);
    }

    expect(diffEggMove).toBe(true);
    expect(diffSpecies).toBe(false);
    expect(diffShiny).toBe(true);
    expect(diffAbility).toBe(true);
  });
});
