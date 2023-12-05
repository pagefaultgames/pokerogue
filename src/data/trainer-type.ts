import BattleScene, { startingWave } from "../battle-scene";
import { ModifierType, ModifierTypeFunc, modifierTypes } from "../modifier/modifier-type";
import { EnemyPokemon } from "../pokemon";
import * as Utils from "../utils";
import { Moves } from "./move";
import { pokemonEvolutions, pokemonPrevolutions } from "./pokemon-evolutions";
import PokemonSpecies, { PokemonSpeciesFilter, getPokemonSpecies } from "./pokemon-species";
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

  BROCK,
  MISTY,
  LT_SURGE,
  ERIKA,
  JANINE,
  SABRINA,
  BLAINE,
  GIOVANNI,
  FALKNER,
  BUGSY,
  WHITNEY,
  MORTY,
  CHUCK,
  JASMINE,
  PRYCE,
  CLAIR,
  ROXANNE,
  BRAWLY,
  WATTSON,
  FLANNERY,
  NORMAN,
  WINONA,
  TATE,
  LIZA,
  JUAN,
  ROARK,
  GARDENIA,
  MAYLENE,
  CRASHER_WAKE,
  FANTINA,
  BYRON,
  CANDICE,
  VOLKNER,
  CILAN,
  CHILI,
  CRESS,
  CHEREN,
  LENORA,
  ROXIE,
  BURGH,
  ELESA,
  CLAY,
  SKYLA,
  BRYCEN,
  DRAYDEN,
  MARLON,

  SHAUNTAL,
  MARSHAL,
  GRIMSLEY,
  CAITLIN,

  BLUE,
  RED,
  LANCE,
  STEVEN,
  WALLACE,
  CYNTHIA,
  ALDER,
  IRIS,

  RIVAL,
  RIVAL_2,
  RIVAL_3,
  RIVAL_4,
  RIVAL_5,
  RIVAL_6
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

export enum TrainerPartyMemberStrength {
  WEAKER,
  WEAK,
  AVERAGE,
  STRONG,
  STRONGER
}

export class TrainerPartyTemplate {
  public size: integer;
  public strength: TrainerPartyMemberStrength;
  public sameSpecies: boolean;
  public balanced: boolean;

  constructor(size: integer, strength: TrainerPartyMemberStrength, sameSpecies?: boolean, balanced?: boolean) {
    this.size = size;
    this.strength = strength;
    this.sameSpecies = !!sameSpecies;
    this.balanced = !!balanced;
  }

  getStrength(index: integer): TrainerPartyMemberStrength {
    return this.strength;
  }

  isSameSpecies(index: integer): boolean {
    return this.sameSpecies;
  }

  isBalanced(index: integer): boolean {
    return this.balanced;
  }
}

export class TrainerPartyCompoundTemplate extends TrainerPartyTemplate {
  public templates: TrainerPartyTemplate[];

  constructor(...templates: TrainerPartyTemplate[]) {
    super(templates.reduce((total: integer, template: TrainerPartyTemplate) => {
      total += template.size;
      return total;
    }, 0), TrainerPartyMemberStrength.AVERAGE);
    this.templates = templates;
  }

  getStrength(index: integer): TrainerPartyMemberStrength {
    let t = 0;
    for (let template of this.templates) {
      if (t + template.size > index)
        return template.getStrength(index - t);
      t += template.size;
    }

    return super.getStrength(index);
  }

  isSameSpecies(index: integer): boolean {
    let t = 0;
    for (let template of this.templates) {
      if (t + template.size > index)
        return template.isSameSpecies(index - t);
      t += template.size;
    }

    return super.isSameSpecies(index);
  }

  isBalanced(index: integer): boolean {
    let t = 0;
    for (let template of this.templates) {
      if (t + template.size > index)
        return template.isBalanced(index - t);
      t += template.size;
    }

    return super.isBalanced(index);
  }
}

export const trainerPartyTemplates = {
  ONE_AVG: new TrainerPartyTemplate(1, TrainerPartyMemberStrength.AVERAGE),
  ONE_STRONG: new TrainerPartyTemplate(1, TrainerPartyMemberStrength.STRONG),
  ONE_STRONGER: new TrainerPartyTemplate(1, TrainerPartyMemberStrength.STRONGER),
  TWO_WEAKER: new TrainerPartyTemplate(2, TrainerPartyMemberStrength.WEAKER),
  TWO_WEAK: new TrainerPartyTemplate(2, TrainerPartyMemberStrength.WEAK),
  TWO_WEAK_ONE_AVG: new TrainerPartyCompoundTemplate(new TrainerPartyTemplate(2, TrainerPartyMemberStrength.WEAK), new TrainerPartyTemplate(1, TrainerPartyMemberStrength.AVERAGE)),
  TWO_WEAK_SAME_ONE_AVG: new TrainerPartyCompoundTemplate(new TrainerPartyTemplate(2, TrainerPartyMemberStrength.WEAK, true), new TrainerPartyTemplate(1, TrainerPartyMemberStrength.AVERAGE)),
  TWO_WEAK_SAME_TWO_WEAK_SAME: new TrainerPartyCompoundTemplate(new TrainerPartyTemplate(2, TrainerPartyMemberStrength.WEAK, true), new TrainerPartyTemplate(2, TrainerPartyMemberStrength.WEAK, true)),
  TWO_WEAK_ONE_STRONG: new TrainerPartyCompoundTemplate(new TrainerPartyTemplate(2, TrainerPartyMemberStrength.WEAK), new TrainerPartyTemplate(1, TrainerPartyMemberStrength.STRONG)),
  TWO_AVG: new TrainerPartyTemplate(2, TrainerPartyMemberStrength.AVERAGE),
  TWO_AVG_ONE_STRONG: new TrainerPartyCompoundTemplate(new TrainerPartyTemplate(2, TrainerPartyMemberStrength.AVERAGE), new TrainerPartyTemplate(1, TrainerPartyMemberStrength.STRONG)),
  TWO_AVG_SAME_ONE_AVG: new TrainerPartyCompoundTemplate(new TrainerPartyTemplate(2, TrainerPartyMemberStrength.AVERAGE, true), new TrainerPartyTemplate(1, TrainerPartyMemberStrength.AVERAGE)),
  TWO_AVG_SAME_ONE_STRONG: new TrainerPartyCompoundTemplate(new TrainerPartyTemplate(2, TrainerPartyMemberStrength.AVERAGE, true), new TrainerPartyTemplate(1, TrainerPartyMemberStrength.STRONG)),
  TWO_AVG_SAME_TWO_AVG_SAME: new TrainerPartyCompoundTemplate(new TrainerPartyTemplate(2, TrainerPartyMemberStrength.AVERAGE, true), new TrainerPartyTemplate(2, TrainerPartyMemberStrength.AVERAGE, true)),
  TWO_STRONG: new TrainerPartyTemplate(2, TrainerPartyMemberStrength.STRONG),
  THREE_WEAK: new TrainerPartyTemplate(3, TrainerPartyMemberStrength.WEAK),
  THREE_WEAK_SAME: new TrainerPartyTemplate(3, TrainerPartyMemberStrength.WEAK, true),
  THREE_AVG: new TrainerPartyTemplate(3, TrainerPartyMemberStrength.AVERAGE),
  THREE_AVG_SAME: new TrainerPartyTemplate(3, TrainerPartyMemberStrength.AVERAGE, true),
  THREE_WEAK_BALANCED: new TrainerPartyTemplate(3, TrainerPartyMemberStrength.WEAK, false, true),
  FOUR_WEAKER: new TrainerPartyTemplate(4, TrainerPartyMemberStrength.WEAKER),
  FOUR_WEAKER_SAME: new TrainerPartyTemplate(4, TrainerPartyMemberStrength.WEAKER, true),
  FOUR_WEAK: new TrainerPartyTemplate(4, TrainerPartyMemberStrength.WEAK),
  FOUR_WEAK_SAME: new TrainerPartyTemplate(4, TrainerPartyMemberStrength.WEAK, true),
  FOUR_WEAK_BALANCED: new TrainerPartyTemplate(4, TrainerPartyMemberStrength.WEAK, false, true),
  FIVE_WEAKER: new TrainerPartyTemplate(5, TrainerPartyMemberStrength.WEAKER),
  FIVE_WEAK: new TrainerPartyTemplate(5, TrainerPartyMemberStrength.WEAK),
  FIVE_WEAK_BALANCED: new TrainerPartyTemplate(5, TrainerPartyMemberStrength.WEAK, false, true),
  SIX_WEAK_SAME: new TrainerPartyTemplate(6, TrainerPartyMemberStrength.WEAKER, true),
  SIX_WEAKER: new TrainerPartyTemplate(6, TrainerPartyMemberStrength.WEAKER),
  SIX_WEAKER_SAME: new TrainerPartyTemplate(6, TrainerPartyMemberStrength.WEAKER, true),
  SIX_WEAK_BALANCED: new TrainerPartyTemplate(6, TrainerPartyMemberStrength.WEAK, false, true),

  GYM_LEADER_1: new TrainerPartyCompoundTemplate(new TrainerPartyTemplate(1, TrainerPartyMemberStrength.STRONG), new TrainerPartyTemplate(1, TrainerPartyMemberStrength.STRONGER)),
  GYM_LEADER_2: new TrainerPartyCompoundTemplate(new TrainerPartyTemplate(2, TrainerPartyMemberStrength.AVERAGE), new TrainerPartyTemplate(1, TrainerPartyMemberStrength.STRONG), new TrainerPartyTemplate(1, TrainerPartyMemberStrength.STRONGER)),
  GYM_LEADER_3: new TrainerPartyCompoundTemplate(new TrainerPartyTemplate(3, TrainerPartyMemberStrength.AVERAGE), new TrainerPartyTemplate(1, TrainerPartyMemberStrength.STRONG), new TrainerPartyTemplate(1, TrainerPartyMemberStrength.STRONGER)),
  GYM_LEADER_4: new TrainerPartyCompoundTemplate(new TrainerPartyTemplate(4, TrainerPartyMemberStrength.AVERAGE), new TrainerPartyTemplate(1, TrainerPartyMemberStrength.STRONG), new TrainerPartyTemplate(1, TrainerPartyMemberStrength.STRONGER)),

  ELITE_FOUR: new TrainerPartyCompoundTemplate(new TrainerPartyTemplate(3, TrainerPartyMemberStrength.AVERAGE), new TrainerPartyTemplate(2, TrainerPartyMemberStrength.STRONG), new TrainerPartyTemplate(1, TrainerPartyMemberStrength.STRONGER)),

  CHAMPION: new TrainerPartyCompoundTemplate(new TrainerPartyTemplate(1, TrainerPartyMemberStrength.STRONGER), new TrainerPartyTemplate(5, TrainerPartyMemberStrength.STRONG, false, true)),

  RIVAL: new TrainerPartyCompoundTemplate(new TrainerPartyTemplate(1, TrainerPartyMemberStrength.STRONG), new TrainerPartyTemplate(1, TrainerPartyMemberStrength.AVERAGE)),
  RIVAL_2: new TrainerPartyCompoundTemplate(new TrainerPartyTemplate(1, TrainerPartyMemberStrength.STRONG), new TrainerPartyTemplate(1, TrainerPartyMemberStrength.AVERAGE)),
  RIVAL_3: new TrainerPartyCompoundTemplate(new TrainerPartyTemplate(1, TrainerPartyMemberStrength.STRONG), new TrainerPartyTemplate(1, TrainerPartyMemberStrength.AVERAGE), new TrainerPartyTemplate(1, TrainerPartyMemberStrength.AVERAGE, false, true)),
  RIVAL_4: new TrainerPartyCompoundTemplate(new TrainerPartyTemplate(1, TrainerPartyMemberStrength.STRONG), new TrainerPartyTemplate(1, TrainerPartyMemberStrength.AVERAGE), new TrainerPartyTemplate(3, TrainerPartyMemberStrength.AVERAGE, false, true)),
  RIVAL_5: new TrainerPartyCompoundTemplate(new TrainerPartyTemplate(1, TrainerPartyMemberStrength.STRONG), new TrainerPartyTemplate(1, TrainerPartyMemberStrength.AVERAGE), new TrainerPartyTemplate(3, TrainerPartyMemberStrength.AVERAGE, false, true), new TrainerPartyTemplate(1, TrainerPartyMemberStrength.STRONG)),
  RIVAL_6: new TrainerPartyCompoundTemplate(new TrainerPartyTemplate(1, TrainerPartyMemberStrength.STRONG), new TrainerPartyTemplate(1, TrainerPartyMemberStrength.AVERAGE), new TrainerPartyTemplate(3, TrainerPartyMemberStrength.AVERAGE, false, true), new TrainerPartyTemplate(1, TrainerPartyMemberStrength.STRONGER))
};

type PartyTemplateFunc = (scene: BattleScene) => TrainerPartyTemplate;
type PartyMemberFunc = (scene: BattleScene, level: integer) => EnemyPokemon;

export interface PartyMemberFuncs {
  [key: integer]: PartyMemberFunc
}

export class TrainerConfig {
  public trainerType: TrainerType;
  public name: string;
  public nameFemale: string;
  public hasGenders: boolean = false;
  public isDouble: boolean = false;
  public moneyMultiplier: number = 1;
  public isBoss: boolean = false;
  public hasStaticParty: boolean = false;
  public battleBgm: string;
  public encounterBgm: string;
  public femaleEncounterBgm: string;
  public victoryBgm: string;
  public modifierRewardFuncs: ModifierTypeFunc[] = [];
  public partyTemplates: TrainerPartyTemplate[];
  public partyTemplateFunc: PartyTemplateFunc;
  public partyMemberFuncs: PartyMemberFuncs = {};
  public speciesPools: TrainerTierPools;
  public speciesFilter: PokemonSpeciesFilter;

  public encounterMessages: string[] = [];
  public victoryMessages: string[] = [];
  public defeatMessages: string[] = [];

  public femaleEncounterMessages: string[];
  public femaleVictoryMessages: string[];
  public femaleDefeatMessages: string[];

  constructor(trainerType: TrainerType, allowLegendaries?: boolean) {
    this.trainerType = trainerType;
    this.name = Utils.toReadableString(TrainerType[this.getDerivedType()]);
    this.battleBgm = 'battle_trainer';
    this.victoryBgm = 'victory_trainer';
    this.partyTemplates = [ trainerPartyTemplates.TWO_AVG ];
    this.speciesFilter = species => allowLegendaries || (!species.legendary && !species.pseudoLegendary && !species.mythical);
  }

  getKey(female?: boolean): string {
    let ret = TrainerType[this.getDerivedType()].toString().toLowerCase();
    if (this.hasGenders)
      ret += `_${female ? 'f' : 'm'}`;
    return ret;
  }

  setName(name: string): TrainerConfig {
    this.name = name;
    return this;
  }

  getDerivedType(): TrainerType {
    let trainerType = this.trainerType;
    switch (trainerType) {
      case TrainerType.RIVAL_2:
      case TrainerType.RIVAL_3:
      case TrainerType.RIVAL_4:
      case TrainerType.RIVAL_5:
      case TrainerType.RIVAL_6:
        trainerType = TrainerType.RIVAL;
        break;
    }

    return trainerType;
  }

  setHasGenders(nameFemale?: string, femaleEncounterBgm?: TrainerType | string): TrainerConfig {
    this.hasGenders = true;
    this.nameFemale = nameFemale;
    if (femaleEncounterBgm)
      this.femaleEncounterBgm = typeof femaleEncounterBgm === 'number' ? TrainerType[femaleEncounterBgm].toString().replace(/\_/g, ' ').toLowerCase() : femaleEncounterBgm;
    return this;
  }

  setDouble(): TrainerConfig {
    this.isDouble = true;
    return this;
  }

  setMoneyMultiplier(moneyMultiplier: number): TrainerConfig {
    this.moneyMultiplier = moneyMultiplier;
    return this;
  }

  setBoss(): TrainerConfig {
    this.isBoss = true;
    return this;
  }

  setStaticParty(): TrainerConfig {
    this.hasStaticParty = true;
    return this;
  }

  setBattleBgm(battleBgm: string): TrainerConfig {
    this.battleBgm = battleBgm;
    return this;
  }

  setEncounterBgm(encounterBgm: TrainerType | string): TrainerConfig {
    this.encounterBgm = typeof encounterBgm === 'number' ? TrainerType[encounterBgm].toString().replace(/\_/g, ' ').toLowerCase() : encounterBgm;
    return this;
  }

  setVictoryBgm(victoryBgm: string): TrainerConfig {
    this.victoryBgm = victoryBgm;
    return this;
  }

  setPartyTemplates(...partyTemplates: TrainerPartyTemplate[]): TrainerConfig {
    this.partyTemplates = partyTemplates;
    return this;
  }

  setPartyTemplateFunc(partyTemplateFunc: PartyTemplateFunc): TrainerConfig {
    this.partyTemplateFunc = partyTemplateFunc;
    return this;
  }

  setPartyMemberFunc(slotIndex: integer, partyMemberFunc: PartyMemberFunc): TrainerConfig {
    this.partyMemberFuncs[slotIndex] = partyMemberFunc;
    return this;
  }

  setSpeciesPools(speciesPools: TrainerTierPools | Species[]): TrainerConfig {
    this.speciesPools = (Array.isArray(speciesPools) ? { [TrainerPoolTier.COMMON]: speciesPools } : speciesPools) as unknown as TrainerTierPools;
    return this;
  }

  setSpeciesFilter(speciesFilter: PokemonSpeciesFilter, allowLegendaries?: boolean): TrainerConfig {
    const baseFilter = this.speciesFilter;
    this.speciesFilter = allowLegendaries ? speciesFilter : species => speciesFilter(species) && baseFilter(species);
    return this;
  }

  setEncounterMessages(messages: string[], femaleMessages?: string[]): TrainerConfig {
    this.encounterMessages = messages;
    this.femaleEncounterMessages = femaleMessages;
    return this;
  }

  setVictoryMessages(messages: string[], femaleMessages?: string[]): TrainerConfig {
    this.victoryMessages = messages;
    this.femaleVictoryMessages = femaleMessages;
    return this;
  }

  setDefeatMessages(messages: string[], femaleMessages?: string[]): TrainerConfig {
    this.defeatMessages = messages;
    this.femaleDefeatMessages = femaleMessages;
    return this;
  }

  setModifierRewardFuncs(...modifierTypeFuncs: (() => ModifierTypeFunc)[]): TrainerConfig {
    this.modifierRewardFuncs = modifierTypeFuncs.map(func => () => {
      const modifierTypeFunc = func();
      const modifierType = modifierTypeFunc();
      modifierType.id = Object.keys(modifierTypes).find(k => modifierTypes[k] === modifierTypeFunc);
      return modifierType;
    });
    return this;
  }

  initForGymLeader(signatureSpecies: Species, specialtyType?: Type): TrainerConfig {
    this.setPartyTemplateFunc(getGymLeaderPartyTemplate);
    this.setPartyMemberFunc(-1, getRandomPartyMemberFunc([ signatureSpecies ]));
    if (specialtyType !== undefined)
      this.setSpeciesFilter(p => p.isOfType(specialtyType));
    this.setMoneyMultiplier(2.5);
    this.setBoss();
    this.setStaticParty();
    this.setBattleBgm('battle_gym');
    this.setVictoryBgm('victory_gym');
    return this;
  }

  initForEliteFour(signatureSpecies: Species, specialtyType?: Type): TrainerConfig {
    this.setPartyTemplates(trainerPartyTemplates.ELITE_FOUR);
    this.setPartyMemberFunc(-1, getRandomPartyMemberFunc([ signatureSpecies ]));
    if (specialtyType !== undefined)
      this.setSpeciesFilter(p => p.isOfType(specialtyType) && p.baseTotal >= 450);
    else
      this.setSpeciesFilter(p => p.baseTotal >= 450);
    this.setMoneyMultiplier(3.25);
    this.setBoss();
    this.setStaticParty();
    this.setBattleBgm('battle_elite');
    this.setVictoryBgm('victory_gym');
    return this;
  }

  initForChampion(signatureSpecies: Species): TrainerConfig {
    this.setPartyTemplates(trainerPartyTemplates.CHAMPION);
    this.setPartyMemberFunc(-1, getRandomPartyMemberFunc([ signatureSpecies ]));
    this.setSpeciesFilter(p => p.baseTotal >= 470);
    this.setMoneyMultiplier(10);
    this.setBoss();
    this.setStaticParty();
    this.setBattleBgm('battle_champion');
    this.setVictoryBgm('victory_champion');
    return this;
  }

  getName(female?: boolean): string {
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

  loadAssets(scene: BattleScene, female: boolean): Promise<void> {
    return new Promise(resolve => {
      const trainerKey = this.getKey(female);
      scene.loadAtlas(trainerKey, 'trainer');
      scene.load.once(Phaser.Loader.Events.COMPLETE, () => {
        const originalWarn = console.warn;
        // Ignore warnings for missing frames, because there will be a lot
        console.warn = () => {};
        const frameNames = scene.anims.generateFrameNames(trainerKey, { zeroPad: 4, suffix: ".png", start: 1, end: 128 });
        console.warn = originalWarn;
        scene.anims.create({
          key: trainerKey,
          frames: frameNames,
          frameRate: 24,
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

function getWavePartyTemplate(scene: BattleScene, ...templates: TrainerPartyTemplate[]) {
  return templates[Math.min(Math.max(Math.ceil(((scene.currentBattle?.waveIndex || startingWave) - 10) / 20) - 1, 0), templates.length - 1)];
}

function getGymLeaderPartyTemplate(scene: BattleScene) {
  return getWavePartyTemplate(scene, trainerPartyTemplates.GYM_LEADER_1, trainerPartyTemplates.GYM_LEADER_2, trainerPartyTemplates.GYM_LEADER_3, trainerPartyTemplates.GYM_LEADER_4);
}

function getRandomPartyMemberFunc(speciesPool: Species[], postProcess?: (enemyPokemon: EnemyPokemon) => void): PartyMemberFunc {
  return (scene: BattleScene, level: integer) => {
    const species = getPokemonSpecies(Phaser.Math.RND.pick(speciesPool)).getSpeciesForLevel(level, true);
    const ret = new EnemyPokemon(scene, getPokemonSpecies(species), level, true);
    if (postProcess)
      postProcess(ret);
    return ret;
  };
}

function getSpeciesFilterRandomPartyMemberFunc(speciesFilter: PokemonSpeciesFilter, allowLegendaries?: boolean, postProcess?: (EnemyPokemon: EnemyPokemon) => void): PartyMemberFunc {
  const originalSpeciesFilter = speciesFilter;
  speciesFilter = (species: PokemonSpecies) => allowLegendaries || (!species.legendary && !species.pseudoLegendary && !species.mythical) && originalSpeciesFilter(species);
  return (scene: BattleScene, level: integer) => {
    const ret = new EnemyPokemon(scene, scene.randomSpecies(scene.currentBattle.waveIndex, level, false, speciesFilter), level, true);
    if (postProcess)
      postProcess(ret);
    return ret;
  };
}

export const trainerConfigs: TrainerConfigs = {
  [TrainerType.ACE_TRAINER]: new TrainerConfig(++t).setHasGenders().setMoneyMultiplier(2.25).setEncounterBgm(TrainerType.ACE_TRAINER)
    .setPartyTemplateFunc(scene => getWavePartyTemplate(scene, trainerPartyTemplates.THREE_WEAK_BALANCED, trainerPartyTemplates.FOUR_WEAK_BALANCED, trainerPartyTemplates.FIVE_WEAK_BALANCED, trainerPartyTemplates.SIX_WEAK_BALANCED)),
  [TrainerType.ARTIST]: new TrainerConfig(++t).setEncounterBgm(TrainerType.RICH).setPartyTemplates(trainerPartyTemplates.ONE_STRONG, trainerPartyTemplates.TWO_AVG, trainerPartyTemplates.THREE_AVG)
    .setSpeciesPools([ Species.SMEARGLE ]),
  [TrainerType.BACKERS]: new TrainerConfig(++t).setHasGenders().setDouble().setEncounterBgm(TrainerType.CYCLIST),
  [TrainerType.BACKPACKER]: new TrainerConfig(++t).setHasGenders().setSpeciesFilter(s => s.isOfType(Type.FLYING) || s.isOfType(Type.ROCK)).setEncounterBgm(TrainerType.BACKPACKER),
  [TrainerType.BAKER]: new TrainerConfig(++t).setEncounterBgm(TrainerType.CLERK).setMoneyMultiplier(1.35).setSpeciesFilter(s => s.isOfType(Type.GRASS) || s.isOfType(Type.FIRE)),
  [TrainerType.BEAUTY]: new TrainerConfig(++t).setMoneyMultiplier(1.55).setEncounterBgm(TrainerType.PARASOL_LADY),
  [TrainerType.BIKER]: new TrainerConfig(++t).setMoneyMultiplier(1.4).setEncounterBgm(TrainerType.ROUGHNECK).setSpeciesFilter(s => s.isOfType(Type.POISON)),
  [TrainerType.BLACK_BELT]: new TrainerConfig(++t).setHasGenders('Battle Girl', TrainerType.PSYCHIC).setEncounterBgm(TrainerType.ROUGHNECK).setSpeciesFilter(s => s.isOfType(Type.FIGHTING))
    .setPartyTemplates(trainerPartyTemplates.TWO_WEAK_ONE_AVG, trainerPartyTemplates.TWO_WEAK_ONE_AVG, trainerPartyTemplates.TWO_AVG, trainerPartyTemplates.TWO_AVG, trainerPartyTemplates.TWO_WEAK_ONE_STRONG, trainerPartyTemplates.THREE_AVG, trainerPartyTemplates.TWO_AVG_ONE_STRONG)
    .setSpeciesPools({
      [TrainerPoolTier.COMMON]: [ Species.NIDORAN_F, Species.NIDORAN_M, Species.MACHOP, Species.MAKUHITA, Species.MEDITITE, Species.CROAGUNK, Species.TIMBURR ],
      [TrainerPoolTier.UNCOMMON]: [ Species.MANKEY, Species.POLIWRATH, Species.TYROGUE, Species.BRELOOM, Species.SCRAGGY, Species.MIENFOO, /* Species.PANCHAM, */ /* Species.STUFFUL */ /* Species.CRABRAWLER, */ ],
      [TrainerPoolTier.RARE]: [ Species.HERACROSS, Species.RIOLU, Species.THROH, Species.SAWK, /* Species.CLOBBOPUS, */ /* Species.PASSIMIAN, */ ], 
      [TrainerPoolTier.SUPER_RARE]: [ Species.INFERNAPE, Species.GALLADE, Species.HITMONTOP, /* Species.HAWLUCHA, */ /* Species.HAKAMO_O, */ ]
    }),
  [TrainerType.BREEDER]: new TrainerConfig(++t).setMoneyMultiplier(1.325).setEncounterBgm(TrainerType.POKEFAN).setHasGenders().setDouble()
    .setPartyTemplateFunc(scene => getWavePartyTemplate(scene, trainerPartyTemplates.FOUR_WEAKER, trainerPartyTemplates.FIVE_WEAKER, trainerPartyTemplates.SIX_WEAKER)),
  [TrainerType.CLERK]: new TrainerConfig(++t).setHasGenders().setEncounterBgm(TrainerType.CLERK)
    .setPartyTemplates(trainerPartyTemplates.TWO_WEAK, trainerPartyTemplates.THREE_WEAK, trainerPartyTemplates.ONE_AVG, trainerPartyTemplates.TWO_AVG, trainerPartyTemplates.TWO_WEAK_ONE_AVG)
    .setSpeciesPools({
      [TrainerPoolTier.COMMON]: [ Species.MEOWTH, Species.PSYDUCK, Species.BUDEW, Species.PIDOVE, Species.CINCCINO, /* Species.LITLEO */  ],
      [TrainerPoolTier.UNCOMMON]: [ Species.JIGGLYPUFF, Species.MAGNEMITE, Species.MARILL, Species.COTTONEE, /* Species.SKIDDO */ ],
      [TrainerPoolTier.RARE]: [ Species.BUIZEL, Species.SNEASEL, /* Species.KLEFKI, Species.INDEEDEE, */ ]
    }),
  [TrainerType.CYCLIST]: new TrainerConfig(++t).setMoneyMultiplier(1.3).setHasGenders().setEncounterBgm(TrainerType.CYCLIST).setSpeciesFilter(s => !!s.getLevelMoves().find(plm => plm[1] === Moves.QUICK_ATTACK))
    .setPartyTemplates(trainerPartyTemplates.TWO_WEAK, trainerPartyTemplates.ONE_AVG)
    .setSpeciesPools({
      [TrainerPoolTier.COMMON]: [ Species.PICHU, Species.STARLY, Species.TAILLOW, /* Species.BOLTUND */ ],
      [TrainerPoolTier.UNCOMMON]: [  Species.DODUO, Species.ELECTRIKE, Species.BLITZLE, /* Species.WATTREL */],
      [TrainerPoolTier.RARE]: [ Species.YANMA, Species.NINJASK, Species.WHIRLIPEDE, Species.EMOLGA ],
      [TrainerPoolTier.SUPER_RARE]: [ Species.ACCELGOR, /* Species.DREEPY */ ]
    }),
  [TrainerType.DANCER]: new TrainerConfig(++t).setMoneyMultiplier(1.55).setEncounterBgm(TrainerType.CYCLIST)
    .setPartyTemplates(trainerPartyTemplates.TWO_WEAK, trainerPartyTemplates.ONE_AVG, trainerPartyTemplates.TWO_AVG, trainerPartyTemplates.TWO_WEAK_SAME_TWO_WEAK_SAME)
    .setSpeciesPools({
      [TrainerPoolTier.COMMON]: [ Species.RALTS, Species.SPOINK, Species.LOTAD, Species.BUDEW ],
      [TrainerPoolTier.UNCOMMON]: [ Species.SPINDA, Species.SWABLU, Species.MARACTUS,],
      [TrainerPoolTier.RARE]: [ Species.BELLOSSOM, Species.HITMONTOP, Species.MIME_JR, /* Species.ORICORIO, */ ], 
      [TrainerPoolTier.SUPER_RARE]: [ /* Species.POPPLIO */ ]
    }),
  [TrainerType.DEPOT_AGENT]: new TrainerConfig(++t).setMoneyMultiplier(1.45).setEncounterBgm(TrainerType.CLERK),
  [TrainerType.DOCTOR]: new TrainerConfig(++t).setMoneyMultiplier(3).setEncounterBgm(TrainerType.CLERK),
  [TrainerType.FISHERMAN]: new TrainerConfig(++t).setMoneyMultiplier(1.25).setEncounterBgm(TrainerType.BACKPACKER)
    .setPartyTemplates(trainerPartyTemplates.TWO_WEAK_SAME_ONE_AVG, trainerPartyTemplates.ONE_AVG, trainerPartyTemplates.THREE_WEAK_SAME, trainerPartyTemplates.ONE_STRONG, trainerPartyTemplates.SIX_WEAKER)
    .setSpeciesPools({
      [TrainerPoolTier.COMMON]: [ Species.TENTACOOL, Species.MAGIKARP, Species.GOLDEEN, Species.STARYU, Species.REMORAID ],
      [TrainerPoolTier.UNCOMMON]: [ Species.POLIWAG, Species.SHELLDER, Species.KRABBY, Species.HORSEA, Species.CARVANHA, Species.BARBOACH, Species.CORPHISH, Species.FINNEON, Species.TYMPOLE, Species.BASCULIN, Species.FRILLISH ],
      [TrainerPoolTier.RARE]: [ Species.CHINCHOU, Species.CORSOLA, Species.WAILMER, Species.CLAMPERL, Species.LUVDISC, Species.MANTYKE, Species.ALOMOMOLA ],
      [TrainerPoolTier.SUPER_RARE]: [ Species.LAPRAS, Species.FEEBAS, Species.RELICANTH ]
    }),
  [TrainerType.GUITARIST]: new TrainerConfig(++t).setMoneyMultiplier(1.2).setEncounterBgm(TrainerType.ROUGHNECK).setSpeciesFilter(s => s.isOfType(Type.ELECTRIC)),
  [TrainerType.HARLEQUIN]: new TrainerConfig(++t).setEncounterBgm(TrainerType.PSYCHIC).setSpeciesFilter(s => tmSpecies[Moves.TRICK_ROOM].indexOf(s.speciesId) > -1),
  [TrainerType.HIKER]: new TrainerConfig(++t).setEncounterBgm(TrainerType.BACKPACKER).setSpeciesFilter(s => s.isOfType(Type.GROUND) || s.isOfType(Type.ROCK))
    .setPartyTemplates(trainerPartyTemplates.TWO_AVG_SAME_ONE_AVG, trainerPartyTemplates.TWO_AVG_SAME_ONE_STRONG, trainerPartyTemplates.TWO_AVG, trainerPartyTemplates.FOUR_WEAK, trainerPartyTemplates.ONE_STRONG),
  [TrainerType.HOOLIGANS]: new TrainerConfig(++t).setDouble().setEncounterBgm(TrainerType.ROUGHNECK).setSpeciesFilter(s => s.isOfType(Type.POISON) || s.isOfType(Type.DARK)),
  [TrainerType.HOOPSTER]: new TrainerConfig(++t).setMoneyMultiplier(1.2).setEncounterBgm(TrainerType.CYCLIST),
  [TrainerType.INFIELDER]: new TrainerConfig(++t).setMoneyMultiplier(1.2).setEncounterBgm(TrainerType.CYCLIST),
  [TrainerType.JANITOR]: new TrainerConfig(++t).setMoneyMultiplier(1.1).setEncounterBgm(TrainerType.CLERK),
  [TrainerType.LINEBACKER]: new TrainerConfig(++t).setMoneyMultiplier(1.2).setEncounterBgm(TrainerType.CYCLIST),
  [TrainerType.MAID]: new TrainerConfig(++t).setMoneyMultiplier(1.6).setEncounterBgm(TrainerType.RICH),
  [TrainerType.MUSICIAN]: new TrainerConfig(++t).setEncounterBgm(TrainerType.ROUGHNECK).setSpeciesFilter(s => !!s.getLevelMoves().find(plm => plm[1] === Moves.SING)),
  [TrainerType.NURSE]: new TrainerConfig(++t).setMoneyMultiplier(1.8).setEncounterBgm('lass').setSpeciesFilter(s => !!s.getLevelMoves().find(plm => plm[1] === Moves.CHARM) || !!s.getLevelMoves().find(plm => plm[1] === Moves.HEAL_PULSE)),
  [TrainerType.NURSERY_AIDE]: new TrainerConfig(++t).setMoneyMultiplier(1.3).setEncounterBgm('lass'),
  [TrainerType.OFFICER]: new TrainerConfig(++t).setMoneyMultiplier(1.55).setEncounterBgm(TrainerType.CLERK)
    .setPartyTemplates(trainerPartyTemplates.ONE_AVG, trainerPartyTemplates.ONE_STRONG, trainerPartyTemplates.TWO_AVG, trainerPartyTemplates.TWO_WEAK_SAME_ONE_AVG, )
    .setSpeciesPools({ 
      [TrainerPoolTier.COMMON]: [ Species.VULPIX, Species.GROWLITHE, Species.SNUBBULL, Species.POOCHYENA, Species.ELECTRIKE, Species.LILLIPUP, /* Species.YAMPER */ /* , Species.FIDOUGH */ ],
      [TrainerPoolTier.UNCOMMON]: [ Species.HOUNDOUR /*, Species.ROCKRUFF */ /* , Species.MASCHIFF */ ],
      [TrainerPoolTier.RARE]: [ Species.JOLTEON, Species.RIOLU ],
      [TrainerPoolTier.SUPER_RARE]: [],
      [TrainerPoolTier.ULTRA_RARE]: [ Species.ENTEI, Species.SUICUNE, Species.RAIKOU ]
    }),
  [TrainerType.PARASOL_LADY]: new TrainerConfig(++t).setMoneyMultiplier(1.55).setEncounterBgm(TrainerType.PARASOL_LADY).setSpeciesFilter(s => s.isOfType(Type.WATER)),
  [TrainerType.PILOT]: new TrainerConfig(++t).setEncounterBgm(TrainerType.CLERK).setSpeciesFilter(s => tmSpecies[Moves.FLY].indexOf(s.speciesId) > -1),
  [TrainerType.POKEFAN]: new TrainerConfig(++t).setMoneyMultiplier(1.4).setHasGenders().setEncounterBgm(TrainerType.POKEFAN)
    .setPartyTemplates(trainerPartyTemplates.SIX_WEAKER, trainerPartyTemplates.FOUR_WEAK, trainerPartyTemplates.TWO_AVG, trainerPartyTemplates.ONE_STRONG, trainerPartyTemplates.FOUR_WEAK_SAME, trainerPartyTemplates.FIVE_WEAK, trainerPartyTemplates.SIX_WEAKER_SAME),
  [TrainerType.PRESCHOOLER]: new TrainerConfig(++t).setMoneyMultiplier(0.2).setEncounterBgm(TrainerType.YOUNGSTER).setHasGenders(undefined, 'lass')
    .setPartyTemplates(trainerPartyTemplates.THREE_WEAK, trainerPartyTemplates.FOUR_WEAKER, trainerPartyTemplates.TWO_WEAK_SAME_ONE_AVG, trainerPartyTemplates.FIVE_WEAKER)
    .setSpeciesPools({
      [TrainerPoolTier.COMMON]: [ Species.CATERPIE, Species.PICHU, Species.SANDSHREW, Species.LEDYBA, Species.BUDEW, Species.BURMY, /* Species.WOOLOO, Species.PAWMI, Species.SMOLIV, */ ],
      [TrainerPoolTier.UNCOMMON]: [ Species.EEVEE, Species.CLEFFA, Species.IGGLYBUFF, Species.SWINUB, Species.WOOPER, Species.DRIFLOON, /* Species.DEDENNE, Species.STUFFUL,  */ ],
      [TrainerPoolTier.RARE]: [ Species.RALTS, Species.RIOLU, Species.JOLTIK /* Species.TANDEMAUS, */ ],
      [TrainerPoolTier.SUPER_RARE]: [  Species.DARUMAKA, /* Species.TINKATINK, */],
    }),
  [TrainerType.PSYCHIC]: new TrainerConfig(++t).setHasGenders().setMoneyMultiplier(1.4).setEncounterBgm(TrainerType.PSYCHIC)
    .setPartyTemplates(trainerPartyTemplates.TWO_WEAK, trainerPartyTemplates.TWO_AVG, trainerPartyTemplates.TWO_WEAK_SAME_ONE_AVG, trainerPartyTemplates.TWO_WEAK_SAME_TWO_WEAK_SAME, trainerPartyTemplates.ONE_STRONGER)
    .setSpeciesPools({
      [TrainerPoolTier.COMMON]: [ Species.ABRA, Species.DROWZEE, Species.RALTS, Species.SPOINK, Species.GOTHITA, Species.SOLOSIS, /* Species.BLIPBUG, Species.ESPURR, Species.HATTENA */  ],
      [TrainerPoolTier.UNCOMMON]: [ Species.MIME_JR, Species.EXEGGCUTE, Species.MEDITITE, Species.NATU, Species.EXEGGCUTE, Species.WOOBAT, /* Species.INKAY, Species.ORANGURU, */],
      [TrainerPoolTier.RARE]: [ Species.ELGYEM, Species.SIGILYPH, Species.BALTOY, Species.GIRAFARIG, /* Species.MEOWSTIC */],
      [TrainerPoolTier.SUPER_RARE]: [ Species.BELDUM, Species.ESPEON /* species.WYRDEER, */ ],
    }),
  [TrainerType.RANGER]: new TrainerConfig(++t).setMoneyMultiplier(1.4).setEncounterBgm(TrainerType.BACKPACKER).setHasGenders(),
  [TrainerType.RICH]: new TrainerConfig(++t).setMoneyMultiplier(5).setName('Gentleman').setHasGenders(),
  [TrainerType.RICH_KID]: new TrainerConfig(++t).setMoneyMultiplier(3.75).setName('Rich Boy').setHasGenders('Lady').setEncounterBgm(TrainerType.RICH),
  [TrainerType.ROUGHNECK]: new TrainerConfig(++t).setMoneyMultiplier(1.4).setEncounterBgm(TrainerType.ROUGHNECK).setSpeciesFilter(s => s.isOfType(Type.DARK)),
  [TrainerType.SCIENTIST]: new TrainerConfig(++t).setHasGenders().setMoneyMultiplier(1.7).setEncounterBgm(TrainerType.SCIENTIST)
    .setSpeciesPools({
      [TrainerPoolTier.COMMON]: [ Species.MAGNEMITE, Species.GRIMER, Species.DROWZEE, Species.VOLTORB, Species.KOFFING ],
      [TrainerPoolTier.UNCOMMON]: [ Species.KLINK ],
      [TrainerPoolTier.RARE ]: [ Species.ABRA, Species.PORYGON ],
      [TrainerPoolTier.SUPER_RARE ]: [ Species.OMANYTE, Species.KABUTO, Species.AERODACTYL, Species.LILEEP, Species.ANORITH, Species.CRANIDOS, Species.SHIELDON, Species.TIRTOUGA, Species.ARCHEN ]
    }),
  [TrainerType.SMASHER]: new TrainerConfig(++t).setMoneyMultiplier(1.2).setEncounterBgm(TrainerType.CYCLIST),
  [TrainerType.SNOW_WORKER]: new TrainerConfig(++t).setName('Worker').setMoneyMultiplier(1.7).setEncounterBgm(TrainerType.CLERK).setSpeciesFilter(s => s.isOfType(Type.ICE) || s.isOfType(Type.STEEL)),
  [TrainerType.STRIKER]: new TrainerConfig(++t).setMoneyMultiplier(1.2).setEncounterBgm(TrainerType.CYCLIST),
  [TrainerType.STUDENT]: new TrainerConfig(++t).setHasGenders(),
  [TrainerType.SWIMMER]: new TrainerConfig(++t).setMoneyMultiplier(1.3).setEncounterBgm(TrainerType.PARASOL_LADY).setHasGenders().setSpeciesFilter(s => s.isOfType(Type.WATER)),
  [TrainerType.TWINS]: new TrainerConfig(++t).setDouble().setMoneyMultiplier(0.65)
    .setPartyTemplateFunc(scene => getWavePartyTemplate(scene, trainerPartyTemplates.TWO_WEAK, trainerPartyTemplates.TWO_AVG, trainerPartyTemplates.TWO_STRONG))
    .setEncounterBgm(TrainerType.TWINS),
  [TrainerType.VETERAN]: new TrainerConfig(++t).setHasGenders().setMoneyMultiplier(2.5).setEncounterBgm(TrainerType.RICH),
  [TrainerType.WAITER]: new TrainerConfig(++t).setHasGenders().setMoneyMultiplier(2.25).setEncounterBgm(TrainerType.CLERK),
  [TrainerType.WORKER]: new TrainerConfig(++t).setEncounterBgm(TrainerType.CLERK).setMoneyMultiplier(1.7).setSpeciesFilter(s => s.isOfType(Type.ROCK) || s.isOfType(Type.STEEL)),
  [TrainerType.YOUNGSTER]: new TrainerConfig(++t).setMoneyMultiplier(0.5).setEncounterBgm(TrainerType.YOUNGSTER).setHasGenders('Lass', 'lass').setPartyTemplates(trainerPartyTemplates.TWO_WEAKER)
    .setSpeciesPools(
      [ Species.CATERPIE, Species.WEEDLE, Species.RATTATA, Species.SENTRET, Species.POOCHYENA, Species.ZIGZAGOON, Species.WURMPLE, Species.BIDOOF, Species.PATRAT, Species.LILLIPUP ]
    ).setEncounterMessages([
    `Hey, wanna battle?`,
    `Are you a new trainer too?`,
    `Hey, I haven't seen you before. Let's battle!`
  ], [
    `Let's have a battle, shall we?`,
    `You look like a new trainer. Let's have a battle!`,
    `I don't recognize you. How about a battle?`
  ]).setVictoryMessages([
    `Wow! You're strong!`,
    `I didn't stand a chance, huh.`,
    `I'll find you again when I'm older and beat you!`
  ], [
    `That was impressive! I've got a lot to learn.`,
    `I didn't think you'd beat me that bad…`,
    `I hope we get to have a rematch some day.`
  ]),
  [TrainerType.BROCK]: new TrainerConfig(++t).initForGymLeader(Species.GEODUDE, Type.ROCK),
  [TrainerType.MISTY]: new TrainerConfig(++t).initForGymLeader(Species.STARYU, Type.WATER),
  [TrainerType.LT_SURGE]: new TrainerConfig(++t).initForGymLeader(Species.ELECTABUZZ, Type.ELECTRIC),
  [TrainerType.ERIKA]: new TrainerConfig(++t).initForGymLeader(Species.TANGELA, Type.GRASS),
  [TrainerType.JANINE]: new TrainerConfig(++t).initForGymLeader(Species.VENONAT, Type.POISON),
  [TrainerType.SABRINA]: new TrainerConfig(++t).initForGymLeader(Species.ALAKAZAM, Type.PSYCHIC),
  [TrainerType.BLAINE]: new TrainerConfig(++t).initForGymLeader(Species.MAGMAR, Type.FIRE),
  [TrainerType.GIOVANNI]: new TrainerConfig(++t).initForGymLeader(Species.SANDILE, Type.DARK),
  [TrainerType.FALKNER]: new TrainerConfig(++t).initForGymLeader(Species.PIDGEY, Type.FLYING),
  [TrainerType.BUGSY]: new TrainerConfig(++t).initForGymLeader(Species.SCYTHER, Type.BUG),
  [TrainerType.WHITNEY]: new TrainerConfig(++t).initForGymLeader(Species.MILTANK, Type.NORMAL),
  [TrainerType.MORTY]: new TrainerConfig(++t).initForGymLeader(Species.GASTLY, Type.GHOST),
  [TrainerType.CHUCK]: new TrainerConfig(++t).initForGymLeader(Species.POLIWRATH, Type.FIGHTING),
  [TrainerType.JASMINE]: new TrainerConfig(++t).initForGymLeader(Species.STEELIX, Type.STEEL),
  [TrainerType.PRYCE]: new TrainerConfig(++t).initForGymLeader(Species.SWINUB, Type.ICE),
  [TrainerType.CLAIR]: new TrainerConfig(++t).initForGymLeader(Species.DRATINI, Type.DRAGON),
  [TrainerType.ROXANNE]: new TrainerConfig(++t).initForGymLeader(Species.NOSEPASS, Type.ROCK),
  [TrainerType.BRAWLY]: new TrainerConfig(++t).initForGymLeader(Species.MAKUHITA, Type.FIGHTING),
  [TrainerType.WATTSON]: new TrainerConfig(++t).initForGymLeader(Species.ELECTRIKE, Type.ELECTRIC),
  [TrainerType.FLANNERY]: new TrainerConfig(++t).initForGymLeader(Species.TORKOAL, Type.FIRE),
  [TrainerType.NORMAN]: new TrainerConfig(++t).initForGymLeader(Species.SLAKOTH, Type.NORMAL),
  [TrainerType.WINONA]: new TrainerConfig(++t).initForGymLeader(Species.SWABLU, Type.FLYING),
  [TrainerType.TATE]: new TrainerConfig(++t).initForGymLeader(Species.SOLROCK, Type.PSYCHIC),
  [TrainerType.LIZA]: new TrainerConfig(++t).initForGymLeader(Species.LUNATONE, Type.PSYCHIC),
  [TrainerType.JUAN]: new TrainerConfig(++t).initForGymLeader(Species.HORSEA, Type.WATER),
  [TrainerType.ROARK]: new TrainerConfig(++t).initForGymLeader(Species.CRANIDOS, Type.ROCK),
  [TrainerType.GARDENIA]: new TrainerConfig(++t).initForGymLeader(Species.ROSELIA, Type.GRASS),
  [TrainerType.MAYLENE]: new TrainerConfig(++t).initForGymLeader(Species.LUCARIO, Type.FIGHTING),
  [TrainerType.CRASHER_WAKE]: new TrainerConfig(++t).initForGymLeader(Species.BUIZEL, Type.WATER),
  [TrainerType.FANTINA]: new TrainerConfig(++t).initForGymLeader(Species.MISDREAVUS, Type.GHOST),
  [TrainerType.BYRON]: new TrainerConfig(++t).initForGymLeader(Species.SHIELDON, Type.STEEL),
  [TrainerType.CANDICE]: new TrainerConfig(++t).initForGymLeader(Species.SNEASEL, Type.ICE),
  [TrainerType.VOLKNER]: new TrainerConfig(++t).initForGymLeader(Species.SHINX, Type.ELECTRIC),
  [TrainerType.CILAN]: new TrainerConfig(++t).initForGymLeader(Species.PANSAGE, Type.GRASS),
  [TrainerType.CHILI]: new TrainerConfig(++t).initForGymLeader(Species.PANSEAR, Type.FIRE),
  [TrainerType.CRESS]: new TrainerConfig(++t).initForGymLeader(Species.PANPOUR, Type.WATER),
  [TrainerType.CHEREN]: new TrainerConfig(++t).initForGymLeader(Species.LILLIPUP, Type.NORMAL),
  [TrainerType.LENORA]: new TrainerConfig(++t).initForGymLeader(Species.KANGASKHAN, Type.NORMAL),
  [TrainerType.ROXIE]: new TrainerConfig(++t).initForGymLeader(Species.SCOLIPEDE, Type.POISON),
  [TrainerType.BURGH]: new TrainerConfig(++t).initForGymLeader(Species.SEWADDLE, Type.BUG),
  [TrainerType.ELESA]: new TrainerConfig(++t).initForGymLeader(Species.EMOLGA, Type.ELECTRIC),
  [TrainerType.CLAY]: new TrainerConfig(++t).initForGymLeader(Species.DRILBUR, Type.GROUND),
  [TrainerType.SKYLA]: new TrainerConfig(++t).initForGymLeader(Species.DUCKLETT, Type.FLYING),
  [TrainerType.BRYCEN]: new TrainerConfig(++t).initForGymLeader(Species.CRYOGONAL, Type.ICE),
  [TrainerType.DRAYDEN]: new TrainerConfig(++t).initForGymLeader(Species.DRUDDIGON, Type.DRAGON),
  [TrainerType.MARLON]: new TrainerConfig(++t).initForGymLeader(Species.WAILMER, Type.WATER),
  [TrainerType.SHAUNTAL]: new TrainerConfig(++t).initForEliteFour(Species.LITWICK, Type.GHOST),
  [TrainerType.MARSHAL]: new TrainerConfig(++t).initForEliteFour(Species.TIMBURR, Type.FIGHTING),
  [TrainerType.GRIMSLEY]: new TrainerConfig(++t).initForEliteFour(Species.PAWNIARD, Type.DARK),
  [TrainerType.CAITLIN]: new TrainerConfig(++t).initForEliteFour(Species.GOTHITA, Type.PSYCHIC),
  [TrainerType.BLUE]: new TrainerConfig(++t).initForChampion(Species.GYARADOS),
  [TrainerType.RED]: new TrainerConfig(++t).initForChampion(Species.CHARIZARD),
  [TrainerType.LANCE]: new TrainerConfig(++t).initForChampion(Species.DRAGONITE),
  [TrainerType.STEVEN]: new TrainerConfig(++t).initForChampion(Species.BELDUM),
  [TrainerType.WALLACE]: new TrainerConfig(++t).initForChampion(Species.MILOTIC),
  [TrainerType.CYNTHIA]: new TrainerConfig(++t).initForChampion(Species.GARCHOMP).setBattleBgm('battle_cynthia'),
  [TrainerType.ALDER]: new TrainerConfig(++t).initForChampion(Species.VOLCARONA),
  [TrainerType.IRIS]: new TrainerConfig(++t).initForChampion(Species.AXEW),
  [TrainerType.RIVAL]: new TrainerConfig(++t).setStaticParty().setEncounterBgm(TrainerType.RIVAL).setBattleBgm('battle_rival').setPartyTemplates(trainerPartyTemplates.RIVAL).setEncounterMessages([
    `There you are! I've been looking everywhere for you!\nDid you forget to say goodbye to your best friend?
    $So you're finally pursuing your dream, huh?\nI knew you'd do it one day…
    $Anyway, I'll forgive you for forgetting me, but on one condition. You have to battle me!
    $You'd better give it your best! Wouldn't want your adventure to be over before it started, right?`
  ]).setVictoryMessages([
    `You already have three Pokémon?!\nThat's not fair at all!
    $Just kidding! I lost fair and square, and now I know you'll do fine out there.
    $By the way, the professor wanted me to give you some items. Hopefully they're helpful!
    $Do your best like always! I believe in you!`
  ]).setModifierRewardFuncs(() => modifierTypes.SUPER_EXP_CHARM, () => modifierTypes.EXP_SHARE).setPartyMemberFunc(0, getRandomPartyMemberFunc([ Species.BULBASAUR, Species.CHARMANDER, Species.SQUIRTLE, Species.CHIKORITA, Species.CYNDAQUIL, Species.TOTODILE, Species.TREECKO, Species.TORCHIC, Species.MUDKIP, Species.TURTWIG, Species.CHIMCHAR, Species.PIPLUP, Species.SNIVY, Species.TEPIG, Species.OSHAWOTT ]))
    .setPartyMemberFunc(1, getRandomPartyMemberFunc([ Species.PIDGEY, Species.HOOTHOOT, Species.TAILLOW, Species.STARLY, Species.PIDOVE ])),
  [TrainerType.RIVAL_2]: new TrainerConfig(++t).setStaticParty().setMoneyMultiplier(1.25).setEncounterBgm(TrainerType.RIVAL).setBattleBgm('battle_rival').setPartyTemplates(trainerPartyTemplates.RIVAL_2).setEncounterMessages([
    `Oh, fancy meeting you here. Looks like you're still undefeated. Right on!
    $I know what you're thinking, and no, I wasn't following you. I just happened to be in the area.
    $I'm happy for you but I just want to let you know that it's OK to lose sometimes.
    $We learn from our mistakes, often more than we would if we kept succeeding.
    $In any case, I've been training hard for our rematch, so you'd better give it your all!`
  ]).setVictoryMessages([
    `I… wasn't supposed to lose that time…`
  ]).setPartyMemberFunc(0, getRandomPartyMemberFunc([ Species.IVYSAUR, Species.CHARMELEON, Species.WARTORTLE, Species.BAYLEEF, Species.QUILAVA, Species.CROCONAW, Species.GROVYLE, Species.COMBUSKEN, Species.MARSHTOMP, Species.GROTLE, Species.MONFERNO, Species.PRINPLUP, Species.SERVINE, Species.PIGNITE, Species.DEWOTT ]))
    .setPartyMemberFunc(1, getRandomPartyMemberFunc([ Species.PIDGEOTTO, Species.HOOTHOOT, Species.TAILLOW, Species.STARAVIA, Species.TRANQUILL ]))
    .setPartyMemberFunc(2, getSpeciesFilterRandomPartyMemberFunc((species: PokemonSpecies) => !pokemonEvolutions.hasOwnProperty(species.speciesId) && !pokemonPrevolutions.hasOwnProperty(species.speciesId) && species.baseTotal >= 450)),
  [TrainerType.RIVAL_3]: new TrainerConfig(++t).setStaticParty().setMoneyMultiplier(1.5).setEncounterBgm(TrainerType.RIVAL).setBattleBgm('battle_rival').setPartyTemplates(trainerPartyTemplates.RIVAL_3).setEncounterMessages([
    `Long time no see! Still haven't lost, huh.\nYou're starting to get on my nerves. Just kidding!
    $But really, I think it's about time you came home.\nYour family and friends miss you, you know.
    $I know your dream means a lot to you, but the reality is you're going to lose sooner or later.
    $And when you do, I'll be there for you like always.\nNow, let me show you how strong I've become!`
  ]).setVictoryMessages([
    `After all that… it wasn't enough…?`
  ]).setPartyMemberFunc(0, getRandomPartyMemberFunc([ Species.VENUSAUR, Species.CHARIZARD, Species.BLASTOISE, Species.MEGANIUM, Species.TYPHLOSION, Species.FERALIGATR, Species.SCEPTILE, Species.BLAZIKEN, Species.SWAMPERT, Species.TORTERRA, Species.INFERNAPE, Species.EMPOLEON, Species.SERPERIOR, Species.EMBOAR, Species.SAMUROTT ]))
    .setPartyMemberFunc(1, getRandomPartyMemberFunc([ Species.PIDGEOT, Species.NOCTOWL, Species.SWELLOW, Species.STARAPTOR, Species.UNFEZANT ]))
    .setPartyMemberFunc(2, getSpeciesFilterRandomPartyMemberFunc((species: PokemonSpecies) => !pokemonEvolutions.hasOwnProperty(species.speciesId) && !pokemonPrevolutions.hasOwnProperty(species.speciesId) && species.baseTotal >= 450))
    .setSpeciesFilter(species => species.baseTotal >= 540),
  [TrainerType.RIVAL_4]: new TrainerConfig(++t).setBoss().setStaticParty().setMoneyMultiplier(1.75).setEncounterBgm(TrainerType.RIVAL).setBattleBgm('battle_rival_2').setPartyTemplates(trainerPartyTemplates.RIVAL_4).setEncounterMessages([
    `It's me! You didn't forget about me again did you?
    $You made it really far! I'm proud of you.\nBut it looks like it's the end of your journey.
    $You've awoken something in me I never knew was there.\nIt seems like all I do now is train.
    $I hardly even eat or sleep now, I just train my Pokémon all day, getting stronger every time.
    $And now, I've finally reached peak performance.\nI don't think anyone could beat me now.
    $And you know what? It's all because of you.\nI don't know whether to thank you or hate you.
    $Prepare yourself.`
  ]).setVictoryMessages([
    `What…@d{64} what are you?`
  ]).setPartyMemberFunc(0, getRandomPartyMemberFunc([ Species.VENUSAUR, Species.CHARIZARD, Species.BLASTOISE, Species.MEGANIUM, Species.TYPHLOSION, Species.FERALIGATR, Species.SCEPTILE, Species.BLAZIKEN, Species.SWAMPERT, Species.TORTERRA, Species.INFERNAPE, Species.EMPOLEON, Species.SERPERIOR, Species.EMBOAR, Species.SAMUROTT ]))
    .setPartyMemberFunc(1, getRandomPartyMemberFunc([ Species.PIDGEOT, Species.NOCTOWL, Species.SWELLOW, Species.STARAPTOR, Species.UNFEZANT ]))
    .setPartyMemberFunc(2, getSpeciesFilterRandomPartyMemberFunc((species: PokemonSpecies) => !pokemonEvolutions.hasOwnProperty(species.speciesId) && !pokemonPrevolutions.hasOwnProperty(species.speciesId) && species.baseTotal >= 450))
    .setSpeciesFilter(species => species.baseTotal >= 540),
  [TrainerType.RIVAL_5]: new TrainerConfig(++t).setBoss().setStaticParty().setMoneyMultiplier(2.25).setEncounterBgm(TrainerType.RIVAL).setBattleBgm('battle_rival_3').setPartyTemplates(trainerPartyTemplates.RIVAL_5).setEncounterMessages([ `…` ]).setVictoryMessages([ '…' ])
    .setPartyMemberFunc(0, getRandomPartyMemberFunc([ Species.VENUSAUR, Species.CHARIZARD, Species.BLASTOISE, Species.MEGANIUM, Species.TYPHLOSION, Species.FERALIGATR, Species.SCEPTILE, Species.BLAZIKEN, Species.SWAMPERT, Species.TORTERRA, Species.INFERNAPE, Species.EMPOLEON, Species.SERPERIOR, Species.EMBOAR, Species.SAMUROTT ]))
    .setPartyMemberFunc(1, getRandomPartyMemberFunc([ Species.PIDGEOT, Species.NOCTOWL, Species.SWELLOW, Species.STARAPTOR, Species.UNFEZANT ]))
    .setPartyMemberFunc(2, getSpeciesFilterRandomPartyMemberFunc((species: PokemonSpecies) => !pokemonEvolutions.hasOwnProperty(species.speciesId) && !pokemonPrevolutions.hasOwnProperty(species.speciesId) && species.baseTotal >= 450))
    .setSpeciesFilter(species => species.baseTotal >= 540)
    .setPartyMemberFunc(5, getRandomPartyMemberFunc([ Species.RAYQUAZA ])),
  [TrainerType.RIVAL_6]: new TrainerConfig(++t).setBoss().setStaticParty().setMoneyMultiplier(3).setEncounterBgm('final').setBattleBgm('battle_rival_3').setPartyTemplates(trainerPartyTemplates.RIVAL_6)
    .setPartyMemberFunc(0, getRandomPartyMemberFunc([ Species.VENUSAUR, Species.CHARIZARD, Species.BLASTOISE, Species.MEGANIUM, Species.TYPHLOSION, Species.FERALIGATR, Species.SCEPTILE, Species.BLAZIKEN, Species.SWAMPERT, Species.TORTERRA, Species.INFERNAPE, Species.EMPOLEON, Species.SERPERIOR, Species.EMBOAR, Species.SAMUROTT ]))
    .setPartyMemberFunc(1, getRandomPartyMemberFunc([ Species.PIDGEOT, Species.NOCTOWL, Species.SWELLOW, Species.STARAPTOR, Species.UNFEZANT ]))
    .setPartyMemberFunc(2, getSpeciesFilterRandomPartyMemberFunc((species: PokemonSpecies) => !pokemonEvolutions.hasOwnProperty(species.speciesId) && !pokemonPrevolutions.hasOwnProperty(species.speciesId) && species.baseTotal >= 450))
    .setSpeciesFilter(species => species.baseTotal >= 540)
    .setPartyMemberFunc(5, getRandomPartyMemberFunc([ Species.RAYQUAZA ], p => p.formIndex = 1)),
}