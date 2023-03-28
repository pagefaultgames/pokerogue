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
  public type: integer;
  private bgm: string;

  private pokemonPool: PokemonSpecies[][];

  constructor(scene: BattleScene, type: integer, bgm: string) {
    this.scene = scene;
    this.type = type;
    this.bgm = bgm;

    const predicate = arenaPoolPredicates[type] || (() => {});
    this.pokemonPool = Utils.getEnumValues(PoolTier).map(t => allSpecies.filter(p => predicate(p, t)));
  }

  randomSpecies(waveIndex: integer): PokemonSpecies {
    const tier: PoolTier = Utils.randInt(5);
    const tierPool = this.pokemonPool[tier];
    let ret: PokemonSpecies;
    if (!tierPool.length)
      ret = this.scene.randomSpecies();
    else
      ret = tierPool[Utils.randInt(tierPool.length)];
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