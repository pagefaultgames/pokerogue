import BattleScene from "./battle-scene";
import { EnemyPokemon, PlayerPokemon, QueuedMove } from "./field/pokemon";
import { Command } from "./ui/command-ui-handler";
import * as Utils from "./utils";
import Trainer, { TrainerVariant } from "./field/trainer";
import { Species } from "./data/enums/species";
import { Moves } from "./data/enums/moves";
import { TrainerType } from "./data/enums/trainer-type";
import { GameMode } from "./game-mode";
import { BattleSpec } from "./enums/battle-spec";
import { PlayerGender } from "./data/enums/player-gender";
import { MoneyMultiplierModifier, PokemonHeldItemModifier } from "./modifier/modifier";
import { PokeballType } from "./data/pokeball";
import {trainerConfigs} from "#app/data/trainer-config";

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
    cursor?: integer;
    move?: QueuedMove;
    targets?: BattlerIndex[];
    skip?: boolean;
    args?: any[];
}

interface TurnCommands {
    [key: integer]: TurnCommand
}

export default class Battle {
  protected gameMode: GameMode;
  public waveIndex: integer;
  public battleType: BattleType;
  public battleSpec: BattleSpec;
  public trainer: Trainer;
  public enemyLevels: integer[];
  public enemyParty: EnemyPokemon[];
  public seenEnemyPartyMemberIds: Set<integer>;
  public double: boolean;
  public started: boolean;
  public enemySwitchCounter: integer;
  public turn: integer;
  public turnCommands: TurnCommands;
  public playerParticipantIds: Set<integer>;
  public battleScore: integer;
  public postBattleLoot: PokemonHeldItemModifier[];
  public escapeAttempts: integer;
  public lastMove: Moves;
  public battleSeed: string;
  private battleSeedState: string;
  public moneyScattered: number;
  public lastUsedPokeball: PokeballType;
  public playerFaints: number; // The amount of times pokemon on the players side have fainted
  public enemyFaints: number; // The amount of times pokemon on the enemies side have fainted

  private rngCounter: integer = 0;

  constructor(gameMode: GameMode, waveIndex: integer, battleType: BattleType, trainer: Trainer, double: boolean) {
    this.gameMode = gameMode;
    this.waveIndex = waveIndex;
    this.battleType = battleType;
    this.trainer = trainer;
    this.initBattleSpec();
    this.enemyLevels = battleType !== BattleType.TRAINER
      ? new Array(double ? 2 : 1).fill(null).map(() => this.getLevelForWave())
      : trainer.getPartyLevels(this.waveIndex);
    this.enemyParty = [];
    this.seenEnemyPartyMemberIds = new Set<integer>();
    this.double = double;
    this.enemySwitchCounter = 0;
    this.turn = 0;
    this.playerParticipantIds = new Set<integer>();
    this.battleScore = 0;
    this.postBattleLoot = [];
    this.escapeAttempts = 0;
    this.started = false;
    this.battleSeed = Utils.randomString(16, true);
    this.battleSeedState = null;
    this.moneyScattered = 0;
    this.lastUsedPokeball = null;
    this.playerFaints = 0;
    this.enemyFaints = 0;
  }

  private initBattleSpec(): void {
    let spec = BattleSpec.DEFAULT;
    if (this.gameMode.isWaveFinal(this.waveIndex) && this.gameMode.isClassic) {
      spec = BattleSpec.FINAL_BOSS;
    }
    this.battleSpec = spec;
  }

  private getLevelForWave(): integer {
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

  getBattlerCount(): integer {
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
    this.postBattleLoot.push(...enemyPokemon.scene.findModifiers(m => m instanceof PokemonHeldItemModifier && m.pokemonId === enemyPokemon.id && m.getTransferrable(false), false).map(i => {
      const ret = i as PokemonHeldItemModifier;
      ret.pokemonId = null;
      return ret;
    }));
  }

  pickUpScatteredMoney(scene: BattleScene): void {
    const moneyAmount = new Utils.IntegerHolder(scene.currentBattle.moneyScattered);
    scene.applyModifiers(MoneyMultiplierModifier, true, moneyAmount);

    scene.addMoney(moneyAmount.value);

    scene.queueMessage(`You picked up ₽${moneyAmount.value.toLocaleString("en-US")}!`, null, true);

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

  getBgmOverride(scene: BattleScene): string {
    const battlers = this.enemyParty.slice(0, this.getBattlerCount());
    if (this.battleType === BattleType.TRAINER) {
      if (!this.started && this.trainer.config.encounterBgm && this.trainer.getEncounterMessages()?.length) {
        return `encounter_${this.trainer.getEncounterBgm()}`;
      }
      if (scene.musicPreference === 0) {
        return this.trainer.getBattleBgm();
      } else {
        return this.trainer.getMixedBattleBgm();
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
            return "battle_legendary_dia_pal";
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
          if (pokemon.species.speciesId === Species.COSMOG || pokemon.species.speciesId === Species.COSMOEM || pokemon.species.speciesId === Species.SOLGALEO || pokemon.species.speciesId === Species.LUNALA || pokemon.species.speciesId === Species.NECROZMA) {
            return "battle_legendary_sol_lun";
          }
          if (pokemon.species.speciesId === Species.NIHILEGO || pokemon.species.speciesId === Species.BUZZWOLE || pokemon.species.speciesId === Species.PHEROMOSA || pokemon.species.speciesId === Species.XURKITREE || pokemon.species.speciesId === Species.CELESTEELA || pokemon.species.speciesId === Species.KARTANA || pokemon.species.speciesId === Species.GUZZLORD || pokemon.species.speciesId === Species.POIPOLE || pokemon.species.speciesId === Species.NAGANADEL || pokemon.species.speciesId === Species.STAKATAKA || pokemon.species.speciesId === Species.BLACEPHALON) {
            return "battle_legendary_ub";
          }
          if (pokemon.species.speciesId === Species.ZACIAN || pokemon.species.speciesId === Species.ZAMAZENTA) {
            return "battle_legendary_zac_zam";
          }
          if (pokemon.species.speciesId === Species.GLASTRIER || pokemon.species.speciesId === Species.SPECTRIER) {
            return "battle_legendary_glas_spec";
          }
          if (pokemon.species.speciesId === Species.CALYREX) {
            return "battle_legendary_calyrex";
          }
          if (pokemon.species.speciesId === Species.GALAR_ARTICUNO || pokemon.species.speciesId === Species.GALAR_ZAPDOS || pokemon.species.speciesId === Species.GALAR_MOLTRES) {
            return "battle_legendary_birds_galar";
          }
          if (pokemon.species.speciesId === Species.WO_CHIEN || pokemon.species.speciesId === Species.CHIEN_PAO || pokemon.species.speciesId === Species.TING_LU || pokemon.species.speciesId === Species.CHI_YU) {
            return "battle_legendary_ruinous";
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

  randSeedInt(scene: BattleScene, range: integer, min: integer = 0): integer {
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
  constructor(scene: BattleScene, waveIndex: integer, config: FixedBattleConfig) {
    super(scene.gameMode, waveIndex, config.battleType, config.battleType === BattleType.TRAINER ? config.getTrainer(scene) : null, config.double);
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
  public seedOffsetWaveIndex: integer;

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

  setSeedOffsetWave(seedOffsetWaveIndex: integer): FixedBattleConfig {
    this.seedOffsetWaveIndex = seedOffsetWaveIndex;
    return this;
  }
}

function getRandomTrainerFunc(trainerPool: (TrainerType | TrainerType[])[]): GetTrainerFunc {
  return (scene: BattleScene) => {
    const rand = Utils.randSeedInt(trainerPool.length);
    const trainerTypes: TrainerType[] = [];
    for (const trainerPoolEntry of trainerPool) {
      const trainerType = Array.isArray(trainerPoolEntry)
        ? Utils.randSeedItem(trainerPoolEntry)
        : trainerPoolEntry;
      trainerTypes.push(trainerType);
    }
    // If the trainer type has a double variant, there's a 33% chance of it being a double battle (for now we only allow tate&liza to be double)
    if (trainerConfigs[trainerTypes[rand]].trainerTypeDouble && (trainerTypes[rand] === TrainerType.TATE || trainerTypes[rand] === TrainerType.LIZA)) {
      return new Trainer(scene, trainerTypes[rand], Utils.randSeedInt(3) ? TrainerVariant.DOUBLE : TrainerVariant.DEFAULT);
    }
    return new Trainer(scene, trainerTypes[rand], TrainerVariant.DEFAULT);
  };
}

export interface FixedBattleConfigs {
    [key: integer]: FixedBattleConfig
}
/**
 * Youngster/Lass on 5
 * Rival on 8, 55, 95, 145, 195
 * Evil team grunts on 35, 62, 64, 65, 112, 114 (Not currently spawning)
 * Evil leader on 115, 165 (Not currently spawning)
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
  // [35]: new FixedBattleConfig().setBattleType(BattleType.TRAINER)
  //   .setGetTrainerFunc(getRandomTrainerFunc([ TrainerType.ROCKET_GRUNT, TrainerType.MAGMA_GRUNT, TrainerType.AQUA_GRUNT, TrainerType.GALACTIC_GRUNT, TrainerType.PLASMA_GRUNT, TrainerType.FLARE_GRUNT ])),
  [55]: new FixedBattleConfig().setBattleType(BattleType.TRAINER)
    .setGetTrainerFunc(scene => new Trainer(scene, TrainerType.RIVAL_3, scene.gameData.gender === PlayerGender.MALE ? TrainerVariant.FEMALE : TrainerVariant.DEFAULT)),
  // [62]: new FixedBattleConfig().setBattleType(BattleType.TRAINER).setSeedOffsetWave(35)
  //   .setGetTrainerFunc(getRandomTrainerFunc([ TrainerType.ROCKET_GRUNT, TrainerType.MAGMA_GRUNT, TrainerType.AQUA_GRUNT, TrainerType.GALACTIC_GRUNT, TrainerType.PLASMA_GRUNT, TrainerType.FLARE_GRUNT ])),
  // [64]: new FixedBattleConfig().setBattleType(BattleType.TRAINER).setSeedOffsetWave(35)
  //   .setGetTrainerFunc(getRandomTrainerFunc([ TrainerType.ROCKET_GRUNT, TrainerType.MAGMA_GRUNT, TrainerType.AQUA_GRUNT, TrainerType.GALACTIC_GRUNT, TrainerType.PLASMA_GRUNT, TrainerType.FLARE_GRUNT ])),
  // [65]: new FixedBattleConfig().setBattleType(BattleType.TRAINER).setSeedOffsetWave(35)
  //   .setGetTrainerFunc(getRandomTrainerFunc([ TrainerType.ROCKET_GRUNT, TrainerType.MAGMA_GRUNT, TrainerType.AQUA_GRUNT, TrainerType.GALACTIC_GRUNT, TrainerType.PLASMA_GRUNT, TrainerType.FLARE_GRUNT ])),
  [95]: new FixedBattleConfig().setBattleType(BattleType.TRAINER)
    .setGetTrainerFunc(scene => new Trainer(scene, TrainerType.RIVAL_4, scene.gameData.gender === PlayerGender.MALE ? TrainerVariant.FEMALE : TrainerVariant.DEFAULT)),
  // [112]: new FixedBattleConfig().setBattleType(BattleType.TRAINER).setSeedOffsetWave(35)
  //   .setGetTrainerFunc(getRandomTrainerFunc([ TrainerType.ROCKET_GRUNT, TrainerType.MAGMA_GRUNT, TrainerType.AQUA_GRUNT, TrainerType.GALACTIC_GRUNT, TrainerType.PLASMA_GRUNT, TrainerType.FLARE_GRUNT ])),
  // [114]: new FixedBattleConfig().setBattleType(BattleType.TRAINER).setSeedOffsetWave(35)
  //   .setGetTrainerFunc(getRandomTrainerFunc([ TrainerType.ROCKET_GRUNT, TrainerType.MAGMA_GRUNT, TrainerType.AQUA_GRUNT, TrainerType.GALACTIC_GRUNT, TrainerType.PLASMA_GRUNT, TrainerType.FLARE_GRUNT ])),
  // [115]: new FixedBattleConfig().setBattleType(BattleType.TRAINER).setSeedOffsetWave(35)
  //   .setGetTrainerFunc(getRandomTrainerFunc([ TrainerType.ROCKET_BOSS_GIOVANNI_1, TrainerType.MAXIE, TrainerType.ARCHIE, TrainerType.CYRUS, TrainerType.GHETSIS, TrainerType.LYSANDRE ])),
  [145]: new FixedBattleConfig().setBattleType(BattleType.TRAINER)
    .setGetTrainerFunc(scene => new Trainer(scene, TrainerType.RIVAL_5, scene.gameData.gender === PlayerGender.MALE ? TrainerVariant.FEMALE : TrainerVariant.DEFAULT)),
  // [165]:  new FixedBattleConfig().setBattleType(BattleType.TRAINER).setSeedOffsetWave(35)
  //   .setGetTrainerFunc(getRandomTrainerFunc([ TrainerType.ROCKET_BOSS_GIOVANNI_2, TrainerType.MAXIE_2, TrainerType.ARCHIE_2, TrainerType.CYRUS_2, TrainerType.GHETSIS_2, TrainerType.LYSANDRE_2 ])),
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
