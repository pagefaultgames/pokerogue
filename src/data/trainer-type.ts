import BattleScene from "../battle-scene";
import * as Utils from "../utils";
import { Moves } from "./move";
import { pokemonLevelMoves } from "./pokemon-level-moves";
import { PokemonSpeciesFilter } from "./pokemon-species";
import { Species } from "./species";
import { tmSpecies } from "./tms";
import { Type } from "./type";

export enum TrainerType {
  ACE_TRAINER = 1,
  ARTIST,
  BACKERS,
  BACKPACKER,
  BAKER,
  BEAUTY,
  BIKER,
  BLACK_BELT,
  BREEDER,
  CLERK,
  CYCLIST,
  DANCER,
  DEPOT_AGENT,
  DOCTOR,
  FISHERMAN,
  GUITARIST,
  HARLEQUIN,
  HIKER,
  HOOLIGANS,
  HOOPSTER,
  INFIELDER,
  JANITOR,
  LINEBACKER,
  MAID,
  MUSICIAN,
  NURSE,
  NURSERY_AIDE,
  OFFICER,
  PARASOL_LADY,
  PILOT,
  POKEFAN,
  PRESCHOOLER,
  PSYCHIC,
  RANGER,
  RICH,
  RICH_KID,
  ROUGHNECK,
  SCIENTIST,
  SMASHER,
  SNOW_WORKER,
  STRIKER,
  STUDENT,
  SWIMMER,
  TWINS,
  VETERAN,
  WAITER,
  WORKER,
  YOUNGSTER,
  RIVAL,
  CYNTHIA
}

export enum TrainerPartyType {
  DEFAULT,
  BALANCED,
  REPEATED
}

export enum TrainerPoolTier {
  COMMON,
  UNCOMMON,
  RARE,
  SUPER_RARE,
  ULTRA_RARE
};

export interface TrainerTierPools {
  [key: integer]: Species[]
}

export class TrainerConfig {
  public trainerType: TrainerType;
  public name: string;
  public nameFemale: string;
  public hasGenders: boolean = false;
  public isDouble: boolean = false;
  public partyType: TrainerPartyType = TrainerPartyType.DEFAULT;
  public encounterBgm: string;
  public femaleEncounterBgm: string;
  public speciesPools: TrainerTierPools;
  public speciesFilter: PokemonSpeciesFilter;

  constructor(trainerType: TrainerType, allowLegendaries?: boolean) {
    this.trainerType = trainerType;
    this.name = Utils.toPokemonUpperCase(TrainerType[this.trainerType].toString().replace(/\_/g, ' '));
    this.encounterBgm = this.name.toLowerCase();
    this.speciesFilter = species => allowLegendaries || (!species.legendary && !species.pseudoLegendary && !species.mythical);
  }

  public getKey(female?: boolean): string {
    let ret = TrainerType[this.trainerType].toString().toLowerCase();
    if (this.hasGenders)
      ret += `_${female ? 'f' : 'm'}`;
    return ret;
  }

  public setName(name: string): TrainerConfig {
    this.name = name;
    return this;
  }

  public setHasGenders(nameFemale?: string, femaleEncounterBgm?: TrainerType | string): TrainerConfig {
    this.hasGenders = true;
    this.nameFemale = nameFemale;
    if (femaleEncounterBgm)
      this.femaleEncounterBgm = typeof femaleEncounterBgm === 'number' ? TrainerType[femaleEncounterBgm].toString().replace(/\_/g, ' ').toLowerCase() : femaleEncounterBgm;
    return this;
  }

  public setDouble(): TrainerConfig {
    this.isDouble = true;
    return this;
  }

  public setEncounterBgm(encounterBgm: TrainerType | string): TrainerConfig {
    this.encounterBgm = typeof encounterBgm === 'number' ? TrainerType[encounterBgm].toString().replace(/\_/g, ' ').toLowerCase() : encounterBgm;
    return this;
  }

  public setPartyType(partyType: TrainerPartyType): TrainerConfig {
    this.partyType = partyType;
    return this;
  }

  public setSpeciesPools(speciesPools: TrainerTierPools | Species[]): TrainerConfig {
    this.speciesPools = (Array.isArray(speciesPools) ? speciesPools : { [TrainerPoolTier.COMMON]: speciesPools }) as unknown as TrainerTierPools;
    return this;
  }

  public setSpeciesFilter(speciesFilter: PokemonSpeciesFilter, allowLegendaries?: boolean): TrainerConfig {
    const baseFilter = this.speciesFilter;
    this.speciesFilter = allowLegendaries ? speciesFilter : species => speciesFilter(species) && baseFilter(species);
    return this;
  }

  public getName(female?: boolean): string {
    let ret = this.name;
    
    if (this.hasGenders) {
      if (this.nameFemale) {
        if (female)
          return this.nameFemale;
      } else
        ret += !female ? '♂' : '♀';
    }

    return ret;
  }

  public genPartySize(): integer {
    // TODO
    return this.isDouble ? 2 : 1;
  }

  loadAssets(scene: BattleScene, female: boolean): Promise<void> {
    return new Promise(resolve => {
      const trainerKey = this.getKey(female);
      scene.loadAtlas(trainerKey, 'trainer');
      scene.load.once(Phaser.Loader.Events.COMPLETE, () => {
        const originalWarn = console.warn;
        // Ignore warnings for missing frames, because there will be a lot
        console.warn = () => {};
        const frameNames = scene.anims.generateFrameNames(trainerKey, { zeroPad: 4, suffix: ".png", start: 1, end:24 });
        console.warn = originalWarn;
        scene.anims.create({
          key: trainerKey,
          frames: frameNames,
          frameRate: 12,
          repeat: -1
        });
        resolve();
      });
      if (!scene.load.isLoading())
        scene.load.start();
    });
  }
}

let t = 0;

interface TrainerConfigs {
  [key: integer]: TrainerConfig
}

export const trainerConfigs: TrainerConfigs = {
  [TrainerType.ACE_TRAINER]: new TrainerConfig(++t).setHasGenders().setPartyType(TrainerPartyType.BALANCED),
  [TrainerType.ARTIST]: new TrainerConfig(++t).setEncounterBgm(TrainerType.RICH).setSpeciesPools([ Species.SMEARGLE ]),
  [TrainerType.BACKERS]: new TrainerConfig(++t).setHasGenders().setEncounterBgm(TrainerType.CYCLIST).setDouble(),
  [TrainerType.BACKPACKER]: new TrainerConfig(++t).setHasGenders().setSpeciesFilter(s => s.isOfType(Type.FLYING) || s.isOfType(Type.ROCK)),
  [TrainerType.BAKER]: new TrainerConfig(++t).setEncounterBgm(TrainerType.CLERK).setSpeciesFilter(s => s.isOfType(Type.GRASS) || s.isOfType(Type.FIRE)),
  [TrainerType.BEAUTY]: new TrainerConfig(++t).setEncounterBgm(TrainerType.PARASOL_LADY),
  [TrainerType.BIKER]: new TrainerConfig(++t).setEncounterBgm(TrainerType.ROUGHNECK).setSpeciesFilter(s => s.isOfType(Type.POISON)),
  [TrainerType.BLACK_BELT]: new TrainerConfig(++t).setHasGenders('Battle Girl', TrainerType.PSYCHIC).setEncounterBgm(TrainerType.ROUGHNECK).setSpeciesFilter(s => s.isOfType(Type.FIGHTING)),
  [TrainerType.BREEDER]: new TrainerConfig(++t).setHasGenders().setDouble().setEncounterBgm(TrainerType.POKEFAN),
  [TrainerType.CLERK]: new TrainerConfig(++t).setHasGenders(),
  [TrainerType.CYCLIST]: new TrainerConfig(++t).setHasGenders().setSpeciesFilter(s => !!pokemonLevelMoves[s.speciesId].find(plm => plm[1] === Moves.QUICK_ATTACK)),
  [TrainerType.DANCER]: new TrainerConfig(++t).setEncounterBgm(TrainerType.CYCLIST),
  [TrainerType.DEPOT_AGENT]: new TrainerConfig(++t).setEncounterBgm(TrainerType.CLERK),
  [TrainerType.DOCTOR]: new TrainerConfig(++t).setEncounterBgm(TrainerType.CLERK),
  [TrainerType.FISHERMAN]: new TrainerConfig(++t).setEncounterBgm(TrainerType.BACKPACKER).setSpeciesPools({
    [TrainerPoolTier.COMMON]: [ Species.TENTACOOL, Species.MAGIKARP, Species.GOLDEEN, Species.STARYU, Species.REMORAID ],
    [TrainerPoolTier.UNCOMMON]: [ Species.POLIWAG, Species.SHELLDER, Species.KRABBY, Species.HORSEA, Species.CARVANHA, Species.BARBOACH, Species.CORPHISH, Species.FINNEON, Species.TYMPOLE, Species.BASCULIN, Species.FRILLISH ],
    [TrainerPoolTier.RARE]: [ Species.CHINCHOU, Species.CORSOLA, Species.WAILMER, Species.CLAMPERL, Species.LUVDISC, Species.MANTYKE, Species.ALOMOMOLA ],
    [TrainerPoolTier.SUPER_RARE]: [ Species.LAPRAS, Species.FEEBAS, Species.RELICANTH ]
  }),
  [TrainerType.GUITARIST]: new TrainerConfig(++t).setEncounterBgm(TrainerType.ROUGHNECK).setSpeciesFilter(s => s.isOfType(Type.ELECTRIC)),
  [TrainerType.HARLEQUIN]: new TrainerConfig(++t).setEncounterBgm(TrainerType.PSYCHIC).setSpeciesFilter(s => tmSpecies[Moves.TRICK_ROOM].indexOf(s.speciesId) > -1),
  [TrainerType.HIKER]: new TrainerConfig(++t).setEncounterBgm(TrainerType.BACKPACKER).setSpeciesFilter(s => s.isOfType(Type.GROUND) || s.isOfType(Type.ROCK)),
  [TrainerType.HOOLIGANS]: new TrainerConfig(++t).setDouble().setEncounterBgm(TrainerType.ROUGHNECK).setSpeciesFilter(s => s.isOfType(Type.POISON) || s.isOfType(Type.DARK)),
  [TrainerType.HOOPSTER]: new TrainerConfig(++t).setEncounterBgm(TrainerType.CYCLIST),
  [TrainerType.INFIELDER]: new TrainerConfig(++t).setEncounterBgm(TrainerType.CYCLIST),
  [TrainerType.JANITOR]: new TrainerConfig(++t).setEncounterBgm(TrainerType.CLERK),
  [TrainerType.LINEBACKER]: new TrainerConfig(++t).setEncounterBgm(TrainerType.CYCLIST),
  [TrainerType.MAID]: new TrainerConfig(++t).setEncounterBgm(TrainerType.RICH).setSpeciesFilter(s => s.eggType1 === 'Field' || s.eggType2 === 'Field'),
  [TrainerType.MUSICIAN]: new TrainerConfig(++t).setEncounterBgm(TrainerType.ROUGHNECK).setSpeciesFilter(s => !!pokemonLevelMoves[s.speciesId].find(plm => plm[1] === Moves.SING)),
  [TrainerType.NURSE]: new TrainerConfig(++t).setEncounterBgm('lass').setSpeciesFilter(s => !!pokemonLevelMoves[s.speciesId].find(plm => plm[1] === Moves.CHARM) || !!pokemonLevelMoves[s.speciesId].find(plm => plm[1] === Moves.HEAL_PULSE)),
  [TrainerType.NURSERY_AIDE]: new TrainerConfig(++t).setEncounterBgm('lass'),
  [TrainerType.OFFICER]: new TrainerConfig(++t).setEncounterBgm(TrainerType.CLERK).setSpeciesPools([ Species.VULPIX, Species.GROWLITHE, Species.SNUBBULL, Species.HOUNDOUR, Species.POOCHYENA, Species.ELECTRIKE, Species.LILLIPUP ]),
  [TrainerType.PARASOL_LADY]: new TrainerConfig(++t).setSpeciesFilter(s => s.isOfType(Type.WATER)),
  [TrainerType.PILOT]: new TrainerConfig(++t).setEncounterBgm(TrainerType.CLERK).setSpeciesFilter(s => tmSpecies[Moves.FLY].indexOf(s.speciesId) > -1),
  [TrainerType.POKEFAN]: new TrainerConfig(++t).setHasGenders(),
  [TrainerType.PRESCHOOLER]: new TrainerConfig(++t).setEncounterBgm(TrainerType.YOUNGSTER).setHasGenders(undefined, 'lass'),
  [TrainerType.PSYCHIC]: new TrainerConfig(++t).setHasGenders(),
  [TrainerType.RANGER]: new TrainerConfig(++t).setEncounterBgm(TrainerType.BACKPACKER).setHasGenders(),
  [TrainerType.RICH]: new TrainerConfig(++t).setName('Gentleman').setHasGenders().setSpeciesFilter(s => s.eggType1 === 'Field' || s.eggType2 === 'Field'),
  [TrainerType.RICH_KID]: new TrainerConfig(++t).setName('Rich Boy').setHasGenders('Lady').setEncounterBgm(TrainerType.RICH),
  [TrainerType.ROUGHNECK]: new TrainerConfig(++t).setSpeciesFilter(s => s.isOfType(Type.DARK)),
  [TrainerType.SCIENTIST]: new TrainerConfig(++t).setHasGenders().setSpeciesPools({
    [TrainerPoolTier.COMMON]: [ Species.MAGNEMITE, Species.GRIMER, Species.DROWZEE, Species.VOLTORB, Species.KOFFING ],
    [TrainerPoolTier.UNCOMMON]: [ Species.KLINK ],
    [TrainerPoolTier.RARE ]: [ Species.ABRA, Species.PORYGON ],
    [TrainerPoolTier.SUPER_RARE ]: [ Species.OMANYTE, Species.KABUTO, Species.AERODACTYL, Species.LILEEP, Species.ANORITH, Species.CRANIDOS, Species.SHIELDON, Species.TIRTOUGA, Species.ARCHEN ]
  }),
  [TrainerType.SMASHER]: new TrainerConfig(++t).setEncounterBgm(TrainerType.CYCLIST),
  [TrainerType.SNOW_WORKER]: new TrainerConfig(++t).setName('Worker').setEncounterBgm(TrainerType.CLERK).setSpeciesFilter(s => s.isOfType(Type.ICE) || s.isOfType(Type.STEEL)),
  [TrainerType.STRIKER]: new TrainerConfig(++t).setEncounterBgm(TrainerType.CYCLIST),
  [TrainerType.STUDENT]: new TrainerConfig(++t).setHasGenders(),
  [TrainerType.SWIMMER]: new TrainerConfig(++t).setHasGenders().setEncounterBgm(TrainerType.PARASOL_LADY).setSpeciesFilter(s => s.isOfType(Type.WATER)),
  [TrainerType.TWINS]: new TrainerConfig(++t).setDouble(),
  [TrainerType.VETERAN]: new TrainerConfig(++t).setHasGenders().setEncounterBgm(TrainerType.RICH),
  [TrainerType.WAITER]: new TrainerConfig(++t).setHasGenders().setEncounterBgm(TrainerType.CLERK),
  [TrainerType.WORKER]: new TrainerConfig(++t).setEncounterBgm(TrainerType.CLERK).setSpeciesFilter(s => s.isOfType(Type.ROCK) || s.isOfType(Type.STEEL)),
  [TrainerType.YOUNGSTER]: new TrainerConfig(++t).setHasGenders('Lass', 'lass').setEncounterBgm(TrainerType.YOUNGSTER),
  [TrainerType.RIVAL]: new TrainerConfig(++t).setHasGenders(),
  [TrainerType.CYNTHIA]: new TrainerConfig(++t),
}