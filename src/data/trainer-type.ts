import BattleScene from "../battle-scene";
import * as Utils from "../utils";

export enum TrainerType {
  ACE_TRAINER = 1,
  ARTIST,
  BACKERS,
  BACKPACKER,
  BAKER,
  BATTLE_GIRL,
  BEAUTY,
  BIKER,
  BLACKBELT,
  BREEDER,
  CLERK,
  CYCLIST,
  DANCER,
  DEPOT_AGENT,
  DOCTOR,
  FISHERMAN,
  GENTLEMAN,
  GUITARIST,
  HARLEQUIN,
  HIKER,
  HOOLIGANS,
  HOOPSTER,
  INFIELDER,
  JANITOR,
  LADY,
  LASS,
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
  RICH_BOY,
  ROUGHNECK,
  SCIENTIST,
  SMASHER,
  SNOW_WORKER,
  SOCIALITE,
  STRIKER,
  STUDENT,
  SWIMMER,
  TWINS,
  VETERAN,
  WAITER,
  WORKER,
  YOUNGSTER,
  CYNTHIA
}

export class TrainerConfig {
  public trainerType: TrainerType;
  public hasGenders: boolean = false;
  public isDouble: boolean = false;

  constructor(trainerType: TrainerType) {
    this.trainerType = trainerType;
  }

  public getKey(female?: boolean): string {
    let ret = TrainerType[this.trainerType].toString().toLowerCase();
    if (this.hasGenders)
      ret += `_${female ? 'f' : 'm'}`;
    return ret;
  }

  public setHasGenders(): TrainerConfig {
    this.hasGenders = true;
    return this;
  }

  public setDouble(): TrainerConfig {
    this.isDouble = true;
    return this;
  }

  public getName(): string {
    return Utils.toPokemonUpperCase(TrainerType[this.trainerType].toString().replace(/\_/g, ' '));
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

export const trainerConfigs: TrainerConfigs  = {
  [TrainerType.ACE_TRAINER]: new TrainerConfig(++t).setHasGenders(),
  [TrainerType.ARTIST]: new TrainerConfig(++t),
  [TrainerType.BACKERS]: new TrainerConfig(++t).setHasGenders().setDouble(),
  [TrainerType.BACKPACKER]: new TrainerConfig(++t).setHasGenders(),
  [TrainerType.BAKER]: new TrainerConfig(++t),
  [TrainerType.BATTLE_GIRL]: new TrainerConfig(++t),
  [TrainerType.BEAUTY]: new TrainerConfig(++t),
  [TrainerType.BIKER]: new TrainerConfig(++t),
  [TrainerType.BLACKBELT]: new TrainerConfig(++t),
  [TrainerType.BREEDER]: new TrainerConfig(++t).setHasGenders().setDouble(),
  [TrainerType.CLERK]: new TrainerConfig(++t).setHasGenders(),
  [TrainerType.CYCLIST]: new TrainerConfig(++t).setHasGenders(),
  [TrainerType.DANCER]: new TrainerConfig(++t),
  [TrainerType.DEPOT_AGENT]: new TrainerConfig(++t),
  [TrainerType.DOCTOR]: new TrainerConfig(++t),
  [TrainerType.FISHERMAN]: new TrainerConfig(++t),
  [TrainerType.GENTLEMAN]: new TrainerConfig(++t),
  [TrainerType.GUITARIST]: new TrainerConfig(++t),
  [TrainerType.HARLEQUIN]: new TrainerConfig(++t),
  [TrainerType.HIKER]: new TrainerConfig(++t),
  [TrainerType.HOOLIGANS]: new TrainerConfig(++t).setDouble(),
  [TrainerType.HOOPSTER]: new TrainerConfig(++t),
  [TrainerType.INFIELDER]: new TrainerConfig(++t),
  [TrainerType.JANITOR]: new TrainerConfig(++t),
  [TrainerType.LADY]: new TrainerConfig(++t),
  [TrainerType.LASS]: new TrainerConfig(++t),
  [TrainerType.LINEBACKER]: new TrainerConfig(++t),
  [TrainerType.MAID]: new TrainerConfig(++t),
  [TrainerType.MUSICIAN]: new TrainerConfig(++t),
  [TrainerType.NURSE]: new TrainerConfig(++t),
  [TrainerType.NURSERY_AIDE]: new TrainerConfig(++t),
  [TrainerType.OFFICER]: new TrainerConfig(++t),
  [TrainerType.PARASOL_LADY]: new TrainerConfig(++t),
  [TrainerType.PILOT]: new TrainerConfig(++t),
  [TrainerType.POKEFAN]: new TrainerConfig(++t).setHasGenders(),
  [TrainerType.PRESCHOOLER]: new TrainerConfig(++t).setHasGenders(),
  [TrainerType.PSYCHIC]: new TrainerConfig(++t).setHasGenders(),
  [TrainerType.RANGER]: new TrainerConfig(++t).setHasGenders(),
  [TrainerType.RICH_BOY]: new TrainerConfig(++t),
  [TrainerType.ROUGHNECK]: new TrainerConfig(++t),
  [TrainerType.SCIENTIST]: new TrainerConfig(++t).setHasGenders(),
  [TrainerType.SMASHER]: new TrainerConfig(++t),
  [TrainerType.SNOW_WORKER]: new TrainerConfig(++t),
  [TrainerType.SOCIALITE]: new TrainerConfig(++t),
  [TrainerType.STRIKER]: new TrainerConfig(++t),
  [TrainerType.STUDENT]: new TrainerConfig(++t).setHasGenders(),
  [TrainerType.SWIMMER]: new TrainerConfig(++t).setHasGenders(),
  [TrainerType.TWINS]: new TrainerConfig(++t).setDouble(),
  [TrainerType.VETERAN]: new TrainerConfig(++t).setHasGenders(),
  [TrainerType.WAITER]: new TrainerConfig(++t).setHasGenders(),
  [TrainerType.WORKER]: new TrainerConfig(++t),
  [TrainerType.YOUNGSTER]: new TrainerConfig(++t),
  [TrainerType.CYNTHIA]: new TrainerConfig(++t),
}