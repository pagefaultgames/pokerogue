import BattleScene, { PokeballCounts } from "../battle-scene";
import Pokemon, { EnemyPokemon, PlayerPokemon } from "../pokemon";
import { pokemonPrevolutions } from "../data/pokemon-evolutions";
import PokemonSpecies, { allSpecies, getPokemonSpecies, speciesStarters } from "../data/pokemon-species";
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
import EggData from "./egg-data";
import { Egg } from "../data/egg";
import { VoucherType, vouchers } from "./voucher";
import { AES, enc } from "crypto-js";
import { Mode } from "../ui/ui";
import { updateUserInfo } from "../account";

const saveKey = 'x0i2O7WRiANTqPmZ'; // Temporary; secure encryption is not yet necessary

export enum GameDataType {
  SYSTEM,
  SESSION,
  SETTINGS
}

export function getDataTypeKey(dataType: GameDataType): string {
  switch (dataType) {
    case GameDataType.SYSTEM:
      return 'data';
    case GameDataType.SESSION:
      return 'sessionData';
    case GameDataType.SETTINGS:
      return 'settings';
  }
}

interface SystemSaveData {
  trainerId: integer;
  secretId: integer;
  dexData: DexData;
  unlocks: Unlocks;
  achvUnlocks: AchvUnlocks;
  voucherUnlocks: VoucherUnlocks;
  voucherCounts: VoucherCounts;
  eggs: EggData[];
  gameVersion: string;
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
  gameVersion: string;
  timestamp: integer;
}

interface Unlocks {
  [key: integer]: boolean;
}

interface AchvUnlocks {
  [key: string]: integer
}

interface VoucherUnlocks {
  [key: string]: integer
}

export interface VoucherCounts {
	[type: string]: integer;
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

  public voucherUnlocks: VoucherUnlocks;
  public voucherCounts: VoucherCounts;
  public eggs: Egg[];

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
    this.voucherUnlocks = {};
    this.voucherCounts = {
      [VoucherType.REGULAR]: 0,
      [VoucherType.PLUS]: 0,
      [VoucherType.PREMIUM]: 0,
      [VoucherType.GOLDEN]: 0
    };
    this.eggs = [];
    this.initDexData();
    this.loadSystem();
  }

  public saveSystem(): Promise<boolean> {
    return new Promise<boolean>(resolve => {
      if (this.scene.quickStart)
        return resolve(true);

      updateUserInfo().then(success => {
        if (!success)
          return resolve(false);
        const data: SystemSaveData = {
          trainerId: this.trainerId,
          secretId: this.secretId,
          dexData: this.dexData,
          unlocks: this.unlocks,
          achvUnlocks: this.achvUnlocks,
          voucherUnlocks: this.voucherUnlocks,
          voucherCounts: this.voucherCounts,
          eggs: this.eggs.map(e => new EggData(e)),
          gameVersion: this.scene.game.config.gameVersion,
          timestamp: new Date().getTime()
        };
  
        localStorage.setItem('data_bak', localStorage.getItem('data'));
  
        const maxIntAttrValue = Math.pow(2, 31);
        localStorage.setItem('data', btoa(JSON.stringify(data, (k: any, v: any) => typeof v === 'bigint' ? v <= maxIntAttrValue ? Number(v) : v.toString() : v)));
  
        resolve(true);
      });
    });
  }

  private loadSystem(): boolean {
    if (!localStorage.hasOwnProperty('data'))
      return false;

    const data = this.parseSystemData(atob(localStorage.getItem('data')));

    console.debug(data);

    /*const versions = [ this.scene.game.config.gameVersion, data.gameVersion || '0.0.0' ];
    
    if (versions[0] !== versions[1]) {
      const [ versionNumbers, oldVersionNumbers ] = versions.map(ver => ver.split('.').map(v => parseInt(v)));
    }*/

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

    if (data.voucherUnlocks) {
      for (let v of Object.keys(data.voucherUnlocks)) {
        if (vouchers.hasOwnProperty(v))
          this.voucherUnlocks[v] = data.voucherUnlocks[v];
      }
    }

    if (data.voucherCounts) {
      Utils.getEnumKeys(VoucherType).forEach(key => {
        const index = VoucherType[key];
        this.voucherCounts[index] = data.voucherCounts[index] || 0;
      });
    }

    this.eggs = data.eggs
      ? data.eggs.map(e => e.toEgg())
      : [];

    if (data.dexData[1].hasOwnProperty(0))
      this.migrateLegacyDexData(this.dexData, data.dexData);
    else
      this.dexData = Object.assign(this.dexData, data.dexData);

    return true;
  }

  private parseSystemData(dataStr: string): SystemSaveData {
    return JSON.parse(dataStr, (k: string, v: any) => {
      if (k === 'eggs') {
        const ret: EggData[] = [];
        for (let e of v)
          ret.push(new EggData(e));
        return ret;
      }

      return k.endsWith('Attr') ? BigInt(v) : v;
    }) as SystemSaveData;
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
    Object.values(Setting).map(setting => setting as Setting).forEach(setting => setSetting(this.scene, setting, settingDefaults[setting]));

    if (!localStorage.hasOwnProperty('settings'))
      return false;

    const settings = JSON.parse(localStorage.getItem('settings'));

    for (let setting of Object.keys(settings))
      setSetting(this.scene, setting as Setting, settings[setting]);
  }

  saveSession(scene: BattleScene, skipVerification?: boolean): Promise<boolean> {
    return new Promise<boolean>(resolve => {
      Utils.executeIf(!skipVerification, updateUserInfo).then(success => {
        if (success !== null && !success)
          return resolve(false);

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
          gameVersion: scene.game.config.gameVersion,
          timestamp: new Date().getTime()
        } as SessionSaveData;

        localStorage.setItem('sessionData', btoa(JSON.stringify(sessionData)));

        console.debug('Session data saved');

        resolve(true);
      });
    });
  }

  hasSession() {
    return !!localStorage.getItem('sessionData');
  }

  loadSession(scene: BattleScene): Promise<boolean> {
    return new Promise(async (resolve, reject) => {
      if (!this.hasSession())
        return resolve(false);

      try {
        const sessionDataStr = atob(localStorage.getItem('sessionData'));
        const sessionData = this.parseSessionData(sessionDataStr);

        console.debug(sessionData);

        scene.seed = sessionData.seed || scene.game.config.seed[0];
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

  parseSessionData(dataStr: string): SessionSaveData {
    return JSON.parse(dataStr, (k: string, v: any) => {
      /*const versions = [ scene.game.config.gameVersion, sessionData.gameVersion || '0.0.0' ];

      if (versions[0] !== versions[1]) {
        const [ versionNumbers, oldVersionNumbers ] = versions.map(ver => ver.split('.').map(v => parseInt(v)));
      }*/

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
  }

  public exportData(dataType: GameDataType): void {
    const dataKey: string = getDataTypeKey(dataType);
    const dataStr = atob(localStorage.getItem(dataKey));
    const encryptedData = AES.encrypt(dataStr, saveKey);
    const blob = new Blob([ encryptedData.toString() ], {type: 'text/json'});
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.download = `${dataKey}.prsv`;
    link.click();
    link.remove();
  }

  public importData(dataType: GameDataType): void {
    const dataKey = getDataTypeKey(dataType);

    let saveFile: any = document.getElementById('saveFile');
    if (saveFile)
      saveFile.remove();
  
    saveFile = document.createElement('input');
    saveFile.id = 'saveFile';
    saveFile.type = 'file';
    saveFile.accept = '.prsv';
    saveFile.style.display = 'none';
    saveFile.addEventListener('change',
      e => {
        let reader = new FileReader();

        reader.onload = (_ => {
            return e => {
              const dataStr = AES.decrypt(e.target.result.toString(), saveKey).toString(enc.Utf8);
              let valid = false;
              try {
                switch (dataType) {
                  case GameDataType.SYSTEM:
                    const systemData = this.parseSystemData(dataStr);
                    valid = !!systemData.dexData && !!systemData.timestamp;
                    break;
                  case GameDataType.SESSION:
                    const sessionData = this.parseSessionData(dataStr);
                    valid = !!sessionData.party && !!sessionData.enemyParty && !!sessionData.timestamp;
                    break;
                  case GameDataType.SETTINGS:
                    valid = true;
                    break;
                }
              } catch (ex) {
                console.error(ex);
              }

              let dataName: string;
              switch (dataType) {
                case GameDataType.SYSTEM:
                  dataName = 'save';
                  break;
                case GameDataType.SESSION:
                  dataName = 'session';
                  break;
                case GameDataType.SETTINGS:
                  dataName = 'settings';
                  break;
              }

              if (!valid)
                return this.scene.ui.showText(`Your ${dataName} data could not be loaded. It may be corrupted.`, null, () => this.scene.ui.showText(null, 0), Utils.fixedInt(1500));
              this.scene.ui.showText(`Your ${dataName} data will be overridden and the page will reload. Proceed?`, null, () => {
                this.scene.ui.setOverlayMode(Mode.CONFIRM, () => {
                  localStorage.setItem(dataKey, btoa(dataStr));
                  window.location = window.location;
                }, () => {
                  this.scene.ui.revertMode();
                  this.scene.ui.showText(null, 0);
                }, false, 98);
              });
            };
          })((e.target as any).files[0]);

        reader.readAsText((e.target as any).files[0]);
      }
    );
    saveFile.click();
    /*(this.scene.plugins.get('rexfilechooserplugin') as FileChooserPlugin).open({ accept: '.prsv' })
      .then(result => {
    });*/
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
      Species.SNIVY, Species.TEPIG, Species.OSHAWOTT,
      Species.CHESPIN, Species.FENNEKIN, Species.FROAKIE,
      Species.ROWLET, Species.LITTEN, Species.POPPLIO,
      Species.GROOKEY, Species.SCORBUNNY, Species.SOBBLE,
      Species.SPRIGATITO, Species.FUECOCO, Species.QUAXLY
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

      const checkPrevolution = () => {
        if (hasPrevolution) {
          const prevolutionSpecies = pokemonPrevolutions[species.speciesId];
          return this.setPokemonSpeciesCaught(pokemon, getPokemonSpecies(prevolutionSpecies)).then(() => resolve());
        } else
          resolve();
      };

      if (newCatch && speciesStarters.hasOwnProperty(species.speciesId)) {
        this.scene.playSoundWithoutBgm('level_up_fanfare', 1500);
        this.scene.ui.showText(`${species.name} has been\nadded as a starter!`, null, () => checkPrevolution(), null, true);
      } else
        checkPrevolution();
    });
  }

  updateSpeciesDexIvs(speciesId: Species, ivs: integer[]): void {
    let dexEntry: DexEntry;
    do {
      dexEntry = this.scene.gameData.dexData[speciesId];
      const dexIvs = dexEntry.ivs;
      for (let i = 0; i < dexIvs.length; i++) {
        if (dexIvs[i] < ivs[i])
          dexIvs[i] = ivs[i];
      }
      if (dexIvs.filter(iv => iv === 31).length === 6)
        this.scene.validateAchv(achvs.PERFECT_IVS);
    } while (pokemonPrevolutions.hasOwnProperty(speciesId) && (speciesId = pokemonPrevolutions[speciesId]));
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