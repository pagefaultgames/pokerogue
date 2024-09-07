import BattleScene from "./battle-scene";
import { EnemyPokemon, PlayerPokemon, QueuedMove } from "./field/pokemon";
import { Command } from "./ui/command-ui-handler";
import * as Utils from "./utils";
import Trainer, { TrainerVariant } from "./field/trainer";
import { GameMode } from "./game-mode";
import { MoneyMultiplierModifier, PokemonHeldItemModifier } from "./modifier/modifier";
import { PokeballType } from "./data/pokeball";
import { trainerConfigs } from "#app/data/trainer-config";
import { ArenaTagType } from "#enums/arena-tag-type";
import { BattleSpec } from "#enums/battle-spec";
import { Moves } from "#enums/moves";
import { PlayerGender } from "#enums/player-gender";
import { Species } from "#enums/species";
import { TrainerType } from "#enums/trainer-type";
import i18next from "#app/plugins/i18n";

export enum BattleType {
    WILD,
    TRAINER,
    CLEAR
}

export enum BattlerIndex {
    ATTACKER = -1,
    PLAYER,
    PLAYER_2,
    ENEMY,
    ENEMY_2
}

export interface TurnCommand {
    command: Command;
    cursor?: number;
    move?: QueuedMove;
    targets?: BattlerIndex[];
    skip?: boolean;
    args?: any[];
}

interface TurnCommands {
    [key: number]: TurnCommand | null
}

export default class Battle {
  protected gameMode: GameMode;
  public waveIndex: number;
  public battleType: BattleType;
  public battleSpec: BattleSpec;
  public trainer: Trainer | null;
  public enemyLevels: number[] | undefined;
  public enemyParty: EnemyPokemon[] = [];
  public seenEnemyPartyMemberIds: Set<number> = new Set<number>();
  public double: boolean;
  public started: boolean = false;
  public enemySwitchCounter: number = 0;
  public turn: number = 0;
  public turnCommands: TurnCommands;
  public playerParticipantIds: Set<number> = new Set<number>();
  public battleScore: number = 0;
  public postBattleLoot: PokemonHeldItemModifier[] = [];
  public escapeAttempts: number = 0;
  public lastMove: Moves;
  public battleSeed: string = Utils.randomString(16, true);
  private battleSeedState: string | null = null;
  public moneyScattered: number = 0;
  public lastUsedPokeball: PokeballType | null = null;
  /** The number of times a Pokemon on the player's side has fainted this battle */
  public playerFaints: number = 0;
  /** The number of times a Pokemon on the enemy's side has fainted this battle */
  public enemyFaints: number = 0;

  private rngCounter: number = 0;

  constructor(gameMode: GameMode, waveIndex: number, battleType: BattleType, trainer?: Trainer, double?: boolean) {
    this.gameMode = gameMode;
    this.waveIndex = waveIndex;
    this.battleType = battleType;
    this.trainer = trainer ?? null;
    this.initBattleSpec();
    this.enemyLevels = battleType !== BattleType.TRAINER
      ? new Array(double ? 2 : 1).fill(null).map(() => this.getLevelForWave())
      : trainer?.getPartyLevels(this.waveIndex);
    this.double = double ?? false;
  }

  private initBattleSpec(): void {
    let spec = BattleSpec.DEFAULT;
    if (this.gameMode.isWaveFinal(this.waveIndex) && this.gameMode.isClassic) {
      spec = BattleSpec.FINAL_BOSS;
    }
    this.battleSpec = spec;
  }

  private getLevelForWave(): number {
    const levelWaveIndex = this.gameMode.getWaveForDifficulty(this.waveIndex);
    const baseLevel = 1 + levelWaveIndex / 2 + Math.pow(levelWaveIndex / 25, 2);
    const bossMultiplier = 1.2;

    if (this.gameMode.isBoss(this.waveIndex)) {
      const ret = Math.floor(baseLevel * bossMultiplier);
      if (this.battleSpec === BattleSpec.FINAL_BOSS || !(this.waveIndex % 250)) {
        return Math.ceil(ret / 25) * 25;
      }
      let levelOffset = 0;
      if (!this.gameMode.isWaveFinal(this.waveIndex)) {
        levelOffset = Math.round(Phaser.Math.RND.realInRange(-1, 1) * Math.floor(levelWaveIndex / 10));
      }
      return ret + levelOffset;
    }

    let levelOffset = 0;

    const deviation = 10 / levelWaveIndex;
    levelOffset = Math.abs(this.randSeedGaussForLevel(deviation));

    return Math.max(Math.round(baseLevel + levelOffset), 1);
  }

  randSeedGaussForLevel(value: number): number {
    let rand = 0;
    for (let i = value; i > 0; i--) {
      rand += Phaser.Math.RND.realInRange(0, 1);
    }
    return rand / value;
  }

  getBattlerCount(): number {
    return this.double ? 2 : 1;
  }

  incrementTurn(scene: BattleScene): void {
    this.turn++;
    this.turnCommands = Object.fromEntries(Utils.getEnumValues(BattlerIndex).map(bt => [ bt, null ]));
    this.battleSeedState = null;
  }

  addParticipant(playerPokemon: PlayerPokemon): void {
    this.playerParticipantIds.add(playerPokemon.id);
  }

  removeFaintedParticipant(playerPokemon: PlayerPokemon): void {
    this.playerParticipantIds.delete(playerPokemon.id);
  }

  addPostBattleLoot(enemyPokemon: EnemyPokemon): void {
    this.postBattleLoot.push(...enemyPokemon.scene.findModifiers(m => m instanceof PokemonHeldItemModifier && m.pokemonId === enemyPokemon.id && m.isTransferrable, false).map(i => {
      const ret = i as PokemonHeldItemModifier;
      //@ts-ignore - this is awful to fix/change
      ret.pokemonId = null;
      return ret;
    }));
  }

  pickUpScatteredMoney(scene: BattleScene): void {
    const moneyAmount = new Utils.IntegerHolder(scene.currentBattle.moneyScattered);
    scene.applyModifiers(MoneyMultiplierModifier, true, moneyAmount);

    if (scene.arena.getTag(ArenaTagType.HAPPY_HOUR)) {
      moneyAmount.value *= 2;
    }

    scene.addMoney(moneyAmount.value);

    const userLocale = navigator.language || "en-US";
    const formattedMoneyAmount = moneyAmount.value.toLocaleString(userLocale);
    const message = i18next.t("battle:moneyPickedUp", { moneyAmount: formattedMoneyAmount });
    scene.queueMessage(message, undefined, true);

    scene.currentBattle.moneyScattered = 0;
  }

  addBattleScore(scene: BattleScene): void {
    let partyMemberTurnMultiplier = scene.getEnemyParty().length / 2 + 0.5;
    if (this.double) {
      partyMemberTurnMultiplier /= 1.5;
    }
    for (const p of scene.getEnemyParty()) {
      if (p.isBoss()) {
        partyMemberTurnMultiplier *= (p.bossSegments / 1.5) / scene.getEnemyParty().length;
      }
    }
    const turnMultiplier = Phaser.Tweens.Builders.GetEaseFunction("Sine.easeIn")(1 - Math.min(this.turn - 2, 10 * partyMemberTurnMultiplier) / (10 * partyMemberTurnMultiplier));
    const finalBattleScore = Math.ceil(this.battleScore * turnMultiplier);
    scene.score += finalBattleScore;
    console.log(`Battle Score: ${finalBattleScore} (${this.turn - 1} Turns x${Math.floor(turnMultiplier * 100) / 100})`);
    console.log(`Total Score: ${scene.score}`);
    scene.updateScoreText();
  }

  getBgmOverride(scene: BattleScene): string | null {
    const battlers = this.enemyParty.slice(0, this.getBattlerCount());
    if (this.battleType === BattleType.TRAINER) {
      if (!this.started && this.trainer?.config.encounterBgm && this.trainer?.getEncounterMessages()?.length) {
        return `encounter_${this.trainer?.getEncounterBgm()}`;
      }
      if (scene.musicPreference === 0) {
        return this.trainer?.getBattleBgm() ?? null;
      } else {
        return this.trainer?.getMixedBattleBgm() ?? null;
      }
    } else if (this.gameMode.isClassic && this.waveIndex > 195 && this.battleSpec !== BattleSpec.FINAL_BOSS) {
      return "end_summit";
    }
    for (const pokemon of battlers) {
      if (this.battleSpec === BattleSpec.FINAL_BOSS) {
        if (pokemon.formIndex) {
          return "battle_final";
        }
        return "battle_final_encounter";
      }
      if (pokemon.species.legendary || pokemon.species.subLegendary || pokemon.species.mythical) {
        if (scene.musicPreference === 0) {
          if (pokemon.species.speciesId === Species.REGIROCK || pokemon.species.speciesId === Species.REGICE || pokemon.species.speciesId === Species.REGISTEEL || pokemon.species.speciesId === Species.REGIGIGAS || pokemon.species.speciesId === Species.REGIELEKI || pokemon.species.speciesId === Species.REGIDRAGO) {
            return "battle_legendary_regis_g5";
          }
          if (pokemon.species.speciesId === Species.COBALION || pokemon.species.speciesId === Species.TERRAKION || pokemon.species.speciesId === Species.VIRIZION || pokemon.species.speciesId === Species.TORNADUS || pokemon.species.speciesId === Species.THUNDURUS || pokemon.species.speciesId === Species.LANDORUS || pokemon.species.speciesId === Species.KELDEO || pokemon.species.speciesId === Species.MELOETTA || pokemon.species.speciesId === Species.GENESECT) {
            return "battle_legendary_unova";
          }
          if (pokemon.species.speciesId === Species.KYUREM) {
            return "battle_legendary_kyurem";
          }
          if (pokemon.species.legendary) {
            return "battle_legendary_res_zek";
          }
          return "battle_legendary_unova";
        } else {
          if (pokemon.species.speciesId === Species.ARTICUNO || pokemon.species.speciesId === Species.ZAPDOS || pokemon.species.speciesId === Species.MOLTRES || pokemon.species.speciesId === Species.MEWTWO || pokemon.species.speciesId === Species.MEW) {
            return "battle_legendary_kanto";
          }
          if (pokemon.species.speciesId === Species.RAIKOU) {
            return "battle_legendary_raikou";
          }
          if (pokemon.species.speciesId === Species.ENTEI) {
            return "battle_legendary_entei";
          }
          if (pokemon.species.speciesId === Species.SUICUNE) {
            return "battle_legendary_suicune";
          }
          if (pokemon.species.speciesId === Species.LUGIA) {
            return "battle_legendary_lugia";
          }
          if (pokemon.species.speciesId === Species.HO_OH) {
            return "battle_legendary_ho_oh";
          }
          if (pokemon.species.speciesId === Species.REGIROCK || pokemon.species.speciesId === Species.REGICE || pokemon.species.speciesId === Species.REGISTEEL || pokemon.species.speciesId === Species.REGIGIGAS || pokemon.species.speciesId === Species.REGIELEKI || pokemon.species.speciesId === Species.REGIDRAGO) {
            return "battle_legendary_regis_g6";
          }
          if (pokemon.species.speciesId === Species.GROUDON || pokemon.species.speciesId === Species.KYOGRE) {
            return "battle_legendary_gro_kyo";
          }
          if (pokemon.species.speciesId === Species.RAYQUAZA) {
            return "battle_legendary_rayquaza";
          }
          if (pokemon.species.speciesId === Species.DEOXYS) {
            return "battle_legendary_deoxys";
          }
          if (pokemon.species.speciesId === Species.UXIE || pokemon.species.speciesId === Species.MESPRIT || pokemon.species.speciesId === Species.AZELF) {
            return "battle_legendary_lake_trio";
          }
          if (pokemon.species.speciesId === Species.HEATRAN || pokemon.species.speciesId === Species.CRESSELIA || pokemon.species.speciesId === Species.DARKRAI || pokemon.species.speciesId === Species.SHAYMIN) {
            return "battle_legendary_sinnoh";
          }
          if (pokemon.species.speciesId === Species.DIALGA || pokemon.species.speciesId === Species.PALKIA) {
            if (pokemon.getFormKey() === "") {
              return "battle_legendary_dia_pal";
            }
            if (pokemon.getFormKey() === "origin") {
              return "battle_legendary_origin_forme";
            }
          }
          if (pokemon.species.speciesId === Species.GIRATINA) {
            return "battle_legendary_giratina";
          }
          if (pokemon.species.speciesId === Species.ARCEUS) {
            return "battle_legendary_arceus";
          }
          if (pokemon.species.speciesId === Species.COBALION || pokemon.species.speciesId === Species.TERRAKION || pokemon.species.speciesId === Species.VIRIZION || pokemon.species.speciesId === Species.TORNADUS || pokemon.species.speciesId === Species.THUNDURUS || pokemon.species.speciesId === Species.LANDORUS || pokemon.species.speciesId === Species.KELDEO || pokemon.species.speciesId === Species.MELOETTA || pokemon.species.speciesId === Species.GENESECT) {
            return "battle_legendary_unova";
          }
          if (pokemon.species.speciesId === Species.KYUREM) {
            return "battle_legendary_kyurem";
          }
          if (pokemon.species.speciesId === Species.XERNEAS || pokemon.species.speciesId === Species.YVELTAL || pokemon.species.speciesId === Species.ZYGARDE) {
            return "battle_legendary_xern_yvel";
          }
          if (pokemon.species.speciesId === Species.TAPU_KOKO || pokemon.species.speciesId === Species.TAPU_LELE || pokemon.species.speciesId === Species.TAPU_BULU || pokemon.species.speciesId === Species.TAPU_FINI) {
            return "battle_legendary_tapu";
          }
          if ([ Species.COSMOG, Species.COSMOEM, Species.SOLGALEO, Species.LUNALA ].includes(pokemon.species.speciesId)) {
            return "battle_legendary_sol_lun";
          }
          if (pokemon.species.speciesId === Species.NECROZMA) {
            if (pokemon.getFormKey() === "") {
              return "battle_legendary_sol_lun";
            }
            if (pokemon.getFormKey() === "dusk-mane" || pokemon.getFormKey() === "dawn-wings") {
              return "battle_legendary_dusk_dawn";
            }
            if (pokemon.getFormKey() === "ultra") {
              return "battle_legendary_ultra_nec";
            }
          }
          if ([ Species.NIHILEGO, Species.BUZZWOLE, Species.PHEROMOSA, Species.XURKITREE, Species.CELESTEELA, Species.KARTANA, Species.GUZZLORD, Species.POIPOLE, Species.NAGANADEL, Species.STAKATAKA, Species.BLACEPHALON ].includes(pokemon.species.speciesId)) {
            return "battle_legendary_ub";
          }
          if (pokemon.species.speciesId === Species.ZACIAN || pokemon.species.speciesId === Species.ZAMAZENTA) {
            return "battle_legendary_zac_zam";
          }
          if (pokemon.species.speciesId === Species.GLASTRIER || pokemon.species.speciesId === Species.SPECTRIER) {
            return "battle_legendary_glas_spec";
          }
          if (pokemon.species.speciesId === Species.CALYREX) {
            if (pokemon.getFormKey() === "") {
              return "battle_legendary_calyrex";
            }
            if (pokemon.getFormKey() === "ice" || pokemon.getFormKey() === "shadow") {
              return "battle_legendary_riders";
            }
          }
          if (pokemon.species.speciesId === Species.GALAR_ARTICUNO || pokemon.species.speciesId === Species.GALAR_ZAPDOS || pokemon.species.speciesId === Species.GALAR_MOLTRES) {
            return "battle_legendary_birds_galar";
          }
          if (pokemon.species.speciesId === Species.WO_CHIEN || pokemon.species.speciesId === Species.CHIEN_PAO || pokemon.species.speciesId === Species.TING_LU || pokemon.species.speciesId === Species.CHI_YU) {
            return "battle_legendary_ruinous";
          }
          if (pokemon.species.speciesId === Species.KORAIDON || pokemon.species.speciesId === Species.MIRAIDON) {
            return "battle_legendary_kor_mir";
          }
          if (pokemon.species.speciesId === Species.OKIDOGI || pokemon.species.speciesId === Species.MUNKIDORI || pokemon.species.speciesId === Species.FEZANDIPITI) {
            return "battle_legendary_loyal_three";
          }
          if (pokemon.species.speciesId === Species.OGERPON) {
            return "battle_legendary_ogerpon";
          }
          if (pokemon.species.speciesId === Species.TERAPAGOS) {
            return "battle_legendary_terapagos";
          }
          if (pokemon.species.speciesId === Species.PECHARUNT) {
            return "battle_legendary_pecharunt";
          }
          if (pokemon.species.legendary) {
            return "battle_legendary_res_zek";
          }
          return "battle_legendary_unova";
        }
      }
    }

    if (scene.gameMode.isClassic && this.waveIndex <= 4) {
      return "battle_wild";
    }

    return null;
  }

  /**
   * Generates a random number using the current battle's seed. Calls {@linkcode Utils.randSeedInt}
   * @param range How large of a range of random numbers to choose from. If {@linkcode range} <= 1, returns {@linkcode min}
   * @param min The minimum integer to pick, default `0`
   * @returns A random integer between {@linkcode min} and ({@linkcode min} + {@linkcode range} - 1)
   */
  randSeedInt(scene: BattleScene, range: number, min: number = 0): number {
    if (range <= 1) {
      return min;
    }
    const tempRngCounter = scene.rngCounter;
    const tempSeedOverride = scene.rngSeedOverride;
    const state = Phaser.Math.RND.state();
    if (this.battleSeedState) {
      Phaser.Math.RND.state(this.battleSeedState);
    } else {
      Phaser.Math.RND.sow([ Utils.shiftCharCodes(this.battleSeed, this.turn << 6) ]);
      console.log("Battle Seed:", this.battleSeed);
    }
    scene.rngCounter = this.rngCounter++;
    scene.rngSeedOverride = this.battleSeed;
    const ret = Utils.randSeedInt(range, min);
    this.battleSeedState = Phaser.Math.RND.state();
    Phaser.Math.RND.state(state);
    scene.rngCounter = tempRngCounter;
    scene.rngSeedOverride = tempSeedOverride;
    return ret;
  }
}

export class FixedBattle extends Battle {
  constructor(scene: BattleScene, waveIndex: number, config: FixedBattleConfig) {
    super(scene.gameMode, waveIndex, config.battleType, config.battleType === BattleType.TRAINER ? config.getTrainer(scene) : undefined, config.double);
    if (config.getEnemyParty) {
      this.enemyParty = config.getEnemyParty(scene);
    }
  }
}

type GetTrainerFunc = (scene: BattleScene) => Trainer;
type GetEnemyPartyFunc = (scene: BattleScene) => EnemyPokemon[];

export class FixedBattleConfig {
  public battleType: BattleType;
  public double: boolean;
  public getTrainer: GetTrainerFunc;
  public getEnemyParty: GetEnemyPartyFunc;
  public seedOffsetWaveIndex: number;

  setBattleType(battleType: BattleType): FixedBattleConfig {
    this.battleType = battleType;
    return this;
  }

  setDouble(double: boolean): FixedBattleConfig {
    this.double = double;
    return this;
  }

  setGetTrainerFunc(getTrainerFunc: GetTrainerFunc): FixedBattleConfig {
    this.getTrainer = getTrainerFunc;
    return this;
  }

  setGetEnemyPartyFunc(getEnemyPartyFunc: GetEnemyPartyFunc): FixedBattleConfig {
    this.getEnemyParty = getEnemyPartyFunc;
    return this;
  }

  setSeedOffsetWave(seedOffsetWaveIndex: number): FixedBattleConfig {
    this.seedOffsetWaveIndex = seedOffsetWaveIndex;
    return this;
  }
}


/**
 * Helper function to generate a random trainer for evil team trainers and the elite 4/champion
 * @param trainerPool The TrainerType or list of TrainerTypes that can possibly be generated
 * @param randomGender whether or not to randomly (50%) generate a female trainer (for use with evil team grunts)
 * @param seedOffset the seed offset to use for the random generation of the trainer
 * @returns the generated trainer
 */
function getRandomTrainerFunc(trainerPool: (TrainerType | TrainerType[])[], randomGender: boolean = false, seedOffset: number  = 0): GetTrainerFunc {
  return (scene: BattleScene) => {
    const rand = Utils.randSeedInt(trainerPool.length);
    const trainerTypes: TrainerType[] = [];

    scene.executeWithSeedOffset(() => {
      for (const trainerPoolEntry of trainerPool) {
        const trainerType = Array.isArray(trainerPoolEntry)
          ? Utils.randSeedItem(trainerPoolEntry)
          : trainerPoolEntry;
        trainerTypes.push(trainerType);
      }
    }, seedOffset);

    let trainerGender = TrainerVariant.DEFAULT;
    if (randomGender) {
      trainerGender = (Utils.randInt(2) === 0) ? TrainerVariant.FEMALE : TrainerVariant.DEFAULT;
    }

    /* 1/3 chance for evil team grunts to be double battles */
    const evilTeamGrunts = [TrainerType.ROCKET_GRUNT, TrainerType.MAGMA_GRUNT, TrainerType.AQUA_GRUNT, TrainerType.GALACTIC_GRUNT, TrainerType.PLASMA_GRUNT, TrainerType.FLARE_GRUNT];
    const isEvilTeamGrunt = evilTeamGrunts.includes(trainerTypes[rand]);

    if (trainerConfigs[trainerTypes[rand]].hasDouble && isEvilTeamGrunt) {
      return new Trainer(scene, trainerTypes[rand], (Utils.randInt(3) === 0) ? TrainerVariant.DOUBLE : trainerGender);
    }

    return new Trainer(scene, trainerTypes[rand], trainerGender);
  };
}

export interface FixedBattleConfigs {
    [key: number]: FixedBattleConfig
}
/**
 * Youngster/Lass on 5
 * Rival on 8, 55, 95, 145, 195
 * Evil team grunts on 35, 62, 64, and 112
 * Evil team admin on 66 and 114
 * Evil leader on 115, 165
 * E4 on 182, 184, 186, 188
 * Champion on 190
 */
export const classicFixedBattles: FixedBattleConfigs = {
  [5]: new FixedBattleConfig().setBattleType(BattleType.TRAINER)
    .setGetTrainerFunc(scene => new Trainer(scene, TrainerType.YOUNGSTER, Utils.randSeedInt(2) ? TrainerVariant.FEMALE : TrainerVariant.DEFAULT)),
  [8]: new FixedBattleConfig().setBattleType(BattleType.TRAINER)
    .setGetTrainerFunc(scene => new Trainer(scene, TrainerType.RIVAL, scene.gameData.gender === PlayerGender.MALE ? TrainerVariant.FEMALE : TrainerVariant.DEFAULT)),
  [25]: new FixedBattleConfig().setBattleType(BattleType.TRAINER)
    .setGetTrainerFunc(scene => new Trainer(scene, TrainerType.RIVAL_2, scene.gameData.gender === PlayerGender.MALE ? TrainerVariant.FEMALE : TrainerVariant.DEFAULT)),
  [35]: new FixedBattleConfig().setBattleType(BattleType.TRAINER)
    .setGetTrainerFunc(getRandomTrainerFunc([ TrainerType.ROCKET_GRUNT, TrainerType.MAGMA_GRUNT, TrainerType.AQUA_GRUNT, TrainerType.GALACTIC_GRUNT, TrainerType.PLASMA_GRUNT, TrainerType.FLARE_GRUNT, TrainerType.AETHER_GRUNT, TrainerType.SKULL_GRUNT, TrainerType.MACRO_GRUNT ], true)),
  [55]: new FixedBattleConfig().setBattleType(BattleType.TRAINER)
    .setGetTrainerFunc(scene => new Trainer(scene, TrainerType.RIVAL_3, scene.gameData.gender === PlayerGender.MALE ? TrainerVariant.FEMALE : TrainerVariant.DEFAULT)),
  [62]: new FixedBattleConfig().setBattleType(BattleType.TRAINER).setSeedOffsetWave(35)
    .setGetTrainerFunc(getRandomTrainerFunc([ TrainerType.ROCKET_GRUNT, TrainerType.MAGMA_GRUNT, TrainerType.AQUA_GRUNT, TrainerType.GALACTIC_GRUNT, TrainerType.PLASMA_GRUNT, TrainerType.FLARE_GRUNT, TrainerType.AETHER_GRUNT, TrainerType.SKULL_GRUNT, TrainerType.MACRO_GRUNT ], true)),
  [64]: new FixedBattleConfig().setBattleType(BattleType.TRAINER).setSeedOffsetWave(35)
    .setGetTrainerFunc(getRandomTrainerFunc([ TrainerType.ROCKET_GRUNT, TrainerType.MAGMA_GRUNT, TrainerType.AQUA_GRUNT, TrainerType.GALACTIC_GRUNT, TrainerType.PLASMA_GRUNT, TrainerType.FLARE_GRUNT, TrainerType.AETHER_GRUNT, TrainerType.SKULL_GRUNT, TrainerType.MACRO_GRUNT ], true)),
  [66]: new FixedBattleConfig().setBattleType(BattleType.TRAINER).setSeedOffsetWave(35)
    .setGetTrainerFunc(getRandomTrainerFunc([[ TrainerType.ARCHER, TrainerType.ARIANA, TrainerType.PROTON, TrainerType.PETREL ], [ TrainerType.TABITHA, TrainerType.COURTNEY ], [ TrainerType.MATT, TrainerType.SHELLY ], [ TrainerType.JUPITER, TrainerType.MARS, TrainerType.SATURN ], [ TrainerType.ZINZOLIN, TrainerType.ROOD ], [ TrainerType.XEROSIC, TrainerType.BRYONY ], TrainerType.FABA, TrainerType.PLUMERIA, TrainerType.OLEANA ], true)),
  [95]: new FixedBattleConfig().setBattleType(BattleType.TRAINER)
    .setGetTrainerFunc(scene => new Trainer(scene, TrainerType.RIVAL_4, scene.gameData.gender === PlayerGender.MALE ? TrainerVariant.FEMALE : TrainerVariant.DEFAULT)),
  [112]: new FixedBattleConfig().setBattleType(BattleType.TRAINER).setSeedOffsetWave(35)
    .setGetTrainerFunc(getRandomTrainerFunc([ TrainerType.ROCKET_GRUNT, TrainerType.MAGMA_GRUNT, TrainerType.AQUA_GRUNT, TrainerType.GALACTIC_GRUNT, TrainerType.PLASMA_GRUNT, TrainerType.FLARE_GRUNT, TrainerType.AETHER_GRUNT, TrainerType.SKULL_GRUNT, TrainerType.MACRO_GRUNT ], true)),
  [114]: new FixedBattleConfig().setBattleType(BattleType.TRAINER).setSeedOffsetWave(35)
    .setGetTrainerFunc(getRandomTrainerFunc([[ TrainerType.ARCHER, TrainerType.ARIANA, TrainerType.PROTON, TrainerType.PETREL ], [ TrainerType.TABITHA, TrainerType.COURTNEY ], [ TrainerType.MATT, TrainerType.SHELLY ], [ TrainerType.JUPITER, TrainerType.MARS, TrainerType.SATURN ], [ TrainerType.ZINZOLIN, TrainerType.ROOD ], [ TrainerType.XEROSIC, TrainerType.BRYONY ], TrainerType.FABA, TrainerType.PLUMERIA, TrainerType.OLEANA ], true, 1)),
  [115]: new FixedBattleConfig().setBattleType(BattleType.TRAINER).setSeedOffsetWave(35)
    .setGetTrainerFunc(getRandomTrainerFunc([ TrainerType.ROCKET_BOSS_GIOVANNI_1, TrainerType.MAXIE, TrainerType.ARCHIE, TrainerType.CYRUS, TrainerType.GHETSIS, TrainerType.LYSANDRE, TrainerType.LUSAMINE, TrainerType.GUZMA, TrainerType.ROSE ])),
  [145]: new FixedBattleConfig().setBattleType(BattleType.TRAINER)
    .setGetTrainerFunc(scene => new Trainer(scene, TrainerType.RIVAL_5, scene.gameData.gender === PlayerGender.MALE ? TrainerVariant.FEMALE : TrainerVariant.DEFAULT)),
  [165]: new FixedBattleConfig().setBattleType(BattleType.TRAINER).setSeedOffsetWave(35)
    .setGetTrainerFunc(getRandomTrainerFunc([ TrainerType.ROCKET_BOSS_GIOVANNI_2, TrainerType.MAXIE_2, TrainerType.ARCHIE_2, TrainerType.CYRUS_2, TrainerType.GHETSIS_2, TrainerType.LYSANDRE_2, TrainerType.LUSAMINE_2, TrainerType.GUZMA_2, TrainerType.ROSE_2 ])),
  [182]: new FixedBattleConfig().setBattleType(BattleType.TRAINER)
    .setGetTrainerFunc(getRandomTrainerFunc([ TrainerType.LORELEI, TrainerType.WILL, TrainerType.SIDNEY, TrainerType.AARON, TrainerType.SHAUNTAL, TrainerType.MALVA, [ TrainerType.HALA, TrainerType.MOLAYNE ], TrainerType.MARNIE_ELITE, TrainerType.RIKA, TrainerType.CRISPIN ])),
  [184]: new FixedBattleConfig().setBattleType(BattleType.TRAINER).setSeedOffsetWave(182)
    .setGetTrainerFunc(getRandomTrainerFunc([ TrainerType.BRUNO, TrainerType.KOGA, TrainerType.PHOEBE, TrainerType.BERTHA, TrainerType.MARSHAL, TrainerType.SIEBOLD, TrainerType.OLIVIA, TrainerType.NESSA_ELITE, TrainerType.POPPY, TrainerType.AMARYS ])),
  [186]: new FixedBattleConfig().setBattleType(BattleType.TRAINER).setSeedOffsetWave(182)
    .setGetTrainerFunc(getRandomTrainerFunc([ TrainerType.AGATHA, TrainerType.BRUNO, TrainerType.GLACIA, TrainerType.FLINT, TrainerType.GRIMSLEY, TrainerType.WIKSTROM, TrainerType.ACEROLA, [ TrainerType.BEA_ELITE, TrainerType.ALLISTER_ELITE ], TrainerType.LARRY_ELITE, TrainerType.LACEY ])),
  [188]: new FixedBattleConfig().setBattleType(BattleType.TRAINER).setSeedOffsetWave(182)
    .setGetTrainerFunc(getRandomTrainerFunc([ TrainerType.LANCE, TrainerType.KAREN, TrainerType.DRAKE, TrainerType.LUCIAN, TrainerType.CAITLIN, TrainerType.DRASNA, TrainerType.KAHILI, TrainerType.RAIHAN_ELITE, TrainerType.HASSEL, TrainerType.DRAYTON ])),
  [190]: new FixedBattleConfig().setBattleType(BattleType.TRAINER).setSeedOffsetWave(182)
    .setGetTrainerFunc(getRandomTrainerFunc([ TrainerType.BLUE, [ TrainerType.RED, TrainerType.LANCE_CHAMPION ], [ TrainerType.STEVEN, TrainerType.WALLACE ], TrainerType.CYNTHIA, [ TrainerType.ALDER, TrainerType.IRIS ], TrainerType.DIANTHA, TrainerType.HAU, TrainerType.LEON, [ TrainerType.GEETA, TrainerType.NEMONA ], TrainerType.KIERAN ])),
  [195]: new FixedBattleConfig().setBattleType(BattleType.TRAINER)
    .setGetTrainerFunc(scene => new Trainer(scene, TrainerType.RIVAL_6, scene.gameData.gender === PlayerGender.MALE ? TrainerVariant.FEMALE : TrainerVariant.DEFAULT))
};
