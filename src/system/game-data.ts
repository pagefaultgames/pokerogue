import BattleScene, { PokeballCounts, bypassLogin } from "../battle-scene";
import Pokemon, { EnemyPokemon, PlayerPokemon } from "../field/pokemon";
import { pokemonEvolutions, pokemonPrevolutions } from "../data/pokemon-evolutions";
import PokemonSpecies, { allSpecies, getPokemonSpecies, noStarterFormKeys, speciesStarters } from "../data/pokemon-species";
import { Species, defaultStarterSpecies } from "../data/enums/species";
import * as Utils from "../utils";
import PokemonData from "./pokemon-data";
import PersistentModifierData from "./modifier-data";
import ArenaData from "./arena-data";
import { Unlockables } from "./unlockables";
import { GameModes, gameModes } from "../game-mode";
import { BattleType } from "../battle";
import TrainerData from "./trainer-data";
import { trainerConfigs } from "../data/trainer-config";
import { Setting, setSetting, settingDefaults } from "./settings";
import { achvs } from "./achv";
import EggData from "./egg-data";
import { Egg } from "../data/egg";
import { VoucherType, vouchers } from "./voucher";
import { AES, enc } from "crypto-js";
import { Mode } from "../ui/ui";
import { loggedInUser, updateUserInfo } from "../account";
import { Nature } from "../data/nature";
import { GameStats } from "./game-stats";
import { Tutorial } from "../tutorial";
import { Moves } from "../data/enums/moves";
import { speciesEggMoves } from "../data/egg-moves";
import { allMoves } from "../data/move";
import { TrainerVariant } from "../field/trainer";
import { OutdatedPhase, ReloadSessionPhase } from "#app/phases";
import { Variant, variantData } from "#app/data/variant";

const saveKey = 'x0i2O7WRiANTqPmZ'; // Temporary; secure encryption is not yet necessary

export enum GameDataType {
  SYSTEM,
  SESSION,
  SETTINGS,
  TUTORIALS
}

export enum PlayerGender {
  UNSET,
  MALE,
  FEMALE
}

export enum Passive {
  UNLOCKED = 1,
  ENABLED = 2
}

export function getDataTypeKey(dataType: GameDataType, slotId: integer = 0): string {
  switch (dataType) {
    case GameDataType.SYSTEM:
      return 'data';
    case GameDataType.SESSION:
      let ret = 'sessionData';
      if (slotId)
        ret += slotId;
      return ret;
    case GameDataType.SETTINGS:
      return 'settings';
    case GameDataType.TUTORIALS:
      return 'tutorials';
  }
}

interface SystemSaveData {
  trainerId: integer;
  secretId: integer;
  gender: PlayerGender;
  dexData: DexData;
  starterData: StarterData;
  gameStats: GameStats;
  unlocks: Unlocks;
  achvUnlocks: AchvUnlocks;
  voucherUnlocks: VoucherUnlocks;
  voucherCounts: VoucherCounts;
  eggs: EggData[];
  gameVersion: string;
  timestamp: integer;
}

export interface SessionSaveData {
  seed: string;
  playTime: integer;
  gameMode: GameModes;
  party: PokemonData[];
  enemyParty: PokemonData[];
  modifiers: PersistentModifierData[];
  enemyModifiers: PersistentModifierData[];
  arena: ArenaData;
  pokeballCounts: PokeballCounts;
  money: integer;
  score: integer;
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
  natureAttr: integer,
  seenCount: integer;
  caughtCount: integer;
  hatchedCount: integer;
  ivs: integer[];
}

export const DexAttr = {
  NON_SHINY: 1n,
  SHINY: 2n,
  MALE: 4n,
  FEMALE: 8n,
  DEFAULT_VARIANT: 16n,
  VARIANT_2: 32n,
  VARIANT_3: 64n,
  DEFAULT_FORM: 128n
}

export interface DexAttrProps {
  shiny: boolean;
  female: boolean;
  variant: Variant;
  formIndex: integer;
}

export const AbilityAttr = {
  ABILITY_1: 1,
  ABILITY_2: 2,
  ABILITY_HIDDEN: 4
}

export type StarterMoveset = [ Moves ] | [ Moves, Moves ] | [ Moves, Moves, Moves ] | [ Moves, Moves, Moves, Moves ];

export interface StarterFormMoveData {
  [key: integer]: StarterMoveset
}

export interface StarterMoveData {
  [key: integer]: StarterMoveset | StarterFormMoveData
}

export interface StarterDataEntry {
  moveset: StarterMoveset | StarterFormMoveData; 
  eggMoves: integer;
  candyCount: integer;
  abilityAttr: integer;
  passiveAttr: integer;
  valueReduction: integer;
}

export interface StarterData {
  [key: integer]: StarterDataEntry
}

export interface TutorialFlags {
  [key: string]: boolean
}

const systemShortKeys = {
  seenAttr: '$sa',
  caughtAttr: '$ca',
  natureAttr: '$na',
  seenCount: '$s' ,
  caughtCount: '$c',
  ivs: '$i',
  moveset: '$m',
  eggMoves: '$em',
  candyCount: '$x',
  passive: '$p',
  valueReduction: '$vr'
};

export class GameData {
  private scene: BattleScene;

  public trainerId: integer;
  public secretId: integer;

  public gender: PlayerGender;
  
  public dexData: DexData;
  private defaultDexData: DexData;

  public starterData: StarterData;

  public gameStats: GameStats;

  public unlocks: Unlocks;

  public achvUnlocks: AchvUnlocks;

  public voucherUnlocks: VoucherUnlocks;
  public voucherCounts: VoucherCounts;
  public eggs: Egg[];

  constructor(scene: BattleScene) {
    this.scene = scene;
    this.loadSettings();
    this.trainerId = Utils.randInt(65536);
    this.secretId = Utils.randInt(65536);
    this.starterData = {};
    this.gameStats = new GameStats();
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
    this.initStarterData();
  }

  public saveSystem(): Promise<boolean> {
    return new Promise<boolean>(resolve => {
      this.scene.ui.savingIcon.show();
      updateUserInfo().then(response => {
        if (!response[0]) {
          this.scene.ui.savingIcon.hide();
          return resolve(false);
        }
        const data: SystemSaveData = {
          trainerId: this.trainerId,
          secretId: this.secretId,
          gender: this.gender,
          dexData: this.dexData,
          starterData: this.starterData,
          gameStats: this.gameStats,
          unlocks: this.unlocks,
          achvUnlocks: this.achvUnlocks,
          voucherUnlocks: this.voucherUnlocks,
          voucherCounts: this.voucherCounts,
          eggs: this.eggs.map(e => new EggData(e)),
          gameVersion: this.scene.game.config.gameVersion,
          timestamp: new Date().getTime()
        };

        const maxIntAttrValue = Math.pow(2, 31);
        const systemData = JSON.stringify(data, (k: any, v: any) => typeof v === 'bigint' ? v <= maxIntAttrValue ? Number(v) : v.toString() : v);

        if (!bypassLogin) {
          Utils.apiPost(`savedata/update?datatype=${GameDataType.SYSTEM}`, systemData, undefined, true)
            .then(response => response.text())
            .then(error => {
              this.scene.ui.savingIcon.hide();
              if (error) {
                if (error.startsWith('client version out of date')) {
                  this.scene.clearPhaseQueue();
                  this.scene.unshiftPhase(new OutdatedPhase(this.scene));
                } else if (error.startsWith('session out of date')) {
                  this.scene.clearPhaseQueue();
                  this.scene.unshiftPhase(new ReloadSessionPhase(this.scene));
                }
                console.error(error);
                return resolve(false);
              }
              resolve(true);
            });
        } else {
          localStorage.setItem('data_bak', localStorage.getItem('data'));

          localStorage.setItem('data', btoa(systemData));

          this.scene.ui.savingIcon.hide();

          resolve(true);
        }
      });
    });
  }

  public loadSystem(): Promise<boolean> {
    return new Promise<boolean>(resolve => {
      if (bypassLogin && !localStorage.hasOwnProperty('data'))
        return resolve(false);

      const handleSystemData = (systemDataStr: string) => {
        try {
          const systemData = this.parseSystemData(systemDataStr);

          console.debug(systemData);

          /*const versions = [ this.scene.game.config.gameVersion, data.gameVersion || '0.0.0' ];
          
          if (versions[0] !== versions[1]) {
            const [ versionNumbers, oldVersionNumbers ] = versions.map(ver => ver.split('.').map(v => parseInt(v)));
          }*/

          this.trainerId = systemData.trainerId;
          this.secretId = systemData.secretId;

          this.gender = systemData.gender;

          this.saveSetting(Setting.Player_Gender, systemData.gender === PlayerGender.FEMALE ? 1 : 0);

          const initStarterData = !systemData.starterData;

          if (initStarterData) {
            this.initStarterData();

            if (systemData['starterMoveData']) {
              const starterMoveData = systemData['starterMoveData'];
              for (let s of Object.keys(starterMoveData))
                this.starterData[s].moveset = starterMoveData[s];
            }

            if (systemData['starterEggMoveData']) {
              const starterEggMoveData = systemData['starterEggMoveData'];
              for (let s of Object.keys(starterEggMoveData))
                this.starterData[s].eggMoves = starterEggMoveData[s];
            }

            this.migrateStarterAbilities(systemData, this.starterData);
          } else {
            if ([ '1.0.0', '1.0.1' ].includes(systemData.gameVersion))
              this.migrateStarterAbilities(systemData);
            //this.fixVariantData(systemData);
            this.fixStarterData(systemData);
            // Migrate ability starter data if empty for caught species
            Object.keys(systemData.starterData).forEach(sd => {
              if (systemData.dexData[sd].caughtAttr && !systemData.starterData[sd].abilityAttr)
                systemData.starterData[sd].abilityAttr = 1;
            });
            this.starterData = systemData.starterData;
          }

          if (systemData.gameStats)
            this.gameStats = systemData.gameStats;

          if (systemData.unlocks) {
            for (let key of Object.keys(systemData.unlocks)) {
              if (this.unlocks.hasOwnProperty(key))
                this.unlocks[key] = systemData.unlocks[key];
            }
          }

          if (systemData.achvUnlocks) {
            for (let a of Object.keys(systemData.achvUnlocks)) {
              if (achvs.hasOwnProperty(a))
                this.achvUnlocks[a] = systemData.achvUnlocks[a];
            } 
          }

          if (systemData.voucherUnlocks) {
            for (let v of Object.keys(systemData.voucherUnlocks)) {
              if (vouchers.hasOwnProperty(v))
                this.voucherUnlocks[v] = systemData.voucherUnlocks[v];
            }
          }

          if (systemData.voucherCounts) {
            Utils.getEnumKeys(VoucherType).forEach(key => {
              const index = VoucherType[key];
              this.voucherCounts[index] = systemData.voucherCounts[index] || 0;
            });
          }

          this.eggs = systemData.eggs
            ? systemData.eggs.map(e => e.toEgg())
            : [];

          this.dexData = Object.assign(this.dexData, systemData.dexData);
          this.consolidateDexData(this.dexData);
          this.defaultDexData = null;

          if (initStarterData) {
            const starterIds = Object.keys(this.starterData).map(s => parseInt(s) as Species);
            for (let s of starterIds) {
              this.starterData[s].candyCount += this.dexData[s].caughtCount;
              this.starterData[s].candyCount += this.dexData[s].hatchedCount * 2;
              if (this.dexData[s].caughtAttr & DexAttr.SHINY)
                this.starterData[s].candyCount += 4;
            }
          }

          resolve(true);
        } catch (err) {
          console.error(err);
          resolve(false);
        }
      }

      if (!bypassLogin) {
        Utils.apiFetch(`savedata/get?datatype=${GameDataType.SYSTEM}`, true)
          .then(response => response.text())
          .then(response => {
            if (!response.length || response[0] !== '{') {
              if (response.startsWith('failed to open save file')) {
                this.scene.queueMessage('Save data could not be found. If this is a new account, you can safely ignore this message.', null, true);
                return resolve(true);
              } else if (response.indexOf('Too many connections') > -1) {
                this.scene.queueMessage('Too many people are trying to connect and the server is overloaded. Please try again later.', null, true);
                return resolve(false);
              }
              console.error(response);
              return resolve(false);
            }

            handleSystemData(response);
          });
      } else
        handleSystemData(atob(localStorage.getItem('data')));
    });
  }

  private parseSystemData(dataStr: string): SystemSaveData {
    return JSON.parse(dataStr, (k: string, v: any) => {
      if (k === 'gameStats')
        return new GameStats(v);
      else if (k === 'eggs') {
        const ret: EggData[] = [];
        if (v === null)
          v = [];
        for (let e of v)
          ret.push(new EggData(e));
        return ret;
      }

      return k.endsWith('Attr') && ![ 'natureAttr', 'abilityAttr', 'passiveAttr' ].includes(k) ? BigInt(v) : v;
    }) as SystemSaveData;
  }

  private convertSystemDataStr(dataStr: string, shorten: boolean = false): string {
    const fromKeys = shorten ? Object.keys(systemShortKeys) : Object.values(systemShortKeys);
    const toKeys = shorten ? Object.values(systemShortKeys) : Object.keys(systemShortKeys);
    for (let k in fromKeys)
      dataStr = dataStr.replace(new RegExp(`${fromKeys[k].replace('$', '\\$')}`, 'g'), toKeys[k]);

    return dataStr;
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

  public saveTutorialFlag(tutorial: Tutorial, flag: boolean): boolean {
    let tutorials: object = {};
    if (localStorage.hasOwnProperty('tutorials'))
      tutorials = JSON.parse(localStorage.getItem('tutorials'));

    Object.keys(Tutorial).map(t => t as Tutorial).forEach(t => {
      const key = Tutorial[t];
      if (key === tutorial)
        tutorials[key] = flag;
      else
        tutorials[key] ??= false;
    });

    localStorage.setItem('tutorials', JSON.stringify(tutorials));

    return true;
  }

  public getTutorialFlags(): TutorialFlags {
    const ret: TutorialFlags = {};
    Object.values(Tutorial).map(tutorial => tutorial as Tutorial).forEach(tutorial => ret[Tutorial[tutorial]] = false);

    if (!localStorage.hasOwnProperty('tutorials'))
      return ret;

    const tutorials = JSON.parse(localStorage.getItem('tutorials'));

    for (let tutorial of Object.keys(tutorials))
      ret[tutorial] = tutorials[tutorial];

    return ret;
  }

  private getSessionSaveData(scene: BattleScene): SessionSaveData {
    return {
      seed: scene.seed,
      playTime: scene.sessionPlayTime,
      gameMode: scene.gameMode.modeId,
      party: scene.getParty().map(p => new PokemonData(p)),
      enemyParty: scene.getEnemyParty().map(p => new PokemonData(p)),
      modifiers: scene.findModifiers(() => true).map(m => new PersistentModifierData(m, true)),
      enemyModifiers: scene.findModifiers(() => true, false).map(m => new PersistentModifierData(m, false)),
      arena: new ArenaData(scene.arena),
      pokeballCounts: scene.pokeballCounts,
      money: scene.money,
      score: scene.score,
      waveIndex: scene.currentBattle.waveIndex,
      battleType: scene.currentBattle.battleType,
      trainer: scene.currentBattle.battleType == BattleType.TRAINER ? new TrainerData(scene.currentBattle.trainer) : null,
      gameVersion: scene.game.config.gameVersion,
      timestamp: new Date().getTime()
    } as SessionSaveData;
  }

  saveSession(scene: BattleScene, skipVerification?: boolean): Promise<boolean> {
    return new Promise<boolean>(resolve => {
      Utils.executeIf(!skipVerification, updateUserInfo).then(success => {
        if (success !== null && !success)
          return resolve(false);

        const sessionData = this.getSessionSaveData(scene);

        if (!bypassLogin) {
          Utils.apiPost(`savedata/update?datatype=${GameDataType.SESSION}&slot=${scene.sessionSlotId}&trainerId=${this.trainerId}&secretId=${this.secretId}`, JSON.stringify(sessionData), undefined, true)
            .then(response => response.text())
            .then(error => {
              if (error) {
                if (error.startsWith('session out of date')) {
                  this.scene.clearPhaseQueue();
                  this.scene.unshiftPhase(new ReloadSessionPhase(this.scene));
                }
                console.error(error);
                return resolve(false);
              }
              console.debug('Session data saved');
              resolve(true);
            });
        } else {
          localStorage.setItem('sessionData', btoa(JSON.stringify(sessionData)));

          console.debug('Session data saved');

          resolve(true);
        }
      });
    });
  }

  getSession(slotId: integer): Promise<SessionSaveData> {
    return new Promise(async (resolve, reject) => {
      if (slotId < 0)
        return resolve(null);
      const handleSessionData = async (sessionDataStr: string) => {
        try {
          const sessionData = this.parseSessionData(sessionDataStr);
          resolve(sessionData);
        } catch (err) {
          reject(err);
          return;
        }
      };

      if (!bypassLogin) {
        Utils.apiFetch(`savedata/get?datatype=${GameDataType.SESSION}&slot=${slotId}`, true)
          .then(response => response.text())
          .then(async response => {
            if (!response.length || response[0] !== '{') {
              console.error(response);
              return resolve(null);
            }

            await handleSessionData(response);
          });
      } else {
        const sessionData = localStorage.getItem(`sessionData${slotId ? slotId : ''}`);
        if (sessionData)
          await handleSessionData(atob(sessionData));
        else
          return resolve(null);
      }
    });
  }

  loadSession(scene: BattleScene, slotId: integer, sessionData?: SessionSaveData): Promise<boolean> {
    return new Promise(async (resolve, reject) => {
      try {
        const initSessionFromData = async sessionData => {
          console.debug(sessionData);

          scene.gameMode = gameModes[sessionData.gameMode || GameModes.CLASSIC];

          scene.setSeed(sessionData.seed || scene.game.config.seed[0]);
          scene.resetSeed();

          console.log('Seed:', scene.seed);

          scene.sessionPlayTime = sessionData.playTime || 0;

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

          if (scene.money > this.gameStats.highestMoney)
            this.gameStats.highestMoney = scene.money;

          scene.score = sessionData.score;
          scene.updateScoreText();

          scene.newArena(sessionData.arena.biome);

          const battleType = sessionData.battleType || 0;
          const trainerConfig = sessionData.trainer ? trainerConfigs[sessionData.trainer.trainerType] : null;
          const battle = scene.newBattle(sessionData.waveIndex, battleType, sessionData.trainer, battleType === BattleType.TRAINER ? trainerConfig?.doubleOnly || sessionData.trainer?.variant === TrainerVariant.DOUBLE : sessionData.enemyParty.length > 1);
          battle.enemyLevels = sessionData.enemyParty.map(p => p.level);

          scene.arena.init();

          sessionData.enemyParty.forEach((enemyData, e) => {
            const enemyPokemon = enemyData.toPokemon(scene, battleType, e, sessionData.trainer?.variant === TrainerVariant.DOUBLE) as EnemyPokemon;
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
        };
        if (sessionData)
          initSessionFromData(sessionData);
        else {
          this.getSession(slotId)
            .then(data => initSessionFromData(data))
            .catch(err => {
              reject(err);
              return;
            });
        }
      } catch (err) {
        reject(err);
        return;
      }
    });
  }

  deleteSession(slotId: integer): Promise<boolean> {
    return new Promise<boolean>(resolve => {
      if (bypassLogin) {
        localStorage.removeItem('sessionData');
        return resolve(true);
      }

      updateUserInfo().then(success => {
        if (success !== null && !success)
          return resolve(false);
        Utils.apiFetch(`savedata/delete?datatype=${GameDataType.SESSION}&slot=${slotId}`, true).then(response => {
          if (response.ok) {
            loggedInUser.lastSessionSlot = -1;
            resolve(true);
          }
          return response.text();
        }).then(error => {
          if (error) {
            if (error.startsWith('session out of date')) {
              this.scene.clearPhaseQueue();
              this.scene.unshiftPhase(new ReloadSessionPhase(this.scene));
            }
            console.error(error);
            resolve(false);
          }
          resolve(true);
        });
      });
    });
  }

  tryClearSession(scene: BattleScene, slotId: integer): Promise<[success: boolean, newClear: boolean]> {
    return new Promise<[boolean, boolean]>(resolve => {
      if (bypassLogin) {
        localStorage.removeItem('sessionData');
        return resolve([true, true]);
      }

      updateUserInfo().then(success => {
        if (success !== null && !success)
          return resolve([false, false]);
        const sessionData = this.getSessionSaveData(scene);
        Utils.apiPost(`savedata/clear?slot=${slotId}&trainerId=${this.trainerId}&secretId=${this.secretId}`, JSON.stringify(sessionData), undefined, true).then(response => {
          if (response.ok)
            loggedInUser.lastSessionSlot = -1;
          return response.json();
        }).then(jsonResponse => {
          if (!jsonResponse.error)
            return resolve([true, jsonResponse.success as boolean]);
          if (jsonResponse && jsonResponse.error.startsWith('session out of date')) {
            this.scene.clearPhaseQueue();
            this.scene.unshiftPhase(new ReloadSessionPhase(this.scene));
          }
          console.error(jsonResponse);
          resolve([false, false]);
        });
      });
    });
  }

  parseSessionData(dataStr: string): SessionSaveData {
    return JSON.parse(dataStr, (k: string, v: any) => {
      /*const versions = [ scene.game.config.gameVersion, sessionData.gameVersion || '0.0.0' ];

      if (versions[0] !== versions[1]) {
        const [ versionNumbers, oldVersionNumbers ] = versions.map(ver => ver.split('.').map(v => parseInt(v)));
      }*/

      if (k === 'party' || k === 'enemyParty') {
        const ret: PokemonData[] = [];
        if (v === null)
          v = [];
        for (let pd of v)
          ret.push(new PokemonData(pd));
        return ret;
      }

      if (k === 'trainer')
        return v ? new TrainerData(v) : null;

      if (k === 'modifiers' || k === 'enemyModifiers') {
        const player = k === 'modifiers';
        const ret: PersistentModifierData[] = [];
        if (v === null)
          v = [];
        for (let md of v)
          ret.push(new PersistentModifierData(md, player));
        return ret;
      }

      if (k === 'arena')
        return new ArenaData(v);

      return v;
    }) as SessionSaveData;
  }

  public tryExportData(dataType: GameDataType, slotId: integer = 0): Promise<boolean> {
    return new Promise<boolean>(resolve => {
      const dataKey: string = getDataTypeKey(dataType, slotId);
      const handleData = (dataStr: string) => {
        switch (dataType) {
          case GameDataType.SYSTEM:
            dataStr = this.convertSystemDataStr(dataStr, true);
            break;
        }
        const encryptedData = AES.encrypt(dataStr, saveKey);
        const blob = new Blob([ encryptedData.toString() ], {type: 'text/json'});
        const link = document.createElement('a');
        link.href = window.URL.createObjectURL(blob);
        link.download = `${dataKey}.prsv`;
        link.click();
        link.remove();
      };
      if (!bypassLogin && dataType < GameDataType.SETTINGS) {
        Utils.apiFetch(`savedata/get?datatype=${dataType}${dataType === GameDataType.SESSION ? `&slot=${slotId}` : ''}`, true)
          .then(response => response.text())
          .then(response => {
            if (!response.length || response[0] !== '{') {
              console.error(response);
              resolve(false);
              return;
            }

            handleData(response);
            resolve(true);
          });
      } else {
        const data = localStorage.getItem(dataKey);
        if (data)
          handleData(atob(data));
        resolve(!!data);
      }
    });
  }

  public importData(dataType: GameDataType, slotId: integer = 0): void {
    const dataKey = getDataTypeKey(dataType, slotId);

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
              let dataStr = AES.decrypt(e.target.result.toString(), saveKey).toString(enc.Utf8);
              let valid = false;
              try {
                switch (dataType) {
                  case GameDataType.SYSTEM:
                    dataStr = this.convertSystemDataStr(dataStr);
                    const systemData = this.parseSystemData(dataStr);
                    valid = !!systemData.dexData && !!systemData.timestamp;
                    break;
                  case GameDataType.SESSION:
                    const sessionData = this.parseSessionData(dataStr);
                    valid = !!sessionData.party && !!sessionData.enemyParty && !!sessionData.timestamp;
                    break;
                  case GameDataType.SETTINGS:
                  case GameDataType.TUTORIALS:
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
                case GameDataType.TUTORIALS:
                  dataName = 'tutorials';
                  break;
              }

              const displayError = (error: string) => this.scene.ui.showText(error, null, () => this.scene.ui.showText(null, 0), Utils.fixedInt(1500));

              if (!valid)
                return this.scene.ui.showText(`Your ${dataName} data could not be loaded. It may be corrupted.`, null, () => this.scene.ui.showText(null, 0), Utils.fixedInt(1500));
              this.scene.ui.showText(`Your ${dataName} data will be overridden and the page will reload. Proceed?`, null, () => {
                this.scene.ui.setOverlayMode(Mode.CONFIRM, () => {
                  if (!bypassLogin && dataType < GameDataType.SETTINGS) {
                    updateUserInfo().then(success => {
                      if (!success)
                        return displayError(`Could not contact the server. Your ${dataName} data could not be imported.`);
                      Utils.apiPost(`savedata/update?datatype=${dataType}${dataType === GameDataType.SESSION ? `&slot=${slotId}` : ''}&trainerId=${this.trainerId}&secretId=${this.secretId}`, dataStr, undefined, true)
                        .then(response => response.text())
                        .then(error => {
                          if (error) {
                            console.error(error);
                            return displayError(`An error occurred while updating ${dataName} data. Please contact the administrator.`);
                          }
                          window.location = window.location;
                        });
                    });
                  } else {
                    localStorage.setItem(dataKey, btoa(dataStr));
                    window.location = window.location;
                  }
                }, () => {
                  this.scene.ui.revertMode();
                  this.scene.ui.showText(null, 0);
                }, false, -98);
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
        seenAttr: 0n, caughtAttr: 0n, natureAttr: 0, seenCount: 0, caughtCount: 0, hatchedCount: 0, ivs: [ 0, 0, 0, 0, 0, 0 ]
      };
    }

    const defaultStarterAttr = DexAttr.NON_SHINY | DexAttr.MALE | DexAttr.DEFAULT_VARIANT | DexAttr.DEFAULT_FORM;

    const defaultStarterNatures: Nature[] = [];

    this.scene.executeWithSeedOffset(() => {
      const neutralNatures = [ Nature.HARDY, Nature.DOCILE, Nature.SERIOUS, Nature.BASHFUL, Nature.QUIRKY ];
      for (let s = 0; s < defaultStarterSpecies.length; s++)
        defaultStarterNatures.push(Utils.randSeedItem(neutralNatures));
    }, 0, 'default');

    for (let ds = 0; ds < defaultStarterSpecies.length; ds++) {
      let entry = data[defaultStarterSpecies[ds]] as DexEntry;
      entry.seenAttr = defaultStarterAttr;
      entry.caughtAttr = defaultStarterAttr;
      entry.natureAttr = Math.pow(2, defaultStarterNatures[ds] + 1);
      for (let i in entry.ivs)
        entry.ivs[i] = 10;
    }

    this.defaultDexData = Object.assign({}, data);
    this.dexData = data;
  }

  private initStarterData(): void {
    const starterData: StarterData = {};

    const starterSpeciesIds = Object.keys(speciesStarters).map(k => parseInt(k) as Species);

    for (let speciesId of starterSpeciesIds) {
      starterData[speciesId] = {
        moveset: null,
        eggMoves: 0,
        candyCount: 0,
        abilityAttr: defaultStarterSpecies.includes(speciesId) ? AbilityAttr.ABILITY_1 : 0,
        passiveAttr: 0,
        valueReduction: 0
      };
    }

    this.starterData = starterData;
  }

  setPokemonSeen(pokemon: Pokemon, incrementCount: boolean = true, trainer: boolean = false): void {
    const dexEntry = this.dexData[pokemon.species.speciesId];
    dexEntry.seenAttr |= pokemon.getDexAttr();
    if (incrementCount) {
      dexEntry.seenCount++;
      this.gameStats.pokemonSeen++;
      if (!trainer && pokemon.species.pseudoLegendary || pokemon.species.legendary)
        this.gameStats.legendaryPokemonSeen++;
      else if (!trainer && pokemon.species.mythical)
        this.gameStats.mythicalPokemonSeen++;
      if (!trainer && pokemon.isShiny())
        this.gameStats.shinyPokemonSeen++;
    }
  }

  setPokemonCaught(pokemon: Pokemon, incrementCount: boolean = true, fromEgg: boolean = false): Promise<void> {
    return this.setPokemonSpeciesCaught(pokemon, pokemon.species, incrementCount, fromEgg);
  }

  setPokemonSpeciesCaught(pokemon: Pokemon, species: PokemonSpecies, incrementCount: boolean = true, fromEgg: boolean = false): Promise<void> {
    return new Promise<void>(resolve => {
      const dexEntry = this.dexData[species.speciesId];
      const caughtAttr = dexEntry.caughtAttr;
      const formIndex = pokemon.formIndex;
      if (noStarterFormKeys.includes(pokemon.getFormKey()))
        pokemon.formIndex = 0;
      const dexAttr = pokemon.getDexAttr();
      pokemon.formIndex = formIndex;
      dexEntry.caughtAttr |= dexAttr;
      if (speciesStarters.hasOwnProperty(species.speciesId)) {
        this.starterData[species.speciesId].abilityAttr |= pokemon.abilityIndex !== 1 || pokemon.species.ability2
          ? Math.pow(2, pokemon.abilityIndex)
          : AbilityAttr.ABILITY_HIDDEN;
      }
      dexEntry.natureAttr |= Math.pow(2, pokemon.nature + 1);
      
      const hasPrevolution = pokemonPrevolutions.hasOwnProperty(species.speciesId);
      const newCatch = !caughtAttr;

      if (incrementCount) {
        if (!fromEgg) {
          dexEntry.caughtCount++;
          this.gameStats.pokemonCaught++;
          if (pokemon.species.pseudoLegendary || pokemon.species.legendary)
            this.gameStats.legendaryPokemonCaught++;
          else if (pokemon.species.mythical)
            this.gameStats.mythicalPokemonCaught++;
          if (pokemon.isShiny())
            this.gameStats.shinyPokemonCaught++;
        } else {
          dexEntry.hatchedCount++;
          this.gameStats.pokemonHatched++;
          if (pokemon.species.pseudoLegendary || pokemon.species.legendary)
            this.gameStats.legendaryPokemonHatched++;
          else if (pokemon.species.mythical)
            this.gameStats.mythicalPokemonHatched++;
          if (pokemon.isShiny())
            this.gameStats.shinyPokemonHatched++;
        }

        if (!hasPrevolution)
          this.addStarterCandy(species, (1 * (pokemon.isShiny() ? 5 * Math.pow(2, pokemon.variant || 0) : 1)) * (fromEgg || pokemon.isBoss() ? 2 : 1));
      }
    
      const checkPrevolution = () => {
        if (hasPrevolution) {
          const prevolutionSpecies = pokemonPrevolutions[species.speciesId];
          return this.setPokemonSpeciesCaught(pokemon, getPokemonSpecies(prevolutionSpecies), incrementCount, fromEgg).then(() => resolve());
        } else
          resolve();
      };

      if (newCatch && speciesStarters.hasOwnProperty(species.speciesId)) {
        this.scene.playSound('level_up_fanfare');
        this.scene.ui.showText(`${species.name} has been\nadded as a starter!`, null, () => checkPrevolution(), null, true);
      } else
        checkPrevolution();
    });
  }

  addStarterCandy(species: PokemonSpecies, count: integer): void {
    this.scene.candyBar.showStarterSpeciesCandy(species.speciesId, count);
    this.starterData[species.speciesId].candyCount += count;
  }

  setEggMoveUnlocked(species: PokemonSpecies, eggMoveIndex: integer): Promise<boolean> {
    return new Promise<boolean>(resolve => {
      const speciesId = species.speciesId;
      if (!speciesEggMoves.hasOwnProperty(speciesId) || !speciesEggMoves[speciesId][eggMoveIndex]) {
        resolve(false);
        return;
      }

      if (!this.starterData[speciesId].eggMoves)
        this.starterData[speciesId].eggMoves = 0;

      const value = Math.pow(2, eggMoveIndex);

      if (this.starterData[speciesId].eggMoves & value) {
        resolve(false);
        return;
      }

      this.starterData[speciesId].eggMoves |= value;

      this.scene.playSound('level_up_fanfare');
      this.scene.ui.showText(`${eggMoveIndex === 3 ? 'Rare ' : ''}Egg Move unlocked: ${allMoves[speciesEggMoves[speciesId][eggMoveIndex]].name}`, null, () => resolve(true), null, true);
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

  getSpeciesCount(dexEntryPredicate: (entry: DexEntry) => boolean): integer {
    const dexKeys = Object.keys(this.dexData);
    let speciesCount = 0;
    for (let s of dexKeys) {
      if (dexEntryPredicate(this.dexData[s]))
        speciesCount++;
    }
    return speciesCount;
  }

  getStarterCount(dexEntryPredicate: (entry: DexEntry) => boolean): integer {
    const starterKeys = Object.keys(speciesStarters);
    let starterCount = 0;
    for (let s of starterKeys) {
      const starterDexEntry = this.dexData[s];
      if (dexEntryPredicate(starterDexEntry))
        starterCount++;
    }
    return starterCount;
  }

  getSpeciesDefaultDexAttr(species: PokemonSpecies, forSeen: boolean = false, optimistic: boolean = false): bigint {
    let ret = 0n;
    const dexEntry = this.dexData[species.speciesId];
    const attr = dexEntry.caughtAttr;
    ret |= optimistic
      ? attr & DexAttr.SHINY ? DexAttr.SHINY : DexAttr.NON_SHINY
      : attr & DexAttr.NON_SHINY || !(attr & DexAttr.SHINY) ? DexAttr.NON_SHINY : DexAttr.SHINY;
    ret |= attr & DexAttr.MALE || !(attr & DexAttr.FEMALE) ? DexAttr.MALE : DexAttr.FEMALE;
    ret |= optimistic
      ? attr & DexAttr.SHINY ? attr & DexAttr.VARIANT_3 ? DexAttr.VARIANT_3 : attr & DexAttr.VARIANT_2 ? DexAttr.VARIANT_2 : DexAttr.DEFAULT_VARIANT : DexAttr.DEFAULT_VARIANT
      : attr & DexAttr.DEFAULT_VARIANT ? DexAttr.DEFAULT_VARIANT : attr & DexAttr.VARIANT_2 ? DexAttr.VARIANT_2 : attr & DexAttr.VARIANT_3 ? DexAttr.VARIANT_3 : DexAttr.DEFAULT_VARIANT;
    ret |= this.getFormAttr(this.getFormIndex(attr));
    return ret;
  }

  getSpeciesDexAttrProps(species: PokemonSpecies, dexAttr: bigint): DexAttrProps {
    const shiny = !(dexAttr & DexAttr.NON_SHINY);
    const female = !(dexAttr & DexAttr.MALE);
    const variant = dexAttr & DexAttr.DEFAULT_VARIANT ? 0 : dexAttr & DexAttr.VARIANT_2 ? 1 : dexAttr & DexAttr.VARIANT_3 ? 2 : 0;
    const formIndex = this.getFormIndex(dexAttr);

    return {
      shiny,
      female,
      variant,
      formIndex
    };
  }

  getStarterSpeciesDefaultAbilityIndex(species: PokemonSpecies): integer {
    const abilityAttr = this.starterData[species.speciesId].abilityAttr;
    return abilityAttr & AbilityAttr.ABILITY_1 ? 0 : !species.ability2 || abilityAttr & AbilityAttr.ABILITY_2 ? 1 : 2;
  }

  getSpeciesDefaultNature(species: PokemonSpecies): Nature {
    const dexEntry = this.dexData[species.speciesId];
    for (let n = 0; n < 25; n++) {
      if (dexEntry.natureAttr & Math.pow(2, n + 1))
        return n as Nature;
    }
    return 0 as Nature;
  }

  getSpeciesDefaultNatureAttr(species: PokemonSpecies): integer {
    return Math.pow(2, this.getSpeciesDefaultNature(species));
  }

  getDexAttrLuck(dexAttr: bigint): integer {
    return dexAttr & DexAttr.SHINY ? dexAttr & DexAttr.VARIANT_3 ? 3 : dexAttr & DexAttr.VARIANT_2 ? 2 : 1 : 0;
  }

  getNaturesForAttr(natureAttr: integer): Nature[] {
    let ret: Nature[] = [];
    for (let n = 0; n < 25; n++) {
      if (natureAttr & Math.pow(2, n + 1))
        ret.push(n);
    }
    return ret;
  }

  getSpeciesStarterValue(speciesId: Species): number {
    const baseValue = speciesStarters[speciesId];
    let value = baseValue;

    const decrementValue = (value: number) => {
      if (value > 1)
        value--;
      else
        value /= 2;
      return value;
    }

    for (let v = 0; v < this.starterData[speciesId].valueReduction; v++)
      value = decrementValue(value);

    return value;
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
  
  consolidateDexData(dexData: DexData): void {
    for (let k of Object.keys(dexData)) {
      const entry = dexData[k] as DexEntry;
      if (!entry.hasOwnProperty('hatchedCount'))
        entry.hatchedCount = 0;
      if (!entry.hasOwnProperty('natureAttr') || (entry.caughtAttr && !entry.natureAttr))
        entry.natureAttr = this.defaultDexData[k].natureAttr || Math.pow(2, Utils.randInt(25, 1));
    }
  }

  migrateStarterAbilities(systemData: SystemSaveData, initialStarterData?: StarterData): void {
    const starterIds = Object.keys(this.starterData).map(s => parseInt(s) as Species);
    const starterData = initialStarterData || systemData.starterData;
    const dexData = systemData.dexData;
    for (let s of starterIds) {
      const dexAttr = dexData[s].caughtAttr;
      starterData[s].abilityAttr = (dexAttr & DexAttr.DEFAULT_VARIANT ? AbilityAttr.ABILITY_1 : 0)
        | (dexAttr & DexAttr.VARIANT_2 ? AbilityAttr.ABILITY_2 : 0)
        | (dexAttr & DexAttr.VARIANT_3 ? AbilityAttr.ABILITY_HIDDEN : 0);
      if (dexAttr) {
        if (!(dexAttr & DexAttr.DEFAULT_VARIANT))
          dexData[s].caughtAttr ^= DexAttr.DEFAULT_VARIANT;
        if (dexAttr & DexAttr.VARIANT_2)
          dexData[s].caughtAttr ^= DexAttr.VARIANT_2;
        if (dexAttr & DexAttr.VARIANT_3)
          dexData[s].caughtAttr ^= DexAttr.VARIANT_3;
      }
    }
  }

  fixVariantData(systemData: SystemSaveData): void {
    const starterIds = Object.keys(this.starterData).map(s => parseInt(s) as Species);
    const starterData = systemData.starterData;
    const dexData = systemData.dexData;
    if (starterIds.find(id => (dexData[id].caughtAttr & DexAttr.VARIANT_2 || dexData[id].caughtAttr & DexAttr.VARIANT_3) && !variantData[id])) {
      for (let s of starterIds) {
        const species = getPokemonSpecies(s);
        if (variantData[s]) {
          const tempCaughtAttr = dexData[s].caughtAttr;
          let seenVariant2 = false;
          let seenVariant3 = false;
          let checkEvoSpecies = (es: Species) => {
            seenVariant2 ||= !!(dexData[es].seenAttr & DexAttr.VARIANT_2);
            seenVariant3 ||= !!(dexData[es].seenAttr & DexAttr.VARIANT_3);
            if (pokemonEvolutions.hasOwnProperty(es)) {
              for (let pe of pokemonEvolutions[es])
                checkEvoSpecies(pe.speciesId);
            }
          };
          checkEvoSpecies(s);
          if (dexData[s].caughtAttr & DexAttr.VARIANT_2 && !seenVariant2)
            dexData[s].caughtAttr ^= DexAttr.VARIANT_2;
          if (dexData[s].caughtAttr & DexAttr.VARIANT_3 && !seenVariant3)
            dexData[s].caughtAttr ^= DexAttr.VARIANT_3;
          starterData[s].abilityAttr = (tempCaughtAttr & DexAttr.DEFAULT_VARIANT ? AbilityAttr.ABILITY_1 : 0)
            | (tempCaughtAttr & DexAttr.VARIANT_2 && species.ability2 ? AbilityAttr.ABILITY_2 : 0)
            | (tempCaughtAttr & DexAttr.VARIANT_3 && species.abilityHidden ? AbilityAttr.ABILITY_HIDDEN : 0);
        } else {
          const tempCaughtAttr = dexData[s].caughtAttr;
          if (dexData[s].caughtAttr & DexAttr.VARIANT_2)
            dexData[s].caughtAttr ^= DexAttr.VARIANT_2;
          if (dexData[s].caughtAttr & DexAttr.VARIANT_3)
            dexData[s].caughtAttr ^= DexAttr.VARIANT_3;
          starterData[s].abilityAttr = (tempCaughtAttr & DexAttr.DEFAULT_VARIANT ? AbilityAttr.ABILITY_1 : 0)
            | (tempCaughtAttr & DexAttr.VARIANT_2 && species.ability2 ? AbilityAttr.ABILITY_2 : 0)
            | (tempCaughtAttr & DexAttr.VARIANT_3 && species.abilityHidden ? AbilityAttr.ABILITY_HIDDEN : 0);
        }
      }
    }
  }
  
  fixStarterData(systemData: SystemSaveData): void {
    for (let starterId of defaultStarterSpecies)
      systemData.starterData[starterId].abilityAttr |= AbilityAttr.ABILITY_1;
  }
}