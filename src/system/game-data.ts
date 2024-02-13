import BattleScene, { PokeballCounts, bypassLogin } from "../battle-scene";
import Pokemon, { EnemyPokemon, PlayerPokemon } from "../pokemon";
import { pokemonPrevolutions } from "../data/pokemon-evolutions";
import PokemonSpecies, { allSpecies, getPokemonSpecies, speciesStarters } from "../data/pokemon-species";
import { Species } from "../data/enums/species";
import * as Utils from "../utils";
import PokemonData from "./pokemon-data";
import PersistentModifierData from "./modifier-data";
import ArenaData from "./arena-data";
import { Unlockables } from "./unlockables";
import { GameMode } from "../game-mode";
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

export function getDataTypeKey(dataType: GameDataType): string {
  switch (dataType) {
    case GameDataType.SYSTEM:
      return 'data';
    case GameDataType.SESSION:
      return 'sessionData';
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
  gameStats: GameStats;
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
  playTime: integer;
  gameMode: GameMode;
  party: PokemonData[];
  enemyParty: PokemonData[];
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

export interface TutorialFlags {
  [key: string]: boolean
}

const systemShortKeys = {
  seenAttr: '$sa',
  caughtAttr: '$ca',
  natureAttr: '$na',
  seenCount: '$s' ,
  caughtCount: '$c',
  ivs: '$i'
};

export class GameData {
  private scene: BattleScene;

  public trainerId: integer;
  public secretId: integer;

  public gender: PlayerGender;
  
  public dexData: DexData;
  private defaultDexData: DexData;

  public gameStats: GameStats;

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
    this.loadSystem();
  }

  public saveSystem(): Promise<boolean> {
    return new Promise<boolean>(resolve => {
      if (this.scene.quickStart)
        return resolve(true);

      updateUserInfo().then((success: boolean) => {
        if (!success)
          return resolve(false);
        const data: SystemSaveData = {
          trainerId: this.trainerId,
          secretId: this.secretId,
          gender: this.gender,
          dexData: this.dexData,
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
          Utils.apiPost(`savedata/update?datatype=${GameDataType.SYSTEM}`, systemData)
            .then(response => response.text())
            .then(error => {
              if (error) {
                console.error(error);
                return resolve(false);
              }
              resolve(true);
            });
        } else {
          localStorage.setItem('data_bak', localStorage.getItem('data'));

          localStorage.setItem('data', btoa(systemData));

          resolve(true);
        }
      });
    });
  }

  public loadSystem(): Promise<boolean> {
    return new Promise<boolean>(resolve => {
      if (bypassLogin && !localStorage.hasOwnProperty('data'))
        return false;

      const handleSystemData = (systemDataStr: string) => {
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

        resolve(true);
      }

      if (!bypassLogin) {
        Utils.apiFetch(`savedata/get?datatype=${GameDataType.SYSTEM}`)
          .then(response => response.text())
          .then(response => {
            if (!response.length || response[0] !== '{') {
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

      return k.endsWith('Attr') && k !== 'natureAttr' ? BigInt(v) : v;
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

  saveSession(scene: BattleScene, skipVerification?: boolean): Promise<boolean> {
    return new Promise<boolean>(resolve => {
      Utils.executeIf(!skipVerification, updateUserInfo).then(success => {
        if (success !== null && !success)
          return resolve(false);

        const sessionData = {
          seed: scene.seed,
          playTime: scene.sessionPlayTime,
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

        if (!bypassLogin) {
          Utils.apiPost(`savedata/update?datatype=${GameDataType.SESSION}`, JSON.stringify(sessionData))
            .then(response => response.text())
            .then(error => {
              if (error) {
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

  loadSession(scene: BattleScene): Promise<boolean> {
    return new Promise(async (resolve, reject) => {
      const handleSessionData = async (sessionDataStr: string) => {
        try {
          const sessionData = this.parseSessionData(sessionDataStr);

          console.debug(sessionData);

          scene.seed = sessionData.seed || scene.game.config.seed[0];
          scene.resetSeed();

          scene.sessionPlayTime = sessionData.playTime || 0;

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

          if (scene.money > this.gameStats.highestMoney)
            this.gameStats.highestMoney = scene.money;

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
      };

      if (!bypassLogin) {
        Utils.apiFetch(`savedata/get?datatype=${GameDataType.SESSION}`)
          .then(response => response.text())
          .then(async response => {
            if (!response.length || response[0] !== '{') {
              console.error(response);
              return resolve(false);
            }

            await handleSessionData(response);
          });
      } else
        await handleSessionData(atob(localStorage.getItem('sessionData')));
    });
  }

  clearSession(): Promise<boolean> {
    return new Promise<boolean>(resolve => {
      if (bypassLogin) {
        localStorage.removeItem('sessionData');
        return resolve(true);
      }

      updateUserInfo().then(success => {
        if (success !== null && !success)
          return resolve(false);
        Utils.apiFetch(`savedata/delete?datatype=${GameDataType.SESSION}`).then(response => {
          if (response.ok) {
            loggedInUser.hasGameSession = false;
            return resolve(true);
          }
          resolve(false);
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

  public exportData(dataType: GameDataType): void {
    const dataKey: string = getDataTypeKey(dataType);
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
      Utils.apiFetch(`savedata/get?datatype=${dataType}`)
        .then(response => response.text())
        .then(response => {
          if (!response.length || response[0] !== '{') {
            console.error(response);
            return;
          }

          handleData(response);
        });
    } else
      handleData(atob(localStorage.getItem(dataKey)));
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
                      Utils.apiPost(`savedata/update?datatype=${dataType}`, dataStr)
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

    const defaultStarterNatures: Nature[] = [];

    this.scene.executeWithSeedOffset(() => {
      const neutralNatures = [ Nature.HARDY, Nature.DOCILE, Nature.SERIOUS, Nature.BASHFUL, Nature.QUIRKY ];
      for (let s = 0; s < defaultStarters.length; s++)
        defaultStarterNatures.push(Phaser.Math.RND.pick(neutralNatures));
    }, 0, 'default');

    for (let ds = 0; ds < defaultStarters.length; ds++) {
      let entry = data[defaultStarters[ds]] as DexEntry;
      entry.seenAttr = defaultStarterAttr;
      entry.caughtAttr = defaultStarterAttr;
      entry.natureAttr = Math.pow(2, defaultStarterNatures[ds] + 1);
      for (let i in entry.ivs)
        entry.ivs[i] = 10;
    }

    this.defaultDexData = Object.assign({}, data);
    this.dexData = data;
  }

  setPokemonSeen(pokemon: Pokemon, incrementCount: boolean = true): void {
    const dexEntry = this.dexData[pokemon.species.speciesId];
    dexEntry.seenAttr |= pokemon.getDexAttr();
    if (incrementCount) {
      dexEntry.seenCount++;
      this.gameStats.pokemonSeen++;
      if (pokemon.isShiny())
        this.gameStats.shinyPokemonSeen++;
    }
  }

  setPokemonCaught(pokemon: Pokemon, incrementCount: boolean = true, fromEgg: boolean = false): Promise<void> {
    return this.setPokemonSpeciesCaught(pokemon, pokemon.species, incrementCount, fromEgg);
  }

  setPokemonSpeciesCaught(pokemon: Pokemon, species: PokemonSpecies, incrementCount: boolean = true, fromEgg: boolean = false): Promise<void> {
    return new Promise<void>((resolve) => {
      const dexEntry = this.dexData[species.speciesId];
      const caughtAttr = dexEntry.caughtAttr;
      dexEntry.caughtAttr |= pokemon.getDexAttr();
      dexEntry.natureAttr |= Math.pow(2, pokemon.nature + 1);
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
      }

      const hasPrevolution = pokemonPrevolutions.hasOwnProperty(species.speciesId);
      const newCatch = !caughtAttr;

      const checkPrevolution = () => {
        if (hasPrevolution) {
          const prevolutionSpecies = pokemonPrevolutions[species.speciesId];
          return this.setPokemonSpeciesCaught(pokemon, getPokemonSpecies(prevolutionSpecies), incrementCount, fromEgg).then(() => resolve());
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
    const caughtHatchedCount = this.dexData[speciesId].caughtCount + this.dexData[speciesId].hatchedCount;

    const decrementValue = (value: number) => {
      if (value > 1)
        value--;
      else
        value /= 2;
      return value;
    }

    let thresholdA: integer;
    let thresholdB: integer;

    if (baseValue >= 8)
      [ thresholdA, thresholdB ] = [ 3, 10 ];
    else if (baseValue >= 6)
      [ thresholdA, thresholdB ] = [ 5, 20 ];
    else if (baseValue >= 4)
      [ thresholdA, thresholdB ] = [ 10, 30 ];
    else
      [ thresholdA, thresholdB ] = [ 25, 100 ];

    if (caughtHatchedCount >= thresholdA) {
      value = decrementValue(value);
      if (caughtHatchedCount >= thresholdB)
        value = decrementValue(value);
    }

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
}