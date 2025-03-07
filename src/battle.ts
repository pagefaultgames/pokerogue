import { globalScene } from "#app/global-scene";
import type { Command } from "./ui/command-ui-handler";
import * as Utils from "./utils";
import type Trainer from "./field/trainer";
import type { GameMode } from "./game-mode";
import { MoneyMultiplierModifier, PokemonHeldItemModifier } from "./modifier/modifier";
import type { PokeballType } from "#enums/pokeball";
import { SpeciesFormKey } from "#enums/species-form-key";
import type { EnemyPokemon, PlayerPokemon, TurnMove } from "#app/field/pokemon";
import type Pokemon from "#app/field/pokemon";
import { ArenaTagType } from "#enums/arena-tag-type";
import { BattleSpec, BattleType } from "#enums/battle-spec";
import type { Moves } from "#enums/moves";
import { MusicPreference } from "#app/system/settings/settings";
import { Species } from "#enums/species";
import i18next from "#app/plugins/i18n";
import type MysteryEncounter from "#app/data/mystery-encounters/mystery-encounter";
import { MysteryEncounterMode } from "#enums/mystery-encounter-mode";
import type { MysteryEncounterType } from "#enums/mystery-encounter-type";
import type { FixedBattleConfig } from "./data/balance/fixed-battle-configs";
import { ClassicFixedBossWaves } from "#enums/fixed-boss-waves";

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
  move?: TurnMove;
  targets?: BattlerIndex[];
  skip?: boolean;
  args?: any[];
}

export interface FaintLogEntry {
  pokemon: Pokemon,
  turn: number
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
  public preTurnCommands: TurnCommands;
  public turnCommands: TurnCommands;
  public playerParticipantIds: Set<number> = new Set<number>();
  public battleScore: number = 0;
  public postBattleLoot: PokemonHeldItemModifier[] = [];
  public escapeAttempts: number = 0;
  public lastMove: Moves;
  public battleSeed: string = Utils.randomString(16, true);
  private battleSeedState: string | null = null;
  public moneyScattered: number = 0;
  /** Primarily for double battles, keeps track of last enemy and player pokemon that triggered its ability or used a move */
  public lastEnemyInvolved: number;
  public lastPlayerInvolved: number;
  public lastUsedPokeball: PokeballType | null = null;
  /**
   * Saves the number of times a Pokemon on the enemy's side has fainted during this battle.
   * This is saved here since we encounter a new enemy every wave.
   * {@linkcode globalScene.arena.playerFaints} is the corresponding faint counter for the player and needs to be save across waves (reset every arena encounter).
   */
  public enemyFaints: number = 0;
  public playerFaintsHistory: FaintLogEntry[] = [];
  public enemyFaintsHistory: FaintLogEntry[] = [];

  public mysteryEncounterType?: MysteryEncounterType;
  /** If the current battle is a Mystery Encounter, this will always be defined */
  public mysteryEncounter?: MysteryEncounter;

  private rngCounter: number = 0;

  constructor(gameMode: GameMode, waveIndex: number, battleType: BattleType, trainer?: Trainer, double: boolean = false) {
    this.gameMode = gameMode;
    this.waveIndex = waveIndex;
    this.battleType = battleType;
    this.trainer = trainer ?? null;
    this.initBattleSpec();
    this.enemyLevels = battleType !== BattleType.TRAINER
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
    this.turnCommands = Object.fromEntries(Utils.getEnumValues(BattlerIndex).map(bt => [ bt, null ]));
    this.preTurnCommands = Object.fromEntries(Utils.getEnumValues(BattlerIndex).map(bt => [ bt, null ]));
    this.battleSeedState = null;
  }

  addParticipant(playerPokemon: PlayerPokemon): void {
    this.playerParticipantIds.add(playerPokemon.id);
  }

  removeFaintedParticipant(playerPokemon: PlayerPokemon): void {
    this.playerParticipantIds.delete(playerPokemon.id);
  }

  addPostBattleLoot(enemyPokemon: EnemyPokemon): void {
    this.postBattleLoot.push(...globalScene.findModifiers(m => m instanceof PokemonHeldItemModifier && m.pokemonId === enemyPokemon.id && m.isTransferable, false).map(i => {
      const ret = i as PokemonHeldItemModifier;
      //@ts-ignore - this is awful to fix/change
      ret.pokemonId = null;
      return ret;
    }));
  }

  pickUpScatteredMoney(): void {
    const moneyAmount = new Utils.NumberHolder(globalScene.currentBattle.moneyScattered);
    globalScene.applyModifiers(MoneyMultiplierModifier, true, moneyAmount);

    if (globalScene.arena.getTag(ArenaTagType.HAPPY_HOUR)) {
      moneyAmount.value *= 2;
    }

    globalScene.addMoney(moneyAmount.value);

    const userLocale = navigator.language || "en-US";
    const formattedMoneyAmount = moneyAmount.value.toLocaleString(userLocale);
    const message = i18next.t("battle:moneyPickedUp", { moneyAmount: formattedMoneyAmount });
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
        partyMemberTurnMultiplier *= (p.bossSegments / 1.5) / globalScene.getEnemyParty().length;
      }
    }
    const turnMultiplier = Phaser.Tweens.Builders.GetEaseFunction("Sine.easeIn")(1 - Math.min(this.turn - 2, 10 * partyMemberTurnMultiplier) / (10 * partyMemberTurnMultiplier));
    const finalBattleScore = Math.ceil(this.battleScore * turnMultiplier);
    globalScene.score += finalBattleScore;
    console.log(`Battle Score: ${finalBattleScore} (${this.turn - 1} Turns x${Math.floor(turnMultiplier * 100) / 100})`);
    console.log(`Total Score: ${globalScene.score}`);
    globalScene.updateScoreText();
  }

  getBgmOverride(): string | null {
    if (this.isBattleMysteryEncounter() && this.mysteryEncounter?.encounterMode === MysteryEncounterMode.DEFAULT) {
      // Music is overridden for MEs during ME onInit()
      // Should not use any BGM overrides before swapping from DEFAULT mode
      return null;
    } else if (this.battleType === BattleType.TRAINER || this.mysteryEncounter?.encounterMode === MysteryEncounterMode.TRAINER_BATTLE) {
      if (!this.started && this.trainer?.config.encounterBgm && this.trainer?.getEncounterMessages()?.length) {
        return `encounter_${this.trainer?.getEncounterBgm()}`;
      }
      if (globalScene.musicPreference === MusicPreference.GENFIVE) {
        return this.trainer?.getBattleBgm() ?? null;
      } else {
        return this.trainer?.getMixedBattleBgm() ?? null;
      }
    } else if (this.gameMode.isClassic && this.waveIndex > ClassicFixedBossWaves.RIVAL_6 && this.battleSpec !== BattleSpec.FINAL_BOSS) {
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
        } else if (globalScene.musicPreference === MusicPreference.ALLGENS) {
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

    if (globalScene.gameMode.isClassic && this.waveIndex < ClassicFixedBossWaves.TOWN_YOUNGSTER) {
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
  randSeedInt(range: number, min: number = 0): number {
    if (range <= 1) {
      return min;
    }
    const tempRngCounter = globalScene.rngCounter;
    const tempSeedOverride = globalScene.rngSeedOverride;
    const state = Phaser.Math.RND.state();
    if (this.battleSeedState) {
      Phaser.Math.RND.state(this.battleSeedState);
    } else {
      Phaser.Math.RND.sow([ Utils.shiftCharCodes(this.battleSeed, this.turn << 6) ]);
      console.log("Battle Seed:", this.battleSeed);
    }
    globalScene.rngCounter = this.rngCounter++;
    globalScene.rngSeedOverride = this.battleSeed;
    const ret = Utils.randSeedInt(range, min);
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
    super(globalScene.gameMode, waveIndex, config.battleType, config.battleType === BattleType.TRAINER ? config.getTrainer() : undefined, config.double);
    if (config.getEnemyParty) {
      this.enemyParty = config.getEnemyParty();
    }
  }
}
