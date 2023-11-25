import BattleScene from "./battle-scene";
import { Biome, BiomePoolTier, BiomeTierPokemonPools, BiomeTierTrainerPools, biomePokemonPools, biomeTrainerPools } from "./data/biome";
import * as Utils from "./utils";
import PokemonSpecies, { getPokemonSpecies } from "./data/pokemon-species";
import { Species } from "./data/species";
import { Weather, WeatherType, getWeatherClearMessage, getWeatherStartMessage } from "./data/weather";
import { CommonAnimPhase } from "./battle-phases";
import { CommonAnim } from "./data/battle-anims";
import { Type } from "./data/type";
import Move, { Moves } from "./data/move";
import { ArenaTag, ArenaTagType, getArenaTag } from "./data/arena-tag";
import { GameMode } from "./game-mode";
import { TrainerType } from "./data/trainer-type";

const WEATHER_OVERRIDE = WeatherType.NONE;

export class Arena {
  public scene: BattleScene;
  public biomeType: Biome;
  public weather: Weather;
  public tags: ArenaTag[];
  public bgm: string;

  private pokemonPool: BiomeTierPokemonPools;
  private trainerPool: BiomeTierTrainerPools;

  constructor(scene: BattleScene, biome: Biome, bgm: string) {
    this.scene = scene;
    this.biomeType = biome;
    this.tags = [];
    this.bgm = bgm;
    this.pokemonPool = biomePokemonPools[biome];
    this.trainerPool = biomeTrainerPools[biome];
  }

  randomSpecies(waveIndex: integer, level: integer, attempt?: integer): PokemonSpecies {
    const isBoss = (waveIndex % 10 === 0 || (this.scene.gameMode !== GameMode.CLASSIC && Utils.randSeedInt(100) < Math.min(Math.max(Math.ceil((waveIndex - 250) / 50), 0) * 2, 30))) && !!this.pokemonPool[BiomePoolTier.BOSS].length
      && (this.biomeType !== Biome.END || this.scene.gameMode === GameMode.CLASSIC || waveIndex % 250 === 0);
    const tierValue = Utils.randSeedInt(!isBoss ? 512 : 64);
    let tier = !isBoss
      ? tierValue >= 156 ? BiomePoolTier.COMMON : tierValue >= 32 ? BiomePoolTier.UNCOMMON : tierValue >= 6 ? BiomePoolTier.RARE : tierValue >= 1 ? BiomePoolTier.SUPER_RARE : BiomePoolTier.ULTRA_RARE
      : tierValue >= 20 ? BiomePoolTier.BOSS : tierValue >= 6 ? BiomePoolTier.BOSS_RARE : tierValue >= 1 ? BiomePoolTier.BOSS_SUPER_RARE : BiomePoolTier.BOSS_ULTRA_RARE;
    console.log(BiomePoolTier[tier]);
    while (!this.pokemonPool[tier].length) {
      console.log(`Downgraded rarity tier from ${BiomePoolTier[tier]} to ${BiomePoolTier[tier - 1]}`);
      tier--;
    }
    const tierPool = this.pokemonPool[tier];
    let ret: PokemonSpecies;
    let regen = false;
    if (!tierPool.length)
      ret = this.scene.randomSpecies(waveIndex, level);
    else {
      const entry = tierPool[Utils.randSeedInt(tierPool.length)];
      let species: Species;
      if (typeof entry === 'number')
        species = entry as Species;
      else {
        const levelThresholds = Object.keys(entry);
        for (let l = levelThresholds.length - 1; l >= 0; l--) {
          const levelThreshold = parseInt(levelThresholds[l]);
          if (level >= levelThreshold) {
            const speciesIds = entry[levelThreshold];
            if (speciesIds.length > 1)
              species = speciesIds[Utils.randSeedInt(speciesIds.length)];
            else
              species = speciesIds[0];
            break;
          }
        }
      }
      
      ret = getPokemonSpecies(species);

      if (ret.pseudoLegendary || ret.legendary || ret.mythical) {
        switch (true) {
          case (ret.baseTotal >= 720):
            regen = level < 90;
            break;
          case (ret.baseTotal >= 670):
            regen = level < 70;
            break;
          case (ret.baseTotal >= 580):
            regen = level < 50;
            break;
          default:
            regen = level < 30;
            break;
        }
      }
    }

    if (regen && (attempt || 0) < 10) {
      console.log('Incompatible level: regenerating...');
      return this.randomSpecies(waveIndex, level, (attempt || 0) + 1);
    }

    const newSpeciesId = ret.getSpeciesForLevel(level, true);
    if (newSpeciesId !== ret.speciesId) {
      console.log('Replaced', Species[ret.speciesId], 'with', Species[newSpeciesId]);
      ret = getPokemonSpecies(newSpeciesId);
    }
    return ret;
  }

  randomTrainerType(waveIndex: integer): TrainerType {
    const isBoss = waveIndex > 20 && !(waveIndex % 30) && !!this.trainerPool[BiomePoolTier.BOSS].length
      && (this.biomeType !== Biome.END || this.scene.gameMode === GameMode.CLASSIC || waveIndex % 250 === 0);
    const tierValue = Utils.randSeedInt(!isBoss ? 512 : 64);
    let tier = !isBoss
      ? tierValue >= 156 ? BiomePoolTier.COMMON : tierValue >= 32 ? BiomePoolTier.UNCOMMON : tierValue >= 6 ? BiomePoolTier.RARE : tierValue >= 1 ? BiomePoolTier.SUPER_RARE : BiomePoolTier.ULTRA_RARE
      : tierValue >= 20 ? BiomePoolTier.BOSS : tierValue >= 6 ? BiomePoolTier.BOSS_RARE : tierValue >= 1 ? BiomePoolTier.BOSS_SUPER_RARE : BiomePoolTier.BOSS_ULTRA_RARE;
    console.log(BiomePoolTier[tier]);
    while (tier && !this.trainerPool[tier].length) {
      console.log(`Downgraded trainer rarity tier from ${BiomePoolTier[tier]} to ${BiomePoolTier[tier - 1]}`);
      tier--;
    }
    const tierPool = this.trainerPool[tier] || [];
    return !tierPool.length ? TrainerType.BREEDER : tierPool[Utils.randSeedInt(tierPool.length)];
  }

  getSpeciesFormIndex(species: PokemonSpecies): integer {
    switch (species.speciesId) {
      case Species.BURMY:
      case Species.WORMADAM:
        switch (this.biomeType) {
          case Biome.BEACH:
            return 1;
          case Biome.CITY:
            return 2;
        }
        break;
    }

    return 0;
  }

  getTypeForBiome() {
    switch (this.biomeType) {
      case Biome.TOWN:
      case Biome.PLAINS:
        return Type.NORMAL;
      case Biome.GRASS:
      case Biome.TALL_GRASS:
        return Type.GRASS;
      case Biome.FOREST:
        return Type.BUG;
      case Biome.CITY:
      case Biome.SWAMP:
        return Type.POISON;
      case Biome.SEA:
      case Biome.BEACH:
      case Biome.LAKE:
      case Biome.SEABED:
        return Type.WATER;
      case Biome.MOUNTAIN:
        return Type.FLYING;
      case Biome.BADLANDS:
        return Type.GROUND;
      case Biome.CAVE:
      case Biome.DESERT:
        return Type.ROCK;
      case Biome.ICE_CAVE:
        return Type.ICE;
      case Biome.MEADOW:
        return Type.FAIRY;
      case Biome.POWER_PLANT:
        return Type.ELECTRIC;
      case Biome.VOLCANO:
        return Type.FIRE;
      case Biome.GRAVEYARD:
        return Type.GHOST;
      case Biome.DOJO:
        return Type.FIGHTING;
      case Biome.FACTORY:
        return Type.STEEL;
      case Biome.RUINS:
      case Biome.SPACE:
        return Type.PSYCHIC;
      case Biome.WASTELAND:
      case Biome.END:
        return Type.DRAGON;
      case Biome.ABYSS:
        return Type.DARK;
    }
  }

  trySetWeatherOverride(weather: WeatherType): boolean {
    this.weather = new Weather(weather, 0);
    this.scene.unshiftPhase(new CommonAnimPhase(this.scene, undefined, undefined, CommonAnim.SUNNY + (weather - 1)));
    this.scene.queueMessage(getWeatherStartMessage(weather));
    return true
  }

  trySetWeather(weather: WeatherType, viaMove: boolean): boolean {
    // override hook for debugging
    if (WEATHER_OVERRIDE) {
      return this.trySetWeatherOverride(WEATHER_OVERRIDE);
    }
    
    if (this.weather?.weatherType === (weather || undefined))
      return false;

    const oldWeatherType = this.weather?.weatherType || WeatherType.NONE;

    this.weather = weather ? new Weather(weather, viaMove ? 5 : 0) : null;
    
    if (this.weather) {
      this.scene.unshiftPhase(new CommonAnimPhase(this.scene, undefined, undefined, CommonAnim.SUNNY + (weather - 1)));
      this.scene.queueMessage(getWeatherStartMessage(weather));
    } else
      this.scene.queueMessage(getWeatherClearMessage(oldWeatherType));
    
    return true;
  }

  isMoveWeatherCancelled(move: Move) {
    return this.weather && !this.weather.isEffectSuppressed(this.scene) && this.weather.isMoveWeatherCancelled(move);
  }

  getAttackTypeMultiplier(attackType: Type): number {
    if (!this.weather || this.weather.isEffectSuppressed(this.scene))
      return 1;

    return this.weather.getAttackTypeMultiplier(attackType);
  }

  getTrainerChance(): integer {
    switch (this.biomeType) {
      case Biome.CITY:
      case Biome.BEACH:
      case Biome.DOJO:
      case Biome.CONSTRUCTION_SITE:
        return 4;
      case Biome.PLAINS:
      case Biome.GRASS:
      case Biome.LAKE:
      case Biome.CAVE:
        return 6;
      case Biome.TALL_GRASS:
      case Biome.FOREST:
      case Biome.SEA:
      case Biome.SWAMP:
      case Biome.MOUNTAIN:
      case Biome.BADLANDS:
      case Biome.DESERT:
      case Biome.MEADOW:
      case Biome.POWER_PLANT:
      case Biome.GRAVEYARD:
      case Biome.FACTORY:
        return 8;
      case Biome.ICE_CAVE:
      case Biome.VOLCANO:
      case Biome.RUINS:
      case Biome.WASTELAND:
      case Biome.JUNGLE:
        return 12;
      case Biome.SEABED:
      case Biome.ABYSS:
      case Biome.SPACE:
        return 16;
      default:
        return 0;
    }
  }

  isDaytime(): boolean {
    switch (this.biomeType) {
      case Biome.TOWN:
      case Biome.PLAINS:
      case Biome.GRASS:
      case Biome.SEA:
      case Biome.BEACH:
      case Biome.LAKE:
      case Biome.MOUNTAIN:
      case Biome.BADLANDS:
      case Biome.DESERT:
      case Biome.MEADOW:
      case Biome.DOJO:
      case Biome.CONSTRUCTION_SITE:
        return true;
    }
  }

  applyTags(tagType: ArenaTagType | { new(...args: any[]): ArenaTag }, ...args: any[]): void {
    const tags = typeof tagType === 'number'
      ? this.tags.filter(t => t.tagType === tagType)
      : this.tags.filter(t => t instanceof tagType);
    tags.forEach(t => t.apply(args));
	}

  addTag(tagType: ArenaTagType, turnCount: integer, sourceMove: Moves, sourceId: integer): boolean {
    const existingTag = this.getTag(tagType);
    if (existingTag) {
      existingTag.onOverlap(this);
      return false;
    }

    const newTag = getArenaTag(tagType, turnCount || 0, sourceMove, sourceId);
    this.tags.push(newTag);
    newTag.onAdd(this);

    return true;
  }

  getTag(tagType: ArenaTagType | { new(...args: any[]): ArenaTag }): ArenaTag {
    return typeof(tagType) === 'number'
      ? this.tags.find(t => t.tagType === tagType)
      : this.tags.find(t => t instanceof tagType);
  }

  lapseTags(): void {
    const tags = this.tags;
    tags.filter(t => !(t.lapse(this))).forEach(t => {
      t.onRemove(this);
      tags.splice(tags.indexOf(t), 1);
    });
  }

  preloadBgm(): void {
    this.scene.loadBgm(this.bgm);
  }

  getBgmLoopPoint(): number {
    switch (this.biomeType) {
      case Biome.TOWN:
        return 7.288;
      case Biome.PLAINS:
        return 7.693;
      case Biome.GRASS:
        return 1.995;
      case Biome.TALL_GRASS:
        return 9.608;
      case Biome.CITY:
        return 1.221;
      case Biome.FOREST:
        return 4.294;
      case Biome.SEA:
        return 1.672;
      case Biome.SWAMP:
        return 4.461;
      case Biome.BEACH:
        return 3.462;
      case Biome.LAKE:
        return 5.350;
      case Biome.SEABED:
        return 2.629;
      case Biome.MOUNTAIN:
        return 4.018;
      case Biome.BADLANDS:
        return 17.790;
      case Biome.CAVE:
        return 14.240;
      case Biome.DESERT:
        return 1.143;
      case Biome.ICE_CAVE:
        return 15.010;
      case Biome.MEADOW:
        return 3.891;
      case Biome.POWER_PLANT:
        return 2.810;
      case Biome.VOLCANO:
        return 5.116;
      case Biome.GRAVEYARD:
        return 3.232;
      case Biome.DOJO:
        return 6.205;
      case Biome.FACTORY:
        return 4.985;
      case Biome.RUINS:
        return 2.270;
      case Biome.WASTELAND:
        return 6.336;
      case Biome.ABYSS:
        return 5.130;
      case Biome.SPACE:
        return 21.347;
      case Biome.CONSTRUCTION_SITE:
        return 1.222;
      case Biome.JUNGLE:
        return 2.477;
    }
  }
}

export function getBiomeKey(biome: Biome): string {
  switch (biome) {
    case Biome.POWER_PLANT:
      return 'ruins';
    case Biome.CONSTRUCTION_SITE:
      return 'city';
    case Biome.JUNGLE:
      return 'tall_grass';
    case Biome.END:
      return 'wasteland';
  }
  return Biome[biome].toLowerCase();
}

export function getBiomeHasProps(biomeType: Biome): boolean {
  switch (biomeType) {
    case Biome.BEACH:
    case Biome.LAKE:
    case Biome.SEABED:
    case Biome.MOUNTAIN:
    case Biome.BADLANDS:
    case Biome.CAVE:
    case Biome.DESERT:
    case Biome.ICE_CAVE:
    case Biome.MEADOW:
    case Biome.VOLCANO:
    case Biome.GRAVEYARD:
    case Biome.FACTORY:
    case Biome.RUINS:
    case Biome.WASTELAND:
    case Biome.ABYSS:
      return true;
  }

  return false;
}

export class ArenaBase extends Phaser.GameObjects.Container {
  public player: boolean;
  public biome: Biome;
  public propValue: integer;
  public base: Phaser.GameObjects.Sprite;
  public props: Phaser.GameObjects.Sprite[];

  constructor(scene: BattleScene, player: boolean) {
    super(scene, 0, 0);

    this.player = player;

    this.base = scene.add.sprite(0, 0, 'plains_a');
    this.base.setOrigin(0, 0);

    this.props = !player ?
      new Array(3).fill(null).map(() => {
        const ret = scene.add.sprite(0, 0, 'plains_b');
        ret.setOrigin(0, 0);
        ret.setVisible(false);
        return ret;
      }) : [];
  }

  setBiome(biome: Biome, propValue?: integer): void {
    if (this.biome === biome)
      return;

    const hasProps = getBiomeHasProps(biome);
    const biomeKey = getBiomeKey(biome);

    this.base.setTexture(`${biomeKey}_${this.player ? 'a' : 'b'}`);
    this.add(this.base);

    if (!this.player) {
      (this.scene as BattleScene).executeWithSeedOffset(() => {
        this.propValue = propValue === undefined
          ? hasProps ? Utils.randSeedInt(8) : 0
          : propValue;
        this.props.forEach((prop, p) => {
          prop.setTexture(`${biomeKey}_b${hasProps ? `_${p + 1}` : ''}`);
          prop.setVisible(hasProps && !!(this.propValue & (1 << p)));
          this.add(prop);
        });
      }, (this.scene as BattleScene).currentBattle?.waveIndex || 0);
    }
  }
}