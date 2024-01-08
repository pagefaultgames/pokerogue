import BattleScene, { startingWave } from "../battle-scene";
import { ModifierTypeFunc, modifierTypes } from "../modifier/modifier-type";
import { EnemyPokemon } from "../pokemon";
import * as Utils from "../utils";
import { Moves } from "./move";
import { PokeballType } from "./pokeball";
import { pokemonEvolutions, pokemonPrevolutions } from "./pokemon-evolutions";
import PokemonSpecies, { PokemonSpeciesFilter, getPokemonSpecies } from "./pokemon-species";
import { Species } from "./species";
import { tmSpecies } from "./tms";
import { Type } from "./type";

export enum TrainerType {
  UNKNOWN,
  ACE_TRAINER,
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

  BROCK = 200,
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
  VIOLA,
  GRANT,
  KORRINA,
  RAMOS,
  CLEMONT,
  VALERIE,
  OLYMPIA,
  WULFRIC,
  MILO,
  NESSA,
  KABU,
  BEA,
  ALLISTER,
  OPAL,
  BEDE,
  GORDIE,
  MELONY,
  PIERS,
  MARNIE,
  RAIHAN,
  /*KATY,
  BRASSIUS,
  IONO,
  KOFU,
  LARRY,
  RYME,
  TULIP,
  GRUSHA*/

  LORELEI = 300,
  BRUNO,
  AGATHA,
  LANCE,
  WILL,
  KOGA,
  KAREN,
  SIDNEY,
  PHOEBE,
  GLACIA,
  DRAKE,
  AARON,
  BERTHA,
  FLINT,
  LUCIAN,
  SHAUNTAL,
  MARSHAL,
  GRIMSLEY,
  CAITLIN,
  MALVA,
  SIEBOLD,
  WIKSTROM,
  DRASNA,
  HALA,
  MOLAYNE,
  OLIVIA,
  ACEROLA,
  KAHILI,
  /*RIKA,
  POPPY,
  LARRY_ELITE,
  HASSEL*/

  BLUE = 350,
  RED,
  LANCE_CHAMPION,
  STEVEN,
  WALLACE,
  CYNTHIA,
  ALDER,
  IRIS,
  DIANTHA,
  LEON,
  /*GEETA,
  NEMONA,
  KIERAN,*/

  RIVAL = 375,
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
}

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
  ONE_WEAK_ONE_STRONG: new TrainerPartyCompoundTemplate(new TrainerPartyTemplate(1, TrainerPartyMemberStrength.WEAK), new TrainerPartyTemplate(1, TrainerPartyMemberStrength.STRONG)),
  ONE_AVG: new TrainerPartyTemplate(1, TrainerPartyMemberStrength.AVERAGE),
  ONE_AVG_ONE_STRONG: new TrainerPartyCompoundTemplate(new TrainerPartyTemplate(1, TrainerPartyMemberStrength.AVERAGE), new TrainerPartyTemplate(1, TrainerPartyMemberStrength.STRONG)),
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
  GYM_LEADER_2: new TrainerPartyCompoundTemplate(new TrainerPartyTemplate(1, TrainerPartyMemberStrength.AVERAGE), new TrainerPartyTemplate(1, TrainerPartyMemberStrength.STRONG), new TrainerPartyTemplate(1, TrainerPartyMemberStrength.STRONGER)),
  GYM_LEADER_3: new TrainerPartyCompoundTemplate(new TrainerPartyTemplate(2, TrainerPartyMemberStrength.AVERAGE), new TrainerPartyTemplate(1, TrainerPartyMemberStrength.STRONG), new TrainerPartyTemplate(1, TrainerPartyMemberStrength.STRONGER)),
  GYM_LEADER_4: new TrainerPartyCompoundTemplate(new TrainerPartyTemplate(3, TrainerPartyMemberStrength.AVERAGE), new TrainerPartyTemplate(1, TrainerPartyMemberStrength.STRONG), new TrainerPartyTemplate(1, TrainerPartyMemberStrength.STRONGER)),
  GYM_LEADER_5: new TrainerPartyCompoundTemplate(new TrainerPartyTemplate(4, TrainerPartyMemberStrength.AVERAGE), new TrainerPartyTemplate(1, TrainerPartyMemberStrength.STRONG), new TrainerPartyTemplate(1, TrainerPartyMemberStrength.STRONGER)),

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
  public useSameSeedForAllMembers: boolean = false;
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
  public specialtyTypes: Type[] = [];

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
      case TrainerType.LANCE_CHAMPION:
        trainerType = TrainerType.LANCE;
        break;
      /*case TrainerType.LARRY_ELITE:
        trainerType = TrainerType.LARRY;
        break;*/
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

  setUseSameSeedForAllMembers(): TrainerConfig {
    this.useSameSeedForAllMembers = true;
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

  setSpecialtyTypes(...specialtyTypes: Type[]): TrainerConfig {
    this.specialtyTypes = specialtyTypes;
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

  initForGymLeader(signatureSpecies: (Species | Species[])[], ...specialtyTypes: Type[]): TrainerConfig {
    this.setPartyTemplateFunc(getGymLeaderPartyTemplate);
    signatureSpecies.forEach((speciesPool, s) => {
      if (!Array.isArray(speciesPool))
        speciesPool = [ speciesPool ];
      this.setPartyMemberFunc(-(s + 1), getRandomPartyMemberFunc(speciesPool));
    });
    if (specialtyTypes.length) {
      this.setSpeciesFilter(p => !!specialtyTypes.find(t => p.isOfType(t)));
      this.setSpecialtyTypes(...specialtyTypes);
    }
    this.setMoneyMultiplier(2.5);
    this.setBoss();
    this.setStaticParty();
    this.setBattleBgm('battle_gym');
    this.setVictoryBgm('victory_gym');
    return this;
  }

  initForEliteFour(signatureSpecies: (Species | Species[])[], ...specialtyTypes: Type[]): TrainerConfig {
    this.setPartyTemplates(trainerPartyTemplates.ELITE_FOUR);
    signatureSpecies.forEach((speciesPool, s) => {
      if (!Array.isArray(speciesPool))
        speciesPool = [ speciesPool ];
      this.setPartyMemberFunc(-(s + 1), getRandomPartyMemberFunc(speciesPool));
    });
    if (specialtyTypes.length) {
      this.setSpeciesFilter(p => specialtyTypes.find(t => p.isOfType(t)) && p.baseTotal >= 450);
      this.setSpecialtyTypes(...specialtyTypes);
    } else
      this.setSpeciesFilter(p => p.baseTotal >= 450);
    this.setMoneyMultiplier(3.25);
    this.setBoss();
    this.setStaticParty();
    this.setBattleBgm('battle_elite');
    this.setVictoryBgm('victory_gym');
    return this;
  }

  initForChampion(signatureSpecies: (Species | Species[])[]): TrainerConfig {
    this.setPartyTemplates(trainerPartyTemplates.CHAMPION);
    signatureSpecies.forEach((speciesPool, s) => {
      if (!Array.isArray(speciesPool))
        speciesPool = [ speciesPool ];
      this.setPartyMemberFunc(-(s + 1), getRandomPartyMemberFunc(speciesPool));
    });
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
  return templates[Math.min(Math.max(Math.ceil(((scene.currentBattle?.waveIndex || startingWave) - 20) / 30), 0), templates.length - 1)];
}

function getGymLeaderPartyTemplate(scene: BattleScene) {
  return getWavePartyTemplate(scene, trainerPartyTemplates.GYM_LEADER_1, trainerPartyTemplates.GYM_LEADER_2, trainerPartyTemplates.GYM_LEADER_3, trainerPartyTemplates.GYM_LEADER_4, trainerPartyTemplates.GYM_LEADER_5);
}

function getRandomPartyMemberFunc(speciesPool: Species[], postProcess?: (enemyPokemon: EnemyPokemon) => void): PartyMemberFunc {
  return (scene: BattleScene, level: integer) => {
    const species = getPokemonSpecies(Phaser.Math.RND.pick(speciesPool)).getSpeciesForLevel(level, true, true, scene.currentBattle.trainer.config.isBoss);
    return scene.addEnemyPokemon(getPokemonSpecies(species), level, true, undefined, undefined, postProcess);
  };
}

function getSpeciesFilterRandomPartyMemberFunc(speciesFilter: PokemonSpeciesFilter, allowLegendaries?: boolean, postProcess?: (EnemyPokemon: EnemyPokemon) => void): PartyMemberFunc {
  const originalSpeciesFilter = speciesFilter;
  speciesFilter = (species: PokemonSpecies) => allowLegendaries || (!species.legendary && !species.pseudoLegendary && !species.mythical) && originalSpeciesFilter(species);
  return (scene: BattleScene, level: integer) => {
    const ret = scene.addEnemyPokemon(getPokemonSpecies(scene.randomSpecies(scene.currentBattle.waveIndex, level, false, speciesFilter).getSpeciesForLevel(level, true, true, scene.currentBattle.trainer.config.isBoss)), level, true, undefined, undefined, postProcess);
    return ret;
  };
}

export const trainerConfigs: TrainerConfigs = {
  [TrainerType.UNKNOWN]: new TrainerConfig(0).setHasGenders(),
  [TrainerType.ACE_TRAINER]: new TrainerConfig(++t).setHasGenders().setMoneyMultiplier(2.25).setEncounterBgm(TrainerType.ACE_TRAINER)
    .setPartyTemplateFunc(scene => getWavePartyTemplate(scene, trainerPartyTemplates.THREE_WEAK_BALANCED, trainerPartyTemplates.FOUR_WEAK_BALANCED, trainerPartyTemplates.FIVE_WEAK_BALANCED, trainerPartyTemplates.SIX_WEAK_BALANCED)),
  [TrainerType.ARTIST]: new TrainerConfig(++t).setEncounterBgm(TrainerType.RICH).setPartyTemplates(trainerPartyTemplates.ONE_STRONG, trainerPartyTemplates.TWO_AVG, trainerPartyTemplates.THREE_AVG)
    .setSpeciesPools([ Species.SMEARGLE ]),
  [TrainerType.BACKERS]: new TrainerConfig(++t).setHasGenders().setDouble().setEncounterBgm(TrainerType.CYCLIST),
  [TrainerType.BACKPACKER]: new TrainerConfig(++t).setHasGenders().setSpeciesFilter(s => s.isOfType(Type.FLYING) || s.isOfType(Type.ROCK)).setEncounterBgm(TrainerType.BACKPACKER)
    .setPartyTemplates(trainerPartyTemplates.ONE_STRONG, trainerPartyTemplates.ONE_WEAK_ONE_STRONG, trainerPartyTemplates.ONE_AVG_ONE_STRONG)
    .setSpeciesPools({
      [TrainerPoolTier.COMMON]: [ Species.RHYHORN, Species.AIPOM, Species.MAKUHITA, Species.MAWILE, Species.NUMEL, Species.LILLIPUP, Species.SANDILE, Species.WOOLOO ],
      [TrainerPoolTier.UNCOMMON]: [ Species.GIRAFARIG, Species.ZANGOOSE, Species.SEVIPER, Species.CUBCHOO, Species.PANCHAM, Species.SKIDDO, Species.MUDBRAY ],
      [TrainerPoolTier.RARE]: [ Species.TAUROS, Species.STANTLER, Species.DARUMAKA, Species.BOUFFALANT, Species.DEERLING, Species.IMPIDIMP ], 
      [TrainerPoolTier.SUPER_RARE]: [ Species.GALAR_DARUMAKA, Species.TEDDIURSA ]
    }),
  [TrainerType.BAKER]: new TrainerConfig(++t).setEncounterBgm(TrainerType.CLERK).setMoneyMultiplier(1.35).setSpeciesFilter(s => s.isOfType(Type.GRASS) || s.isOfType(Type.FIRE)),
  [TrainerType.BEAUTY]: new TrainerConfig(++t).setMoneyMultiplier(1.55).setEncounterBgm(TrainerType.PARASOL_LADY),
  [TrainerType.BIKER]: new TrainerConfig(++t).setMoneyMultiplier(1.4).setEncounterBgm(TrainerType.ROUGHNECK).setSpeciesFilter(s => s.isOfType(Type.POISON)),
  [TrainerType.BLACK_BELT]: new TrainerConfig(++t).setHasGenders('Battle Girl', TrainerType.PSYCHIC).setEncounterBgm(TrainerType.ROUGHNECK).setSpecialtyTypes(Type.FIGHTING)
    .setPartyTemplates(trainerPartyTemplates.TWO_WEAK_ONE_AVG, trainerPartyTemplates.TWO_WEAK_ONE_AVG, trainerPartyTemplates.TWO_AVG, trainerPartyTemplates.TWO_AVG, trainerPartyTemplates.TWO_WEAK_ONE_STRONG, trainerPartyTemplates.THREE_AVG, trainerPartyTemplates.TWO_AVG_ONE_STRONG)
    .setSpeciesPools({
      [TrainerPoolTier.COMMON]: [ Species.NIDORAN_F, Species.NIDORAN_M, Species.MACHOP, Species.MAKUHITA, Species.MEDITITE, Species.CROAGUNK, Species.TIMBURR ],
      [TrainerPoolTier.UNCOMMON]: [ Species.MANKEY, Species.POLIWRATH, Species.TYROGUE, Species.BRELOOM, Species.SCRAGGY, Species.MIENFOO, Species.PANCHAM, Species.STUFFUL, Species.CRABRAWLER ],
      [TrainerPoolTier.RARE]: [ Species.HERACROSS, Species.RIOLU, Species.THROH, Species.SAWK, Species.PASSIMIAN, Species.CLOBBOPUS ], 
      [TrainerPoolTier.SUPER_RARE]: [ Species.HITMONTOP, Species.INFERNAPE, Species.GALLADE, Species.HAWLUCHA, Species.HAKAMO_O ],
      [TrainerPoolTier.ULTRA_RARE]: [ Species.KUBFU ]
    }),
  [TrainerType.BREEDER]: new TrainerConfig(++t).setMoneyMultiplier(1.325).setEncounterBgm(TrainerType.POKEFAN).setHasGenders().setDouble()
    .setPartyTemplateFunc(scene => getWavePartyTemplate(scene, trainerPartyTemplates.FOUR_WEAKER, trainerPartyTemplates.FIVE_WEAKER, trainerPartyTemplates.SIX_WEAKER)),
  [TrainerType.CLERK]: new TrainerConfig(++t).setHasGenders().setEncounterBgm(TrainerType.CLERK)
    .setPartyTemplates(trainerPartyTemplates.TWO_WEAK, trainerPartyTemplates.THREE_WEAK, trainerPartyTemplates.ONE_AVG, trainerPartyTemplates.TWO_AVG, trainerPartyTemplates.TWO_WEAK_ONE_AVG)
    .setSpeciesPools({
      [TrainerPoolTier.COMMON]: [ Species.MEOWTH, Species.PSYDUCK, Species.BUDEW, Species.PIDOVE, Species.CINCCINO, Species.LITLEO  ],
      [TrainerPoolTier.UNCOMMON]: [ Species.JIGGLYPUFF, Species.MAGNEMITE, Species.MARILL, Species.COTTONEE, Species.SKIDDO ],
      [TrainerPoolTier.RARE]: [ Species.BUIZEL, Species.SNEASEL, Species.KLEFKI, Species.INDEEDEE ]
    }),
  [TrainerType.CYCLIST]: new TrainerConfig(++t).setMoneyMultiplier(1.3).setHasGenders().setEncounterBgm(TrainerType.CYCLIST)
    .setPartyTemplates(trainerPartyTemplates.TWO_WEAK, trainerPartyTemplates.ONE_AVG)
    .setSpeciesPools({
      [TrainerPoolTier.COMMON]: [ Species.PICHU, Species.STARLY, Species.TAILLOW, Species.BOLTUND ],
      [TrainerPoolTier.UNCOMMON]: [  Species.DODUO, Species.ELECTRIKE, Species.BLITZLE, /* Species.WATTREL */],
      [TrainerPoolTier.RARE]: [ Species.YANMA, Species.NINJASK, Species.WHIRLIPEDE, Species.EMOLGA ],
      [TrainerPoolTier.SUPER_RARE]: [ Species.ACCELGOR, Species.DREEPY ]
    }),
  [TrainerType.DANCER]: new TrainerConfig(++t).setMoneyMultiplier(1.55).setEncounterBgm(TrainerType.CYCLIST)
    .setPartyTemplates(trainerPartyTemplates.TWO_WEAK, trainerPartyTemplates.ONE_AVG, trainerPartyTemplates.TWO_AVG, trainerPartyTemplates.TWO_WEAK_SAME_TWO_WEAK_SAME)
    .setSpeciesPools({
      [TrainerPoolTier.COMMON]: [ Species.RALTS, Species.SPOINK, Species.LOTAD, Species.BUDEW ],
      [TrainerPoolTier.UNCOMMON]: [ Species.SPINDA, Species.SWABLU, Species.MARACTUS,],
      [TrainerPoolTier.RARE]: [ Species.BELLOSSOM, Species.HITMONTOP, Species.MIME_JR, Species.ORICORIO ], 
      [TrainerPoolTier.SUPER_RARE]: [ Species.POPPLIO ]
    }),
  [TrainerType.DEPOT_AGENT]: new TrainerConfig(++t).setMoneyMultiplier(1.45).setEncounterBgm(TrainerType.CLERK),
  [TrainerType.DOCTOR]: new TrainerConfig(++t).setMoneyMultiplier(3).setEncounterBgm(TrainerType.CLERK),
  [TrainerType.FISHERMAN]: new TrainerConfig(++t).setMoneyMultiplier(1.25).setEncounterBgm(TrainerType.BACKPACKER).setSpecialtyTypes(Type.WATER)
    .setPartyTemplates(trainerPartyTemplates.TWO_WEAK_SAME_ONE_AVG, trainerPartyTemplates.ONE_AVG, trainerPartyTemplates.THREE_WEAK_SAME, trainerPartyTemplates.ONE_STRONG, trainerPartyTemplates.SIX_WEAKER)
    .setSpeciesPools({
      [TrainerPoolTier.COMMON]: [ Species.TENTACOOL, Species.MAGIKARP, Species.GOLDEEN, Species.STARYU, Species.REMORAID, Species.SKRELP, Species.CLAUNCHER, Species.ARROKUDA ],
      [TrainerPoolTier.UNCOMMON]: [ Species.POLIWAG, Species.SHELLDER, Species.KRABBY, Species.HORSEA, Species.CARVANHA, Species.BARBOACH, Species.CORPHISH, Species.FINNEON, Species.TYMPOLE, Species.BASCULIN, Species.FRILLISH, Species.INKAY ],
      [TrainerPoolTier.RARE]: [ Species.CHINCHOU, Species.CORSOLA, Species.WAILMER, Species.BARBOACH, Species.CLAMPERL, Species.LUVDISC, Species.MANTYKE, Species.ALOMOMOLA, /* Species.TATSUGIRI */ /* Species.VELUZA */ ],
      [TrainerPoolTier.SUPER_RARE]: [ Species.LAPRAS, Species.FEEBAS, Species.RELICANTH, /* Species.DONDOZO */ ]
    }),
  [TrainerType.GUITARIST]: new TrainerConfig(++t).setMoneyMultiplier(1.2).setEncounterBgm(TrainerType.ROUGHNECK).setSpecialtyTypes(Type.ELECTRIC).setSpeciesFilter(s => s.isOfType(Type.ELECTRIC)),
  [TrainerType.HARLEQUIN]: new TrainerConfig(++t).setEncounterBgm(TrainerType.PSYCHIC).setSpeciesFilter(s => tmSpecies[Moves.TRICK_ROOM].indexOf(s.speciesId) > -1),
  [TrainerType.HIKER]: new TrainerConfig(++t).setEncounterBgm(TrainerType.BACKPACKER)
    .setPartyTemplates(trainerPartyTemplates.TWO_AVG_SAME_ONE_AVG, trainerPartyTemplates.TWO_AVG_SAME_ONE_STRONG, trainerPartyTemplates.TWO_AVG, trainerPartyTemplates.FOUR_WEAK, trainerPartyTemplates.ONE_STRONG)
    .setSpeciesPools({
      [TrainerPoolTier.COMMON]: [ Species.SANDSHREW, Species.DIGLETT, Species.GEODUDE, Species.MACHOP, Species.ARON, Species.ROGGENROLA, Species.DRILBUR, /* Species.NACLI */ ],
      [TrainerPoolTier.UNCOMMON]: [ Species.ZUBAT, Species.RHYHORN, Species.ONIX, Species.CUBONE, Species.WOOBAT, Species.SWINUB, Species.NOSEPASS, Species.HIPPOPOTAS, Species.DWEBBLE, /* Species.KLAWF */ /* Species.TOEDSCOOL */ ],
      [TrainerPoolTier.RARE]: [ Species.TORKOAL, Species.TRAPINCH, Species.BARBOACH, Species.GOLETT, Species.ALOLA_DIGLETT, Species.ALOLA_GEODUDE, Species.GALAR_STUNFISK /* Species.PALDEA_WOOPER */ ],
      [TrainerPoolTier.SUPER_RARE]: [ Species.MAGBY, Species.LARVITAR ]
    }),
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
    .setPartyTemplates(trainerPartyTemplates.ONE_AVG, trainerPartyTemplates.ONE_STRONG, trainerPartyTemplates.TWO_AVG, trainerPartyTemplates.TWO_WEAK_SAME_ONE_AVG)
    .setSpeciesPools({ 
      [TrainerPoolTier.COMMON]: [ Species.VULPIX, Species.GROWLITHE, Species.SNUBBULL, Species.POOCHYENA, Species.ELECTRIKE, Species.LILLIPUP, Species.YAMPER /* , Species.FIDOUGH */ ],
      [TrainerPoolTier.UNCOMMON]: [ Species.HOUNDOUR, Species.ROCKRUFF /*, Species.MASCHIFF */ ],
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
      [TrainerPoolTier.COMMON]: [ Species.CATERPIE, Species.PICHU, Species.SANDSHREW, Species.LEDYBA, Species.BUDEW, Species.BURMY, Species.WOOLOO, /* Species.PAWMI, Species.SMOLIV, */ ],
      [TrainerPoolTier.UNCOMMON]: [ Species.EEVEE, Species.CLEFFA, Species.IGGLYBUFF, Species.SWINUB, Species.WOOPER, Species.DRIFLOON, Species.DEDENNE, Species.STUFFUL ],
      [TrainerPoolTier.RARE]: [ Species.RALTS, Species.RIOLU, Species.JOLTIK /* Species.TANDEMAUS, */ ],
      [TrainerPoolTier.SUPER_RARE]: [  Species.DARUMAKA, /* Species.TINKATINK, */],
    }),
  [TrainerType.PSYCHIC]: new TrainerConfig(++t).setHasGenders().setMoneyMultiplier(1.4).setEncounterBgm(TrainerType.PSYCHIC)
    .setPartyTemplates(trainerPartyTemplates.TWO_WEAK, trainerPartyTemplates.TWO_AVG, trainerPartyTemplates.TWO_WEAK_SAME_ONE_AVG, trainerPartyTemplates.TWO_WEAK_SAME_TWO_WEAK_SAME, trainerPartyTemplates.ONE_STRONGER)
    .setSpeciesPools({
      [TrainerPoolTier.COMMON]: [ Species.ABRA, Species.DROWZEE, Species.RALTS, Species.SPOINK, Species.GOTHITA, Species.SOLOSIS, Species.BLIPBUG, Species.ESPURR, Species.HATENNA ],
      [TrainerPoolTier.UNCOMMON]: [ Species.MIME_JR, Species.EXEGGCUTE, Species.MEDITITE, Species.NATU, Species.EXEGGCUTE, Species.WOOBAT, Species.INKAY, Species.ORANGURU ],
      [TrainerPoolTier.RARE]: [ Species.ELGYEM, Species.SIGILYPH, Species.BALTOY, Species.GIRAFARIG, Species.MEOWSTIC ],
      [TrainerPoolTier.SUPER_RARE]: [ Species.BELDUM, Species.ESPEON, Species.WYRDEER ],
    }),
  [TrainerType.RANGER]: new TrainerConfig(++t).setMoneyMultiplier(1.4).setEncounterBgm(TrainerType.BACKPACKER).setHasGenders()
    .setSpeciesPools({
      [TrainerPoolTier.COMMON]: [ Species.PICHU, Species.GROWLITHE, Species.PONYTA, Species.ZIGZAGOON, Species.SEEDOT, Species.BIDOOF, Species.RIOLU, Species.SEWADDLE, Species.SKIDDO, Species.SALANDIT, Species.YAMPER ],
      [TrainerPoolTier.UNCOMMON]: [ Species.AZURILL, Species.TAUROS, Species.MAREEP, Species.FARFETCHD, Species.TEDDIURSA, Species.SHROOMISH, Species.ELECTRIKE, Species.BUDEW, Species.BUIZEL, Species.MUDBRAY, Species.STUFFUL ],
      [TrainerPoolTier.RARE]: [ Species.EEVEE, Species.SCYTHER, Species.KANGASKHAN, Species.RALTS, Species.MUNCHLAX, Species.ZORUA, /* Species.PALDEA_TAUROS */ /* Species.TINKATINK */ /* Species.CYCLIZAR */ /* Species.FLAMIGO */ ],
      [TrainerPoolTier.SUPER_RARE]: [ Species.LARVESTA ],
    }),
  [TrainerType.RICH]: new TrainerConfig(++t).setMoneyMultiplier(5).setName('Gentleman').setHasGenders(),
  [TrainerType.RICH_KID]: new TrainerConfig(++t).setMoneyMultiplier(3.75).setName('Rich Boy').setHasGenders('Lady').setEncounterBgm(TrainerType.RICH),
  [TrainerType.ROUGHNECK]: new TrainerConfig(++t).setMoneyMultiplier(1.4).setEncounterBgm(TrainerType.ROUGHNECK).setSpeciesFilter(s => s.isOfType(Type.DARK)),
  [TrainerType.SCIENTIST]: new TrainerConfig(++t).setHasGenders().setMoneyMultiplier(1.7).setEncounterBgm(TrainerType.SCIENTIST)
    .setSpeciesPools({
      [TrainerPoolTier.COMMON]: [ Species.MAGNEMITE, Species.GRIMER, Species.DROWZEE, Species.VOLTORB, Species.KOFFING ],
      [TrainerPoolTier.UNCOMMON]: [ Species.BALTOY, Species.BRONZOR, Species.FERROSEED, Species.KLINK, Species.CHARJABUG, Species.BLIPBUG, Species.HELIOPTILE ],
      [TrainerPoolTier.RARE]: [ Species.ABRA, Species.DITTO, Species.PORYGON, Species.ELEKID, Species.SOLOSIS, Species.GALAR_WEEZING ],
      [TrainerPoolTier.SUPER_RARE]: [ Species.OMANYTE, Species.KABUTO, Species.AERODACTYL, Species.LILEEP, Species.ANORITH, Species.CRANIDOS, Species.SHIELDON, Species.TIRTOUGA, Species.ARCHEN, Species.ARCTOVISH, Species.ARCTOZOLT, Species.DRACOVISH, Species.DRACOZOLT ],
      [TrainerPoolTier.ULTRA_RARE]: [ Species.ROTOM, Species.MELTAN ]
    }),
  [TrainerType.SMASHER]: new TrainerConfig(++t).setMoneyMultiplier(1.2).setEncounterBgm(TrainerType.CYCLIST),
  [TrainerType.SNOW_WORKER]: new TrainerConfig(++t).setName('Worker').setMoneyMultiplier(1.7).setEncounterBgm(TrainerType.CLERK).setSpeciesFilter(s => s.isOfType(Type.ICE) || s.isOfType(Type.STEEL)),
  [TrainerType.STRIKER]: new TrainerConfig(++t).setMoneyMultiplier(1.2).setEncounterBgm(TrainerType.CYCLIST),
  [TrainerType.STUDENT]: new TrainerConfig(++t).setHasGenders(),
  [TrainerType.SWIMMER]: new TrainerConfig(++t).setMoneyMultiplier(1.3).setEncounterBgm(TrainerType.PARASOL_LADY).setHasGenders().setSpecialtyTypes(Type.WATER).setSpeciesFilter(s => s.isOfType(Type.WATER)),
  [TrainerType.TWINS]: new TrainerConfig(++t).setDouble().setMoneyMultiplier(0.65).setUseSameSeedForAllMembers()
    .setPartyTemplateFunc(scene => getWavePartyTemplate(scene, trainerPartyTemplates.TWO_WEAK, trainerPartyTemplates.TWO_AVG, trainerPartyTemplates.TWO_STRONG))
    .setPartyMemberFunc(0, getRandomPartyMemberFunc([ Species.PLUSLE, Species.VOLBEAT, Species.PACHIRISU, Species.SILCOON, Species.METAPOD, Species.IGGLYBUFF, Species.PETILIL, Species.EEVEE ]))
    .setPartyMemberFunc(1, getRandomPartyMemberFunc([ Species.MINUN, Species.ILLUMISE, Species.EMOLGA, Species.CASCOON, Species.KAKUNA, Species.CLEFFA, Species.COTTONEE, Species.EEVEE ]))
    .setEncounterBgm(TrainerType.TWINS),
  [TrainerType.VETERAN]: new TrainerConfig(++t).setHasGenders().setMoneyMultiplier(2.5).setEncounterBgm(TrainerType.RICH),
  [TrainerType.WAITER]: new TrainerConfig(++t).setMoneyMultiplier(1.5).setHasGenders('Waitress').setEncounterBgm(TrainerType.CLERK)
    .setSpeciesPools({
      [TrainerPoolTier.COMMON]: [ Species.CLEFFA, Species.CHATOT, Species.PANSAGE, Species.PANSEAR, Species.PANPOUR, Species.MINCCINO ],
      [TrainerPoolTier.UNCOMMON]: [ Species.TROPIUS, Species.PETILIL, Species.BOUNSWEET, Species.INDEEDEE ],
      [TrainerPoolTier.RARE]: [ Species.APPLIN, Species.SINISTEA, /* Species.POLTCHAGEIST */ ]
    }),
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

  [TrainerType.BROCK]: new TrainerConfig((t = TrainerType.BROCK)).initForGymLeader([ Species.GEODUDE, Species.ONIX ], Type.ROCK),
  [TrainerType.MISTY]: new TrainerConfig(++t).initForGymLeader([ Species.STARYU, Species.PSYDUCK ], Type.WATER),
  [TrainerType.LT_SURGE]: new TrainerConfig(++t).initForGymLeader([ Species.VOLTORB, Species.PIKACHU, Species.ELECTABUZZ ], Type.ELECTRIC),
  [TrainerType.ERIKA]: new TrainerConfig(++t).initForGymLeader([ Species.ODDISH, Species.BELLSPROUT, Species.TANGELA, Species.HOPPIP ], Type.GRASS),
  [TrainerType.JANINE]: new TrainerConfig(++t).initForGymLeader([ Species.VENONAT, Species.SPINARAK, Species.ZUBAT ], Type.POISON),
  [TrainerType.SABRINA]: new TrainerConfig(++t).initForGymLeader([ Species.ABRA, Species.MR_MIME, Species.ESPEON ], Type.PSYCHIC),
  [TrainerType.BLAINE]: new TrainerConfig(++t).initForGymLeader([ Species.GROWLITHE, Species.PONYTA, Species.MAGMAR ], Type.FIRE),
  [TrainerType.GIOVANNI]: new TrainerConfig(++t).initForGymLeader([ Species.SANDILE, Species.MURKROW, Species.NIDORAN_M, Species.NIDORAN_F ], Type.DARK),
  [TrainerType.FALKNER]: new TrainerConfig(++t).initForGymLeader([ Species.PIDGEY, Species.HOOTHOOT, Species.DODUO ], Type.FLYING),
  [TrainerType.BUGSY]: new TrainerConfig(++t).initForGymLeader([ Species.SCYTHER, Species.HERACROSS, Species.SHUCKLE, Species.PINSIR ], Type.BUG),
  [TrainerType.WHITNEY]: new TrainerConfig(++t).initForGymLeader([ Species.CLEFAIRY, Species.MILTANK ], Type.NORMAL),
  [TrainerType.MORTY]: new TrainerConfig(++t).initForGymLeader([ Species.GASTLY, Species.MISDREAVUS, Species.SABLEYE ], Type.GHOST),
  [TrainerType.CHUCK]: new TrainerConfig(++t).initForGymLeader([ Species.POLIWRATH, ], Type.FIGHTING),
  [TrainerType.JASMINE]: new TrainerConfig(++t).initForGymLeader([ Species.MAGNEMITE, Species.STEELIX ], Type.STEEL),
  [TrainerType.PRYCE]: new TrainerConfig(++t).initForGymLeader([ Species.SEEL, Species.SWINUB ], Type.ICE),
  [TrainerType.CLAIR]: new TrainerConfig(++t).initForGymLeader([ Species.DRATINI, Species.HORSEA, Species.GYARADOS ], Type.DRAGON),
  [TrainerType.ROXANNE]: new TrainerConfig(++t).initForGymLeader([ Species.GEODUDE, Species.NOSEPASS ], Type.ROCK)
	.setEncounterMessages([
		`Would you kindly demonstrate how you battle?`,
		`You can learn many things by battling many trainers.`,
		`Oh, you caught me strategizing.\nWould you like to battle?`
  ]).setVictoryMessages([
		`Oh, I appear to have lost.\nI understand.`,
		`It seems that I still have so much more to learn when it comes to battle.`,
		`I'll take what I learned here today to heart.`
  ]).setDefeatMessages([
		`I have learned many things from our battle.\nI hope you have too.`,
		`I look forward to battling you again.\nI hope you'll use what you've learned here.`,
		`I won due to everything I have learned.`
  ]),
  [TrainerType.BRAWLY]: new TrainerConfig(++t).initForGymLeader([ Species.MACHOP, Species.MAKUHITA ], Type.FIGHTING)
    .setEncounterMessages([
		`Oh man, a challenger!\nLet's see what you can do!`,
		`You seem like a big splash.\nLet's battle!`,
		`Time to create a storm!\nLet's go!`
  ]).setVictoryMessages([
		`Oh woah, you've washed me out!`,
		`You surfed my wave and crashed me down!`,
		`I feel like I'm lost in Granite Cave!`
  ]).setDefeatMessages([
		`Haha, I surfed the big wave!\nChallenge me again sometime.`,
		`Surf with me again some time!`,
		`Just like the tides come in and out, I hope you return to challenge me again.`
  ]),
  [TrainerType.WATTSON]: new TrainerConfig(++t).initForGymLeader([ Species.MAGNEMITE, Species.VOLTORB, Species.ELECTRIKE ], Type.ELECTRIC)
    .setEncounterMessages([
		`Time to get shocked!\nWahahahaha!`,
		`I'll make sparks fly!\nWahahahaha!`,
		`I hope you brought Paralyz Heal!\nWahahahaha!`
  ]).setVictoryMessages([
		`Seems like I'm out of charge!\nWahahahaha!`,
		`You've completely grounded me!\nWahahahaha!`,
		`Thanks for the thrill!\nWahahahaha!`
  ]).setDefeatMessages([
		`Recharge your batteries and challenge me again sometime!\nWahahahaha!`,
		`I hope you found our battle electrifying!\nWahahahaha!`,
		`Aren't you shocked I won?\nWahahahaha!`
  ]),
  [TrainerType.FLANNERY]: new TrainerConfig(++t).initForGymLeader([ Species.SLUGMA, Species.TORKOAL, Species.NUMEL ], Type.FIRE)
    .setEncounterMessages([
		`Nice to meet you! Wait, no…\nI will crush you!`,
		`I've only been a leader for a little while, but I'll smoke you!`,
		`It's time to demonstrate the moves my grandfather has taught me! Let's battle!`
  ]).setVictoryMessages([
		`You remind me of my grandfather…\nNo wonder I lost.`,
		`Am I trying too hard?\nI should relax, can't get too heated.`,
		`Losing isn't going to smother me out.\nTime to reignite training!`
  ]).setDefeatMessages([
		`I hope I've made my grandfather proud…\nLet's battle again some time.`,
		`I…I can't believe I won!\nDoing things my way worked!`,
		`Let's exchange burning hot moves again soon!`
  ]),
  [TrainerType.NORMAN]: new TrainerConfig(++t).initForGymLeader([ Species.SLAKOTH, Species.SPINDA, Species.CHANSEY, Species.KANGASKHAN ], Type.NORMAL)
    .setEncounterMessages([
		`I'm surprised you managed to get here.\nLet's battle.`,
		`I'll do everything in my power as a Gym Leader to win.\nLet's go!`,
		`You better give this your all.\nIt's time to battle!`
  ]).setVictoryMessages([
		`I lost to you…?\nRules are rules, though.`,
		`Was moving from Olivine a mistake…?`,
		`I can't believe it.\nThat was a great match.`
  ]).setDefeatMessages([
		`We both tried our best.\nI hope we can battle again soon.`,
		`You should try challenging my kid instead.\nYou might learn something!`,
		`Thank you for the excellent battle.\nBetter luck next time.`
  ]),
  [TrainerType.WINONA]: new TrainerConfig(++t).initForGymLeader([ Species.SWABLU, Species.WINGULL, Species.TROPIUS, Species.SKARMORY ], Type.FLYING)
    .setEncounterMessages([
		`I've been soaring the skies looking for prey…\nAnd you're my target!`,
		`No matter how our battle is, my Flying Pokémon and I will triumph with grace. Let's battle!`,
		`I hope you aren't scared of heights.\nLet's ascend!`
  ]).setVictoryMessages([
		`You're the first Trainer I've seen with more grace than I.\nExcellently played.`,
		`Oh, my Flying Pokémon have plummeted!\nVery well.`,
		`Though I may have fallen, my Pokémon will continue to fly!`
  ]).setDefeatMessages([
		`My Flying Pokémon and I will forever dance elegantly!`,
		`I hope you enjoyed our show.\nOur graceful dance is finished.`,
		`Won't you come see our elegant choreography again?`
  ]),
  [TrainerType.TATE]: new TrainerConfig(++t).initForGymLeader([ Species.SOLROCK, Species.NATU, Species.CHIMECHO, Species.GALLADE ], Type.PSYCHIC)
    .setEncounterMessages([
		`Hehehe…\nWere you surprised to see me without my sister?`,
		`I can see what you're thinking…\nYou want to battle!`,
		`How can you defeat someone…\nWho knows your every move?`
  ]).setVictoryMessages([
		`It can't be helped…\nI miss Liza…`,
		`Your bond with your Pokémon was stronger than mine.`,
		`If I were with Liza, we would have won.\nWe can finish each other's thoughts!`
  ]).setDefeatMessages([
		`My Pokémon and I are superior!`,
		`If you can't even defeat me, you'll never be able to defeat Liza either.`,
		`It's all thanks to my strict training with Liza.\nI can make myself one with Pokémon.`
  ]),
  [TrainerType.LIZA]: new TrainerConfig(++t).initForGymLeader([ Species.LUNATONE, Species.SPOINK, Species.BALTOY, Species.GARDEVOIR ], Type.PSYCHIC)
    .setEncounterMessages([
		`Fufufu…\nWere you surprised to see me without my brother?`,
		`I can determine what you desire…\nYou want to battle, don't you?`,
		`How can you defeat someone…\nWho's one with their Pokémon?`
  ]).setVictoryMessages([
		`It can't be helped…\nI miss Tate…`,
		`Your bond with your Pokémon…\nIt's stronger than mine.`,
		`If I were with Tate, we would have won.\nWe can finish each other's sentences!`
  ]).setDefeatMessages([
		`My Pokémon and I are victorious.`,
		`If you can't even defeat me, you'll never be able to defeat Tate either.`,
		`It's all thanks to my strict training with Tate.\nI can synchronize myself with my Pokémon.`
  ]),
  [TrainerType.JUAN]: new TrainerConfig(++t).initForGymLeader([ Species.HORSEA, Species.BARBOACH, Species.SPHEAL, Species.RELICANTH ], Type.WATER)
    .setEncounterMessages([
		`Now's not the time to act coy.\nLet's battle!`,
		`Ahahaha, You'll be witness to my artistry with Water Pokémon!`,
		`A typhoon approaches!\nWill you be able to test me?`
  ]).setVictoryMessages([
		`You may be a genius who can take on Wallace!`,
		`I focused on elegance while you trained.\nIt's only natural that you defeated me.`,
		`Ahahaha!\nVery well, You have won this time.`
  ]).setDefeatMessages([
		`My Pokémon and I have sculpted an illusion of Water and come out victorious.`,
		`Ahahaha, I have won, and you have lost.`,
		`Shall I loan you my outfit? It may help you battle!\nAhahaha, I jest!`
  ]),
  [TrainerType.ROARK]: new TrainerConfig(++t).initForGymLeader([ Species.CRANIDOS, Species.LARVITAR, Species.GEODUDE ], Type.ROCK),
  [TrainerType.GARDENIA]: new TrainerConfig(++t).initForGymLeader([ Species.ROSELIA, Species.TANGELA, Species.TURTWIG ], Type.GRASS),
  [TrainerType.MAYLENE]: new TrainerConfig(++t).initForGymLeader([ Species.LUCARIO, Species.MEDITITE, Species.CHIMCHAR ], Type.FIGHTING),
  [TrainerType.CRASHER_WAKE]: new TrainerConfig(++t).initForGymLeader([ Species.BUIZEL, Species.MAGIKARP, Species.PIPLUP ], Type.WATER),
  [TrainerType.FANTINA]: new TrainerConfig(++t).initForGymLeader([ Species.MISDREAVUS, Species.DRIFLOON, Species.SPIRITOMB ], Type.GHOST),
  [TrainerType.BYRON]: new TrainerConfig(++t).initForGymLeader([ Species.SHIELDON, Species.BRONZOR, Species.AGGRON ], Type.STEEL),
  [TrainerType.CANDICE]: new TrainerConfig(++t).initForGymLeader([ Species.SNEASEL, Species.SNOVER, Species.SNORUNT ], Type.ICE),
  [TrainerType.VOLKNER]: new TrainerConfig(++t).initForGymLeader([ Species.SHINX, Species.CHINCHOU, Species.ROTOM ], Type.ELECTRIC),
  [TrainerType.CILAN]: new TrainerConfig(++t).initForGymLeader([ Species.PANSAGE, Species.COTTONEE, Species.PETILIL ], Type.GRASS),
  [TrainerType.CHILI]: new TrainerConfig(++t).initForGymLeader([ Species.PANSEAR, Species.DARUMAKA, Species.HEATMOR ], Type.FIRE),
  [TrainerType.CRESS]: new TrainerConfig(++t).initForGymLeader([ Species.PANPOUR, Species.BASCULIN, Species.TYMPOLE ], Type.WATER),
  [TrainerType.CHEREN]: new TrainerConfig(++t).initForGymLeader([ Species.LILLIPUP, Species.MINCCINO, Species.PATRAT ], Type.NORMAL),
  [TrainerType.LENORA]: new TrainerConfig(++t).initForGymLeader([ Species.KANGASKHAN, Species.DEERLING, Species.AUDINO ], Type.NORMAL),
  [TrainerType.ROXIE]: new TrainerConfig(++t).initForGymLeader([ Species.VENIPEDE, Species.TRUBBISH, Species.SKORUPI ], Type.POISON),
  [TrainerType.BURGH]: new TrainerConfig(++t).initForGymLeader([ Species.SEWADDLE, Species.SHELMET, Species.KARRABLAST ], Type.BUG),
  [TrainerType.ELESA]: new TrainerConfig(++t).initForGymLeader([ Species.EMOLGA, Species.BLITZLE, Species.JOLTIK ], Type.ELECTRIC),
  [TrainerType.CLAY]: new TrainerConfig(++t).initForGymLeader([ Species.DRILBUR, Species.SANDILE, Species.GOLETT ], Type.GROUND),
  [TrainerType.SKYLA]: new TrainerConfig(++t).initForGymLeader([ Species.DUCKLETT, Species.WOOBAT, Species.RUFFLET ], Type.FLYING),
  [TrainerType.BRYCEN]: new TrainerConfig(++t).initForGymLeader([ Species.CRYOGONAL, Species.VANILLITE, Species.CUBCHOO ], Type.ICE),
  [TrainerType.DRAYDEN]: new TrainerConfig(++t).initForGymLeader([ Species.DRUDDIGON, Species.AXEW, Species.DEINO ], Type.DRAGON),
  [TrainerType.MARLON]: new TrainerConfig(++t).initForGymLeader([ Species.WAILMER, Species.FRILLISH, Species.TIRTOUGA ], Type.WATER),
  [TrainerType.VIOLA]: new TrainerConfig(++t).initForGymLeader([ Species.SURSKIT, Species.SCATTERBUG ], Type.BUG),
  [TrainerType.GRANT]: new TrainerConfig(++t).initForGymLeader([ Species.AMAURA, Species.TYRUNT ], Type.ROCK),
  [TrainerType.KORRINA]: new TrainerConfig(++t).initForGymLeader([ Species.HAWLUCHA, Species.LUCARIO, Species.MIENFOO ], Type.FIGHTING),
  [TrainerType.RAMOS]: new TrainerConfig(++t).initForGymLeader([ Species.SKIDDO, Species.HOPPIP, Species.BELLSPROUT ], Type.GRASS),
  [TrainerType.CLEMONT]: new TrainerConfig(++t).initForGymLeader([ Species.HELIOPTILE, Species.MAGNEMITE, Species.EMOLGA ], Type.ELECTRIC),
  [TrainerType.VALERIE]: new TrainerConfig(++t).initForGymLeader([ Species.SYLVEON, Species.MAWILE, Species.MR_MIME ], Type.FAIRY),
  [TrainerType.OLYMPIA]: new TrainerConfig(++t).initForGymLeader([ Species.ESPURR, Species.SIGILYPH, Species.SLOWKING ], Type.PSYCHIC),
  [TrainerType.WULFRIC]: new TrainerConfig(++t).initForGymLeader([ Species.BERGMITE, Species.SNOVER, Species.CRYOGONAL ], Type.ICE),
  [TrainerType.MILO]: new TrainerConfig(++t).initForGymLeader([ Species.GOSSIFLEUR, Species.APPLIN, Species.BOUNSWEET ], Type.GRASS),
  [TrainerType.NESSA]: new TrainerConfig(++t).initForGymLeader([ Species.CHEWTLE, Species.ARROKUDA, Species.WIMPOD ], Type.WATER),
  [TrainerType.KABU]: new TrainerConfig(++t).initForGymLeader([ Species.SIZZLIPEDE, Species.VULPIX, Species.TORKOAL ], Type.FIRE),
  [TrainerType.BEA]: new TrainerConfig(++t).initForGymLeader([ Species.GALAR_FARFETCHD, Species.MACHOP, Species.CLOBBOPUS ], Type.FIGHTING),
  [TrainerType.ALLISTER]: new TrainerConfig(++t).initForGymLeader([ Species.GALAR_YAMASK, Species.GALAR_CORSOLA, Species.GASTLY ], Type.GHOST),
  [TrainerType.OPAL]: new TrainerConfig(++t).initForGymLeader([ Species.MILCERY, Species.TOGETIC, Species.GALAR_WEEZING ], Type.FAIRY),
  [TrainerType.BEDE]: new TrainerConfig(++t).initForGymLeader([ Species.HATENNA, Species.GALAR_PONYTA, Species.GARDEVOIR ], Type.FAIRY),
  [TrainerType.GORDIE]: new TrainerConfig(++t).initForGymLeader([ Species.ROLYCOLY, Species.STONJOURNER, Species.BINACLE ], Type.ROCK),
  [TrainerType.MELONY]: new TrainerConfig(++t).initForGymLeader([ Species.SNOM, Species.GALAR_DARUMAKA, Species.GALAR_MR_MIME ], Type.ICE),
  [TrainerType.PIERS]: new TrainerConfig(++t).initForGymLeader([ Species.GALAR_ZIGZAGOON, Species.SCRAGGY, Species.INKAY ], Type.DARK),
  [TrainerType.MARNIE]: new TrainerConfig(++t).initForGymLeader([ Species.IMPIDIMP, Species.PURRLOIN, Species.MORPEKO ], Type.DARK),
  [TrainerType.RAIHAN]: new TrainerConfig(++t).initForGymLeader([ Species.DURALUDON, Species.TURTONATOR, Species.GOOMY ], Type.DRAGON),
  /*[TrainerType.KATY]: new TrainerConfig(++t).initForGymLeader([ Species.NYMBLE, Species.TAROUNTULA, Species.HERACROSS ], Type.BUG),
  [TrainerType.BRASSIUS]: new TrainerConfig(++t).initForGymLeader([ Species.SMOLIV, Species.SHROOMISH, Species.ODDISH ], Type.GRASS),
  [TrainerType.IONO]: new TrainerConfig(++t).initForGymLeader([ Species.TADBULB, Species.WATTREL, Species.VOLTORB ], Type.ELECTRIC),
  [TrainerType.KOFU]: new TrainerConfig(++t).initForGymLeader([ Species.VELUZA, Species.WIGLETT, Species.WINGULL ], Type.WATER),
  [TrainerType.LARRY]: new TrainerConfig(++t).initForGymLeader([ Species.STARLY, Species.DUNSPARCE, Species.KOMALA ], Type.NORMAL),
  [TrainerType.RYME]: new TrainerConfig(++t).initForGymLeader([ Species.GREAVARD, Species.SHUPPET, Species.MIMIKYU ], Type.GHOST),
  [TrainerType.TULIP]: new TrainerConfig(++t).initForGymLeader([ Species.GIRAFARIG, Species.FLITTLE, Species.RALTS ], Type.PSYCHIC),
  [TrainerType.GRUSHA]: new TrainerConfig(++t).initForGymLeader([ Species.CETODDLE, Species.ALOLA_VULPIX, Species.CUBCHOO ], Type.ICE),*/
  
  [TrainerType.LORELEI]: new TrainerConfig((t = TrainerType.LORELEI)).initForEliteFour([ Species.SLOWBRO, Species.LAPRAS, Species.DEWGONG, Species.ALOLA_SANDSLASH ], Type.ICE),
  [TrainerType.BRUNO]: new TrainerConfig(++t).initForEliteFour([ Species.ONIX, Species.HITMONCHAN, Species.HITMONLEE, Species.ALOLA_GOLEM ], Type.FIGHTING),
  [TrainerType.AGATHA]: new TrainerConfig(++t).initForEliteFour([ Species.GENGAR, Species.ARBOK, Species.CROBAT, Species.ALOLA_MAROWAK ], Type.GHOST),
  [TrainerType.LANCE]: new TrainerConfig(++t).initForEliteFour([ Species.DRAGONITE, Species.GYARADOS, Species.AERODACTYL, Species.ALOLA_EXEGGUTOR ], Type.DRAGON),
  [TrainerType.WILL]: new TrainerConfig(++t).initForEliteFour([ Species.XATU, Species.JYNX, Species.SLOWBRO, Species.EXEGGUTOR ], Type.PSYCHIC),
  [TrainerType.KOGA]: new TrainerConfig(++t).initForEliteFour([ Species.WEEZING, Species.VENOMOTH, Species.CROBAT, Species.TENTACRUEL ], Type.POISON),
  [TrainerType.KAREN]: new TrainerConfig(++t).initForEliteFour([ Species.UMBREON, Species.HONCHKROW, Species.HOUNDOOM, Species.WEAVILE ], Type.DARK),
  [TrainerType.SIDNEY]: new TrainerConfig(++t).initForEliteFour([ Species.SHIFTRY, Species.SHARPEDO, Species.ABSOL, Species.ZOROARK ], Type.DARK),
  [TrainerType.PHOEBE]: new TrainerConfig(++t).initForEliteFour([ Species.SABLEYE, Species.DUSKNOIR, Species.BANETTE, Species.CHANDELURE ], Type.GHOST),
  [TrainerType.GLACIA]: new TrainerConfig(++t).initForEliteFour([ Species.GLALIE, Species.WALREIN, Species.FROSLASS, Species.ABOMASNOW ], Type.ICE),
  [TrainerType.DRAKE]: new TrainerConfig(++t).initForEliteFour([ Species.ALTARIA, Species.SALAMENCE, Species.FLYGON, Species.KINGDRA ], Type.DRAGON),
  [TrainerType.AARON]: new TrainerConfig(++t).initForEliteFour([ Species.SCIZOR, Species.HERACROSS, Species.VESPIQUEN, Species.DRAPION ], Type.BUG),
  [TrainerType.BERTHA]: new TrainerConfig(++t).initForEliteFour([ Species.WHISCASH, Species.HIPPOWDON, Species.GLISCOR, Species.RHYPERIOR ], Type.GROUND),
  [TrainerType.FLINT]: new TrainerConfig(++t).initForEliteFour([ Species.FLAREON, Species.HOUNDOOM, Species.RAPIDASH, Species.INFERNAPE ], Type.FIRE),
  [TrainerType.LUCIAN]: new TrainerConfig(++t).initForEliteFour([ Species.MR_MIME, Species.GALLADE, Species.BRONZONG, Species.ALAKAZAM  ], Type.PSYCHIC),
  [TrainerType.SHAUNTAL]: new TrainerConfig(++t).initForEliteFour([ Species.COFAGRIGUS, Species.CHANDELURE, Species.GOLURK, Species.DRIFBLIM ], Type.GHOST),
  [TrainerType.MARSHAL]: new TrainerConfig(++t).initForEliteFour([ Species.TIMBURR, Species.MIENFOO, Species.THROH, Species.SAWK ], Type.FIGHTING),
  [TrainerType.GRIMSLEY]: new TrainerConfig(++t).initForEliteFour([ Species.LIEPARD, Species.KINGAMBIT, Species.SCRAFTY, Species.KROOKODILE ], Type.DARK),
  [TrainerType.CAITLIN]: new TrainerConfig(++t).initForEliteFour([ Species.MUSHARNA, Species.GOTHITELLE, Species.SIGILYPH, Species.REUNICLUS ], Type.PSYCHIC),
  [TrainerType.MALVA]: new TrainerConfig(++t).initForEliteFour([ Species.PYROAR, Species.TORKOAL, Species.CHANDELURE, Species.TALONFLAME ], Type.FIRE),
  [TrainerType.SIEBOLD]: new TrainerConfig(++t).initForEliteFour([ Species.CLAWITZER, Species.GYARADOS, Species.BARBARACLE, Species.STARMIE ], Type.WATER),
  [TrainerType.WIKSTROM]: new TrainerConfig(++t).initForEliteFour([ Species.KLEFKI, Species.PROBOPASS, Species.SCIZOR, Species.AEGISLASH ], Type.STEEL),
  [TrainerType.DRASNA]: new TrainerConfig(++t).initForEliteFour([ Species.DRAGALGE, Species.DRUDDIGON, Species.ALTARIA, Species.NOIVERN ], Type.DRAGON),
  [TrainerType.HALA]: new TrainerConfig(++t).initForEliteFour([ Species.HARIYAMA, Species.BEWEAR, Species.CRABOMINABLE, Species.POLIWRATH ], Type.FIGHTING),
  [TrainerType.MOLAYNE]: new TrainerConfig(++t).initForEliteFour([ Species.KLEFKI, Species.MAGNEZONE, Species.METAGROSS, Species.ALOLA_DUGTRIO ], Type.PSYCHIC),
  [TrainerType.OLIVIA]: new TrainerConfig(++t).initForEliteFour([ Species.ARMALDO, Species.CRADILY, Species.ALOLA_GOLEM, Species.LYCANROC ], Type.ROCK),
  [TrainerType.ACEROLA]: new TrainerConfig(++t).initForEliteFour([ Species.BANETTE, Species.DRIFBLIM, Species.DHELMISE, Species.PALOSSAND ], Type.GHOST),
  [TrainerType.KAHILI]: new TrainerConfig(++t).initForEliteFour([ Species.BRAVIARY, Species.HAWLUCHA, Species.ORICORIO, Species.TOUCANNON ], Type.FLYING),
  /*[TrainerType.RIKA]: new TrainerConfig(++t).initForEliteFour([ Species. WHISCASH, Species.DONPHAN, Species.CAMERUPT, Species.CLODSIRE ], Type.GROUND),
  [TrainerType.POPPY]: new TrainerConfig(++t).initForEliteFour([ Species.COPPERAJAH, Species.BRONZONG, Species.CORVIKNIGHT, Species.TINKATON ], Type.STEEL),
  [TrainerType.LARRY_ELITE]: new TrainerConfig(++t).initForEliteFour([ Species.STARAPTOR, Species.FLAMIGO, Species.ALTARIA, Species.TROPIUS ], Type.NORMAL, Type.FLYING),
  [TrainerType.HASSEL]: new TrainerConfig(++t).initForEliteFour([ Species.NOIVERN, Species.HAXORUS, Species.DRAGALGE, Species.BAXCALIBUR ], Type.DRAGON),
  [TrainerType.CRISPIN]: new TrainerConfig(++t).initForEliteFour([ Species.TALONFLAME, Species.CAMERUPT, Species.MAGMORTAR, Species.BLAZIKEN ], Type.FIRE),
  [TrainerType.AMARYS]: new TrainerConfig(++t).initForEliteFour([ Species.SKARMORY, Species.EMPOLEON, Species.SCIZOR, Species.METAGROSS ], Type.STEEL),
  [TrainerType.LACEY]: new TrainerConfig(++t).initForEliteFour([ Species.EXCADRILL, Species.PRIMARINA, Species.ALCREMIE, Species.GALAR_SLOWBRO ], Type.FAIRY),
  [TrainerType.DRAYTON]: new TrainerConfig(++t).initForEliteFour([ Species.DRAGONITE, Species.ARCHALUDON, Species.FLYGON, Species.SCEPTILE ], Type.DRAGON),*/

  [TrainerType.BLUE]: new TrainerConfig((t = TrainerType.BLUE)).initForChampion([ Species.GYARADOS, Species.MEWTWO, Species.ARCANINE, Species.ALAKAZAM, Species.PIDGEOT ]),
  [TrainerType.RED]: new TrainerConfig(++t).initForChampion([ Species.CHARIZARD, [ Species.LUGIA, Species.HO_OH ], Species.SNORLAX, Species.RAICHU, Species.ESPEON ]),
  [TrainerType.LANCE_CHAMPION]: new TrainerConfig(++t).initForChampion([ Species.DRAGONITE, [ Species.ZACIAN, Species.ZAMAZENTA ], Species.AERODACTYL, Species.KINGDRA, Species.ALOLA_EXEGGUTOR ]),
  [TrainerType.STEVEN]: new TrainerConfig(++t).initForChampion([ Species.METAGROSS, [ Species.DIALGA, Species.PALKIA ], Species.SKARMORY, Species.AGGRON, Species.CARBINK ]),
  [TrainerType.WALLACE]: new TrainerConfig(++t).initForChampion([ Species.MILOTIC, Species.KYOGRE, Species.WHISCASH, Species.WALREIN, Species.LUDICOLO ]),
  [TrainerType.CYNTHIA]: new TrainerConfig(++t).initForChampion([ Species.SPIRITOMB, Species.GIRATINA, Species.GARCHOMP, Species.MILOTIC, Species.LUCARIO, Species.TOGEKISS ]).setBattleBgm('battle_cynthia'),
  [TrainerType.ALDER]: new TrainerConfig(++t).initForChampion([ Species.VOLCARONA, Species.GROUDON, Species.BOUFFALANT, Species.ACCELGOR, Species.CONKELDURR ]),
  [TrainerType.IRIS]: new TrainerConfig(++t).initForChampion([ Species.HAXORUS, Species.YVELTAL, Species.DRUDDIGON, Species.ARON, Species.LAPRAS ]),
  [TrainerType.DIANTHA]: new TrainerConfig(++t).initForChampion([ Species.HAWLUCHA, Species.XERNEAS, Species.GOURGEIST, Species.GOODRA, Species.GARDEVOIR ]),
  [TrainerType.LEON]: new TrainerConfig(++t).initForChampion([ Species.DRAGAPULT, [ Species.ZACIAN, Species.ZAMAZENTA ], Species.SEISMITOAD, Species.AEGISLASH, Species.MR_RIME ]),
  /*[TrainerType.GEETA]: new TrainerConfig(++t).initForChampion([ Species.GLIMMORA, Species.ESPATHRA, Species.GOGOAT, Species.VELUZA, Species.KINGAMBIT ]),
  [TrainerType.NEMONA]: new TrainerConfig(++t).initForChampion([ Species.LYCANROC, Species.KORAIDON, Species.KOMMO_O, Species.PAWMOT, Species.DUSKNOIR ]),
  [TrainerType.KIERAN]: new TrainerConfig(++t).initForChampion([ Species.POLITOED, Species.MIRAIDON, Species.HYDRAPPLE, Species.PORYGON_Z, Species.GRIMMSNARL ]),*/

  [TrainerType.RIVAL]: new TrainerConfig((t = TrainerType.RIVAL)).setStaticParty().setEncounterBgm(TrainerType.RIVAL).setBattleBgm('battle_rival').setPartyTemplates(trainerPartyTemplates.RIVAL).setEncounterMessages([
    `There you are! I've been looking everywhere for you!\nDid you forget to say goodbye to your best friend?
    $So you're finally pursuing your dream, huh?\nI knew you'd do it one day…
    $Anyway, I'll forgive you for forgetting me, but on one condition. You have to battle me!
    $You'd better give it your best! Wouldn't want your adventure to be over before it started, right?`
  ]).setVictoryMessages([
    `You already have three Pokémon?!\nThat's not fair at all!
    $Just kidding! I lost fair and square, and now I know you'll do fine out there.
    $By the way, the professor wanted me to give you some items. Hopefully they're helpful!
    $Do your best like always! I believe in you!`
  ]).setModifierRewardFuncs(() => modifierTypes.SUPER_EXP_CHARM, () => modifierTypes.EXP_SHARE).setPartyMemberFunc(0, getRandomPartyMemberFunc([ Species.BULBASAUR, Species.CHARMANDER, Species.SQUIRTLE, Species.CHIKORITA, Species.CYNDAQUIL, Species.TOTODILE, Species.TREECKO, Species.TORCHIC, Species.MUDKIP, Species.TURTWIG, Species.CHIMCHAR, Species.PIPLUP, Species.SNIVY, Species.TEPIG, Species.OSHAWOTT, Species.CHESPIN, Species.FENNEKIN, Species.FROAKIE, Species.ROWLET, Species.LITTEN, Species.POPPLIO, Species.GROOKEY, Species.SCORBUNNY, Species.SOBBLE ]))
    .setPartyMemberFunc(1, getRandomPartyMemberFunc([ Species.PIDGEY, Species.HOOTHOOT, Species.TAILLOW, Species.STARLY, Species.PIDOVE, Species.FLETCHLING, Species.PIKIPEK, Species.ROOKIDEE ])),
  [TrainerType.RIVAL_2]: new TrainerConfig(++t).setStaticParty().setMoneyMultiplier(1.25).setEncounterBgm(TrainerType.RIVAL).setBattleBgm('battle_rival').setPartyTemplates(trainerPartyTemplates.RIVAL_2).setEncounterMessages([
    `Oh, fancy meeting you here. Looks like you're still undefeated. Right on!
    $I know what you're thinking, and no, I wasn't following you. I just happened to be in the area.
    $I'm happy for you but I just want to let you know that it's OK to lose sometimes.
    $We learn from our mistakes, often more than we would if we kept succeeding.
    $In any case, I've been training hard for our rematch, so you'd better give it your all!`
  ]).setVictoryMessages([
    `I… wasn't supposed to lose that time…`
  ]).setPartyMemberFunc(0, getRandomPartyMemberFunc([ Species.IVYSAUR, Species.CHARMELEON, Species.WARTORTLE, Species.BAYLEEF, Species.QUILAVA, Species.CROCONAW, Species.GROVYLE, Species.COMBUSKEN, Species.MARSHTOMP, Species.GROTLE, Species.MONFERNO, Species.PRINPLUP, Species.SERVINE, Species.PIGNITE, Species.DEWOTT, Species.QUILLADIN, Species.BRAIXEN, Species.FROGADIER, Species.DARTRIX, Species.TORRACAT, Species.BRIONNE, Species.THWACKEY, Species.RABOOT, Species.DRIZZILE ]))
    .setPartyMemberFunc(1, getRandomPartyMemberFunc([ Species.PIDGEOTTO, Species.HOOTHOOT, Species.TAILLOW, Species.STARAVIA, Species.TRANQUILL, Species.FLETCHINDER, Species.TRUMBEAK, Species.CORVISQUIRE ]))
    .setPartyMemberFunc(2, getSpeciesFilterRandomPartyMemberFunc((species: PokemonSpecies) => !pokemonEvolutions.hasOwnProperty(species.speciesId) && !pokemonPrevolutions.hasOwnProperty(species.speciesId) && species.baseTotal >= 450)),
  [TrainerType.RIVAL_3]: new TrainerConfig(++t).setStaticParty().setMoneyMultiplier(1.5).setEncounterBgm(TrainerType.RIVAL).setBattleBgm('battle_rival').setPartyTemplates(trainerPartyTemplates.RIVAL_3).setEncounterMessages([
    `Long time no see! Still haven't lost, huh.\nYou're starting to get on my nerves. Just kidding!
    $But really, I think it's about time you came home.\nYour family and friends miss you, you know.
    $I know your dream means a lot to you, but the reality is you're going to lose sooner or later.
    $And when you do, I'll be there for you like always.\nNow, let me show you how strong I've become!`
  ]).setVictoryMessages([
    `After all that… it wasn't enough…?`
  ]).setPartyMemberFunc(0, getRandomPartyMemberFunc([ Species.VENUSAUR, Species.CHARIZARD, Species.BLASTOISE, Species.MEGANIUM, Species.TYPHLOSION, Species.FERALIGATR, Species.SCEPTILE, Species.BLAZIKEN, Species.SWAMPERT, Species.TORTERRA, Species.INFERNAPE, Species.EMPOLEON, Species.SERPERIOR, Species.EMBOAR, Species.SAMUROTT, Species.CHESNAUGHT, Species.DELPHOX, Species.GRENINJA, Species.DECIDUEYE, Species.INCINEROAR, Species.PRIMARINA, Species.RILLABOOM, Species.CINDERACE, Species.INTELEON ]))
    .setPartyMemberFunc(1, getRandomPartyMemberFunc([ Species.PIDGEOT, Species.NOCTOWL, Species.SWELLOW, Species.STARAPTOR, Species.UNFEZANT, Species.TALONFLAME, Species.TOUCANNON, Species.CORVIKNIGHT ]))
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
  ]).setPartyMemberFunc(0, getRandomPartyMemberFunc([ Species.VENUSAUR, Species.CHARIZARD, Species.BLASTOISE, Species.MEGANIUM, Species.TYPHLOSION, Species.FERALIGATR, Species.SCEPTILE, Species.BLAZIKEN, Species.SWAMPERT, Species.TORTERRA, Species.INFERNAPE, Species.EMPOLEON, Species.SERPERIOR, Species.EMBOAR, Species.SAMUROTT, Species.CHESNAUGHT, Species.DELPHOX, Species.GRENINJA, Species.DECIDUEYE, Species.INCINEROAR, Species.PRIMARINA, Species.RILLABOOM, Species.CINDERACE, Species.INTELEON ]))
    .setPartyMemberFunc(1, getRandomPartyMemberFunc([ Species.PIDGEOT, Species.NOCTOWL, Species.SWELLOW, Species.STARAPTOR, Species.UNFEZANT, Species.TALONFLAME, Species.TOUCANNON, Species.CORVIKNIGHT ]))
    .setPartyMemberFunc(2, getSpeciesFilterRandomPartyMemberFunc((species: PokemonSpecies) => !pokemonEvolutions.hasOwnProperty(species.speciesId) && !pokemonPrevolutions.hasOwnProperty(species.speciesId) && species.baseTotal >= 450))
    .setSpeciesFilter(species => species.baseTotal >= 540),
  [TrainerType.RIVAL_5]: new TrainerConfig(++t).setBoss().setStaticParty().setMoneyMultiplier(2.25).setEncounterBgm(TrainerType.RIVAL).setBattleBgm('battle_rival_3').setPartyTemplates(trainerPartyTemplates.RIVAL_5).setEncounterMessages([ `…` ]).setVictoryMessages([ '…' ])
    .setPartyMemberFunc(0, getRandomPartyMemberFunc([ Species.VENUSAUR, Species.CHARIZARD, Species.BLASTOISE, Species.MEGANIUM, Species.TYPHLOSION, Species.FERALIGATR, Species.SCEPTILE, Species.BLAZIKEN, Species.SWAMPERT, Species.TORTERRA, Species.INFERNAPE, Species.EMPOLEON, Species.SERPERIOR, Species.EMBOAR, Species.SAMUROTT, Species.CHESNAUGHT, Species.DELPHOX, Species.GRENINJA, Species.DECIDUEYE, Species.INCINEROAR, Species.PRIMARINA, Species.RILLABOOM, Species.CINDERACE, Species.INTELEON ]))
    .setPartyMemberFunc(1, getRandomPartyMemberFunc([ Species.PIDGEOT, Species.NOCTOWL, Species.SWELLOW, Species.STARAPTOR, Species.UNFEZANT, Species.TALONFLAME, Species.TOUCANNON, Species.CORVIKNIGHT ]))
    .setPartyMemberFunc(2, getSpeciesFilterRandomPartyMemberFunc((species: PokemonSpecies) => !pokemonEvolutions.hasOwnProperty(species.speciesId) && !pokemonPrevolutions.hasOwnProperty(species.speciesId) && species.baseTotal >= 450))
    .setSpeciesFilter(species => species.baseTotal >= 540)
    .setPartyMemberFunc(5, getRandomPartyMemberFunc([ Species.RAYQUAZA ], p => {
      p.setBoss();
      p.pokeball = PokeballType.MASTER_BALL;
    })),
  [TrainerType.RIVAL_6]: new TrainerConfig(++t).setBoss().setStaticParty().setMoneyMultiplier(3).setEncounterBgm('final').setBattleBgm('battle_rival_3').setPartyTemplates(trainerPartyTemplates.RIVAL_6)
    .setPartyMemberFunc(0, getRandomPartyMemberFunc([ Species.VENUSAUR, Species.CHARIZARD, Species.BLASTOISE, Species.MEGANIUM, Species.TYPHLOSION, Species.FERALIGATR, Species.SCEPTILE, Species.BLAZIKEN, Species.SWAMPERT, Species.TORTERRA, Species.INFERNAPE, Species.EMPOLEON, Species.SERPERIOR, Species.EMBOAR, Species.SAMUROTT, Species.CHESNAUGHT, Species.DELPHOX, Species.GRENINJA, Species.DECIDUEYE, Species.INCINEROAR, Species.PRIMARINA, Species.RILLABOOM, Species.CINDERACE, Species.INTELEON ]))
    .setPartyMemberFunc(1, getRandomPartyMemberFunc([ Species.PIDGEOT, Species.NOCTOWL, Species.SWELLOW, Species.STARAPTOR, Species.UNFEZANT, Species.TALONFLAME, Species.TOUCANNON, Species.CORVIKNIGHT ]))
    .setPartyMemberFunc(2, getSpeciesFilterRandomPartyMemberFunc((species: PokemonSpecies) => !pokemonEvolutions.hasOwnProperty(species.speciesId) && !pokemonPrevolutions.hasOwnProperty(species.speciesId) && species.baseTotal >= 450))
    .setSpeciesFilter(species => species.baseTotal >= 540)
    .setPartyMemberFunc(5, getRandomPartyMemberFunc([ Species.RAYQUAZA ], p => {
      p.setBoss();
      p.pokeball = PokeballType.MASTER_BALL;
      p.formIndex = 1;
    })),
}