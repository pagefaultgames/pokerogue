import { globalScene } from "#app/global-scene";
import type { Command } from "./ui/command-ui-handler";
import {
  randomString,
  getEnumValues,
  NumberHolder,
  randSeedInt,
  shiftCharCodes,
  randSeedItem,
  randInt,
} from "#app/utils/common";
import Trainer, { TrainerVariant } from "./field/trainer";
import type { GameMode } from "./game-mode";
import { MoneyMultiplierModifier, PokemonHeldItemModifier } from "./modifier/modifier";
import type { PokeballType } from "#enums/pokeball";
import { trainerConfigs } from "#app/data/trainers/trainer-config";
import { SpeciesFormKey } from "#enums/species-form-key";
import type { EnemyPokemon, PlayerPokemon, TurnMove } from "#app/field/pokemon";
import type Pokemon from "#app/field/pokemon";
import { ArenaTagType } from "#enums/arena-tag-type";
import { BattleSpec } from "#enums/battle-spec";
import type { Moves } from "#enums/moves";
import { PlayerGender } from "#enums/player-gender";
import { MusicPreference } from "#app/system/settings/settings";
import { Species } from "#enums/species";
import { TrainerType } from "#enums/trainer-type";
import i18next from "#app/plugins/i18n";
import type MysteryEncounter from "#app/data/mystery-encounters/mystery-encounter";
import { MysteryEncounterMode } from "#enums/mystery-encounter-mode";
import type { CustomModifierSettings } from "#app/modifier/modifier-type";
import { ModifierTier } from "#app/modifier/modifier-tier";
import type { MysteryEncounterType } from "#enums/mystery-encounter-type";
import { BattleType } from "#enums/battle-type";
import { ClassicFixedBossWaves } from "#enums/fixed-boss-waves";

export enum BattlerIndex {
  ATTACKER = -1,
  PLAYER,
  PLAYER_2,
  ENEMY,
  ENEMY_2,
}

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
  public started = false;
  public enemySwitchCounter = 0;
  public turn = 0;
  public preTurnCommands: TurnCommands;
  public turnCommands: TurnCommands;
  public playerParticipantIds: Set<number> = new Set<number>();
  public battleScore = 0;
  public postBattleLoot: PokemonHeldItemModifier[] = [];
  public escapeAttempts = 0;
  public lastMove: Moves;
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
      rand += Phaser.Math.RND.realInRange(0, 1);
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
          m => m instanceof PokemonHeldItemModifier && m.pokemonId === enemyPokemon.id && m.isTransferable,
          false,
        )
        .map(i => {
          const ret = i as PokemonHeldItemModifier;
          //@ts-ignore - this is awful to fix/change
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
    globalScene.queueMessage(message, undefined, true);

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
      this.battleType === BattleType.TRAINER ||
      this.mysteryEncounter?.encounterMode === MysteryEncounterMode.TRAINER_BATTLE
    ) {
      if (!this.started && this.trainer?.config.encounterBgm && this.trainer?.getEncounterMessages()?.length) {
        return `encounter_${this.trainer?.getEncounterBgm()}`;
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
        }
        if (globalScene.musicPreference === MusicPreference.ALLGENS) {
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
            case Species.UXIE:
            case Species.MESPRIT:
            case Species.AZELF:
              return "battle_legendary_lake_trio";
            case Species.HEATRAN:
            case Species.CRESSELIA:
            case Species.DARKRAI:
            case Species.SHAYMIN:
              return "battle_legendary_sinnoh";
            case Species.DIALGA:
            case Species.PALKIA:
              if (pokemon.species.getFormSpriteKey(pokemon.formIndex) === SpeciesFormKey.ORIGIN) {
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
            case Species.KARTANA:
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

export interface FixedBattleConfigs {
  [key: number]: FixedBattleConfig;
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
  [ClassicFixedBossWaves.TOWN_YOUNGSTER]: new FixedBattleConfig()
    .setBattleType(BattleType.TRAINER)
    .setGetTrainerFunc(
      () => new Trainer(TrainerType.YOUNGSTER, randSeedInt(2) ? TrainerVariant.FEMALE : TrainerVariant.DEFAULT),
    ),
  [ClassicFixedBossWaves.RIVAL_1]: new FixedBattleConfig()
    .setBattleType(BattleType.TRAINER)
    .setGetTrainerFunc(
      () =>
        new Trainer(
          TrainerType.RIVAL,
          globalScene.gameData.gender === PlayerGender.MALE ? TrainerVariant.FEMALE : TrainerVariant.DEFAULT,
        ),
    ),
  [ClassicFixedBossWaves.RIVAL_2]: new FixedBattleConfig()
    .setBattleType(BattleType.TRAINER)
    .setGetTrainerFunc(
      () =>
        new Trainer(
          TrainerType.RIVAL_2,
          globalScene.gameData.gender === PlayerGender.MALE ? TrainerVariant.FEMALE : TrainerVariant.DEFAULT,
        ),
    )
    .setCustomModifierRewards({
      guaranteedModifierTiers: [ModifierTier.ULTRA, ModifierTier.GREAT, ModifierTier.GREAT],
      allowLuckUpgrades: false,
    }),
  [ClassicFixedBossWaves.EVIL_GRUNT_1]: new FixedBattleConfig()
    .setBattleType(BattleType.TRAINER)
    .setGetTrainerFunc(
      getRandomTrainerFunc(
        [
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
        ],
        true,
      ),
    ),
  [ClassicFixedBossWaves.RIVAL_3]: new FixedBattleConfig()
    .setBattleType(BattleType.TRAINER)
    .setGetTrainerFunc(
      () =>
        new Trainer(
          TrainerType.RIVAL_3,
          globalScene.gameData.gender === PlayerGender.MALE ? TrainerVariant.FEMALE : TrainerVariant.DEFAULT,
        ),
    )
    .setCustomModifierRewards({
      guaranteedModifierTiers: [ModifierTier.ULTRA, ModifierTier.ULTRA, ModifierTier.GREAT, ModifierTier.GREAT],
      allowLuckUpgrades: false,
    }),
  [ClassicFixedBossWaves.EVIL_GRUNT_2]: new FixedBattleConfig()
    .setBattleType(BattleType.TRAINER)
    .setSeedOffsetWave(ClassicFixedBossWaves.EVIL_GRUNT_1)
    .setGetTrainerFunc(
      getRandomTrainerFunc(
        [
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
        ],
        true,
      ),
    ),
  [ClassicFixedBossWaves.EVIL_GRUNT_3]: new FixedBattleConfig()
    .setBattleType(BattleType.TRAINER)
    .setSeedOffsetWave(ClassicFixedBossWaves.EVIL_GRUNT_1)
    .setGetTrainerFunc(
      getRandomTrainerFunc(
        [
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
        ],
        true,
      ),
    ),
  [ClassicFixedBossWaves.EVIL_ADMIN_1]: new FixedBattleConfig()
    .setBattleType(BattleType.TRAINER)
    .setSeedOffsetWave(ClassicFixedBossWaves.EVIL_GRUNT_1)
    .setGetTrainerFunc(
      getRandomTrainerFunc(
        [
          [TrainerType.ARCHER, TrainerType.ARIANA, TrainerType.PROTON, TrainerType.PETREL],
          [TrainerType.TABITHA, TrainerType.COURTNEY],
          [TrainerType.MATT, TrainerType.SHELLY],
          [TrainerType.JUPITER, TrainerType.MARS, TrainerType.SATURN],
          [TrainerType.ZINZOLIN, TrainerType.COLRESS],
          [TrainerType.XEROSIC, TrainerType.BRYONY],
          TrainerType.FABA,
          TrainerType.PLUMERIA,
          TrainerType.OLEANA,
          [TrainerType.GIACOMO, TrainerType.MELA, TrainerType.ATTICUS, TrainerType.ORTEGA, TrainerType.ERI],
        ],
        true,
      ),
    ),
  [ClassicFixedBossWaves.RIVAL_4]: new FixedBattleConfig()
    .setBattleType(BattleType.TRAINER)
    .setGetTrainerFunc(
      () =>
        new Trainer(
          TrainerType.RIVAL_4,
          globalScene.gameData.gender === PlayerGender.MALE ? TrainerVariant.FEMALE : TrainerVariant.DEFAULT,
        ),
    )
    .setCustomModifierRewards({
      guaranteedModifierTiers: [ModifierTier.ULTRA, ModifierTier.ULTRA, ModifierTier.ULTRA, ModifierTier.ULTRA],
      allowLuckUpgrades: false,
    }),
  [ClassicFixedBossWaves.EVIL_GRUNT_4]: new FixedBattleConfig()
    .setBattleType(BattleType.TRAINER)
    .setSeedOffsetWave(ClassicFixedBossWaves.EVIL_GRUNT_1)
    .setGetTrainerFunc(
      getRandomTrainerFunc(
        [
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
        ],
        true,
      ),
    ),
  [ClassicFixedBossWaves.EVIL_ADMIN_2]: new FixedBattleConfig()
    .setBattleType(BattleType.TRAINER)
    .setSeedOffsetWave(ClassicFixedBossWaves.EVIL_GRUNT_1)
    .setGetTrainerFunc(
      getRandomTrainerFunc(
        [
          [TrainerType.ARCHER, TrainerType.ARIANA, TrainerType.PROTON, TrainerType.PETREL],
          [TrainerType.TABITHA, TrainerType.COURTNEY],
          [TrainerType.MATT, TrainerType.SHELLY],
          [TrainerType.JUPITER, TrainerType.MARS, TrainerType.SATURN],
          [TrainerType.ZINZOLIN, TrainerType.COLRESS],
          [TrainerType.XEROSIC, TrainerType.BRYONY],
          TrainerType.FABA,
          TrainerType.PLUMERIA,
          TrainerType.OLEANA,
          [TrainerType.GIACOMO, TrainerType.MELA, TrainerType.ATTICUS, TrainerType.ORTEGA, TrainerType.ERI],
        ],
        true,
        1,
      ),
    ),
  [ClassicFixedBossWaves.EVIL_BOSS_1]: new FixedBattleConfig()
    .setBattleType(BattleType.TRAINER)
    .setSeedOffsetWave(ClassicFixedBossWaves.EVIL_GRUNT_1)
    .setGetTrainerFunc(
      getRandomTrainerFunc([
        TrainerType.ROCKET_BOSS_GIOVANNI_1,
        TrainerType.MAXIE,
        TrainerType.ARCHIE,
        TrainerType.CYRUS,
        TrainerType.GHETSIS,
        TrainerType.LYSANDRE,
        TrainerType.LUSAMINE,
        TrainerType.GUZMA,
        TrainerType.ROSE,
        TrainerType.PENNY,
      ]),
    )
    .setCustomModifierRewards({
      guaranteedModifierTiers: [
        ModifierTier.ROGUE,
        ModifierTier.ROGUE,
        ModifierTier.ULTRA,
        ModifierTier.ULTRA,
        ModifierTier.ULTRA,
      ],
      allowLuckUpgrades: false,
    }),
  [ClassicFixedBossWaves.RIVAL_5]: new FixedBattleConfig()
    .setBattleType(BattleType.TRAINER)
    .setGetTrainerFunc(
      () =>
        new Trainer(
          TrainerType.RIVAL_5,
          globalScene.gameData.gender === PlayerGender.MALE ? TrainerVariant.FEMALE : TrainerVariant.DEFAULT,
        ),
    )
    .setCustomModifierRewards({
      guaranteedModifierTiers: [
        ModifierTier.ROGUE,
        ModifierTier.ROGUE,
        ModifierTier.ROGUE,
        ModifierTier.ULTRA,
        ModifierTier.ULTRA,
      ],
      allowLuckUpgrades: false,
    }),
  [ClassicFixedBossWaves.EVIL_BOSS_2]: new FixedBattleConfig()
    .setBattleType(BattleType.TRAINER)
    .setSeedOffsetWave(ClassicFixedBossWaves.EVIL_GRUNT_1)
    .setGetTrainerFunc(
      getRandomTrainerFunc([
        TrainerType.ROCKET_BOSS_GIOVANNI_2,
        TrainerType.MAXIE_2,
        TrainerType.ARCHIE_2,
        TrainerType.CYRUS_2,
        TrainerType.GHETSIS_2,
        TrainerType.LYSANDRE_2,
        TrainerType.LUSAMINE_2,
        TrainerType.GUZMA_2,
        TrainerType.ROSE_2,
        TrainerType.PENNY_2,
      ]),
    )
    .setCustomModifierRewards({
      guaranteedModifierTiers: [
        ModifierTier.ROGUE,
        ModifierTier.ROGUE,
        ModifierTier.ULTRA,
        ModifierTier.ULTRA,
        ModifierTier.ULTRA,
        ModifierTier.ULTRA,
      ],
      allowLuckUpgrades: false,
    }),
  [ClassicFixedBossWaves.ELITE_FOUR_1]: new FixedBattleConfig()
    .setBattleType(BattleType.TRAINER)
    .setGetTrainerFunc(
      getRandomTrainerFunc([
        TrainerType.LORELEI,
        TrainerType.WILL,
        TrainerType.SIDNEY,
        TrainerType.AARON,
        TrainerType.SHAUNTAL,
        TrainerType.MALVA,
        [TrainerType.HALA, TrainerType.MOLAYNE],
        TrainerType.MARNIE_ELITE,
        TrainerType.RIKA,
        TrainerType.CRISPIN,
      ]),
    ),
  [ClassicFixedBossWaves.ELITE_FOUR_2]: new FixedBattleConfig()
    .setBattleType(BattleType.TRAINER)
    .setSeedOffsetWave(ClassicFixedBossWaves.ELITE_FOUR_1)
    .setGetTrainerFunc(
      getRandomTrainerFunc([
        TrainerType.BRUNO,
        TrainerType.KOGA,
        TrainerType.PHOEBE,
        TrainerType.BERTHA,
        TrainerType.MARSHAL,
        TrainerType.SIEBOLD,
        TrainerType.OLIVIA,
        TrainerType.NESSA_ELITE,
        TrainerType.POPPY,
        TrainerType.AMARYS,
      ]),
    ),
  [ClassicFixedBossWaves.ELITE_FOUR_3]: new FixedBattleConfig()
    .setBattleType(BattleType.TRAINER)
    .setSeedOffsetWave(ClassicFixedBossWaves.ELITE_FOUR_1)
    .setGetTrainerFunc(
      getRandomTrainerFunc([
        TrainerType.AGATHA,
        TrainerType.BRUNO,
        TrainerType.GLACIA,
        TrainerType.FLINT,
        TrainerType.GRIMSLEY,
        TrainerType.WIKSTROM,
        TrainerType.ACEROLA,
        [TrainerType.BEA_ELITE, TrainerType.ALLISTER_ELITE],
        TrainerType.LARRY_ELITE,
        TrainerType.LACEY,
      ]),
    ),
  [ClassicFixedBossWaves.ELITE_FOUR_4]: new FixedBattleConfig()
    .setBattleType(BattleType.TRAINER)
    .setSeedOffsetWave(ClassicFixedBossWaves.ELITE_FOUR_1)
    .setGetTrainerFunc(
      getRandomTrainerFunc([
        TrainerType.LANCE,
        TrainerType.KAREN,
        TrainerType.DRAKE,
        TrainerType.LUCIAN,
        TrainerType.CAITLIN,
        TrainerType.DRASNA,
        TrainerType.KAHILI,
        TrainerType.RAIHAN_ELITE,
        TrainerType.HASSEL,
        TrainerType.DRAYTON,
      ]),
    ),
  [ClassicFixedBossWaves.CHAMPION]: new FixedBattleConfig()
    .setBattleType(BattleType.TRAINER)
    .setSeedOffsetWave(ClassicFixedBossWaves.ELITE_FOUR_1)
    .setGetTrainerFunc(
      getRandomTrainerFunc([
        TrainerType.BLUE,
        [TrainerType.RED, TrainerType.LANCE_CHAMPION],
        [TrainerType.STEVEN, TrainerType.WALLACE],
        TrainerType.CYNTHIA,
        [TrainerType.ALDER, TrainerType.IRIS],
        TrainerType.DIANTHA,
        [TrainerType.KUKUI, TrainerType.HAU],
        [TrainerType.LEON, TrainerType.MUSTARD],
        [TrainerType.GEETA, TrainerType.NEMONA],
        TrainerType.KIERAN,
      ]),
    ),
  [ClassicFixedBossWaves.RIVAL_6]: new FixedBattleConfig()
    .setBattleType(BattleType.TRAINER)
    .setGetTrainerFunc(
      () =>
        new Trainer(
          TrainerType.RIVAL_6,
          globalScene.gameData.gender === PlayerGender.MALE ? TrainerVariant.FEMALE : TrainerVariant.DEFAULT,
        ),
    )
    .setCustomModifierRewards({
      guaranteedModifierTiers: [
        ModifierTier.ROGUE,
        ModifierTier.ROGUE,
        ModifierTier.ULTRA,
        ModifierTier.ULTRA,
        ModifierTier.GREAT,
        ModifierTier.GREAT,
      ],
      allowLuckUpgrades: false,
    }),
};
