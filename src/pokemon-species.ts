import { GrowthRate } from './exp';
import { PokemonSpeciesEvolutionCondition, pokemonEvolutions } from './pokemon-evolutions';
import { Species } from './species';
import { Type } from './type';
import * as Utils from './utils';

export function getPokemonSpecies(species: Species): PokemonSpecies {
  if (species >= Species.XERNEAS)
    return allSpecies[Species.GENESECT + (species - Species.XERNEAS)];
  return allSpecies[species - 1];
}

export default class PokemonSpecies {
  public speciesId: Species;
  public name: string;
  public pseudoLegendary: boolean;
  public generation: integer;
  public legendary: boolean;
  public mythical: boolean;
  public species: string;
  public type1: integer;
  public type2: integer;
  public height: number;
  public weight: number;
  public ability1: string;
  public ability2: string;
  public abilityHidden: string;
  public baseTotal: integer;
  public baseStats: integer[];
  public catchRate: integer;
  public baseFriendship: integer;
  public baseExp: integer;
  public growthRate: integer;
  public eggType1: string;
  public eggType2: string;
  public malePercent: number;
  public eggCycles: integer;
  public genderDiffs: boolean;

  constructor(id, name, generation, pseudoLegendary, legendary, mythical, species, type1, type2, height, weight, ability1, ability2, abilityHidden, baseTotal, baseHp, baseAtk, baseDef, baseSpatk, baseSpdef, baseSpd, catchRate, baseFriendship, baseExp, growthRate, eggType1, eggType2, malePercent, eggCycles, genderDiffs) {
    this.speciesId = id;
    this.name = name;
    this.generation = generation;
    this.pseudoLegendary = pseudoLegendary === 1;
    this.legendary = legendary === 1;
    this.mythical = mythical === 1;
    this.species = species;
    this.type1 = type1;
    this.type2 = type2;
    this.height = height;
    this.weight = weight;
    this.ability1 = ability1;
    this.ability2 = ability2;
    this.abilityHidden = abilityHidden;
    this.baseTotal = baseTotal;
    this.baseStats = [ baseHp, baseAtk, baseDef, baseSpatk, baseSpdef, baseSpd ];
    this.catchRate = catchRate;
    this.baseFriendship = baseFriendship;
    this.baseExp = baseExp;
    this.growthRate = growthRate;
    this.eggType1 = eggType1;
    this.eggType2 = eggType2;
    this.malePercent = malePercent;
    this.eggCycles = eggCycles;
    this.genderDiffs = genderDiffs === 1;
  }

  isOfType(type: integer) {
    return this.type1 === type || (this.type2 > -1 && this.type2 === type);
  }

  getSpeciesForLevel(level: integer): Species {
    const prevolutionLevels = this.getPrevolutionLevels();

    if (prevolutionLevels.length) {
      for (let pl = prevolutionLevels.length - 1; pl >= 0; pl--) {
        const prevolutionLevel = prevolutionLevels[pl];
        if (level < prevolutionLevel[1])
          return prevolutionLevel[0];
      }
    }

    const evolutionLevels = this.getEvolutionLevels();

    let speciesIds = [];
    let speciesIdsLevel = 0;

    for (let el = evolutionLevels.length - 1; el >= 0; el--) {
      const evolutionLevel = evolutionLevels[el];
      if (level >= evolutionLevel[1]) {
        if (!speciesIdsLevel) {
          speciesIds = [];
          speciesIdsLevel = evolutionLevel[1];
        }
        if (evolutionLevel[1] === speciesIdsLevel)
          speciesIds.push(evolutionLevel[0]);
        else
          break;
      }
    }

    if (speciesIds.length) {
      const levelsAhead = level - speciesIdsLevel;
      if (levelsAhead < 50) {
        const evolutionChance = 0.35 + 0.65 * Phaser.Tweens.Builders.GetEaseFunction('Sine.easeOut')(levelsAhead / 50);
        console.log(speciesIds.map(s => Species[s]), levelsAhead, 'levels ahead', `${evolutionChance * 100}% chance`);
        if (Math.random() > evolutionChance) {
          console.log('failed')
          return this.speciesId;
        } else
          console.log('passed');
      }

      return speciesIds.length === 1
        ? speciesIds[0]
        : speciesIds[Utils.randInt(speciesIds.length)];
    }

    return this.speciesId;
  }

  getEvolutionLevels() {
    const evolutionLevels = [];

    //console.log(Species[this.speciesId], pokemonEvolutions[this.speciesId])

    if (pokemonEvolutions.hasOwnProperty(this.speciesId)) {
      for (let e of pokemonEvolutions[this.speciesId]) {
        const condition = e.condition;
        if (!condition || !condition.applyToWild || condition.predicate(this)) {
          const speciesId = e.speciesId;
          const level = e.level;
          evolutionLevels.push([ speciesId, level ]);
          //console.log(Species[speciesId], getPokemonSpecies(speciesId), getPokemonSpecies(speciesId).getEvolutionLevels());
          const nextEvolutionLevels = getPokemonSpecies(speciesId).getEvolutionLevels();
          for (let npl of nextEvolutionLevels)
            evolutionLevels.push(npl);
        }
      }
    }

    return evolutionLevels;
  }

  getPrevolutionLevels() {
    const prevolutionLevels = [];

    const allEvolvingPokemon = Object.keys(pokemonEvolutions);
    for (let p of allEvolvingPokemon) {
      for (let e of pokemonEvolutions[p]) {
        if (e.speciesId === this.speciesId) {
          const condition = e.condition;
          if (!condition || !condition.applyToWild || condition.predicate(this)) {
            const speciesId = parseInt(p) as Species;
            let level = e.level;
            prevolutionLevels.push([ speciesId, level ]);
            const subPrevolutionLevels = getPokemonSpecies(speciesId).getPrevolutionLevels();
            for (let spl of subPrevolutionLevels)
              prevolutionLevels.push(spl);
            console.log(Species[speciesId])
          }
        }
      }
    }

    return prevolutionLevels;
  }
}

class PokemonForm extends PokemonSpecies {
  public pokemon: PokemonSpecies;
  public formName: string;

  constructor(pokemon, formName, type1, type2, height, weight, ability1, ability2, abilityHidden, baseTotal, baseHp, baseAtk, baseDef, baseSpatk, baseSpdef, baseSpd, catchRate, baseFriendship, baseExp) {
    super(pokemon.id, pokemon.name, pokemon.generation, pokemon.pseudoLegendary, pokemon.legendary, pokemon.mythical, pokemon.species, type1, type2, height, weight, ability1, ability2, abilityHidden, baseTotal, baseHp, baseAtk, baseDef, baseSpatk, baseSpdef, baseSpd, catchRate, baseFriendship, baseExp, pokemon.growthRate, pokemon.eggType1, pokemon.eggType2, pokemon.malePercent, pokemon.eggCycles, pokemon.genderDiffs);
    this.pokemon = pokemon;
    this.formName = formName;
  }
}

export const allSpecies = [
  [ Species.BULBASAUR, "Bulbasaur", 1, 0, 0, 0, "Seed Pokémon", Type.GRASS, Type.POISON, 0.7, 6.9, "Overgrow", null, "Chlorophyll", 318, 45, 49, 49, 65, 65, 45, 45, 70, 64, GrowthRate.MEDIUM_SLOW, "Grass", "Monster", 87.5, 20, 0 ],
  [ Species.IVYSAUR, "Ivysaur", 1, 0, 0, 0, "Seed Pokémon", Type.GRASS, Type.POISON, 1, 13, "Overgrow", null, "Chlorophyll", 405, 60, 62, 63, 80, 80, 60, 45, 70, 142, GrowthRate.MEDIUM_SLOW, "Grass", "Monster", 87.5, 20, 0 ],
  [ Species.VENUSAUR, "Venusaur", 1, 0, 0, 0, "Seed Pokémon", Type.GRASS, Type.POISON, 2, 100, "Overgrow", null, "Chlorophyll", 525, 80, 82, 83, 100, 100, 80, 45, 70, 236, GrowthRate.MEDIUM_SLOW, "Grass", "Monster", 87.5, 20, 0 ],
  [ Species.CHARMANDER, "Charmander", 1, 0, 0, 0, "Lizard Pokémon", Type.FIRE, -1, 0.6, 8.5, "Blaze", null, "Solar Power", 309, 39, 52, 43, 60, 50, 65, 45, 70, 62, GrowthRate.MEDIUM_SLOW, "Dragon", "Monster", 87.5, 20, 0 ],
  [ Species.CHARMELEON, "Charmeleon", 1, 0, 0, 0, "Flame Pokémon", Type.FIRE, -1, 1.1, 19, "Blaze", null, "Solar Power", 405, 58, 64, 58, 80, 65, 80, 45, 70, 142, GrowthRate.MEDIUM_SLOW, "Dragon", "Monster", 87.5, 20, 0 ],
  [ Species.CHARIZARD, "Charizard", 1, 0, 0, 0, "Flame Pokémon", Type.FIRE, Type.FLYING, 1.7, 90.5, "Blaze", null, "Solar Power", 534, 78, 84, 78, 109, 85, 100, 45, 70, 240, GrowthRate.MEDIUM_SLOW, "Dragon", "Monster", 87.5, 20, 0 ],
  [ Species.SQUIRTLE, "Squirtle", 1, 0, 0, 0, "Tiny Turtle Pokémon", Type.WATER, -1, 0.5, 9, "Torrent", null, "Rain Dish", 314, 44, 48, 65, 50, 64, 43, 45, 70, 63, GrowthRate.MEDIUM_SLOW, "Monster", "Water 1", 87.5, 20, 0 ],
  [ Species.WARTORTLE, "Wartortle", 1, 0, 0, 0, "Turtle Pokémon", Type.WATER, -1, 1, 22.5, "Torrent", null, "Rain Dish", 405, 59, 63, 80, 65, 80, 58, 45, 70, 142, GrowthRate.MEDIUM_SLOW, "Monster", "Water 1", 87.5, 20, 0 ],
  [ Species.BLASTOISE, "Blastoise", 1, 0, 0, 0, "Shellfish Pokémon", Type.WATER, -1, 1.6, 85.5, "Torrent", null, "Rain Dish", 530, 79, 83, 100, 85, 105, 78, 45, 70, 239, GrowthRate.MEDIUM_SLOW, "Monster", "Water 1", 87.5, 20, 0 ],
  [ Species.CATERPIE, "Caterpie", 1, 0, 0, 0, "Worm Pokémon", Type.BUG, -1, 0.3, 2.9, "Shield Dust", null, "Run Away", 195, 45, 30, 35, 20, 20, 45, 255, 70, 39, GrowthRate.MEDIUM_FAST, "Bug", null, 50, 15, 0 ],
  [ Species.METAPOD, "Metapod", 1, 0, 0, 0, "Cocoon Pokémon", Type.BUG, -1, 0.7, 9.9, "Shed Skin", null, null, 205, 50, 20, 55, 25, 25, 30, 120, 70, 72, GrowthRate.MEDIUM_FAST, "Bug", null, 50, 15, 0 ],
  [ Species.BUTTERFREE, "Butterfree", 1, 0, 0, 0, "Butterfly Pokémon", Type.BUG, Type.FLYING, 1.1, 32, "Compound Eyes", null, "Tinted Lens", 395, 60, 45, 50, 90, 80, 70, 45, 70, 178, GrowthRate.MEDIUM_FAST, "Bug", null, 50, 15, 1 ],
  [ Species.WEEDLE, "Weedle", 1, 0, 0, 0, "Hairy Bug Pokémon", Type.BUG, Type.POISON, 0.3, 3.2, "Shield Dust", null, "Run Away", 195, 40, 35, 30, 20, 20, 50, 255, 70, 39, GrowthRate.MEDIUM_FAST, "Bug", null, 50, 15, 0 ],
  [ Species.KAKUNA, "Kakuna", 1, 0, 0, 0, "Cocoon Pokémon", Type.BUG, Type.POISON, 0.6, 10, "Shed Skin", null, null, 205, 45, 25, 50, 25, 25, 35, 120, 70, 72, GrowthRate.MEDIUM_FAST, "Bug", null, 50, 15, 0 ],
  [ Species.BEEDRILL, "Beedrill", 1, 0, 0, 0, "Poison Bee Pokémon", Type.BUG, Type.POISON, 1, 29.5, "Swarm", null, "Sniper", 395, 65, 90, 40, 45, 80, 75, 45, 70, 178, GrowthRate.MEDIUM_FAST, "Bug", null, 50, 15, 0 ],
  [ Species.PIDGEY, "Pidgey", 1, 0, 0, 0, "Tiny Bird Pokémon", Type.NORMAL, Type.FLYING, 0.3, 1.8, "Keen Eye", "Tangled Feet", "Big Pecks", 251, 40, 45, 40, 35, 35, 56, 255, 70, 50, GrowthRate.MEDIUM_SLOW, "Flying", null, 50, 15, 0 ],
  [ Species.PIDGEOTTO, "Pidgeotto", 1, 0, 0, 0, "Bird Pokémon", Type.NORMAL, Type.FLYING, 1.1, 30, "Keen Eye", "Tangled Feet", "Big Pecks", 349, 63, 60, 55, 50, 50, 71, 120, 70, 122, GrowthRate.MEDIUM_SLOW, "Flying", null, 50, 15, 0 ],
  [ Species.PIDGEOT, "Pidgeot", 1, 0, 0, 0, "Bird Pokémon", Type.NORMAL, Type.FLYING, 1.5, 39.5, "Keen Eye", "Tangled Feet", "Big Pecks", 479, 83, 80, 75, 70, 70, 101, 45, 70, 216, GrowthRate.MEDIUM_SLOW, "Flying", null, 50, 15, 0 ],
  [ Species.RATTATA, "Rattata", 1, 0, 0, 0, "Mouse Pokémon", Type.NORMAL, -1, 0.3, 3.5, "Run Away", "Guts", "Hustle", 253, 30, 56, 35, 25, 35, 72, 255, 70, 51, GrowthRate.MEDIUM_FAST, "Field", null, 50, 15, 1 ],
  [ Species.RATICATE, "Raticate", 1, 0, 0, 0, "Mouse Pokémon", Type.NORMAL, -1, 0.7, 18.5, "Run Away", "Guts", "Hustle", 413, 55, 81, 60, 50, 70, 97, 127, 70, 145, GrowthRate.MEDIUM_FAST, "Field", null, 50, 15, 1 ],
  [ Species.SPEAROW, "Spearow", 1, 0, 0, 0, "Tiny Bird Pokémon", Type.NORMAL, Type.FLYING, 0.3, 2, "Keen Eye", null, "Sniper", 262, 40, 60, 30, 31, 31, 70, 255, 70, 52, GrowthRate.MEDIUM_FAST, "Flying", null, 50, 15, 0 ],
  [ Species.FEAROW, "Fearow", 1, 0, 0, 0, "Beak Pokémon", Type.NORMAL, Type.FLYING, 1.2, 38, "Keen Eye", null, "Sniper", 442, 65, 90, 65, 61, 61, 100, 90, 70, 155, GrowthRate.MEDIUM_FAST, "Flying", null, 50, 15, 0 ],
  [ Species.EKANS, "Ekans", 1, 0, 0, 0, "Snake Pokémon", Type.POISON, -1, 2, 6.9, "Intimidate", "Shed Skin", "Unnerve", 288, 35, 60, 44, 40, 54, 55, 255, 70, 58, GrowthRate.MEDIUM_FAST, "Dragon", "Field", 50, 20, 0 ],
  [ Species.ARBOK, "Arbok", 1, 0, 0, 0, "Cobra Pokémon", Type.POISON, -1, 3.5, 65, "Intimidate", "Shed Skin", "Unnerve", 448, 60, 95, 69, 65, 79, 80, 90, 70, 157, GrowthRate.MEDIUM_FAST, "Dragon", "Field", 50, 20, 0 ],
  [ Species.PIKACHU, "Pikachu", 1, 0, 0, 0, "Mouse Pokémon", Type.ELECTRIC, -1, 0.4, 6, "Static", null, "Lightning Rod", 320, 35, 55, 40, 50, 50, 90, 190, 70, 112, GrowthRate.MEDIUM_FAST, "Fairy", "Field", 50, 10, 1 ],
  [ Species.RAICHU, "Raichu", 1, 0, 0, 0, "Mouse Pokémon", Type.ELECTRIC, -1, 0.8, 30, "Static", null, "Lightning Rod", 485, 60, 90, 55, 90, 80, 110, 75, 70, 218, GrowthRate.MEDIUM_FAST, "Fairy", "Field", 50, 10, 1 ],
  [ Species.SANDSHREW, "Sandshrew", 1, 0, 0, 0, "Mouse Pokémon", Type.GROUND, -1, 0.6, 12, "Sand Veil", null, "Sand Rush", 300, 50, 75, 85, 20, 30, 40, 255, 70, 60, GrowthRate.MEDIUM_FAST, "Field", null, 50, 20, 0 ],
  [ Species.SANDSLASH, "Sandslash", 1, 0, 0, 0, "Mouse Pokémon", Type.GROUND, -1, 1, 29.5, "Sand Veil", null, "Sand Rush", 450, 75, 100, 110, 45, 55, 65, 90, 70, 158, GrowthRate.MEDIUM_FAST, "Field", null, 50, 20, 0 ],
  [ Species.NIDORAN_F, "Nidoran♀", 1, 0, 0, 0, "Poison Pin Pokémon", Type.POISON, -1, 0.4, 7, "Poison Point", "Rivalry", "Hustle", 275, 55, 47, 52, 40, 40, 41, 235, 70, 55, GrowthRate.MEDIUM_SLOW, "Field", "Monster", 0, 20, 0 ],
  [ Species.NIDORINA, "Nidorina", 1, 0, 0, 0, "Poison Pin Pokémon", Type.POISON, -1, 0.8, 20, "Poison Point", "Rivalry", "Hustle", 365, 70, 62, 67, 55, 55, 56, 120, 70, 128, GrowthRate.MEDIUM_SLOW, "Undiscovered", null, 0, 20, 0 ],
  [ Species.NIDOQUEEN, "Nidoqueen", 1, 0, 0, 0, "Drill Pokémon", Type.POISON, Type.GROUND, 1.3, 60, "Poison Point", "Rivalry", "Sheer Force", 505, 90, 92, 87, 75, 85, 76, 45, 70, 227, GrowthRate.MEDIUM_SLOW, "Undiscovered", null, 0, 20, 0 ],
  [ Species.NIDORAN_M, "Nidoran♂", 1, 0, 0, 0, "Poison Pin Pokémon", Type.POISON, -1, 0.5, 9, "Poison Point", "Rivalry", "Hustle", 273, 46, 57, 40, 40, 40, 50, 235, 70, 55, GrowthRate.MEDIUM_SLOW, "Field", "Monster", 100, 20, 0 ],
  [ Species.NIDORINO, "Nidorino", 1, 0, 0, 0, "Poison Pin Pokémon", Type.POISON, -1, 0.9, 19.5, "Poison Point", "Rivalry", "Hustle", 365, 61, 72, 57, 55, 55, 65, 120, 70, 128, GrowthRate.MEDIUM_SLOW, "Field", "Monster", 100, 20, 0 ],
  [ Species.NIDOKING, "Nidoking", 1, 0, 0, 0, "Drill Pokémon", Type.POISON, Type.GROUND, 1.4, 62, "Poison Point", "Rivalry", "Sheer Force", 505, 81, 102, 77, 85, 75, 85, 45, 70, 227, GrowthRate.MEDIUM_SLOW, "Field", "Monster", 100, 20, 0 ],
  [ Species.CLEFAIRY, "Clefairy", 1, 0, 0, 0, "Fairy Pokémon", Type.FAIRY, -1, 0.6, 7.5, "Cute Charm", "Magic Guard", "Friend Guard", 323, 70, 45, 48, 60, 65, 35, 150, 140, 113, GrowthRate.FAST, "Fairy", null, 25, 10, 0 ],
  [ Species.CLEFABLE, "Clefable", 1, 0, 0, 0, "Fairy Pokémon", Type.FAIRY, -1, 1.3, 40, "Cute Charm", "Magic Guard", "Unaware", 483, 95, 70, 73, 95, 90, 60, 25, 140, 217, GrowthRate.FAST, "Fairy", null, 25, 10, 0 ],
  [ Species.VULPIX, "Vulpix", 1, 0, 0, 0, "Fox Pokémon", Type.FIRE, -1, 0.6, 9.9, "Flash Fire", null, "Drought", 299, 38, 41, 40, 50, 65, 65, 190, 70, 60, GrowthRate.MEDIUM_FAST, "Field", null, 25, 20, 0 ],
  [ Species.NINETALES, "Ninetales", 1, 0, 0, 0, "Fox Pokémon", Type.FIRE, -1, 1.1, 19.9, "Flash Fire", null, "Drought", 505, 73, 76, 75, 81, 100, 100, 75, 70, 177, GrowthRate.MEDIUM_FAST, "Field", null, 25, 20, 0 ],
  [ Species.JIGGLYPUFF, "Jigglypuff", 1, 0, 0, 0, "Balloon Pokémon", Type.NORMAL, Type.FAIRY, 0.5, 5.5, "Cute Charm", "Competitive", "Friend Guard", 270, 115, 45, 20, 45, 25, 20, 170, 70, 95, GrowthRate.FAST, "Fairy", null, 25, 10, 0 ],
  [ Species.WIGGLYTUFF, "Wigglytuff", 1, 0, 0, 0, "Balloon Pokémon", Type.NORMAL, Type.FAIRY, 1, 12, "Cute Charm", "Competitive", "Frisk", 435, 140, 70, 45, 85, 50, 45, 50, 70, 196, GrowthRate.FAST, "Fairy", null, 25, 10, 0 ],
  [ Species.ZUBAT, "Zubat", 1, 0, 0, 0, "Bat Pokémon", Type.POISON, Type.FLYING, 0.8, 7.5, "Inner Focus", null, "Infiltrator", 245, 40, 45, 35, 30, 40, 55, 255, 70, 49, GrowthRate.MEDIUM_FAST, "Flying", null, 50, 15, 1 ],
  [ Species.GOLBAT, "Golbat", 1, 0, 0, 0, "Bat Pokémon", Type.POISON, Type.FLYING, 1.6, 55, "Inner Focus", null, "Infiltrator", 455, 75, 80, 70, 65, 75, 90, 90, 70, 159, GrowthRate.MEDIUM_FAST, "Flying", null, 50, 15, 1 ],
  [ Species.ODDISH, "Oddish", 1, 0, 0, 0, "Weed Pokémon", Type.GRASS, Type.POISON, 0.5, 5.4, "Chlorophyll", null, "Run Away", 320, 45, 50, 55, 75, 65, 30, 255, 70, 64, GrowthRate.MEDIUM_SLOW, "Grass", null, 50, 20, 0 ],
  [ Species.GLOOM, "Gloom", 1, 0, 0, 0, "Weed Pokémon", Type.GRASS, Type.POISON, 0.8, 8.6, "Chlorophyll", null, "Stench", 395, 60, 65, 70, 85, 75, 40, 120, 70, 138, GrowthRate.MEDIUM_SLOW, "Grass", null, 50, 20, 1 ],
  [ Species.VILEPLUME, "Vileplume", 1, 0, 0, 0, "Flower Pokémon", Type.GRASS, Type.POISON, 1.2, 18.6, "Chlorophyll", null, "Effect Spore", 490, 75, 80, 85, 110, 90, 50, 45, 70, 221, GrowthRate.MEDIUM_SLOW, "Grass", null, 50, 20, 1 ],
  [ Species.PARAS, "Paras", 1, 0, 0, 0, "Mushroom Pokémon", Type.BUG, Type.GRASS, 0.3, 5.4, "Effect Spore", "Dry Skin", "Damp", 285, 35, 70, 55, 45, 55, 25, 190, 70, 57, GrowthRate.MEDIUM_FAST, "Bug", "Grass", 50, 20, 0 ],
  [ Species.PARASECT, "Parasect", 1, 0, 0, 0, "Mushroom Pokémon", Type.BUG, Type.GRASS, 1, 29.5, "Effect Spore", "Dry Skin", "Damp", 405, 60, 95, 80, 60, 80, 30, 75, 70, 142, GrowthRate.MEDIUM_FAST, "Bug", "Grass", 50, 20, 0 ],
  [ Species.VENONAT, "Venonat", 1, 0, 0, 0, "Insect Pokémon", Type.BUG, Type.POISON, 1, 30, "Compound Eyes", "Tinted Lens", "Run Away", 305, 60, 55, 50, 40, 55, 45, 190, 70, 61, GrowthRate.MEDIUM_FAST, "Bug", null, 50, 20, 0 ],
  [ Species.VENOMOTH, "Venomoth", 1, 0, 0, 0, "Poison Moth Pokémon", Type.BUG, Type.POISON, 1.5, 12.5, "Shield Dust", "Tinted Lens", "Wonder Skin", 450, 70, 65, 60, 90, 75, 90, 75, 70, 158, GrowthRate.MEDIUM_FAST, "Bug", null, 50, 20, 0 ],
  [ Species.DIGLETT, "Diglett", 1, 0, 0, 0, "Mole Pokémon", Type.GROUND, -1, 0.2, 0.8, "Sand Veil", "Arena Trap", "Sand Force", 265, 10, 55, 25, 35, 45, 95, 255, 70, 53, GrowthRate.MEDIUM_FAST, "Field", null, 50, 20, 0 ],
  [ Species.DUGTRIO, "Dugtrio", 1, 0, 0, 0, "Mole Pokémon", Type.GROUND, -1, 0.7, 33.3, "Sand Veil", "Arena Trap", "Sand Force", 425, 35, 100, 50, 50, 70, 120, 50, 70, 149, GrowthRate.MEDIUM_FAST, "Field", null, 50, 20, 0 ],
  [ Species.MEOWTH, "Meowth", 1, 0, 0, 0, "Scratch Cat Pokémon", Type.NORMAL, -1, 0.4, 4.2, "Pickup", "Technician", "Unnerve", 290, 40, 45, 35, 40, 40, 90, 255, 70, 58, GrowthRate.MEDIUM_FAST, "Field", null, 50, 20, 0 ],
  [ Species.PERSIAN, "Persian", 1, 0, 0, 0, "Classy Cat Pokémon", Type.NORMAL, -1, 1, 32, "Limber", "Technician", "Unnerve", 440, 65, 70, 60, 65, 65, 115, 90, 70, 154, GrowthRate.MEDIUM_FAST, "Field", null, 50, 20, 0 ],
  [ Species.PSYDUCK, "Psyduck", 1, 0, 0, 0, "Duck Pokémon", Type.WATER, -1, 0.8, 19.6, "Damp", "Cloud Nine", "Swift Swim", 320, 50, 52, 48, 65, 50, 55, 190, 70, 64, GrowthRate.MEDIUM_FAST, "Field", "Water 1", 50, 20, 0 ],
  [ Species.GOLDUCK, "Golduck", 1, 0, 0, 0, "Duck Pokémon", Type.WATER, -1, 1.7, 76.6, "Damp", "Cloud Nine", "Swift Swim", 500, 80, 82, 78, 95, 80, 85, 75, 70, 175, GrowthRate.MEDIUM_FAST, "Field", "Water 1", 50, 20, 0 ],
  [ Species.MANKEY, "Mankey", 1, 0, 0, 0, "Pig Monkey Pokémon", Type.FIGHTING, -1, 0.5, 28, "Vital Spirit", "Anger Point", "Defiant", 305, 40, 80, 35, 35, 45, 70, 190, 70, 61, GrowthRate.MEDIUM_FAST, "Field", null, 50, 20, 0 ],
  [ Species.PRIMEAPE, "Primeape", 1, 0, 0, 0, "Pig Monkey Pokémon", Type.FIGHTING, -1, 1, 32, "Vital Spirit", "Anger Point", "Defiant", 455, 65, 105, 60, 60, 70, 95, 75, 70, 159, GrowthRate.MEDIUM_FAST, "Field", null, 50, 20, 0 ],
  [ Species.GROWLITHE, "Growlithe", 1, 0, 0, 0, "Puppy Pokémon", Type.FIRE, -1, 0.7, 19, "Intimidate", "Flash Fire", "Justified", 350, 55, 70, 45, 70, 50, 60, 190, 70, 70, GrowthRate.SLOW, "Field", null, 75, 20, 0 ],
  [ Species.ARCANINE, "Arcanine", 1, 0, 0, 0, "Legendary Pokémon", Type.FIRE, -1, 1.9, 155, "Intimidate", "Flash Fire", "Justified", 555, 90, 110, 80, 100, 80, 95, 75, 70, 194, GrowthRate.SLOW, "Field", null, 75, 20, 0 ],
  [ Species.POLIWAG, "Poliwag", 1, 0, 0, 0, "Tadpole Pokémon", Type.WATER, -1, 0.6, 12.4, "Water Absorb", "Damp", "Swift Swim", 300, 40, 50, 40, 40, 40, 90, 255, 70, 60, GrowthRate.MEDIUM_SLOW, "Water 1", null, 50, 20, 0 ],
  [ Species.POLIWHIRL, "Poliwhirl", 1, 0, 0, 0, "Tadpole Pokémon", Type.WATER, -1, 1, 20, "Water Absorb", "Damp", "Swift Swim", 385, 65, 65, 65, 50, 50, 90, 120, 70, 135, GrowthRate.MEDIUM_SLOW, "Water 1", null, 50, 20, 0 ],
  [ Species.POLIWRATH, "Poliwrath", 1, 0, 0, 0, "Tadpole Pokémon", Type.WATER, Type.FIGHTING, 1.3, 54, "Water Absorb", "Damp", "Swift Swim", 510, 90, 95, 95, 70, 90, 70, 45, 70, 230, GrowthRate.MEDIUM_SLOW, "Water 1", null, 50, 20, 0 ],
  [ Species.ABRA, "Abra", 1, 0, 0, 0, "Psi Pokémon", Type.PSYCHIC, -1, 0.9, 19.5, "Synchronize", "Inner Focus", "Magic Guard", 310, 25, 20, 15, 105, 55, 90, 200, 70, 62, GrowthRate.MEDIUM_SLOW, "Human-Like", null, 75, 20, 0 ],
  [ Species.KADABRA, "Kadabra", 1, 0, 0, 0, "Psi Pokémon", Type.PSYCHIC, -1, 1.3, 56.5, "Synchronize", "Inner Focus", "Magic Guard", 400, 40, 35, 30, 120, 70, 105, 100, 70, 140, GrowthRate.MEDIUM_SLOW, "Human-Like", null, 75, 20, 1 ],
  [ Species.ALAKAZAM, "Alakazam", 1, 0, 0, 0, "Psi Pokémon", Type.PSYCHIC, -1, 1.5, 48, "Synchronize", "Inner Focus", "Magic Guard", 500, 55, 50, 45, 135, 95, 120, 50, 70, 225, GrowthRate.MEDIUM_SLOW, "Human-Like", null, 75, 20, 1 ],
  [ Species.MACHOP, "Machop", 1, 0, 0, 0, "Superpower Pokémon", Type.FIGHTING, -1, 0.8, 19.5, "Guts", "No Guard", "Steadfast", 305, 70, 80, 50, 35, 35, 35, 180, 70, 61, GrowthRate.MEDIUM_SLOW, "Human-Like", null, 75, 20, 0 ],
  [ Species.MACHOKE, "Machoke", 1, 0, 0, 0, "Superpower Pokémon", Type.FIGHTING, -1, 1.5, 70.5, "Guts", "No Guard", "Steadfast", 405, 80, 100, 70, 50, 60, 45, 90, 70, 142, GrowthRate.MEDIUM_SLOW, "Human-Like", null, 75, 20, 0 ],
  [ Species.MACHAMP, "Machamp", 1, 0, 0, 0, "Superpower Pokémon", Type.FIGHTING, -1, 1.6, 130, "Guts", "No Guard", "Steadfast", 505, 90, 130, 80, 65, 85, 55, 45, 70, 227, GrowthRate.MEDIUM_SLOW, "Human-Like", null, 75, 20, 0 ],
  [ Species.BELLSPROUT, "Bellsprout", 1, 0, 0, 0, "Flower Pokémon", Type.GRASS, Type.POISON, 0.7, 4, "Chlorophyll", null, "Gluttony", 300, 50, 75, 35, 70, 30, 40, 255, 70, 60, GrowthRate.MEDIUM_SLOW, "Grass", null, 50, 20, 0 ],
  [ Species.WEEPINBELL, "Weepinbell", 1, 0, 0, 0, "Flycatcher Pokémon", Type.GRASS, Type.POISON, 1, 6.4, "Chlorophyll", null, "Gluttony", 390, 65, 90, 50, 85, 45, 55, 120, 70, 137, GrowthRate.MEDIUM_SLOW, "Grass", null, 50, 20, 0 ],
  [ Species.VICTREEBEL, "Victreebel", 1, 0, 0, 0, "Flycatcher Pokémon", Type.GRASS, Type.POISON, 1.7, 15.5, "Chlorophyll", null, "Gluttony", 490, 80, 105, 65, 100, 70, 70, 45, 70, 221, GrowthRate.MEDIUM_SLOW, "Grass", null, 50, 20, 0 ],
  [ Species.TENTACOOL, "Tentacool", 1, 0, 0, 0, "Jellyfish Pokémon", Type.WATER, Type.POISON, 0.9, 45.5, "Clear Body", "Liquid Ooze", "Rain Dish", 335, 40, 40, 35, 50, 100, 70, 190, 70, 67, GrowthRate.SLOW, "Water 3", null, 50, 20, 0 ],
  [ Species.TENTACRUEL, "Tentacruel", 1, 0, 0, 0, "Jellyfish Pokémon", Type.WATER, Type.POISON, 1.6, 55, "Clear Body", "Liquid Ooze", "Rain Dish", 515, 80, 70, 65, 80, 120, 100, 60, 70, 180, GrowthRate.SLOW, "Water 3", null, 50, 20, 0 ],
  [ Species.GEODUDE, "Geodude", 1, 0, 0, 0, "Rock Pokémon", Type.ROCK, Type.GROUND, 0.4, 20, "Rock Head", "Sturdy", "Sand Veil", 300, 40, 80, 100, 30, 30, 20, 255, 70, 60, GrowthRate.MEDIUM_SLOW, "Mineral", null, 50, 15, 0 ],
  [ Species.GRAVELER, "Graveler", 1, 0, 0, 0, "Rock Pokémon", Type.ROCK, Type.GROUND, 1, 105, "Rock Head", "Sturdy", "Sand Veil", 390, 55, 95, 115, 45, 45, 35, 120, 70, 137, GrowthRate.MEDIUM_SLOW, "Mineral", null, 50, 15, 0 ],
  [ Species.GOLEM, "Golem", 1, 0, 0, 0, "Megaton Pokémon", Type.ROCK, Type.GROUND, 1.4, 300, "Rock Head", "Sturdy", "Sand Veil", 495, 80, 120, 130, 55, 65, 45, 45, 70, 223, GrowthRate.MEDIUM_SLOW, "Mineral", null, 50, 15, 0 ],
  [ Species.PONYTA, "Ponyta", 1, 0, 0, 0, "Fire Horse Pokémon", Type.FIRE, -1, 1, 30, "Run Away", "Flash Fire", "Flame Body", 410, 50, 85, 55, 65, 65, 90, 190, 70, 82, GrowthRate.MEDIUM_FAST, "Field", null, 50, 20, 0 ],
  [ Species.RAPIDASH, "Rapidash", 1, 0, 0, 0, "Fire Horse Pokémon", Type.FIRE, -1, 1.7, 95, "Run Away", "Flash Fire", "Flame Body", 500, 65, 100, 70, 80, 80, 105, 60, 70, 175, GrowthRate.MEDIUM_FAST, "Field", null, 50, 20, 0 ],
  [ Species.SLOWPOKE, "Slowpoke", 1, 0, 0, 0, "Dopey Pokémon", Type.WATER, Type.PSYCHIC, 1.2, 36, "Oblivious", "Own Tempo", "Regenerator", 315, 90, 65, 65, 40, 40, 15, 190, 70, 63, GrowthRate.MEDIUM_FAST, "Monster", "Water 1", 50, 20, 0 ],
  [ Species.SLOWBRO, "Slowbro", 1, 0, 0, 0, "Hermit Crab Pokémon", Type.WATER, Type.PSYCHIC, 1.6, 78.5, "Oblivious", "Own Tempo", "Regenerator", 490, 95, 75, 110, 100, 80, 30, 75, 70, 172, GrowthRate.MEDIUM_FAST, "Monster", "Water 1", 50, 20, 0 ],
  [ Species.MAGNEMITE, "Magnemite", 1, 0, 0, 0, "Magnet Pokémon", Type.ELECTRIC, Type.STEEL, 0.3, 6, "Magnet Pull", "Sturdy", "Analytic", 325, 25, 35, 70, 95, 55, 45, 190, 70, 65, GrowthRate.MEDIUM_FAST, "Mineral", null, null, 20, 0 ],
  [ Species.MAGNETON, "Magneton", 1, 0, 0, 0, "Magnet Pokémon", Type.ELECTRIC, Type.STEEL, 1, 60, "Magnet Pull", "Sturdy", "Analytic", 465, 50, 60, 95, 120, 70, 70, 60, 70, 163, GrowthRate.MEDIUM_FAST, "Mineral", null, null, 20, 0 ],
  [ Species.FARFETCHD, "Farfetch'd", 1, 0, 0, 0, "Wild Duck Pokémon", Type.NORMAL, Type.FLYING, 0.8, 15, "Keen Eye", "Inner Focus", "Defiant", 377, 52, 90, 55, 58, 62, 60, 45, 70, 132, GrowthRate.MEDIUM_FAST, "Field", "Flying", 50, 20, 0 ],
  [ Species.DODUO, "Doduo", 1, 0, 0, 0, "Twin Bird Pokémon", Type.NORMAL, Type.FLYING, 1.4, 39.2, "Run Away", "Early Bird", "Tangled Feet", 310, 35, 85, 45, 35, 35, 75, 190, 70, 62, GrowthRate.MEDIUM_FAST, "Flying", null, 50, 20, 1 ],
  [ Species.DODRIO, "Dodrio", 1, 0, 0, 0, "Triple Bird Pokémon", Type.NORMAL, Type.FLYING, 1.8, 85.2, "Run Away", "Early Bird", "Tangled Feet", 470, 60, 110, 70, 60, 60, 110, 45, 70, 165, GrowthRate.MEDIUM_FAST, "Flying", null, 50, 20, 1 ],
  [ Species.SEEL, "Seel", 1, 0, 0, 0, "Sea Lion Pokémon", Type.WATER, -1, 1.1, 90, "Thick Fat", "Hydration", "Ice Body", 325, 65, 45, 55, 45, 70, 45, 190, 70, 65, GrowthRate.MEDIUM_FAST, "Field", "Water 1", 50, 20, 0 ],
  [ Species.DEWGONG, "Dewgong", 1, 0, 0, 0, "Sea Lion Pokémon", Type.WATER, Type.ICE, 1.7, 120, "Thick Fat", "Hydration", "Ice Body", 475, 90, 70, 80, 70, 95, 70, 75, 70, 166, GrowthRate.MEDIUM_FAST, "Field", "Water 1", 50, 20, 0 ],
  [ Species.GRIMER, "Grimer", 1, 0, 0, 0, "Sludge Pokémon", Type.POISON, -1, 0.9, 30, "Stench", "Sticky Hold", "Poison Touch", 325, 80, 80, 50, 40, 50, 25, 190, 70, 65, GrowthRate.MEDIUM_FAST, "Amorphous", null, 50, 20, 0 ],
  [ Species.MUK, "Muk", 1, 0, 0, 0, "Sludge Pokémon", Type.POISON, -1, 1.2, 30, "Stench", "Sticky Hold", "Poison Touch", 500, 105, 105, 75, 65, 100, 50, 75, 70, 175, GrowthRate.MEDIUM_FAST, "Amorphous", null, 50, 20, 0 ],
  [ Species.SHELLDER, "Shellder", 1, 0, 0, 0, "Bivalve Pokémon", Type.WATER, -1, 0.3, 4, "Shell Armor", "Skill Link", "Overcoat", 305, 30, 65, 100, 45, 25, 40, 190, 70, 61, GrowthRate.SLOW, "Water 3", null, 50, 20, 0 ],
  [ Species.CLOYSTER, "Cloyster", 1, 0, 0, 0, "Bivalve Pokémon", Type.WATER, Type.ICE, 1.5, 132.5, "Shell Armor", "Skill Link", "Overcoat", 525, 50, 95, 180, 85, 45, 70, 60, 70, 184, GrowthRate.SLOW, "Water 3", null, 50, 20, 0 ],
  [ Species.GASTLY, "Gastly", 1, 0, 0, 0, "Gas Pokémon", Type.GHOST, Type.POISON, 1.3, 0.1, "Levitate", null, null, 310, 30, 35, 30, 100, 35, 80, 190, 70, 62, GrowthRate.MEDIUM_SLOW, "Amorphous", null, 50, 20, 0 ],
  [ Species.HAUNTER, "Haunter", 1, 0, 0, 0, "Gas Pokémon", Type.GHOST, Type.POISON, 1.6, 0.1, "Levitate", null, null, 405, 45, 50, 45, 115, 55, 95, 90, 70, 142, GrowthRate.MEDIUM_SLOW, "Amorphous", null, 50, 20, 0 ],
  [ Species.GENGAR, "Gengar", 1, 0, 0, 0, "Shadow Pokémon", Type.GHOST, Type.POISON, 1.5, 40.5, "Cursed Body", null, null, 500, 60, 65, 60, 130, 75, 110, 45, 70, 225, GrowthRate.MEDIUM_SLOW, "Amorphous", null, 50, 20, 0 ],
  [ Species.ONIX, "Onix", 1, 0, 0, 0, "Rock Snake Pokémon", Type.ROCK, Type.GROUND, 8.8, 210, "Rock Head", "Sturdy", "Weak Armor", 385, 35, 45, 160, 30, 45, 70, 45, 70, 77, GrowthRate.MEDIUM_FAST, "Mineral", null, 50, 25, 0 ],
  [ Species.DROWZEE, "Drowzee", 1, 0, 0, 0, "Hypnosis Pokémon", Type.PSYCHIC, -1, 1, 32.4, "Insomnia", "Forewarn", "Inner Focus", 328, 60, 48, 45, 43, 90, 42, 190, 70, 66, GrowthRate.MEDIUM_FAST, "Human-Like", null, 50, 20, 0 ],
  [ Species.HYPNO, "Hypno", 1, 0, 0, 0, "Hypnosis Pokémon", Type.PSYCHIC, -1, 1.6, 75.6, "Insomnia", "Forewarn", "Inner Focus", 483, 85, 73, 70, 73, 115, 67, 75, 70, 169, GrowthRate.MEDIUM_FAST, "Human-Like", null, 50, 20, 1 ],
  [ Species.KRABBY, "Krabby", 1, 0, 0, 0, "River Crab Pokémon", Type.WATER, -1, 0.4, 6.5, "Hyper Cutter", "Shell Armor", "Sheer Force", 325, 30, 105, 90, 25, 25, 50, 225, 70, 65, GrowthRate.MEDIUM_FAST, "Water 3", null, 50, 20, 0 ],
  [ Species.KINGLER, "Kingler", 1, 0, 0, 0, "Pincer Pokémon", Type.WATER, -1, 1.3, 60, "Hyper Cutter", "Shell Armor", "Sheer Force", 475, 55, 130, 115, 50, 50, 75, 60, 70, 166, GrowthRate.MEDIUM_FAST, "Water 3", null, 50, 20, 0 ],
  [ Species.VOLTORB, "Voltorb", 1, 0, 0, 0, "Ball Pokémon", Type.ELECTRIC, -1, 0.5, 10.4, "Soundproof", "Static", "Aftermath", 330, 40, 30, 50, 55, 55, 100, 190, 70, 66, GrowthRate.MEDIUM_FAST, "Mineral", null, null, 20, 0 ],
  [ Species.ELECTRODE, "Electrode", 1, 0, 0, 0, "Ball Pokémon", Type.ELECTRIC, -1, 1.2, 66.6, "Soundproof", "Static", "Aftermath", 490, 60, 50, 70, 80, 80, 150, 60, 70, 172, GrowthRate.MEDIUM_FAST, "Mineral", null, null, 20, 0 ],
  [ Species.EXEGGCUTE, "Exeggcute", 1, 0, 0, 0, "Egg Pokémon", Type.GRASS, Type.PSYCHIC, 0.4, 2.5, "Chlorophyll", null, "Harvest", 325, 60, 40, 80, 60, 45, 40, 90, 70, 65, GrowthRate.SLOW, "Grass", null, 50, 20, 0 ],
  [ Species.EXEGGUTOR, "Exeggutor", 1, 0, 0, 0, "Coconut Pokémon", Type.GRASS, Type.PSYCHIC, 2, 120, "Chlorophyll", null, "Harvest", 530, 95, 95, 85, 125, 75, 55, 45, 70, 186, GrowthRate.SLOW, "Grass", null, 50, 20, 0 ],
  [ Species.CUBONE, "Cubone", 1, 0, 0, 0, "Lonely Pokémon", Type.GROUND, -1, 0.4, 6.5, "Rock Head", "Lightning Rod", "Battle Armor", 320, 50, 50, 95, 40, 50, 35, 190, 70, 64, GrowthRate.MEDIUM_FAST, "Monster", null, 50, 20, 0 ],
  [ Species.MAROWAK, "Marowak", 1, 0, 0, 0, "Bone Keeper Pokémon", Type.GROUND, -1, 1, 45, "Rock Head", "Lightning Rod", "Battle Armor", 425, 60, 80, 110, 50, 80, 45, 75, 70, 149, GrowthRate.MEDIUM_FAST, "Monster", null, 50, 20, 0 ],
  [ Species.HITMONLEE, "Hitmonlee", 1, 0, 0, 0, "Kicking Pokémon", Type.FIGHTING, -1, 1.5, 49.8, "Limber", "Reckless", "Unburden", 455, 50, 120, 53, 35, 110, 87, 45, 70, 159, GrowthRate.MEDIUM_FAST, "Human-Like", null, 100, 25, 0 ],
  [ Species.HITMONCHAN, "Hitmonchan", 1, 0, 0, 0, "Punching Pokémon", Type.FIGHTING, -1, 1.4, 50.2, "Keen Eye", "Iron Fist", "Inner Focus", 455, 50, 105, 79, 35, 110, 76, 45, 70, 159, GrowthRate.MEDIUM_FAST, "Human-Like", null, 100, 25, 0 ],
  [ Species.LICKITUNG, "Lickitung", 1, 0, 0, 0, "Licking Pokémon", Type.NORMAL, -1, 1.2, 65.5, "Own Tempo", "Oblivious", "Cloud Nine", 385, 90, 55, 75, 60, 75, 30, 45, 70, 77, GrowthRate.MEDIUM_FAST, "Monster", null, 50, 20, 0 ],
  [ Species.KOFFING, "Koffing", 1, 0, 0, 0, "Poison Gas Pokémon", Type.POISON, -1, 0.6, 1, "Levitate", "Neutralizing Gas", "Stench", 340, 40, 65, 95, 60, 45, 35, 190, 70, 68, GrowthRate.MEDIUM_FAST, "Amorphous", null, 50, 20, 0 ],
  [ Species.WEEZING, "Weezing", 1, 0, 0, 0, "Poison Gas Pokémon", Type.POISON, -1, 1.2, 9.5, "Levitate", "Neutralizing Gas", "Stench", 490, 65, 90, 120, 85, 70, 60, 60, 70, 172, GrowthRate.MEDIUM_FAST, "Amorphous", null, 50, 20, 0 ],
  [ Species.RHYHORN, "Rhyhorn", 1, 0, 0, 0, "Spikes Pokémon", Type.GROUND, Type.ROCK, 1, 115, "Lightning Rod", "Rock Head", "Reckless", 345, 80, 85, 95, 30, 30, 25, 120, 70, 69, GrowthRate.SLOW, "Field", "Monster", 50, 20, 1 ],
  [ Species.RHYDON, "Rhydon", 1, 0, 0, 0, "Drill Pokémon", Type.GROUND, Type.ROCK, 1.9, 120, "Lightning Rod", "Rock Head", "Reckless", 485, 105, 130, 120, 45, 45, 40, 60, 70, 170, GrowthRate.SLOW, "Field", "Monster", 50, 20, 1 ],
  [ Species.CHANSEY, "Chansey", 1, 0, 0, 0, "Egg Pokémon", Type.NORMAL, -1, 1.1, 34.6, "Natural Cure", "Serene Grace", "Healer", 450, 250, 5, 5, 35, 105, 50, 30, 140, 395, GrowthRate.FAST, "Fairy", null, 0, 40, 0 ],
  [ Species.TANGELA, "Tangela", 1, 0, 0, 0, "Vine Pokémon", Type.GRASS, -1, 1, 35, "Chlorophyll", "Leaf Guard", "Regenerator", 435, 65, 55, 115, 100, 40, 60, 45, 70, 87, GrowthRate.MEDIUM_FAST, "Grass", null, 50, 20, 0 ],
  [ Species.KANGASKHAN, "Kangaskhan", 1, 0, 0, 0, "Parent Pokémon", Type.NORMAL, -1, 2.2, 80, "Early Bird", "Scrappy", "Inner Focus", 490, 105, 95, 80, 40, 80, 90, 45, 70, 172, GrowthRate.MEDIUM_FAST, "Monster", null, 0, 20, 0 ],
  [ Species.HORSEA, "Horsea", 1, 0, 0, 0, "Dragon Pokémon", Type.WATER, -1, 0.4, 8, "Swift Swim", "Sniper", "Damp", 295, 30, 40, 70, 70, 25, 60, 225, 70, 59, GrowthRate.MEDIUM_FAST, "Dragon", "Water 1", 50, 20, 0 ],
  [ Species.SEADRA, "Seadra", 1, 0, 0, 0, "Dragon Pokémon", Type.WATER, -1, 1.2, 25, "Poison Point", "Sniper", "Damp", 440, 55, 65, 95, 95, 45, 85, 75, 70, 154, GrowthRate.MEDIUM_FAST, "Dragon", "Water 1", 50, 20, 0 ],
  [ Species.GOLDEEN, "Goldeen", 1, 0, 0, 0, "Goldfish Pokémon", Type.WATER, -1, 0.6, 15, "Swift Swim", "Water Veil", "Lightning Rod", 320, 45, 67, 60, 35, 50, 63, 225, 70, 64, GrowthRate.MEDIUM_FAST, "Water 2", null, 50, 20, 1 ],
  [ Species.SEAKING, "Seaking", 1, 0, 0, 0, "Goldfish Pokémon", Type.WATER, -1, 1.3, 39, "Swift Swim", "Water Veil", "Lightning Rod", 450, 80, 92, 65, 65, 80, 68, 60, 70, 158, GrowthRate.MEDIUM_FAST, "Water 2", null, 50, 20, 1 ],
  [ Species.STARYU, "Staryu", 1, 0, 0, 0, "Star Shape Pokémon", Type.WATER, -1, 0.8, 34.5, "Illuminate", "Natural Cure", "Analytic", 340, 30, 45, 55, 70, 55, 85, 225, 70, 68, GrowthRate.SLOW, "Water 3", null, null, 20, 0 ],
  [ Species.STARMIE, "Starmie", 1, 0, 0, 0, "Mysterious Pokémon", Type.WATER, Type.PSYCHIC, 1.1, 80, "Illuminate", "Natural Cure", "Analytic", 520, 60, 75, 85, 100, 85, 115, 60, 70, 182, GrowthRate.SLOW, "Water 3", null, null, 20, 0 ],
  [ Species.MR_MIME, "Mr. Mime", 1, 0, 0, 0, "Barrier Pokémon", Type.PSYCHIC, Type.FAIRY, 1.3, 54.5, "Soundproof", "Filter", "Technician", 460, 40, 45, 65, 100, 120, 90, 45, 70, 161, GrowthRate.MEDIUM_FAST, "Human-Like", null, 50, 25, 0 ],
  [ Species.SCYTHER, "Scyther", 1, 0, 0, 0, "Mantis Pokémon", Type.BUG, Type.FLYING, 1.5, 56, "Swarm", "Technician", "Steadfast", 500, 70, 110, 80, 55, 80, 105, 45, 70, 100, GrowthRate.MEDIUM_FAST, "Bug", null, 50, 25, 1 ],
  [ Species.JYNX, "Jynx", 1, 0, 0, 0, "Human Shape Pokémon", Type.ICE, Type.PSYCHIC, 1.4, 40.6, "Oblivious", "Forewarn", "Dry Skin", 455, 65, 50, 35, 115, 95, 95, 45, 70, 159, GrowthRate.MEDIUM_FAST, "Human-Like", null, 0, 25, 0 ],
  [ Species.ELECTABUZZ, "Electabuzz", 1, 0, 0, 0, "Electric Pokémon", Type.ELECTRIC, -1, 1.1, 30, "Static", null, "Vital Spirit", 490, 65, 83, 57, 95, 85, 105, 45, 70, 172, GrowthRate.MEDIUM_FAST, "Human-Like", null, 75, 25, 0 ],
  [ Species.MAGMAR, "Magmar", 1, 0, 0, 0, "Spitfire Pokémon", Type.FIRE, -1, 1.3, 44.5, "Flame Body", null, "Vital Spirit", 495, 65, 95, 57, 100, 85, 93, 45, 70, 173, GrowthRate.MEDIUM_FAST, "Human-Like", null, 75, 25, 0 ],
  [ Species.PINSIR, "Pinsir", 1, 0, 0, 0, "Stag Beetle Pokémon", Type.BUG, -1, 1.5, 55, "Hyper Cutter", "Mold Breaker", "Moxie", 500, 65, 125, 100, 55, 70, 85, 45, 70, 175, GrowthRate.SLOW, "Bug", null, 50, 25, 0 ],
  [ Species.TAUROS, "Tauros", 1, 0, 0, 0, "Wild Bull Pokémon", Type.NORMAL, -1, 1.4, 88.4, "Intimidate", "Anger Point", "Sheer Force", 490, 75, 100, 95, 40, 70, 110, 45, 70, 172, GrowthRate.SLOW, "Field", null, 100, 20, 0 ],
  [ Species.MAGIKARP, "Magikarp", 1, 0, 0, 0, "Fish Pokémon", Type.WATER, -1, 0.9, 10, "Swift Swim", null, "Rattled", 200, 20, 10, 55, 15, 20, 80, 255, 70, 40, GrowthRate.SLOW, "Dragon", "Water 2", 50, 5, 1 ],
  [ Species.GYARADOS, "Gyarados", 1, 0, 0, 0, "Atrocious Pokémon", Type.WATER, Type.FLYING, 6.5, 235, "Intimidate", null, "Moxie", 540, 95, 125, 79, 60, 100, 81, 45, 70, 189, GrowthRate.SLOW, "Dragon", "Water 2", 50, 5, 1 ],
  [ Species.LAPRAS, "Lapras", 1, 0, 0, 0, "Transport Pokémon", Type.WATER, Type.ICE, 2.5, 220, "Water Absorb", "Shell Armor", "Hydration", 535, 130, 85, 80, 85, 95, 60, 45, 70, 187, GrowthRate.SLOW, "Monster", "Water 1", 50, 40, 0 ],
  [ Species.DITTO, "Ditto", 1, 0, 0, 0, "Transform Pokémon", Type.NORMAL, -1, 0.3, 4, "Limber", null, "Imposter", 288, 48, 48, 48, 48, 48, 48, 35, 70, 101, GrowthRate.MEDIUM_FAST, "Ditto", null, null, 20, 0 ],
  [ Species.EEVEE, "Eevee", 1, 0, 0, 0, "Evolution Pokémon", Type.NORMAL, -1, 0.3, 6.5, "Run Away", "Adaptability", "Anticipation", 325, 55, 55, 50, 45, 65, 55, 45, 70, 65, GrowthRate.MEDIUM_FAST, "Field", null, 87.5, 35, 0 ],
  [ Species.VAPOREON, "Vaporeon", 1, 0, 0, 0, "Bubble Jet Pokémon", Type.WATER, -1, 1, 29, "Water Absorb", null, "Hydration", 525, 130, 65, 60, 110, 95, 65, 45, 70, 184, GrowthRate.MEDIUM_FAST, "Field", null, 87.5, 35, 0 ],
  [ Species.JOLTEON, "Jolteon", 1, 0, 0, 0, "Lightning Pokémon", Type.ELECTRIC, -1, 0.8, 24.5, "Volt Absorb", null, "Quick Feet", 525, 65, 65, 60, 110, 95, 130, 45, 70, 184, GrowthRate.MEDIUM_FAST, "Field", null, 87.5, 35, 0 ],
  [ Species.FLAREON, "Flareon", 1, 0, 0, 0, "Flame Pokémon", Type.FIRE, -1, 0.9, 25, "Flash Fire", null, "Guts", 525, 65, 130, 60, 95, 110, 65, 45, 70, 184, GrowthRate.MEDIUM_FAST, "Field", null, 87.5, 35, 0 ],
  [ Species.PORYGON, "Porygon", 1, 0, 0, 0, "Virtual Pokémon", Type.NORMAL, -1, 0.8, 36.5, "Trace", "Download", "Analytic", 395, 65, 60, 70, 85, 75, 40, 45, 70, 79, GrowthRate.MEDIUM_FAST, "Mineral", null, null, 20, 0 ],
  [ Species.OMANYTE, "Omanyte", 1, 0, 0, 0, "Spiral Pokémon", Type.ROCK, Type.WATER, 0.4, 7.5, "Swift Swim", "Shell Armor", "Weak Armor", 355, 35, 40, 100, 90, 55, 35, 45, 70, 71, GrowthRate.MEDIUM_FAST, "Water 1", "Water 3", 87.5, 30, 0 ],
  [ Species.OMASTAR, "Omastar", 1, 0, 0, 0, "Spiral Pokémon", Type.ROCK, Type.WATER, 1, 35, "Swift Swim", "Shell Armor", "Weak Armor", 495, 70, 60, 125, 115, 70, 55, 45, 70, 173, GrowthRate.MEDIUM_FAST, "Water 1", "Water 3", 87.5, 30, 0 ],
  [ Species.KABUTO, "Kabuto", 1, 0, 0, 0, "Shellfish Pokémon", Type.ROCK, Type.WATER, 0.5, 11.5, "Swift Swim", "Battle Armor", "Weak Armor", 355, 30, 80, 90, 55, 45, 55, 45, 70, 71, GrowthRate.MEDIUM_FAST, "Water 1", "Water 3", 87.5, 30, 0 ],
  [ Species.KABUTOPS, "Kabutops", 1, 0, 0, 0, "Shellfish Pokémon", Type.ROCK, Type.WATER, 1.3, 40.5, "Swift Swim", "Battle Armor", "Weak Armor", 495, 60, 115, 105, 65, 70, 80, 45, 70, 173, GrowthRate.MEDIUM_FAST, "Water 1", "Water 3", 87.5, 30, 0 ],
  [ Species.AERODACTYL, "Aerodactyl", 1, 0, 0, 0, "Fossil Pokémon", Type.ROCK, Type.FLYING, 1.8, 59, "Rock Head", "Pressure", "Unnerve", 515, 80, 105, 65, 60, 75, 130, 45, 70, 180, GrowthRate.SLOW, "Flying", null, 87.5, 35, 0 ],
  [ Species.SNORLAX, "Snorlax", 1, 0, 0, 0, "Sleeping Pokémon", Type.NORMAL, -1, 2.1, 460, "Immunity", "Thick Fat", "Gluttony", 540, 160, 110, 65, 65, 110, 30, 25, 70, 189, GrowthRate.SLOW, "Monster", null, 87.5, 40, 0 ],
  [ Species.ARTICUNO, "Articuno", 1, 1, 0, 0, "Freeze Pokémon", Type.ICE, Type.FLYING, 1.7, 55.4, "Pressure", null, "Snow Cloak", 580, 90, 85, 100, 95, 125, 85, 3, 35, 261, GrowthRate.SLOW, "Undiscovered", null, null, 80, 0 ],
  [ Species.ZAPDOS, "Zapdos", 1, 1, 0, 0, "Electric Pokémon", Type.ELECTRIC, Type.FLYING, 1.6, 52.6, "Pressure", null, "Static", 580, 90, 90, 85, 125, 90, 100, 3, 35, 261, GrowthRate.SLOW, "Undiscovered", null, null, 80, 0 ],
  [ Species.MOLTRES, "Moltres", 1, 1, 0, 0, "Flame Pokémon", Type.FIRE, Type.FLYING, 2, 60, "Pressure", null, "Flame Body", 580, 90, 100, 90, 125, 85, 90, 3, 35, 261, GrowthRate.SLOW, "Undiscovered", null, null, 80, 0 ],
  [ Species.DRATINI, "Dratini", 1, 0, 0, 0, "Dragon Pokémon", Type.DRAGON, -1, 1.8, 3.3, "Shed Skin", null, "Marvel Scale", 300, 41, 64, 45, 50, 50, 50, 45, 35, 60, GrowthRate.SLOW, "Dragon", "Water 1", 50, 40, 0 ],
  [ Species.DRAGONAIR, "Dragonair", 1, 0, 0, 0, "Dragon Pokémon", Type.DRAGON, -1, 4, 16.5, "Shed Skin", null, "Marvel Scale", 420, 61, 84, 65, 70, 70, 70, 45, 35, 147, GrowthRate.SLOW, "Dragon", "Water 1", 50, 40, 0 ],
  [ Species.DRAGONITE, "Dragonite", 1, 0, 0, 0, "Dragon Pokémon", Type.DRAGON, Type.FLYING, 2.2, 210, "Inner Focus", null, "Multiscale", 600, 91, 134, 95, 100, 100, 80, 45, 35, 270, GrowthRate.SLOW, "Dragon", "Water 1", 50, 40, 0 ],
  [ Species.MEWTWO, "Mewtwo", 1, 0, 1, 0, "Genetic Pokémon", Type.PSYCHIC, -1, 2, 122, "Pressure", null, "Unnerve", 680, 106, 110, 90, 154, 90, 130, 3, 0, 306, GrowthRate.SLOW, "Undiscovered", null, null, 120, 0 ],
  [ Species.MEW, "Mew", 1, 0, 0, 1, "New Species Pokémon", Type.PSYCHIC, -1, 0.4, 4, "Synchronize", null, null, 600, 100, 100, 100, 100, 100, 100, 45, 100, 270, GrowthRate.MEDIUM_SLOW, "Undiscovered", null, null, 120, 0 ],
  [ Species.CHIKORITA, "Chikorita", 2, 0, 0, 0, "Leaf Pokémon", Type.GRASS, -1, 0.9, 6.4, "Overgrow", null, "Leaf Guard", 318, 45, 49, 65, 49, 65, 45, 45, 70, 64, GrowthRate.MEDIUM_SLOW, "Grass", "Monster", 87.5, 20, 0 ],
  [ Species.BAYLEEF, "Bayleef", 2, 0, 0, 0, "Leaf Pokémon", Type.GRASS, -1, 1.2, 15.8, "Overgrow", null, "Leaf Guard", 405, 60, 62, 80, 63, 80, 60, 45, 70, 142, GrowthRate.MEDIUM_SLOW, "Grass", "Monster", 87.5, 20, 0 ],
  [ Species.MEGANIUM, "Meganium", 2, 0, 0, 0, "Herb Pokémon", Type.GRASS, -1, 1.8, 100.5, "Overgrow", null, "Leaf Guard", 525, 80, 82, 100, 83, 100, 80, 45, 70, 236, GrowthRate.MEDIUM_SLOW, "Grass", "Monster", 87.5, 20, 1 ],
  [ Species.CYNDAQUIL, "Cyndaquil", 2, 0, 0, 0, "Fire Mouse Pokémon", Type.FIRE, -1, 0.5, 7.9, "Blaze", null, "Flash Fire", 309, 39, 52, 43, 60, 50, 65, 45, 70, 62, GrowthRate.MEDIUM_SLOW, "Field", null, 87.5, 20, 0 ],
  [ Species.QUILAVA, "Quilava", 2, 0, 0, 0, "Volcano Pokémon", Type.FIRE, -1, 0.9, 19, "Blaze", null, "Flash Fire", 405, 58, 64, 58, 80, 65, 80, 45, 70, 142, GrowthRate.MEDIUM_SLOW, "Field", null, 87.5, 20, 0 ],
  [ Species.TYPHLOSION, "Typhlosion", 2, 0, 0, 0, "Volcano Pokémon", Type.FIRE, -1, 1.7, 79.5, "Blaze", null, "Flash Fire", 534, 78, 84, 78, 109, 85, 100, 45, 70, 240, GrowthRate.MEDIUM_SLOW, "Field", null, 87.5, 20, 0 ],
  [ Species.TOTODILE, "Totodile", 2, 0, 0, 0, "Big Jaw Pokémon", Type.WATER, -1, 0.6, 9.5, "Torrent", null, "Sheer Force", 314, 50, 65, 64, 44, 48, 43, 45, 70, 63, GrowthRate.MEDIUM_SLOW, "Monster", "Water 1", 87.5, 20, 0 ],
  [ Species.CROCONAW, "Croconaw", 2, 0, 0, 0, "Big Jaw Pokémon", Type.WATER, -1, 1.1, 25, "Torrent", null, "Sheer Force", 405, 65, 80, 80, 59, 63, 58, 45, 70, 142, GrowthRate.MEDIUM_SLOW, "Monster", "Water 1", 87.5, 20, 0 ],
  [ Species.FERALIGATR, "Feraligatr", 2, 0, 0, 0, "Big Jaw Pokémon", Type.WATER, -1, 2.3, 88.8, "Torrent", null, "Sheer Force", 530, 85, 105, 100, 79, 83, 78, 45, 70, 239, GrowthRate.MEDIUM_SLOW, "Monster", "Water 1", 87.5, 20, 0 ],
  [ Species.SENTRET, "Sentret", 2, 0, 0, 0, "Scout Pokémon", Type.NORMAL, -1, 0.8, 6, "Run Away", "Keen Eye", "Frisk", 215, 35, 46, 34, 35, 45, 20, 255, 70, 43, GrowthRate.MEDIUM_FAST, "Field", null, 50, 15, 0 ],
  [ Species.FURRET, "Furret", 2, 0, 0, 0, "Long Body Pokémon", Type.NORMAL, -1, 1.8, 32.5, "Run Away", "Keen Eye", "Frisk", 415, 85, 76, 64, 45, 55, 90, 90, 70, 145, GrowthRate.MEDIUM_FAST, "Field", null, 50, 15, 0 ],
  [ Species.HOOTHOOT, "Hoothoot", 2, 0, 0, 0, "Owl Pokémon", Type.NORMAL, Type.FLYING, 0.7, 21.2, "Insomnia", "Keen Eye", "Tinted Lens", 262, 60, 30, 30, 36, 56, 50, 255, 70, 52, GrowthRate.MEDIUM_FAST, "Flying", null, 50, 15, 0 ],
  [ Species.NOCTOWL, "Noctowl", 2, 0, 0, 0, "Owl Pokémon", Type.NORMAL, Type.FLYING, 1.6, 40.8, "Insomnia", "Keen Eye", "Tinted Lens", 452, 100, 50, 50, 86, 96, 70, 90, 70, 158, GrowthRate.MEDIUM_FAST, "Flying", null, 50, 15, 0 ],
  [ Species.LEDYBA, "Ledyba", 2, 0, 0, 0, "Five Star Pokémon", Type.BUG, Type.FLYING, 1, 10.8, "Swarm", "Early Bird", "Rattled", 265, 40, 20, 30, 40, 80, 55, 255, 70, 53, GrowthRate.FAST, "Bug", null, 50, 15, 1 ],
  [ Species.LEDIAN, "Ledian", 2, 0, 0, 0, "Five Star Pokémon", Type.BUG, Type.FLYING, 1.4, 35.6, "Swarm", "Early Bird", "Iron Fist", 390, 55, 35, 50, 55, 110, 85, 90, 70, 137, GrowthRate.FAST, "Bug", null, 50, 15, 1 ],
  [ Species.SPINARAK, "Spinarak", 2, 0, 0, 0, "String Spit Pokémon", Type.BUG, Type.POISON, 0.5, 8.5, "Swarm", "Insomnia", "Sniper", 250, 40, 60, 40, 40, 40, 30, 255, 70, 50, GrowthRate.FAST, "Bug", null, 50, 15, 0 ],
  [ Species.ARIADOS, "Ariados", 2, 0, 0, 0, "Long Leg Pokémon", Type.BUG, Type.POISON, 1.1, 33.5, "Swarm", "Insomnia", "Sniper", 400, 70, 90, 70, 60, 70, 40, 90, 70, 140, GrowthRate.FAST, "Bug", null, 50, 15, 0 ],
  [ Species.CROBAT, "Crobat", 2, 0, 0, 0, "Bat Pokémon", Type.POISON, Type.FLYING, 1.8, 75, "Inner Focus", null, "Infiltrator", 535, 85, 90, 80, 70, 80, 130, 90, 70, 241, GrowthRate.MEDIUM_FAST, "Flying", null, 50, 15, 0 ],
  [ Species.CHINCHOU, "Chinchou", 2, 0, 0, 0, "Angler Pokémon", Type.WATER, Type.ELECTRIC, 0.5, 12, "Volt Absorb", "Illuminate", "Water Absorb", 330, 75, 38, 38, 56, 56, 67, 190, 70, 66, GrowthRate.SLOW, "Water 2", null, 50, 20, 0 ],
  [ Species.LANTURN, "Lanturn", 2, 0, 0, 0, "Light Pokémon", Type.WATER, Type.ELECTRIC, 1.2, 22.5, "Volt Absorb", "Illuminate", "Water Absorb", 460, 125, 58, 58, 76, 76, 67, 75, 70, 161, GrowthRate.SLOW, "Water 2", null, 50, 20, 0 ],
  [ Species.PICHU, "Pichu", 2, 0, 0, 0, "Tiny Mouse Pokémon", Type.ELECTRIC, -1, 0.3, 2, "Static", null, "Lightning Rod", 205, 20, 40, 15, 35, 35, 60, 190, 70, 41, GrowthRate.MEDIUM_FAST, "Undiscovered", null, 50, 10, 0 ],
  [ Species.CLEFFA, "Cleffa", 2, 0, 0, 0, "Star Shape Pokémon", Type.FAIRY, -1, 0.3, 3, "Cute Charm", "Magic Guard", "Friend Guard", 218, 50, 25, 28, 45, 55, 15, 150, 140, 44, GrowthRate.FAST, "Undiscovered", null, 25, 10, 0 ],
  [ Species.IGGLYBUFF, "Igglybuff", 2, 0, 0, 0, "Balloon Pokémon", Type.NORMAL, Type.FAIRY, 0.3, 1, "Cute Charm", "Competitive", "Friend Guard", 210, 90, 30, 15, 40, 20, 15, 170, 70, 42, GrowthRate.FAST, "Undiscovered", null, 25, 10, 0 ],
  [ Species.TOGEPI, "Togepi", 2, 0, 0, 0, "Spike Ball Pokémon", Type.FAIRY, -1, 0.3, 1.5, "Hustle", "Serene Grace", "Super Luck", 245, 35, 20, 65, 40, 65, 20, 190, 70, 49, GrowthRate.FAST, "Undiscovered", null, 87.5, 10, 0 ],
  [ Species.TOGETIC, "Togetic", 2, 0, 0, 0, "Happiness Pokémon", Type.FAIRY, Type.FLYING, 0.6, 3.2, "Hustle", "Serene Grace", "Super Luck", 405, 55, 40, 85, 80, 105, 40, 75, 70, 142, GrowthRate.FAST, "Fairy", "Flying", 87.5, 10, 0 ],
  [ Species.NATU, "Natu", 2, 0, 0, 0, "Tiny Bird Pokémon", Type.PSYCHIC, Type.FLYING, 0.2, 2, "Synchronize", "Early Bird", "Magic Bounce", 320, 40, 50, 45, 70, 45, 70, 190, 70, 64, GrowthRate.MEDIUM_FAST, "Flying", null, 50, 20, 0 ],
  [ Species.XATU, "Xatu", 2, 0, 0, 0, "Mystic Pokémon", Type.PSYCHIC, Type.FLYING, 1.5, 15, "Synchronize", "Early Bird", "Magic Bounce", 470, 65, 75, 70, 95, 70, 95, 75, 70, 165, GrowthRate.MEDIUM_FAST, "Flying", null, 50, 20, 1 ],
  [ Species.MAREEP, "Mareep", 2, 0, 0, 0, "Wool Pokémon", Type.ELECTRIC, -1, 0.6, 7.8, "Static", null, "Plus", 280, 55, 40, 40, 65, 45, 35, 235, 70, 56, GrowthRate.MEDIUM_SLOW, "Field", "Monster", 50, 20, 0 ],
  [ Species.FLAAFFY, "Flaaffy", 2, 0, 0, 0, "Wool Pokémon", Type.ELECTRIC, -1, 0.8, 13.3, "Static", null, "Plus", 365, 70, 55, 55, 80, 60, 45, 120, 70, 128, GrowthRate.MEDIUM_SLOW, "Field", "Monster", 50, 20, 0 ],
  [ Species.AMPHAROS, "Ampharos", 2, 0, 0, 0, "Light Pokémon", Type.ELECTRIC, -1, 1.4, 61.5, "Static", null, "Plus", 510, 90, 75, 85, 115, 90, 55, 45, 70, 230, GrowthRate.MEDIUM_SLOW, "Field", "Monster", 50, 20, 0 ],
  [ Species.BELLOSSOM, "Bellossom", 2, 0, 0, 0, "Flower Pokémon", Type.GRASS, -1, 0.4, 5.8, "Chlorophyll", null, "Healer", 490, 75, 80, 95, 90, 100, 50, 45, 70, 221, GrowthRate.MEDIUM_SLOW, "Grass", null, 50, 20, 0 ],
  [ Species.MARILL, "Marill", 2, 0, 0, 0, "Aqua Mouse Pokémon", Type.WATER, Type.FAIRY, 0.4, 8.5, "Thick Fat", "Huge Power", "Sap Sipper", 250, 70, 20, 50, 20, 50, 40, 190, 70, 88, GrowthRate.FAST, "Fairy", "Water 1", 50, 10, 0 ],
  [ Species.AZUMARILL, "Azumarill", 2, 0, 0, 0, "Aqua Rabbit Pokémon", Type.WATER, Type.FAIRY, 0.8, 28.5, "Thick Fat", "Huge Power", "Sap Sipper", 420, 100, 50, 80, 60, 80, 50, 75, 70, 189, GrowthRate.FAST, "Fairy", "Water 1", 50, 10, 0 ],
  [ Species.SUDOWOODO, "Sudowoodo", 2, 0, 0, 0, "Imitation Pokémon", Type.ROCK, -1, 1.2, 38, "Sturdy", "Rock Head", "Rattled", 410, 70, 100, 115, 30, 65, 30, 65, 70, 144, GrowthRate.MEDIUM_FAST, "Mineral", null, 50, 20, 1 ],
  [ Species.POLITOED, "Politoed", 2, 0, 0, 0, "Frog Pokémon", Type.WATER, -1, 1.1, 33.9, "Water Absorb", "Damp", "Drizzle", 500, 90, 75, 75, 90, 100, 70, 45, 70, 225, GrowthRate.MEDIUM_SLOW, "Water 1", null, 50, 20, 1 ],
  [ Species.HOPPIP, "Hoppip", 2, 0, 0, 0, "Cottonweed Pokémon", Type.GRASS, Type.FLYING, 0.4, 0.5, "Chlorophyll", "Leaf Guard", "Infiltrator", 250, 35, 35, 40, 35, 55, 50, 255, 70, 50, GrowthRate.MEDIUM_SLOW, "Fairy", "Grass", 50, 20, 0 ],
  [ Species.SKIPLOOM, "Skiploom", 2, 0, 0, 0, "Cottonweed Pokémon", Type.GRASS, Type.FLYING, 0.6, 1, "Chlorophyll", "Leaf Guard", "Infiltrator", 340, 55, 45, 50, 45, 65, 80, 120, 70, 119, GrowthRate.MEDIUM_SLOW, "Fairy", "Grass", 50, 20, 0 ],
  [ Species.JUMPLUFF, "Jumpluff", 2, 0, 0, 0, "Cottonweed Pokémon", Type.GRASS, Type.FLYING, 0.8, 3, "Chlorophyll", "Leaf Guard", "Infiltrator", 460, 75, 55, 70, 55, 95, 110, 45, 70, 207, GrowthRate.MEDIUM_SLOW, "Fairy", "Grass", 50, 20, 0 ],
  [ Species.AIPOM, "Aipom", 2, 0, 0, 0, "Long Tail Pokémon", Type.NORMAL, -1, 0.8, 11.5, "Run Away", "Pickup", "Skill Link", 360, 55, 70, 55, 40, 55, 85, 45, 70, 72, GrowthRate.FAST, "Field", null, 50, 20, 1 ],
  [ Species.SUNKERN, "Sunkern", 2, 0, 0, 0, "Seed Pokémon", Type.GRASS, -1, 0.3, 1.8, "Chlorophyll", "Solar Power", "Early Bird", 180, 30, 30, 30, 30, 30, 30, 235, 70, 36, GrowthRate.MEDIUM_SLOW, "Grass", null, 50, 20, 0 ],
  [ Species.SUNFLORA, "Sunflora", 2, 0, 0, 0, "Sun Pokémon", Type.GRASS, -1, 0.8, 8.5, "Chlorophyll", "Solar Power", "Early Bird", 425, 75, 75, 55, 105, 85, 30, 120, 70, 149, GrowthRate.MEDIUM_SLOW, "Grass", null, 50, 20, 0 ],
  [ Species.YANMA, "Yanma", 2, 0, 0, 0, "Clear Wing Pokémon", Type.BUG, Type.FLYING, 1.2, 38, "Speed Boost", "Compound Eyes", "Frisk", 390, 65, 65, 45, 75, 45, 95, 75, 70, 78, GrowthRate.MEDIUM_FAST, "Bug", null, 50, 20, 0 ],
  [ Species.WOOPER, "Wooper", 2, 0, 0, 0, "Water Fish Pokémon", Type.WATER, Type.GROUND, 0.4, 8.5, "Damp", "Water Absorb", "Unaware", 210, 55, 45, 45, 25, 25, 15, 255, 70, 42, GrowthRate.MEDIUM_FAST, "Field", "Water 1", 50, 20, 1 ],
  [ Species.QUAGSIRE, "Quagsire", 2, 0, 0, 0, "Water Fish Pokémon", Type.WATER, Type.GROUND, 1.4, 75, "Damp", "Water Absorb", "Unaware", 430, 95, 85, 85, 65, 65, 35, 90, 70, 151, GrowthRate.MEDIUM_FAST, "Field", "Water 1", 50, 20, 1 ],
  [ Species.ESPEON, "Espeon", 2, 0, 0, 0, "Sun Pokémon", Type.PSYCHIC, -1, 0.9, 26.5, "Synchronize", null, "Magic Bounce", 525, 65, 65, 60, 130, 95, 110, 45, 70, 184, GrowthRate.MEDIUM_FAST, "Field", null, 87.5, 35, 0 ],
  [ Species.UMBREON, "Umbreon", 2, 0, 0, 0, "Moonlight Pokémon", Type.DARK, -1, 1, 27, "Synchronize", null, "Inner Focus", 525, 95, 65, 110, 60, 130, 65, 45, 35, 184, GrowthRate.MEDIUM_FAST, "Field", null, 87.5, 35, 0 ],
  [ Species.MURKROW, "Murkrow", 2, 0, 0, 0, "Darkness Pokémon", Type.DARK, Type.FLYING, 0.5, 2.1, "Insomnia", "Super Luck", "Prankster", 405, 60, 85, 42, 85, 32, 91, 30, 35, 81, GrowthRate.MEDIUM_SLOW, "Flying", null, 50, 20, 1 ],
  [ Species.SLOWKING, "Slowking", 2, 0, 0, 0, "Royal Pokémon", Type.WATER, Type.PSYCHIC, 2, 79.5, "Oblivious", "Own Tempo", "Regenerator", 490, 95, 75, 80, 100, 110, 30, 70, 70, 172, GrowthRate.MEDIUM_FAST, "Monster", "Water 1", 50, 20, 0 ],
  [ Species.MISDREAVUS, "Misdreavus", 2, 0, 0, 0, "Screech Pokémon", Type.GHOST, -1, 0.7, 1, "Levitate", null, null, 435, 60, 60, 60, 85, 85, 85, 45, 35, 87, GrowthRate.FAST, "Amorphous", null, 50, 25, 0 ],
  [ Species.UNOWN, "Unown", 2, 0, 0, 0, "Symbol Pokémon", Type.PSYCHIC, -1, 0.5, 5, "Levitate", null, null, 336, 48, 72, 48, 72, 48, 48, 225, 70, 118, GrowthRate.MEDIUM_FAST, "Undiscovered", null, null, 40, 1 ],
  [ Species.WOBBUFFET, "Wobbuffet", 2, 0, 0, 0, "Patient Pokémon", Type.PSYCHIC, -1, 1.3, 28.5, "Shadow Tag", null, "Telepathy", 405, 190, 33, 58, 33, 58, 33, 45, 70, 142, GrowthRate.MEDIUM_FAST, "Amorphous", null, 50, 20, 1 ],
  [ Species.GIRAFARIG, "Girafarig", 2, 0, 0, 0, "Long Neck Pokémon", Type.NORMAL, Type.PSYCHIC, 1.5, 41.5, "Inner Focus", "Early Bird", "Sap Sipper", 455, 70, 80, 65, 90, 65, 85, 60, 70, 159, GrowthRate.MEDIUM_FAST, "Field", null, 50, 20, 1 ],
  [ Species.PINECO, "Pineco", 2, 0, 0, 0, "Bagworm Pokémon", Type.BUG, -1, 0.6, 7.2, "Sturdy", null, "Overcoat", 290, 50, 65, 90, 35, 35, 15, 190, 70, 58, GrowthRate.MEDIUM_FAST, "Bug", null, 50, 20, 0 ],
  [ Species.FORRETRESS, "Forretress", 2, 0, 0, 0, "Bagworm Pokémon", Type.BUG, Type.STEEL, 1.2, 125.8, "Sturdy", null, "Overcoat", 465, 75, 90, 140, 60, 60, 40, 75, 70, 163, GrowthRate.MEDIUM_FAST, "Bug", null, 50, 20, 0 ],
  [ Species.DUNSPARCE, "Dunsparce", 2, 0, 0, 0, "Land Snake Pokémon", Type.NORMAL, -1, 1.5, 14, "Serene Grace", "Run Away", "Rattled", 415, 100, 70, 70, 65, 65, 45, 190, 70, 145, GrowthRate.MEDIUM_FAST, "Field", null, 50, 20, 0 ],
  [ Species.GLIGAR, "Gligar", 2, 0, 0, 0, "FlyScorpion Pokémon", Type.GROUND, Type.FLYING, 1.1, 64.8, "Hyper Cutter", "Sand Veil", "Immunity", 430, 65, 75, 105, 35, 65, 85, 60, 70, 86, GrowthRate.MEDIUM_SLOW, "Bug", null, 50, 20, 1 ],
  [ Species.STEELIX, "Steelix", 2, 0, 0, 0, "Iron Snake Pokémon", Type.STEEL, Type.GROUND, 9.2, 400, "Rock Head", "Sturdy", "Sheer Force", 510, 75, 85, 200, 55, 65, 30, 25, 70, 179, GrowthRate.MEDIUM_FAST, "Mineral", null, 50, 25, 1 ],
  [ Species.SNUBBULL, "Snubbull", 2, 0, 0, 0, "Fairy Pokémon", Type.FAIRY, -1, 0.6, 7.8, "Intimidate", "Run Away", "Rattled", 300, 60, 80, 50, 40, 40, 30, 190, 70, 60, GrowthRate.FAST, "Fairy", "Field", 25, 20, 0 ],
  [ Species.GRANBULL, "Granbull", 2, 0, 0, 0, "Fairy Pokémon", Type.FAIRY, -1, 1.4, 48.7, "Intimidate", "Quick Feet", "Rattled", 450, 90, 120, 75, 60, 60, 45, 75, 70, 158, GrowthRate.FAST, "Fairy", "Field", 25, 20, 0 ],
  [ Species.QWILFISH, "Qwilfish", 2, 0, 0, 0, "Balloon Pokémon", Type.WATER, Type.POISON, 0.5, 3.9, "Poison Point", "Swift Swim", "Intimidate", 440, 65, 95, 85, 55, 55, 85, 45, 70, 88, GrowthRate.MEDIUM_FAST, "Water 2", null, 50, 20, 0 ],
  [ Species.SCIZOR, "Scizor", 2, 0, 0, 0, "Pincer Pokémon", Type.BUG, Type.STEEL, 1.8, 118, "Swarm", "Technician", "Light Metal", 500, 70, 130, 100, 55, 80, 65, 25, 70, 175, GrowthRate.MEDIUM_FAST, "Bug", null, 50, 25, 1 ],
  [ Species.SHUCKLE, "Shuckle", 2, 0, 0, 0, "Mold Pokémon", Type.BUG, Type.ROCK, 0.6, 20.5, "Sturdy", "Gluttony", "Contrary", 505, 20, 10, 230, 10, 230, 5, 190, 70, 177, GrowthRate.MEDIUM_SLOW, "Bug", null, 50, 20, 0 ],
  [ Species.HERACROSS, "Heracross", 2, 0, 0, 0, "Single Horn Pokémon", Type.BUG, Type.FIGHTING, 1.5, 54, "Swarm", "Guts", "Moxie", 500, 80, 125, 75, 40, 95, 85, 45, 70, 175, GrowthRate.SLOW, "Bug", null, 50, 25, 1 ],
  [ Species.SNEASEL, "Sneasel", 2, 0, 0, 0, "Sharp Claw Pokémon", Type.DARK, Type.ICE, 0.9, 28, "Inner Focus", "Keen Eye", "Pickpocket", 430, 55, 95, 55, 35, 75, 115, 60, 35, 86, GrowthRate.MEDIUM_SLOW, "Field", null, 50, 20, 1 ],
  [ Species.TEDDIURSA, "Teddiursa", 2, 0, 0, 0, "Little Bear Pokémon", Type.NORMAL, -1, 0.6, 8.8, "Pickup", "Quick Feet", "Honey Gather", 330, 60, 80, 50, 50, 50, 40, 120, 70, 66, GrowthRate.MEDIUM_FAST, "Field", null, 50, 20, 0 ],
  [ Species.URSARING, "Ursaring", 2, 0, 0, 0, "Hibernator Pokémon", Type.NORMAL, -1, 1.8, 125.8, "Guts", "Quick Feet", "Unnerve", 500, 90, 130, 75, 75, 75, 55, 60, 70, 175, GrowthRate.MEDIUM_FAST, "Field", null, 50, 20, 1 ],
  [ Species.SLUGMA, "Slugma", 2, 0, 0, 0, "Lava Pokémon", Type.FIRE, -1, 0.7, 35, "Magma Armor", "Flame Body", "Weak Armor", 250, 40, 40, 40, 70, 40, 20, 190, 70, 50, GrowthRate.MEDIUM_FAST, "Amorphous", null, 50, 20, 0 ],
  [ Species.MAGCARGO, "Magcargo", 2, 0, 0, 0, "Lava Pokémon", Type.FIRE, Type.ROCK, 0.8, 55, "Magma Armor", "Flame Body", "Weak Armor", 430, 60, 50, 120, 90, 80, 30, 75, 70, 151, GrowthRate.MEDIUM_FAST, "Amorphous", null, 50, 20, 0 ],
  [ Species.SWINUB, "Swinub", 2, 0, 0, 0, "Pig Pokémon", Type.ICE, Type.GROUND, 0.4, 6.5, "Oblivious", "Snow Cloak", "Thick Fat", 250, 50, 50, 40, 30, 30, 50, 225, 70, 50, GrowthRate.SLOW, "Field", null, 50, 20, 0 ],
  [ Species.PILOSWINE, "Piloswine", 2, 0, 0, 0, "Swine Pokémon", Type.ICE, Type.GROUND, 1.1, 55.8, "Oblivious", "Snow Cloak", "Thick Fat", 450, 100, 100, 80, 60, 60, 50, 75, 70, 158, GrowthRate.SLOW, "Field", null, 50, 20, 1 ],
  [ Species.CORSOLA, "Corsola", 2, 0, 0, 0, "Coral Pokémon", Type.WATER, Type.ROCK, 0.6, 5, "Hustle", "Natural Cure", "Regenerator", 410, 65, 55, 95, 65, 95, 35, 60, 70, 144, GrowthRate.FAST, "Water 1", "Water 3", 25, 20, 0 ],
  [ Species.REMORAID, "Remoraid", 2, 0, 0, 0, "Jet Pokémon", Type.WATER, -1, 0.6, 12, "Hustle", "Sniper", "Moody", 300, 35, 65, 35, 65, 35, 65, 190, 70, 60, GrowthRate.MEDIUM_FAST, "Water 1", "Water 2", 50, 20, 0 ],
  [ Species.OCTILLERY, "Octillery", 2, 0, 0, 0, "Jet Pokémon", Type.WATER, -1, 0.9, 28.5, "Suction Cups", "Sniper", "Moody", 480, 75, 105, 75, 105, 75, 45, 75, 70, 168, GrowthRate.MEDIUM_FAST, "Water 1", "Water 2", 50, 20, 1 ],
  [ Species.DELIBIRD, "Delibird", 2, 0, 0, 0, "Delivery Pokémon", Type.ICE, Type.FLYING, 0.9, 16, "Vital Spirit", "Hustle", "Insomnia", 330, 45, 55, 45, 65, 45, 75, 45, 70, 116, GrowthRate.FAST, "Field", "Water 1", 50, 20, 0 ],
  [ Species.MANTINE, "Mantine", 2, 0, 0, 0, "Kite Pokémon", Type.WATER, Type.FLYING, 2.1, 220, "Swift Swim", "Water Absorb", "Water Veil", 485, 85, 40, 70, 80, 140, 70, 25, 70, 170, GrowthRate.SLOW, "Water 1", null, 50, 25, 0 ],
  [ Species.SKARMORY, "Skarmory", 2, 0, 0, 0, "Armor Bird Pokémon", Type.STEEL, Type.FLYING, 1.7, 50.5, "Keen Eye", "Sturdy", "Weak Armor", 465, 65, 80, 140, 40, 70, 70, 25, 70, 163, GrowthRate.SLOW, "Flying", null, 50, 25, 0 ],
  [ Species.HOUNDOUR, "Houndour", 2, 0, 0, 0, "Dark Pokémon", Type.DARK, Type.FIRE, 0.6, 10.8, "Early Bird", "Flash Fire", "Unnerve", 330, 45, 60, 30, 80, 50, 65, 120, 35, 66, GrowthRate.SLOW, "Field", null, 50, 20, 0 ],
  [ Species.HOUNDOOM, "Houndoom", 2, 0, 0, 0, "Dark Pokémon", Type.DARK, Type.FIRE, 1.4, 35, "Early Bird", "Flash Fire", "Unnerve", 500, 75, 90, 50, 110, 80, 95, 45, 35, 175, GrowthRate.SLOW, "Field", null, 50, 20, 1 ],
  [ Species.KINGDRA, "Kingdra", 2, 0, 0, 0, "Dragon Pokémon", Type.WATER, Type.DRAGON, 1.8, 152, "Swift Swim", "Sniper", "Damp", 540, 75, 95, 95, 95, 95, 85, 45, 70, 243, GrowthRate.MEDIUM_FAST, "Dragon", "Water 1", 50, 20, 0 ],
  [ Species.PHANPY, "Phanpy", 2, 0, 0, 0, "Long Nose Pokémon", Type.GROUND, -1, 0.5, 33.5, "Pickup", null, "Sand Veil", 330, 90, 60, 60, 40, 40, 40, 120, 70, 66, GrowthRate.MEDIUM_FAST, "Field", null, 50, 20, 0 ],
  [ Species.DONPHAN, "Donphan", 2, 0, 0, 0, "Armor Pokémon", Type.GROUND, -1, 1.1, 120, "Sturdy", null, "Sand Veil", 500, 90, 120, 120, 60, 60, 50, 60, 70, 175, GrowthRate.MEDIUM_FAST, "Field", null, 50, 20, 1 ],
  [ Species.PORYGON2, "Porygon2", 2, 0, 0, 0, "Virtual Pokémon", Type.NORMAL, -1, 0.6, 32.5, "Trace", "Download", "Analytic", 515, 85, 80, 90, 105, 95, 60, 45, 70, 180, GrowthRate.MEDIUM_FAST, "Mineral", null, null, 20, 0 ],
  [ Species.STANTLER, "Stantler", 2, 0, 0, 0, "Big Horn Pokémon", Type.NORMAL, -1, 1.4, 71.2, "Intimidate", "Frisk", "Sap Sipper", 465, 73, 95, 62, 85, 65, 85, 45, 70, 163, GrowthRate.SLOW, "Field", null, 50, 20, 0 ],
  [ Species.SMEARGLE, "Smeargle", 2, 0, 0, 0, "Painter Pokémon", Type.NORMAL, -1, 1.2, 58, "Own Tempo", "Technician", "Moody", 250, 55, 20, 35, 20, 45, 75, 45, 70, 88, GrowthRate.FAST, "Field", null, 50, 20, 0 ],
  [ Species.TYROGUE, "Tyrogue", 2, 0, 0, 0, "Scuffle Pokémon", Type.FIGHTING, -1, 0.7, 21, "Guts", "Steadfast", "Vital Spirit", 210, 35, 35, 35, 35, 35, 35, 75, 70, 42, GrowthRate.MEDIUM_FAST, "Undiscovered", null, 100, 25, 0 ],
  [ Species.HITMONTOP, "Hitmontop", 2, 0, 0, 0, "Handstand Pokémon", Type.FIGHTING, -1, 1.4, 48, "Intimidate", "Technician", "Steadfast", 455, 50, 95, 95, 35, 110, 70, 45, 70, 159, GrowthRate.MEDIUM_FAST, "Human-Like", null, 100, 25, 0 ],
  [ Species.SMOOCHUM, "Smoochum", 2, 0, 0, 0, "Kiss Pokémon", Type.ICE, Type.PSYCHIC, 0.4, 6, "Oblivious", "Forewarn", "Hydration", 305, 45, 30, 15, 85, 65, 65, 45, 70, 61, GrowthRate.MEDIUM_FAST, "Undiscovered", null, 0, 25, 0 ],
  [ Species.ELEKID, "Elekid", 2, 0, 0, 0, "Electric Pokémon", Type.ELECTRIC, -1, 0.6, 23.5, "Static", null, "Vital Spirit", 360, 45, 63, 37, 65, 55, 95, 45, 70, 72, GrowthRate.MEDIUM_FAST, "Undiscovered", null, 75, 25, 0 ],
  [ Species.MAGBY, "Magby", 2, 0, 0, 0, "Live Coal Pokémon", Type.FIRE, -1, 0.7, 21.4, "Flame Body", null, "Vital Spirit", 365, 45, 75, 37, 70, 55, 83, 45, 70, 73, GrowthRate.MEDIUM_FAST, "Undiscovered", null, 75, 25, 0 ],
  [ Species.MILTANK, "Miltank", 2, 0, 0, 0, "Milk Cow Pokémon", Type.NORMAL, -1, 1.2, 75.5, "Thick Fat", "Scrappy", "Sap Sipper", 490, 95, 80, 105, 40, 70, 100, 45, 70, 172, GrowthRate.SLOW, "Field", null, 0, 20, 0 ],
  [ Species.BLISSEY, "Blissey", 2, 0, 0, 0, "Happiness Pokémon", Type.NORMAL, -1, 1.5, 46.8, "Natural Cure", "Serene Grace", "Healer", 540, 255, 10, 10, 75, 135, 55, 30, 140, 608, GrowthRate.FAST, "Fairy", null, 0, 40, 0 ],
  [ Species.RAIKOU, "Raikou", 2, 1, 0, 0, "Thunder Pokémon", Type.ELECTRIC, -1, 1.9, 178, "Pressure", null, "Inner Focus", 580, 90, 85, 75, 115, 100, 115, 3, 35, 261, GrowthRate.SLOW, "Undiscovered", null, null, 80, 0 ],
  [ Species.ENTEI, "Entei", 2, 1, 0, 0, "Volcano Pokémon", Type.FIRE, -1, 2.1, 198, "Pressure", null, "Inner Focus", 580, 115, 115, 85, 90, 75, 100, 3, 35, 261, GrowthRate.SLOW, "Undiscovered", null, null, 80, 0 ],
  [ Species.SUICUNE, "Suicune", 2, 1, 0, 0, "Aurora Pokémon", Type.WATER, -1, 2, 187, "Pressure", null, "Inner Focus", 580, 100, 75, 115, 90, 115, 85, 3, 35, 261, GrowthRate.SLOW, "Undiscovered", null, null, 80, 0 ],
  [ Species.LARVITAR, "Larvitar", 2, 0, 0, 0, "Rock Skin Pokémon", Type.ROCK, Type.GROUND, 0.6, 72, "Guts", null, "Sand Veil", 300, 50, 64, 50, 45, 50, 41, 45, 35, 60, GrowthRate.SLOW, "Monster", null, 50, 40, 0 ],
  [ Species.PUPITAR, "Pupitar", 2, 0, 0, 0, "Hard Shell Pokémon", Type.ROCK, Type.GROUND, 1.2, 152, "Shed Skin", null, null, 410, 70, 84, 70, 65, 70, 51, 45, 35, 144, GrowthRate.SLOW, "Monster", null, 50, 40, 0 ],
  [ Species.TYRANITAR, "Tyranitar", 2, 0, 0, 0, "Armor Pokémon", Type.ROCK, Type.DARK, 2, 202, "Sand Stream", null, "Unnerve", 600, 100, 134, 110, 95, 100, 61, 45, 35, 270, GrowthRate.SLOW, "Monster", null, 50, 40, 0 ],
  [ Species.LUGIA, "Lugia", 2, 0, 1, 0, "Diving Pokémon", Type.PSYCHIC, Type.FLYING, 5.2, 216, "Pressure", null, "Multiscale", 680, 106, 90, 130, 90, 154, 110, 3, 0, 306, GrowthRate.SLOW, "Undiscovered", null, null, 120, 0 ],
  [ Species.HO_OH, "Ho-oh", 2, 0, 1, 0, "Rainbow Pokémon", Type.FIRE, Type.FLYING, 3.8, 199, "Pressure", null, "Regenerator", 680, 106, 130, 90, 110, 154, 90, 3, 0, 306, GrowthRate.SLOW, "Undiscovered", null, null, 120, 0 ],
  [ Species.CELEBI, "Celebi", 2, 0, 0, 1, "Time Travel Pokémon", Type.PSYCHIC, Type.GRASS, 0.6, 5, "Natural Cure", null, null, 600, 100, 100, 100, 100, 100, 100, 45, 100, 270, GrowthRate.MEDIUM_SLOW, "Undiscovered", null, null, 120, 0 ],
  [ Species.TREECKO, "Treecko", 3, 0, 0, 0, "Wood Gecko Pokémon", Type.GRASS, -1, 0.5, 5, "Overgrow", null, "Unburden", 310, 40, 45, 35, 65, 55, 70, 45, 70, 62, GrowthRate.MEDIUM_SLOW, "Dragon", "Monster", 87.5, 20, 0 ],
  [ Species.GROVYLE, "Grovyle", 3, 0, 0, 0, "Wood Gecko Pokémon", Type.GRASS, -1, 0.9, 21.6, "Overgrow", null, "Unburden", 405, 50, 65, 45, 85, 65, 95, 45, 70, 142, GrowthRate.MEDIUM_SLOW, "Dragon", "Monster", 87.5, 20, 0 ],
  [ Species.SCEPTILE, "Sceptile", 3, 0, 0, 0, "Forest Pokémon", Type.GRASS, -1, 1.7, 52.2, "Overgrow", null, "Unburden", 530, 70, 85, 65, 105, 85, 120, 45, 70, 239, GrowthRate.MEDIUM_SLOW, "Dragon", "Monster", 87.5, 20, 0 ],
  [ Species.TORCHIC, "Torchic", 3, 0, 0, 0, "Chick Pokémon", Type.FIRE, -1, 0.4, 2.5, "Blaze", null, "Speed Boost", 310, 45, 60, 40, 70, 50, 45, 45, 70, 62, GrowthRate.MEDIUM_SLOW, "Field", null, 87.5, 20, 1 ],
  [ Species.COMBUSKEN, "Combusken", 3, 0, 0, 0, "Young Fowl Pokémon", Type.FIRE, Type.FIGHTING, 0.9, 19.5, "Blaze", null, "Speed Boost", 405, 60, 85, 60, 85, 60, 55, 45, 70, 142, GrowthRate.MEDIUM_SLOW, "Field", null, 87.5, 20, 1 ],
  [ Species.BLAZIKEN, "Blaziken", 3, 0, 0, 0, "Blaze Pokémon", Type.FIRE, Type.FIGHTING, 1.9, 52, "Blaze", null, "Speed Boost", 530, 80, 120, 70, 110, 70, 80, 45, 70, 239, GrowthRate.MEDIUM_SLOW, "Field", null, 87.5, 20, 1 ],
  [ Species.MUDKIP, "Mudkip", 3, 0, 0, 0, "Mud Fish Pokémon", Type.WATER, -1, 0.4, 7.6, "Torrent", null, "Damp", 310, 50, 70, 50, 50, 50, 40, 45, 70, 62, GrowthRate.MEDIUM_SLOW, "Monster", "Water 1", 87.5, 20, 0 ],
  [ Species.MARSHTOMP, "Marshtomp", 3, 0, 0, 0, "Mud Fish Pokémon", Type.WATER, Type.GROUND, 0.7, 28, "Torrent", null, "Damp", 405, 70, 85, 70, 60, 70, 50, 45, 70, 142, GrowthRate.MEDIUM_SLOW, "Monster", "Water 1", 87.5, 20, 0 ],
  [ Species.SWAMPERT, "Swampert", 3, 0, 0, 0, "Mud Fish Pokémon", Type.WATER, Type.GROUND, 1.5, 81.9, "Torrent", null, "Damp", 535, 100, 110, 90, 85, 90, 60, 45, 70, 241, GrowthRate.MEDIUM_SLOW, "Monster", "Water 1", 87.5, 20, 0 ],
  [ Species.POOCHYENA, "Poochyena", 3, 0, 0, 0, "Bite Pokémon", Type.DARK, -1, 0.5, 13.6, "Run Away", "Quick Feet", "Rattled", 220, 35, 55, 35, 30, 30, 35, 255, 70, 56, GrowthRate.MEDIUM_FAST, "Field", null, 50, 15, 0 ],
  [ Species.MIGHTYENA, "Mightyena", 3, 0, 0, 0, "Bite Pokémon", Type.DARK, -1, 1, 37, "Intimidate", "Quick Feet", "Moxie", 420, 70, 90, 70, 60, 60, 70, 127, 70, 147, GrowthRate.MEDIUM_FAST, "Field", null, 50, 15, 0 ],
  [ Species.ZIGZAGOON, "Zigzagoon", 3, 0, 0, 0, "TinyRaccoon Pokémon", Type.NORMAL, -1, 0.4, 17.5, "Pickup", "Gluttony", "Quick Feet", 240, 38, 30, 41, 30, 41, 60, 255, 70, 56, GrowthRate.MEDIUM_FAST, "Field", null, 50, 15, 0 ],
  [ Species.LINOONE, "Linoone", 3, 0, 0, 0, "Rushing Pokémon", Type.NORMAL, -1, 0.5, 32.5, "Pickup", "Gluttony", "Quick Feet", 420, 78, 70, 61, 50, 61, 100, 90, 70, 147, GrowthRate.MEDIUM_FAST, "Field", null, 50, 15, 0 ],
  [ Species.WURMPLE, "Wurmple", 3, 0, 0, 0, "Worm Pokémon", Type.BUG, -1, 0.3, 3.6, "Shield Dust", null, "Run Away", 195, 45, 45, 35, 20, 30, 20, 255, 70, 56, GrowthRate.MEDIUM_FAST, "Bug", null, 50, 15, 0 ],
  [ Species.SILCOON, "Silcoon", 3, 0, 0, 0, "Cocoon Pokémon", Type.BUG, -1, 0.6, 10, "Shed Skin", null, null, 205, 50, 35, 55, 25, 25, 15, 120, 70, 72, GrowthRate.MEDIUM_FAST, "Bug", null, 50, 15, 0 ],
  [ Species.BEAUTIFLY, "Beautifly", 3, 0, 0, 0, "Butterfly Pokémon", Type.BUG, Type.FLYING, 1, 28.4, "Swarm", null, "Rivalry", 395, 60, 70, 50, 100, 50, 65, 45, 70, 178, GrowthRate.MEDIUM_FAST, "Bug", null, 50, 15, 1 ],
  [ Species.CASCOON, "Cascoon", 3, 0, 0, 0, "Cocoon Pokémon", Type.BUG, -1, 0.7, 11.5, "Shed Skin", null, null, 205, 50, 35, 55, 25, 25, 15, 120, 70, 72, GrowthRate.MEDIUM_FAST, "Bug", null, 50, 15, 0 ],
  [ Species.DUSTOX, "Dustox", 3, 0, 0, 0, "Poison Moth Pokémon", Type.BUG, Type.POISON, 1.2, 31.6, "Shield Dust", null, "Compound Eyes", 385, 60, 50, 70, 50, 90, 65, 45, 70, 173, GrowthRate.MEDIUM_FAST, "Bug", null, 50, 15, 1 ],
  [ Species.LOTAD, "Lotad", 3, 0, 0, 0, "Water Weed Pokémon", Type.WATER, Type.GRASS, 0.5, 2.6, "Swift Swim", "Rain Dish", "Own Tempo", 220, 40, 30, 30, 40, 50, 30, 255, 70, 44, GrowthRate.MEDIUM_SLOW, "Grass", "Water 1", 50, 15, 0 ],
  [ Species.LOMBRE, "Lombre", 3, 0, 0, 0, "Jolly Pokémon", Type.WATER, Type.GRASS, 1.2, 32.5, "Swift Swim", "Rain Dish", "Own Tempo", 340, 60, 50, 50, 60, 70, 50, 120, 70, 119, GrowthRate.MEDIUM_SLOW, "Grass", "Water 1", 50, 15, 0 ],
  [ Species.LUDICOLO, "Ludicolo", 3, 0, 0, 0, "Carefree Pokémon", Type.WATER, Type.GRASS, 1.5, 55, "Swift Swim", "Rain Dish", "Own Tempo", 480, 80, 70, 70, 90, 100, 70, 45, 70, 216, GrowthRate.MEDIUM_SLOW, "Grass", "Water 1", 50, 15, 1 ],
  [ Species.SEEDOT, "Seedot", 3, 0, 0, 0, "Acorn Pokémon", Type.GRASS, -1, 0.5, 4, "Chlorophyll", "Early Bird", "Pickpocket", 220, 40, 40, 50, 30, 30, 30, 255, 70, 44, GrowthRate.MEDIUM_SLOW, "Field", "Grass", 50, 15, 0 ],
  [ Species.NUZLEAF, "Nuzleaf", 3, 0, 0, 0, "Wily Pokémon", Type.GRASS, Type.DARK, 1, 28, "Chlorophyll", "Early Bird", "Pickpocket", 340, 70, 70, 40, 60, 40, 60, 120, 70, 119, GrowthRate.MEDIUM_SLOW, "Field", "Grass", 50, 15, 1 ],
  [ Species.SHIFTRY, "Shiftry", 3, 0, 0, 0, "Wicked Pokémon", Type.GRASS, Type.DARK, 1.3, 59.6, "Chlorophyll", "Early Bird", "Pickpocket", 480, 90, 100, 60, 90, 60, 80, 45, 70, 216, GrowthRate.MEDIUM_SLOW, "Field", "Grass", 50, 15, 1 ],
  [ Species.TAILLOW, "Taillow", 3, 0, 0, 0, "TinySwallow Pokémon", Type.NORMAL, Type.FLYING, 0.3, 2.3, "Guts", null, "Scrappy", 270, 40, 55, 30, 30, 30, 85, 200, 70, 54, GrowthRate.MEDIUM_SLOW, "Flying", null, 50, 15, 0 ],
  [ Species.SWELLOW, "Swellow", 3, 0, 0, 0, "Swallow Pokémon", Type.NORMAL, Type.FLYING, 0.7, 19.8, "Guts", null, "Scrappy", 455, 60, 85, 60, 75, 50, 125, 45, 70, 159, GrowthRate.MEDIUM_SLOW, "Flying", null, 50, 15, 0 ],
  [ Species.WINGULL, "Wingull", 3, 0, 0, 0, "Seagull Pokémon", Type.WATER, Type.FLYING, 0.6, 9.5, "Keen Eye", "Hydration", "Rain Dish", 270, 40, 30, 30, 55, 30, 85, 190, 70, 54, GrowthRate.MEDIUM_FAST, "Flying", "Water 1", 50, 20, 0 ],
  [ Species.PELIPPER, "Pelipper", 3, 0, 0, 0, "Water Bird Pokémon", Type.WATER, Type.FLYING, 1.2, 28, "Keen Eye", "Drizzle", "Rain Dish", 440, 60, 50, 100, 95, 70, 65, 45, 70, 154, GrowthRate.MEDIUM_FAST, "Flying", "Water 1", 50, 20, 0 ],
  [ Species.RALTS, "Ralts", 3, 0, 0, 0, "Feeling Pokémon", Type.PSYCHIC, Type.FAIRY, 0.4, 6.6, "Synchronize", "Trace", "Telepathy", 198, 28, 25, 25, 45, 35, 40, 235, 35, 40, GrowthRate.SLOW, "Amorphous", "Human-Like", 50, 20, 0 ],
  [ Species.KIRLIA, "Kirlia", 3, 0, 0, 0, "Emotion Pokémon", Type.PSYCHIC, Type.FAIRY, 0.8, 20.2, "Synchronize", "Trace", "Telepathy", 278, 38, 35, 35, 65, 55, 50, 120, 35, 97, GrowthRate.SLOW, "Amorphous", "Human-Like", 50, 20, 0 ],
  [ Species.GARDEVOIR, "Gardevoir", 3, 0, 0, 0, "Embrace Pokémon", Type.PSYCHIC, Type.FAIRY, 1.6, 48.4, "Synchronize", "Trace", "Telepathy", 518, 68, 65, 65, 125, 115, 80, 45, 35, 233, GrowthRate.SLOW, "Amorphous", "Human-Like", 50, 20, 0 ],
  [ Species.SURSKIT, "Surskit", 3, 0, 0, 0, "Pond Skater Pokémon", Type.BUG, Type.WATER, 0.5, 1.7, "Swift Swim", null, "Rain Dish", 269, 40, 30, 32, 50, 52, 65, 200, 70, 54, GrowthRate.MEDIUM_FAST, "Bug", "Water 1", 50, 15, 0 ],
  [ Species.MASQUERAIN, "Masquerain", 3, 0, 0, 0, "Eyeball Pokémon", Type.BUG, Type.FLYING, 0.8, 3.6, "Intimidate", null, "Unnerve", 454, 70, 60, 62, 100, 82, 80, 75, 70, 159, GrowthRate.MEDIUM_FAST, "Bug", "Water 1", 50, 15, 0 ],
  [ Species.SHROOMISH, "Shroomish", 3, 0, 0, 0, "Mushroom Pokémon", Type.GRASS, -1, 0.4, 4.5, "Effect Spore", "Poison Heal", "Quick Feet", 295, 60, 40, 60, 40, 60, 35, 255, 70, 59, GrowthRate.FLUCTUATING, 2, "Fairy", "Grass", 50, 15, 0 ],
  [ Species.BRELOOM, "Breloom", 3, 0, 0, 0, "Mushroom Pokémon", Type.GRASS, Type.FIGHTING, 1.2, 39.2, "Effect Spore", "Poison Heal", "Technician", 460, 60, 130, 80, 60, 60, 70, 90, 70, 161, GrowthRate.FLUCTUATING, 2, "Fairy", "Grass", 50, 15, 0 ],
  [ Species.SLAKOTH, "Slakoth", 3, 0, 0, 0, "Slacker Pokémon", Type.NORMAL, -1, 0.8, 24, "Truant", null, null, 280, 60, 60, 60, 35, 35, 30, 255, 70, 56, GrowthRate.SLOW, "Field", null, 50, 15, 0 ],
  [ Species.VIGOROTH, "Vigoroth", 3, 0, 0, 0, "Wild Monkey Pokémon", Type.NORMAL, -1, 1.4, 46.5, "Vital Spirit", null, null, 440, 80, 80, 80, 55, 55, 90, 120, 70, 154, GrowthRate.SLOW, "Field", null, 50, 15, 0 ],
  [ Species.SLAKING, "Slaking", 3, 0, 0, 0, "Lazy Pokémon", Type.NORMAL, -1, 2, 130.5, "Truant", null, null, 670, 150, 160, 100, 95, 65, 100, 45, 70, 252, GrowthRate.SLOW, "Field", null, 50, 15, 0 ],
  [ Species.NINCADA, "Nincada", 3, 0, 0, 0, "Trainee Pokémon", Type.BUG, Type.GROUND, 0.5, 5.5, "Compound Eyes", null, "Run Away", 266, 31, 45, 90, 30, 30, 40, 255, 70, 53, GrowthRate.ERRATIC, "Bug", null, 50, 15, 0 ],
  [ Species.NINJASK, "Ninjask", 3, 0, 0, 0, "Ninja Pokémon", Type.BUG, Type.FLYING, 0.8, 12, "Speed Boost", null, "Infiltrator", 456, 61, 90, 45, 50, 50, 160, 120, 70, 160, GrowthRate.ERRATIC, "Bug", null, 50, 15, 0 ],
  [ Species.SHEDINJA, "Shedinja", 3, 0, 0, 0, "Shed Pokémon", Type.BUG, Type.GHOST, 0.8, 1.2, "Wonder Guard", null, null, 236, 1, 90, 45, 30, 30, 40, 45, 70, 83, GrowthRate.ERRATIC, "Mineral", null, null, 15, 0 ],
  [ Species.WHISMUR, "Whismur", 3, 0, 0, 0, "Whisper Pokémon", Type.NORMAL, -1, 0.6, 16.3, "Soundproof", null, "Rattled", 240, 64, 51, 23, 51, 23, 28, 190, 70, 48, GrowthRate.MEDIUM_SLOW, "Field", "Monster", 50, 20, 0 ],
  [ Species.LOUDRED, "Loudred", 3, 0, 0, 0, "Big Voice Pokémon", Type.NORMAL, -1, 1, 40.5, "Soundproof", null, "Scrappy", 360, 84, 71, 43, 71, 43, 48, 120, 70, 126, GrowthRate.MEDIUM_SLOW, "Field", "Monster", 50, 20, 0 ],
  [ Species.EXPLOUD, "Exploud", 3, 0, 0, 0, "Loud Noise Pokémon", Type.NORMAL, -1, 1.5, 84, "Soundproof", null, "Scrappy", 490, 104, 91, 63, 91, 73, 68, 45, 70, 221, GrowthRate.MEDIUM_SLOW, "Field", "Monster", 50, 20, 0 ],
  [ Species.MAKUHITA, "Makuhita", 3, 0, 0, 0, "Guts Pokémon", Type.FIGHTING, -1, 1, 86.4, "Thick Fat", "Guts", "Sheer Force", 237, 72, 60, 30, 20, 30, 25, 180, 70, 47, GrowthRate.FLUCTUATING, "Human-Like", null, 75, 20, 0 ],
  [ Species.HARIYAMA, "Hariyama", 3, 0, 0, 0, "Arm Thrust Pokémon", Type.FIGHTING, -1, 2.3, 253.8, "Thick Fat", "Guts", "Sheer Force", 474, 144, 120, 60, 40, 60, 50, 200, 70, 166, GrowthRate.FLUCTUATING, "Human-Like", null, 75, 20, 0 ],
  [ Species.AZURILL, "Azurill", 3, 0, 0, 0, "Polka Dot Pokémon", Type.NORMAL, Type.FAIRY, 0.2, 2, "Thick Fat", "Huge Power", "Sap Sipper", 190, 50, 20, 40, 20, 40, 20, 150, 70, 38, GrowthRate.FAST, "Undiscovered", null, 25, 10, 0 ],
  [ Species.NOSEPASS, "Nosepass", 3, 0, 0, 0, "Compass Pokémon", Type.ROCK, -1, 1, 97, "Sturdy", "Magnet Pull", "Sand Force", 375, 30, 45, 135, 45, 90, 30, 255, 70, 75, GrowthRate.MEDIUM_FAST, "Mineral", null, 50, 20, 0 ],
  [ Species.SKITTY, "Skitty", 3, 0, 0, 0, "Kitten Pokémon", Type.NORMAL, -1, 0.6, 11, "Cute Charm", "Normalize", "Wonder Skin", 260, 50, 45, 45, 35, 35, 50, 255, 70, 52, GrowthRate.FAST, "Fairy", "Field", 25, 15, 0 ],
  [ Species.DELCATTY, "Delcatty", 3, 0, 0, 0, "Prim Pokémon", Type.NORMAL, -1, 1.1, 32.6, "Cute Charm", "Normalize", "Wonder Skin", 400, 70, 65, 65, 55, 55, 90, 60, 70, 140, GrowthRate.FAST, "Fairy", "Field", 25, 15, 0 ],
  [ Species.SABLEYE, "Sableye", 3, 0, 0, 0, "Darkness Pokémon", Type.DARK, Type.GHOST, 0.5, 11, "Keen Eye", "Stall", "Prankster", 380, 50, 75, 75, 65, 65, 50, 45, 35, 133, GrowthRate.MEDIUM_SLOW, "Human-Like", null, 50, 25, 0 ],
  [ Species.MAWILE, "Mawile", 3, 0, 0, 0, "Deceiver Pokémon", Type.STEEL, Type.FAIRY, 0.6, 11.5, "Hyper Cutter", "Intimidate", "Sheer Force", 380, 50, 85, 85, 55, 55, 50, 45, 70, 133, GrowthRate.FAST, "Fairy", "Field", 50, 20, 0 ],
  [ Species.ARON, "Aron", 3, 0, 0, 0, "Iron Armor Pokémon", Type.STEEL, Type.ROCK, 0.4, 60, "Sturdy", "Rock Head", "Heavy Metal", 330, 50, 70, 100, 40, 40, 30, 180, 35, 66, GrowthRate.SLOW, "Monster", null, 50, 35, 0 ],
  [ Species.LAIRON, "Lairon", 3, 0, 0, 0, "Iron Armor Pokémon", Type.STEEL, Type.ROCK, 0.9, 120, "Sturdy", "Rock Head", "Heavy Metal", 430, 60, 90, 140, 50, 50, 40, 90, 35, 151, GrowthRate.SLOW, "Monster", null, 50, 35, 0 ],
  [ Species.AGGRON, "Aggron", 3, 0, 0, 0, "Iron Armor Pokémon", Type.STEEL, Type.ROCK, 2.1, 360, "Sturdy", "Rock Head", "Heavy Metal", 530, 70, 110, 180, 60, 60, 50, 45, 35, 239, GrowthRate.SLOW, "Monster", null, 50, 35, 0 ],
  [ Species.MEDITITE, "Meditite", 3, 0, 0, 0, "Meditate Pokémon", Type.FIGHTING, Type.PSYCHIC, 0.6, 11.2, "Pure Power", null, "Telepathy", 280, 30, 40, 55, 40, 55, 60, 180, 70, 56, GrowthRate.MEDIUM_FAST, "Human-Like", null, 50, 20, 1 ],
  [ Species.MEDICHAM, "Medicham", 3, 0, 0, 0, "Meditate Pokémon", Type.FIGHTING, Type.PSYCHIC, 1.3, 31.5, "Pure Power", null, "Telepathy", 410, 60, 60, 75, 60, 75, 80, 90, 70, 144, GrowthRate.MEDIUM_FAST, "Human-Like", null, 50, 20, 1 ],
  [ Species.ELECTRIKE, "Electrike", 3, 0, 0, 0, "Lightning Pokémon", Type.ELECTRIC, -1, 0.6, 15.2, "Static", "Lightning Rod", "Minus", 295, 40, 45, 40, 65, 40, 65, 120, 70, 59, GrowthRate.SLOW, "Field", null, 50, 20, 0 ],
  [ Species.MANECTRIC, "Manectric", 3, 0, 0, 0, "Discharge Pokémon", Type.ELECTRIC, -1, 1.5, 40.2, "Static", "Lightning Rod", "Minus", 475, 70, 75, 60, 105, 60, 105, 45, 70, 166, GrowthRate.SLOW, "Field", null, 50, 20, 0 ],
  [ Species.PLUSLE, "Plusle", 3, 0, 0, 0, "Cheering Pokémon", Type.ELECTRIC, -1, 0.4, 4.2, "Plus", null, "Lightning Rod", 405, 60, 50, 40, 85, 75, 95, 200, 70, 142, GrowthRate.MEDIUM_FAST, "Fairy", null, 50, 20, 0 ],
  [ Species.MINUN, "Minun", 3, 0, 0, 0, "Cheering Pokémon", Type.ELECTRIC, -1, 0.4, 4.2, "Minus", null, "Volt Absorb", 405, 60, 40, 50, 75, 85, 95, 200, 70, 142, GrowthRate.MEDIUM_FAST, "Fairy", null, 50, 20, 0 ],
  [ Species.VOLBEAT, "Volbeat", 3, 0, 0, 0, "Firefly Pokémon", Type.BUG, -1, 0.7, 17.7, "Illuminate", "Swarm", "Prankster", 430, 65, 73, 75, 47, 85, 85, 150, 70, 151, GrowthRate.ERRATIC, "Bug", "Human-Like", 100, 15, 0 ],
  [ Species.ILLUMISE, "Illumise", 3, 0, 0, 0, "Firefly Pokémon", Type.BUG, -1, 0.6, 17.7, "Oblivious", "Tinted Lens", "Prankster", 430, 65, 47, 75, 73, 85, 85, 150, 70, 151, GrowthRate.FLUCTUATING, 2, "Bug", "Human-Like", 0, 15, 0 ],
  [ Species.ROSELIA, "Roselia", 3, 0, 0, 0, "Thorn Pokémon", Type.GRASS, Type.POISON, 0.3, 2, "Natural Cure", "Poison Point", "Leaf Guard", 400, 50, 60, 45, 100, 80, 65, 150, 70, 140, GrowthRate.MEDIUM_SLOW, "Fairy", "Grass", 50, 20, 1 ],
  [ Species.GULPIN, "Gulpin", 3, 0, 0, 0, "Stomach Pokémon", Type.POISON, -1, 0.4, 10.3, "Liquid Ooze", "Sticky Hold", "Gluttony", 302, 70, 43, 53, 43, 53, 40, 225, 70, 60, GrowthRate.FLUCTUATING, "Amorphous", null, 50, 20, 1 ],
  [ Species.SWALOT, "Swalot", 3, 0, 0, 0, "Poison Bag Pokémon", Type.POISON, -1, 1.7, 80, "Liquid Ooze", "Sticky Hold", "Gluttony", 467, 100, 73, 83, 73, 83, 55, 75, 70, 163, GrowthRate.FLUCTUATING, "Amorphous", null, 50, 20, 1 ],
  [ Species.CARVANHA, "Carvanha", 3, 0, 0, 0, "Savage Pokémon", Type.WATER, Type.DARK, 0.8, 20.8, "Rough Skin", null, "Speed Boost", 305, 45, 90, 20, 65, 20, 65, 225, 35, 61, GrowthRate.SLOW, "Water 2", null, 50, 20, 0 ],
  [ Species.SHARPEDO, "Sharpedo", 3, 0, 0, 0, "Brutal Pokémon", Type.WATER, Type.DARK, 1.8, 88.8, "Rough Skin", null, "Speed Boost", 460, 70, 120, 40, 95, 40, 95, 60, 35, 161, GrowthRate.SLOW, "Water 2", null, 50, 20, 0 ],
  [ Species.WAILMER, "Wailmer", 3, 0, 0, 0, "Ball Whale Pokémon", Type.WATER, -1, 2, 130, "Water Veil", "Oblivious", "Pressure", 400, 130, 70, 35, 70, 35, 60, 125, 70, 80, GrowthRate.FLUCTUATING, 2, "Field", "Water 2", 50, 40, 0 ],
  [ Species.WAILORD, "Wailord", 3, 0, 0, 0, "Float Whale Pokémon", Type.WATER, -1, 14.5, 398, "Water Veil", "Oblivious", "Pressure", 500, 170, 90, 45, 90, 45, 60, 60, 70, 175, GrowthRate.FLUCTUATING, 2, "Field", "Water 2", 50, 40, 0 ],
  [ Species.NUMEL, "Numel", 3, 0, 0, 0, "Numb Pokémon", Type.FIRE, Type.GROUND, 0.7, 24, "Oblivious", "Simple", "Own Tempo", 305, 60, 60, 40, 65, 45, 35, 255, 70, 61, GrowthRate.MEDIUM_FAST, "Field", null, 50, 20, 1 ],
  [ Species.CAMERUPT, "Camerupt", 3, 0, 0, 0, "Eruption Pokémon", Type.FIRE, Type.GROUND, 1.9, 220, "Magma Armor", "Solid Rock", "Anger Point", 460, 70, 100, 70, 105, 75, 40, 150, 70, 161, GrowthRate.MEDIUM_FAST, "Field", null, 50, 20, 1 ],
  [ Species.TORKOAL, "Torkoal", 3, 0, 0, 0, "Coal Pokémon", Type.FIRE, -1, 0.5, 80.4, "White Smoke", "Drought", "Shell Armor", 470, 70, 85, 140, 85, 70, 20, 90, 70, 165, GrowthRate.MEDIUM_FAST, "Field", null, 50, 20, 0 ],
  [ Species.SPOINK, "Spoink", 3, 0, 0, 0, "Bounce Pokémon", Type.PSYCHIC, -1, 0.7, 30.6, "Thick Fat", "Own Tempo", "Gluttony", 330, 60, 25, 35, 70, 80, 60, 255, 70, 66, GrowthRate.FAST, "Field", null, 50, 20, 0 ],
  [ Species.GRUMPIG, "Grumpig", 3, 0, 0, 0, "Manipulate Pokémon", Type.PSYCHIC, -1, 0.9, 71.5, "Thick Fat", "Own Tempo", "Gluttony", 470, 80, 45, 65, 90, 110, 80, 60, 70, 165, GrowthRate.FAST, "Field", null, 50, 20, 0 ],
  [ Species.SPINDA, "Spinda", 3, 0, 0, 0, "Spot Panda Pokémon", Type.NORMAL, -1, 1.1, 5, "Own Tempo", "Tangled Feet", "Contrary", 360, 60, 60, 60, 60, 60, 60, 255, 70, 126, GrowthRate.FAST, "Field", "Human-Like", 50, 15, 0 ],
  [ Species.TRAPINCH, "Trapinch", 3, 0, 0, 0, "Ant Pit Pokémon", Type.GROUND, -1, 0.7, 15, "Hyper Cutter", "Arena Trap", "Sheer Force", 290, 45, 100, 45, 45, 45, 10, 255, 70, 58, GrowthRate.MEDIUM_SLOW, "Bug", "Dragon", 50, 20, 0 ],
  [ Species.VIBRAVA, "Vibrava", 3, 0, 0, 0, "Vibration Pokémon", Type.GROUND, Type.DRAGON, 1.1, 15.3, "Levitate", null, null, 340, 50, 70, 50, 50, 50, 70, 120, 70, 119, GrowthRate.MEDIUM_SLOW, "Bug", "Dragon", 50, 20, 0 ],
  [ Species.FLYGON, "Flygon", 3, 0, 0, 0, "Mystic Pokémon", Type.GROUND, Type.DRAGON, 2, 82, "Levitate", null, null, 520, 80, 100, 80, 80, 80, 100, 45, 70, 234, GrowthRate.MEDIUM_SLOW, "Bug", "Dragon", 50, 20, 0 ],
  [ Species.CACNEA, "Cacnea", 3, 0, 0, 0, "Cactus Pokémon", Type.GRASS, -1, 0.4, 51.3, "Sand Veil", null, "Water Absorb", 335, 50, 85, 40, 85, 40, 35, 190, 35, 67, GrowthRate.MEDIUM_SLOW, "Grass", "Human-Like", 50, 20, 0 ],
  [ Species.CACTURNE, "Cacturne", 3, 0, 0, 0, "Scarecrow Pokémon", Type.GRASS, Type.DARK, 1.3, 77.4, "Sand Veil", null, "Water Absorb", 475, 70, 115, 60, 115, 60, 55, 60, 35, 166, GrowthRate.MEDIUM_SLOW, "Grass", "Human-Like", 50, 20, 1 ],
  [ Species.SWABLU, "Swablu", 3, 0, 0, 0, "Cotton Bird Pokémon", Type.NORMAL, Type.FLYING, 0.4, 1.2, "Natural Cure", null, "Cloud Nine", 310, 45, 40, 60, 40, 75, 50, 255, 70, 62, GrowthRate.ERRATIC, "Dragon", "Flying", 50, 20, 0 ],
  [ Species.ALTARIA, "Altaria", 3, 0, 0, 0, "Humming Pokémon", Type.DRAGON, Type.FLYING, 1.1, 20.6, "Natural Cure", null, "Cloud Nine", 490, 75, 70, 90, 70, 105, 80, 45, 70, 172, GrowthRate.ERRATIC, "Dragon", "Flying", 50, 20, 0 ],
  [ Species.ZANGOOSE, "Zangoose", 3, 0, 0, 0, "Cat Ferret Pokémon", Type.NORMAL, -1, 1.3, 40.3, "Immunity", null, "Toxic Boost", 458, 73, 115, 60, 60, 60, 90, 90, 70, 160, GrowthRate.ERRATIC, "Field", null, 50, 20, 0 ],
  [ Species.SEVIPER, "Seviper", 3, 0, 0, 0, "Fang Snake Pokémon", Type.POISON, -1, 2.7, 52.5, "Shed Skin", null, "Infiltrator", 458, 73, 100, 60, 100, 60, 65, 90, 70, 160, GrowthRate.FLUCTUATING, 2, "Dragon", "Field", 50, 20, 0 ],
  [ Species.LUNATONE, "Lunatone", 3, 0, 0, 0, "Meteorite Pokémon", Type.ROCK, Type.PSYCHIC, 1, 168, "Levitate", null, null, 460, 90, 55, 65, 95, 85, 70, 45, 70, 161, GrowthRate.FAST, "Mineral", null, null, 25, 0 ],
  [ Species.SOLROCK, "Solrock", 3, 0, 0, 0, "Meteorite Pokémon", Type.ROCK, Type.PSYCHIC, 1.2, 154, "Levitate", null, null, 460, 90, 95, 85, 55, 65, 70, 45, 70, 161, GrowthRate.FAST, "Mineral", null, null, 25, 0 ],
  [ Species.BARBOACH, "Barboach", 3, 0, 0, 0, "Whiskers Pokémon", Type.WATER, Type.GROUND, 0.4, 1.9, "Oblivious", "Anticipation", "Hydration", 288, 50, 48, 43, 46, 41, 60, 190, 70, 58, GrowthRate.MEDIUM_FAST, "Water 2", null, 50, 20, 0 ],
  [ Species.WHISCASH, "Whiscash", 3, 0, 0, 0, "Whiskers Pokémon", Type.WATER, Type.GROUND, 0.9, 23.6, "Oblivious", "Anticipation", "Hydration", 468, 110, 78, 73, 76, 71, 60, 75, 70, 164, GrowthRate.MEDIUM_FAST, "Water 2", null, 50, 20, 0 ],
  [ Species.CORPHISH, "Corphish", 3, 0, 0, 0, "Ruffian Pokémon", Type.WATER, -1, 0.6, 11.5, "Hyper Cutter", "Shell Armor", "Adaptability", 308, 43, 80, 65, 50, 35, 35, 205, 70, 62, GrowthRate.FLUCTUATING, 2, "Water 1", "Water 3", 50, 15, 0 ],
  [ Species.CRAWDAUNT, "Crawdaunt", 3, 0, 0, 0, "Rogue Pokémon", Type.WATER, Type.DARK, 1.1, 32.8, "Hyper Cutter", "Shell Armor", "Adaptability", 468, 63, 120, 85, 90, 55, 55, 155, 70, 164, GrowthRate.FLUCTUATING, 2, "Water 1", "Water 3", 50, 15, 0 ],
  [ Species.BALTOY, "Baltoy", 3, 0, 0, 0, "Clay Doll Pokémon", Type.GROUND, Type.PSYCHIC, 0.5, 21.5, "Levitate", null, null, 300, 40, 40, 55, 40, 70, 55, 255, 70, 60, GrowthRate.MEDIUM_FAST, "Mineral", null, null, 20, 0 ],
  [ Species.CLAYDOL, "Claydol", 3, 0, 0, 0, "Clay Doll Pokémon", Type.GROUND, Type.PSYCHIC, 1.5, 108, "Levitate", null, null, 500, 60, 70, 105, 70, 120, 75, 90, 70, 175, GrowthRate.MEDIUM_FAST, "Mineral", null, null, 20, 0 ],
  [ Species.LILEEP, "Lileep", 3, 0, 0, 0, "Sea Lily Pokémon", Type.ROCK, Type.GRASS, 1, 23.8, "Suction Cups", null, "Storm Drain", 355, 66, 41, 77, 61, 87, 23, 45, 70, 71, GrowthRate.ERRATIC, "Water 3", null, 87.5, 30, 0 ],
  [ Species.CRADILY, "Cradily", 3, 0, 0, 0, "Barnacle Pokémon", Type.ROCK, Type.GRASS, 1.5, 60.4, "Suction Cups", null, "Storm Drain", 495, 86, 81, 97, 81, 107, 43, 45, 70, 173, GrowthRate.ERRATIC, "Water 3", null, 87.5, 30, 0 ],
  [ Species.ANORITH, "Anorith", 3, 0, 0, 0, "Old Shrimp Pokémon", Type.ROCK, Type.BUG, 0.7, 12.5, "Battle Armor", null, "Swift Swim", 355, 45, 95, 50, 40, 50, 75, 45, 70, 71, GrowthRate.ERRATIC, "Water 3", null, 87.5, 30, 0 ],
  [ Species.ARMALDO, "Armaldo", 3, 0, 0, 0, "Plate Pokémon", Type.ROCK, Type.BUG, 1.5, 68.2, "Battle Armor", null, "Swift Swim", 495, 75, 125, 100, 70, 80, 45, 45, 70, 173, GrowthRate.ERRATIC, "Water 3", null, 87.5, 30, 0 ],
  [ Species.FEEBAS, "Feebas", 3, 0, 0, 0, "Fish Pokémon", Type.WATER, -1, 0.6, 7.4, "Swift Swim", "Oblivious", "Adaptability", 200, 20, 15, 20, 10, 55, 80, 255, 70, 40, GrowthRate.ERRATIC, "Dragon", "Water 1", 50, 20, 0 ],
  [ Species.MILOTIC, "Milotic", 3, 0, 0, 0, "Tender Pokémon", Type.WATER, -1, 6.2, 162, "Marvel Scale", "Competitive", "Cute Charm", 540, 95, 60, 79, 100, 125, 81, 60, 70, 189, GrowthRate.ERRATIC, "Dragon", "Water 1", 50, 20, 1 ],
  [ Species.CASTFORM, "Castform", 3, 0, 0, 0, "Weather Pokémon", Type.NORMAL, -1, 0.3, 0.8, "Forecast", null, null, 420, 70, 70, 70, 70, 70, 70, 45, 70, 147, GrowthRate.MEDIUM_FAST, "Amorphous", "Fairy", 50, 25, 0,
    [
      [ "Sunny Form", 3, 0, 0, 0, "Weather Pokémon", Type.FIRE, -1, 0.3, 0.8, "Forecast", null, null, 420, 70, 70, 70, 70, 70, 70, 45, 70, 147, GrowthRate.MEDIUM_FAST, "Amorphous", "Fairy", 50, 25, 0 ],
      [ "Rainy Form", 3, 0, 0, 0, "Weather Pokémon", Type.WATER, -1, 0.3, 0.8, "Forecast", null, null, 420, 70, 70, 70, 70, 70, 70, 45, 70, 147, GrowthRate.MEDIUM_FAST, "Amorphous", "Fairy", 50, 25, 0 ],
      [ "Snowy Form", 3, 0, 0, 0, "Weather Pokémon", Type.ICE, -1, 0.3, 0.8, "Forecast", null, null, 420, 70, 70, 70, 70, 70, 70, 45, 70, 147, GrowthRate.MEDIUM_FAST, "Amorphous", "Fairy", 50, 25, 0 ]
    ]
  ],
  [ Species.KECLEON, "Kecleon", 3, 0, 0, 0, "Color Swap Pokémon", Type.NORMAL, -1, 1, 22, "Color Change", null, "Protean", 440, 60, 90, 70, 60, 120, 40, 200, 70, 154, GrowthRate.MEDIUM_SLOW, "Field", null, 50, 20, 0 ],
  [ Species.SHUPPET, "Shuppet", 3, 0, 0, 0, "Puppet Pokémon", Type.GHOST, -1, 0.6, 2.3, "Insomnia", "Frisk", "Cursed Body", 295, 44, 75, 35, 63, 33, 45, 225, 35, 59, GrowthRate.FAST, "Amorphous", null, 50, 25, 0 ],
  [ Species.BANETTE, "Banette", 3, 0, 0, 0, "Marionette Pokémon", Type.GHOST, -1, 1.1, 12.5, "Insomnia", "Frisk", "Cursed Body", 455, 64, 115, 65, 83, 63, 65, 45, 35, 159, GrowthRate.FAST, "Amorphous", null, 50, 25, 0 ],
  [ Species.DUSKULL, "Duskull", 3, 0, 0, 0, "Requiem Pokémon", Type.GHOST, -1, 0.8, 15, "Levitate", null, "Frisk", 295, 20, 40, 90, 30, 90, 25, 190, 35, 59, GrowthRate.FAST, "Amorphous", null, 50, 25, 0 ],
  [ Species.DUSCLOPS, "Dusclops", 3, 0, 0, 0, "Beckon Pokémon", Type.GHOST, -1, 1.6, 30.6, "Pressure", null, "Frisk", 455, 40, 70, 130, 60, 130, 25, 90, 35, 159, GrowthRate.FAST, "Amorphous", null, 50, 25, 0 ],
  [ Species.TROPIUS, "Tropius", 3, 0, 0, 0, "Fruit Pokémon", Type.GRASS, Type.FLYING, 2, 100, "Chlorophyll", "Solar Power", "Harvest", 460, 99, 68, 83, 72, 87, 51, 200, 70, 161, GrowthRate.SLOW, "Grass", "Monster", 50, 25, 0 ],
  [ Species.CHIMECHO, "Chimecho", 3, 0, 0, 0, "Wind Chime Pokémon", Type.PSYCHIC, -1, 0.6, 1, "Levitate", null, null, 455, 75, 50, 80, 95, 90, 65, 45, 70, 159, GrowthRate.FAST, "Amorphous", null, 50, 25, 0 ],
  [ Species.ABSOL, "Absol", 3, 0, 0, 0, "Disaster Pokémon", Type.DARK, -1, 1.2, 47, "Pressure", "Super Luck", "Justified", 465, 65, 130, 60, 75, 60, 75, 30, 35, 163, GrowthRate.MEDIUM_SLOW, "Field", null, 50, 25, 0 ],
  [ Species.WYNAUT, "Wynaut", 3, 0, 0, 0, "Bright Pokémon", Type.PSYCHIC, -1, 0.6, 14, "Shadow Tag", null, "Telepathy", 260, 95, 23, 48, 23, 48, 23, 125, 70, 52, GrowthRate.MEDIUM_FAST, "Undiscovered", null, 50, 20, 0 ],
  [ Species.SNORUNT, "Snorunt", 3, 0, 0, 0, "Snow Hat Pokémon", Type.ICE, -1, 0.7, 16.8, "Inner Focus", "Ice Body", "Moody", 300, 50, 50, 50, 50, 50, 50, 190, 70, 60, GrowthRate.MEDIUM_FAST, "Fairy", "Mineral", 50, 20, 0 ],
  [ Species.GLALIE, "Glalie", 3, 0, 0, 0, "Face Pokémon", Type.ICE, -1, 1.5, 256.5, "Inner Focus", "Ice Body", "Moody", 480, 80, 80, 80, 80, 80, 80, 75, 70, 168, GrowthRate.MEDIUM_FAST, "Fairy", "Mineral", 50, 20, 0 ],
  [ Species.SPHEAL, "Spheal", 3, 0, 0, 0, "Clap Pokémon", Type.ICE, Type.WATER, 0.8, 39.5, "Thick Fat", "Ice Body", "Oblivious", 290, 70, 40, 50, 55, 50, 25, 255, 70, 58, GrowthRate.MEDIUM_SLOW, "Field", "Water 1", 50, 20, 0 ],
  [ Species.SEALEO, "Sealeo", 3, 0, 0, 0, "Ball Roll Pokémon", Type.ICE, Type.WATER, 1.1, 87.6, "Thick Fat", "Ice Body", "Oblivious", 410, 90, 60, 70, 75, 70, 45, 120, 70, 144, GrowthRate.MEDIUM_SLOW, "Field", "Water 1", 50, 20, 0 ],
  [ Species.WALREIN, "Walrein", 3, 0, 0, 0, "Ice Break Pokémon", Type.ICE, Type.WATER, 1.4, 150.6, "Thick Fat", "Ice Body", "Oblivious", 530, 110, 80, 90, 95, 90, 65, 45, 70, 239, GrowthRate.MEDIUM_SLOW, "Field", "Water 1", 50, 20, 0 ],
  [ Species.CLAMPERL, "Clamperl", 3, 0, 0, 0, "Bivalve Pokémon", Type.WATER, -1, 0.4, 52.5, "Shell Armor", null, "Rattled", 345, 35, 64, 85, 74, 55, 32, 255, 70, 69, GrowthRate.ERRATIC, "Water 1", null, 50, 20, 0 ],
  [ Species.HUNTAIL, "Huntail", 3, 0, 0, 0, "Deep Sea Pokémon", Type.WATER, -1, 1.7, 27, "Swift Swim", null, "Water Veil", 485, 55, 104, 105, 94, 75, 52, 60, 70, 170, GrowthRate.ERRATIC, "Water 1", null, 50, 20, 0 ],
  [ Species.GOREBYSS, "Gorebyss", 3, 0, 0, 0, "South Sea Pokémon", Type.WATER, -1, 1.8, 22.6, "Swift Swim", null, "Hydration", 485, 55, 84, 105, 114, 75, 52, 60, 70, 170, GrowthRate.ERRATIC, "Water 1", null, 50, 20, 0 ],
  [ Species.RELICANTH, "Relicanth", 3, 0, 0, 0, "Longevity Pokémon", Type.WATER, Type.ROCK, 1, 23.4, "Swift Swim", "Rock Head", "Sturdy", 485, 100, 90, 130, 45, 65, 55, 25, 70, 170, GrowthRate.SLOW, "Water 1", "Water 2", 87.5, 40, 1 ],
  [ Species.LUVDISC, "Luvdisc", 3, 0, 0, 0, "Rendezvous Pokémon", Type.WATER, -1, 0.6, 8.7, "Swift Swim", null, "Hydration", 330, 43, 30, 55, 40, 65, 97, 225, 70, 116, GrowthRate.FAST, "Water 2", null, 25, 20, 0 ],
  [ Species.BAGON, "Bagon", 3, 0, 0, 0, "Rock Head Pokémon", Type.DRAGON, -1, 0.6, 42.1, "Rock Head", null, "Sheer Force", 300, 45, 75, 60, 40, 30, 50, 45, 35, 60, GrowthRate.SLOW, "Dragon", null, 50, 40, 0 ],
  [ Species.SHELGON, "Shelgon", 3, 0, 0, 0, "Endurance Pokémon", Type.DRAGON, -1, 1.1, 110.5, "Rock Head", null, "Overcoat", 420, 65, 95, 100, 60, 50, 50, 45, 35, 147, GrowthRate.SLOW, "Dragon", null, 50, 40, 0 ],
  [ Species.SALAMENCE, "Salamence", 3, 0, 0, 0, "Dragon Pokémon", Type.DRAGON, Type.FLYING, 1.5, 102.6, "Intimidate", null, "Moxie", 600, 95, 135, 80, 110, 80, 100, 45, 35, 270, GrowthRate.SLOW, "Dragon", null, 50, 40, 0 ],
  [ Species.BELDUM, "Beldum", 3, 0, 0, 0, "Iron Ball Pokémon", Type.STEEL, Type.PSYCHIC, 0.6, 95.2, "Clear Body", null, "Light Metal", 300, 40, 55, 80, 35, 60, 30, 3, 35, 60, GrowthRate.SLOW, "Mineral", null, null, 40, 0 ],
  [ Species.METANG, "Metang", 3, 0, 0, 0, "Iron Claw Pokémon", Type.STEEL, Type.PSYCHIC, 1.2, 202.5, "Clear Body", null, "Light Metal", 420, 60, 75, 100, 55, 80, 50, 3, 35, 147, GrowthRate.SLOW, "Mineral", null, null, 40, 0 ],
  [ Species.METAGROSS, "Metagross", 3, 0, 0, 0, "Iron Leg Pokémon", Type.STEEL, Type.PSYCHIC, 1.6, 550, "Clear Body", null, "Light Metal", 600, 80, 135, 130, 95, 90, 70, 3, 35, 270, GrowthRate.SLOW, "Mineral", null, null, 40, 0 ],
  [ Species.REGIROCK, "Regirock", 3, 1, 0, 0, "Rock Peak Pokémon", Type.ROCK, -1, 1.7, 230, "Clear Body", null, "Sturdy", 580, 80, 100, 200, 50, 100, 50, 3, 35, 261, GrowthRate.SLOW, "Undiscovered", null, null, 80, 0 ],
  [ Species.REGICE, "Regice", 3, 1, 0, 0, "Iceberg Pokémon", Type.ICE, -1, 1.8, 175, "Clear Body", null, "Ice Body", 580, 80, 50, 100, 100, 200, 50, 3, 35, 261, GrowthRate.SLOW, "Undiscovered", null, null, 80, 0 ],
  [ Species.REGISTEEL, "Registeel", 3, 1, 0, 0, "Iron Pokémon", Type.STEEL, -1, 1.9, 205, "Clear Body", null, "Light Metal", 580, 80, 75, 150, 75, 150, 50, 3, 35, 261, GrowthRate.SLOW, "Undiscovered", null, null, 80, 0 ],
  [ Species.LATIAS, "Latias", 3, 1, 0, 0, "Eon Pokémon", Type.DRAGON, Type.PSYCHIC, 1.4, 40, "Levitate", null, null, 600, 80, 80, 90, 110, 130, 110, 3, 90, 270, GrowthRate.SLOW, "Undiscovered", null, 0, 120, 0 ],
  [ Species.LATIOS, "Latios", 3, 1, 0, 0, "Eon Pokémon", Type.DRAGON, Type.PSYCHIC, 2, 60, "Levitate", null, null, 600, 80, 90, 80, 130, 110, 110, 3, 90, 270, GrowthRate.SLOW, "Undiscovered", null, 100, 120, 0 ],
  [ Species.KYOGRE, "Kyogre", 3, 0, 1, 0, "Sea Basin Pokémon", Type.WATER, -1, 4.5, 352, "Drizzle", null, null, 670, 100, 100, 90, 150, 140, 90, 3, 0, 302, GrowthRate.SLOW, "Undiscovered", null, null, 120, 0 ],
  [ Species.GROUDON, "Groudon", 3, 0, 1, 0, "Continent Pokémon", Type.GROUND, -1, 3.5, 950, "Drought", null, null, 670, 100, 150, 140, 100, 90, 90, 3, 0, 302, GrowthRate.SLOW, "Undiscovered", null, null, 120, 0 ],
  [ Species.RAYQUAZA, "Rayquaza", 3, 0, 1, 0, "Sky High Pokémon", Type.DRAGON, Type.FLYING, 7, 206.5, "Air Lock", null, null, 680, 105, 150, 90, 150, 90, 95, 45, 0, 306, GrowthRate.SLOW, "Undiscovered", null, null, 120, 0 ],
  [ Species.JIRACHI, "Jirachi", 3, 0, 0, 1, "Wish Pokémon", Type.STEEL, Type.PSYCHIC, 0.3, 1.1, "Serene Grace", null, null, 600, 100, 100, 100, 100, 100, 100, 3, 100, 270, GrowthRate.SLOW, "Undiscovered", null, null, 120, 0 ],
  [ Species.DEOXYS, "Deoxys", 3, 0, 0, 1, "DNA Pokémon", Type.PSYCHIC, -1, 1.7, 60.8, "Pressure", null, null, 600, 50, 150, 50, 150, 50, 150, 3, 0, 270, GrowthRate.SLOW, "Undiscovered", null, null, 120, 0,
    [
      [ "Normal Forme", 3, 0, 0, 1, "DNA Pokémon", Type.PSYCHIC, -1, 1.7, 60.8, "Pressure", null, null, 600, 50, 150, 50, 150, 50, 150, 3, 0, 270, GrowthRate.SLOW, "Undiscovered", null, null, 120, 0 ],
      [ "Attack Forme", 3, 0, 0, 1, "DNA Pokémon", Type.PSYCHIC, -1, 1.7, 60.8, "Pressure", null, null, 600, 50, 180, 20, 180, 20, 150, 3, 0, 270, GrowthRate.SLOW, "Undiscovered", null, null, 120, 0 ],
      [ "Defense Forme", 3, 0, 0, 1, "DNA Pokémon", Type.PSYCHIC, -1, 1.7, 60.8, "Pressure", null, null, 600, 50, 70, 160, 70, 160, 90, 3, 0, 270, GrowthRate.SLOW, "Undiscovered", null, null, 120, 0 ],
      [ "Speed Forme", 3, 0, 0, 1, "DNA Pokémon", Type.PSYCHIC, -1, 1.7, 60.8, "Pressure", null, null, 600, 50, 95, 90, 95, 90, 180, 3, 0, 270, GrowthRate.SLOW, "Undiscovered", null, null, 120, 0 ]
    ]
  ],
  [ Species.TURTWIG, "Turtwig", 4, 0, 0, 0, "Tiny Leaf Pokémon", Type.GRASS, -1, 0.4, 10.2, "Overgrow", null, "Shell Armor", 318, 55, 68, 64, 45, 55, 31, 45, 70, 64, GrowthRate.MEDIUM_SLOW, "Grass", "Monster", 87.5, 20, 0 ],
  [ Species.GROTLE, "Grotle", 4, 0, 0, 0, "Grove Pokémon", Type.GRASS, -1, 1.1, 97, "Overgrow", null, "Shell Armor", 405, 75, 89, 85, 55, 65, 36, 45, 70, 142, GrowthRate.MEDIUM_SLOW, "Grass", "Monster", 87.5, 20, 0 ],
  [ Species.TORTERRA, "Torterra", 4, 0, 0, 0, "Continent Pokémon", Type.GRASS, Type.GROUND, 2.2, 310, "Overgrow", null, "Shell Armor", 525, 95, 109, 105, 75, 85, 56, 45, 70, 236, GrowthRate.MEDIUM_SLOW, "Grass", "Monster", 87.5, 20, 0 ],
  [ Species.CHIMCHAR, "Chimchar", 4, 0, 0, 0, "Chimp Pokémon", Type.FIRE, -1, 0.5, 6.2, "Blaze", null, "Iron Fist", 309, 44, 58, 44, 58, 44, 61, 45, 70, 62, GrowthRate.MEDIUM_SLOW, "Field", "Human-Like", 87.5, 20, 0 ],
  [ Species.MONFERNO, "Monferno", 4, 0, 0, 0, "Playful Pokémon", Type.FIRE, Type.FIGHTING, 0.9, 22, "Blaze", null, "Iron Fist", 405, 64, 78, 52, 78, 52, 81, 45, 70, 142, GrowthRate.MEDIUM_SLOW, "Field", "Human-Like", 87.5, 20, 0 ],
  [ Species.INFERNAPE, "Infernape", 4, 0, 0, 0, "Flame Pokémon", Type.FIRE, Type.FIGHTING, 1.2, 55, "Blaze", null, "Iron Fist", 534, 76, 104, 71, 104, 71, 108, 45, 70, 240, GrowthRate.MEDIUM_SLOW, "Field", "Human-Like", 87.5, 20, 0 ],
  [ Species.PIPLUP, "Piplup", 4, 0, 0, 0, "Penguin Pokémon", Type.WATER, -1, 0.4, 5.2, "Torrent", null, "Defiant", 314, 53, 51, 53, 61, 56, 40, 45, 70, 63, GrowthRate.MEDIUM_SLOW, "Field", "Water 1", 87.5, 20, 0 ],
  [ Species.PRINPLUP, "Prinplup", 4, 0, 0, 0, "Penguin Pokémon", Type.WATER, -1, 0.8, 23, "Torrent", null, "Defiant", 405, 64, 66, 68, 81, 76, 50, 45, 70, 142, GrowthRate.MEDIUM_SLOW, "Field", "Water 1", 87.5, 20, 0 ],
  [ Species.EMPOLEON, "Empoleon", 4, 0, 0, 0, "Emperor Pokémon", Type.WATER, Type.STEEL, 1.7, 84.5, "Torrent", null, "Defiant", 530, 84, 86, 88, 111, 101, 60, 45, 70, 239, GrowthRate.MEDIUM_SLOW, "Field", "Water 1", 87.5, 20, 0 ],
  [ Species.STARLY, "Starly", 4, 0, 0, 0, "Starling Pokémon", Type.NORMAL, Type.FLYING, 0.3, 2, "Keen Eye", null, "Reckless", 245, 40, 55, 30, 30, 30, 60, 255, 70, 49, GrowthRate.MEDIUM_SLOW, "Flying", null, 50, 15, 1 ],
  [ Species.STARAVIA, "Staravia", 4, 0, 0, 0, "Starling Pokémon", Type.NORMAL, Type.FLYING, 0.6, 15.5, "Intimidate", null, "Reckless", 340, 55, 75, 50, 40, 40, 80, 120, 70, 119, GrowthRate.MEDIUM_SLOW, "Flying", null, 50, 15, 1 ],
  [ Species.STARAPTOR, "Staraptor", 4, 0, 0, 0, "Predator Pokémon", Type.NORMAL, Type.FLYING, 1.2, 24.9, "Intimidate", null, "Reckless", 485, 85, 120, 70, 50, 60, 100, 45, 70, 218, GrowthRate.MEDIUM_SLOW, "Flying", null, 50, 15, 1 ],
  [ Species.BIDOOF, "Bidoof", 4, 0, 0, 0, "Plump Mouse Pokémon", Type.NORMAL, -1, 0.5, 20, "Simple", "Unaware", "Moody", 250, 59, 45, 40, 35, 40, 31, 255, 70, 50, GrowthRate.MEDIUM_FAST, "Field", "Water 1", 50, 15, 1 ],
  [ Species.BIBAREL, "Bibarel", 4, 0, 0, 0, "Beaver Pokémon", Type.NORMAL, Type.WATER, 1, 31.5, "Simple", "Unaware", "Moody", 410, 79, 85, 60, 55, 60, 71, 127, 70, 144, GrowthRate.MEDIUM_FAST, "Field", "Water 1", 50, 15, 1 ],
  [ Species.KRICKETOT, "Kricketot", 4, 0, 0, 0, "Cricket Pokémon", Type.BUG, -1, 0.3, 2.2, "Shed Skin", null, "Run Away", 194, 37, 25, 41, 25, 41, 25, 255, 70, 39, GrowthRate.MEDIUM_SLOW, "Bug", null, 50, 15, 1 ],
  [ Species.KRICKETUNE, "Kricketune", 4, 0, 0, 0, "Cricket Pokémon", Type.BUG, -1, 1, 25.5, "Swarm", null, "Technician", 384, 77, 85, 51, 55, 51, 65, 45, 70, 134, GrowthRate.MEDIUM_SLOW, "Bug", null, 50, 15, 1 ],
  [ Species.SHINX, "Shinx", 4, 0, 0, 0, "Flash Pokémon", Type.ELECTRIC, -1, 0.5, 9.5, "Rivalry", "Intimidate", "Guts", 263, 45, 65, 34, 40, 34, 45, 235, 70, 53, GrowthRate.MEDIUM_SLOW, "Field", null, 50, 20, 1 ],
  [ Species.LUXIO, "Luxio", 4, 0, 0, 0, "Spark Pokémon", Type.ELECTRIC, -1, 0.9, 30.5, "Rivalry", "Intimidate", "Guts", 363, 60, 85, 49, 60, 49, 60, 120, 100, 127, GrowthRate.MEDIUM_SLOW, "Field", null, 50, 20, 1 ],
  [ Species.LUXRAY, "Luxray", 4, 0, 0, 0, "Gleam Eyes Pokémon", Type.ELECTRIC, -1, 1.4, 42, "Rivalry", "Intimidate", "Guts", 523, 80, 120, 79, 95, 79, 70, 45, 70, 235, GrowthRate.MEDIUM_SLOW, "Field", null, 50, 20, 1 ],
  [ Species.BUDEW, "Budew", 4, 0, 0, 0, "Bud Pokémon", Type.GRASS, Type.POISON, 0.2, 1.2, "Natural Cure", "Poison Point", "Leaf Guard", 280, 40, 30, 35, 50, 70, 55, 255, 70, 56, GrowthRate.MEDIUM_SLOW, "Undiscovered", null, 50, 20, 0 ],
  [ Species.ROSERADE, "Roserade", 4, 0, 0, 0, "Bouquet Pokémon", Type.GRASS, Type.POISON, 0.9, 14.5, "Natural Cure", "Poison Point", "Technician", 515, 60, 70, 65, 125, 105, 90, 75, 70, 232, GrowthRate.MEDIUM_SLOW, "Fairy", "Grass", 50, 20, 1 ],
  [ Species.CRANIDOS, "Cranidos", 4, 0, 0, 0, "Head Butt Pokémon", Type.ROCK, -1, 0.9, 31.5, "Mold Breaker", null, "Sheer Force", 350, 67, 125, 40, 30, 30, 58, 45, 70, 70, GrowthRate.ERRATIC, "Monster", null, 87.5, 30, 0 ],
  [ Species.RAMPARDOS, "Rampardos", 4, 0, 0, 0, "Head Butt Pokémon", Type.ROCK, -1, 1.6, 102.5, "Mold Breaker", null, "Sheer Force", 495, 97, 165, 60, 65, 50, 58, 45, 70, 173, GrowthRate.ERRATIC, "Monster", null, 87.5, 30, 0 ],
  [ Species.SHIELDON, "Shieldon", 4, 0, 0, 0, "Shield Pokémon", Type.ROCK, Type.STEEL, 0.5, 57, "Sturdy", null, "Soundproof", 350, 30, 42, 118, 42, 88, 30, 45, 70, 70, GrowthRate.ERRATIC, "Monster", null, 87.5, 30, 0 ],
  [ Species.BASTIODON, "Bastiodon", 4, 0, 0, 0, "Shield Pokémon", Type.ROCK, Type.STEEL, 1.3, 149.5, "Sturdy", null, "Soundproof", 495, 60, 52, 168, 47, 138, 30, 45, 70, 173, GrowthRate.ERRATIC, "Monster", null, 87.5, 30, 0 ],
  [ Species.BURMY, "Burmy", 4, 0, 0, 0, "Bagworm Pokémon", Type.BUG, -1, 0.2, 3.4, "Shed Skin", null, "Overcoat", 224, 40, 29, 45, 29, 45, 36, 120, 70, 45, GrowthRate.MEDIUM_FAST, "Bug", null, 50, 15, 0 ],
  [ Species.WORMADAM, "Wormadam", 4, 0, 0, 0, "Bagworm Pokémon", Type.BUG, Type.GRASS, 0.5, 6.5, "Anticipation", null, "Overcoat", 424, 60, 59, 85, 79, 105, 36, 45, 70, 148, GrowthRate.MEDIUM_FAST, "Bug", null, 0, 15, 0,
    [
      [ "Plant Cloak", 4, 0, 0, 0, "Bagworm Pokémon", Type.BUG, Type.GRASS, 0.5, 6.5, "Anticipation", null, "Overcoat", 424, 60, 59, 85, 79, 105, 36, 45, 70, 148, GrowthRate.MEDIUM_FAST, "Bug", null, 0, 15, 0 ],
      [ "Sandy Cloak", 4, 0, 0, 0, "Bagworm Pokémon", Type.BUG, Type.GROUND, 0.5, 6.5, "Anticipation", null, "Overcoat", 424, 60, 79, 105, 59, 85, 36, 45, 70, 148, GrowthRate.MEDIUM_FAST, "Bug", null, 0, 15, 0 ],
      [ "Trash Cloak", 4, 0, 0, 0, "Bagworm Pokémon", Type.BUG, Type.STEEL, 0.5, 6.5, "Anticipation", null, "Overcoat", 424, 60, 69, 95, 69, 95, 36, 45, 70, 148, GrowthRate.MEDIUM_FAST, "Bug", null, 0, 15, 0 ]
    ]
  ],
  [ Species.MOTHIM, "Mothim", 4, 0, 0, 0, "Moth Pokémon", Type.BUG, Type.FLYING, 0.9, 23.3, "Swarm", null, "Tinted Lens", 424, 70, 94, 50, 94, 50, 66, 45, 70, 148, GrowthRate.MEDIUM_FAST, "Bug", null, 100, 15, 0 ],
  [ Species.COMBEE, "Combee", 4, 0, 0, 0, "Tiny Bee Pokémon", Type.BUG, Type.FLYING, 0.3, 5.5, "Honey Gather", null, "Hustle", 244, 30, 30, 42, 30, 42, 70, 120, 70, 49, GrowthRate.MEDIUM_SLOW, "Bug", null, 87.5, 15, 1 ],
  [ Species.VESPIQUEN, "Vespiquen", 4, 0, 0, 0, "Beehive Pokémon", Type.BUG, Type.FLYING, 1.2, 38.5, "Pressure", null, "Unnerve", 474, 70, 80, 102, 80, 102, 40, 45, 70, 166, GrowthRate.MEDIUM_SLOW, "Bug", null, 0, 15, 0 ],
  [ Species.PACHIRISU, "Pachirisu", 4, 0, 0, 0, "EleSquirrel Pokémon", Type.ELECTRIC, -1, 0.4, 3.9, "Run Away", "Pickup", "Volt Absorb", 405, 60, 45, 70, 45, 90, 95, 200, 100, 142, GrowthRate.MEDIUM_FAST, "Fairy", "Field", 50, 10, 1 ],
  [ Species.BUIZEL, "Buizel", 4, 0, 0, 0, "Sea Weasel Pokémon", Type.WATER, -1, 0.7, 29.5, "Swift Swim", null, "Water Veil", 330, 55, 65, 35, 60, 30, 85, 190, 70, 66, GrowthRate.MEDIUM_FAST, "Field", "Water 1", 50, 20, 1 ],
  [ Species.FLOATZEL, "Floatzel", 4, 0, 0, 0, "Sea Weasel Pokémon", Type.WATER, -1, 1.1, 33.5, "Swift Swim", null, "Water Veil", 495, 85, 105, 55, 85, 50, 115, 75, 70, 173, GrowthRate.MEDIUM_FAST, "Field", "Water 1", 50, 20, 1 ],
  [ Species.CHERUBI, "Cherubi", 4, 0, 0, 0, "Cherry Pokémon", Type.GRASS, -1, 0.4, 3.3, "Chlorophyll", null, null, 275, 45, 35, 45, 62, 53, 35, 190, 70, 55, GrowthRate.MEDIUM_FAST, "Fairy", "Grass", 50, 20, 0 ],
  [ Species.CHERRIM, "Cherrim", 4, 0, 0, 0, "Blossom Pokémon", Type.GRASS, -1, 0.5, 9.3, "Flower Gift", null, null, 450, 70, 60, 70, 87, 78, 85, 75, 70, 158, GrowthRate.MEDIUM_FAST, "Fairy", "Grass", 50, 20, 0 ],
  [ Species.SHELLOS, "Shellos", 4, 0, 0, 0, "Sea Slug Pokémon", Type.WATER, -1, 0.3, 6.3, "Sticky Hold", "Storm Drain", "Sand Force", 325, 76, 48, 48, 57, 62, 34, 190, 70, 65, GrowthRate.MEDIUM_FAST, "Amorphous", "Water 1", 50, 20, 0 ],
  [ Species.GASTRODON, "Gastrodon", 4, 0, 0, 0, "Sea Slug Pokémon", Type.WATER, Type.GROUND, 0.9, 29.9, "Sticky Hold", "Storm Drain", "Sand Force", 475, 111, 83, 68, 92, 82, 39, 75, 70, 166, GrowthRate.MEDIUM_FAST, "Amorphous", "Water 1", 50, 20, 0,
    [
      [ "East", 4, 0, 0, 0, "Sea Slug Pokémon", Type.WATER, Type.GROUND, 0.9, 29.9, "Sticky Hold", "Storm Drain", "Sand Force", 475, 111, 83, 68, 92, 82, 39, 75, 70, 166, GrowthRate.MEDIUM_FAST, "Amorphous", "Water 1", 50, 20, 0 ],
      [ "West", 4, 0, 0, 0, "Sea Slug Pokémon", Type.WATER, Type.GROUND, 0.9, 29.9, "Sticky Hold", "Storm Drain", "Sand Force", 475, 111, 83, 68, 92, 82, 39, 75, 70, 166, GrowthRate.MEDIUM_FAST, "Amorphous", "Water 1", 50, 20, 0 ]
    ]
  ],
  [ Species.AMBIPOM, "Ambipom", 4, 0, 0, 0, "Long Tail Pokémon", Type.NORMAL, -1, 1.2, 20.3, "Technician", "Pickup", "Skill Link", 482, 75, 100, 66, 60, 66, 115, 45, 100, 169, GrowthRate.FAST, "Field", null, 50, 20, 1 ],
  [ Species.DRIFLOON, "Drifloon", 4, 0, 0, 0, "Balloon Pokémon", Type.GHOST, Type.FLYING, 0.4, 1.2, "Aftermath", "Unburden", "Flare Boost", 348, 90, 50, 34, 60, 44, 70, 125, 70, 70, GrowthRate.FLUCTUATING, "Amorphous", null, 50, 30, 0 ],
  [ Species.DRIFBLIM, "Drifblim", 4, 0, 0, 0, "Blimp Pokémon", Type.GHOST, Type.FLYING, 1.2, 15, "Aftermath", "Unburden", "Flare Boost", 498, 150, 80, 44, 90, 54, 80, 60, 70, 174, GrowthRate.FLUCTUATING, "Amorphous", null, 50, 30, 0 ],
  [ Species.BUNEARY, "Buneary", 4, 0, 0, 0, "Rabbit Pokémon", Type.NORMAL, -1, 0.4, 5.5, "Run Away", "Klutz", "Limber", 350, 55, 66, 44, 44, 56, 85, 190, 0, 70, GrowthRate.MEDIUM_FAST, "Field", "Human-Like", 50, 20, 0 ],
  [ Species.LOPUNNY, "Lopunny", 4, 0, 0, 0, "Rabbit Pokémon", Type.NORMAL, -1, 1.2, 33.3, "Cute Charm", "Klutz", "Limber", 480, 65, 76, 84, 54, 96, 105, 60, 140, 168, GrowthRate.MEDIUM_FAST, "Field", "Human-Like", 50, 20, 0 ],
  [ Species.MISMAGIUS, "Mismagius", 4, 0, 0, 0, "Magical Pokémon", Type.GHOST, -1, 0.9, 4.4, "Levitate", null, null, 495, 60, 60, 60, 105, 105, 105, 45, 35, 173, GrowthRate.FAST, "Amorphous", null, 50, 25, 0 ],
  [ Species.HONCHKROW, "Honchkrow", 4, 0, 0, 0, "Big Boss Pokémon", Type.DARK, Type.FLYING, 0.9, 27.3, "Insomnia", "Super Luck", "Moxie", 505, 100, 125, 52, 105, 52, 71, 30, 35, 177, GrowthRate.MEDIUM_SLOW, "Flying", null, 50, 20, 0 ],
  [ Species.GLAMEOW, "Glameow", 4, 0, 0, 0, "Catty Pokémon", Type.NORMAL, -1, 0.5, 3.9, "Limber", "Own Tempo", "Keen Eye", 310, 49, 55, 42, 42, 37, 85, 190, 70, 62, GrowthRate.FAST, "Field", null, 25, 20, 0 ],
  [ Species.PURUGLY, "Purugly", 4, 0, 0, 0, "Tiger Cat Pokémon", Type.NORMAL, -1, 1, 43.8, "Thick Fat", "Own Tempo", "Defiant", 452, 71, 82, 64, 64, 59, 112, 75, 70, 158, GrowthRate.FAST, "Field", null, 25, 20, 0 ],
  [ Species.CHINGLING, "Chingling", 4, 0, 0, 0, "Bell Pokémon", Type.PSYCHIC, -1, 0.2, 0.6, "Levitate", null, null, 285, 45, 30, 50, 65, 50, 45, 120, 70, 57, GrowthRate.FAST, "Undiscovered", null, 50, 25, 0 ],
  [ Species.STUNKY, "Stunky", 4, 0, 0, 0, "Skunk Pokémon", Type.POISON, Type.DARK, 0.4, 19.2, "Stench", "Aftermath", "Keen Eye", 329, 63, 63, 47, 41, 41, 74, 225, 70, 66, GrowthRate.MEDIUM_FAST, "Field", null, 50, 20, 0 ],
  [ Species.SKUNTANK, "Skuntank", 4, 0, 0, 0, "Skunk Pokémon", Type.POISON, Type.DARK, 1, 38, "Stench", "Aftermath", "Keen Eye", 479, 103, 93, 67, 71, 61, 84, 60, 70, 168, GrowthRate.MEDIUM_FAST, "Field", null, 50, 20, 0 ],
  [ Species.BRONZOR, "Bronzor", 4, 0, 0, 0, "Bronze Pokémon", Type.STEEL, Type.PSYCHIC, 0.5, 60.5, "Levitate", "Heatproof", "Heavy Metal", 300, 57, 24, 86, 24, 86, 23, 255, 70, 60, GrowthRate.MEDIUM_FAST, "Mineral", null, null, 20, 0 ],
  [ Species.BRONZONG, "Bronzong", 4, 0, 0, 0, "Bronze Bell Pokémon", Type.STEEL, Type.PSYCHIC, 1.3, 187, "Levitate", "Heatproof", "Heavy Metal", 500, 67, 89, 116, 79, 116, 33, 90, 70, 175, GrowthRate.MEDIUM_FAST, "Mineral", null, null, 20, 0 ],
  [ Species.BONSLY, "Bonsly", 4, 0, 0, 0, "Bonsai Pokémon", Type.ROCK, -1, 0.5, 15, "Sturdy", "Rock Head", "Rattled", 290, 50, 80, 95, 10, 45, 10, 255, 70, 58, GrowthRate.MEDIUM_FAST, "Undiscovered", null, 50, 20, 0 ],
  [ Species.MIME_JR, "Mime Jr.", 4, 0, 0, 0, "Mime Pokémon", Type.PSYCHIC, Type.FAIRY, 0.6, 13, "Soundproof", "Filter", "Technician", 310, 20, 25, 45, 70, 90, 60, 145, 70, 62, GrowthRate.MEDIUM_FAST, "Undiscovered", null, 50, 25, 0 ],
  [ Species.HAPPINY, "Happiny", 4, 0, 0, 0, "Playhouse Pokémon", Type.NORMAL, -1, 0.6, 24.4, "Natural Cure", "Serene Grace", "Friend Guard", 220, 100, 5, 5, 15, 65, 30, 130, 140, 110, GrowthRate.FAST, "Undiscovered", null, 0, 40, 0 ],
  [ Species.CHATOT, "Chatot", 4, 0, 0, 0, "Music Note Pokémon", Type.NORMAL, Type.FLYING, 0.5, 1.9, "Keen Eye", "Tangled Feet", "Big Pecks", 411, 76, 65, 45, 92, 42, 91, 30, 35, 144, GrowthRate.MEDIUM_SLOW, "Flying", null, 50, 20, 0 ],
  [ Species.SPIRITOMB, "Spiritomb", 4, 0, 0, 0, "Forbidden Pokémon", Type.GHOST, Type.DARK, 1, 108, "Pressure", null, "Infiltrator", 485, 50, 92, 108, 92, 108, 35, 100, 70, 170, GrowthRate.MEDIUM_FAST, "Amorphous", null, 50, 30, 0 ],
  [ Species.GIBLE, "Gible", 4, 0, 0, 0, "Land Shark Pokémon", Type.DRAGON, Type.GROUND, 0.7, 20.5, "Sand Veil", null, "Rough Skin", 300, 58, 70, 45, 40, 45, 42, 45, 70, 60, GrowthRate.SLOW, "Dragon", "Monster", 50, 40, 1 ],
  [ Species.GABITE, "Gabite", 4, 0, 0, 0, "Cave Pokémon", Type.DRAGON, Type.GROUND, 1.4, 56, "Sand Veil", null, "Rough Skin", 410, 68, 90, 65, 50, 55, 82, 45, 70, 144, GrowthRate.SLOW, "Dragon", "Monster", 50, 40, 1 ],
  [ Species.GARCHOMP, "Garchomp", 4, 0, 0, 0, "Mach Pokémon", Type.DRAGON, Type.GROUND, 1.9, 95, "Sand Veil", null, "Rough Skin", 600, 108, 130, 95, 80, 85, 102, 45, 70, 270, GrowthRate.SLOW, "Dragon", "Monster", 50, 40, 1 ],
  [ Species.MUNCHLAX, "Munchlax", 4, 0, 0, 0, "Big Eater Pokémon", Type.NORMAL, -1, 0.6, 105, "Pickup", "Thick Fat", "Gluttony", 390, 135, 85, 40, 40, 85, 5, 50, 70, 78, GrowthRate.SLOW, "Undiscovered", null, 87.5, 40, 0 ],
  [ Species.RIOLU, "Riolu", 4, 0, 0, 0, "Emanation Pokémon", Type.FIGHTING, -1, 0.7, 20.2, "Steadfast", "Inner Focus", "Prankster", 285, 40, 70, 40, 35, 40, 60, 75, 70, 57, GrowthRate.MEDIUM_SLOW, "Undiscovered", null, 87.5, 25, 0 ],
  [ Species.LUCARIO, "Lucario", 4, 0, 0, 0, "Aura Pokémon", Type.FIGHTING, Type.STEEL, 1.2, 54, "Steadfast", "Inner Focus", "Justified", 525, 70, 110, 70, 115, 70, 90, 45, 70, 184, GrowthRate.MEDIUM_SLOW, "Field", "Human-Like", 87.5, 25, 0 ],
  [ Species.HIPPOPOTAS, "Hippopotas", 4, 0, 0, 0, "Hippo Pokémon", Type.GROUND, -1, 0.8, 49.5, "Sand Stream", null, "Sand Force", 330, 68, 72, 78, 38, 42, 32, 140, 70, 66, GrowthRate.SLOW, "Field", null, 50, 30, 1 ],
  [ Species.HIPPOWDON, "Hippowdon", 4, 0, 0, 0, "Heavyweight Pokémon", Type.GROUND, -1, 2, 300, "Sand Stream", null, "Sand Force", 525, 108, 112, 118, 68, 72, 47, 60, 70, 184, GrowthRate.SLOW, "Field", null, 50, 30, 1 ],
  [ Species.SKORUPI, "Skorupi", 4, 0, 0, 0, "Scorpion Pokémon", Type.POISON, Type.BUG, 0.8, 12, "Battle Armor", "Sniper", "Keen Eye", 330, 40, 50, 90, 30, 55, 65, 120, 70, 66, GrowthRate.SLOW, "Bug", "Water 3", 50, 20, 0 ],
  [ Species.DRAPION, "Drapion", 4, 0, 0, 0, "Ogre Scorp Pokémon", Type.POISON, Type.DARK, 1.3, 61.5, "Battle Armor", "Sniper", "Keen Eye", 500, 70, 90, 110, 60, 75, 95, 45, 70, 175, GrowthRate.SLOW, "Bug", "Water 3", 50, 20, 0 ],
  [ Species.CROAGUNK, "Croagunk", 4, 0, 0, 0, "Toxic Mouth Pokémon", Type.POISON, Type.FIGHTING, 0.7, 23, "Anticipation", "Dry Skin", "Poison Touch", 300, 48, 61, 40, 61, 40, 50, 140, 100, 60, GrowthRate.MEDIUM_FAST, "Human-Like", null, 50, 10, 1 ],
  [ Species.TOXICROAK, "Toxicroak", 4, 0, 0, 0, "Toxic Mouth Pokémon", Type.POISON, Type.FIGHTING, 1.3, 44.4, "Anticipation", "Dry Skin", "Poison Touch", 490, 83, 106, 65, 86, 65, 85, 75, 70, 172, GrowthRate.MEDIUM_FAST, "Human-Like", null, 50, 20, 1 ],
  [ Species.CARNIVINE, "Carnivine", 4, 0, 0, 0, "Bug Catcher Pokémon", Type.GRASS, -1, 1.4, 27, "Levitate", null, null, 454, 74, 100, 72, 90, 72, 46, 200, 70, 159, GrowthRate.SLOW, "Grass", null, 50, 25, 0 ],
  [ Species.FINNEON, "Finneon", 4, 0, 0, 0, "Wing Fish Pokémon", Type.WATER, -1, 0.4, 7, "Swift Swim", "Storm Drain", "Water Veil", 330, 49, 49, 56, 49, 61, 66, 190, 70, 66, GrowthRate.ERRATIC, "Water 2", null, 50, 20, 1 ],
  [ Species.LUMINEON, "Lumineon", 4, 0, 0, 0, "Neon Pokémon", Type.WATER, -1, 1.2, 24, "Swift Swim", "Storm Drain", "Water Veil", 460, 69, 69, 76, 69, 86, 91, 75, 70, 161, GrowthRate.ERRATIC, "Water 2", null, 50, 20, 1 ],
  [ Species.MANTYKE, "Mantyke", 4, 0, 0, 0, "Kite Pokémon", Type.WATER, Type.FLYING, 1, 65, "Swift Swim", "Water Absorb", "Water Veil", 345, 45, 20, 50, 60, 120, 50, 25, 70, 69, GrowthRate.SLOW, "Undiscovered", null, 50, 25, 0 ],
  [ Species.SNOVER, "Snover", 4, 0, 0, 0, "Frost Tree Pokémon", Type.GRASS, Type.ICE, 1, 50.5, "Snow Warning", null, "Soundproof", 334, 60, 62, 50, 62, 60, 40, 120, 70, 67, GrowthRate.SLOW, "Grass", "Monster", 50, 20, 1 ],
  [ Species.ABOMASNOW, "Abomasnow", 4, 0, 0, 0, "Frost Tree Pokémon", Type.GRASS, Type.ICE, 2.2, 135.5, "Snow Warning", null, "Soundproof", 494, 90, 92, 75, 92, 85, 60, 60, 70, 173, GrowthRate.SLOW, "Grass", "Monster", 50, 20, 1 ],
  [ Species.WEAVILE, "Weavile", 4, 0, 0, 0, "Sharp Claw Pokémon", Type.DARK, Type.ICE, 1.1, 34, "Pressure", null, "Pickpocket", 510, 70, 120, 65, 45, 85, 125, 45, 35, 179, GrowthRate.MEDIUM_SLOW, "Field", null, 50, 20, 1 ],
  [ Species.MAGNEZONE, "Magnezone", 4, 0, 0, 0, "Magnet Area Pokémon", Type.ELECTRIC, Type.STEEL, 1.2, 180, "Magnet Pull", "Sturdy", "Analytic", 535, 70, 70, 115, 130, 90, 60, 30, 70, 241, GrowthRate.MEDIUM_FAST, "Mineral", null, null, 20, 0 ],
  [ Species.LICKILICKY, "Lickilicky", 4, 0, 0, 0, "Licking Pokémon", Type.NORMAL, -1, 1.7, 140, "Own Tempo", "Oblivious", "Cloud Nine", 515, 110, 85, 95, 80, 95, 50, 30, 70, 180, GrowthRate.MEDIUM_FAST, "Monster", null, 50, 20, 0 ],
  [ Species.RHYPERIOR, "Rhyperior", 4, 0, 0, 0, "Drill Pokémon", Type.GROUND, Type.ROCK, 2.4, 282.8, "Lightning Rod", "Solid Rock", "Reckless", 535, 115, 140, 130, 55, 55, 40, 30, 70, 241, GrowthRate.SLOW, "Field", "Monster", 50, 20, 1 ],
  [ Species.TANGROWTH, "Tangrowth", 4, 0, 0, 0, "Vine Pokémon", Type.GRASS, -1, 2, 128.6, "Chlorophyll", "Leaf Guard", "Regenerator", 535, 100, 100, 125, 110, 50, 50, 30, 70, 187, GrowthRate.MEDIUM_FAST, "Grass", null, 50, 20, 1 ],
  [ Species.ELECTIVIRE, "Electivire", 4, 0, 0, 0, "Thunderbolt Pokémon", Type.ELECTRIC, -1, 1.8, 138.6, "Motor Drive", null, "Vital Spirit", 540, 75, 123, 67, 95, 85, 95, 30, 70, 243, GrowthRate.MEDIUM_FAST, "Human-Like", null, 75, 25, 0 ],
  [ Species.MAGMORTAR, "Magmortar", 4, 0, 0, 0, "Blast Pokémon", Type.FIRE, -1, 1.6, 68, "Flame Body", null, "Vital Spirit", 540, 75, 95, 67, 125, 95, 83, 30, 70, 243, GrowthRate.MEDIUM_FAST, "Human-Like", null, 75, 25, 0 ],
  [ Species.TOGEKISS, "Togekiss", 4, 0, 0, 0, "Jubilee Pokémon", Type.FAIRY, Type.FLYING, 1.5, 38, "Hustle", "Serene Grace", "Super Luck", 545, 85, 50, 95, 120, 115, 80, 30, 70, 245, GrowthRate.FAST, "Fairy", "Flying", 87.5, 10, 0 ],
  [ Species.YANMEGA, "Yanmega", 4, 0, 0, 0, "Ogre Darner Pokémon", Type.BUG, Type.FLYING, 1.9, 51.5, "Speed Boost", "Tinted Lens", "Frisk", 515, 86, 76, 86, 116, 56, 95, 30, 70, 180, GrowthRate.MEDIUM_FAST, "Bug", null, 50, 20, 0 ],
  [ Species.LEAFEON, "Leafeon", 4, 0, 0, 0, "Verdant Pokémon", Type.GRASS, -1, 1, 25.5, "Leaf Guard", null, "Chlorophyll", 525, 65, 110, 130, 60, 65, 95, 45, 35, 184, GrowthRate.MEDIUM_FAST, "Field", null, 87.5, 35, 0 ],
  [ Species.GLACEON, "Glaceon", 4, 0, 0, 0, "Fresh Snow Pokémon", Type.ICE, -1, 0.8, 25.9, "Snow Cloak", null, "Ice Body", 525, 65, 60, 110, 130, 95, 65, 45, 35, 184, GrowthRate.MEDIUM_FAST, "Field", null, 87.5, 35, 0 ],
  [ Species.GLISCOR, "Gliscor", 4, 0, 0, 0, "Fang Scorp Pokémon", Type.GROUND, Type.FLYING, 2, 42.5, "Hyper Cutter", "Sand Veil", "Poison Heal", 510, 75, 95, 125, 45, 75, 95, 30, 70, 179, GrowthRate.MEDIUM_SLOW, "Bug", null, 50, 20, 0 ],
  [ Species.MAMOSWINE, "Mamoswine", 4, 0, 0, 0, "Twin Tusk Pokémon", Type.ICE, Type.GROUND, 2.5, 291, "Oblivious", "Snow Cloak", "Thick Fat", 530, 110, 130, 80, 70, 60, 80, 50, 70, 239, GrowthRate.SLOW, "Field", null, 50, 20, 1 ],
  [ Species.PORYGON_Z, "Porygon-Z", 4, 0, 0, 0, "Virtual Pokémon", Type.NORMAL, -1, 0.9, 34, "Adaptability", "Download", "Analytic", 535, 85, 80, 70, 135, 75, 90, 30, 70, 241, GrowthRate.MEDIUM_FAST, "Mineral", null, null, 20, 0 ],
  [ Species.GALLADE, "Gallade", 4, 0, 0, 0, "Blade Pokémon", Type.PSYCHIC, Type.FIGHTING, 1.6, 52, "Steadfast", null, "Justified", 518, 68, 125, 65, 65, 115, 80, 45, 35, 233, GrowthRate.SLOW, "Amorphous", "Human-Like", 100, 20, 0 ],
  [ Species.PROBOPASS, "Probopass", 4, 0, 0, 0, "Compass Pokémon", Type.ROCK, Type.STEEL, 1.4, 340, "Sturdy", "Magnet Pull", "Sand Force", 525, 60, 55, 145, 75, 150, 40, 60, 70, 184, GrowthRate.MEDIUM_FAST, "Mineral", null, 50, 20, 0 ],
  [ Species.DUSKNOIR, "Dusknoir", 4, 0, 0, 0, "Gripper Pokémon", Type.GHOST, -1, 2.2, 106.6, "Pressure", null, "Frisk", 525, 45, 100, 135, 65, 135, 45, 45, 35, 236, GrowthRate.FAST, "Amorphous", null, 50, 25, 0 ],
  [ Species.FROSLASS, "Froslass", 4, 0, 0, 0, "Snow Land Pokémon", Type.ICE, Type.GHOST, 1.3, 26.6, "Snow Cloak", null, "Cursed Body", 480, 70, 80, 70, 80, 70, 110, 75, 70, 168, GrowthRate.MEDIUM_FAST, "Fairy", "Mineral", 0, 20, 0 ],
  [ Species.ROTOM, "Rotom", 4, 0, 0, 0, "Plasma Pokémon", Type.ELECTRIC, Type.GHOST, 0.3, 0.3, "Levitate", null, null, 440, 50, 50, 77, 95, 77, 91, 45, 70, 154, GrowthRate.MEDIUM_FAST, "Amorphous", null, null, 20, 1,
    [
      [ "Normal", 4, 0, 0, 0, "Plasma Pokémon", Type.ELECTRIC, Type.GHOST, 0.3, 0.3, "Levitate", null, null, 440, 50, 50, 77, 95, 77, 91, 45, 70, 154, GrowthRate.MEDIUM_FAST, "Amorphous", null, null, 20, 1 ],
      [ "Heat", 4, 0, 0, 0, "Plasma Pokémon", Type.ELECTRIC, Type.FIRE, 0.3, 0.3, "Levitate", null, null, 520, 50, 65, 107, 105, 107, 86, 45, 70, 182, GrowthRate.MEDIUM_FAST, "Amorphous", null, null, 20, 1 ],
      [ "Wash", 4, 0, 0, 0, "Plasma Pokémon", Type.ELECTRIC, Type.WATER, 0.3, 0.3, "Levitate", null, null, 520, 50, 65, 107, 105, 107, 86, 45, 70, 182, GrowthRate.MEDIUM_FAST, "Amorphous", null, null, 20, 1 ],
      [ "Frost", 4, 0, 0, 0, "Plasma Pokémon", Type.ELECTRIC, Type.ICE, 0.3, 0.3, "Levitate", null, null, 520, 50, 65, 107, 105, 107, 86, 45, 70, 182, GrowthRate.MEDIUM_FAST, "Amorphous", null, null, 20, 1 ],
      [ "Fan", 4, 0, 0, 0, "Plasma Pokémon", Type.ELECTRIC, Type.FLYING, 0.3, 0.3, "Levitate", null, null, 520, 50, 65, 107, 105, 107, 86, 45, 70, 182, GrowthRate.MEDIUM_FAST, "Amorphous", null, null, 20, 1 ],
      [ "Mow", 4, 0, 0, 0, "Plasma Pokémon", Type.ELECTRIC, Type.GRASS, 0.3, 0.3, "Levitate", null, null, 520, 50, 65, 107, 105, 107, 86, 45, 70, 182, GrowthRate.MEDIUM_FAST, "Amorphous", null, null, 20, 1 ]
    ]
  ],
  [ Species.UXIE, "Uxie", 4, 1, 0, 0, "Knowledge Pokémon", Type.PSYCHIC, -1, 0.3, 0.3, "Levitate", null, null, 580, 75, 75, 130, 75, 130, 95, 3, 140, 261, GrowthRate.SLOW, "Undiscovered", null, null, 80, 0 ],
  [ Species.MESPRIT, "Mesprit", 4, 1, 0, 0, "Emotion Pokémon", Type.PSYCHIC, -1, 0.3, 0.3, "Levitate", null, null, 580, 80, 105, 105, 105, 105, 80, 3, 140, 261, GrowthRate.SLOW, "Undiscovered", null, null, 80, 0 ],
  [ Species.AZELF, "Azelf", 4, 1, 0, 0, "Willpower Pokémon", Type.PSYCHIC, -1, 0.3, 0.3, "Levitate", null, null, 580, 75, 125, 70, 125, 70, 115, 3, 140, 261, GrowthRate.SLOW, "Undiscovered", null, null, 80, 0 ],
  [ Species.DIALGA, "Dialga", 4, 0, 1, 0, "Temporal Pokémon", Type.STEEL, Type.DRAGON, 5.4, 683, "Pressure", null, "Telepathy", 680, 100, 120, 120, 150, 100, 90, 3, 0, 306, GrowthRate.SLOW, "Undiscovered", null, null, 120, 0 ],
  [ Species.PALKIA, "Palkia", 4, 0, 1, 0, "Spatial Pokémon", Type.WATER, Type.DRAGON, 4.2, 336, "Pressure", null, "Telepathy", 680, 90, 120, 100, 150, 120, 100, 3, 0, 306, GrowthRate.SLOW, "Undiscovered", null, null, 120, 0 ],
  [ Species.HEATRAN, "Heatran", 4, 1, 0, 0, "Lava Dome Pokémon", Type.FIRE, Type.STEEL, 1.7, 430, "Flash Fire", null, "Flame Body", 600, 91, 90, 106, 130, 106, 77, 3, 100, 270, GrowthRate.SLOW, "Undiscovered", null, 50, 10, 0 ],
  [ Species.REGIGIGAS, "Regigigas", 4, 1, 0, 0, "Colossal Pokémon", Type.NORMAL, -1, 3.7, 420, "Slow Start", null, null, 670, 110, 160, 110, 80, 110, 100, 3, 0, 302, GrowthRate.SLOW, "Undiscovered", null, null, 120, 0 ],
  [ Species.GIRATINA, "Giratina", 4, 0, 1, 0, "Renegade Pokémon", Type.GHOST, Type.DRAGON, 4.5, 750, "Pressure", null, "Telepathy", 680, 150, 100, 120, 100, 120, 90, 3, 0, 306, GrowthRate.SLOW, "Undiscovered", null, null, 120, 0,
    [
      [ "Altered Forme", 4, 0, 1, 0, "Renegade Pokémon", Type.GHOST, Type.DRAGON, 4.5, 750, "Pressure", null, "Telepathy", 680, 150, 100, 120, 100, 120, 90, 3, 0, 306, GrowthRate.SLOW, "Undiscovered", null, null, 120, 0 ],
      [ "Origin Forme", 4, 0, 1, 0, "Renegade Pokémon", Type.GHOST, Type.DRAGON, 6.9, 650, "Levitate", null, null, 680, 150, 120, 100, 120, 100, 90, 3, 0, 306, GrowthRate.SLOW, "Undiscovered", null, null, 120, 0 ]
    ]
  ],
  [ Species.CRESSELIA, "Cresselia", 4, 1, 0, 0, "Lunar Pokémon", Type.PSYCHIC, -1, 1.5, 85.6, "Levitate", null, null, 600, 120, 70, 120, 75, 130, 85, 3, 100, 270, GrowthRate.SLOW, "Undiscovered", null, 0, 120, 0 ],
  [ Species.PHIONE, "Phione", 4, 0, 0, 1, "Sea Drifter Pokémon", Type.WATER, -1, 0.4, 3.1, "Hydration", null, null, 480, 80, 80, 80, 80, 80, 80, 30, 70, 216, GrowthRate.SLOW, "Fairy", "Water 1", null, 40, 0 ],
  [ Species.MANAPHY, "Manaphy", 4, 0, 0, 1, "Seafaring Pokémon", Type.WATER, -1, 0.3, 1.4, "Hydration", null, null, 600, 100, 100, 100, 100, 100, 100, 3, 70, 270, GrowthRate.SLOW, "Fairy", "Water 1", null, 10, 0 ],
  [ Species.DARKRAI, "Darkrai", 4, 0, 0, 1, "Pitch-Black Pokémon", Type.DARK, -1, 1.5, 50.5, "Bad Dreams", null, null, 600, 70, 90, 90, 135, 90, 125, 3, 0, 270, GrowthRate.SLOW, "Undiscovered", null, null, 120, 0 ],
  [ Species.SHAYMIN, "Shaymin", 4, 0, 0, 1, "Gratitude Pokémon", Type.GRASS, -1, 0.2, 2.1, "Natural Cure", null, null, 600, 100, 100, 100, 100, 100, 100, 45, 100, 270, GrowthRate.MEDIUM_SLOW, "Undiscovered", null, null, 120, 0,
    [
      [ "Land Forme", 4, 0, 0, 1, "Gratitude Pokémon", Type.GRASS, -1, 0.2, 2.1, "Natural Cure", null, null, 600, 100, 100, 100, 100, 100, 100, 45, 100, 270, GrowthRate.MEDIUM_SLOW, "Undiscovered", null, null, 120, 0 ],
      [ "Sky Forme", 4, 0, 0, 1, "Gratitude Pokémon", Type.GRASS, Type.FLYING, 0.4, 5.2, "Serene Grace", null, null, 600, 100, 103, 75, 120, 75, 127, 45, 100, 270, GrowthRate.MEDIUM_SLOW, "Undiscovered", null, null, 120, 0 ]
    ]
  ],
  [ Species.ARCEUS, "Arceus", 4, 0, 0, 1, "Alpha Pokémon", Type.NORMAL, -1, 3.2, 320, "Multitype", null, null, 720, 120, 120, 120, 120, 120, 120, 3, 0, 324, GrowthRate.SLOW, "Undiscovered", null, null, 120, 0 ],
  [ Species.VICTINI, "Victini", 5, 0, 0, 1, "Victory Pokémon", Type.PSYCHIC, Type.FIRE, 0.4, 4, "Victory Star", null, null, 600, 100, 100, 100, 100, 100, 100, 3, 100, 270, GrowthRate.SLOW, "Undiscovered", null, null, 120, 0 ],
  [ Species.SNIVY, "Snivy", 5, 0, 0, 0, "Grass Snake Pokémon", Type.GRASS, -1, 0.6, 8.1, "Overgrow", null, "Contrary", 308, 45, 45, 55, 45, 55, 63, 45, 70, 62, GrowthRate.MEDIUM_SLOW, "Field", "Grass", 87.5, 20, 0 ],
  [ Species.SERVINE, "Servine", 5, 0, 0, 0, "Grass Snake Pokémon", Type.GRASS, -1, 0.8, 16, "Overgrow", null, "Contrary", 413, 60, 60, 75, 60, 75, 83, 45, 70, 145, GrowthRate.MEDIUM_SLOW, "Field", "Grass", 87.5, 20, 0 ],
  [ Species.SERPERIOR, "Serperior", 5, 0, 0, 0, "Regal Pokémon", Type.GRASS, -1, 3.3, 63, "Overgrow", null, "Contrary", 528, 75, 75, 95, 75, 95, 113, 45, 70, 238, GrowthRate.MEDIUM_SLOW, "Field", "Grass", 87.5, 20, 0 ],
  [ Species.TEPIG, "Tepig", 5, 0, 0, 0, "Fire Pig Pokémon", Type.FIRE, -1, 0.5, 9.9, "Blaze", null, "Thick Fat", 308, 65, 63, 45, 45, 45, 45, 45, 70, 62, GrowthRate.MEDIUM_SLOW, "Field", null, 87.5, 20, 0 ],
  [ Species.PIGNITE, "Pignite", 5, 0, 0, 0, "Fire Pig Pokémon", Type.FIRE, Type.FIGHTING, 1, 55.5, "Blaze", null, "Thick Fat", 418, 90, 93, 55, 70, 55, 55, 45, 70, 146, GrowthRate.MEDIUM_SLOW, "Field", null, 87.5, 20, 0 ],
  [ Species.EMBOAR, "Emboar", 5, 0, 0, 0, "Mega Fire Pig Pokémon", Type.FIRE, Type.FIGHTING, 1.6, 150, "Blaze", null, "Reckless", 528, 110, 123, 65, 100, 65, 65, 45, 70, 238, GrowthRate.MEDIUM_SLOW, "Field", null, 87.5, 20, 0 ],
  [ Species.OSHAWOTT, "Oshawott", 5, 0, 0, 0, "Sea Otter Pokémon", Type.WATER, -1, 0.5, 5.9, "Torrent", null, "Shell Armor", 308, 55, 55, 45, 63, 45, 45, 45, 70, 62, GrowthRate.MEDIUM_SLOW, "Field", null, 87.5, 20, 0 ],
  [ Species.DEWOTT, "Dewott", 5, 0, 0, 0, "Discipline Pokémon", Type.WATER, -1, 0.8, 24.5, "Torrent", null, "Shell Armor", 413, 75, 75, 60, 83, 60, 60, 45, 70, 145, GrowthRate.MEDIUM_SLOW, "Field", null, 87.5, 20, 0 ],
  [ Species.SAMUROTT, "Samurott", 5, 0, 0, 0, "Formidable Pokémon", Type.WATER, -1, 1.5, 94.6, "Torrent", null, "Shell Armor", 528, 95, 100, 85, 108, 70, 70, 45, 70, 238, GrowthRate.MEDIUM_SLOW, "Field", null, 87.5, 20, 0 ],
  [ Species.PATRAT, "Patrat", 5, 0, 0, 0, "Scout Pokémon", Type.NORMAL, -1, 0.5, 11.6, "Run Away", "Keen Eye", "Analytic", 255, 45, 55, 39, 35, 39, 42, 255, 70, 51, GrowthRate.MEDIUM_FAST, "Field", null, 50, 15, 0 ],
  [ Species.WATCHOG, "Watchog", 5, 0, 0, 0, "Lookout Pokémon", Type.NORMAL, -1, 1.1, 27, "Illuminate", "Keen Eye", "Analytic", 420, 60, 85, 69, 60, 69, 77, 255, 70, 147, GrowthRate.MEDIUM_FAST, "Field", null, 50, 20, 0 ],
  [ Species.LILLIPUP, "Lillipup", 5, 0, 0, 0, "Puppy Pokémon", Type.NORMAL, -1, 0.4, 4.1, "Vital Spirit", "Pickup", "Run Away", 275, 45, 60, 45, 25, 45, 55, 255, 70, 55, GrowthRate.MEDIUM_SLOW, "Field", null, 50, 15, 0 ],
  [ Species.HERDIER, "Herdier", 5, 0, 0, 0, "Loyal Dog Pokémon", Type.NORMAL, -1, 0.9, 14.7, "Intimidate", "Sand Rush", "Scrappy", 370, 65, 80, 65, 35, 65, 60, 120, 70, 130, GrowthRate.MEDIUM_SLOW, "Field", null, 50, 15, 0 ],
  [ Species.STOUTLAND, "Stoutland", 5, 0, 0, 0, "Big-Hearted Pokémon", Type.NORMAL, -1, 1.2, 61, "Intimidate", "Sand Rush", "Scrappy", 500, 85, 110, 90, 45, 90, 80, 45, 70, 225, GrowthRate.MEDIUM_SLOW, "Field", null, 50, 15, 0 ],
  [ Species.PURRLOIN, "Purrloin", 5, 0, 0, 0, "Devious Pokémon", Type.DARK, -1, 0.4, 10.1, "Limber", "Unburden", "Prankster", 281, 41, 50, 37, 50, 37, 66, 255, 70, 56, GrowthRate.MEDIUM_FAST, "Field", null, 50, 20, 0 ],
  [ Species.LIEPARD, "Liepard", 5, 0, 0, 0, "Cruel Pokémon", Type.DARK, -1, 1.1, 37.5, "Limber", "Unburden", "Prankster", 446, 64, 88, 50, 88, 50, 106, 90, 70, 156, GrowthRate.MEDIUM_FAST, "Field", null, 50, 20, 0 ],
  [ Species.PANSAGE, "Pansage", 5, 0, 0, 0, "Grass Monkey Pokémon", Type.GRASS, -1, 0.6, 10.5, "Gluttony", null, "Overgrow", 316, 50, 53, 48, 53, 48, 64, 190, 70, 63, GrowthRate.MEDIUM_FAST, "Field", null, 87.5, 20, 0 ],
  [ Species.SIMISAGE, "Simisage", 5, 0, 0, 0, "Thorn Monkey Pokémon", Type.GRASS, -1, 1.1, 30.5, "Gluttony", null, "Overgrow", 498, 75, 98, 63, 98, 63, 101, 75, 70, 174, GrowthRate.MEDIUM_FAST, "Field", null, 87.5, 20, 0 ],
  [ Species.PANSEAR, "Pansear", 5, 0, 0, 0, "High Temp Pokémon", Type.FIRE, -1, 0.6, 11, "Gluttony", null, "Blaze", 316, 50, 53, 48, 53, 48, 64, 190, 70, 63, GrowthRate.MEDIUM_FAST, "Field", null, 87.5, 20, 0 ],
  [ Species.SIMISEAR, "Simisear", 5, 0, 0, 0, "Ember Pokémon", Type.FIRE, -1, 1, 28, "Gluttony", null, "Blaze", 498, 75, 98, 63, 98, 63, 101, 75, 70, 174, GrowthRate.MEDIUM_FAST, "Field", null, 87.5, 20, 0 ],
  [ Species.PANPOUR, "Panpour", 5, 0, 0, 0, "Spray Pokémon", Type.WATER, -1, 0.6, 13.5, "Gluttony", null, "Torrent", 316, 50, 53, 48, 53, 48, 64, 190, 70, 63, GrowthRate.MEDIUM_FAST, "Field", null, 87.5, 20, 0 ],
  [ Species.SIMIPOUR, "Simipour", 5, 0, 0, 0, "Geyser Pokémon", Type.WATER, -1, 1, 29, "Gluttony", null, "Torrent", 498, 75, 98, 63, 98, 63, 101, 75, 70, 174, GrowthRate.MEDIUM_FAST, "Field", null, 87.5, 20, 0 ],
  [ Species.MUNNA, "Munna", 5, 0, 0, 0, "Dream Eater Pokémon", Type.PSYCHIC, -1, 0.6, 23.3, "Forewarn", "Synchronize", "Telepathy", 292, 76, 25, 45, 67, 55, 24, 190, 70, 58, GrowthRate.FAST, "Field", null, 50, 10, 0 ],
  [ Species.MUSHARNA, "Musharna", 5, 0, 0, 0, "Drowsing Pokémon", Type.PSYCHIC, -1, 1.1, 60.5, "Forewarn", "Synchronize", "Telepathy", 487, 116, 55, 85, 107, 95, 29, 75, 70, 170, GrowthRate.FAST, "Field", null, 50, 10, 0 ],
  [ Species.PIDOVE, "Pidove", 5, 0, 0, 0, "Tiny Pigeon Pokémon", Type.NORMAL, Type.FLYING, 0.3, 2.1, "Big Pecks", "Super Luck", "Rivalry", 264, 50, 55, 50, 36, 30, 43, 255, 70, 53, GrowthRate.MEDIUM_SLOW, "Flying", null, 50, 15, 0 ],
  [ Species.TRANQUILL, "Tranquill", 5, 0, 0, 0, "Wild Pigeon Pokémon", Type.NORMAL, Type.FLYING, 0.6, 15, "Big Pecks", "Super Luck", "Rivalry", 358, 62, 77, 62, 50, 42, 65, 120, 70, 125, GrowthRate.MEDIUM_SLOW, "Flying", null, 50, 15, 0 ],
  [ Species.UNFEZANT, "Unfezant", 5, 0, 0, 0, "Proud Pokémon", Type.NORMAL, Type.FLYING, 1.2, 29, "Big Pecks", "Super Luck", "Rivalry", 488, 80, 115, 80, 65, 55, 93, 45, 70, 220, GrowthRate.MEDIUM_SLOW, "Flying", null, 50, 15, 1 ],
  [ Species.BLITZLE, "Blitzle", 5, 0, 0, 0, "Electrified Pokémon", Type.ELECTRIC, -1, 0.8, 29.8, "Lightning Rod", "Motor Drive", "Sap Sipper", 295, 45, 60, 32, 50, 32, 76, 190, 70, 59, GrowthRate.MEDIUM_FAST, "Field", null, 50, 20, 0 ],
  [ Species.ZEBSTRIKA, "Zebstrika", 5, 0, 0, 0, "Thunderbolt Pokémon", Type.ELECTRIC, -1, 1.6, 79.5, "Lightning Rod", "Motor Drive", "Sap Sipper", 497, 75, 100, 63, 80, 63, 116, 75, 70, 174, GrowthRate.MEDIUM_FAST, "Field", null, 50, 20, 0 ],
  [ Species.ROGGENROLA, "Roggenrola", 5, 0, 0, 0, "Mantle Pokémon", Type.ROCK, -1, 0.4, 18, "Sturdy", "Weak Armor", "Sand Force", 280, 55, 75, 85, 25, 25, 15, 255, 70, 56, GrowthRate.MEDIUM_SLOW, "Mineral", null, 50, 15, 0 ],
  [ Species.BOLDORE, "Boldore", 5, 0, 0, 0, "Ore Pokémon", Type.ROCK, -1, 0.9, 102, "Sturdy", "Weak Armor", "Sand Force", 390, 70, 105, 105, 50, 40, 20, 120, 70, 137, GrowthRate.MEDIUM_SLOW, "Mineral", null, 50, 15, 0 ],
  [ Species.GIGALITH, "Gigalith", 5, 0, 0, 0, "Compressed Pokémon", Type.ROCK, -1, 1.7, 260, "Sturdy", "Sand Stream", "Sand Force", 515, 85, 135, 130, 60, 80, 25, 45, 70, 232, GrowthRate.MEDIUM_SLOW, "Mineral", null, 50, 15, 0 ],
  [ Species.WOOBAT, "Woobat", 5, 0, 0, 0, "Bat Pokémon", Type.PSYCHIC, Type.FLYING, 0.4, 2.1, "Unaware", "Klutz", "Simple", 323, 65, 45, 43, 55, 43, 72, 190, 70, 65, GrowthRate.MEDIUM_FAST, "Field", "Flying", 50, 15, 0 ],
  [ Species.SWOOBAT, "Swoobat", 5, 0, 0, 0, "Courting Pokémon", Type.PSYCHIC, Type.FLYING, 0.9, 10.5, "Unaware", "Klutz", "Simple", 425, 67, 57, 55, 77, 55, 114, 45, 70, 149, GrowthRate.MEDIUM_FAST, "Field", "Flying", 50, 15, 0 ],
  [ Species.DRILBUR, "Drilbur", 5, 0, 0, 0, "Mole Pokémon", Type.GROUND, -1, 0.3, 8.5, "Sand Rush", "Sand Force", "Mold Breaker", 328, 60, 85, 40, 30, 45, 68, 120, 70, 66, GrowthRate.MEDIUM_FAST, "Field", null, 50, 20, 0 ],
  [ Species.EXCADRILL, "Excadrill", 5, 0, 0, 0, "Subterrene Pokémon", Type.GROUND, Type.STEEL, 0.7, 40.4, "Sand Rush", "Sand Force", "Mold Breaker", 508, 110, 135, 60, 50, 65, 88, 60, 70, 178, GrowthRate.MEDIUM_FAST, "Field", null, 50, 20, 0 ],
  [ Species.AUDINO, "Audino", 5, 0, 0, 0, "Hearing Pokémon", Type.NORMAL, -1, 1.1, 31, "Healer", "Regenerator", "Klutz", 445, 103, 60, 86, 60, 86, 50, 255, 70, 390, GrowthRate.FAST, "Fairy", null, 50, 20, 0 ],
  [ Species.TIMBURR, "Timburr", 5, 0, 0, 0, "Muscular Pokémon", Type.FIGHTING, -1, 0.6, 12.5, "Guts", "Sheer Force", "Iron Fist", 305, 75, 80, 55, 25, 35, 35, 180, 70, 61, GrowthRate.MEDIUM_SLOW, "Human-Like", null, 75, 20, 0 ],
  [ Species.GURDURR, "Gurdurr", 5, 0, 0, 0, "Muscular Pokémon", Type.FIGHTING, -1, 1.2, 40, "Guts", "Sheer Force", "Iron Fist", 405, 85, 105, 85, 40, 50, 40, 90, 70, 142, GrowthRate.MEDIUM_SLOW, "Human-Like", null, 75, 20, 0 ],
  [ Species.CONKELDURR, "Conkeldurr", 5, 0, 0, 0, "Muscular Pokémon", Type.FIGHTING, -1, 1.4, 87, "Guts", "Sheer Force", "Iron Fist", 505, 105, 140, 95, 55, 65, 45, 45, 70, 227, GrowthRate.MEDIUM_SLOW, "Human-Like", null, 75, 20, 0 ],
  [ Species.TYMPOLE, "Tympole", 5, 0, 0, 0, "Tadpole Pokémon", Type.WATER, -1, 0.5, 4.5, "Swift Swim", "Hydration", "Water Absorb", 294, 50, 50, 40, 50, 40, 64, 255, 70, 59, GrowthRate.MEDIUM_SLOW, "Water 1", null, 50, 20, 0 ],
  [ Species.PALPITOAD, "Palpitoad", 5, 0, 0, 0, "Vibration Pokémon", Type.WATER, Type.GROUND, 0.8, 17, "Swift Swim", "Hydration", "Water Absorb", 384, 75, 65, 55, 65, 55, 69, 120, 70, 134, GrowthRate.MEDIUM_SLOW, "Water 1", null, 50, 20, 0 ],
  [ Species.SEISMITOAD, "Seismitoad", 5, 0, 0, 0, "Vibration Pokémon", Type.WATER, Type.GROUND, 1.5, 62, "Swift Swim", "Poison Touch", "Water Absorb", 509, 105, 95, 75, 85, 75, 74, 45, 70, 229, GrowthRate.MEDIUM_SLOW, "Water 1", null, 50, 20, 0 ],
  [ Species.THROH, "Throh", 5, 0, 0, 0, "Judo Pokémon", Type.FIGHTING, -1, 1.3, 55.5, "Guts", "Inner Focus", "Mold Breaker", 465, 120, 100, 85, 30, 85, 45, 45, 70, 163, GrowthRate.MEDIUM_FAST, "Human-Like", null, 100, 20, 0 ],
  [ Species.SAWK, "Sawk", 5, 0, 0, 0, "Karate Pokémon", Type.FIGHTING, -1, 1.4, 51, "Sturdy", "Inner Focus", "Mold Breaker", 465, 75, 125, 75, 30, 75, 85, 45, 70, 163, GrowthRate.MEDIUM_FAST, "Human-Like", null, 100, 20, 0 ],
  [ Species.SEWADDLE, "Sewaddle", 5, 0, 0, 0, "Sewing Pokémon", Type.BUG, Type.GRASS, 0.3, 2.5, "Swarm", "Chlorophyll", "Overcoat", 310, 45, 53, 70, 40, 60, 42, 255, 70, 62, GrowthRate.MEDIUM_SLOW, "Bug", null, 50, 15, 0 ],
  [ Species.SWADLOON, "Swadloon", 5, 0, 0, 0, "Leaf-Wrapped Pokémon", Type.BUG, Type.GRASS, 0.5, 7.3, "Leaf Guard", "Chlorophyll", "Overcoat", 380, 55, 63, 90, 50, 80, 42, 120, 70, 133, GrowthRate.MEDIUM_SLOW, "Bug", null, 50, 15, 0 ],
  [ Species.LEAVANNY, "Leavanny", 5, 0, 0, 0, "Nurturing Pokémon", Type.BUG, Type.GRASS, 1.2, 20.5, "Swarm", "Chlorophyll", "Overcoat", 500, 75, 103, 80, 70, 80, 92, 45, 70, 225, GrowthRate.MEDIUM_SLOW, "Bug", null, 50, 15, 0 ],
  [ Species.VENIPEDE, "Venipede", 5, 0, 0, 0, "Centipede Pokémon", Type.BUG, Type.POISON, 0.4, 5.3, "Poison Point", "Swarm", "Speed Boost", 260, 30, 45, 59, 30, 39, 57, 255, 70, 52, GrowthRate.MEDIUM_SLOW, "Bug", null, 50, 15, 0 ],
  [ Species.WHIRLIPEDE, "Whirlipede", 5, 0, 0, 0, "Curlipede Pokémon", Type.BUG, Type.POISON, 1.2, 58.5, "Poison Point", "Swarm", "Speed Boost", 360, 40, 55, 99, 40, 79, 47, 120, 70, 126, GrowthRate.MEDIUM_SLOW, "Bug", null, 50, 15, 0 ],
  [ Species.SCOLIPEDE, "Scolipede", 5, 0, 0, 0, "Megapede Pokémon", Type.BUG, Type.POISON, 2.5, 200.5, "Poison Point", "Swarm", "Speed Boost", 485, 60, 100, 89, 55, 69, 112, 45, 70, 218, GrowthRate.MEDIUM_SLOW, "Bug", null, 50, 20, 0 ],
  [ Species.COTTONEE, "Cottonee", 5, 0, 0, 0, "Cotton Puff Pokémon", Type.GRASS, Type.FAIRY, 0.3, 0.6, "Prankster", "Infiltrator", "Chlorophyll", 280, 40, 27, 60, 37, 50, 66, 190, 70, 56, GrowthRate.MEDIUM_FAST, "Fairy", "Grass", 50, 20, 0 ],
  [ Species.WHIMSICOTT, "Whimsicott", 5, 0, 0, 0, "Windveiled Pokémon", Type.GRASS, Type.FAIRY, 0.7, 6.6, "Prankster", "Infiltrator", "Chlorophyll", 480, 60, 67, 85, 77, 75, 116, 75, 70, 168, GrowthRate.MEDIUM_FAST, "Fairy", "Grass", 50, 20, 0 ],
  [ Species.PETILIL, "Petilil", 5, 0, 0, 0, "Bulb Pokémon", Type.GRASS, -1, 0.5, 6.6, "Chlorophyll", "Own Tempo", "Leaf Guard", 280, 45, 35, 50, 70, 50, 30, 190, 70, 56, GrowthRate.MEDIUM_FAST, "Grass", null, 0, 20, 0 ],
  [ Species.LILLIGANT, "Lilligant", 5, 0, 0, 0, "Flowering Pokémon", Type.GRASS, -1, 1.1, 16.3, "Chlorophyll", "Own Tempo", "Leaf Guard", 480, 70, 60, 75, 110, 75, 90, 75, 70, 168, GrowthRate.MEDIUM_FAST, "Grass", null, 0, 20, 0 ],
  [ Species.BASCULIN, "Basculin", 5, 0, 0, 0, "Hostile Pokémon", Type.WATER, -1, 1, 18, "Reckless", "Adaptability", "Mold Breaker", 460, 70, 92, 65, 80, 55, 98, 25, 70, 161, GrowthRate.MEDIUM_FAST, "Water 2", null, 50, 40, 0,
    [
      [ "Red-Striped Form", 5, 0, 0, 0, "Hostile Pokémon", Type.WATER, -1, 1, 18, "Reckless", "Adaptability", "Mold Breaker", 460, 70, 92, 65, 80, 55, 98, 25, 70, 161, GrowthRate.MEDIUM_FAST, "Water 2", null, 50, 40, 0 ],
      [ "Blue-Striped Form", 5, 0, 0, 0, "Hostile Pokémon", Type.WATER, -1, 1, 18, "Rock Head", "Adaptability", "Mold Breaker", 460, 70, 92, 65, 80, 55, 98, 25, 70, 161, GrowthRate.MEDIUM_FAST, "Water 2", null, 50, 40, 0 ]
    ]
  ],
  [ Species.SANDILE, "Sandile", 5, 0, 0, 0, "Desert Croc Pokémon", Type.GROUND, Type.DARK, 0.7, 15.2, "Intimidate", "Moxie", "Anger Point", 292, 50, 72, 35, 35, 35, 65, 180, 70, 58, GrowthRate.MEDIUM_SLOW, "Field", null, 50, 20, 0 ],
  [ Species.KROKOROK, "Krokorok", 5, 0, 0, 0, "Desert Croc Pokémon", Type.GROUND, Type.DARK, 1, 33.4, "Intimidate", "Moxie", "Anger Point", 351, 60, 82, 45, 45, 45, 74, 90, 70, 123, GrowthRate.MEDIUM_SLOW, "Field", null, 50, 20, 0 ],
  [ Species.KROOKODILE, "Krookodile", 5, 0, 0, 0, "Intimidation Pokémon", Type.GROUND, Type.DARK, 1.5, 96.3, "Intimidate", "Moxie", "Anger Point", 519, 95, 117, 80, 65, 70, 92, 45, 70, 234, GrowthRate.MEDIUM_SLOW, "Field", null, 50, 20, 0 ],
  [ Species.DARUMAKA, "Darumaka", 5, 0, 0, 0, "Zen Charm Pokémon", Type.FIRE, -1, 0.6, 37.5, "Hustle", null, "Inner Focus", 315, 70, 90, 45, 15, 45, 50, 120, 70, 63, GrowthRate.MEDIUM_SLOW, "Field", null, 50, 20, 0 ],
  [ Species.DARMANITAN, "Darmanitan", 5, 0, 0, 0, "Blazing Pokémon", Type.FIRE, -1, 1.3, 92.9, "Sheer Force", null, "Zen Mode", 480, 105, 140, 55, 30, 55, 95, 60, 70, 168, GrowthRate.MEDIUM_SLOW, "Field", null, 50, 20, 0,
    [
      [ "Standard Mode", 5, 0, 0, 0, "Blazing Pokémon", Type.FIRE, -1, 1.3, 92.9, "Sheer Force", null, "Zen Mode", 480, 105, 140, 55, 30, 55, 95, 60, 70, 168, GrowthRate.MEDIUM_SLOW, "Field", null, 50, 20, 0 ],
      [ "Zen Mode", 5, 0, 0, 0, "Blazing Pokémon", Type.FIRE, Type.PSYCHIC, 1.3, 92.9, "Sheer Force", null, "Zen Mode", 540, 105, 30, 105, 140, 105, 55, 60, 70, 189, GrowthRate.MEDIUM_SLOW, "Field", null, 50, 20, 0 ]
    ]
  ],
  [ Species.MARACTUS, "Maractus", 5, 0, 0, 0, "Cactus Pokémon", Type.GRASS, -1, 1, 28, "Water Absorb", "Chlorophyll", "Storm Drain", 461, 75, 86, 67, 106, 67, 60, 255, 70, 161, GrowthRate.MEDIUM_FAST, "Grass", null, 50, 20, 0 ],
  [ Species.DWEBBLE, "Dwebble", 5, 0, 0, 0, "Rock Inn Pokémon", Type.BUG, Type.ROCK, 0.3, 14.5, "Sturdy", "Shell Armor", "Weak Armor", 325, 50, 65, 85, 35, 35, 55, 190, 70, 65, GrowthRate.MEDIUM_FAST, "Bug", "Mineral", 50, 20, 0 ],
  [ Species.CRUSTLE, "Crustle", 5, 0, 0, 0, "Stone Home Pokémon", Type.BUG, Type.ROCK, 1.4, 200, "Sturdy", "Shell Armor", "Weak Armor", 485, 70, 105, 125, 65, 75, 45, 75, 70, 170, GrowthRate.MEDIUM_FAST, "Bug", "Mineral", 50, 20, 0 ],
  [ Species.SCRAGGY, "Scraggy", 5, 0, 0, 0, "Shedding Pokémon", Type.DARK, Type.FIGHTING, 0.6, 11.8, "Shed Skin", "Moxie", "Intimidate", 348, 50, 75, 70, 35, 70, 48, 180, 35, 70, GrowthRate.MEDIUM_FAST, "Dragon", "Field", 50, 15, 0 ],
  [ Species.SCRAFTY, "Scrafty", 5, 0, 0, 0, "Hoodlum Pokémon", Type.DARK, Type.FIGHTING, 1.1, 30, "Shed Skin", "Moxie", "Intimidate", 488, 65, 90, 115, 45, 115, 58, 90, 70, 171, GrowthRate.MEDIUM_FAST, "Dragon", "Field", 50, 15, 0 ],
  [ Species.SIGILYPH, "Sigilyph", 5, 0, 0, 0, "Avianoid Pokémon", Type.PSYCHIC, Type.FLYING, 1.4, 14, "Wonder Skin", "Magic Guard", "Tinted Lens", 490, 72, 58, 80, 103, 80, 97, 45, 70, 172, GrowthRate.MEDIUM_FAST, "Flying", null, 50, 20, 0 ],
  [ Species.YAMASK, "Yamask", 5, 0, 0, 0, "Spirit Pokémon", Type.GHOST, -1, 0.5, 1.5, "Mummy", null, null, 303, 38, 30, 85, 55, 65, 30, 190, 70, 61, GrowthRate.MEDIUM_FAST, "Amorphous", "Mineral", 50, 25, 0 ],
  [ Species.COFAGRIGUS, "Cofagrigus", 5, 0, 0, 0, "Coffin Pokémon", Type.GHOST, -1, 1.7, 76.5, "Mummy", null, null, 483, 58, 50, 145, 95, 105, 30, 90, 70, 169, GrowthRate.MEDIUM_FAST, "Amorphous", "Mineral", 50, 25, 0 ],
  [ Species.TIRTOUGA, "Tirtouga", 5, 0, 0, 0, "Prototurtle Pokémon", Type.WATER, Type.ROCK, 0.7, 16.5, "Solid Rock", "Sturdy", "Swift Swim", 355, 54, 78, 103, 53, 45, 22, 45, 70, 71, GrowthRate.MEDIUM_FAST, "Water 1", "Water 3", 87.5, 30, 0 ],
  [ Species.CARRACOSTA, "Carracosta", 5, 0, 0, 0, "Prototurtle Pokémon", Type.WATER, Type.ROCK, 1.2, 81, "Solid Rock", "Sturdy", "Swift Swim", 495, 74, 108, 133, 83, 65, 32, 45, 70, 173, GrowthRate.MEDIUM_FAST, "Water 1", "Water 3", 87.5, 30, 0 ],
  [ Species.ARCHEN, "Archen", 5, 0, 0, 0, "First Bird Pokémon", Type.ROCK, Type.FLYING, 0.5, 9.5, "Defeatist", null, null, 401, 55, 112, 45, 74, 45, 70, 45, 70, 71, GrowthRate.MEDIUM_FAST, "Flying", "Water 3", 87.5, 30, 0 ],
  [ Species.ARCHEOPS, "Archeops", 5, 0, 0, 0, "First Bird Pokémon", Type.ROCK, Type.FLYING, 1.4, 32, "Defeatist", null, null, 567, 75, 140, 65, 112, 65, 110, 45, 70, 177, GrowthRate.MEDIUM_FAST, "Flying", "Water 3", 87.5, 30, 0 ],
  [ Species.TRUBBISH, "Trubbish", 5, 0, 0, 0, "Trash Bag Pokémon", Type.POISON, -1, 0.6, 31, "Stench", "Sticky Hold", "Aftermath", 329, 50, 50, 62, 40, 62, 65, 190, 70, 66, GrowthRate.MEDIUM_FAST, "Mineral", null, 50, 20, 0 ],
  [ Species.GARBODOR, "Garbodor", 5, 0, 0, 0, "Trash Heap Pokémon", Type.POISON, -1, 1.9, 107.3, "Stench", "Weak Armor", "Aftermath", 474, 80, 95, 82, 60, 82, 75, 60, 70, 166, GrowthRate.MEDIUM_FAST, "Mineral", null, 50, 20, 0 ],
  [ Species.ZORUA, "Zorua", 5, 0, 0, 0, "Tricky Fox Pokémon", Type.DARK, -1, 0.7, 12.5, "Illusion", null, null, 330, 40, 65, 40, 80, 40, 65, 75, 70, 66, GrowthRate.MEDIUM_SLOW, "Field", null, 87.5, 25, 0 ],
  [ Species.ZOROARK, "Zoroark", 5, 0, 0, 0, "Illusion Fox Pokémon", Type.DARK, -1, 1.6, 81.1, "Illusion", null, null, 510, 60, 105, 60, 120, 60, 105, 45, 70, 179, GrowthRate.MEDIUM_SLOW, "Field", null, 87.5, 20, 0 ],
  [ Species.MINCCINO, "Minccino", 5, 0, 0, 0, "Chinchilla Pokémon", Type.NORMAL, -1, 0.4, 5.8, "Cute Charm", "Technician", "Skill Link", 300, 55, 50, 40, 40, 40, 75, 255, 70, 60, GrowthRate.FAST, "Field", null, 25, 15, 0 ],
  [ Species.CINCCINO, "Cinccino", 5, 0, 0, 0, "Scarf Pokémon", Type.NORMAL, -1, 0.5, 7.5, "Cute Charm", "Technician", "Skill Link", 470, 75, 95, 60, 65, 60, 115, 60, 70, 165, GrowthRate.FAST, "Field", null, 25, 15, 0 ],
  [ Species.GOTHITA, "Gothita", 5, 0, 0, 0, "Fixation Pokémon", Type.PSYCHIC, -1, 0.4, 5.8, "Frisk", "Competitive", "Shadow Tag", 290, 45, 30, 50, 55, 65, 45, 200, 70, 58, GrowthRate.MEDIUM_SLOW, "Human-Like", null, 25, 20, 0 ],
  [ Species.GOTHORITA, "Gothorita", 5, 0, 0, 0, "Manipulate Pokémon", Type.PSYCHIC, -1, 0.7, 18, "Frisk", "Competitive", "Shadow Tag", 390, 60, 45, 70, 75, 85, 55, 100, 70, 137, GrowthRate.MEDIUM_SLOW, "Human-Like", null, 25, 20, 0 ],
  [ Species.GOTHITELLE, "Gothitelle", 5, 0, 0, 0, "Astral Body Pokémon", Type.PSYCHIC, -1, 1.5, 44, "Frisk", "Competitive", "Shadow Tag", 490, 70, 55, 95, 95, 110, 65, 50, 70, 221, GrowthRate.MEDIUM_SLOW, "Human-Like", null, 25, 20, 0 ],
  [ Species.SOLOSIS, "Solosis", 5, 0, 0, 0, "Cell Pokémon", Type.PSYCHIC, -1, 0.3, 1, "Overcoat", "Magic Guard", "Regenerator", 290, 45, 30, 40, 105, 50, 20, 200, 70, 58, GrowthRate.MEDIUM_SLOW, "Amorphous", null, 50, 20, 0 ],
  [ Species.DUOSION, "Duosion", 5, 0, 0, 0, "Mitosis Pokémon", Type.PSYCHIC, -1, 0.6, 8, "Overcoat", "Magic Guard", "Regenerator", 370, 65, 40, 50, 125, 60, 30, 100, 70, 130, GrowthRate.MEDIUM_SLOW, "Amorphous", null, 50, 20, 0 ],
  [ Species.REUNICLUS, "Reuniclus", 5, 0, 0, 0, "Multiplying Pokémon", Type.PSYCHIC, -1, 1, 20.1, "Overcoat", "Magic Guard", "Regenerator", 490, 110, 65, 75, 125, 85, 30, 50, 70, 221, GrowthRate.MEDIUM_SLOW, "Amorphous", null, 50, 20, 0 ],
  [ Species.DUCKLETT, "Ducklett", 5, 0, 0, 0, "Water Bird Pokémon", Type.WATER, Type.FLYING, 0.5, 5.5, "Keen Eye", "Big Pecks", "Hydration", 305, 62, 44, 50, 44, 50, 55, 190, 70, 61, GrowthRate.MEDIUM_FAST, "Flying", "Water 1", 50, 20, 0 ],
  [ Species.SWANNA, "Swanna", 5, 0, 0, 0, "White Bird Pokémon", Type.WATER, Type.FLYING, 1.3, 24.2, "Keen Eye", "Big Pecks", "Hydration", 473, 75, 87, 63, 87, 63, 98, 45, 70, 166, GrowthRate.MEDIUM_FAST, "Flying", "Water 1", 50, 20, 0 ],
  [ Species.VANILLITE, "Vanillite", 5, 0, 0, 0, "Fresh Snow Pokémon", Type.ICE, -1, 0.4, 5.7, "Ice Body", "Snow Cloak", "Weak Armor", 305, 36, 50, 50, 65, 60, 44, 255, 70, 61, GrowthRate.SLOW, "Mineral", null, 50, 20, 0 ],
  [ Species.VANILLISH, "Vanillish", 5, 0, 0, 0, "Icy Snow Pokémon", Type.ICE, -1, 1.1, 41, "Ice Body", "Snow Cloak", "Weak Armor", 395, 51, 65, 65, 80, 75, 59, 120, 70, 138, GrowthRate.SLOW, "Mineral", null, 50, 20, 0 ],
  [ Species.VANILLUXE, "Vanilluxe", 5, 0, 0, 0, "Snowstorm Pokémon", Type.ICE, -1, 1.3, 57.5, "Ice Body", "Snow Warning", "Weak Armor", 535, 71, 95, 85, 110, 95, 79, 45, 70, 241, GrowthRate.SLOW, "Mineral", null, 50, 20, 0 ],
  [ Species.DEERLING, "Deerling", 5, 0, 0, 0, "Season Pokémon", Type.NORMAL, Type.GRASS, 0.6, 19.5, "Chlorophyll", "Sap Sipper", "Serene Grace", 335, 60, 60, 50, 40, 50, 75, 190, 70, 67, GrowthRate.MEDIUM_FAST, "Field", null, 50, 20, 0 ],
  [ Species.SAWSBUCK, "Sawsbuck", 5, 0, 0, 0, "Season Pokémon", Type.NORMAL, Type.GRASS, 1.9, 92.5, "Chlorophyll", "Sap Sipper", "Serene Grace", 475, 80, 100, 70, 60, 70, 95, 75, 70, 166, GrowthRate.MEDIUM_FAST, "Field", null, 50, 20, 0 ],
  [ Species.EMOLGA, "Emolga", 5, 0, 0, 0, "Sky Squirrel Pokémon", Type.ELECTRIC, Type.FLYING, 0.4, 5, "Static", null, "Motor Drive", 428, 55, 75, 60, 75, 60, 103, 200, 70, 150, GrowthRate.MEDIUM_FAST, "Field", null, 50, 20, 0 ],
  [ Species.KARRABLAST, "Karrablast", 5, 0, 0, 0, "Clamping Pokémon", Type.BUG, -1, 0.5, 5.9, "Swarm", "Shed Skin", "No Guard", 315, 50, 75, 45, 40, 45, 60, 200, 70, 63, GrowthRate.MEDIUM_FAST, "Bug", null, 50, 15, 0 ],
  [ Species.ESCAVALIER, "Escavalier", 5, 0, 0, 0, "Cavalry Pokémon", Type.BUG, Type.STEEL, 1, 33, "Swarm", "Shell Armor", "Overcoat", 495, 70, 135, 105, 60, 105, 20, 75, 70, 173, GrowthRate.MEDIUM_FAST, "Bug", null, 50, 15, 0 ],
  [ Species.FOONGUS, "Foongus", 5, 0, 0, 0, "Mushroom Pokémon", Type.GRASS, Type.POISON, 0.2, 1, "Effect Spore", null, "Regenerator", 294, 69, 55, 45, 55, 55, 15, 190, 70, 59, GrowthRate.MEDIUM_FAST, "Grass", null, 50, 20, 0 ],
  [ Species.AMOONGUSS, "Amoonguss", 5, 0, 0, 0, "Mushroom Pokémon", Type.GRASS, Type.POISON, 0.6, 10.5, "Effect Spore", null, "Regenerator", 464, 114, 85, 70, 85, 80, 30, 75, 70, 162, GrowthRate.MEDIUM_FAST, "Grass", null, 50, 20, 0 ],
  [ Species.FRILLISH, "Frillish", 5, 0, 0, 0, "Floating Pokémon", Type.WATER, Type.GHOST, 1.2, 33, "Water Absorb", "Cursed Body", "Damp", 335, 55, 40, 50, 65, 85, 40, 190, 70, 67, GrowthRate.MEDIUM_FAST, "Amorphous", null, 50, 20, 1 ],
  [ Species.JELLICENT, "Jellicent", 5, 0, 0, 0, "Floating Pokémon", Type.WATER, Type.GHOST, 2.2, 135, "Water Absorb", "Cursed Body", "Damp", 480, 100, 60, 70, 85, 105, 60, 60, 70, 168, GrowthRate.MEDIUM_FAST, "Amorphous", null, 50, 20, 1 ],
  [ Species.ALOMOMOLA, "Alomomola", 5, 0, 0, 0, "Caring Pokémon", Type.WATER, -1, 1.2, 31.6, "Healer", "Hydration", "Regenerator", 470, 165, 75, 80, 40, 45, 65, 75, 70, 165, GrowthRate.FAST, "Water 1", "Water 2", 50, 40, 0 ],
  [ Species.JOLTIK, "Joltik", 5, 0, 0, 0, "Attaching Pokémon", Type.BUG, Type.ELECTRIC, 0.1, 0.6, "Compound Eyes", "Unnerve", "Swarm", 319, 50, 47, 50, 57, 50, 65, 190, 70, 64, GrowthRate.MEDIUM_FAST, "Bug", null, 50, 20, 0 ],
  [ Species.GALVANTULA, "Galvantula", 5, 0, 0, 0, "EleSpider Pokémon", Type.BUG, Type.ELECTRIC, 0.8, 14.3, "Compound Eyes", "Unnerve", "Swarm", 472, 70, 77, 60, 97, 60, 108, 75, 70, 165, GrowthRate.MEDIUM_FAST, "Bug", null, 50, 20, 0 ],
  [ Species.FERROSEED, "Ferroseed", 5, 0, 0, 0, "Thorn Seed Pokémon", Type.GRASS, Type.STEEL, 0.6, 18.8, "Iron Barbs", null, "Anticipation", 305, 44, 50, 91, 24, 86, 10, 255, 70, 61, GrowthRate.MEDIUM_FAST, "Grass", "Mineral", 50, 20, 0 ],
  [ Species.FERROTHORN, "Ferrothorn", 5, 0, 0, 0, "Thorn Pod Pokémon", Type.GRASS, Type.STEEL, 1, 110, "Iron Barbs", null, "Anticipation", 489, 74, 94, 131, 54, 116, 20, 90, 70, 171, GrowthRate.MEDIUM_FAST, "Grass", "Mineral", 50, 20, 0 ],
  [ Species.KLINK, "Klink", 5, 0, 0, 0, "Gear Pokémon", Type.STEEL, -1, 0.3, 21, "Plus", "Minus", "Clear Body", 300, 40, 55, 70, 45, 60, 30, 130, 70, 60, GrowthRate.MEDIUM_SLOW, "Mineral", null, null, 20, 0 ],
  [ Species.KLANG, "Klang", 5, 0, 0, 0, "Gear Pokémon", Type.STEEL, -1, 0.6, 51, "Plus", "Minus", "Clear Body", 440, 60, 80, 95, 70, 85, 50, 60, 70, 154, GrowthRate.MEDIUM_SLOW, "Mineral", null, null, 20, 0 ],
  [ Species.KLINKLANG, "Klinklang", 5, 0, 0, 0, "Gear Pokémon", Type.STEEL, -1, 0.6, 81, "Plus", "Minus", "Clear Body", 520, 60, 100, 115, 70, 85, 90, 30, 70, 234, GrowthRate.MEDIUM_SLOW, "Mineral", null, null, 20, 0 ],
  [ Species.TYNAMO, "Tynamo", 5, 0, 0, 0, "EleFish Pokémon", Type.ELECTRIC, -1, 0.2, 0.3, "Levitate", null, null, 275, 35, 55, 40, 45, 40, 60, 190, 70, 55, GrowthRate.SLOW, "Amorphous", null, 50, 20, 0 ],
  [ Species.EELEKTRIK, "Eelektrik", 5, 0, 0, 0, "EleFish Pokémon", Type.ELECTRIC, -1, 1.2, 22, "Levitate", null, null, 405, 65, 85, 70, 75, 70, 40, 60, 70, 142, GrowthRate.SLOW, "Amorphous", null, 50, 20, 0 ],
  [ Species.EELEKTROSS, "Eelektross", 5, 0, 0, 0, "EleFish Pokémon", Type.ELECTRIC, -1, 2.1, 80.5, "Levitate", null, null, 515, 85, 115, 80, 105, 80, 50, 30, 70, 232, GrowthRate.SLOW, "Amorphous", null, 50, 20, 0 ],
  [ Species.ELGYEM, "Elgyem", 5, 0, 0, 0, "Cerebral Pokémon", Type.PSYCHIC, -1, 0.5, 9, "Telepathy", "Synchronize", "Analytic", 335, 55, 55, 55, 85, 55, 30, 255, 70, 67, GrowthRate.MEDIUM_FAST, "Human-Like", null, 50, 20, 0 ],
  [ Species.BEHEEYEM, "Beheeyem", 5, 0, 0, 0, "Cerebral Pokémon", Type.PSYCHIC, -1, 1, 34.5, "Telepathy", "Synchronize", "Analytic", 485, 75, 75, 75, 125, 95, 40, 90, 70, 170, GrowthRate.MEDIUM_FAST, "Human-Like", null, 50, 20, 0 ],
  [ Species.LITWICK, "Litwick", 5, 0, 0, 0, "Candle Pokémon", Type.GHOST, Type.FIRE, 0.3, 3.1, "Flash Fire", "Flame Body", "Infiltrator", 275, 50, 30, 55, 65, 55, 20, 190, 70, 55, GrowthRate.MEDIUM_SLOW, "Amorphous", null, 50, 20, 0 ],
  [ Species.LAMPENT, "Lampent", 5, 0, 0, 0, "Lamp Pokémon", Type.GHOST, Type.FIRE, 0.6, 13, "Flash Fire", "Flame Body", "Infiltrator", 370, 60, 40, 60, 95, 60, 55, 90, 70, 130, GrowthRate.MEDIUM_SLOW, "Amorphous", null, 50, 20, 0 ],
  [ Species.CHANDELURE, "Chandelure", 5, 0, 0, 0, "Luring Pokémon", Type.GHOST, Type.FIRE, 1, 34.3, "Flash Fire", "Flame Body", "Infiltrator", 520, 60, 55, 90, 145, 90, 80, 45, 70, 234, GrowthRate.MEDIUM_SLOW, "Amorphous", null, 50, 20, 0 ],
  [ Species.AXEW, "Axew", 5, 0, 0, 0, "Tusk Pokémon", Type.DRAGON, -1, 0.6, 18, "Rivalry", "Mold Breaker", "Unnerve", 320, 46, 87, 60, 30, 40, 57, 75, 35, 64, GrowthRate.SLOW, "Dragon", "Monster", 50, 40, 0 ],
  [ Species.FRAXURE, "Fraxure", 5, 0, 0, 0, "Axe Jaw Pokémon", Type.DRAGON, -1, 1, 36, "Rivalry", "Mold Breaker", "Unnerve", 410, 66, 117, 70, 40, 50, 67, 60, 35, 144, GrowthRate.SLOW, "Dragon", "Monster", 50, 40, 0 ],
  [ Species.HAXORUS, "Haxorus", 5, 0, 0, 0, "Axe Jaw Pokémon", Type.DRAGON, -1, 1.8, 105.5, "Rivalry", "Mold Breaker", "Unnerve", 540, 76, 147, 90, 60, 70, 97, 45, 35, 243, GrowthRate.SLOW, "Dragon", "Monster", 50, 40, 0 ],
  [ Species.CUBCHOO, "Cubchoo", 5, 0, 0, 0, "Chill Pokémon", Type.ICE, -1, 0.5, 8.5, "Snow Cloak", "Slush Rush", "Rattled", 305, 55, 70, 40, 60, 40, 40, 120, 70, 61, GrowthRate.MEDIUM_FAST, "Field", null, 50, 20, 0 ],
  [ Species.BEARTIC, "Beartic", 5, 0, 0, 0, "Freezing Pokémon", Type.ICE, -1, 2.6, 260, "Snow Cloak", "Slush Rush", "Swift Swim", 505, 95, 130, 80, 70, 80, 50, 60, 70, 177, GrowthRate.MEDIUM_FAST, "Field", null, 50, 20, 0 ],
  [ Species.CRYOGONAL, "Cryogonal", 5, 0, 0, 0, "Crystallizing Pokémon", Type.ICE, -1, 1.1, 148, "Levitate", null, null, 515, 80, 50, 50, 95, 135, 105, 25, 70, 180, GrowthRate.MEDIUM_FAST, "Mineral", null, null, 25, 0 ],
  [ Species.SHELMET, "Shelmet", 5, 0, 0, 0, "Snail Pokémon", Type.BUG, -1, 0.4, 7.7, "Hydration", "Shell Armor", "Overcoat", 305, 50, 40, 85, 40, 65, 25, 200, 70, 61, GrowthRate.MEDIUM_FAST, "Bug", null, 50, 15, 0 ],
  [ Species.ACCELGOR, "Accelgor", 5, 0, 0, 0, "Shell Out Pokémon", Type.BUG, -1, 0.8, 25.3, "Hydration", "Sticky Hold", "Unburden", 495, 80, 70, 40, 100, 60, 145, 75, 70, 173, GrowthRate.MEDIUM_FAST, "Bug", null, 50, 15, 0 ],
  [ Species.STUNFISK, "Stunfisk", 5, 0, 0, 0, "Trap Pokémon", Type.GROUND, Type.ELECTRIC, 0.7, 11, "Static", "Limber", "Sand Veil", 471, 109, 66, 84, 81, 99, 32, 75, 70, 165, GrowthRate.MEDIUM_FAST, "Amorphous", "Water 1", 50, 20, 0 ],
  [ Species.MIENFOO, "Mienfoo", 5, 0, 0, 0, "Martial Arts Pokémon", Type.FIGHTING, -1, 0.9, 20, "Inner Focus", "Regenerator", "Reckless", 350, 45, 85, 50, 55, 50, 65, 180, 70, 70, GrowthRate.MEDIUM_SLOW, "Field", "Human-Like", 50, 25, 0 ],
  [ Species.MIENSHAO, "Mienshao", 5, 0, 0, 0, "Martial Arts Pokémon", Type.FIGHTING, -1, 1.4, 35.5, "Inner Focus", "Regenerator", "Reckless", 510, 65, 125, 60, 95, 60, 105, 45, 70, 179, GrowthRate.MEDIUM_SLOW, "Field", "Human-Like", 50, 25, 0 ],
  [ Species.DRUDDIGON, "Druddigon", 5, 0, 0, 0, "Cave Pokémon", Type.DRAGON, -1, 1.6, 139, "Rough Skin", "Sheer Force", "Mold Breaker", 485, 77, 120, 90, 60, 90, 48, 45, 70, 170, GrowthRate.MEDIUM_FAST, "Dragon", "Monster", 50, 30, 0 ],
  [ Species.GOLETT, "Golett", 5, 0, 0, 0, "Automaton Pokémon", Type.GROUND, Type.GHOST, 1, 92, "Iron Fist", "Klutz", "No Guard", 303, 59, 74, 50, 35, 50, 35, 190, 70, 61, GrowthRate.MEDIUM_FAST, "Mineral", null, null, 25, 0 ],
  [ Species.GOLURK, "Golurk", 5, 0, 0, 0, "Automaton Pokémon", Type.GROUND, Type.GHOST, 2.8, 330, "Iron Fist", "Klutz", "No Guard", 483, 89, 124, 80, 55, 80, 55, 90, 70, 169, GrowthRate.MEDIUM_FAST, "Mineral", null, null, 25, 0 ],
  [ Species.PAWNIARD, "Pawniard", 5, 0, 0, 0, "Sharp Blade Pokémon", Type.DARK, Type.STEEL, 0.5, 10.2, "Defiant", "Inner Focus", "Pressure", 340, 45, 85, 70, 40, 40, 60, 120, 35, 68, GrowthRate.MEDIUM_FAST, "Human-Like", null, 50, 20, 0 ],
  [ Species.BISHARP, "Bisharp", 5, 0, 0, 0, "Sword Blade Pokémon", Type.DARK, Type.STEEL, 1.6, 70, "Defiant", "Inner Focus", "Pressure", 490, 65, 125, 100, 60, 70, 70, 45, 35, 172, GrowthRate.MEDIUM_FAST, "Human-Like", null, 50, 20, 0 ],
  [ Species.BOUFFALANT, "Bouffalant", 5, 0, 0, 0, "Bash Buffalo Pokémon", Type.NORMAL, -1, 1.6, 94.6, "Reckless", "Sap Sipper", "Soundproof", 490, 95, 110, 95, 40, 95, 55, 45, 70, 172, GrowthRate.MEDIUM_FAST, "Field", null, 50, 20, 0 ],
  [ Species.RUFFLET, "Rufflet", 5, 0, 0, 0, "Eaglet Pokémon", Type.NORMAL, Type.FLYING, 0.5, 10.5, "Keen Eye", "Sheer Force", "Hustle", 350, 70, 83, 50, 37, 50, 60, 190, 70, 70, GrowthRate.SLOW, "Flying", null, 100, 20, 0 ],
  [ Species.BRAVIARY, "Braviary", 5, 0, 0, 0, "Valiant Pokémon", Type.NORMAL, Type.FLYING, 1.5, 41, "Keen Eye", "Sheer Force", "Defiant", 510, 100, 123, 75, 57, 75, 80, 60, 70, 179, GrowthRate.SLOW, "Flying", null, 100, 20, 0 ],
  [ Species.VULLABY, "Vullaby", 5, 0, 0, 0, "Diapered Pokémon", Type.DARK, Type.FLYING, 0.5, 9, "Big Pecks", "Overcoat", "Weak Armor", 370, 70, 55, 75, 45, 65, 60, 190, 35, 74, GrowthRate.SLOW, "Flying", null, 0, 20, 0 ],
  [ Species.MANDIBUZZ, "Mandibuzz", 5, 0, 0, 0, "Bone Vulture Pokémon", Type.DARK, Type.FLYING, 1.2, 39.5, "Big Pecks", "Overcoat", "Weak Armor", 510, 110, 65, 105, 55, 95, 80, 60, 35, 179, GrowthRate.SLOW, "Flying", null, 0, 20, 0 ],
  [ Species.HEATMOR, "Heatmor", 5, 0, 0, 0, "Anteater Pokémon", Type.FIRE, -1, 1.4, 58, "Gluttony", "Flash Fire", "White Smoke", 484, 85, 97, 66, 105, 66, 65, 90, 70, 169, GrowthRate.MEDIUM_FAST, "Field", null, 50, 20, 0 ],
  [ Species.DURANT, "Durant", 5, 0, 0, 0, "Iron Ant Pokémon", Type.BUG, Type.STEEL, 0.3, 33, "Swarm", "Hustle", "Truant", 484, 58, 109, 112, 48, 48, 109, 90, 70, 169, GrowthRate.MEDIUM_FAST, "Bug", null, 50, 20, 0 ],
  [ Species.DEINO, "Deino", 5, 0, 0, 0, "Irate Pokémon", Type.DARK, Type.DRAGON, 0.8, 17.3, "Hustle", null, null, 300, 52, 65, 50, 45, 50, 38, 45, 35, 60, GrowthRate.SLOW, "Dragon", null, 50, 40, 0 ],
  [ Species.ZWEILOUS, "Zweilous", 5, 0, 0, 0, "Hostile Pokémon", Type.DARK, Type.DRAGON, 1.4, 50, "Hustle", null, null, 420, 72, 85, 70, 65, 70, 58, 45, 35, 147, GrowthRate.SLOW, "Dragon", null, 50, 40, 0 ],
  [ Species.HYDREIGON, "Hydreigon", 5, 0, 0, 0, "Brutal Pokémon", Type.DARK, Type.DRAGON, 1.8, 160, "Levitate", null, null, 600, 92, 105, 90, 125, 90, 98, 45, 35, 270, GrowthRate.SLOW, "Dragon", null, 50, 40, 0 ],
  [ Species.LARVESTA, "Larvesta", 5, 0, 0, 0, "Torch Pokémon", Type.BUG, Type.FIRE, 1.1, 28.8, "Flame Body", null, "Swarm", 360, 55, 85, 55, 50, 55, 60, 45, 70, 72, GrowthRate.SLOW, "Bug", null, 50, 40, 0 ],
  [ Species.VOLCARONA, "Volcarona", 5, 0, 0, 0, "Sun Pokémon", Type.BUG, Type.FIRE, 1.6, 46, "Flame Body", null, "Swarm", 550, 85, 60, 65, 135, 105, 100, 15, 70, 248, GrowthRate.SLOW, "Bug", null, 50, 40, 0 ],
  [ Species.COBALION, "Cobalion", 5, 1, 0, 0, "Iron Will Pokémon", Type.STEEL, Type.FIGHTING, 2.1, 250, "Justified", null, null, 580, 91, 90, 129, 90, 72, 108, 3, 35, 261, GrowthRate.SLOW, "Undiscovered", null, null, 80, 0 ],
  [ Species.TERRAKION, "Terrakion", 5, 1, 0, 0, "Cavern Pokémon", Type.ROCK, Type.FIGHTING, 1.9, 260, "Justified", null, null, 580, 91, 129, 90, 72, 90, 108, 3, 35, 261, GrowthRate.SLOW, "Undiscovered", null, null, 80, 0 ],
  [ Species.VIRIZION, "Virizion", 5, 1, 0, 0, "Grassland Pokémon", Type.GRASS, Type.FIGHTING, 2, 200, "Justified", null, null, 580, 91, 90, 72, 90, 129, 108, 3, 35, 261, GrowthRate.SLOW, "Undiscovered", null, null, 80, 0 ],
  [ Species.TORNADUS, "Tornadus", 5, 1, 0, 0, "Cyclone Pokémon", Type.FLYING, -1, 1.5, 63, "Prankster", null, "Defiant", 580, 79, 115, 70, 125, 80, 111, 3, 90, 261, GrowthRate.SLOW, "Undiscovered", null, 100, 120, 0,
    [
      [ "Incarnate Forme", 5, 1, 0, 0, "Cyclone Pokémon", Type.FLYING, -1, 1.5, 63, "Prankster", null, "Defiant", 580, 79, 115, 70, 125, 80, 111, 3, 90, 261, GrowthRate.SLOW, "Undiscovered", null, 100, 120, 0 ],
      [ "Therian Forme", 5, 1, 0, 0, "Cyclone Pokémon", Type.FLYING, -1, 1.4, 63, "Regenerator", null, null, 580, 79, 100, 80, 110, 90, 121, 3, 90, 261, GrowthRate.SLOW, "Undiscovered", null, 100, 120, 0 ]
    ]
  ],
  [ Species.THUNDURUS, "Thundurus", 5, 1, 0, 0, "Bolt Strike Pokémon", Type.ELECTRIC, Type.FLYING, 1.5, 61, "Prankster", null, "Defiant", 580, 79, 115, 70, 125, 80, 111, 3, 90, 261, GrowthRate.SLOW, "Undiscovered", null, 100, 120, 0,
    [
      [ "Incarnate Forme", 5, 1, 0, 0, "Bolt Strike Pokémon", Type.ELECTRIC, Type.FLYING, 1.5, 61, "Prankster", null, "Defiant", 580, 79, 115, 70, 125, 80, 111, 3, 90, 261, GrowthRate.SLOW, "Undiscovered", null, 100, 120, 0 ],
      [ "Therian Forme", 5, 1, 0, 0, "Bolt Strike Pokémon", Type.ELECTRIC, Type.FLYING, 3, 61, "Volt Absorb", null, null, 580, 79, 105, 70, 145, 80, 101, 3, 90, 261, GrowthRate.SLOW, "Undiscovered", null, 100, 120, 0 ]
    ]
  ],
  [ Species.RESHIRAM, "Reshiram", 5, 0, 1, 0, "Vast White Pokémon", Type.DRAGON, Type.FIRE, 3.2, 330, "Turboblaze", null, null, 680, 100, 120, 100, 150, 120, 90, 3, 0, 306, GrowthRate.SLOW, "Undiscovered", null, null, 120, 0 ],
  [ Species.ZEKROM, "Zekrom", 5, 0, 1, 0, "Deep Black Pokémon", Type.DRAGON, Type.ELECTRIC, 2.9, 345, "Teravolt", null, null, 680, 100, 150, 120, 120, 100, 90, 3, 0, 306, GrowthRate.SLOW, "Undiscovered", null, null, 120, 0 ],
  [ Species.LANDORUS, "Landorus", 5, 1, 0, 0, "Abundance Pokémon", Type.GROUND, Type.FLYING, 1.5, 68, "Sand Force", null, "Sheer Force", 600, 89, 125, 90, 115, 80, 101, 3, 90, 270, GrowthRate.SLOW, "Undiscovered", null, 100, 120, 0,
    [
      [ "Incarnate Forme", 5, 1, 0, 0, "Abundance Pokémon", Type.GROUND, Type.FLYING, 1.5, 68, "Sand Force", null, "Sheer Force", 600, 89, 125, 90, 115, 80, 101, 3, 90, 270, GrowthRate.SLOW, "Undiscovered", null, 100, 120, 0 ],
      [ "Therian Forme", 5, 1, 0, 0, "Abundance Pokémon", Type.GROUND, Type.FLYING, 1.3, 68, "Intimidate", null, null, 600, 89, 145, 90, 105, 80, 91, 3, 90, 270, GrowthRate.SLOW, "Undiscovered", null, 100, 120, 0 ]
    ]
  ],
  [ Species.KYUREM, "Kyurem", 5, 0, 1, 0, "Boundary Pokémon", Type.DRAGON, Type.ICE, 3, 325, "Pressure", null, null, 660, 125, 130, 90, 130, 90, 95, 3, 0, 297, GrowthRate.SLOW, "Undiscovered", null, null, 120, 0,
    [
      [ "Normal", 5, 0, 1, 0, "Boundary Pokémon", Type.DRAGON, Type.ICE, 3, 325, "Pressure", null, null, 660, 125, 130, 90, 130, 90, 95, 3, 0, 297, GrowthRate.SLOW, "Undiscovered", null, null, 120, 0 ],
      [ "Black", 5, 0, 1, 0, "Boundary Pokémon", Type.DRAGON, Type.ICE, 3.3, 325, "Teravolt", null, null, 700, 125, 170, 100, 120, 90, 95, 3, 0, 315, GrowthRate.SLOW, "Undiscovered", null, null, 120, 0 ],
      [ "White", 5, 0, 1, 0, "Boundary Pokémon", Type.DRAGON, Type.ICE, 3.6, 325, "Turboblaze", null, null, 700, 125, 120, 90, 170, 100, 95, 3, 0, 315, GrowthRate.SLOW, "Undiscovered", null, null, 120, 0 ]
    ]
  ],
  [ Species.KELDEO, "Keldeo", 5, 0, 0, 1, "Colt Pokémon", Type.WATER, Type.FIGHTING, 1.4, 48.5, "Justified", null, null, 580, 91, 72, 90, 129, 90, 108, 3, 35, 261, GrowthRate.SLOW, "Undiscovered", null, null, 80, 0,
    [
      [ "Ordinary Forme", 5, 0, 0, 1, "Colt Pokémon", Type.WATER, Type.FIGHTING, 1.4, 48.5, "Justified", null, null, 580, 91, 72, 90, 129, 90, 108, 3, 35, 261, GrowthRate.SLOW, "Undiscovered", null, null, 80, 0 ],
      [ "Resolute Forme", 5, 0, 0, 1, "Colt Pokémon", Type.WATER, Type.FIGHTING, 1.4, 48.5, "Justified", null, null, 580, 91, 72, 90, 129, 90, 108, 3, 35, 261, GrowthRate.SLOW, "Undiscovered", null, null, 80, 0 ]
    ]
  ],
  [ Species.MELOETTA, "Meloetta", 5, 0, 0, 1, "Melody Pokémon", Type.NORMAL, Type.PSYCHIC, 0.6, 6.5, "Serene Grace", null, null, 600, 100, 77, 77, 128, 128, 90, 3, 100, 270, GrowthRate.SLOW, "Undiscovered", null, null, 120, 0,
    [
      [ "Aria Forme", 5, 0, 0, 1, "Melody Pokémon", Type.NORMAL, Type.PSYCHIC, 0.6, 6.5, "Serene Grace", null, null, 600, 100, 77, 77, 128, 128, 90, 3, 100, 270, GrowthRate.SLOW, "Undiscovered", null, null, 120, 0 ],
      [ "Pirouette Forme", 5, 0, 0, 1, "Melody Pokémon", Type.NORMAL, Type.FIGHTING, 0.6, 6.5, "Serene Grace", null, null, 600, 100, 128, 90, 77, 77, 128, 3, 100, 270, GrowthRate.SLOW, "Undiscovered", null, null, 120, 0 ]
    ]
  ],
  [ Species.GENESECT, "Genesect", 5, 0, 0, 1, "Paleozoic Pokémon", Type.BUG, Type.STEEL, 1.5, 82.5, "Download", null, null, 600, 71, 120, 95, 120, 95, 99, 3, 0, 270, GrowthRate.SLOW, "Undiscovered", null, null, 120, 0 ],
  [ Species.XERNEAS, "Xerneas", 6, 0, 1, 0, "Life Pokémon", Type.FAIRY, -1, 3, 215, "Fairy Aura", null, null, 680, 126, 131, 95, 131, 98, 99, 45, 0, 306, GrowthRate.SLOW, "Undiscovered", null, null, 120, 0 ],
  [ Species.YVELTAL, "Yveltal", 6, 0, 1, 0, "Destruction Pokémon", Type.DARK, Type.FLYING, 5.8, 203, "Dark Aura", null, null, 680, 126, 131, 95, 131, 98, 99, 45, 0, 306, GrowthRate.SLOW, "Undiscovered", null, null, 120, 0 ]
].map(p => {
  let i = 0;
  return new PokemonSpecies(p[i++], p[i++], p[i++], p[i++], p[i++], p[i++], p[i++], p[i++], p[i++], p[i++], p[i++], p[i++], p[i++], p[i++], p[i++], p[i++], p[i++], p[i++], p[i++], p[i++], p[i++], p[i++], p[i++], p[i++], p[i++], p[i++], p[i++], p[i++], p[i++], p[i++]);
});

console.log(
  Species[getPokemonSpecies(Species.PICHU).getSpeciesForLevel(5)],
  Species[getPokemonSpecies(Species.PICHU).getSpeciesForLevel(20)],
  Species[getPokemonSpecies(Species.PICHU).getSpeciesForLevel(50)],
  Species[getPokemonSpecies(Species.EXEGGUTOR).getSpeciesForLevel(5)],
  Species[getPokemonSpecies(Species.EXEGGUTOR).getSpeciesForLevel(20)],
  Species[getPokemonSpecies(Species.EXEGGUTOR).getSpeciesForLevel(50)]
);