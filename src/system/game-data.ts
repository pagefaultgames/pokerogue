import BattleScene, { PokeballCounts } from "../battle-scene";
import Pokemon, { EnemyPokemon, PlayerPokemon } from "../pokemon";
import { pokemonPrevolutions } from "../data/pokemon-evolutions";
import PokemonSpecies, { allSpecies, getPokemonSpecies } from "../data/pokemon-species";
import { Species } from "../data/species";
import * as Utils from "../utils";
import PokemonData from "./pokemon-data";
import PersistentModifierData from "./modifier-data";
import ArenaData from "./arena-data";
import { Unlockables } from "./unlockables";
import { GameMode } from "../game-mode";
import { BattleType } from "../battle";
import TrainerData from "./trainer-data";
import { trainerConfigs } from "../data/trainer-type";
import { Setting, setSetting, settingDefaults } from "./settings";
import { achvs } from "./achv";

interface SystemSaveData {
  trainerId: integer;
  secretId: integer;
  dexData: DexData;
  unlocks: Unlocks;
  achvUnlocks: AchvUnlocks;
  timestamp: integer;
}

interface SessionSaveData {
  seed: string;
  gameMode: GameMode;
  party: PokemonData[];
  enemyParty: PokemonData[];
  enemyField: PokemonData[];
  modifiers: PersistentModifierData[];
  enemyModifiers: PersistentModifierData[];
  arena: ArenaData;
  pokeballCounts: PokeballCounts;
  money: integer;
  waveIndex: integer;
  battleType: BattleType;
  trainer: TrainerData;
  timestamp: integer;
}

interface Unlocks {
  [key: integer]: boolean;
}

interface AchvUnlocks {
  [key: string]: integer
}

export interface DexData {
  [key: integer]: DexEntry
}

export interface DexEntry {
  seenAttr: bigint;
  caughtAttr: bigint;
  seenCount: integer;
  caughtCount: integer;
  ivs: integer[];
}

export const DexAttr = {
  NON_SHINY: 1n,
  SHINY: 2n,
  MALE: 4n,
  FEMALE: 8n,
  ABILITY_1: 16n,
  ABILITY_2: 32n,
  ABILITY_HIDDEN: 64n,
  DEFAULT_FORM: 128n
}

export interface DexAttrProps {
  shiny: boolean;
  female: boolean;
  abilityIndex: integer;
  formIndex: integer;
}

export class GameData {
  private scene: BattleScene;

  public trainerId: integer;
  public secretId: integer;
  
  public dexData: DexData;

  public unlocks: Unlocks;

  public achvUnlocks: AchvUnlocks;

  constructor(scene: BattleScene) {
    this.scene = scene;
    this.loadSettings();
    this.trainerId = Utils.randSeedInt(65536);
    this.secretId = Utils.randSeedInt(65536);
    this.unlocks = {
      [Unlockables.ENDLESS_MODE]: false,
      [Unlockables.MINI_BLACK_HOLE]: false,
      [Unlockables.SPLICED_ENDLESS_MODE]: false
    };
    this.achvUnlocks = {};
    this.initDexData();
    this.loadSystem();
  }

  public saveSystem(): boolean {
    if (this.scene.quickStart)
      return false;
      
    const data: SystemSaveData = {
      trainerId: this.trainerId,
      secretId: this.secretId,
      dexData: this.dexData,
      unlocks: this.unlocks,
      achvUnlocks: this.achvUnlocks,
      timestamp: new Date().getTime()
    };

    localStorage.setItem('data_bak', localStorage.getItem('data'));

    const maxIntAttrValue = Math.pow(2, 31);
    localStorage.setItem('data', btoa(JSON.stringify(data, (k: any, v: any) => typeof v === 'bigint' ? v <= maxIntAttrValue ? Number(v) : v.toString() : v)));

    return true;
  }

  private loadSystem(): boolean {
    if (!localStorage.hasOwnProperty('data'))
      return false;

    const data = JSON.parse(atob(localStorage.getItem('data')), (k: string, v: any) => k.endsWith('Attr') ? BigInt(v) : v) as SystemSaveData;

    console.debug(data);

    this.trainerId = data.trainerId;
    this.secretId = data.secretId;

    if (data.unlocks) {
      for (let key of Object.keys(data.unlocks)) {
        if (this.unlocks.hasOwnProperty(key))
          this.unlocks[key] = data.unlocks[key];
      }
    }

    if (data.achvUnlocks) {
      for (let a of Object.keys(data.achvUnlocks)) {
        if (achvs.hasOwnProperty(a))
          this.achvUnlocks[a] = data.achvUnlocks[a];
      }
    }

    if (data.dexData[1].hasOwnProperty(0))
      this.migrateLegacyDexData(this.dexData, data.dexData);
    else
      this.dexData = Object.assign(this.dexData, data.dexData);

    return true;
  }

  public saveSetting(setting: Setting, valueIndex: integer): boolean {
    let settings: object = {};
    if (localStorage.hasOwnProperty('settings'))
      settings = JSON.parse(localStorage.getItem('settings'));

    setSetting(this.scene, setting as Setting, valueIndex);

    Object.keys(settingDefaults).forEach(s => {
      if (s === setting)
        settings[s] = valueIndex;
    });

    localStorage.setItem('settings', JSON.stringify(settings));

    return true;
  }

  private loadSettings(): boolean {
    if (!localStorage.hasOwnProperty('settings'))
      return false;

    const settings = JSON.parse(localStorage.getItem('settings'));

    for (let setting of Object.keys(settings))
      setSetting(this.scene, setting as Setting, settings[setting]);
  }

  saveSession(scene: BattleScene): boolean {
    const sessionData = {
      seed: scene.seed,
      gameMode: scene.gameMode,
      party: scene.getParty().map(p => new PokemonData(p)),
      enemyParty: scene.getEnemyParty().map(p => new PokemonData(p)),
      modifiers: scene.findModifiers(() => true).map(m => new PersistentModifierData(m, true)),
      enemyModifiers: scene.findModifiers(() => true, false).map(m => new PersistentModifierData(m, false)),
      arena: new ArenaData(scene.arena),
      pokeballCounts: scene.pokeballCounts,
      money: scene.money,
      waveIndex: scene.currentBattle.waveIndex,
      battleType: scene.currentBattle.battleType,
      trainer: scene.currentBattle.battleType == BattleType.TRAINER ? new TrainerData(scene.currentBattle.trainer) : null,
      timestamp: new Date().getTime()
    } as SessionSaveData;

    localStorage.setItem('sessionData', btoa(JSON.stringify(sessionData)));

    console.debug('Session data saved');

    return true;
  }

  hasSession() {
    return !!localStorage.getItem('sessionData');
  }

  loadSession(scene: BattleScene): Promise<boolean> {
    return new Promise(async (resolve, reject) => {
      if (!this.hasSession())
        return resolve(false);

      try {
        const sessionData = JSON.parse(atob(localStorage.getItem('sessionData')), (k: string, v: any) => {
          if (k === 'party' || k === 'enemyParty' || k === 'enemyField') {
            const ret: PokemonData[] = [];
            for (let pd of v)
              ret.push(new PokemonData(pd));
            return ret;
          }

          if (k === 'trainer')
            return v ? new TrainerData(v) : null;

          if (k === 'modifiers' || k === 'enemyModifiers') {
            const player = k === 'modifiers';
            const ret: PersistentModifierData[] = [];
            for (let md of v)
              ret.push(new PersistentModifierData(md, player));
            return ret;
          }

          if (k === 'arena')
            return new ArenaData(v);

          return v;
        }) as SessionSaveData;

        console.debug(sessionData);

        scene.seed = sessionData.seed || this.scene.game.config.seed[0];
        scene.resetSeed();

        scene.gameMode = sessionData.gameMode || GameMode.CLASSIC;

        const loadPokemonAssets: Promise<void>[] = [];

        const party = scene.getParty();
        party.splice(0, party.length);

        for (let p of sessionData.party) {
          const pokemon = p.toPokemon(scene) as PlayerPokemon;
          pokemon.setVisible(false);
          loadPokemonAssets.push(pokemon.loadAssets());
          party.push(pokemon);
        }

        Object.keys(scene.pokeballCounts).forEach((key: string) => {
          scene.pokeballCounts[key] = sessionData.pokeballCounts[key] || 0;
        });

        scene.money = sessionData.money || 0;
        scene.updateMoneyText();

        // TODO: Remove this
        if (sessionData.enemyField)
          sessionData.enemyParty = sessionData.enemyField;

        const battleType = sessionData.battleType || 0;
        const battle = scene.newBattle(sessionData.waveIndex, battleType, sessionData.trainer, battleType === BattleType.TRAINER ? trainerConfigs[sessionData.trainer.trainerType].isDouble : sessionData.enemyParty.length > 1);

        scene.newArena(sessionData.arena.biome, true);

        sessionData.enemyParty.forEach((enemyData, e) => {
          const enemyPokemon = enemyData.toPokemon(scene, battleType) as EnemyPokemon;
          battle.enemyParty[e] = enemyPokemon;
          if (battleType === BattleType.WILD)
            battle.seenEnemyPartyMemberIds.add(enemyPokemon.id);

          loadPokemonAssets.push(enemyPokemon.loadAssets());
        });

        scene.arena.weather = sessionData.arena.weather;
        // TODO
        //scene.arena.tags = sessionData.arena.tags;

        const modifiersModule = await import('../modifier/modifier');

        for (let modifierData of sessionData.modifiers) {
          const modifier = modifierData.toModifier(scene, modifiersModule[modifierData.className]);
          if (modifier)
            scene.addModifier(modifier, true);
        }

        scene.updateModifiers(true);

        for (let enemyModifierData of sessionData.enemyModifiers) {
          const modifier = enemyModifierData.toModifier(scene, modifiersModule[enemyModifierData.className]);
          if (modifier)
            scene.addEnemyModifier(modifier, true);
        }

        scene.updateModifiers(false);

        Promise.all(loadPokemonAssets).then(() => resolve(true));
      } catch (err) {
        reject(err);
        return;
      }
    });
  }

  clearSession(): void {
    localStorage.removeItem('sessionData');
  }

  private initDexData(): void {
    const data: DexData = {};

    for (let species of allSpecies) {
      data[species.speciesId] = {
        seenAttr: 0n, caughtAttr: 0n, seenCount: 0, caughtCount: 0, ivs: [ 0, 0, 0, 0, 0, 0 ]
      };
    }

    const defaultStarters: Species[] = [
      Species.BULBASAUR, Species.CHARMANDER, Species.SQUIRTLE,
      Species.CHIKORITA, Species.CYNDAQUIL, Species.TOTODILE,
      Species.TREECKO, Species.TORCHIC, Species.MUDKIP,
      Species.TURTWIG, Species.CHIMCHAR, Species.PIPLUP,
      Species.SNIVY, Species.TEPIG, Species.OSHAWOTT
    ];

    const defaultStarterAttr = DexAttr.NON_SHINY | DexAttr.MALE | DexAttr.ABILITY_1 | DexAttr.DEFAULT_FORM;

    for (let ds of defaultStarters) {
      let entry = data[ds] as DexEntry;
      entry.seenAttr = defaultStarterAttr;
      entry.caughtAttr = defaultStarterAttr;
      for (let i in entry.ivs)
        entry.ivs[i] = 10;
    }

    this.dexData = data;
  }

  setPokemonSeen(pokemon: Pokemon, incrementCount: boolean = true): void {
    const dexEntry = this.dexData[pokemon.species.speciesId];
    dexEntry.seenAttr |= pokemon.getDexAttr();
    if (incrementCount)
      dexEntry.seenCount++;
  }

  setPokemonCaught(pokemon: Pokemon, incrementCount: boolean = true): Promise<void> {
    return this.setPokemonSpeciesCaught(pokemon, pokemon.species, incrementCount);
  }

  setPokemonSpeciesCaught(pokemon: Pokemon, species: PokemonSpecies, incrementCount?: boolean): Promise<void> {
    return new Promise<void>((resolve) => {
      const dexEntry = this.dexData[species.speciesId];
      const caughtAttr = dexEntry.caughtAttr;
      dexEntry.caughtAttr |= pokemon.getDexAttr();
      if (incrementCount)
        dexEntry.seenCount++;

      const hasPrevolution = pokemonPrevolutions.hasOwnProperty(species.speciesId);
      const newCatch = !caughtAttr;

      if (newCatch && !hasPrevolution) {
        this.scene.playSoundWithoutBgm('level_up_fanfare', 1500);
        this.scene.ui.showText(`${species.name} has been\nadded as a starter!`, null, () => resolve(), null, true);
        return;
      }

      if (hasPrevolution) {
        const prevolutionSpecies = pokemonPrevolutions[species.speciesId];
        return this.setPokemonSpeciesCaught(pokemon, getPokemonSpecies(prevolutionSpecies)).then(() => resolve());
      } else
        resolve();
    });
  }

  getSpeciesDefaultDexAttr(species: PokemonSpecies): bigint {
    let ret = 0n;
    const dexEntry = this.dexData[species.speciesId];
    const attr = dexEntry.caughtAttr;
    ret |= attr & DexAttr.NON_SHINY || !(attr & DexAttr.SHINY) ? DexAttr.NON_SHINY : DexAttr.SHINY;
    ret |= attr & DexAttr.MALE || !(attr & DexAttr.FEMALE) ? DexAttr.MALE : DexAttr.FEMALE;
    ret |= attr & DexAttr.ABILITY_1 || (!(attr & DexAttr.ABILITY_2) && !(attr & DexAttr.ABILITY_HIDDEN)) ? DexAttr.ABILITY_1 : attr & DexAttr.ABILITY_2 ? DexAttr.ABILITY_2 : DexAttr.ABILITY_HIDDEN;
    ret |= this.getFormAttr(this.getFormIndex(attr));
    return ret;
  }

  getSpeciesDexAttrProps(species: PokemonSpecies, dexAttr: bigint): DexAttrProps {
    const shiny = !(dexAttr & DexAttr.NON_SHINY);
    const female = !(dexAttr & DexAttr.MALE);
    const abilityIndex = dexAttr & DexAttr.ABILITY_1 ? 0 : !species.ability2 || dexAttr & DexAttr.ABILITY_2 ? 1 : 2;
    const formIndex = this.getFormIndex(dexAttr);

    return {
      shiny,
      female,
      abilityIndex,
      formIndex
    };
  }

  getFormIndex(attr: bigint): integer {
    if (!attr || attr < DexAttr.DEFAULT_FORM)
      return 0;
    let f = 0;
    while (!(attr & this.getFormAttr(f)))
      f++;
    return f;
  }

  getFormAttr(formIndex: integer): bigint {
    return BigInt(Math.pow(2, 7 + formIndex));
  }

  // TODO: Remove
  migrateLegacyDexData(dexData: DexData, legacyDexData: object): DexData {
    const newDexData: DexData = {};

    for (let s of Object.keys(legacyDexData)) {
      const species = getPokemonSpecies(parseInt(s));
      const newEntry = dexData[parseInt(s)];
      let seenAttr = 0n;
      let caughtAttr = 0n;
      Object.keys(legacyDexData[s]).forEach(shinyIndex => {
        const shinyData = legacyDexData[s][shinyIndex];
        if (species.forms?.length) {
          Object.keys(shinyData).forEach(formIndex => {
            const formData = shinyData[formIndex];
            if (species.malePercent !== null) {
              Object.keys(formData).forEach(genderIndex => {
                const genderData = formData[genderIndex];
                Object.keys(genderData).forEach(abilityIndex => {
                  const entry = genderData[abilityIndex];
                  if (entry.seen) {
                    seenAttr |= !parseInt(shinyIndex) ? DexAttr.NON_SHINY : DexAttr.SHINY;
                    seenAttr |= !parseInt(genderIndex) ? DexAttr.MALE : DexAttr.FEMALE;
                    seenAttr |= parseInt(abilityIndex) === 0 ? DexAttr.ABILITY_1 : parseInt(abilityIndex) === 1 && species.ability2 ? DexAttr.ABILITY_2 : DexAttr.ABILITY_HIDDEN;
                    seenAttr |= this.getFormAttr(parseInt(formIndex));
                  }
                  if (entry.caught) {
                    if (!caughtAttr)
                      newEntry.ivs = [ 10, 10, 10, 10, 10, 10 ];
                    caughtAttr |= !parseInt(shinyIndex) ? DexAttr.NON_SHINY : DexAttr.SHINY;
                    caughtAttr |= !parseInt(genderIndex) ? DexAttr.MALE : DexAttr.FEMALE;
                    caughtAttr |= parseInt(abilityIndex) === 0 ? DexAttr.ABILITY_1 : parseInt(abilityIndex) === 1 && species.ability2 ? DexAttr.ABILITY_2 : DexAttr.ABILITY_HIDDEN;
                    caughtAttr |= this.getFormAttr(parseInt(formIndex));
                  }
                });
              });
            } else {
              Object.keys(formData).forEach(abilityIndex => {
                const entry = formData[abilityIndex];
                if (entry.seen) {
                  seenAttr |= !parseInt(shinyIndex) ? DexAttr.NON_SHINY : DexAttr.SHINY;
                  seenAttr |= DexAttr.MALE;
                  seenAttr |= parseInt(abilityIndex) === 0 ? DexAttr.ABILITY_1 : parseInt(abilityIndex) === 1 && species.ability2 ? DexAttr.ABILITY_2 : DexAttr.ABILITY_HIDDEN;
                  seenAttr |= this.getFormAttr(parseInt(formIndex));
                }
                if (entry.caught) {
                  if (!caughtAttr)
                    newEntry.ivs = [ 10, 10, 10, 10, 10, 10 ];
                  caughtAttr |= !parseInt(shinyIndex) ? DexAttr.NON_SHINY : DexAttr.SHINY;
                  caughtAttr |= DexAttr.MALE;
                  caughtAttr |= parseInt(abilityIndex) === 0 ? DexAttr.ABILITY_1 : parseInt(abilityIndex) === 1 && species.ability2 ? DexAttr.ABILITY_2 : DexAttr.ABILITY_HIDDEN;
                  caughtAttr |= this.getFormAttr(parseInt(formIndex));
                }
              });
            }
          });
        } else {
          if (species.malePercent !== null) {
            Object.keys(shinyData).forEach(genderIndex => {
              const genderData = shinyData[genderIndex];
              Object.keys(genderData).forEach(abilityIndex => {
                const entry = genderData[abilityIndex];
                if (entry.seen) {
                  seenAttr |= !parseInt(shinyIndex) ? DexAttr.NON_SHINY : DexAttr.SHINY;
                  seenAttr |= !parseInt(genderIndex) ? DexAttr.MALE : DexAttr.FEMALE;
                  seenAttr |= parseInt(abilityIndex) === 0 ? DexAttr.ABILITY_1 : parseInt(abilityIndex) === 1 && species.ability2 ? DexAttr.ABILITY_2 : DexAttr.ABILITY_HIDDEN;
                  seenAttr |= DexAttr.DEFAULT_FORM;
                }
                if (entry.caught) {
                  if (!caughtAttr)
                    newEntry.ivs = [ 10, 10, 10, 10, 10, 10 ];
                  caughtAttr |= !parseInt(shinyIndex) ? DexAttr.NON_SHINY : DexAttr.SHINY;
                  caughtAttr |= !parseInt(genderIndex) ? DexAttr.MALE : DexAttr.FEMALE;
                  caughtAttr |= parseInt(abilityIndex) === 0 ? DexAttr.ABILITY_1 : parseInt(abilityIndex) === 1 && species.ability2 ? DexAttr.ABILITY_2 : DexAttr.ABILITY_HIDDEN;
                  caughtAttr |= DexAttr.DEFAULT_FORM;
                }
              });
            });
          } else {
            Object.keys(shinyData).forEach(abilityIndex => {
              const entry = shinyData[abilityIndex];
              if (entry.seen) {
                seenAttr |= !parseInt(shinyIndex) ? DexAttr.NON_SHINY : DexAttr.SHINY;
                seenAttr |= DexAttr.MALE;
                seenAttr |= parseInt(abilityIndex) === 0 ? DexAttr.ABILITY_1 : parseInt(abilityIndex) === 1 && species.ability2 ? DexAttr.ABILITY_2 : DexAttr.ABILITY_HIDDEN;
                seenAttr |= DexAttr.DEFAULT_FORM;
              }
              if (entry.caught) {
                if (!caughtAttr)
                  newEntry.ivs = [ 10, 10, 10, 10, 10, 10 ];
                caughtAttr |= !parseInt(shinyIndex) ? DexAttr.NON_SHINY : DexAttr.SHINY;
                caughtAttr |= DexAttr.MALE;
                caughtAttr |= parseInt(abilityIndex) === 0 ? DexAttr.ABILITY_1 : parseInt(abilityIndex) === 1 && species.ability2 ? DexAttr.ABILITY_2 : DexAttr.ABILITY_HIDDEN;
                caughtAttr |= DexAttr.DEFAULT_FORM;
              }
            });
          }
        }
      });

      newEntry.seenAttr = seenAttr;
      newEntry.caughtAttr = caughtAttr;
    }

    return newDexData;
  }
}