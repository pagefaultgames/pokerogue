import BattleScene from "./battle-scene";
import { EnemyPokemon, PlayerPokemon, QueuedMove } from "./field/pokemon";
import { Command } from "./ui/command-ui-handler";
import * as Utils from "./utils";
import Trainer, { TrainerVariant } from "./field/trainer";
import { GameMode } from "./game-mode";
import { MoneyMultiplierModifier, PokemonHeldItemModifier } from "./modifier/modifier";
import { PokeballType } from "./data/pokeball";
import { trainerConfigs } from "#app/data/trainer-config";
import { SpeciesFormKey } from "#app/data/pokemon-species";
import { ArenaTagType } from "#enums/arena-tag-type";
import { BattleSpec } from "#enums/battle-spec";
import { Moves } from "#enums/moves";
import { PlayerGender } from "#enums/player-gender";
import { MusicPreference } from "./system/settings/settings";
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

    if (this.battleType === BattleType.TRAINER) {
      if (!this.started && this.trainer?.config.encounterBgm && this.trainer?.getEncounterMessages()?.length) {
        return `encounter_${this.trainer?.getEncounterBgm()}`;
      }
      if (scene.musicPreference === MusicPreference.CONSISTENT) {
        return this.trainer?.getBattleBgm() ?? null;
      } else {
        return this.trainer?.getMixedBattleBgm() ?? null;
      }
    } else if (this.gameMode.isClassic && this.waveIndex > 195 && this.battleSpec !== BattleSpec.FINAL_BOSS) {
      return "end_summit";
    }
    const wildOpponents = scene.getEnemyParty();
    for (const pokemon of wildOpponents) {
      if (this.battleSpec === BattleSpec.FINAL_BOSS) {
        if (pokemon.species.getFormSpriteKey() === SpeciesFormKey.ETERNAMAX) {
          return "battle_final";
        }
        return "battle_final_encounter";
      }
      if (pokemon.species.legendary || pokemon.species.subLegendary || pokemon.species.mythical) {
        if (scene.musicPreference === MusicPreference.CONSISTENT) {
          switch (pokemon.species.speciesId) {
          case Species.REGIROCK:
          case Species.REGICE:
          case Species.REGISTEEL:
          case Species.REGIGIGAS:
          case Species.REGIDRAGO:
          case Species.REGIELEKI:
            return "battle_legendary_regis_g5";
          case Species.KYUREM:
            return "battle_legendary_kyurem";
          default:
            if (pokemon.species.legendary) {
              return "battle_legendary_res_zek";
            }
            return "battle_legendary_unova";
          }
        } else if (scene.musicPreference === MusicPreference.MIXED) {
          switch (pokemon.species.speciesId) {
          case Species.ARTICUNO:
          case Species.ZAPDOS:
          case Species.MOLTRES:
          case Species.MEWTWO:
          case Species.MEW:
            return "battle_legendary_kanto";
          case Species.RAIKOU:
            return "battle_legendary_raikou";
          case Species.ENTEI:
            return "battle_legendary_entei";
          case Species.SUICUNE:
            return "battle_legendary_suicune";
          case Species.LUGIA:
            return "battle_legendary_lugia";
          case Species.HO_OH:
            return "battle_legendary_ho_oh";
          case Species.REGIROCK:
          case Species.REGICE:
          case Species.REGISTEEL:
          case Species.REGIGIGAS:
          case Species.REGIDRAGO:
          case Species.REGIELEKI:
            return "battle_legendary_regis_g6";
          case Species.GROUDON:
          case Species.KYOGRE:
            return "battle_legendary_gro_kyo";
          case Species.RAYQUAZA:
            return "battle_legendary_rayquaza";
          case Species.DEOXYS:
            return "battle_legendary_deoxys";
          case Species.HEATRAN:
          case Species.CRESSELIA:
          case Species.DARKRAI:
          case Species.SHAYMIN:
            return "battle_legendary_sinnoh";
          case Species.DIALGA:
          case Species.PALKIA:
            if (pokemon.species.getFormSpriteKey() === SpeciesFormKey.ORIGIN) {
              return "battle_legendary_origin_forme";
            }
            return "battle_legendary_dia_pal";
          case Species.GIRATINA:
            return "battle_legendary_giratina";
          case Species.ARCEUS:
            return "battle_legendary_arceus";
          case Species.COBALION:
          case Species.TERRAKION:
          case Species.VIRIZION:
          case Species.KELDEO:
          case Species.TORNADUS:
          case Species.LANDORUS:
          case Species.THUNDURUS:
          case Species.MELOETTA:
          case Species.GENESECT:
            return "battle_legendary_unova";
          case Species.KYUREM:
            return "battle_legendary_kyurem";
          case Species.XERNEAS:
          case Species.YVELTAL:
          case Species.ZYGARDE:
            return "battle_legendary_xern_yvel";
          case Species.TAPU_KOKO:
          case Species.TAPU_LELE:
          case Species.TAPU_BULU:
          case Species.TAPU_FINI:
            return "battle_legendary_tapu";
          case Species.SOLGALEO:
          case Species.LUNALA:
            return "battle_legendary_sol_lun";
          case Species.NECROZMA:
            switch (pokemon.getFormKey()) {
            case "dusk-mane":
            case "dawn-wings":
              return "battle_legendary_dusk_dawn";
            case "ultra":
              return "battle_legendary_ultra_nec";
            default:
              return "battle_legendary_sol_lun";
            }
          case Species.NIHILEGO:
          case Species.PHEROMOSA:
          case Species.BUZZWOLE:
          case Species.XURKITREE:
          case Species.CELESTEELA:
          case Species.GUZZLORD:
          case Species.POIPOLE:
          case Species.NAGANADEL:
          case Species.STAKATAKA:
          case Species.BLACEPHALON:
            return "battle_legendary_ub";
          case Species.ZACIAN:
          case Species.ZAMAZENTA:
            return "battle_legendary_zac_zam";
          case Species.GLASTRIER:
          case Species.SPECTRIER:
            return "battle_legendary_glas_spec";
          case Species.CALYREX:
            if (pokemon.getFormKey() === "ice" || pokemon.getFormKey() === "shadow") {
              return "battle_legendary_riders";
            }
            return "battle_legendary_calyrex";
          case Species.GALAR_ARTICUNO:
          case Species.GALAR_ZAPDOS:
          case Species.GALAR_MOLTRES:
            return "battle_legendary_birds_galar";
          case Species.WO_CHIEN:
          case Species.CHIEN_PAO:
          case Species.TING_LU:
          case Species.CHI_YU:
            return "battle_legendary_ruinous";
          case Species.KORAIDON:
          case Species.MIRAIDON:
            return "battle_legendary_kor_mir";
          case Species.OKIDOGI:
          case Species.MUNKIDORI:
          case Species.FEZANDIPITI:
            return "battle_legendary_loyal_three";
          case Species.OGERPON:
            return "battle_legendary_ogerpon";
          case Species.TERAPAGOS:
            return "battle_legendary_terapagos";
          case Species.PECHARUNT:
            return "battle_legendary_pecharunt";
          default:
            if (pokemon.species.legendary) {
              return "battle_legendary_res_zek";
            }
            return "battle_legendary_unova";
          }
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
