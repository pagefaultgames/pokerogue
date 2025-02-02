import { Species } from "#app/enums/species";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";
import GameManager from "../utils/gameManager";
import { PokeballType } from "#enums/pokeball";
import type BattleScene from "#app/battle-scene";
import { Moves } from "#app/enums/moves";
import { Type } from "#app/enums/type";
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
    await game.classicMode.runToSummon([ Species.ABRA ]);

    const pkm = game.scene.getPlayerPokemon()!;
    expect(pkm).toBeDefined();

    expect(pkm.trySetStatus(undefined)).toBe(true);
  });

  describe("Add To Party", () => {
    let scene: BattleScene;

    beforeEach(async () => {
      game.override.enemySpecies(Species.ZUBAT);
      await game.classicMode.runToSummon([ Species.ABRA, Species.ABRA, Species.ABRA, Species.ABRA, Species.ABRA ]); // 5 Abra, only 1 slot left
      scene = game.scene;
    });

    it("should append a new pokemon by default", async () => {
      const zubat = scene.getEnemyPokemon()!;
      zubat.addToParty(PokeballType.LUXURY_BALL);

      const party = scene.getPlayerParty();
      expect(party).toHaveLength(6);
      party.forEach((pkm, index) =>{
        expect(pkm.species.speciesId).toBe(index === 5 ? Species.ZUBAT : Species.ABRA);
      });
    });

    it("should put a new pokemon into the passed slotIndex", async () => {
      const slotIndex = 1;
      const zubat = scene.getEnemyPokemon()!;
      zubat.addToParty(PokeballType.LUXURY_BALL, slotIndex);

      const party = scene.getPlayerParty();
      expect(party).toHaveLength(6);
      party.forEach((pkm, index) =>{
        expect(pkm.species.speciesId).toBe(index === slotIndex ? Species.ZUBAT : Species.ABRA);
      });
    });
  });

  it("should not share tms between different forms", async () => {
    game.override.starterForms({ [Species.ROTOM]: 4 });

    await game.classicMode.startBattle([ Species.ROTOM ]);

    const fanRotom = game.scene.getPlayerPokemon()!;

    expect(fanRotom.compatibleTms).not.toContain(Moves.BLIZZARD);
    expect(fanRotom.compatibleTms).toContain(Moves.AIR_SLASH);
  });

  describe("Get correct fusion type", () => {
    let scene: BattleScene;

    beforeEach(async () => {
      game.override.enemySpecies(Species.ZUBAT);
      game.override.starterSpecies(Species.ABRA);
      game.override.enableStarterFusion();
      scene = game.scene;
    });

    it("Fusing two mons with a single type", async () => {
      game.override.starterFusionSpecies(Species.CHARMANDER);
      await game.classicMode.startBattle();
      const pokemon = scene.getPlayerParty()[0];

      let types = pokemon.getTypes();
      expect(types[0]).toBe(Type.PSYCHIC);
      expect(types[1]).toBe(Type.FIRE);

      // Abra Psychic/Grass
      pokemon.customPokemonData.types = [ Type.UNKNOWN, Type.GRASS ];
      types = pokemon.getTypes();
      expect(types[0]).toBe(Type.PSYCHIC);
      expect(types[1]).toBe(Type.FIRE);

      // Abra Grass
      pokemon.customPokemonData.types = [ Type.GRASS, Type.UNKNOWN ];
      types = pokemon.getTypes();
      expect(types[0]).toBe(Type.GRASS);
      expect(types[1]).toBe(Type.FIRE);

      if (!pokemon.fusionCustomPokemonData) {
        pokemon.fusionCustomPokemonData = new CustomPokemonData();
      }
      pokemon.customPokemonData.types = [];

      // Charmander Fire/Grass
      pokemon.fusionCustomPokemonData.types = [ Type.UNKNOWN, Type.GRASS ];
      types = pokemon.getTypes();
      expect(types[0]).toBe(Type.PSYCHIC);
      expect(types[1]).toBe(Type.GRASS);

      // Charmander Grass
      pokemon.fusionCustomPokemonData.types = [ Type.GRASS, Type.UNKNOWN ];
      types = pokemon.getTypes();
      expect(types[0]).toBe(Type.PSYCHIC);
      expect(types[1]).toBe(Type.GRASS);

      // Abra Grass
      // Charmander Fire/Grass
      pokemon.customPokemonData.types = [ Type.GRASS, Type.UNKNOWN ];
      pokemon.fusionCustomPokemonData.types = [ Type.UNKNOWN, Type.GRASS ];
      types = pokemon.getTypes();
      expect(types[0]).toBe(Type.GRASS);
      expect(types[1]).toBe(Type.FIRE);
    });

    it("Fusing two mons with same single type", async () => {
      game.override.starterFusionSpecies(Species.DROWZEE);
      await game.classicMode.startBattle();
      const pokemon = scene.getPlayerParty()[0];

      const types = pokemon.getTypes();
      expect(types[0]).toBe(Type.PSYCHIC);
      expect(types.length).toBe(1);
    });

    it("Fusing mons with one and two types", async () => {
      game.override.starterSpecies(Species.CHARMANDER);
      game.override.starterFusionSpecies(Species.HOUNDOUR);
      await game.classicMode.startBattle();
      const pokemon = scene.getPlayerParty()[0];

      const types = pokemon.getTypes();
      expect(types[0]).toBe(Type.FIRE);
      expect(types[1]).toBe(Type.DARK);
    });

    it("Fusing two mons with two types", async () => {
      game.override.starterSpecies(Species.NATU);
      game.override.starterFusionSpecies(Species.HOUNDOUR);
      await game.classicMode.startBattle();
      const pokemon = scene.getPlayerParty()[0];

      let types = pokemon.getTypes();
      expect(types[0]).toBe(Type.PSYCHIC);
      expect(types[1]).toBe(Type.FIRE);

      // Natu Psychic/Grass
      pokemon.customPokemonData.types = [ Type.UNKNOWN, Type.GRASS ];
      types = pokemon.getTypes();
      expect(types[0]).toBe(Type.PSYCHIC);
      expect(types[1]).toBe(Type.FIRE);

      // Natu Grass/Flying
      pokemon.customPokemonData.types = [ Type.GRASS, Type.UNKNOWN ];
      types = pokemon.getTypes();
      expect(types[0]).toBe(Type.GRASS);
      expect(types[1]).toBe(Type.FIRE);

      if (!pokemon.fusionCustomPokemonData) {
        pokemon.fusionCustomPokemonData = new CustomPokemonData();
      }
      pokemon.customPokemonData.types = [];

      // Houndour Dark/Grass
      pokemon.fusionCustomPokemonData.types = [ Type.UNKNOWN, Type.GRASS ];
      types = pokemon.getTypes();
      expect(types[0]).toBe(Type.PSYCHIC);
      expect(types[1]).toBe(Type.GRASS);

      // Houndour Grass/Fire
      pokemon.fusionCustomPokemonData.types = [ Type.GRASS, Type.UNKNOWN ];
      types = pokemon.getTypes();
      expect(types[0]).toBe(Type.PSYCHIC);
      expect(types[1]).toBe(Type.FIRE);

      // Natu Grass/Flying
      // Houndour Dark/Grass
      pokemon.customPokemonData.types = [ Type.GRASS, Type.UNKNOWN ];
      pokemon.fusionCustomPokemonData.types = [ Type.UNKNOWN, Type.GRASS ];
      types = pokemon.getTypes();
      expect(types[0]).toBe(Type.GRASS);
      expect(types[1]).toBe(Type.DARK);
    });
  });
});
