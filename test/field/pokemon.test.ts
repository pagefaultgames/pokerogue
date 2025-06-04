import { SpeciesId } from "#enums/species-id";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";
import GameManager from "#test/testUtils/gameManager";
import { PokeballType } from "#enums/pokeball";
import type BattleScene from "#app/battle-scene";
import { MoveId } from "#enums/move-id";
import { PokemonType } from "#enums/pokemon-type";
import { CustomPokemonData } from "#app/data/custom-pokemon-data";

describe("Spec - Pokemon", () => {
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

  beforeEach(() => {
    game = new GameManager(phaserGame);
  });

  it("should not crash when trying to set status of undefined", async () => {
    await game.classicMode.runToSummon([SpeciesId.ABRA]);

    const pkm = game.scene.getPlayerPokemon()!;
    expect(pkm).toBeDefined();

    expect(pkm.trySetStatus(undefined)).toBe(true);
  });

  describe("Add To Party", () => {
    let scene: BattleScene;

    beforeEach(async () => {
      game.override.enemySpecies(SpeciesId.ZUBAT);
      await game.classicMode.runToSummon([
        SpeciesId.ABRA,
        SpeciesId.ABRA,
        SpeciesId.ABRA,
        SpeciesId.ABRA,
        SpeciesId.ABRA,
      ]); // 5 Abra, only 1 slot left
      scene = game.scene;
    });

    it("should append a new pokemon by default", async () => {
      const zubat = scene.getEnemyPokemon()!;
      zubat.addToParty(PokeballType.LUXURY_BALL);

      const party = scene.getPlayerParty();
      expect(party).toHaveLength(6);
      party.forEach((pkm, index) => {
        expect(pkm.species.speciesId).toBe(index === 5 ? SpeciesId.ZUBAT : SpeciesId.ABRA);
      });
    });

    it("should put a new pokemon into the passed slotIndex", async () => {
      const slotIndex = 1;
      const zubat = scene.getEnemyPokemon()!;
      zubat.addToParty(PokeballType.LUXURY_BALL, slotIndex);

      const party = scene.getPlayerParty();
      expect(party).toHaveLength(6);
      party.forEach((pkm, index) => {
        expect(pkm.species.speciesId).toBe(index === slotIndex ? SpeciesId.ZUBAT : SpeciesId.ABRA);
      });
    });
  });

  it("should not share tms between different forms", async () => {
    game.override.starterForms({ [SpeciesId.ROTOM]: 4 });

    await game.classicMode.startBattle([SpeciesId.ROTOM]);

    const fanRotom = game.scene.getPlayerPokemon()!;

    expect(fanRotom.compatibleTms).not.toContain(MoveId.BLIZZARD);
    expect(fanRotom.compatibleTms).toContain(MoveId.AIR_SLASH);
  });

  describe("Get correct fusion type", () => {
    let scene: BattleScene;

    beforeEach(async () => {
      game.override.enemySpecies(SpeciesId.ZUBAT);
      game.override.starterSpecies(SpeciesId.ABRA);
      game.override.enableStarterFusion();
      scene = game.scene;
    });

    it("Fusing two mons with a single type", async () => {
      game.override.starterFusionSpecies(SpeciesId.CHARMANDER);
      await game.classicMode.startBattle();
      const pokemon = scene.getPlayerParty()[0];

      let types = pokemon.getTypes();
      expect(types[0]).toBe(PokemonType.PSYCHIC);
      expect(types[1]).toBe(PokemonType.FIRE);

      pokemon.customPokemonData.types = [PokemonType.UNKNOWN, PokemonType.NORMAL];
      types = pokemon.getTypes();
      expect(types[0]).toBe(PokemonType.PSYCHIC);
      expect(types[1]).toBe(PokemonType.FIRE);

      pokemon.customPokemonData.types = [PokemonType.NORMAL, PokemonType.UNKNOWN];
      types = pokemon.getTypes();
      expect(types[0]).toBe(PokemonType.NORMAL);
      expect(types[1]).toBe(PokemonType.FIRE);

      if (!pokemon.fusionCustomPokemonData) {
        pokemon.fusionCustomPokemonData = new CustomPokemonData();
      }
      pokemon.customPokemonData.types = [];

      pokemon.fusionCustomPokemonData.types = [PokemonType.UNKNOWN, PokemonType.NORMAL];
      types = pokemon.getTypes();
      expect(types[0]).toBe(PokemonType.PSYCHIC);
      expect(types[1]).toBe(PokemonType.NORMAL);

      pokemon.fusionCustomPokemonData.types = [PokemonType.NORMAL, PokemonType.UNKNOWN];
      types = pokemon.getTypes();
      expect(types[0]).toBe(PokemonType.PSYCHIC);
      expect(types[1]).toBe(PokemonType.NORMAL);

      pokemon.customPokemonData.types = [PokemonType.NORMAL, PokemonType.UNKNOWN];
      pokemon.fusionCustomPokemonData.types = [PokemonType.UNKNOWN, PokemonType.NORMAL];
      types = pokemon.getTypes();
      expect(types[0]).toBe(PokemonType.NORMAL);
      expect(types[1]).toBe(PokemonType.FIRE);
    });

    it("Fusing two mons with same single type", async () => {
      game.override.starterFusionSpecies(SpeciesId.DROWZEE);
      await game.classicMode.startBattle();
      const pokemon = scene.getPlayerParty()[0];

      const types = pokemon.getTypes();
      expect(types[0]).toBe(PokemonType.PSYCHIC);
      expect(types.length).toBe(1);
    });

    it("Fusing mons with one and two types", async () => {
      game.override.starterSpecies(SpeciesId.CHARMANDER);
      game.override.starterFusionSpecies(SpeciesId.HOUNDOUR);
      await game.classicMode.startBattle();
      const pokemon = scene.getPlayerParty()[0];

      const types = pokemon.getTypes();
      expect(types[0]).toBe(PokemonType.FIRE);
      expect(types[1]).toBe(PokemonType.DARK);
    });

    it("Fusing mons with two and one types", async () => {
      game.override.starterSpecies(SpeciesId.NUMEL);
      game.override.starterFusionSpecies(SpeciesId.CHARMANDER);
      await game.classicMode.startBattle();
      const pokemon = scene.getPlayerParty()[0];

      const types = pokemon.getTypes();
      expect(types[0]).toBe(PokemonType.FIRE);
      expect(types[1]).toBe(PokemonType.GROUND);
    });

    it("Fusing two mons with two types", async () => {
      game.override.starterSpecies(SpeciesId.NATU);
      game.override.starterFusionSpecies(SpeciesId.HOUNDOUR);
      await game.classicMode.startBattle();
      const pokemon = scene.getPlayerParty()[0];

      let types = pokemon.getTypes();
      expect(types[0]).toBe(PokemonType.PSYCHIC);
      expect(types[1]).toBe(PokemonType.FIRE);

      // Natu Psychic/Grass
      pokemon.customPokemonData.types = [PokemonType.UNKNOWN, PokemonType.GRASS];
      types = pokemon.getTypes();
      expect(types[0]).toBe(PokemonType.PSYCHIC);
      expect(types[1]).toBe(PokemonType.FIRE);

      // Natu Grass/Flying
      pokemon.customPokemonData.types = [PokemonType.GRASS, PokemonType.UNKNOWN];
      types = pokemon.getTypes();
      expect(types[0]).toBe(PokemonType.GRASS);
      expect(types[1]).toBe(PokemonType.FIRE);

      if (!pokemon.fusionCustomPokemonData) {
        pokemon.fusionCustomPokemonData = new CustomPokemonData();
      }
      pokemon.customPokemonData.types = [];

      // Houndour Dark/Grass
      pokemon.fusionCustomPokemonData.types = [PokemonType.UNKNOWN, PokemonType.GRASS];
      types = pokemon.getTypes();
      expect(types[0]).toBe(PokemonType.PSYCHIC);
      expect(types[1]).toBe(PokemonType.GRASS);

      // Houndour Grass/Fire
      pokemon.fusionCustomPokemonData.types = [PokemonType.GRASS, PokemonType.UNKNOWN];
      types = pokemon.getTypes();
      expect(types[0]).toBe(PokemonType.PSYCHIC);
      expect(types[1]).toBe(PokemonType.FIRE);

      // Natu Grass/Flying
      // Houndour Dark/Grass
      pokemon.customPokemonData.types = [PokemonType.GRASS, PokemonType.UNKNOWN];
      pokemon.fusionCustomPokemonData.types = [PokemonType.UNKNOWN, PokemonType.GRASS];
      types = pokemon.getTypes();
      expect(types[0]).toBe(PokemonType.GRASS);
      expect(types[1]).toBe(PokemonType.DARK);
    });
  });

  it.each([5, 25, 55, 95, 145, 195])(
    "should set minimum IVs for enemy trainer pokemon based on wave (%i)",
    async wave => {
      game.override.startingWave(wave);
      await game.classicMode.startBattle([SpeciesId.FEEBAS]);
      const { waveIndex } = game.scene.currentBattle;

      for (const pokemon of game.scene.getEnemyParty()) {
        for (const index in pokemon.ivs) {
          expect(pokemon.ivs[index]).toBeGreaterThanOrEqual(Math.floor(waveIndex / 10));
        }
      }
    },
  );
});
