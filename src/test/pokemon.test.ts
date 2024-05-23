import {describe, expect, it} from "vitest";
import {getPokemonSpecies} from "#app/data/pokemon-species";
import {PokemonMove} from "#app/field/pokemon";
import {Species} from "#app/data/enums/species";
import {Moves} from "#app/data/enums/moves";
import PokemonData from "#app/system/pokemon-data";

describe("some tests related to PokemonData and Species", () => {
  it("should create a species", () => {
    const species = getPokemonSpecies(Species.MEW);
    expect(species).not.toBeNull();
  });

  it("should create a pokemon", () => {
    const pokemon = new PokemonData({
      species: Species.MEW,
      level: 1,
    });
    expect(pokemon).not.toBeNull();
    expect(pokemon.level).toEqual(1);
    expect(pokemon.species).toEqual(Species.MEW);
  });

  it("should generate a moveset", () => {
    const pokemon = new PokemonData({
      species: Species.MEW,
      level: 1,
    });
    expect(pokemon.moveset[0].moveId).toBe(Moves.TACKLE);
    expect(pokemon.moveset[1].moveId).toBe(Moves.GROWL);
  });

  it("should create an ennemypokemon", () => {
    const ennemyPokemon = new PokemonData({
      species: Species.MEWTWO,
      level: 100,
    });
    expect(ennemyPokemon).not.toBeNull();
    expect(ennemyPokemon.level).toEqual(100);
    expect(ennemyPokemon.species).toEqual(Species.MEWTWO);
  });

  it("should create an ennemypokemon with specified moveset", () => {
    const ennemyPokemon = new PokemonData({
      species: Species.MEWTWO,
      level: 100,
      moveset: [
        new PokemonMove(Moves.ACID),
        new PokemonMove(Moves.ACROBATICS),
        new PokemonMove(Moves.FOCUS_ENERGY),
      ]
    });
    expect(ennemyPokemon.moveset[0].moveId).toBe(Moves.ACID);
    expect(ennemyPokemon.moveset[1].moveId).toBe(Moves.ACROBATICS);
    expect(ennemyPokemon.moveset[2].moveId).toBe(Moves.FOCUS_ENERGY);
  });
});
