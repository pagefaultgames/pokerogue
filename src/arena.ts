import BattleScene from "./battle-scene";
import { default as PokemonSpecies, allSpecies, getPokemonSpecies } from "./pokemon-species";
import { Stat } from "./pokemon-stat";
import { Species } from "./species";
import { Type } from './type';
import * as Utils from './utils';

export enum ArenaType {
  PLAINS = 1,
  GRASS,
  FOREST,
  WATER,
  SWAMP,
  SEA,
  MOUNTAIN,
  LAND,
  CAVE,
  DESERT,
  ARENA_BROWN,
  ARENA_PURPLE,
  ARENA_BLUE,
  ARENA_ORANGE,
  ARENA_PINK
};

enum PoolTier {
  COMMON,
  UNCOMMON,
  RARE,
  ULTRA_RARE,
  LEGENDARY
};

export class Arena {
  private scene: BattleScene;
  public arenaType: integer;
  private bgm: string;

  private pokemonPool: PokemonSpecies[][];

  constructor(scene: BattleScene, arenaType: integer, bgm: string) {
    this.scene = scene;
    this.arenaType = arenaType;
    this.bgm = bgm;

    if (arenaPools.hasOwnProperty(arenaType))
      this.pokemonPool = arenaPools[arenaType];
    else {
      const predicate = arenaPoolPredicates[arenaType] || (() => {});
      this.pokemonPool =  Utils.getEnumValues(PoolTier).map(t => allSpecies.filter(p => predicate(p, t)));
    }
  }
  randomSpecies(waveIndex: integer): PokemonSpecies {
    const tierValue = Utils.randInt(512);
    const tier = tierValue >= 156 ? PoolTier.COMMON : tierValue >= 32 ? PoolTier.UNCOMMON : tierValue >= 6 ? PoolTier.RARE : tierValue >= 1 ? PoolTier.ULTRA_RARE : PoolTier.LEGENDARY;
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

const arenaPools = {
  [ArenaType.PLAINS]: {
    [PoolTier.COMMON]: [ Species.CATERPIE, Species.METAPOD, Species.WEEDLE, Species.KAKUNA, Species.PIDGEY, Species.RATTATA, Species.SPEAROW, Species.SENTRET, Species.HOOTHOOT, Species.HOPPIP, Species.SUNKERN, Species.POOCHYENA, Species.ZIGZAGOON, Species.WURMPLE, Species.SILCOON, Species.CASCOON, Species.TAILLOW, Species.STARLY, Species.BIDOOF, Species.KRICKETOT, Species.PATRAT, Species.LILLIPUP, Species.PIDOVE, Species.COTTONEE, Species.PETILIL, Species.MINCCINO, Species.FOONGUS ],
    [PoolTier.UNCOMMON]: [ Species.EKANS, Species.NIDORAN_F, Species.NIDORAN_M, Species.PARAS, Species.VENONAT, Species.MEOWTH, Species.BELLSPROUT, Species.LEDYBA, Species.SPINARAK, Species.PINECO, Species.LOTAD, Species.SEEDOT, Species.SHROOMISH, Species.NINCADA, Species.AZURILL, Species.WHISMUR, Species.SKITTY, Species.GULPIN, Species.BUDEW, Species.BURMY, Species.COMBEE, Species.CHERUBI, Species.VENIPEDE ],
    [PoolTier.RARE]: [ Species.PICHU, Species.CLEFFA, Species.IGGLYBUFF, Species.WOOPER, Species.RALTS, Species.SURSKIT, Species.SLAKOTH, Species.BARBOACH, Species.DUCKLETT ],
    [PoolTier.ULTRA_RARE]: [ Species.EEVEE, Species.TOGEPI, Species.TYROGUE ],
    [PoolTier.LEGENDARY]: [ Species.DITTO ] 
  }
};

const arenaPoolPredicates = {
  [ArenaType.PLAINS]: (p, t) => {
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
  [ArenaType.GRASS]: (p, t) => {
    switch (t) {
      case PoolTier.ULTRA_RARE:
        return [ Species.ENTEI, Species.SUICUNE, Species.RAIKOU, Species.LATIOS, Species.LATIAS ].map(s => getPokemonSpecies(s));
      case PoolTier.LEGENDARY:
        return [ Species.MEW ].map(s => getPokemonSpecies(s));
    }
    return p.isOfType(Type.NORMAL) || p.isOfType(Type.FAIRY) || p.isOfType(Type.GRASS) || p.isOfType(Type.BUG) || p.isOfType(Type.ELECTRIC);
  },
  [ArenaType.FOREST]: (p, t) => {
    switch (t) {
      case PoolTier.LEGENDARY:
        return getPokemonSpecies(Species.CELEBI);
    }
    return p.isOfType(Type.GRASS) || p.isOfType(Type.BUG) || p.isOfType(Type.POISON);
  },
  [ArenaType.WATER]: (p, t) => {
    switch (t) {
      case PoolTier.ULTRA_RARE:
        return [ Species.UXIE, Species.MESPRIT, Species.AZELF ].map(s => getPokemonSpecies(s));
    }
    return p.isOfType(Type.WATER)
  },
  [ArenaType.SWAMP]: (p, t) => {
    return p.isOfType(Type.GRASS) || p.isOfType(Type.WATER) || p.isOfType(Type.POISON);
  },
  [ArenaType.SEA]: (p, t) => {
    switch (t) {
      case PoolTier.ULTRA_RARE:
        return [ Species.KYOGRE ].map(s => getPokemonSpecies(s));
      case PoolTier.LEGENDARY:
        return [ Species.LUGIA ].map(s => getPokemonSpecies(s)); 
    }
    return p.isOfType(Type.WATER);
  },
  [ArenaType.MOUNTAIN]: (p, t) => {
    switch (t) {
      case PoolTier.ULTRA_RARE:
        return [ Species.ARTICUNO, Species.ZAPDOS, Species.MOLTRES ].map(s => getPokemonSpecies(s));
        break;
      case PoolTier.LEGENDARY:
        return [ Species.HO_OH, Species.RAYQUAZA ].map(s => getPokemonSpecies(s));
    }
    return p.isOfType(Type.FLYING) || p.isOfType(Type.GROUND) || p.isOfType(Type.ROCK) || p.isOfType(Type.ELECTRIC) || p.isOfType(Type.STEEL);
  },
  [ArenaType.LAND]: (p, t) => {
    switch (t) {
      case PoolTier.ULTRA_RARE:
        return [ Species.GROUDON ].map(s => getPokemonSpecies(s));
    }
    return p.isOfType(Type.GROUND);
  },
  [ArenaType.CAVE]: (p, t) => {
    switch (t) {
      case PoolTier.ULTRA_RARE:
        return [ Species.REGIROCK, Species.REGICE, Species.REGISTEEL ].map(s => getPokemonSpecies(s));
      case PoolTier.LEGENDARY:
        return [ Species.MEWTWO, Species.REGIGIGAS ].map(s => getPokemonSpecies(s));
    }
    return p.isOfType(Type.ROCK);
  },
  [ArenaType.DESERT]: (p, t) => {
    return p.isOfType(Type.GROUND) || p.isOfType(Type.ROCK);
  },
  [ArenaType.ARENA_PINK]: (p, t) => {
    return p.legendary || p.mythical;
  }
};