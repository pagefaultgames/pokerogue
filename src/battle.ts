import type { GameMode } from "#app/game-mode";
import { globalScene } from "#app/global-scene";
import { ArenaTagType } from "#enums/arena-tag-type";
import { BattleSpec } from "#enums/battle-spec";
import { BattleType } from "#enums/battle-type";
import { BattlerIndex } from "#enums/battler-index";
import type { Command } from "#enums/command";
import type { MoveId } from "#enums/move-id";
import { MysteryEncounterMode } from "#enums/mystery-encounter-mode";
import type { MysteryEncounterType } from "#enums/mystery-encounter-type";
import type { PokeballType } from "#enums/pokeball";
import { SpeciesFormKey } from "#enums/species-form-key";
import { SpeciesId } from "#enums/species-id";
import { TrainerType } from "#enums/trainer-type";
import { TrainerVariant } from "#enums/trainer-variant";
import type { EnemyPokemon, PlayerPokemon, Pokemon } from "#field/pokemon";
import { Trainer } from "#field/trainer";
import { MoneyMultiplierModifier, type PokemonHeldItemModifier } from "#modifiers/modifier";
import type { CustomModifierSettings } from "#modifiers/modifier-type";
import type { MysteryEncounter } from "#mystery-encounters/mystery-encounter";
import i18next from "#plugins/i18n";
import { MusicPreference } from "#system/settings";
import { trainerConfigs } from "#trainers/trainer-config";
import type { TurnMove } from "#types/turn-move";
import {
  NumberHolder,
  randInt,
  randomString,
  randSeedFloat,
  randSeedInt,
  randSeedItem,
  shiftCharCodes,
} from "#utils/common";
import { getEnumValues } from "#utils/enums";

export interface TurnCommand {
  command: Command;
  cursor?: number;
  move?: TurnMove;
  targets?: BattlerIndex[];
  skip?: boolean;
  args?: any[];
}

export interface FaintLogEntry {
  pokemon: Pokemon;
  turn: number;
}

interface TurnCommands {
  [key: number]: TurnCommand | null;
}

export class Battle {
  protected gameMode: GameMode;
  public waveIndex: number;
  public battleType: BattleType;
  public battleSpec: BattleSpec;
  public trainer: Trainer | null;
  public enemyLevels: number[] | undefined;
  public enemyParty: EnemyPokemon[] = [];
  public seenEnemyPartyMemberIds: Set<number> = new Set<number>();
  public double: boolean;
  public started = false;
  public enemySwitchCounter = 0;
  public turn = 0;
  public preTurnCommands: TurnCommands;
  public turnCommands: TurnCommands;
  public playerParticipantIds: Set<number> = new Set<number>();
  public battleScore = 0;
  public postBattleLoot: PokemonHeldItemModifier[] = [];
  public escapeAttempts = 0;
  public lastMove: MoveId;
  public battleSeed: string = randomString(16, true);
  private battleSeedState: string | null = null;
  public moneyScattered = 0;
  /** Primarily for double battles, keeps track of last enemy and player pokemon that triggered its ability or used a move */
  public lastEnemyInvolved: number;
  public lastPlayerInvolved: number;
  public lastUsedPokeball: PokeballType | null = null;
  /**
   * Saves the number of times a Pokemon on the enemy's side has fainted during this battle.
   * This is saved here since we encounter a new enemy every wave.
   * {@linkcode globalScene.arena.playerFaints} is the corresponding faint counter for the player and needs to be save across waves (reset every arena encounter).
   */
  public enemyFaints = 0;
  public playerFaintsHistory: FaintLogEntry[] = [];
  public enemyFaintsHistory: FaintLogEntry[] = [];

  public mysteryEncounterType?: MysteryEncounterType;
  /** If the current battle is a Mystery Encounter, this will always be defined */
  public mysteryEncounter?: MysteryEncounter;

  /**
   * Tracker for whether the last run attempt failed.
   * @defaultValue `false`
   */
  public failedRunAway = false;

  private rngCounter = 0;

  constructor(gameMode: GameMode, waveIndex: number, battleType: BattleType, trainer?: Trainer, double = false) {
    this.gameMode = gameMode;
    this.waveIndex = waveIndex;
    this.battleType = battleType;
    this.trainer = trainer ?? null;
    this.initBattleSpec();
    this.enemyLevels =
      battleType !== BattleType.TRAINER
        ? new Array(double ? 2 : 1).fill(null).map(() => this.getLevelForWave())
        : trainer?.getPartyLevels(this.waveIndex);
    this.double = double;
  }

  private initBattleSpec(): void {
    let spec = BattleSpec.DEFAULT;
    if (this.gameMode.isWaveFinal(this.waveIndex) && this.gameMode.isClassic) {
      spec = BattleSpec.FINAL_BOSS;
    }
    this.battleSpec = spec;
  }

  public getLevelForWave(): number {
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
      rand += randSeedFloat();
    }
    return rand / value;
  }

  getBattlerCount(): number {
    return this.double ? 2 : 1;
  }

  incrementTurn(): void {
    this.turn++;
    this.turnCommands = Object.fromEntries(getEnumValues(BattlerIndex).map(bt => [bt, null]));
    this.preTurnCommands = Object.fromEntries(getEnumValues(BattlerIndex).map(bt => [bt, null]));
    this.battleSeedState = null;
  }

  addParticipant(playerPokemon: PlayerPokemon): void {
    this.playerParticipantIds.add(playerPokemon.id);
  }

  removeFaintedParticipant(playerPokemon: PlayerPokemon): void {
    this.playerParticipantIds.delete(playerPokemon.id);
  }

  addPostBattleLoot(enemyPokemon: EnemyPokemon): void {
    this.postBattleLoot.push(
      ...globalScene
        .findModifiers(
          m => m.is("PokemonHeldItemModifier") && m.pokemonId === enemyPokemon.id && m.isTransferable,
          false,
        )
        .map(i => {
          const ret = i as PokemonHeldItemModifier;
          //@ts-expect-error - this is awful to fix/change
          ret.pokemonId = null;
          return ret;
        }),
    );
  }

  pickUpScatteredMoney(): void {
    const moneyAmount = new NumberHolder(globalScene.currentBattle.moneyScattered);
    globalScene.applyModifiers(MoneyMultiplierModifier, true, moneyAmount);

    if (globalScene.arena.getTag(ArenaTagType.HAPPY_HOUR)) {
      moneyAmount.value *= 2;
    }

    globalScene.addMoney(moneyAmount.value);

    const userLocale = navigator.language || "en-US";
    const formattedMoneyAmount = moneyAmount.value.toLocaleString(userLocale);
    const message = i18next.t("battle:moneyPickedUp", {
      moneyAmount: formattedMoneyAmount,
    });
    globalScene.phaseManager.queueMessage(message, undefined, true);

    globalScene.currentBattle.moneyScattered = 0;
  }

  addBattleScore(): void {
    let partyMemberTurnMultiplier = globalScene.getEnemyParty().length / 2 + 0.5;
    if (this.double) {
      partyMemberTurnMultiplier /= 1.5;
    }
    for (const p of globalScene.getEnemyParty()) {
      if (p.isBoss()) {
        partyMemberTurnMultiplier *= p.bossSegments / 1.5 / globalScene.getEnemyParty().length;
      }
    }
    const turnMultiplier = Phaser.Tweens.Builders.GetEaseFunction("Sine.easeIn")(
      1 - Math.min(this.turn - 2, 10 * partyMemberTurnMultiplier) / (10 * partyMemberTurnMultiplier),
    );
    const finalBattleScore = Math.ceil(this.battleScore * turnMultiplier);
    globalScene.score += finalBattleScore;
    console.log(
      `Battle Score: ${finalBattleScore} (${this.turn - 1} Turns x${Math.floor(turnMultiplier * 100) / 100})`,
    );
    console.log(`Total Score: ${globalScene.score}`);
    globalScene.updateScoreText();
  }

  getBgmOverride(): string | null {
    if (this.isBattleMysteryEncounter() && this.mysteryEncounter?.encounterMode === MysteryEncounterMode.DEFAULT) {
      // Music is overridden for MEs during ME onInit()
      // Should not use any BGM overrides before swapping from DEFAULT mode
      return null;
    }
    if (
      this.battleType === BattleType.TRAINER
      || this.mysteryEncounter?.encounterMode === MysteryEncounterMode.TRAINER_BATTLE
    ) {
      if (!this.started && this.trainer?.config.encounterBgm && this.trainer.getEncounterMessages().length > 0) {
        return `encounter_${this.trainer.getEncounterBgm()}`;
      }
      if (globalScene.musicPreference === MusicPreference.GENFIVE) {
        return this.trainer?.getBattleBgm() ?? null;
      }
      return this.trainer?.getMixedBattleBgm() ?? null;
    }
    if (this.gameMode.isClassic && this.waveIndex > 195 && this.battleSpec !== BattleSpec.FINAL_BOSS) {
      return "end_summit";
    }
    const wildOpponents = globalScene.getEnemyParty();
    for (const pokemon of wildOpponents) {
      if (this.battleSpec === BattleSpec.FINAL_BOSS) {
        if (pokemon.species.getFormSpriteKey(pokemon.formIndex) === SpeciesFormKey.ETERNAMAX) {
          return "battle_final";
        }
        return "battle_final_encounter";
      }
      if (pokemon.species.legendary || pokemon.species.subLegendary || pokemon.species.mythical) {
        if (globalScene.musicPreference === MusicPreference.GENFIVE) {
          switch (pokemon.species.speciesId) {
            case SpeciesId.REGIROCK:
            case SpeciesId.REGICE:
            case SpeciesId.REGISTEEL:
            case SpeciesId.REGIGIGAS:
            case SpeciesId.REGIDRAGO:
            case SpeciesId.REGIELEKI:
              return "battle_legendary_regis_g5";
            case SpeciesId.KYUREM:
              return "battle_legendary_kyurem";
            default:
              if (pokemon.species.legendary) {
                return "battle_legendary_res_zek";
              }
              return "battle_legendary_unova";
          }
        }
        if (globalScene.musicPreference === MusicPreference.ALLGENS) {
          switch (pokemon.species.speciesId) {
            case SpeciesId.ARTICUNO:
            case SpeciesId.ZAPDOS:
            case SpeciesId.MOLTRES:
            case SpeciesId.MEWTWO:
            case SpeciesId.MEW:
              return "battle_legendary_kanto";
            case SpeciesId.RAIKOU:
              return "battle_legendary_raikou";
            case SpeciesId.ENTEI:
              return "battle_legendary_entei";
            case SpeciesId.SUICUNE:
              return "battle_legendary_suicune";
            case SpeciesId.LUGIA:
              return "battle_legendary_lugia";
            case SpeciesId.HO_OH:
              return "battle_legendary_ho_oh";
            case SpeciesId.REGIROCK:
            case SpeciesId.REGICE:
            case SpeciesId.REGISTEEL:
            case SpeciesId.REGIGIGAS:
            case SpeciesId.REGIDRAGO:
            case SpeciesId.REGIELEKI:
              return "battle_legendary_regis_g6";
            case SpeciesId.GROUDON:
            case SpeciesId.KYOGRE:
              return "battle_legendary_gro_kyo";
            case SpeciesId.RAYQUAZA:
              return "battle_legendary_rayquaza";
            case SpeciesId.DEOXYS:
              return "battle_legendary_deoxys";
            case SpeciesId.UXIE:
            case SpeciesId.MESPRIT:
            case SpeciesId.AZELF:
              return "battle_legendary_lake_trio";
            case SpeciesId.HEATRAN:
            case SpeciesId.CRESSELIA:
            case SpeciesId.DARKRAI:
            case SpeciesId.SHAYMIN:
              return "battle_legendary_sinnoh";
            case SpeciesId.DIALGA:
            case SpeciesId.PALKIA:
              if (pokemon.species.getFormSpriteKey(pokemon.formIndex) === SpeciesFormKey.ORIGIN) {
                return "battle_legendary_origin_forme";
              }
              return "battle_legendary_dia_pal";
            case SpeciesId.GIRATINA:
              return "battle_legendary_giratina";
            case SpeciesId.ARCEUS:
              return "battle_legendary_arceus";
            case SpeciesId.COBALION:
            case SpeciesId.TERRAKION:
            case SpeciesId.VIRIZION:
            case SpeciesId.KELDEO:
            case SpeciesId.TORNADUS:
            case SpeciesId.LANDORUS:
            case SpeciesId.THUNDURUS:
            case SpeciesId.MELOETTA:
            case SpeciesId.GENESECT:
              return "battle_legendary_unova";
            case SpeciesId.KYUREM:
              return "battle_legendary_kyurem";
            case SpeciesId.XERNEAS:
            case SpeciesId.YVELTAL:
            case SpeciesId.ZYGARDE:
              return "battle_legendary_xern_yvel";
            case SpeciesId.TAPU_KOKO:
            case SpeciesId.TAPU_LELE:
            case SpeciesId.TAPU_BULU:
            case SpeciesId.TAPU_FINI:
              return "battle_legendary_tapu";
            case SpeciesId.SOLGALEO:
            case SpeciesId.LUNALA:
              return "battle_legendary_sol_lun";
            case SpeciesId.NECROZMA:
              switch (pokemon.getFormKey()) {
                case "dusk-mane":
                case "dawn-wings":
                  return "battle_legendary_dusk_dawn";
                case "ultra":
                  return "battle_legendary_ultra_nec";
                default:
                  return "battle_legendary_sol_lun";
              }
            case SpeciesId.NIHILEGO:
            case SpeciesId.PHEROMOSA:
            case SpeciesId.BUZZWOLE:
            case SpeciesId.XURKITREE:
            case SpeciesId.CELESTEELA:
            case SpeciesId.KARTANA:
            case SpeciesId.GUZZLORD:
            case SpeciesId.POIPOLE:
            case SpeciesId.NAGANADEL:
            case SpeciesId.STAKATAKA:
            case SpeciesId.BLACEPHALON:
              return "battle_legendary_ub";
            case SpeciesId.ZACIAN:
            case SpeciesId.ZAMAZENTA:
              return "battle_legendary_zac_zam";
            case SpeciesId.ETERNATUS:
              if (pokemon.getFormKey() === "eternamax") {
                return "battle_legendary_eternatus_p2";
              }
              return "battle_legendary_eternatus_p1";
            case SpeciesId.GLASTRIER:
            case SpeciesId.SPECTRIER:
              return "battle_legendary_glas_spec";
            case SpeciesId.CALYREX:
              if (pokemon.getFormKey() === "ice" || pokemon.getFormKey() === "shadow") {
                return "battle_legendary_riders";
              }
              return "battle_legendary_calyrex";
            case SpeciesId.GALAR_ARTICUNO:
            case SpeciesId.GALAR_ZAPDOS:
            case SpeciesId.GALAR_MOLTRES:
              return "battle_legendary_birds_galar";
            case SpeciesId.WO_CHIEN:
            case SpeciesId.CHIEN_PAO:
            case SpeciesId.TING_LU:
            case SpeciesId.CHI_YU:
              return "battle_legendary_ruinous";
            case SpeciesId.KORAIDON:
            case SpeciesId.MIRAIDON:
              return "battle_legendary_kor_mir";
            case SpeciesId.OKIDOGI:
            case SpeciesId.MUNKIDORI:
            case SpeciesId.FEZANDIPITI:
              return "battle_legendary_loyal_three";
            case SpeciesId.OGERPON:
              return "battle_legendary_ogerpon";
            case SpeciesId.TERAPAGOS:
              return "battle_legendary_terapagos";
            case SpeciesId.PECHARUNT:
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

    if (globalScene.gameMode.isClassic && this.waveIndex <= 4) {
      return "battle_wild";
    }

    return null;
  }

  /**
   * Generates a random number using the current battle's seed. Calls {@linkcode randSeedInt}
   * @param range How large of a range of random numbers to choose from. If {@linkcode range} <= 1, returns {@linkcode min}
   * @param min The minimum integer to pick, default `0`
   * @returns A random integer between {@linkcode min} and ({@linkcode min} + {@linkcode range} - 1)
   */
  randSeedInt(range: number, min = 0): number {
    if (range <= 1) {
      return min;
    }
    const tempRngCounter = globalScene.rngCounter;
    const tempSeedOverride = globalScene.rngSeedOverride;
    const state = Phaser.Math.RND.state();
    if (this.battleSeedState) {
      Phaser.Math.RND.state(this.battleSeedState);
    } else {
      Phaser.Math.RND.sow([shiftCharCodes(this.battleSeed, this.turn << 6)]);
      console.log("Battle Seed:", this.battleSeed);
    }
    globalScene.rngCounter = this.rngCounter++;
    globalScene.rngSeedOverride = this.battleSeed;
    const ret = randSeedInt(range, min);
    this.battleSeedState = Phaser.Math.RND.state();
    Phaser.Math.RND.state(state);
    globalScene.rngCounter = tempRngCounter;
    globalScene.rngSeedOverride = tempSeedOverride;
    return ret;
  }

  /**
   * Returns if the battle is of type {@linkcode BattleType.MYSTERY_ENCOUNTER}
   */
  isBattleMysteryEncounter(): boolean {
    return this.battleType === BattleType.MYSTERY_ENCOUNTER;
  }
}

export class FixedBattle extends Battle {
  constructor(waveIndex: number, config: FixedBattleConfig) {
    super(
      globalScene.gameMode,
      waveIndex,
      config.battleType,
      config.battleType === BattleType.TRAINER ? config.getTrainer() : undefined,
      config.double,
    );
    if (config.getEnemyParty) {
      this.enemyParty = config.getEnemyParty();
    }
  }
}

type GetTrainerFunc = () => Trainer;
type GetEnemyPartyFunc = () => EnemyPokemon[];

export class FixedBattleConfig {
  public battleType: BattleType;
  public double: boolean;
  public getTrainer: GetTrainerFunc;
  public getEnemyParty: GetEnemyPartyFunc;
  public seedOffsetWaveIndex: number;
  public customModifierRewardSettings?: CustomModifierSettings;

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

  setCustomModifierRewards(customModifierRewardSettings: CustomModifierSettings) {
    this.customModifierRewardSettings = customModifierRewardSettings;
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
export function getRandomTrainerFunc(
  trainerPool: (TrainerType | TrainerType[])[],
  randomGender = false,
  seedOffset = 0,
): GetTrainerFunc {
  return () => {
    const rand = randSeedInt(trainerPool.length);
    const trainerTypes: TrainerType[] = [];

    globalScene.executeWithSeedOffset(() => {
      for (const trainerPoolEntry of trainerPool) {
        const trainerType = Array.isArray(trainerPoolEntry) ? randSeedItem(trainerPoolEntry) : trainerPoolEntry;
        trainerTypes.push(trainerType);
      }
    }, seedOffset);

    let trainerGender = TrainerVariant.DEFAULT;
    if (randomGender) {
      trainerGender = randInt(2) === 0 ? TrainerVariant.FEMALE : TrainerVariant.DEFAULT;
    }

    /* 1/3 chance for evil team grunts to be double battles */
    const evilTeamGrunts = [
      TrainerType.ROCKET_GRUNT,
      TrainerType.MAGMA_GRUNT,
      TrainerType.AQUA_GRUNT,
      TrainerType.GALACTIC_GRUNT,
      TrainerType.PLASMA_GRUNT,
      TrainerType.FLARE_GRUNT,
      TrainerType.AETHER_GRUNT,
      TrainerType.SKULL_GRUNT,
      TrainerType.MACRO_GRUNT,
      TrainerType.STAR_GRUNT,
    ];
    const isEvilTeamGrunt = evilTeamGrunts.includes(trainerTypes[rand]);

    if (trainerConfigs[trainerTypes[rand]].hasDouble && isEvilTeamGrunt) {
      return new Trainer(trainerTypes[rand], randInt(3) === 0 ? TrainerVariant.DOUBLE : trainerGender);
    }

    return new Trainer(trainerTypes[rand], trainerGender);
  };
}
