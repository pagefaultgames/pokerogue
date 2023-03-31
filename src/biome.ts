import BattleScene from "./battle-scene";
import { default as PokemonSpecies, allSpecies, getPokemonSpecies } from "./pokemon-species";
import { Stat } from "./pokemon-stat";
import { Species } from "./species";
import { Type } from './type';
import * as Utils from './utils';

export enum Biome {
  PLAINS,
  GRASS,
  FOREST,
  WATER,
  SWAMP,
  SEA,
  MOUNTAIN,
  LAND,
  CAVE,
  DESERT,
  ICE_CAVE,
  MEADOW,
  POWER_PLANT,
  VOLCANO,
  GRAVEYARD,
  DOJO,
  RUINS,
  WASTELAND,
  ABYSS,
  SPACE
};

enum PoolTier {
  COMMON,
  UNCOMMON,
  RARE,
  SUPER_RARE,
  ULTRA_RARE,
  BOSS,
  BOSS_RARE,
  BOSS_ULTRA_RARE,
  BOSS_LEGENDARY
};

export class BiomeArena {
  private scene: BattleScene;
  public biomeType: integer;
  private bgm: string;

  private pokemonPool: PokemonSpecies[][];

  constructor(scene: BattleScene, biome: integer, bgm: string) {
    this.scene = scene;
    this.biomeType = biome;
    this.bgm = bgm;

    if (biomePools.hasOwnProperty(biome))
      this.pokemonPool = biomePools[biome];
    else {
      const predicate = biomePoolPredicates[biome] || (() => {});
      this.pokemonPool =  Utils.getEnumValues(PoolTier).map(t => allSpecies.filter(p => predicate(p, t)));
    }
  }

  randomSpecies(waveIndex: integer): PokemonSpecies {
    const tierValue = Utils.randInt(512);
    const tier = tierValue >= 156 ? PoolTier.COMMON : tierValue >= 32 ? PoolTier.UNCOMMON : tierValue >= 6 ? PoolTier.RARE : tierValue >= 1 ? PoolTier.SUPER_RARE : PoolTier.ULTRA_RARE;
    const tierPool = this.pokemonPool[tier];
    let ret: PokemonSpecies;
    if (!tierPool.length)
      ret = this.scene.randomSpecies();
    else {
      const species = tierPool[Utils.randInt(tierPool.length)];
      ret = species instanceof PokemonSpecies ? species : getPokemonSpecies(species);
    }
    const newSpeciesId = ret.getSpeciesForLevel(5);
    if (newSpeciesId !== ret.speciesId) {
      console.log('Replaced', Species[ret.speciesId], 'with', Species[newSpeciesId]);
      ret = getPokemonSpecies(newSpeciesId);
    }
    return ret;
  }

  playBgm() {
    this.scene.loadBgm(this.bgm);
    this.scene.load.once(Phaser.Loader.Events.COMPLETE, () => this.scene.playBgm(this.bgm));
  }
}

const biomePools = {
  [Biome.PLAINS]: {
    [PoolTier.COMMON]: [
      Species.CATERPIE, Species.METAPOD, Species.WEEDLE, Species.KAKUNA, Species.PIDGEY, Species.RATTATA, Species.SPEAROW, Species.SENTRET, Species.HOOTHOOT, Species.LEDYBA,
      Species.HOPPIP, Species.SUNKERN, Species.POOCHYENA, Species.ZIGZAGOON, Species.WURMPLE, Species.SILCOON, Species.CASCOON, Species.TAILLOW, Species.STARLY, Species.BIDOOF,
      Species.KRICKETOT, Species.PATRAT, Species.LILLIPUP, Species.PIDOVE, Species.COTTONEE, Species.PETILIL, Species.MINCCINO, Species.FOONGUS
    ],
    [PoolTier.UNCOMMON]: [
      Species.EKANS, Species.NIDORAN_F, Species.NIDORAN_M, Species.ODDISH, Species.PARAS, Species.VENONAT, Species.MEOWTH, Species.BELLSPROUT, Species.PICHU, Species.IGGLYBUFF,
      Species.LOTAD, Species.SEEDOT, Species.SHROOMISH, Species.NINCADA, Species.AZURILL, Species.WHISMUR, Species.SKITTY, Species.BUDEW, Species.COMBEE, Species.CHERUBI,
      Species.VENIPEDE
    ],
    [PoolTier.RARE]: [ Species.ABRA, Species.CLEFFA, Species.WOOPER, Species.RALTS, Species.SURSKIT, Species.SLAKOTH, Species.DUCKLETT ],
    [PoolTier.SUPER_RARE]: [ Species.EEVEE, Species.TOGEPI, Species.SMEARGLE, Species.TYROGUE, Species.WYNAUT ],
    [PoolTier.ULTRA_RARE]: [ Species.DITTO ] 
  }
};

const biomePoolPredicates = {
  [Biome.PLAINS]: (p, t) => {
    if (p.isOfType(Type.GHOST) || p.isOfType(Type.STEEL) || p.isOfType(Type.ICE) || p.isOfType(Type.DRAGON))
      return false;
    for (let s in p.baseStats) {
      let threshold: integer;
      const stat = parseInt(s);
      switch (stat) {
          case Stat.HP:
            threshold = 70;
            break;
          default:
            threshold = 60;
            break;
      }
      if (p.baseStats[s] > threshold) {
        if (p.baseTotal <= 300 && p.baseExp <= 75 && (p.isOfType(Type.NORMAL) || p.isOfType(Type.BUG) || p.isOfType(Type.GRASS)))
          return true;
        return false;
      }
    }
    return p.baseTotal <= 320 && p.baseExp <= 75;
  },
  [Biome.GRASS]: (p, t) => {
    switch (t) {
      case PoolTier.SUPER_RARE:
        return [ Species.ENTEI, Species.SUICUNE, Species.RAIKOU, Species.LATIOS, Species.LATIAS ].map(s => getPokemonSpecies(s));
      case PoolTier.ULTRA_RARE:
        return [ Species.MEW ].map(s => getPokemonSpecies(s));
    }
    return p.isOfType(Type.NORMAL) || p.isOfType(Type.FAIRY) || p.isOfType(Type.GRASS) || p.isOfType(Type.BUG) || p.isOfType(Type.ELECTRIC);
  },
  [Biome.FOREST]: (p, t) => {
    switch (t) {
      case PoolTier.ULTRA_RARE:
        return getPokemonSpecies(Species.CELEBI);
    }
    return p.isOfType(Type.GRASS) || p.isOfType(Type.BUG) || p.isOfType(Type.POISON);
  },
  [Biome.WATER]: (p, t) => {
    switch (t) {
      case PoolTier.SUPER_RARE:
        return [ Species.UXIE, Species.MESPRIT, Species.AZELF ].map(s => getPokemonSpecies(s));
    }
    return p.isOfType(Type.WATER)
  },
  [Biome.SWAMP]: (p, t) => {
    return p.isOfType(Type.GRASS) || p.isOfType(Type.WATER) || p.isOfType(Type.POISON);
  },
  [Biome.SEA]: (p, t) => {
    switch (t) {
      case PoolTier.SUPER_RARE:
        return [ Species.KYOGRE ].map(s => getPokemonSpecies(s));
      case PoolTier.ULTRA_RARE:
        return [ Species.LUGIA ].map(s => getPokemonSpecies(s)); 
    }
    return p.isOfType(Type.WATER);
  },
  [Biome.MOUNTAIN]: (p, t) => {
    switch (t) {
      case PoolTier.SUPER_RARE:
        return [ Species.ARTICUNO, Species.ZAPDOS, Species.MOLTRES ].map(s => getPokemonSpecies(s));
        break;
      case PoolTier.ULTRA_RARE:
        return [ Species.HO_OH, Species.RAYQUAZA ].map(s => getPokemonSpecies(s));
    }
    return p.isOfType(Type.FLYING) || p.isOfType(Type.GROUND) || p.isOfType(Type.ROCK) || p.isOfType(Type.ELECTRIC) || p.isOfType(Type.STEEL);
  },
  [Biome.LAND]: (p, t) => {
    switch (t) {
      case PoolTier.SUPER_RARE:
        return [ Species.GROUDON ].map(s => getPokemonSpecies(s));
    }
    return p.isOfType(Type.GROUND);
  },
  [Biome.CAVE]: (p, t) => {
    switch (t) {
      case PoolTier.SUPER_RARE:
        return [ Species.REGIROCK, Species.REGICE, Species.REGISTEEL ].map(s => getPokemonSpecies(s));
      case PoolTier.ULTRA_RARE:
        return [ Species.MEWTWO, Species.REGIGIGAS ].map(s => getPokemonSpecies(s));
    }
    return p.isOfType(Type.ROCK);
  },
  [Biome.DESERT]: (p, t) => {
    return p.isOfType(Type.GROUND) || p.isOfType(Type.ROCK);
  },
  [Biome.ICE_CAVE]: (p, t) => {
    return p.isOfType(Type.ICE);
  },
  [Biome.MEADOW]: (p, t) => {
    return p.isOfType(Type.FAIRY);
  },
  [Biome.POWER_PLANT]: (p, t) => {
    return p.isOfType(Type.ELECTRIC);
  },
  [Biome.VOLCANO]: (p, t) => {
    return p.isOfType(Type.FIRE);
  },
  [Biome.GRAVEYARD]: (p, t) => {
    return p.isOfType(Type.GHOST);
  },
  [Biome.DOJO]: (p, t) => {
    return p.isOfType(Type.FIGHTING);
  },
  [Biome.RUINS]: (p, t) => {
    return p.isOfType(Type.PSYCHIC);
  },
  [Biome.WASTELAND]: (p, t) => {
    return p.isOfType(Type.DRAGON);
  },
  [Biome.ABYSS]: (p, t) => {
    return p.isOfType(Type.DARK);
  },
  [Biome.SPACE]: (p, t) => {
    return p.isOfType(Type.PSYCHIC);
  }
};

const pokemonBiomes = [
  [ Species.BULBASAUR, Type.GRASS, Type.POISON, [
      [ Biome.FOREST, PoolTier.RARE ]
    ]
  ],
  [ Species.IVYSAUR, Type.GRASS, Type.POISON, [
      [ Biome.FOREST, PoolTier.RARE ]
    ]
  ],
  [ Species.VENUSAUR, Type.GRASS, Type.POISON, [
      [ Biome.GRASS, PoolTier.RARE ],
      [ Biome.GRASS, PoolTier.BOSS_RARE ]
    ]
  ],
  [ Species.CHARMANDER, Type.FIRE, -1, [
      [ Biome.VOLCANO, PoolTier.RARE ]
    ]
  ],
  [ Species.CHARMELEON, Type.FIRE, -1, [
      [ Biome.VOLCANO, PoolTier.RARE ]
    ]
  ],
  [ Species.CHARIZARD, Type.FIRE, Type.FLYING, [
      [ Biome.VOLCANO, PoolTier.RARE ],
      [ Biome.VOLCANO, PoolTier.BOSS_RARE ]
    ]
  ],
  [ Species.SQUIRTLE, Type.WATER, -1, [
      [ Biome.WATER, PoolTier.RARE ]
    ]
  ],
  [ Species.WARTORTLE, Type.WATER, -1, [
      [ Biome.WATER, PoolTier.RARE ]
    ]
  ],
  [ Species.BLASTOISE, Type.WATER, -1, [
      [ Biome.WATER, PoolTier.RARE ],
      [ Biome.WATER, PoolTier.BOSS_RARE ]
    ]
  ],
  [ Species.CATERPIE, Type.BUG, -1, [
      [ Biome.PLAINS, PoolTier.COMMON ]
      [ Biome.FOREST, PoolTier.COMMON ]
    ]
  ],
  [ Species.METAPOD, Type.BUG, -1, [
      [ Biome.PLAINS, PoolTier.COMMON ]
      [ Biome.FOREST, PoolTier.COMMON ]
    ]
  ],
  [ Species.BUTTERFREE, Type.BUG, Type.FLYING, [
      [ Biome.FOREST, PoolTier.UNCOMMON ],
      [ Biome.FOREST, PoolTier.BOSS ]
    ]
  ],
  [ Species.WEEDLE, Type.BUG, Type.POISON, [
      [ Biome.PLAINS, PoolTier.COMMON ],
      [ Biome.FOREST, PoolTier.COMMON ]
    ]
  ],
  [ Species.KAKUNA, Type.BUG, Type.POISON, [
      [ Biome.PLAINS, PoolTier.COMMON ],
      [ Biome.FOREST, PoolTier.COMMON ]
    ]
  ],
  [ Species.BEEDRILL, Type.BUG, Type.POISON, [
      [ Biome.FOREST, PoolTier.UNCOMMON ],
      [ Biome.FOREST, PoolTier.BOSS ]
    ]
  ],
  [ Species.PIDGEY, Type.NORMAL, Type.FLYING, [
      [ Biome.PLAINS, PoolTier.COMMON ],
      [ Biome.GRASS, PoolTier.COMMON ],
      [ Biome.MOUNTAIN, PoolTier.COMMON ]
    ]
  ],
  [ Species.PIDGEOTTO, Type.NORMAL, Type.FLYING, [
      [ Biome.GRASS, PoolTier.COMMON ],
      [ Biome.MOUNTAIN, PoolTier.COMMON ]
    ]
  ],
  [ Species.PIDGEOT, Type.NORMAL, Type.FLYING, [
      [ Biome.GRASS, PoolTier.COMMON ],
      [ Biome.MOUNTAIN, PoolTier.COMMON ],
      [ Biome.MOUNTAIN, PoolTier.BOSS ]
    ]
  ],
  [ Species.RATTATA, Type.NORMAL, -1, [
      [ Biome.PLAINS, PoolTier.COMMON ],
      [ Biome.GRASS, PoolTier.COMMON ]
    ]
  ],
  [ Species.RATICATE, Type.NORMAL, -1, [
      [ Biome.GRASS, PoolTier.COMMON ]
    ]
  ],
  [ Species.SPEAROW, Type.NORMAL, Type.FLYING, [
      [ Biome.PLAINS, PoolTier.COMMON ],
      [ Biome.GRASS, PoolTier.COMMON ],
      [ Biome.MOUNTAIN, PoolTier.COMMON ]
    ]
  ],
  [ Species.FEAROW, Type.NORMAL, Type.FLYING, [
      [ Biome.GRASS, PoolTier.COMMON ],
      [ Biome.MOUNTAIN, PoolTier.COMMON ],
      [ Biome.MOUNTAIN, PoolTier.BOSS ]
    ]
  ],
  [ Species.EKANS, Type.POISON, -1, [
      [ Biome.PLAINS, PoolTier.UNCOMMON ],
      [ Biome.FOREST, PoolTier.UNCOMMON ],
      [ Biome.SWAMP, PoolTier.COMMON ]
    ]
  ],
  [ Species.ARBOK, Type.POISON, -1, [
      [ Biome.FOREST, PoolTier.UNCOMMON ],
      [ Biome.SWAMP, PoolTier.COMMON ],
      [ Biome.SWAMP, PoolTier.BOSS ]
    ]
  ],
  [ Species.PIKACHU, Type.ELECTRIC, -1, [
      [ Biome.GRASS, PoolTier.UNCOMMON ],
      [ Biome.POWER_PLANT, PoolTier.COMMON ]
    ]
  ],
  [ Species.RAICHU, Type.ELECTRIC, -1, [
      [ Biome.POWER_PLANT, PoolTier.BOSS ],
    ]
  ],
  [ Species.SANDSHREW, Type.GROUND, -1, [
      [ Biome.DESERT, PoolTier.COMMON ]
    ]
  ],
  [ Species.SANDSLASH, Type.GROUND, -1, [
      [ Biome.DESERT, PoolTier.COMMON ],
      [ Biome.DESERT, PoolTier.BOSS ]
    ]
  ],
  [ Species.NIDORAN_F, Type.POISON, -1, [
      [ Biome.PLAINS, PoolTier.UNCOMMON ],
      [ Biome.FOREST, PoolTier.COMMON ]
    ]
  ],
  [ Species.NIDORINA, Type.POISON, -1, [
      [ Biome.FOREST, PoolTier.COMMON ]
    ]
  ],
  [ Species.NIDOQUEEN, Type.POISON, Type.GROUND, [
      [ Biome.FOREST, PoolTier.BOSS ]
    ]
  ],
  [ Species.NIDORAN_M, Type.POISON, -1, [
      [ Biome.PLAINS, PoolTier.UNCOMMON ],
      [ Biome.FOREST, PoolTier.COMMON ]
    ]
  ],
  [ Species.NIDORINO, Type.POISON, -1, [
      [ Biome.FOREST, PoolTier.COMMON ]
    ]
  ],
  [ Species.NIDOKING, Type.POISON, Type.GROUND, [
      [ Biome.FOREST, PoolTier.BOSS ]
    ]
  ],
  [ Species.CLEFAIRY, Type.FAIRY, -1, [
      [ Biome.GRASS, PoolTier.RARE ],
      [ Biome.MEADOW, PoolTier.UNCOMMON ],
      [ Biome.SPACE, PoolTier.COMMON ]
    ]
  ],
  [ Species.CLEFABLE, Type.FAIRY, -1, [
      [ Biome.MEADOW, PoolTier.BOSS_RARE ],
      [ Biome.SPACE, PoolTier.BOSS ],
    ]
  ],
  [ Species.VULPIX, Type.FIRE, -1, [
      [ Biome.GRASS, PoolTier.RARE ],
      [ Biome.VOLCANO, PoolTier.COMMON ]
    ]
  ],
  [ Species.NINETALES, Type.FIRE, -1, [
      [ Biome.VOLCANO, PoolTier.BOSS ]
    ]
  ],
  [ Species.JIGGLYPUFF, Type.NORMAL, Type.FAIRY, [
      [ Biome.GRASS, PoolTier.UNCOMMON ],
      [ Biome.MEADOW, PoolTier.COMMON ]
    ]
  ],
  [ Species.WIGGLYTUFF, Type.NORMAL, Type.FAIRY, [
      [ Biome.GRASS, PoolTier.UNCOMMON ],
      [ Biome.MEADOW, PoolTier.COMMON ],
      [ Biome.MEADOW, PoolTier.BOSS ]
    ]
  ],
  [ Species.ZUBAT, Type.POISON, Type.FLYING, [
      [ Biome.CAVE, PoolTier.COMMON ]
    ]
  ],
  [ Species.GOLBAT, Type.POISON, Type.FLYING, [
      [ Biome.CAVE, PoolTier.COMMON ]
    ]
  ],
  [ Species.ODDISH, Type.GRASS, Type.POISON, [
      [ Biome.PLAINS, PoolTier.UNCOMMON ],
      [ Biome.GRASS, PoolTier.COMMON ],
      [ Biome.FOREST, PoolTier.COMMON ]
    ]
  ],
  [ Species.GLOOM, Type.GRASS, Type.POISON, [
      [ Biome.GRASS, PoolTier.COMMON ],
      [ Biome.FOREST, PoolTier.COMMON ]
    ]
  ],
  [ Species.VILEPLUME, Type.GRASS, Type.POISON, [
      [ Biome.GRASS, PoolTier.COMMON ],
      [ Biome.FOREST, PoolTier.COMMON ],
      [ Biome.FOREST, PoolTier.BOSS ]
    ]
  ],
  [ Species.PARAS, Type.BUG, Type.GRASS, [
      [ Biome.PLAINS, PoolTier.UNCOMMON ],
      [ Biome.FOREST, PoolTier.COMMON ]
    ]
  ],
  [ Species.PARASECT, Type.BUG, Type.GRASS, [
      [ Biome.FOREST, PoolTier.COMMON ],
      [ Biome.FOREST, PoolTier.BOSS ]
    ]
  ],
  [ Species.VENONAT, Type.BUG, Type.POISON, [
      [ Biome.PLAINS, PoolTier.UNCOMMON ],
      [ Biome.GRASS, PoolTier.UNCOMMON ],
      [ Biome.FOREST, PoolTier.COMMON ]
    ]
  ],
  [ Species.VENOMOTH, Type.BUG, Type.POISON, [
      [ Biome.GRASS, PoolTier.UNCOMMON ],
      [ Biome.FOREST, PoolTier.COMMON ],
      [ Biome.FOREST, PoolTier.BOSS ]
    ]
  ],
  [ Species.DIGLETT, Type.GROUND, -1, [
      [ Biome.LAND, PoolTier.COMMON ]
    ]
  ],
  [ Species.DUGTRIO, Type.GROUND, -1, [
      [ Biome.LAND, PoolTier.COMMON ],
      [ Biome.LAND, PoolTier.BOSS ]
    ]
  ],
  [ Species.MEOWTH, Type.NORMAL, -1, [
      [ Biome.PLAINS, PoolTier.UNCOMMON ],
      [ Biome.GRASS, PoolTier.COMMON ]
    ]
  ],
  [ Species.PERSIAN, Type.NORMAL, -1, [
      [ Biome.GRASS, PoolTier.COMMON ],
      [ Biome.GRASS, PoolTier.BOSS ]
    ]
  ],
  [ Species.PSYDUCK, Type.WATER, -1, [
      [ Biome.WATER, PoolTier.COMMON ]
    ]
  ],
  [ Species.GOLDUCK, Type.WATER, -1, [
      [ Biome.WATER, PoolTier.COMMON ],
      [ Biome.WATER, PoolTier.BOSS ]
    ]
  ],
  [ Species.MANKEY, Type.FIGHTING, -1, [
      [ Biome.GRASS, PoolTier.UNCOMMON ],
      [ Biome.DOJO, PoolTier.COMMON ]
    ]
  ],
  [ Species.PRIMEAPE, Type.FIGHTING, -1, [
      [ Biome.GRASS, PoolTier.UNCOMMON ],
      [ Biome.DOJO, PoolTier.COMMON ],
      [ Biome.DOJO, PoolTier.BOSS ]
    ]
  ],
  [ Species.GROWLITHE, Type.FIRE, -1, [
      [ Biome.GRASS, PoolTier.RARE ],
      [ Biome.VOLCANO, PoolTier.UNCOMMON ]
    ]
  ],
  [ Species.ARCANINE, Type.FIRE, -1, [
      [ Biome.VOLCANO, PoolTier.BOSS ]
    ]
  ],
  [ Species.POLIWAG, Type.WATER, -1, [
      [ Biome.WATER, PoolTier.COMMON ]
    ]
  ],
  [ Species.POLIWHIRL, Type.WATER, -1, [
      [ Biome.WATER, PoolTier.COMMON ]
    ]
  ],
  [ Species.POLIWRATH, Type.WATER, Type.FIGHTING, [
      [ Biome.WATER, PoolTier.BOSS ]
    ]
  ],
  [ Species.ABRA, Type.PSYCHIC, -1, [
      [ Biome.PLAINS, PoolTier.RARE ],
      [ Biome.GRASS, PoolTier.RARE ],
      [ Biome.RUINS, PoolTier.UNCOMMON ]
    ]
  ],
  [ Species.KADABRA, Type.PSYCHIC, -1, [
      [ Biome.GRASS, PoolTier.RARE ],
      [ Biome.RUINS, PoolTier.UNCOMMON ]
    ]
  ],
  [ Species.ALAKAZAM, Type.PSYCHIC, -1, [
      [ Biome.RUINS, PoolTier.BOSS ]
    ]
  ],
  [ Species.MACHOP, Type.FIGHTING, -1, [
      [ Biome.GRASS, PoolTier.RARE ],
      [ Biome.DOJO, PoolTier.COMMON ]
    ]
  ],
  [ Species.MACHOKE, Type.FIGHTING, -1, [
      [ Biome.GRASS, PoolTier.RARE ],
      [ Biome.DOJO, PoolTier.COMMON ]
    ]
  ],
  [ Species.MACHAMP, Type.FIGHTING, -1, [
      [ Biome.DOJO, PoolTier.BOSS ]
    ]
  ],
  [ Species.BELLSPROUT, Type.GRASS, Type.POISON, [
      [ Biome.PLAINS, PoolTier.UNCOMMON ],
      [ Biome.GRASS, PoolTier.COMMON ],
      [ Biome.FOREST, PoolTier.COMMON ]
    ]
  ],
  [ Species.WEEPINBELL, Type.GRASS, Type.POISON, [
      [ Biome.GRASS, PoolTier.COMMON ],
      [ Biome.FOREST, PoolTier.COMMON ]
    ]
  ],
  [ Species.VICTREEBEL, Type.GRASS, Type.POISON, [
      [ Biome.FOREST, PoolTier.BOSS ]
    ]
  ],
  [ Species.TENTACOOL, Type.WATER, Type.POISON, [
      [ Biome.WATER, PoolTier.UNCOMMON ],
      [ Biome.SEA, PoolTier.COMMON ]
    ]
  ],
  [ Species.TENTACRUEL, Type.WATER, Type.POISON, [
      [ Biome.WATER, PoolTier.UNCOMMON ],
      [ Biome.SEA, PoolTier.COMMON ],
      [ Biome.SEA, PoolTier.BOSS ]
    ]
  ],
  [ Species.GEODUDE, Type.ROCK, Type.GROUND, [
      [ Biome.MOUNTAIN, PoolTier.UNCOMMON ],
      [ Biome.LAND, PoolTier.COMMON ],
      [ Biome.CAVE, PoolTier.UNCOMMON ]
    ]
  ],
  [ Species.GRAVELER, Type.ROCK, Type.GROUND, [
      [ Biome.MOUNTAIN, PoolTier.UNCOMMON ],
      [ Biome.LAND, PoolTier.COMMON ],
      [ Biome.CAVE, PoolTier.UNCOMMON ]
    ]
  ],
  [ Species.GOLEM, Type.ROCK, Type.GROUND, [
      [ Biome.MOUNTAIN, PoolTier.BOSS ],
      [ Biome.LAND, PoolTier.BOSS ]
    ]
  ],
  [ Species.PONYTA, Type.FIRE, -1, [
      [ Biome.GRASS, PoolTier.UNCOMMON ]
      [ Biome.VOLCANO, PoolTier.COMMON ]
    ]
  ],
  [ Species.RAPIDASH, Type.FIRE, -1, [
      [ Biome.GRASS, PoolTier.UNCOMMON ]
      [ Biome.VOLCANO, PoolTier.COMMON ],
      [ Biome.VOLCANO, PoolTier.BOSS ]
    ]
  ],
  [ Species.SLOWPOKE, Type.WATER, Type.PSYCHIC, [
      [ Biome.WATER, PoolTier.UNCOMMON ]
    ]
  ],
  [ Species.SLOWBRO, Type.WATER, Type.PSYCHIC, [
      [ Biome.WATER, PoolTier.UNCOMMON ],
      [ Biome.WATER, PoolTier.BOSS ]
    ]
  ],
  [ Species.MAGNEMITE, Type.ELECTRIC, Type.STEEL, [
      [ Biome.POWER_PLANT, PoolTier.COMMON ]
    ]
  ],
  [ Species.MAGNETON, Type.ELECTRIC, Type.STEEL, [
      [ Biome.POWER_PLANT, PoolTier.COMMON ]
    ]
  ],
  [ Species.FARFETCHD, Type.NORMAL, Type.FLYING, [
      [ Biome.GRASS, PoolTier.SUPER_RARE ],
      [ Biome.GRASS, PoolTier.BOSS_RARE ]
    ]
  ],
  [ Species.DODUO, Type.NORMAL, Type.FLYING, [
      [ Biome.GRASS, PoolTier.COMMON ]
    ]
  ],
  [ Species.DODRIO, Type.NORMAL, Type.FLYING, [
      [ Biome.GRASS, PoolTier.COMMON ],
      [ Biome.GRASS, PoolTier.BOSS ]
    ]
  ],
  [ Species.SEEL, Type.WATER, -1, [
      [ Biome.ICE_CAVE, PoolTier.COMMON ]
    ]
  ],
  [ Species.DEWGONG, Type.WATER, Type.ICE, [
      [ Biome.ICE_CAVE, PoolTier.COMMON ],
      [ Biome.ICE_CAVE, PoolTier.BOSS ]
    ]
  ],
  [ Species.GRIMER, Type.POISON, -1, [
      [ Biome.GRASS, PoolTier.UNCOMMON ],
      [ Biome.SWAMP, PoolTier.COMMON ]
    ]
  ],
  [ Species.MUK, Type.POISON, -1, [
      [ Biome.GRASS, PoolTier.UNCOMMON ],
      [ Biome.SWAMP, PoolTier.COMMON ]
    ]
  ],
  [ Species.SHELLDER, Type.WATER, -1, [
      [ Biome.WATER, PoolTier.UNCOMMON ],
      [ Biome.SEA, PoolTier.COMMON ]
    ]
  ],
  [ Species.CLOYSTER, Type.WATER, Type.ICE, [
      [ Biome.SEA, PoolTier.BOSS ]
    ]
  ],
  [ Species.GASTLY, Type.GHOST, Type.POISON, [
      [ Biome.GRAVEYARD, PoolTier.COMMON ]
    ]
  ],
  [ Species.HAUNTER, Type.GHOST, Type.POISON, [
      [ Biome.GRAVEYARD, PoolTier.COMMON ]
    ]
  ],
  [ Species.GENGAR, Type.GHOST, Type.POISON, [
      [ Biome.GRAVEYARD, PoolTier.BOSS ]
    ]
  ],
  [ Species.ONIX, Type.ROCK, Type.GROUND, [
      [ Biome.LAND, PoolTier.UNCOMMON ],
      [ Biome.CAVE, PoolTier.RARE ]
    ]
  ],
  [ Species.DROWZEE, Type.PSYCHIC, -1, [
      [ Biome.GRASS, PoolTier.RARE ],
      [ Biome.RUINS, PoolTier.COMMON ]
    ]
  ],
  [ Species.HYPNO, Type.PSYCHIC, -1, [
      [ Biome.GRASS, PoolTier.RARE ],
      [ Biome.RUINS, PoolTier.COMMON ],
      [ Biome.RUINS, PoolTier.BOSS ]
    ]
  ],
  [ Species.KRABBY, Type.WATER, -1, [
      [ Biome.WATER, PoolTier.UNCOMMON ],
      [ Biome.SEA, PoolTier.COMMON ]
    ]
  ],
  [ Species.KINGLER, Type.WATER, -1, [
      [ Biome.WATER, PoolTier.UNCOMMON ],
      [ Biome.SEA, PoolTier.COMMON ],
      [ Biome.SEA, PoolTier.BOSS ]
    ]
  ],
  [ Species.VOLTORB, Type.ELECTRIC, -1, [
      [ Biome.POWER_PLANT, PoolTier.COMMON ]
    ]
  ],
  [ Species.ELECTRODE, Type.ELECTRIC, -1, [
      [ Biome.POWER_PLANT, PoolTier.COMMON ]
    ]
  ],
  [ Species.EXEGGCUTE, Type.GRASS, Type.PSYCHIC, [
      [ Biome.GRASS, PoolTier.RARE ],
      [ Biome.FOREST, PoolTier.UNCOMMON ]
    ]
  ],
  [ Species.EXEGGUTOR, Type.GRASS, Type.PSYCHIC, [
      [ Biome.FOREST, PoolTier.BOSS ]
    ]
  ],
  [ Species.CUBONE, Type.GROUND, -1, [
      [ Biome.LAND, PoolTier.UNCOMMON ],
      [ Biome.GRAVEYARD, PoolTier.UNCOMMON ]
    ]
  ],
  [ Species.MAROWAK, Type.GROUND, -1, [
      [ Biome.LAND, PoolTier.UNCOMMON ],
      [ Biome.GRAVEYARD, PoolTier.UNCOMMON ],
      [ Biome.LAND, PoolTier.BOSS ]
    ]
  ],
  [ Species.HITMONLEE, Type.FIGHTING, -1, [
      [ Biome.DOJO, PoolTier.RARE ],
      [ Biome.DOJO, PoolTier.BOSS ]
    ]
  ],
  [ Species.HITMONCHAN, Type.FIGHTING, -1, [
      [ Biome.DOJO, PoolTier.RARE ],
      [ Biome.DOJO, PoolTier.BOSS ]
    ]
  ],
  [ Species.LICKITUNG, Type.NORMAL, -1, [
      [ Biome.GRASS, PoolTier.SUPER_RARE ]
    ]
  ],
  [ Species.KOFFING, Type.POISON, -1, [
      [ Biome.FOREST, PoolTier.UNCOMMON ],
      [ Biome.SWAMP, PoolTier.COMMON ]
    ]
  ],
  [ Species.WEEZING, Type.POISON, -1, [
      [ Biome.FOREST, PoolTier.UNCOMMON ],
      [ Biome.SWAMP, PoolTier.COMMON ],
      [ Biome.SWAMP, PoolTier.BOSS ]
    ]
  ],
  [ Species.RHYHORN, Type.GROUND, Type.ROCK, [
      [ Biome.MOUNTAIN, PoolTier.UNCOMMON ],
      [ Biome.LAND, PoolTier.COMMON ]
    ]
  ],
  [ Species.RHYDON, Type.GROUND, Type.ROCK, [
      [ Biome.MOUNTAIN, PoolTier.UNCOMMON ],
      [ Biome.LAND, PoolTier.COMMON ]
    ]
  ],
  [ Species.CHANSEY, Type.NORMAL, -1, [
      [ Biome.GRASS, PoolTier.SUPER_RARE ],
      [ Biome.MEADOW, PoolTier.SUPER_RARE ]
    ]
  ],
  [ Species.TANGELA, Type.GRASS, -1, [
      [ Biome.GRASS, PoolTier.RARE ],
      [ Biome.FOREST, PoolTier.UNCOMMON ]
    ]
  ],
  [ Species.KANGASKHAN, Type.NORMAL, -1, [
      [ Biome.GRASS, PoolTier.SUPER_RARE ],
      [ Biome.GRASS, PoolTier.BOSS_RARE ]
    ]
  ],
  [ Species.HORSEA, Type.WATER, -1, [
      [ Biome.SEA, PoolTier.COMMON ]
    ]
  ],
  [ Species.SEADRA, Type.WATER, -1, [
      [ Biome.SEA, PoolTier.COMMON ]
    ]
  ],
  [ Species.GOLDEEN, Type.WATER, -1, [
      [ Biome.SEA, PoolTier.COMMON ]
    ]
  ],
  [ Species.SEAKING, Type.WATER, -1, [
      [ Biome.SEA, PoolTier.COMMON ],
      [ Biome.SEA, PoolTier.BOSS ]
    ]
  ],
  [ Species.STARYU, Type.WATER, -1, [
      [ Biome.WATER, PoolTier.UNCOMMON ],
      [ Biome.SEA, PoolTier.COMMON ]
    ]
  ],
  [ Species.STARMIE, Type.WATER, Type.PSYCHIC, [
      [ Biome.WATER, PoolTier.UNCOMMON ],
      [ Biome.SEA, PoolTier.COMMON ],
      [ Biome.SEA, PoolTier.BOSS ]
    ]
  ],
  [ Species.MR_MIME, Type.PSYCHIC, Type.FAIRY, [
      [ Biome.RUINS, PoolTier.RARE ],
      [ Biome.RUINS, PoolTier.BOSS_RARE ]
    ]
  ],
  [ Species.SCYTHER, Type.BUG, Type.FLYING, [
      [ Biome.GRASS, PoolTier.SUPER_RARE ],
      [ Biome.FOREST, PoolTier.RARE ]
    ]
  ],
  [ Species.JYNX, Type.ICE, Type.PSYCHIC, [
      [ Biome.ICE_CAVE, PoolTier.RARE ],
      [ Biome.ICE_CAVE, PoolTier.BOSS_RARE ]
    ]
  ],
  [ Species.ELECTABUZZ, Type.ELECTRIC, -1, [
      [ Biome.POWER_PLANT, PoolTier.RARE ]
    ]
  ],
  [ Species.MAGMAR, Type.FIRE, -1, [
      [ Biome.VOLCANO, PoolTier.RARE ]
    ]
  ],
  [ Species.PINSIR, Type.BUG, -1, [
      [ Biome.GRASS, PoolTier.SUPER_RARE ],
      [ Biome.FOREST, PoolTier.UNCOMMON ],
      [ Biome.FOREST, PoolTier.BOSS ]
    ]
  ],
  [ Species.TAUROS, Type.NORMAL, -1, [
      [ Biome.GRASS, PoolTier.SUPER_RARE ],
      [ Biome.MEADOW, PoolTier.UNCOMMON ],
      [ Biome.MEADOW, PoolTier.BOSS ]
    ]
  ],
  [ Species.MAGIKARP, Type.WATER, -1, [
      [ Biome.WATER, PoolTier.COMMON ],
      [ Biome.SEA, PoolTier.COMMON ]
    ]
  ],
  [ Species.GYARADOS, Type.WATER, Type.FLYING, [
      [ Biome.WATER, PoolTier.BOSS ],
      [ Biome.SEA, PoolTier.BOSS ]
    ]
  ],
  [ Species.LAPRAS, Type.WATER, Type.ICE, [
      [ Biome.SEA, PoolTier.RARE ]
    ]
  ],
  [ Species.DITTO, Type.NORMAL, -1, [
      [ Biome.PLAINS, PoolTier.ULTRA_RARE ],
      [ Biome.GRASS, PoolTier.ULTRA_RARE ]
    ]
  ],
  [ Species.EEVEE, Type.NORMAL, -1, [
      [ Biome.PLAINS, PoolTier.SUPER_RARE ],
      [ Biome.GRASS, PoolTier.SUPER_RARE ],
      [ Biome.MEADOW, PoolTier.RARE ]
    ]
  ],
  [ Species.VAPOREON, Type.WATER, -1, [
      [ Biome.WATER, PoolTier.SUPER_RARE ],
      [ Biome.WATER, PoolTier.BOSS_RARE ]
    ]
  ],
  [ Species.JOLTEON, Type.ELECTRIC, -1, [
      [ Biome.POWER_PLANT, PoolTier.SUPER_RARE ],
      [ Biome.POWER_PLANT, PoolTier.BOSS_RARE ]
    ]
  ],
  [ Species.FLAREON, Type.FIRE, -1, [
      [ Biome.VOLCANO, PoolTier.SUPER_RARE ],
      [ Biome.VOLCANO, PoolTier.BOSS_RARE ]
    ]
  ],
  [ Species.PORYGON, Type.NORMAL, -1, [
      [ Biome.SPACE, PoolTier.SUPER_RARE ]
    ]
  ],
  [ Species.OMANYTE, Type.ROCK, Type.WATER, [
      [ Biome.SEA, PoolTier.SUPER_RARE ]
    ]
  ],
  [ Species.OMASTAR, Type.ROCK, Type.WATER, [
      [ Biome.SEA, PoolTier.SUPER_RARE ],
      [ Biome.SEA, PoolTier.BOSS_RARE ]
    ]
  ],
  [ Species.KABUTO, Type.ROCK, Type.WATER, [
      [ Biome.SEA, PoolTier.SUPER_RARE ]
    ]
  ],
  [ Species.KABUTOPS, Type.ROCK, Type.WATER, [
      [ Biome.SEA, PoolTier.SUPER_RARE ],
      [ Biome.SEA, PoolTier.BOSS_RARE ]
    ]
  ],
  [ Species.AERODACTYL, Type.ROCK, Type.FLYING, [
      [ Biome.WASTELAND, PoolTier.SUPER_RARE ],
      [ Biome.WASTELAND, PoolTier.BOSS_RARE ]
    ]
  ],
  [ Species.SNORLAX, Type.NORMAL, -1, [
      [ Biome.GRASS, PoolTier.SUPER_RARE ],
      [ Biome.GRASS, PoolTier.BOSS_RARE ]
    ]
  ],
  [ Species.ARTICUNO, Type.ICE, Type.FLYING, [
      [ Biome.ICE_CAVE, PoolTier.BOSS_ULTRA_RARE ]
    ]
  ],
  [ Species.ZAPDOS, Type.ELECTRIC, Type.FLYING, [
      [ Biome.POWER_PLANT, PoolTier.BOSS_ULTRA_RARE ]
    ]
  ],
  [ Species.MOLTRES, Type.FIRE, Type.FLYING, [
      [ Biome.VOLCANO, PoolTier.BOSS_ULTRA_RARE ]
    ]
  ],
  [ Species.DRATINI, Type.DRAGON, -1, [
      [ Biome.WASTELAND, PoolTier.RARE ]
    ]
  ],
  [ Species.DRAGONAIR, Type.DRAGON, -1, [
      [ Biome.WASTELAND, PoolTier.RARE ]
    ]
  ],
  [ Species.DRAGONITE, Type.DRAGON, Type.FLYING, [
      [ Biome.WASTELAND, PoolTier.RARE ],
      [ Biome.WASTELAND, PoolTier.BOSS ]
    ]
  ],
  [ Species.MEWTWO, Type.PSYCHIC, -1, [
      [ Biome.RUINS, PoolTier.BOSS_LEGENDARY ]
    ]
  ],
  [ Species.MEW, Type.PSYCHIC, -1, [
      [ Biome.SPACE, PoolTier.BOSS_LEGENDARY ]
    ]
  ],
  [ Species.CHIKORITA, Type.GRASS, -1, [
      [ Biome.FOREST, PoolTier.RARE ]
    ]
  ],
  [ Species.BAYLEEF, Type.GRASS, -1, [
      [ Biome.FOREST, PoolTier.RARE ]
    ]
  ],
  [ Species.MEGANIUM, Type.GRASS, -1, [
      [ Biome.FOREST, PoolTier.RARE ],
      [ Biome.FOREST, PoolTier.BOSS_RARE ]
    ]
  ],
  [ Species.CYNDAQUIL, Type.FIRE, -1, [
      [ Biome.VOLCANO, PoolTier.RARE ]
    ]
  ],
  [ Species.QUILAVA, Type.FIRE, -1, [
      [ Biome.VOLCANO, PoolTier.RARE ]
    ]
  ],
  [ Species.TYPHLOSION, Type.FIRE, -1, [
      [ Biome.VOLCANO, PoolTier.RARE ],
      [ Biome.VOLCANO, PoolTier.BOSS_RARE ]
    ]
  ],
  [ Species.TOTODILE, Type.WATER, -1, [
      [ Biome.WATER, PoolTier.RARE ]
    ]
  ],
  [ Species.CROCONAW, Type.WATER, -1, [
      [ Biome.WATER, PoolTier.RARE ]
    ]
  ],
  [ Species.FERALIGATR, Type.WATER, -1, [
      [ Biome.WATER, PoolTier.RARE ],
      [ Biome.WATER, PoolTier.BOSS_RARE ]
    ]
  ],
  [ Species.SENTRET, Type.NORMAL, -1, [
      [ Biome.PLAINS, PoolTier.COMMON ],
      [ Biome.GRASS, PoolTier.COMMON ]
    ]
  ],
  [ Species.FURRET, Type.NORMAL, -1, [
      [ Biome.GRASS, PoolTier.COMMON ],
      [ Biome.GRASS, PoolTier.BOSS ]
    ]
  ],
  [ Species.HOOTHOOT, Type.NORMAL, Type.FLYING, [
      [ Biome.PLAINS, PoolTier.COMMON ],
      [ Biome.FOREST, PoolTier.UNCOMMON ]
    ]
  ],
  [ Species.NOCTOWL, Type.NORMAL, Type.FLYING, [
      [ Biome.GRASS, PoolTier.UNCOMMON ],
      [ Biome.GRASS, PoolTier.BOSS ]
    ]
  ],
  [ Species.LEDYBA, Type.BUG, Type.FLYING, [
      [ Biome.PLAINS, PoolTier.COMMON ],
      [ Biome.GRASS, PoolTier.COMMON ]
    ]
  ],
  [ Species.LEDIAN, Type.BUG, Type.FLYING, [
      [ Biome.GRASS, PoolTier.COMMON ],
      [ Biome.GRASS, PoolTier.BOSS ]
    ]
  ],
  [ Species.SPINARAK, Type.BUG, Type.POISON, [
      [ Biome.FOREST, PoolTier.COMMON ]
    ]
  ],
  [ Species.ARIADOS, Type.BUG, Type.POISON, [
      [ Biome.GRASS, PoolTier.COMMON ],
      [ Biome.GRASS, PoolTier.BOSS ]
    ]
  ],
  [ Species.CROBAT, Type.POISON, Type.FLYING, [
      [ Biome.CAVE, PoolTier.BOSS ]
    ]
  ],
  [ Species.CHINCHOU, Type.WATER, Type.ELECTRIC, [
      [ Biome.SEA, PoolTier.UNCOMMON ]
    ]
  ],
  [ Species.LANTURN, Type.WATER, Type.ELECTRIC, [
      [ Biome.SEA, PoolTier.UNCOMMON ],
      [ Biome.SEA, PoolTier.BOSS ]
    ]
  ],
  [ Species.PICHU, Type.ELECTRIC, -1, [
      [ Biome.PLAINS, PoolTier.UNCOMMON ]
    ]
  ],
  [ Species.CLEFFA, Type.FAIRY, -1, [
      [ Biome.PLAINS, PoolTier.RARE ]
    ]
  ],
  [ Species.IGGLYBUFF, Type.NORMAL, Type.FAIRY, [
      [ Biome.PLAINS, PoolTier.UNCOMMON ]
    ]
  ],
  [ Species.TOGEPI, Type.FAIRY, -1, [
      [ Biome.PLAINS, PoolTier.SUPER_RARE ]
    ]
  ],
  [ Species.TOGETIC, Type.FAIRY, Type.FLYING, [
      [ Biome.MEADOW, PoolTier.UNCOMMON ]
    ]
  ],
  [ Species.NATU, Type.PSYCHIC, Type.FLYING, [
      [ Biome.RUINS, PoolTier.COMMON ]
    ]
  ],
  [ Species.XATU, Type.PSYCHIC, Type.FLYING, [
      [ Biome.RUINS, PoolTier.COMMON ],
      [ Biome.RUINS, PoolTier.BOSS ]
    ]
  ],
  [ Species.MAREEP, Type.ELECTRIC, -1, [
      [ Biome.GRASS, PoolTier.UNCOMMON ]
    ]
  ],
  [ Species.FLAAFFY, Type.ELECTRIC, -1, [
      [ Biome.GRASS, PoolTier.UNCOMMON ]
    ]
  ],
  [ Species.AMPHAROS, Type.ELECTRIC, -1, [
      [ Biome.GRASS, PoolTier.UNCOMMON ],
      [ Biome.GRASS, PoolTier.BOSS ]
    ]
  ],
  [ Species.BELLOSSOM, Type.GRASS, -1, [
      [ Biome.FOREST, PoolTier.BOSS ]
    ]
  ],
  [ Species.MARILL, Type.WATER, Type.FAIRY, [
      [ Biome.WATER, PoolTier.COMMON ]
    ]
  ],
  [ Species.AZUMARILL, Type.WATER, Type.FAIRY, [
      [ Biome.WATER, PoolTier.COMMON ],
      [ Biome.WATER, PoolTier.BOSS ]
    ]
  ],
  [ Species.SUDOWOODO, Type.ROCK, -1, [
      [ Biome.GRASS, PoolTier.SUPER_RARE ],
      [ Biome.GRASS, PoolTier.BOSS_RARE ]
    ]
  ],
  [ Species.POLITOED, Type.WATER, -1, [
      [ Biome.WATER, PoolTier.SUPER_RARE ],
      [ Biome.WATER, PoolTier.BOSS_RARE ]
    ]
  ],
  [ Species.HOPPIP, Type.GRASS, Type.FLYING, [
      [ Biome.PLAINS, PoolTier.COMMON ],
      [ Biome.GRASS, PoolTier.COMMON ]
    ]
  ],
  [ Species.SKIPLOOM, Type.GRASS, Type.FLYING, [
      [ Biome.GRASS, PoolTier.COMMON ],
      [ Biome.FOREST, PoolTier.COMMON ]
    ]
  ],
  [ Species.JUMPLUFF, Type.GRASS, Type.FLYING, [
      [ Biome.GRASS, PoolTier.COMMON ],
      [ Biome.FOREST, PoolTier.COMMON ],
      [ Biome.FOREST, PoolTier.BOSS ]
    ]
  ],
  [ Species.AIPOM, Type.NORMAL, -1, [
      [ Biome.FOREST, PoolTier.UNCOMMON ]
    ]
  ],
  [ Species.SUNKERN, Type.GRASS, -1, [
      [ Biome.PLAINS, PoolTier.COMMON ],
      [ Biome.GRASS, PoolTier.COMMON ]
    ]
  ],
  [ Species.SUNFLORA, Type.GRASS, -1, [
      [ Biome.GRASS, PoolTier.COMMON ],
      [ Biome.GRASS, PoolTier.BOSS ]
    ]
  ],
  [ Species.YANMA, Type.BUG, Type.FLYING, [
      [ Biome.FOREST, PoolTier.RARE ]
    ]
  ],
  [ Species.WOOPER, Type.WATER, Type.GROUND, [
      [ Biome.WATER, PoolTier.UNCOMMON ],
      [ Biome.SWAMP, PoolTier.COMMON ]
    ]
  ],
  [ Species.QUAGSIRE, Type.WATER, Type.GROUND, [
      [ Biome.WATER, PoolTier.UNCOMMON ],
      [ Biome.SWAMP, PoolTier.COMMON ],
      [ Biome.SWAMP, PoolTier.BOSS ]
    ]
  ],
  [ Species.ESPEON, Type.PSYCHIC, -1, [
      [ Biome.RUINS, PoolTier.SUPER_RARE ],
      [ Biome.RUINS, PoolTier.BOSS_RARE ]
    ]
  ],
  [ Species.UMBREON, Type.DARK, -1, [
      [ Biome.ABYSS, PoolTier.SUPER_RARE ],
      [ Biome.ABYSS, PoolTier.BOSS_RARE ]
    ]
  ],
  [ Species.MURKROW, Type.DARK, Type.FLYING, [
      [ Biome.MOUNTAIN, PoolTier.RARE ],
      [ Biome.ABYSS, PoolTier.UNCOMMON ]
    ]
  ],
  [ Species.SLOWKING, Type.WATER, Type.PSYCHIC, [
      [ Biome.WATER, PoolTier.SUPER_RARE ],
      [ Biome.WATER, PoolTier.BOSS_RARE ]
    ]
  ],
  [ Species.MISDREAVUS, Type.GHOST, -1, [
      [ Biome.GRAVEYARD, PoolTier.UNCOMMON ]
    ]
  ],
  [ Species.UNOWN, Type.PSYCHIC, -1, [
      [ Biome.RUINS, PoolTier.COMMON ]
    ]
  ],
  [ Species.WOBBUFFET, Type.PSYCHIC, -1, [
      [ Biome.RUINS, PoolTier.RARE ],
      [ Biome.RUINS, PoolTier.BOSS_RARE ]
    ]
  ],
  [ Species.GIRAFARIG, Type.NORMAL, Type.PSYCHIC, [
      [ Biome.GRASS, PoolTier.RARE ],
      [ Biome.GRASS, PoolTier.BOSS_RARE ]
    ]
  ],
  [ Species.PINECO, Type.BUG, -1, [
      [ Biome.GRASS, PoolTier.UNCOMMON ],
      [ Biome.FOREST, PoolTier.COMMON ]
    ]
  ],
  [ Species.FORRETRESS, Type.BUG, Type.STEEL, [
      [ Biome.GRASS, PoolTier.UNCOMMON ],
      [ Biome.FOREST, PoolTier.COMMON ],
      [ Biome.FOREST, PoolTier.BOSS ]
    ]
  ],
  [ Species.DUNSPARCE, Type.NORMAL, -1, [
      [ Biome.GRASS, PoolTier.SUPER_RARE ]
    ]
  ],
  [ Species.GLIGAR, Type.GROUND, Type.FLYING, [
      [ Biome.LAND, PoolTier.UNCOMMON ]
    ]
  ],
  [ Species.STEELIX, Type.STEEL, Type.GROUND, [
      [ Biome.LAND, PoolTier.BOSS_RARE ]
    ]
  ],
  [ Species.SNUBBULL, Type.FAIRY, -1, [
      [ Biome.GRASS, PoolTier.RARE ],
      [ Biome.MEADOW, PoolTier.COMMON ]
    ]
  ],
  [ Species.GRANBULL, Type.FAIRY, -1, [
      [ Biome.GRASS, PoolTier.RARE ],
      [ Biome.MEADOW, PoolTier.COMMON ],
      [ Biome.MEADOW, PoolTier.BOSS ]
    ]
  ],
  [ Species.QWILFISH, Type.WATER, Type.POISON, [
      [ Biome.SEA, PoolTier.UNCOMMON ],
      [ Biome.SEA, PoolTier.BOSS ]
    ]
  ],
  [ Species.SCIZOR, Type.BUG, Type.STEEL, [
      [ Biome.FOREST, PoolTier.BOSS_RARE ]
    ]
  ],
  [ Species.SHUCKLE, Type.BUG, Type.ROCK, [
      [ Biome.GRASS, PoolTier.SUPER_RARE ],
      [ Biome.GRASS, PoolTier.BOSS_RARE ]
    ]
  ],
  [ Species.HERACROSS, Type.BUG, Type.FIGHTING, [
      [ Biome.FOREST, PoolTier.RARE ],
      [ Biome.FOREST, PoolTier.BOSS_RARE ]
    ]
  ],
  [ Species.SNEASEL, Type.DARK, Type.ICE, [
      [ Biome.ICE_CAVE, PoolTier.UNCOMMON ]
    ]
  ],
  [ Species.TEDDIURSA, Type.NORMAL, -1, [
      [ Biome.FOREST, PoolTier.UNCOMMON ]
    ]
  ],
  [ Species.URSARING, Type.NORMAL, -1, [
      [ Biome.FOREST, PoolTier.UNCOMMON ],
      [ Biome.FOREST, PoolTier.BOSS ]
    ]
  ],
  [ Species.SLUGMA, Type.FIRE, -1, [
      [ Biome.MOUNTAIN, PoolTier.RARE ],
      [ Biome.VOLCANO, PoolTier.COMMON ]
    ]
  ],
  [ Species.MAGCARGO, Type.FIRE, Type.ROCK, [
      [ Biome.MOUNTAIN, PoolTier.RARE ],
      [ Biome.VOLCANO, PoolTier.COMMON ],
      [ Biome.VOLCANO, PoolTier.BOSS ]
    ]
  ],
  [ Species.SWINUB, Type.ICE, Type.GROUND, [
      [ Biome.ICE_CAVE, PoolTier.UNCOMMON ]
    ]
  ],
  [ Species.PILOSWINE, Type.ICE, Type.GROUND, [
      [ Biome.ICE_CAVE, PoolTier.UNCOMMON]
    ]
  ],
  [ Species.CORSOLA, Type.WATER, Type.ROCK, [
      [ Biome.SEA, PoolTier.RARE ],
      [ Biome.SEA, PoolTier.BOSS ]
    ]
  ],
  [ Species.REMORAID, Type.WATER, -1, [
      [ Biome.SEA, PoolTier.COMMON ]
    ]
  ],
  [ Species.OCTILLERY, Type.WATER, -1, [
      [ Biome.SEA, PoolTier.RARE ],
      [ Biome.SEA, PoolTier.BOSS ]
    ]
  ],
  [ Species.DELIBIRD, Type.ICE, Type.FLYING, [
      [ Biome.ICE_CAVE, PoolTier.SUPER_RARE ]
    ]
  ],
  [ Species.MANTINE, Type.WATER, Type.FLYING, [
      [ Biome.SEA, PoolTier.RARE ],
      [ Biome.SEA, PoolTier.BOSS ]
    ]
  ],
  [ Species.SKARMORY, Type.STEEL, Type.FLYING, [
      [ Biome.MOUNTAIN, PoolTier.RARE ],
      [ Biome.MOUNTAIN, PoolTier.BOSS ]
    ]
  ],
  [ Species.HOUNDOUR, Type.DARK, Type.FIRE, [
      [ Biome.ABYSS, PoolTier.COMMON ]
    ]
  ],
  [ Species.HOUNDOOM, Type.DARK, Type.FIRE, [
      [ Biome.ABYSS, PoolTier.COMMON ],
      [ Biome.ABYSS, PoolTier.BOSS ]
    ]
  ],
  [ Species.KINGDRA, Type.WATER, Type.DRAGON, [
      [ Biome.SEA, PoolTier.SUPER_RARE ],
      [ Biome.SEA, PoolTier.BOSS_RARE ]
    ]
  ],
  [ Species.PHANPY, Type.GROUND, -1, [
      [ Biome.LAND, PoolTier.COMMON ]
    ]
  ],
  [ Species.DONPHAN, Type.GROUND, -1, [
      [ Biome.LAND, PoolTier.COMMON ],
      [ Biome.LAND, PoolTier.BOSS ]
    ]
  ],
  [ Species.PORYGON2, Type.NORMAL, -1, [
      [ Biome.SPACE, PoolTier.SUPER_RARE ]
    ]
  ],
  [ Species.STANTLER, Type.NORMAL, -1, [
      [ Biome.FOREST, PoolTier.RARE ],
      [ Biome.FOREST, PoolTier.BOSS_RARE ]
    ]
  ],
  [ Species.SMEARGLE, Type.NORMAL, -1, [
      [ Biome.PLAINS, PoolTier.SUPER_RARE ],
      [ Biome.GRASS, PoolTier.SUPER_RARE ]
    ]
  ],
  [ Species.TYROGUE, Type.FIGHTING, -1, [
      [ Biome.PLAINS, PoolTier.SUPER_RARE ],
      [ Biome.DOJO, PoolTier.RARE ]
    ]
  ],
  [ Species.HITMONTOP, Type.FIGHTING, -1, [
      [ Biome.DOJO, PoolTier.SUPER_RARE ],
      [ Biome.DOJO, PoolTier.BOSS_RARE ]
    ]
  ],
  [ Species.SMOOCHUM, Type.ICE, Type.PSYCHIC, [
      [ Biome.PLAINS, PoolTier.SUPER_RARE ]
    ]
  ],
  [ Species.ELEKID, Type.ELECTRIC, -1, [
      [ Biome.PLAINS, PoolTier.SUPER_RARE ]
    ]
  ],
  [ Species.MAGBY, Type.FIRE, -1, [
      [ Biome.PLAINS, PoolTier.SUPER_RARE ]
    ]
  ],
  [ Species.MILTANK, Type.NORMAL, -1, [
      [ Biome.GRASS, PoolTier.RARE ],
      [ Biome.MEADOW, PoolTier.UNCOMMON ],
      [ Biome.MEADOW, PoolTier.BOSS ]
    ]
  ],
  [ Species.BLISSEY, Type.NORMAL, -1, [
      [ Biome.MEADOW, PoolTier.BOSS_RARE ]
    ]
  ],
  [ Species.RAIKOU, Type.ELECTRIC, -1, [
      [ Biome.POWER_PLANT, PoolTier.BOSS_ULTRA_RARE ]
    ]
  ],
  [ Species.ENTEI, Type.FIRE, -1, [
      [ Biome.VOLCANO, PoolTier.BOSS_ULTRA_RARE ]
    ]
  ],
  [ Species.SUICUNE, Type.WATER, -1, [
      [ Biome.WATER, PoolTier.BOSS_ULTRA_RARE ]
    ]
  ],
  [ Species.LARVITAR, Type.ROCK, Type.GROUND, [
      [ Biome.MOUNTAIN, PoolTier.SUPER_RARE ],
      [ Biome.WASTELAND, PoolTier.UNCOMMON ]
    ]
  ],
  [ Species.PUPITAR, Type.ROCK, Type.GROUND, [
      [ Biome.MOUNTAIN, PoolTier.SUPER_RARE ],
      [ Biome.WASTELAND, PoolTier.UNCOMMON ]
    ]
  ],
  [ Species.TYRANITAR, Type.ROCK, Type.DARK, [
      [ Biome.MOUNTAIN, PoolTier.BOSS_RARE ],
      [ Biome.WASTELAND, PoolTier.BOSS ]
    ]
  ],
  [ Species.LUGIA, Type.PSYCHIC, Type.FLYING, [
      [ Biome.SEA, PoolTier.BOSS_LEGENDARY ]
    ]
  ],
  [ Species.HO_OH, Type.FIRE, Type.FLYING, [
      [ Biome.MOUNTAIN, PoolTier.BOSS_LEGENDARY ]
    ]
  ],
  [ Species.CELEBI, Type.PSYCHIC, Type.GRASS, [
      [ Biome.FOREST, PoolTier.BOSS_LEGENDARY ]
    ]
  ],
  [ Species.TREECKO, Type.GRASS, -1, [
      [ Biome.FOREST, PoolTier.RARE ]
    ]
  ],
  [ Species.GROVYLE, Type.GRASS, -1, [
      [ Biome.FOREST, PoolTier.RARE ]
    ]
  ],
  [ Species.SCEPTILE, Type.GRASS, -1, [
      [ Biome.FOREST, PoolTier.RARE ],
      [ Biome.FOREST, PoolTier.BOSS_RARE ]
    ]
  ],
  [ Species.TORCHIC, Type.FIRE, -1, [
      [ Biome.VOLCANO, PoolTier.RARE ]
    ]
  ],
  [ Species.COMBUSKEN, Type.FIRE, Type.FIGHTING, [
      [ Biome.VOLCANO, PoolTier.RARE ]
    ]
  ],
  [ Species.BLAZIKEN, Type.FIRE, Type.FIGHTING, [
      [ Biome.VOLCANO, PoolTier.RARE ],
      [ Biome.VOLCANO, PoolTier.BOSS_RARE ]
    ]
  ],
  [ Species.MUDKIP, Type.WATER, -1, [
      [ Biome.SWAMP, PoolTier.UNCOMMON ]
    ]
  ],
  [ Species.MARSHTOMP, Type.WATER, Type.GROUND, [
      [ Biome.SWAMP, PoolTier.UNCOMMON ]
    ]
  ],
  [ Species.SWAMPERT, Type.WATER, Type.GROUND, [
      [ Biome.SWAMP, PoolTier.UNCOMMON ],
      [ Biome.SWAMP, PoolTier.BOSS_RARE ]
    ]
  ],
  [ Species.POOCHYENA, Type.DARK, -1, [
      [ Biome.PLAINS, PoolTier.COMMON ],
      [ Biome.ABYSS, PoolTier.COMMON ]
    ]
  ],
  [ Species.MIGHTYENA, Type.DARK, -1, [
      [ Biome.ABYSS, PoolTier.COMMON ],
      [ Biome.ABYSS, PoolTier.BOSS ]
    ]
  ],
  [ Species.ZIGZAGOON, Type.NORMAL, -1, [
      [ Biome.PLAINS, PoolTier.COMMON ],
      [ Biome.GRASS, PoolTier.COMMON ]
    ]
  ],
  [ Species.LINOONE, Type.NORMAL, -1, [
      [ Biome.GRASS, PoolTier.COMMON ],
      [ Biome.GRASS, PoolTier.BOSS ]
    ]
  ],
  [ Species.WURMPLE, Type.BUG, -1, [
      [ Biome.PLAINS, PoolTier.COMMON ],
      [ Biome.FOREST, PoolTier.COMMON ]
    ]
  ],
  [ Species.SILCOON, Type.BUG, -1, [
      [ Biome.PLAINS, PoolTier.COMMON ],
      [ Biome.FOREST, PoolTier.COMMON ]
    ]
  ],
  [ Species.BEAUTIFLY, Type.BUG, Type.FLYING, [
      [ Biome.FOREST, PoolTier.UNCOMMON ],
      [ Biome.FOREST, PoolTier.BOSS ]
    ]
  ],
  [ Species.CASCOON, Type.BUG, -1, [
      [ Biome.PLAINS, PoolTier.COMMON ],
      [ Biome.FOREST, PoolTier.COMMON ]
    ]
  ],
  [ Species.DUSTOX, Type.BUG, Type.POISON, [
      [ Biome.FOREST, PoolTier.UNCOMMON ],
      [ Biome.FOREST, PoolTier.BOSS ]
    ]
  ],
  [ Species.LOTAD, Type.WATER, Type.GRASS, [
      [ Biome.PLAINS, PoolTier.UNCOMMON ],
      [ Biome.WATER, PoolTier.UNCOMMON ],
      [ Biome.SWAMP, PoolTier.COMMON ]
    ]
  ],
  [ Species.LOMBRE, Type.WATER, Type.GRASS, [
      [ Biome.WATER, PoolTier.UNCOMMON ],
      [ Biome.SWAMP, PoolTier.COMMON ]
    ]
  ],
  [ Species.LUDICOLO, Type.WATER, Type.GRASS, [
      [ Biome.SWAMP, PoolTier.BOSS ]
    ]
  ],
  [ Species.SEEDOT, Type.GRASS, -1, [
      [ Biome.PLAINS, PoolTier.UNCOMMON ],
      [ Biome.GRASS, PoolTier.UNCOMMON ],
      [ Biome.FOREST, PoolTier.COMMON ]
    ]
  ],
  [ Species.NUZLEAF, Type.GRASS, Type.DARK, [
      [ Biome.GRASS, PoolTier.UNCOMMON ],
      [ Biome.FOREST, PoolTier.COMMON ]
    ]
  ],
  [ Species.SHIFTRY, Type.GRASS, Type.DARK, [
      [ Biome.FOREST, PoolTier.BOSS ]
    ]
  ],
  [ Species.TAILLOW, Type.NORMAL, Type.FLYING, [
      [ Biome.PLAINS, PoolTier.COMMON ],
      [ Biome.GRASS, PoolTier.UNCOMMON ],
      [ Biome.MOUNTAIN, PoolTier.COMMON ]
    ]
  ],
  [ Species.SWELLOW, Type.NORMAL, Type.FLYING, [
      [ Biome.GRASS, PoolTier.UNCOMMON ],
      [ Biome.MOUNTAIN, PoolTier.COMMON ],
      [ Biome.MOUNTAIN, PoolTier.BOSS ]
    ]
  ],
  [ Species.WINGULL, Type.WATER, Type.FLYING, [
      [ Biome.WATER, PoolTier.COMMON ]
    ]
  ],
  [ Species.PELIPPER, Type.WATER, Type.FLYING, [
      [ Biome.WATER, PoolTier.COMMON ],
      [ Biome.WATER, PoolTier.BOSS ]
    ]
  ],
  [ Species.RALTS, Type.PSYCHIC, Type.FAIRY, [
      [ Biome.PLAINS, PoolTier.SUPER_RARE ],
      [ Biome.GRASS, PoolTier.RARE ],
      [ Biome.MEADOW, PoolTier.UNCOMMON ]
    ]
  ],
  [ Species.KIRLIA, Type.PSYCHIC, Type.FAIRY, [
      [ Biome.GRASS, PoolTier.RARE ],
      [ Biome.MEADOW, PoolTier.UNCOMMON ]
    ]
  ],
  [ Species.GARDEVOIR, Type.PSYCHIC, Type.FAIRY, [
      [ Biome.GRASS, PoolTier.RARE ],
      [ Biome.MEADOW, PoolTier.UNCOMMON ],
      [ Biome.MEADOW, PoolTier.BOSS ]
    ]
  ],
  [ Species.SURSKIT, Type.BUG, Type.WATER, [
      [ Biome.PLAINS, PoolTier.RARE ],
      [ Biome.WATER, PoolTier.UNCOMMON ]
    ]
  ],
  [ Species.MASQUERAIN, Type.BUG, Type.FLYING, [
      [ Biome.PLAINS, PoolTier.RARE ],
      [ Biome.WATER, PoolTier.UNCOMMON ],
      [ Biome.WATER, PoolTier.BOSS ]
    ]
  ],
  [ Species.SHROOMISH, Type.GRASS, -1, [
      [ Biome.PLAINS, PoolTier.UNCOMMON ],
      [ Biome.GRASS, PoolTier.UNCOMMON ],
      [ Biome.FOREST, PoolTier.COMMON ]
    ]
  ],
  [ Species.BRELOOM, Type.GRASS, Type.FIGHTING, [
      [ Biome.PLAINS, PoolTier.UNCOMMON ],
      [ Biome.GRASS, PoolTier.UNCOMMON ],
      [ Biome.FOREST, PoolTier.COMMON ],
      [ Biome.FOREST, PoolTier.BOSS ]
    ]
  ],
  [ Species.SLAKOTH, Type.NORMAL, -1, [
      [ Biome.PLAINS, PoolTier.RARE ],
      [ Biome.FOREST, PoolTier.RARE ]
    ]
  ],
  [ Species.VIGOROTH, Type.NORMAL, -1, [
      [ Biome.FOREST, PoolTier.RARE ]
    ]
  ],
  [ Species.SLAKING, Type.NORMAL, -1, [
      [ Biome.FOREST, PoolTier.RARE ],
      [ Biome.FOREST, PoolTier.BOSS_RARE ]
    ]
  ],
  [ Species.NINCADA, Type.BUG, Type.GROUND, [
      [ Biome.PLAINS, PoolTier.UNCOMMON ],
      [ Biome.FOREST, PoolTier.UNCOMMON ]
    ]
  ],
  [ Species.NINJASK, Type.BUG, Type.FLYING, [
      [ Biome.FOREST, PoolTier.UNCOMMON ],
      [ Biome.FOREST, PoolTier.BOSS ]
    ]
  ],
  [ Species.SHEDINJA, Type.BUG, Type.GHOST, [
      [ Biome.FOREST, PoolTier.SUPER_RARE ]
    ]
  ],
  [ Species.WHISMUR, Type.NORMAL, -1, [
      [ Biome.PLAINS, PoolTier.UNCOMMON ],
      [ Biome.GRASS, PoolTier.UNCOMMON ]
    ]
  ],
  [ Species.LOUDRED, Type.NORMAL, -1, [
      [ Biome.GRASS, PoolTier.UNCOMMON ]
    ]
  ],
  [ Species.EXPLOUD, Type.NORMAL, -1, [
      [ Biome.GRASS, PoolTier.UNCOMMON ],
      [ Biome.GRASS, PoolTier.BOSS ]
    ]
  ],
  [ Species.MAKUHITA, Type.FIGHTING, -1, [
      [ Biome.DOJO, PoolTier.COMMON ]
    ]
  ],
  [ Species.HARIYAMA, Type.FIGHTING, -1, [
      [ Biome.DOJO, PoolTier.COMMON ],
      [ Biome.DOJO, PoolTier.BOSS ]
    ]
  ],
  [ Species.AZURILL, Type.NORMAL, Type.FAIRY, [
      [ Biome.PLAINS, PoolTier.UNCOMMON ]
    ]
  ],
  [ Species.NOSEPASS, Type.ROCK, -1, [
      [ Biome.MOUNTAIN, PoolTier.UNCOMMON ]
    ]
  ],
  [ Species.SKITTY, Type.NORMAL, -1, [
      [ Biome.PLAINS, PoolTier.UNCOMMON ],
      [ Biome.GRASS, PoolTier.UNCOMMON ]
    ]
  ],
  [ Species.DELCATTY, Type.NORMAL, -1, [
      [ Biome.GRASS, PoolTier.UNCOMMON ],
      [ Biome.GRASS, PoolTier.BOSS ]
    ]
  ],
  [ Species.SABLEYE, Type.DARK, Type.GHOST, [
      [ Biome.ABYSS, PoolTier.COMMON ],
      [ Biome.ABYSS, PoolTier.BOSS ]
    ]
  ],
  [ Species.MAWILE, Type.STEEL, Type.FAIRY, [
      [ Biome.CAVE, PoolTier.UNCOMMON ],
      [ Biome.CAVE, PoolTier.BOSS ]
    ]
  ],
  [ Species.ARON, Type.STEEL, Type.ROCK, [
      [ Biome.MOUNTAIN, PoolTier.UNCOMMON ]
    ]
  ],
  [ Species.LAIRON, Type.STEEL, Type.ROCK, [
      [ Biome.MOUNTAIN, PoolTier.UNCOMMON ]
    ]
  ],
  [ Species.AGGRON, Type.STEEL, Type.ROCK, [
      [ Biome.MOUNTAIN, PoolTier.UNCOMMON ],
      [ Biome.MOUNTAIN, PoolTier.BOSS ]
    ]
  ],
  [ Species.MEDITITE, Type.FIGHTING, Type.PSYCHIC, [
      [ Biome.DOJO, PoolTier.COMMON ]
    ]
  ],
  [ Species.MEDICHAM, Type.FIGHTING, Type.PSYCHIC, [
      [ Biome.DOJO, PoolTier.COMMON ],
      [ Biome.DOJO, PoolTier.BOSS ]
    ]
  ],
  [ Species.ELECTRIKE, Type.ELECTRIC, -1, [
      [ Biome.GRASS, PoolTier.RARE ],
      [ Biome.POWER_PLANT, PoolTier.COMMON ]
    ]
  ],
  [ Species.MANECTRIC, Type.ELECTRIC, -1, [
      [ Biome.GRASS, PoolTier.RARE ],
      [ Biome.POWER_PLANT, PoolTier.COMMON ],
      [ Biome.POWER_PLANT, PoolTier.BOSS ]
    ]
  ],
  [ Species.PLUSLE, Type.ELECTRIC, -1, [
      [ Biome.GRASS, PoolTier.RARE ],
      [ Biome.POWER_PLANT, PoolTier.UNCOMMON ]
    ]
  ],
  [ Species.MINUN, Type.ELECTRIC, -1, [
      [ Biome.GRASS, PoolTier.RARE ],
      [ Biome.POWER_PLANT, PoolTier.UNCOMMON ]
    ]
  ],
  [ Species.VOLBEAT, Type.BUG, -1, [
      [ Biome.GRASS, PoolTier.RARE ],
      [ Biome.FOREST, PoolTier.RARE ]
    ]
  ],
  [ Species.ILLUMISE, Type.BUG, -1, [
      [ Biome.GRASS, PoolTier.RARE ],
      [ Biome.FOREST, PoolTier.RARE ]
    ]
  ],
  [ Species.ROSELIA, Type.GRASS, Type.POISON, [
      [ Biome.GRASS, PoolTier.COMMON ],
      [ Biome.FOREST, PoolTier.UNCOMMON ]
    ]
  ],
  [ Species.GULPIN, Type.POISON, -1, [
      [ Biome.FOREST, PoolTier.UNCOMMON ],
      [ Biome.SWAMP, PoolTier.COMMON ]
    ]
  ],
  [ Species.SWALOT, Type.POISON, -1, [
      [ Biome.FOREST, PoolTier.UNCOMMON ],
      [ Biome.SWAMP, PoolTier.COMMON ],
      [ Biome.SWAMP, PoolTier.BOSS ]
    ]
  ],
  [ Species.CARVANHA, Type.WATER, Type.DARK, [
      [ Biome.SEA, PoolTier.COMMON ]
    ]
  ],
  [ Species.SHARPEDO, Type.WATER, Type.DARK, [
      [ Biome.SEA, PoolTier.COMMON ],
      [ Biome.SEA, PoolTier.BOSS ]
    ]
  ],
  [ Species.WAILMER, Type.WATER, -1, [
      [ Biome.SEA, PoolTier.UNCOMMON ]
    ]
  ],
  [ Species.WAILORD, Type.WATER, -1, [
      [ Biome.SEA, PoolTier.SUPER_RARE ],
      [ Biome.SEA, PoolTier.BOSS_RARE ]
    ]
  ],
  [ Species.NUMEL, Type.FIRE, Type.GROUND, [
      [ Biome.LAND, PoolTier.UNCOMMON ],
      [ Biome.VOLCANO, PoolTier.COMMON ]
    ]
  ],
  [ Species.CAMERUPT, Type.FIRE, Type.GROUND, [
      [ Biome.LAND, PoolTier.UNCOMMON ],
      [ Biome.VOLCANO, PoolTier.COMMON ],
      [ Biome.VOLCANO, PoolTier.BOSS ]
    ]
  ],
  [ Species.TORKOAL, Type.FIRE, -1, [
      [ Biome.LAND, PoolTier.RARE ],
      [ Biome.VOLCANO, PoolTier.UNCOMMON ],
      [ Biome.VOLCANO, PoolTier.BOSS ]
    ]
  ],
  [ Species.SPOINK, Type.PSYCHIC, -1, [
      [ Biome.MOUNTAIN, PoolTier.RARE ],
      [ Biome.RUINS, PoolTier.UNCOMMON ]
    ]
  ],
  [ Species.GRUMPIG, Type.PSYCHIC, -1, [
      [ Biome.MOUNTAIN, PoolTier.RARE ],
      [ Biome.RUINS, PoolTier.UNCOMMON ],
      [ Biome.RUINS, PoolTier.BOSS ]
    ]
  ],
  [ Species.SPINDA, Type.NORMAL, -1, [
      [ Biome.GRASS, PoolTier.SUPER_RARE]
    ]
  ],
  [ Species.TRAPINCH, Type.GROUND, -1, [
      [ Biome.DESERT, PoolTier.COMMON ]
    ]
  ],
  [ Species.VIBRAVA, Type.GROUND, Type.DRAGON, [
      [ Biome.DESERT, PoolTier.RARE ],
      [ Biome.WASTELAND, PoolTier.UNCOMMON ]
    ]
  ],
  [ Species.FLYGON, Type.GROUND, Type.DRAGON, [
      [ Biome.DESERT, PoolTier.RARE ],
      [ Biome.WASTELAND, PoolTier.UNCOMMON ],
      [ Biome.WASTELAND, PoolTier.BOSS ]
    ]
  ],
  [ Species.CACNEA, Type.GRASS, -1, [
      [ Biome.DESERT, PoolTier.COMMON ]
    ]
  ],
  [ Species.CACTURNE, Type.GRASS, Type.DARK, [
      [ Biome.DESERT, PoolTier.COMMON ],
      [ Biome.DESERT, PoolTier.BOSS ]
    ]
  ],
  [ Species.SWABLU, Type.NORMAL, Type.FLYING, [
      [ Biome.MOUNTAIN, PoolTier.UNCOMMON ]
    ]
  ],
  [ Species.ALTARIA, Type.DRAGON, Type.FLYING, [
      [ Biome.MOUNTAIN, PoolTier.UNCOMMON ]
      [ Biome.WASTELAND, PoolTier.COMMON ],
      [ Biome.WASTELAND, PoolTier.BOSS ]
    ]
  ],
  [ Species.ZANGOOSE, Type.NORMAL, -1, [
      [ Biome.GRASS, PoolTier.RARE ],
      [ Biome.GRASS, PoolTier.BOSS ]
    ]
  ],
  [ Species.SEVIPER, Type.POISON, -1, [
      [ Biome.FOREST, PoolTier.RARE ],
      [ Biome.FOREST, PoolTier.BOSS ]
    ]
  ],
  [ Species.LUNATONE, Type.ROCK, Type.PSYCHIC, [
      [ Biome.SPACE, PoolTier.COMMON ],
      [ Biome.SPACE, PoolTier.BOSS ]
    ]
  ],
  [ Species.SOLROCK, Type.ROCK, Type.PSYCHIC, [
      [ Biome.SPACE, PoolTier.COMMON ],
      [ Biome.SPACE, PoolTier.BOSS ]
    ]
  ],
  [ Species.BARBOACH, Type.WATER, Type.GROUND, [
      [ Biome.SWAMP, PoolTier.COMMON ],
      [ Biome.SEA, PoolTier.UNCOMMON ]
    ]
  ],
  [ Species.WHISCASH, Type.WATER, Type.GROUND, [
      [ Biome.SWAMP, PoolTier.COMMON ],
      [ Biome.SEA, PoolTier.UNCOMMON ],
      [ Biome.SWAMP, PoolTier.BOSS ]
    ]
  ],
  [ Species.CORPHISH, Type.WATER, -1, [
      [ Biome.WATER, PoolTier.UNCOMMON ],
      [ Biome.SEA, PoolTier.COMMON ]
    ]
  ],
  [ Species.CRAWDAUNT, Type.WATER, Type.DARK, [
      [ Biome.WATER, PoolTier.UNCOMMON ],
      [ Biome.SEA, PoolTier.COMMON ],
      [ Biome.SEA, PoolTier.BOSS ]
    ]
  ],
  [ Species.BALTOY, Type.GROUND, Type.PSYCHIC, [
      [ Biome.DESERT, PoolTier.UNCOMMON ],
      [ Biome.RUINS, PoolTier.COMMON ],
      [ Biome.SPACE, PoolTier.COMMON ]
    ]
  ],
  [ Species.CLAYDOL, Type.GROUND, Type.PSYCHIC, [
      [ Biome.DESERT, PoolTier.UNCOMMON ],
      [ Biome.RUINS, PoolTier.COMMON ],
      [ Biome.RUINS, PoolTier.BOSS ]
      [ Biome.SPACE, PoolTier.UNCOMMON ]
    ]
  ],
  [ Species.LILEEP, Type.ROCK, Type.GRASS, [
      [ Biome.DESERT, PoolTier.SUPER_RARE ]
    ]
  ],
  [ Species.CRADILY, Type.ROCK, Type.GRASS, [
      [ Biome.DESERT, PoolTier.SUPER_RARE ],
      [ Biome.DESERT, PoolTier.BOSS_RARE ]
    ]
  ],
  [ Species.ANORITH, Type.ROCK, Type.BUG, [
      [ Biome.DESERT, PoolTier.SUPER_RARE ]
    ]
  ],
  [ Species.ARMALDO, Type.ROCK, Type.BUG, [
      [ Biome.DESERT, PoolTier.SUPER_RARE ],
      [ Biome.DESERT, PoolTier.BOSS_RARE ]
    ]
  ],
  [ Species.FEEBAS, Type.WATER, -1, [
      [ Biome.SEA, PoolTier.ULTRA_RARE ]
    ]
  ],
  [ Species.MILOTIC, Type.WATER, -1, [
      [ Biome.SEA, PoolTier.BOSS_ULTRA_RARE ]
    ]
  ],
  [ Species.CASTFORM, Type.NORMAL, -1, [
      [ Biome.GRASS, PoolTier.SUPER_RARE ],
      [ Biome.GRASS, PoolTier.BOSS_RARE ]
    ]
  ],
  [ Species.KECLEON, Type.NORMAL, -1, [
      [ Biome.GRASS, PoolTier.RARE ],
      [ Biome.GRASS, PoolTier.BOSS ]
    ]
  ],
  [ Species.SHUPPET, Type.GHOST, -1, [
      [ Biome.GRAVEYARD, PoolTier.COMMON ]
    ]
  ],
  [ Species.BANETTE, Type.GHOST, -1, [
      [ Biome.GRAVEYARD, PoolTier.COMMON ],
      [ Biome.GRAVEYARD, PoolTier.BOSS ]
    ]
  ],
  [ Species.DUSKULL, Type.GHOST, -1, [
      [ Biome.GRAVEYARD, PoolTier.COMMON ]
    ]
  ],
  [ Species.DUSCLOPS, Type.GHOST, -1, [
      [ Biome.GRAVEYARD, PoolTier.COMMON ]
    ]
  ],
  [ Species.TROPIUS, Type.GRASS, Type.FLYING, [
      [ Biome.FOREST, PoolTier.RARE ],
      [ Biome.FOREST, PoolTier.BOSS ]
    ]
  ],
  [ Species.CHIMECHO, Type.PSYCHIC, -1, [
      [ Biome.RUINS, PoolTier.UNCOMMON ],
      [ Biome.SPACE, PoolTier.COMMON ],
      [ Biome.SPACE, PoolTier.BOSS ]
    ]
  ],
  [ Species.ABSOL, Type.DARK, -1, [
      [ Biome.ABYSS, PoolTier.RARE ],
      [ Biome.ABYSS, PoolTier.BOSS ]
    ]
  ],
  [ Species.WYNAUT, Type.PSYCHIC, -1, [
      [ Biome.PLAINS, PoolTier.SUPER_RARE ]
    ]
  ],
  [ Species.SNORUNT, Type.ICE, -1, [
      [ Biome.ICE_CAVE, PoolTier.UNCOMMON ]
    ]
  ],
  [ Species.GLALIE, Type.ICE, -1, [
      [ Biome.ICE_CAVE, PoolTier.UNCOMMON ],
      [ Biome.ICE_CAVE, PoolTier.BOSS ]
    ]
  ],
  [ Species.SPHEAL, Type.ICE, Type.WATER, [
      [ Biome.ICE_CAVE, PoolTier.COMMON ]
    ]
  ],
  [ Species.SEALEO, Type.ICE, Type.WATER, [
      [ Biome.ICE_CAVE, PoolTier.COMMON ]
    ]
  ],
  [ Species.WALREIN, Type.ICE, Type.WATER, [
      [ Biome.ICE_CAVE, PoolTier.COMMON ],
      [ Biome.ICE_CAVE, PoolTier.BOSS ]
    ]
  ],
  [ Species.CLAMPERL, Type.WATER, -1, [
      [ Biome.SEA, PoolTier.COMMON ]
    ]
  ],
  [ Species.HUNTAIL, Type.WATER, -1, [
      [ Biome.SEA, PoolTier.BOSS ]
    ]
  ],
  [ Species.GOREBYSS, Type.WATER, -1, [
      [ Biome.SEA, PoolTier.BOSS ]
    ]
  ],
  [ Species.RELICANTH, Type.WATER, Type.ROCK, [
      [ Biome.SEA, PoolTier.SUPER_RARE ],
      [ Biome.SEA, PoolTier.BOSS_RARE ]
    ]
  ],
  [ Species.LUVDISC, Type.WATER, -1, [
      [ Biome.SEA, PoolTier.UNCOMMON ],
      [ Biome.SEA, PoolTier.BOSS ]
    ]
  ],
  [ Species.BAGON, Type.DRAGON, -1, [
      [ Biome.WASTELAND, PoolTier.UNCOMMON ]
    ]
  ],
  [ Species.SHELGON, Type.DRAGON, -1, [
      [ Biome.WASTELAND, PoolTier.UNCOMMON ]
    ]
  ],
  [ Species.SALAMENCE, Type.DRAGON, Type.FLYING, [
      [ Biome.WASTELAND, PoolTier.UNCOMMON ],
      [ Biome.WASTELAND, PoolTier.BOSS ]
    ]
  ],
  [ Species.BELDUM, Type.STEEL, Type.PSYCHIC, [
      [ Biome.SPACE, PoolTier.RARE ]
    ]
  ],
  [ Species.METANG, Type.STEEL, Type.PSYCHIC, [
      [ Biome.SPACE, PoolTier.RARE ]
    ]
  ],
  [ Species.METAGROSS, Type.STEEL, Type.PSYCHIC, [
      [ Biome.SPACE, PoolTier.RARE ],
      [ Biome.SPACE, PoolTier.BOSS_RARE ]
    ]
  ],
  [ Species.REGIROCK, Type.ROCK, -1, [
      [ Biome.DESERT, PoolTier.BOSS_ULTRA_RARE ]
    ]
  ],
  [ Species.REGICE, Type.ICE, -1, [
      [ Biome.ICE_CAVE, PoolTier.BOSS_ULTRA_RARE ]
    ]
  ],
  [ Species.REGISTEEL, Type.STEEL, -1, [
      [ Biome.MOUNTAIN, PoolTier.BOSS_ULTRA_RARE ]
    ]
  ],
  [ Species.LATIAS, Type.DRAGON, Type.PSYCHIC, [
      [ Biome.GRASS, PoolTier.ULTRA_RARE ]
    ]
  ],
  [ Species.LATIOS, Type.DRAGON, Type.PSYCHIC, [
      [ Biome.GRASS, PoolTier.ULTRA_RARE ]
    ]
  ],
  [ Species.KYOGRE, Type.WATER, -1, [
      [ Biome.SEA, PoolTier.BOSS_LEGENDARY ]
    ]
  ],
  [ Species.GROUDON, Type.GROUND, -1, [
      [ Biome.LAND, PoolTier.BOSS_LEGENDARY ]
    ]
  ],
  [ Species.RAYQUAZA, Type.DRAGON, Type.FLYING, [
      [ Biome.MOUNTAIN, PoolTier.BOSS_LEGENDARY ]
    ]
  ],
  [ Species.JIRACHI, Type.STEEL, Type.PSYCHIC, [
      [ Biome.SPACE, PoolTier.BOSS_LEGENDARY ]
    ]
  ],
  [ Species.DEOXYS, Type.PSYCHIC, -1, [
      [ Biome.SPACE, PoolTier.BOSS_LEGENDARY ]
    ]
  ],
  [ Species.TURTWIG, Type.GRASS, -1, [
      [ Biome.FOREST, PoolTier.RARE ]
    ]
  ],
  [ Species.GROTLE, Type.GRASS, -1, [
      [ Biome.FOREST, PoolTier.RARE ]
    ]
  ],
  [ Species.TORTERRA, Type.GRASS, Type.GROUND, [
      [ Biome.FOREST, PoolTier.RARE ],
      [ Biome.FOREST, PoolTier.BOSS_RARE ]
    ]
  ],
  [ Species.CHIMCHAR, Type.FIRE, -1, [
      [ Biome.VOLCANO, PoolTier.RARE ]
    ]
  ],
  [ Species.MONFERNO, Type.FIRE, Type.FIGHTING, [
      [ Biome.VOLCANO, PoolTier.RARE ]
    ]
  ],
  [ Species.INFERNAPE, Type.FIRE, Type.FIGHTING, [
      [ Biome.VOLCANO, PoolTier.RARE ],
      [ Biome.VOLCANO, PoolTier.BOSS_RARE ]
    ]
  ],
  [ Species.PIPLUP, Type.WATER, -1, [
      [ Biome.WATER, PoolTier.RARE ]
    ]
  ],
  [ Species.PRINPLUP, Type.WATER, -1, [
      [ Biome.WATER, PoolTier.RARE ]
    ]
  ],
  [ Species.EMPOLEON, Type.WATER, Type.STEEL, [
      [ Biome.WATER, PoolTier.RARE ],
      [ Biome.WATER, PoolTier.BOSS_RARE ]
    ]
  ],
  [ Species.STARLY, Type.NORMAL, Type.FLYING, [
      [ Biome.PLAINS, PoolTier.COMMON ],
      [ Biome.GRASS, PoolTier.COMMON ],
      [ Biome.MOUNTAIN, PoolTier.COMMON ]
    ]
  ],
  [ Species.STARAVIA, Type.NORMAL, Type.FLYING, [
      [ Biome.GRASS, PoolTier.COMMON ],
      [ Biome.MOUNTAIN, PoolTier.COMMON ]
    ]
  ],
  [ Species.STARAPTOR, Type.NORMAL, Type.FLYING, [
      [ Biome.GRASS, PoolTier.COMMON ],
      [ Biome.MOUNTAIN, PoolTier.COMMON ]
    ]
  ],
  [ Species.BIDOOF, Type.NORMAL, -1, [
      [ Biome.PLAINS, PoolTier.COMMON ],
      [ Biome.GRASS, PoolTier.COMMON ]
    ]
  ],
  [ Species.BIBAREL, Type.NORMAL, Type.WATER, [
      [ Biome.GRASS, PoolTier.COMMON ]
    ]
  ],
  [ Species.KRICKETOT, Type.BUG, -1, [
      [ Biome.PLAINS, PoolTier.UNCOMMON ],
      [ Biome.GRASS, PoolTier.UNCOMMON ],
      [ Biome.FOREST, PoolTier.COMMON ]
    ]
  ],
  [ Species.KRICKETUNE, Type.BUG, -1, [
      [ Biome.GRASS, PoolTier.UNCOMMON ],
      [ Biome.FOREST, PoolTier.COMMON ]
    ]
  ],
  [ Species.SHINX, Type.ELECTRIC, -1, [
      [ Biome.GRASS, PoolTier.RARE ],
      [ Biome.POWER_PLANT, PoolTier.COMMON ]
    ]
  ],
  [ Species.LUXIO, Type.ELECTRIC, -1, [
      [ Biome.GRASS, PoolTier.RARE ],
      [ Biome.POWER_PLANT, PoolTier.COMMON ]
    ]
  ],
  [ Species.LUXRAY, Type.ELECTRIC, -1, [
      [ Biome.GRASS, PoolTier.RARE ],
      [ Biome.POWER_PLANT, PoolTier.COMMON ]
    ]
  ],
  [ Species.BUDEW, Type.GRASS, Type.POISON, [
      [ Biome.PLAINS, PoolTier.UNCOMMON ]
    ]
  ],
  [ Species.ROSERADE, Type.GRASS, Type.POISON, [
      [ Biome.GRASS, PoolTier.COMMON ],
      [ Biome.FOREST, PoolTier.UNCOMMON ]
    ]
  ],
  [ Species.CRANIDOS, Type.ROCK, -1, [
      [ Biome.MOUNTAIN, PoolTier.SUPER_RARE ]
    ]
  ],
  [ Species.RAMPARDOS, Type.ROCK, -1, [
      [ Biome.MOUNTAIN, PoolTier.SUPER_RARE ]
    ]
  ],
  [ Species.SHIELDON, Type.ROCK, Type.STEEL, [
      [ Biome.MOUNTAIN, PoolTier.SUPER_RARE ]
    ]
  ],
  [ Species.BASTIODON, Type.ROCK, Type.STEEL, [
      [ Biome.MOUNTAIN, PoolTier.SUPER_RARE ]
    ]
  ],
  [ Species.BURMY, Type.BUG, -1, [
      [ Biome.FOREST, PoolTier.UNCOMMON ]
    ]
  ],
  [ Species.WORMADAM, Type.BUG, Type.GRASS, [
      [ Biome.FOREST, PoolTier.UNCOMMON ]
    ]
  ],
  [ Species.MOTHIM, Type.BUG, Type.FLYING, [
      [ Biome.FOREST, PoolTier.UNCOMMON ]
    ]
  ],
  [ Species.COMBEE, Type.BUG, Type.FLYING, [
      [ Biome.PLAINS, PoolTier.UNCOMMON ],
      [ Biome.GRASS, PoolTier.UNCOMMON ],
      [ Biome.FOREST, PoolTier.COMMON ]
    ]
  ],
  [ Species.VESPIQUEN, Type.BUG, Type.FLYING, [
      [ Biome.GRASS, PoolTier.UNCOMMON ],
      [ Biome.FOREST, PoolTier.COMMON ]
    ]
  ],
  [ Species.PACHIRISU, Type.ELECTRIC, -1, [
      [ Biome.GRASS, PoolTier.RARE ]
      [ Biome.POWER_PLANT, PoolTier.UNCOMMON ]
    ]
  ],
  [ Species.BUIZEL, Type.WATER, -1, [
      [ Biome.WATER, PoolTier.COMMON ]
    ]
  ],
  [ Species.FLOATZEL, Type.WATER, -1, [
      [ Biome.WATER, PoolTier.COMMON ]
    ]
  ],
  [ Species.CHERUBI, Type.GRASS, -1, [
      [ Biome.PLAINS, PoolTier.UNCOMMON ],
      [ Biome.GRASS, PoolTier.UNCOMMON ],
      [ Biome.FOREST, PoolTier.COMMON ]
    ]
  ],
  [ Species.CHERRIM, Type.GRASS, -1, [
      [ Biome.PLAINS, PoolTier.UNCOMMON ],
      [ Biome.GRASS, PoolTier.UNCOMMON ],
      [ Biome.FOREST, PoolTier.COMMON ]
    ]
  ],
  [ Species.SHELLOS, Type.WATER, -1, [
      [ Biome.SWAMP, PoolTier.COMMON ],
      [ Biome.SEA, PoolTier.UNCOMMON ]
    ]
  ],
  [ Species.GASTRODON, Type.WATER, Type.GROUND, [
      [ Biome.SWAMP, PoolTier.COMMON ],
      [ Biome.SEA, PoolTier.UNCOMMON ]
    ]
  ],
  [ Species.AMBIPOM, Type.NORMAL, -1, [
      [ Biome.FOREST, PoolTier.UNCOMMON ]
    ]
  ],
  [ Species.DRIFLOON, Type.GHOST, Type.FLYING, [
      [ Biome.GRAVEYARD, PoolTier.UNCOMMON ]
    ]
  ],
  [ Species.DRIFBLIM, Type.GHOST, Type.FLYING, [
      [ Biome.GRAVEYARD, PoolTier.UNCOMMON ]
    ]
  ],
  [ Species.BUNEARY, Type.NORMAL, -1, [
      [ Biome.GRASS, PoolTier.RARE ]
    ]
  ],
  [ Species.LOPUNNY, Type.NORMAL, -1, [
      [ Biome.GRASS, PoolTier.RARE ]
    ]
  ],
  [ Species.MISMAGIUS, Type.GHOST, -1, [
      [ Biome.GRAVEYARD, PoolTier.UNCOMMON ]
    ]
  ],
  [ Species.HONCHKROW, Type.DARK, Type.FLYING, [
      [ Biome.MOUNTAIN, PoolTier.RARE ],
      [ Biome.ABYSS, PoolTier.UNCOMMON ]
    ]
  ],
  [ Species.GLAMEOW, Type.NORMAL, -1, [
      [ Biome.GRASS, PoolTier.UNCOMMON ]
    ]
  ],
  [ Species.PURUGLY, Type.NORMAL, -1, [
      [ Biome.GRASS, PoolTier.UNCOMMON ]
    ]
  ],
  [ Species.CHINGLING, Type.PSYCHIC, -1, [
      [ Biome.RUINS, PoolTier.UNCOMMON ],
      [ Biome.SPACE, PoolTier.COMMON ]
    ]
  ],
  [ Species.STUNKY, Type.POISON, Type.DARK, [
      [ Biome.FOREST, PoolTier.UNCOMMON ]
    ]
  ],
  [ Species.SKUNTANK, Type.POISON, Type.DARK, [
      [ Biome.FOREST, PoolTier.UNCOMMON ]
    ]
  ],
  [ Species.BRONZOR, Type.STEEL, Type.PSYCHIC, [
      [ Biome.RUINS, PoolTier.UNCOMMON ],
      [ Biome.SPACE, PoolTier.COMMON ]
    ]
  ],
  [ Species.BRONZONG, Type.STEEL, Type.PSYCHIC, [
      [ Biome.RUINS, PoolTier.UNCOMMON ],
      [ Biome.SPACE, PoolTier.COMMON ]
    ]
  ],
  [ Species.BONSLY, Type.ROCK, -1, [
      [ Biome.PLAINS, PoolTier.SUPER_RARE ]
    ]
  ],
  [ Species.MIME_JR, Type.PSYCHIC, Type.FAIRY, [
      [ Biome.PLAINS, PoolTier.SUPER_RARE ]
    ]
  ],
  [ Species.HAPPINY, Type.NORMAL, -1, [
      [ Biome.PLAINS, PoolTier.SUPER_RARE ]
    ]
  ],
  [ Species.CHATOT, Type.NORMAL, Type.FLYING, [
      [ Biome.FOREST, PoolTier.SUPER_RARE ]
    ]
  ],
  [ Species.SPIRITOMB, Type.GHOST, Type.DARK, [
      [ Biome.GRAVEYARD, PoolTier.SUPER_RARE ],
      [ Biome.ABYSS, PoolTier.RARE ]
    ]
  ],
  [ Species.GIBLE, Type.DRAGON, Type.GROUND, [
      [ Biome.MOUNTAIN, PoolTier.SUPER_RARE ],
      [ Biome.WASTELAND, PoolTier.UNCOMMON ]
    ]
  ],
  [ Species.GABITE, Type.DRAGON, Type.GROUND, [
      [ Biome.MOUNTAIN, PoolTier.SUPER_RARE ],
      [ Biome.WASTELAND, PoolTier.UNCOMMON ]
    ]
  ],
  [ Species.GARCHOMP, Type.DRAGON, Type.GROUND, [
      [ Biome.MOUNTAIN, PoolTier.SUPER_RARE ],
      [ Biome.WASTELAND, PoolTier.UNCOMMON ]
    ]
  ],
  [ Species.MUNCHLAX, Type.NORMAL, -1, [
      [ Biome.PLAINS, PoolTier.SUPER_RARE ]
    ]
  ],
  [ Species.RIOLU, Type.FIGHTING, -1, [
      [ Biome.PLAINS, PoolTier.SUPER_RARE ]
    ]
  ],
  [ Species.LUCARIO, Type.FIGHTING, Type.STEEL, [
      [ Biome.DOJO, PoolTier.RARE ]
    ]
  ],
  [ Species.HIPPOPOTAS, Type.GROUND, -1, [
      [ Biome.DESERT, PoolTier.COMMON ]
    ]
  ],
  [ Species.HIPPOWDON, Type.GROUND, -1, [
      [ Biome.DESERT, PoolTier.COMMON ]
    ]
  ],
  [ Species.SKORUPI, Type.POISON, Type.BUG, [
      [ Biome.SWAMP, PoolTier.COMMON ],
      [ Biome.DESERT, PoolTier.COMMON ]
    ]
  ],
  [ Species.DRAPION, Type.POISON, Type.DARK, [
      [ Biome.SWAMP, PoolTier.COMMON ],
      [ Biome.DESERT, PoolTier.COMMON ]
    ]
  ],
  [ Species.CROAGUNK, Type.POISON, Type.FIGHTING, [
      [ Biome.SWAMP, PoolTier.UNCOMMON ],
      [ Biome.DOJO, PoolTier.UNCOMMON ]
    ]
  ],
  [ Species.TOXICROAK, Type.POISON, Type.FIGHTING, [
      [ Biome.SWAMP, PoolTier.UNCOMMON ],
      [ Biome.DOJO, PoolTier.UNCOMMON ]
    ]
  ],
  [ Species.CARNIVINE, Type.GRASS, -1, [
      [ Biome.FOREST, PoolTier.RARE ]
    ]
  ],
  [ Species.FINNEON, Type.WATER, -1, [
      [ Biome.SEA, PoolTier.COMMON ]
    ]
  ],
  [ Species.LUMINEON, Type.WATER, -1, [
      [ Biome.SEA, PoolTier.COMMON ]
    ]
  ],
  [ Species.MANTYKE, Type.WATER, Type.FLYING, [
      [ Biome.SEA, PoolTier.RARE ]
    ]
  ],
  [ Species.SNOVER, Type.GRASS, Type.ICE, [
      [ Biome.ICE_CAVE, PoolTier.COMMON ]
    ]
  ],
  [ Species.ABOMASNOW, Type.GRASS, Type.ICE, [
      [ Biome.ICE_CAVE, PoolTier.COMMON ],
      [ Biome.ICE_CAVE, PoolTier.BOSS ]
    ]
  ],
  [ Species.WEAVILE, Type.DARK, Type.ICE, [
      [ Biome.ICE_CAVE, PoolTier.BOSS ]
    ]
  ],
  [ Species.MAGNEZONE, Type.ELECTRIC, Type.STEEL, [
      [ Biome.POWER_PLANT, PoolTier.BOSS ]
    ]
  ],
  [ Species.LICKILICKY, Type.NORMAL, -1, [
      [ Biome.GRASS, PoolTier.BOSS_RARE ]
    ]
  ],
  [ Species.RHYPERIOR, Type.GROUND, Type.ROCK, [
      [ Biome.LAND, PoolTier.BOSS ]
    ]
  ],
  [ Species.TANGROWTH, Type.GRASS, -1, [
      [ Biome.FOREST, PoolTier.BOSS ]
    ]
  ],
  [ Species.ELECTIVIRE, Type.ELECTRIC, -1, [
      [ Biome.POWER_PLANT, PoolTier.BOSS ]
    ]
  ],
  [ Species.MAGMORTAR, Type.FIRE, -1, [
      [ Biome.VOLCANO, PoolTier.BOSS ]
    ]
  ],
  [ Species.TOGEKISS, Type.FAIRY, Type.FLYING, [
      [ Biome.MEADOW, PoolTier.BOSS ]
    ]
  ],
  [ Species.YANMEGA, Type.BUG, Type.FLYING, [
      [ Biome.FOREST, PoolTier.BOSS ]
    ]
  ],
  [ Species.LEAFEON, Type.GRASS, -1, [
      [ Biome.FOREST, PoolTier.BOSS_RARE ]
    ]
  ],
  [ Species.GLACEON, Type.ICE, -1, [
      [ Biome.ICE_CAVE, PoolTier.BOSS_RARE ]
    ]
  ],
  [ Species.GLISCOR, Type.GROUND, Type.FLYING, [
      [ Biome.LAND, PoolTier.BOSS ]
    ]
  ],
  [ Species.MAMOSWINE, Type.ICE, Type.GROUND, [
      [ Biome.ICE_CAVE, PoolTier.UNCOMMON ]
    ]
  ],
  [ Species.PORYGON_Z, Type.NORMAL, -1, [
      [ Biome.SPACE, PoolTier.SUPER_RARE ]
    ]
  ],
  [ Species.GALLADE, Type.PSYCHIC, Type.FIGHTING, [
      [ Biome.DOJO, PoolTier.SUPER_RARE ],
      [ Biome.DOJO, PoolTier.BOSS_RARE ]
    ]
  ],
  [ Species.PROBOPASS, Type.ROCK, Type.STEEL, [
      [ Biome.MOUNTAIN, PoolTier.BOSS ]
    ]
  ],
  [ Species.DUSKNOIR, Type.GHOST, -1, [
      [ Biome.GRAVEYARD, PoolTier.BOSS ]
    ]
  ],
  [ Species.FROSLASS, Type.ICE, Type.GHOST, [
      [ Biome.ICE_CAVE, PoolTier.RARE ],
      [ Biome.ICE_CAVE, PoolTier.BOSS ]
    ]
  ],
  [ Species.ROTOM, Type.ELECTRIC, Type.GHOST, [
      [ Biome.POWER_PLANT, PoolTier.BOSS_ULTRA_RARE ]
    ]
  ],
  [ Species.UXIE, Type.PSYCHIC, -1, [
      [ Biome.WATER, PoolTier.BOSS_ULTRA_RARE ]
    ]
  ],
  [ Species.MESPRIT, Type.PSYCHIC, -1, [
      [ Biome.WATER, PoolTier.BOSS_ULTRA_RARE ]
    ]
  ],
  [ Species.AZELF, Type.PSYCHIC, -1, [
      [ Biome.WATER, PoolTier.BOSS_ULTRA_RARE ]
    ]
  ],
  [ Species.DIALGA, Type.STEEL, Type.DRAGON, [
      [ Biome.WASTELAND, PoolTier.BOSS_LEGENDARY ]
    ]
  ],
  [ Species.PALKIA, Type.WATER, Type.DRAGON, [
      [ Biome.ABYSS, PoolTier.BOSS_LEGENDARY ]
    ]
  ],
  [ Species.HEATRAN, Type.FIRE, Type.STEEL, [
      [ Biome.VOLCANO, PoolTier.BOSS_ULTRA_RARE ]
    ]
  ],
  [ Species.REGIGIGAS, Type.NORMAL, -1, [
      [ Biome.RUINS, PoolTier.BOSS_LEGENDARY ]
    ]
  ],
  [ Species.GIRATINA, Type.GHOST, Type.DRAGON, [
      [ Biome.GRAVEYARD, PoolTier.BOSS_LEGENDARY ]
    ]
  ],
  [ Species.CRESSELIA, Type.PSYCHIC, -1, [
      [ Biome.SPACE, PoolTier.BOSS_ULTRA_RARE ]
    ]
  ],
  [ Species.PHIONE, Type.WATER, -1, [
      [ Biome.SEA, PoolTier.ULTRA_RARE ]
    ]
  ],
  [ Species.MANAPHY, Type.WATER, -1, [
      [ Biome.SEA, PoolTier.BOSS_LEGENDARY ]
    ]
  ],
  [ Species.DARKRAI, Type.DARK, -1, [
      [ Biome.ABYSS, PoolTier.BOSS_LEGENDARY ]
    ]
  ],
  [ Species.SHAYMIN, Type.GRASS, -1, [
      [ Biome.FOREST, PoolTier.BOSS_LEGENDARY ]
    ]
  ],
  [ Species.ARCEUS, Type.NORMAL, -1, [
      [ Biome.SPACE, PoolTier.BOSS_LEGENDARY ]
    ]
  ],
  [ Species.VICTINI, Type.PSYCHIC, Type.FIRE, [
      [ Biome.RUINS, PoolTier.BOSS_LEGENDARY ]
    ]
  ],
  [ Species.SNIVY, Type.GRASS, -1, [
      [ Biome.FOREST, PoolTier.RARE ]
    ]
  ],
  [ Species.SERVINE, Type.GRASS, -1, [
      [ Biome.GRASS, PoolTier.COMMON ],
      [ Biome.FOREST, PoolTier.COMMON ],
      [ Biome.SWAMP, PoolTier.COMMON ]
    ]
  ],
  [ Species.SERPERIOR, Type.GRASS, -1, [
      [ Biome.GRASS, PoolTier.COMMON ],
      [ Biome.FOREST, PoolTier.COMMON ],
      [ Biome.SWAMP, PoolTier.COMMON ]
    ]
  ],
  [ Species.TEPIG, Type.FIRE, -1, [
      [ Biome.VOLCANO, PoolTier.COMMON ]
    ]
  ],
  [ Species.PIGNITE, Type.FIRE, Type.FIGHTING, [
      [ Biome.VOLCANO, PoolTier.COMMON ],
      [ Biome.DOJO, PoolTier.COMMON ]
    ]
  ],
  [ Species.EMBOAR, Type.FIRE, Type.FIGHTING, [
      [ Biome.VOLCANO, PoolTier.COMMON ],
      [ Biome.DOJO, PoolTier.COMMON ]
    ]
  ],
  [ Species.OSHAWOTT, Type.WATER, -1, [
      [ Biome.WATER, PoolTier.COMMON ],
      [ Biome.SWAMP, PoolTier.COMMON ],
      [ Biome.SEA, PoolTier.COMMON ]
    ]
  ],
  [ Species.DEWOTT, Type.WATER, -1, [
      [ Biome.WATER, PoolTier.COMMON ],
      [ Biome.SWAMP, PoolTier.COMMON ],
      [ Biome.SEA, PoolTier.COMMON ]
    ]
  ],
  [ Species.SAMUROTT, Type.WATER, -1, [
      [ Biome.WATER, PoolTier.COMMON ],
      [ Biome.SWAMP, PoolTier.COMMON ],
      [ Biome.SEA, PoolTier.COMMON ]
    ]
  ],
  [ Species.PATRAT, Type.NORMAL, -1, [
      [ Biome.PLAINS, PoolTier.COMMON ],
      [ Biome.GRASS, PoolTier.COMMON ]
    ]
  ],
  [ Species.WATCHOG, Type.NORMAL, -1, [
      [ Biome.GRASS, PoolTier.COMMON ]
    ]
  ],
  [ Species.LILLIPUP, Type.NORMAL, -1, [
      [ Biome.PLAINS, PoolTier.COMMON ],
      [ Biome.GRASS, PoolTier.COMMON ]
    ]
  ],
  [ Species.HERDIER, Type.NORMAL, -1, [
      [ Biome.GRASS, PoolTier.COMMON ]
    ]
  ],
  [ Species.STOUTLAND, Type.NORMAL, -1, [
      [ Biome.GRASS, PoolTier.COMMON ]
    ]
  ],
  [ Species.PURRLOIN, Type.DARK, -1, [
      [ Biome.ABYSS, PoolTier.COMMON ]
    ]
  ],
  [ Species.LIEPARD, Type.DARK, -1, [
      [ Biome.ABYSS, PoolTier.COMMON ]
    ]
  ],
  [ Species.PANSAGE, Type.GRASS, -1, [
      [ Biome.GRASS, PoolTier.COMMON ],
      [ Biome.FOREST, PoolTier.COMMON ],
      [ Biome.SWAMP, PoolTier.COMMON ]
    ]
  ],
  [ Species.SIMISAGE, Type.GRASS, -1, [
      [ Biome.GRASS, PoolTier.COMMON ],
      [ Biome.FOREST, PoolTier.COMMON ],
      [ Biome.SWAMP, PoolTier.COMMON ]
    ]
  ],
  [ Species.PANSEAR, Type.FIRE, -1, [
      [ Biome.VOLCANO, PoolTier.COMMON ]
    ]
  ],
  [ Species.SIMISEAR, Type.FIRE, -1, [
      [ Biome.VOLCANO, PoolTier.COMMON ]
    ]
  ],
  [ Species.PANPOUR, Type.WATER, -1, [
      [ Biome.WATER, PoolTier.COMMON ],
      [ Biome.SWAMP, PoolTier.COMMON ],
      [ Biome.SEA, PoolTier.COMMON ]
    ]
  ],
  [ Species.SIMIPOUR, Type.WATER, -1, [
      [ Biome.WATER, PoolTier.COMMON ],
      [ Biome.SWAMP, PoolTier.COMMON ],
      [ Biome.SEA, PoolTier.COMMON ]
    ]
  ],
  [ Species.MUNNA, Type.PSYCHIC, -1, [
      [ Biome.RUINS, PoolTier.COMMON ],
      [ Biome.SPACE, PoolTier.COMMON ]
    ]
  ],
  [ Species.MUSHARNA, Type.PSYCHIC, -1, [
      [ Biome.RUINS, PoolTier.COMMON ],
      [ Biome.SPACE, PoolTier.COMMON ]
    ]
  ],
  [ Species.PIDOVE, Type.NORMAL, Type.FLYING, [
      [ Biome.PLAINS, PoolTier.COMMON ],
      [ Biome.GRASS, PoolTier.COMMON ],
      [ Biome.MOUNTAIN, PoolTier.COMMON ]
    ]
  ],
  [ Species.TRANQUILL, Type.NORMAL, Type.FLYING, [
      [ Biome.GRASS, PoolTier.COMMON ],
      [ Biome.MOUNTAIN, PoolTier.COMMON ]
    ]
  ],
  [ Species.UNFEZANT, Type.NORMAL, Type.FLYING, [
      [ Biome.GRASS, PoolTier.COMMON ],
      [ Biome.MOUNTAIN, PoolTier.COMMON ]
    ]
  ],
  [ Species.BLITZLE, Type.ELECTRIC, -1, [
      [ Biome.GRASS, PoolTier.COMMON ],
      [ Biome.MOUNTAIN, PoolTier.COMMON ],
      [ Biome.POWER_PLANT, PoolTier.COMMON ]
    ]
  ],
  [ Species.ZEBSTRIKA, Type.ELECTRIC, -1, [
      [ Biome.GRASS, PoolTier.COMMON ],
      [ Biome.MOUNTAIN, PoolTier.COMMON ],
      [ Biome.POWER_PLANT, PoolTier.COMMON ]
    ]
  ],
  [ Species.ROGGENROLA, Type.ROCK, -1, [
      [ Biome.MOUNTAIN, PoolTier.COMMON ],
      [ Biome.CAVE, PoolTier.COMMON ],
      [ Biome.DESERT, PoolTier.COMMON ]
    ]
  ],
  [ Species.BOLDORE, Type.ROCK, -1, [
      [ Biome.MOUNTAIN, PoolTier.COMMON ],
      [ Biome.CAVE, PoolTier.COMMON ],
      [ Biome.DESERT, PoolTier.COMMON ]
    ]
  ],
  [ Species.GIGALITH, Type.ROCK, -1, [
      [ Biome.MOUNTAIN, PoolTier.COMMON ],
      [ Biome.CAVE, PoolTier.COMMON ],
      [ Biome.DESERT, PoolTier.COMMON ]
    ]
  ],
  [ Species.WOOBAT, Type.PSYCHIC, Type.FLYING, [
      [ Biome.MOUNTAIN, PoolTier.COMMON ],
      [ Biome.RUINS, PoolTier.COMMON ],
      [ Biome.SPACE, PoolTier.COMMON ]
    ]
  ],
  [ Species.SWOOBAT, Type.PSYCHIC, Type.FLYING, [
      [ Biome.MOUNTAIN, PoolTier.COMMON ],
      [ Biome.RUINS, PoolTier.COMMON ],
      [ Biome.SPACE, PoolTier.COMMON ]
    ]
  ],
  [ Species.DRILBUR, Type.GROUND, -1, [
      [ Biome.MOUNTAIN, PoolTier.COMMON ],
      [ Biome.LAND, PoolTier.COMMON ],
      [ Biome.DESERT, PoolTier.COMMON ]
    ]
  ],
  [ Species.EXCADRILL, Type.GROUND, Type.STEEL, [
      [ Biome.MOUNTAIN, PoolTier.COMMON ],
      [ Biome.LAND, PoolTier.COMMON ],
      [ Biome.DESERT, PoolTier.COMMON ]
    ]
  ],
  [ Species.AUDINO, Type.NORMAL, -1, [
      [ Biome.GRASS, PoolTier.COMMON ]
    ]
  ],
  [ Species.TIMBURR, Type.FIGHTING, -1, [
      [ Biome.DOJO, PoolTier.COMMON ]
    ]
  ],
  [ Species.GURDURR, Type.FIGHTING, -1, [
      [ Biome.DOJO, PoolTier.COMMON ]
    ]
  ],
  [ Species.CONKELDURR, Type.FIGHTING, -1, [
      [ Biome.DOJO, PoolTier.COMMON ]
    ]
  ],
  [ Species.TYMPOLE, Type.WATER, -1, [
      [ Biome.WATER, PoolTier.COMMON ],
      [ Biome.SWAMP, PoolTier.COMMON ],
      [ Biome.SEA, PoolTier.COMMON ]
    ]
  ],
  [ Species.PALPITOAD, Type.WATER, Type.GROUND, [
      [ Biome.WATER, PoolTier.COMMON ],
      [ Biome.SWAMP, PoolTier.COMMON ],
      [ Biome.SEA, PoolTier.COMMON ],
      [ Biome.MOUNTAIN, PoolTier.COMMON ],
      [ Biome.LAND, PoolTier.COMMON ],
      [ Biome.DESERT, PoolTier.COMMON ]
    ]
  ],
  [ Species.SEISMITOAD, Type.WATER, Type.GROUND, [
      [ Biome.WATER, PoolTier.COMMON ],
      [ Biome.SWAMP, PoolTier.COMMON ],
      [ Biome.SEA, PoolTier.COMMON ],
      [ Biome.MOUNTAIN, PoolTier.COMMON ],
      [ Biome.LAND, PoolTier.COMMON ],
      [ Biome.DESERT, PoolTier.COMMON ]
    ]
  ],
  [ Species.THROH, Type.FIGHTING, -1, [
      [ Biome.DOJO, PoolTier.COMMON ]
    ]
  ],
  [ Species.SAWK, Type.FIGHTING, -1, [
      [ Biome.DOJO, PoolTier.COMMON ]
    ]
  ],
  [ Species.SEWADDLE, Type.BUG, Type.GRASS, [
      [ Biome.GRASS, PoolTier.COMMON ],
      [ Biome.FOREST, PoolTier.COMMON ],
      [ Biome.SWAMP, PoolTier.COMMON ]
    ]
  ],
  [ Species.SWADLOON, Type.BUG, Type.GRASS, [
      [ Biome.GRASS, PoolTier.COMMON ],
      [ Biome.FOREST, PoolTier.COMMON ],
      [ Biome.SWAMP, PoolTier.COMMON ]
    ]
  ],
  [ Species.LEAVANNY, Type.BUG, Type.GRASS, [
      [ Biome.GRASS, PoolTier.COMMON ],
      [ Biome.FOREST, PoolTier.COMMON ],
      [ Biome.SWAMP, PoolTier.COMMON ]
    ]
  ],
  [ Species.VENIPEDE, Type.BUG, Type.POISON, [
      [ Biome.PLAINS, PoolTier.UNCOMMON ],
      [ Biome.GRASS, PoolTier.COMMON ],
      [ Biome.FOREST, PoolTier.COMMON ],
      [ Biome.SWAMP, PoolTier.COMMON ]
    ]
  ],
  [ Species.WHIRLIPEDE, Type.BUG, Type.POISON, [
      [ Biome.GRASS, PoolTier.COMMON ],
      [ Biome.FOREST, PoolTier.COMMON ],
      [ Biome.SWAMP, PoolTier.COMMON ]
    ]
  ],
  [ Species.SCOLIPEDE, Type.BUG, Type.POISON, [
      [ Biome.GRASS, PoolTier.COMMON ],
      [ Biome.FOREST, PoolTier.COMMON ],
      [ Biome.SWAMP, PoolTier.COMMON ]
    ]
  ],
  [ Species.COTTONEE, Type.GRASS, Type.FAIRY, [
      [ Biome.PLAINS, PoolTier.COMMON ],
      [ Biome.GRASS, PoolTier.COMMON ],
      [ Biome.FOREST, PoolTier.COMMON ],
      [ Biome.SWAMP, PoolTier.COMMON ],
      [ Biome.MEADOW, PoolTier.COMMON ]
    ]
  ],
  [ Species.WHIMSICOTT, Type.GRASS, Type.FAIRY, [
      [ Biome.GRASS, PoolTier.COMMON ],
      [ Biome.FOREST, PoolTier.COMMON ],
      [ Biome.SWAMP, PoolTier.COMMON ],
      [ Biome.MEADOW, PoolTier.COMMON ]
    ]
  ],
  [ Species.PETILIL, Type.GRASS, -1, [
      [ Biome.PLAINS, PoolTier.COMMON ],
      [ Biome.GRASS, PoolTier.COMMON ],
      [ Biome.FOREST, PoolTier.COMMON ],
      [ Biome.SWAMP, PoolTier.COMMON ]
    ]
  ],
  [ Species.LILLIGANT, Type.GRASS, -1, [
      [ Biome.GRASS, PoolTier.COMMON ],
      [ Biome.FOREST, PoolTier.COMMON ],
      [ Biome.SWAMP, PoolTier.COMMON ]
    ]
  ],
  [ Species.BASCULIN, Type.WATER, -1, [
      [ Biome.WATER, PoolTier.COMMON ],
      [ Biome.SWAMP, PoolTier.COMMON ],
      [ Biome.SEA, PoolTier.COMMON ]
    ]
  ],
  [ Species.SANDILE, Type.GROUND, Type.DARK, [
      [ Biome.MOUNTAIN, PoolTier.COMMON ],
      [ Biome.LAND, PoolTier.COMMON ],
      [ Biome.DESERT, PoolTier.COMMON ],
      [ Biome.ABYSS, PoolTier.COMMON ]
    ]
  ],
  [ Species.KROKOROK, Type.GROUND, Type.DARK, [
      [ Biome.MOUNTAIN, PoolTier.COMMON ],
      [ Biome.LAND, PoolTier.COMMON ],
      [ Biome.DESERT, PoolTier.COMMON ],
      [ Biome.ABYSS, PoolTier.COMMON ]
    ]
  ],
  [ Species.KROOKODILE, Type.GROUND, Type.DARK, [
      [ Biome.MOUNTAIN, PoolTier.COMMON ],
      [ Biome.LAND, PoolTier.COMMON ],
      [ Biome.DESERT, PoolTier.COMMON ],
      [ Biome.ABYSS, PoolTier.COMMON ]
    ]
  ],
  [ Species.DARUMAKA, Type.FIRE, -1, [
      [ Biome.VOLCANO, PoolTier.COMMON ]
    ]
  ],
  [ Species.DARMANITAN, Type.FIRE, -1, [
      [ Biome.VOLCANO, PoolTier.COMMON ]
    ]
  ],
  [ Species.MARACTUS, Type.GRASS, -1, [
      [ Biome.GRASS, PoolTier.COMMON ],
      [ Biome.FOREST, PoolTier.COMMON ],
      [ Biome.SWAMP, PoolTier.COMMON ]
    ]
  ],
  [ Species.DWEBBLE, Type.BUG, Type.ROCK, [
      [ Biome.GRASS, PoolTier.COMMON ],
      [ Biome.FOREST, PoolTier.COMMON ],
      [ Biome.MOUNTAIN, PoolTier.COMMON ],
      [ Biome.CAVE, PoolTier.COMMON ],
      [ Biome.DESERT, PoolTier.COMMON ]
    ]
  ],
  [ Species.CRUSTLE, Type.BUG, Type.ROCK, [
      [ Biome.GRASS, PoolTier.COMMON ],
      [ Biome.FOREST, PoolTier.COMMON ],
      [ Biome.MOUNTAIN, PoolTier.COMMON ],
      [ Biome.CAVE, PoolTier.COMMON ],
      [ Biome.DESERT, PoolTier.COMMON ]
    ]
  ],
  [ Species.SCRAGGY, Type.DARK, Type.FIGHTING, [
      [ Biome.DOJO, PoolTier.COMMON ],
      [ Biome.ABYSS, PoolTier.COMMON ]
    ]
  ],
  [ Species.SCRAFTY, Type.DARK, Type.FIGHTING, [
      [ Biome.DOJO, PoolTier.COMMON ],
      [ Biome.ABYSS, PoolTier.COMMON ]
    ]
  ],
  [ Species.SIGILYPH, Type.PSYCHIC, Type.FLYING, [
      [ Biome.MOUNTAIN, PoolTier.COMMON ],
      [ Biome.RUINS, PoolTier.COMMON ],
      [ Biome.SPACE, PoolTier.COMMON ]
    ]
  ],
  [ Species.YAMASK, Type.GHOST, -1, [
      [ Biome.GRAVEYARD, PoolTier.COMMON ]
    ]
  ],
  [ Species.COFAGRIGUS, Type.GHOST, -1, [
      [ Biome.GRAVEYARD, PoolTier.COMMON ]
    ]
  ],
  [ Species.TIRTOUGA, Type.WATER, Type.ROCK, [
      [ Biome.WATER, PoolTier.COMMON ],
      [ Biome.SWAMP, PoolTier.COMMON ],
      [ Biome.SEA, PoolTier.COMMON ],
      [ Biome.MOUNTAIN, PoolTier.COMMON ],
      [ Biome.CAVE, PoolTier.COMMON ],
      [ Biome.DESERT, PoolTier.COMMON ]
    ]
  ],
  [ Species.CARRACOSTA, Type.WATER, Type.ROCK, [
      [ Biome.WATER, PoolTier.COMMON ],
      [ Biome.SWAMP, PoolTier.COMMON ],
      [ Biome.SEA, PoolTier.COMMON ],
      [ Biome.MOUNTAIN, PoolTier.COMMON ],
      [ Biome.CAVE, PoolTier.COMMON ],
      [ Biome.DESERT, PoolTier.COMMON ]
    ]
  ],
  [ Species.ARCHEN, Type.ROCK, Type.FLYING, [
      [ Biome.MOUNTAIN, PoolTier.COMMON ],
      [ Biome.CAVE, PoolTier.COMMON ],
      [ Biome.DESERT, PoolTier.COMMON ]
    ]
  ],
  [ Species.ARCHEOPS, Type.ROCK, Type.FLYING, [
      [ Biome.MOUNTAIN, PoolTier.COMMON ],
      [ Biome.CAVE, PoolTier.COMMON ],
      [ Biome.DESERT, PoolTier.COMMON ]
    ]
  ],
  [ Species.TRUBBISH, Type.POISON, -1, [
      [ Biome.FOREST, PoolTier.COMMON ],
      [ Biome.SWAMP, PoolTier.COMMON ]
    ]
  ],
  [ Species.GARBODOR, Type.POISON, -1, [
      [ Biome.FOREST, PoolTier.COMMON ],
      [ Biome.SWAMP, PoolTier.COMMON ]
    ]
  ],
  [ Species.ZORUA, Type.DARK, -1, [
      [ Biome.ABYSS, PoolTier.COMMON ]
    ]
  ],
  [ Species.ZOROARK, Type.DARK, -1, [
      [ Biome.ABYSS, PoolTier.COMMON ]
    ]
  ],
  [ Species.MINCCINO, Type.NORMAL, -1, [
      [ Biome.PLAINS, PoolTier.COMMON ],
      [ Biome.GRASS, PoolTier.COMMON ]
    ]
  ],
  [ Species.CINCCINO, Type.NORMAL, -1, [
      [ Biome.GRASS, PoolTier.COMMON ]
    ]
  ],
  [ Species.GOTHITA, Type.PSYCHIC, -1, [
      [ Biome.RUINS, PoolTier.COMMON ],
      [ Biome.SPACE, PoolTier.COMMON ]
    ]
  ],
  [ Species.GOTHORITA, Type.PSYCHIC, -1, [
      [ Biome.RUINS, PoolTier.COMMON ],
      [ Biome.SPACE, PoolTier.COMMON ]
    ]
  ],
  [ Species.GOTHITELLE, Type.PSYCHIC, -1, [
      [ Biome.RUINS, PoolTier.COMMON ],
      [ Biome.SPACE, PoolTier.COMMON ]
    ]
  ],
  [ Species.SOLOSIS, Type.PSYCHIC, -1, [
      [ Biome.RUINS, PoolTier.COMMON ],
      [ Biome.SPACE, PoolTier.COMMON ]
    ]
  ],
  [ Species.DUOSION, Type.PSYCHIC, -1, [
      [ Biome.RUINS, PoolTier.COMMON ],
      [ Biome.SPACE, PoolTier.COMMON ]
    ]
  ],
  [ Species.REUNICLUS, Type.PSYCHIC, -1, [
      [ Biome.RUINS, PoolTier.COMMON ],
      [ Biome.SPACE, PoolTier.COMMON ]
    ]
  ],
  [ Species.DUCKLETT, Type.WATER, Type.FLYING, [
      [ Biome.PLAINS, PoolTier.RARE ],
      [ Biome.WATER, PoolTier.COMMON ],
      [ Biome.SWAMP, PoolTier.COMMON ],
      [ Biome.SEA, PoolTier.COMMON ],
      [ Biome.MOUNTAIN, PoolTier.COMMON ]
    ]
  ],
  [ Species.SWANNA, Type.WATER, Type.FLYING, [
      [ Biome.WATER, PoolTier.COMMON ],
      [ Biome.SWAMP, PoolTier.COMMON ],
      [ Biome.SEA, PoolTier.COMMON ],
      [ Biome.MOUNTAIN, PoolTier.COMMON ]
    ]
  ],
  [ Species.VANILLITE, Type.ICE, -1, [
      [ Biome.ICE_CAVE, PoolTier.COMMON ]
    ]
  ],
  [ Species.VANILLISH, Type.ICE, -1, [
      [ Biome.ICE_CAVE, PoolTier.COMMON ]
    ]
  ],
  [ Species.VANILLUXE, Type.ICE, -1, [
      [ Biome.ICE_CAVE, PoolTier.COMMON ]
    ]
  ],
  [ Species.DEERLING, Type.NORMAL, Type.GRASS, [
      [ Biome.GRASS, PoolTier.COMMON ],
      [ Biome.FOREST, PoolTier.COMMON ],
      [ Biome.SWAMP, PoolTier.COMMON ]
    ]
  ],
  [ Species.SAWSBUCK, Type.NORMAL, Type.GRASS, [
      [ Biome.GRASS, PoolTier.COMMON ],
      [ Biome.FOREST, PoolTier.COMMON ],
      [ Biome.SWAMP, PoolTier.COMMON ]
    ]
  ],
  [ Species.EMOLGA, Type.ELECTRIC, Type.FLYING, [
      [ Biome.GRASS, PoolTier.COMMON ],
      [ Biome.MOUNTAIN, PoolTier.COMMON ],
      [ Biome.POWER_PLANT, PoolTier.COMMON ]
    ]
  ],
  [ Species.KARRABLAST, Type.BUG, -1, [
      [ Biome.GRASS, PoolTier.COMMON ],
      [ Biome.FOREST, PoolTier.COMMON ]
    ]
  ],
  [ Species.ESCAVALIER, Type.BUG, Type.STEEL, [
      [ Biome.GRASS, PoolTier.COMMON ],
      [ Biome.FOREST, PoolTier.COMMON ],
      [ Biome.MOUNTAIN, PoolTier.COMMON ]
    ]
  ],
  [ Species.FOONGUS, Type.GRASS, Type.POISON, [
      [ Biome.PLAINS, PoolTier.COMMON ],
      [ Biome.GRASS, PoolTier.COMMON ],
      [ Biome.FOREST, PoolTier.COMMON ],
      [ Biome.SWAMP, PoolTier.COMMON ]
    ]
  ],
  [ Species.AMOONGUSS, Type.GRASS, Type.POISON, [
      [ Biome.GRASS, PoolTier.COMMON ],
      [ Biome.FOREST, PoolTier.COMMON ],
      [ Biome.SWAMP, PoolTier.COMMON ]
    ]
  ],
  [ Species.FRILLISH, Type.WATER, Type.GHOST, [
      [ Biome.WATER, PoolTier.COMMON ],
      [ Biome.SWAMP, PoolTier.COMMON ],
      [ Biome.SEA, PoolTier.COMMON ],
      [ Biome.GRAVEYARD, PoolTier.COMMON ]
    ]
  ],
  [ Species.JELLICENT, Type.WATER, Type.GHOST, [
      [ Biome.WATER, PoolTier.COMMON ],
      [ Biome.SWAMP, PoolTier.COMMON ],
      [ Biome.SEA, PoolTier.COMMON ],
      [ Biome.GRAVEYARD, PoolTier.COMMON ]
    ]
  ],
  [ Species.ALOMOMOLA, Type.WATER, -1, [
      [ Biome.WATER, PoolTier.COMMON ],
      [ Biome.SWAMP, PoolTier.COMMON ],
      [ Biome.SEA, PoolTier.COMMON ]
    ]
  ],
  [ Species.JOLTIK, Type.BUG, Type.ELECTRIC, [
      [ Biome.GRASS, PoolTier.COMMON ],
      [ Biome.FOREST, PoolTier.COMMON ],
      [ Biome.MOUNTAIN, PoolTier.COMMON ],
      [ Biome.POWER_PLANT, PoolTier.COMMON ]
    ]
  ],
  [ Species.GALVANTULA, Type.BUG, Type.ELECTRIC, [
      [ Biome.GRASS, PoolTier.COMMON ],
      [ Biome.FOREST, PoolTier.COMMON ],
      [ Biome.MOUNTAIN, PoolTier.COMMON ],
      [ Biome.POWER_PLANT, PoolTier.COMMON ]
    ]
  ],
  [ Species.FERROSEED, Type.GRASS, Type.STEEL, [
      [ Biome.GRASS, PoolTier.COMMON ],
      [ Biome.FOREST, PoolTier.COMMON ],
      [ Biome.SWAMP, PoolTier.COMMON ],
      [ Biome.MOUNTAIN, PoolTier.COMMON ]
    ]
  ],
  [ Species.FERROTHORN, Type.GRASS, Type.STEEL, [
      [ Biome.GRASS, PoolTier.COMMON ],
      [ Biome.FOREST, PoolTier.COMMON ],
      [ Biome.SWAMP, PoolTier.COMMON ],
      [ Biome.MOUNTAIN, PoolTier.COMMON ]
    ]
  ],
  [ Species.KLINK, Type.STEEL, -1, [
      [ Biome.MOUNTAIN, PoolTier.COMMON ]
    ]
  ],
  [ Species.KLANG, Type.STEEL, -1, [
      [ Biome.MOUNTAIN, PoolTier.COMMON ]
    ]
  ],
  [ Species.KLINKLANG, Type.STEEL, -1, [
      [ Biome.MOUNTAIN, PoolTier.COMMON ]
    ]
  ],
  [ Species.TYNAMO, Type.ELECTRIC, -1, [
      [ Biome.GRASS, PoolTier.COMMON ],
      [ Biome.MOUNTAIN, PoolTier.COMMON ],
      [ Biome.POWER_PLANT, PoolTier.COMMON ]
    ]
  ],
  [ Species.EELEKTRIK, Type.ELECTRIC, -1, [
      [ Biome.GRASS, PoolTier.COMMON ],
      [ Biome.MOUNTAIN, PoolTier.COMMON ],
      [ Biome.POWER_PLANT, PoolTier.COMMON ]
    ]
  ],
  [ Species.EELEKTROSS, Type.ELECTRIC, -1, [
      [ Biome.GRASS, PoolTier.COMMON ],
      [ Biome.MOUNTAIN, PoolTier.COMMON ],
      [ Biome.POWER_PLANT, PoolTier.COMMON ]
    ]
  ],
  [ Species.ELGYEM, Type.PSYCHIC, -1, [
      [ Biome.RUINS, PoolTier.COMMON ],
      [ Biome.SPACE, PoolTier.COMMON ]
    ]
  ],
  [ Species.BEHEEYEM, Type.PSYCHIC, -1, [
      [ Biome.RUINS, PoolTier.COMMON ],
      [ Biome.SPACE, PoolTier.COMMON ]
    ]
  ],
  [ Species.LITWICK, Type.GHOST, Type.FIRE, [
      [ Biome.VOLCANO, PoolTier.COMMON ],
      [ Biome.GRAVEYARD, PoolTier.COMMON ]
    ]
  ],
  [ Species.LAMPENT, Type.GHOST, Type.FIRE, [
      [ Biome.VOLCANO, PoolTier.COMMON ],
      [ Biome.GRAVEYARD, PoolTier.COMMON ]
    ]
  ],
  [ Species.CHANDELURE, Type.GHOST, Type.FIRE, [
      [ Biome.VOLCANO, PoolTier.COMMON ],
      [ Biome.GRAVEYARD, PoolTier.COMMON ]
    ]
  ],
  [ Species.AXEW, Type.DRAGON, -1, [
      [ Biome.WASTELAND, PoolTier.COMMON ]
    ]
  ],
  [ Species.FRAXURE, Type.DRAGON, -1, [
      [ Biome.WASTELAND, PoolTier.COMMON ]
    ]
  ],
  [ Species.HAXORUS, Type.DRAGON, -1, [
      [ Biome.WASTELAND, PoolTier.COMMON ]
    ]
  ],
  [ Species.CUBCHOO, Type.ICE, -1, [
      [ Biome.ICE_CAVE, PoolTier.COMMON ]
    ]
  ],
  [ Species.BEARTIC, Type.ICE, -1, [
      [ Biome.ICE_CAVE, PoolTier.COMMON ]
    ]
  ],
  [ Species.CRYOGONAL, Type.ICE, -1, [
      [ Biome.ICE_CAVE, PoolTier.COMMON ]
    ]
  ],
  [ Species.SHELMET, Type.BUG, -1, [
      [ Biome.GRASS, PoolTier.COMMON ],
      [ Biome.FOREST, PoolTier.COMMON ]
    ]
  ],
  [ Species.ACCELGOR, Type.BUG, -1, [
      [ Biome.GRASS, PoolTier.COMMON ],
      [ Biome.FOREST, PoolTier.COMMON ]
    ]
  ],
  [ Species.STUNFISK, Type.GROUND, Type.ELECTRIC, [
      [ Biome.GRASS, PoolTier.COMMON ],
      [ Biome.MOUNTAIN, PoolTier.COMMON ],
      [ Biome.LAND, PoolTier.COMMON ],
      [ Biome.DESERT, PoolTier.COMMON ],
      [ Biome.POWER_PLANT, PoolTier.COMMON ]
    ]
  ],
  [ Species.MIENFOO, Type.FIGHTING, -1, [
      [ Biome.DOJO, PoolTier.COMMON ]
    ]
  ],
  [ Species.MIENSHAO, Type.FIGHTING, -1, [
      [ Biome.DOJO, PoolTier.COMMON ]
    ]
  ],
  [ Species.DRUDDIGON, Type.DRAGON, -1, [
      [ Biome.WASTELAND, PoolTier.COMMON ]
    ]
  ],
  [ Species.GOLETT, Type.GROUND, Type.GHOST, [
      [ Biome.MOUNTAIN, PoolTier.COMMON ],
      [ Biome.LAND, PoolTier.COMMON ],
      [ Biome.DESERT, PoolTier.COMMON ],
      [ Biome.GRAVEYARD, PoolTier.COMMON ]
    ]
  ],
  [ Species.GOLURK, Type.GROUND, Type.GHOST, [
      [ Biome.MOUNTAIN, PoolTier.COMMON ],
      [ Biome.LAND, PoolTier.COMMON ],
      [ Biome.DESERT, PoolTier.COMMON ],
      [ Biome.GRAVEYARD, PoolTier.COMMON ]
    ]
  ],
  [ Species.PAWNIARD, Type.DARK, Type.STEEL, [
      [ Biome.MOUNTAIN, PoolTier.COMMON ],
      [ Biome.ABYSS, PoolTier.COMMON ]
    ]
  ],
  [ Species.BISHARP, Type.DARK, Type.STEEL, [
      [ Biome.MOUNTAIN, PoolTier.COMMON ],
      [ Biome.ABYSS, PoolTier.COMMON ]
    ]
  ],
  [ Species.BOUFFALANT, Type.NORMAL, -1, [
      [ Biome.GRASS, PoolTier.COMMON ]
    ]
  ],
  [ Species.RUFFLET, Type.NORMAL, Type.FLYING, [
      [ Biome.GRASS, PoolTier.COMMON ],
      [ Biome.MOUNTAIN, PoolTier.COMMON ]
    ]
  ],
  [ Species.BRAVIARY, Type.NORMAL, Type.FLYING, [
      [ Biome.GRASS, PoolTier.COMMON ],
      [ Biome.MOUNTAIN, PoolTier.COMMON ]
    ]
  ],
  [ Species.VULLABY, Type.DARK, Type.FLYING, [
      [ Biome.MOUNTAIN, PoolTier.COMMON ],
      [ Biome.ABYSS, PoolTier.COMMON ]
    ]
  ],
  [ Species.MANDIBUZZ, Type.DARK, Type.FLYING, [
      [ Biome.MOUNTAIN, PoolTier.COMMON ],
      [ Biome.ABYSS, PoolTier.COMMON ]
    ]
  ],
  [ Species.HEATMOR, Type.FIRE, -1, [
      [ Biome.VOLCANO, PoolTier.COMMON ]
    ]
  ],
  [ Species.DURANT, Type.BUG, Type.STEEL, [
      [ Biome.GRASS, PoolTier.COMMON ],
      [ Biome.FOREST, PoolTier.COMMON ],
      [ Biome.MOUNTAIN, PoolTier.COMMON ]
    ]
  ],
  [ Species.DEINO, Type.DARK, Type.DRAGON, [
      [ Biome.WASTELAND, PoolTier.COMMON ],
      [ Biome.ABYSS, PoolTier.COMMON ]
    ]
  ],
  [ Species.ZWEILOUS, Type.DARK, Type.DRAGON, [
      [ Biome.WASTELAND, PoolTier.COMMON ],
      [ Biome.ABYSS, PoolTier.COMMON ]
    ]
  ],
  [ Species.HYDREIGON, Type.DARK, Type.DRAGON, [
      [ Biome.WASTELAND, PoolTier.COMMON ],
      [ Biome.ABYSS, PoolTier.COMMON ]
    ]
  ],
  [ Species.LARVESTA, Type.BUG, Type.FIRE, [
      [ Biome.GRASS, PoolTier.COMMON ],
      [ Biome.FOREST, PoolTier.COMMON ],
      [ Biome.VOLCANO, PoolTier.COMMON ]
    ]
  ],
  [ Species.VOLCARONA, Type.BUG, Type.FIRE, [
      [ Biome.GRASS, PoolTier.COMMON ],
      [ Biome.FOREST, PoolTier.COMMON ],
      [ Biome.VOLCANO, PoolTier.COMMON ]
    ]
  ],
  [ Species.COBALION, Type.STEEL, Type.FIGHTING, [
      [ Biome.MOUNTAIN, PoolTier.COMMON ],
      [ Biome.DOJO, PoolTier.COMMON ]
    ]
  ],
  [ Species.TERRAKION, Type.ROCK, Type.FIGHTING, [
      [ Biome.MOUNTAIN, PoolTier.COMMON ],
      [ Biome.CAVE, PoolTier.COMMON ],
      [ Biome.DESERT, PoolTier.COMMON ],
      [ Biome.DOJO, PoolTier.COMMON ]
    ]
  ],
  [ Species.VIRIZION, Type.GRASS, Type.FIGHTING, [
      [ Biome.GRASS, PoolTier.COMMON ],
      [ Biome.FOREST, PoolTier.COMMON ],
      [ Biome.SWAMP, PoolTier.COMMON ],
      [ Biome.DOJO, PoolTier.COMMON ]
    ]
  ],
  [ Species.TORNADUS, Type.FLYING, -1, [
      [ Biome.MOUNTAIN, PoolTier.COMMON ]
    ]
  ],
  [ Species.THUNDURUS, Type.ELECTRIC, Type.FLYING, [
      [ Biome.GRASS, PoolTier.COMMON ],
      [ Biome.MOUNTAIN, PoolTier.COMMON ],
      [ Biome.POWER_PLANT, PoolTier.COMMON ]
    ]
  ],
  [ Species.RESHIRAM, Type.DRAGON, Type.FIRE, [
      [ Biome.VOLCANO, PoolTier.COMMON ],
      [ Biome.WASTELAND, PoolTier.COMMON ]
    ]
  ],
  [ Species.ZEKROM, Type.DRAGON, Type.ELECTRIC, [
      [ Biome.GRASS, PoolTier.COMMON ],
      [ Biome.MOUNTAIN, PoolTier.COMMON ],
      [ Biome.POWER_PLANT, PoolTier.COMMON ],
      [ Biome.WASTELAND, PoolTier.COMMON ]
    ]
  ],
  [ Species.LANDORUS, Type.GROUND, Type.FLYING, [
      [ Biome.MOUNTAIN, PoolTier.COMMON ],
      [ Biome.LAND, PoolTier.COMMON ],
      [ Biome.DESERT, PoolTier.COMMON ]
    ]
  ],
  [ Species.KYUREM, Type.DRAGON, Type.ICE, [
      [ Biome.ICE_CAVE, PoolTier.COMMON ],
      [ Biome.WASTELAND, PoolTier.COMMON ]
    ]
  ],
  [ Species.KELDEO, Type.WATER, Type.FIGHTING, [
      [ Biome.WATER, PoolTier.COMMON ],
      [ Biome.SWAMP, PoolTier.COMMON ],
      [ Biome.SEA, PoolTier.COMMON ],
      [ Biome.DOJO, PoolTier.COMMON ]
    ]
  ],
  [ Species.MELOETTA, Type.NORMAL, Type.PSYCHIC, [
      [ Biome.GRASS, PoolTier.COMMON ],
      [ Biome.RUINS, PoolTier.COMMON ],
      [ Biome.SPACE, PoolTier.COMMON ]
    ]
  ],
  [ Species.GENESECT, Type.BUG, Type.STEEL, [
      [ Biome.GRASS, PoolTier.COMMON ],
      [ Biome.FOREST, PoolTier.COMMON ],
      [ Biome.MOUNTAIN, PoolTier.COMMON ]
    ]
  ]
];

/*for (let pokemon of allSpecies) {
  if (pokemon.speciesId >= Species.XERNEAS)
    break;
  pokemonBiomes[pokemon.speciesId - 1][0] = Species[pokemonBiomes[pokemon.speciesId - 1][0]];
  pokemonBiomes[pokemon.speciesId - 1][1] = Type[pokemonBiomes[pokemon.speciesId - 1][1]];
  if (pokemonBiomes[pokemon.speciesId - 1][2] > -1)
    pokemonBiomes[pokemon.speciesId - 1][2] = Type[pokemonBiomes[pokemon.speciesId - 1][2]];
  for (let b of Utils.getEnumValues(Biome)) {
    if (biomePools.hasOwnProperty(b)) {
      let poolTier = -1;
      for (let t of Object.keys(biomePools[b])) {
        for (let p = 0; p < biomePools[b][t].length; p++) {
          if (biomePools[b][t][p] === pokemon.speciesId) {
            console.log(t, pokemon.name)
            poolTier = parseInt(t) as PoolTier;
            break;
          }
        }
      }
      if (poolTier > -1)
        pokemonBiomes[pokemon.speciesId - 1][3].push([ Biome[b], PoolTier[poolTier] ]);
    } else if (biomePoolPredicates[b](pokemon)) {
      pokemonBiomes[pokemon.speciesId - 1][3].push([ Biome[b], PoolTier[PoolTier.COMMON] ]);
    }
  }
}

console.log(JSON.stringify(pokemonBiomes, null, '  '));*/