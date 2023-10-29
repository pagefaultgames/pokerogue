import BattleScene, { PokeballCounts } from "./battle-scene";
import { EnemyPokemon, PlayerPokemon, QueuedMove } from "./pokemon";
import { Command } from "./ui/command-ui-handler";
import * as Utils from "./utils";
import Trainer from "./trainer";
import { Species } from "./data/species";
import { Moves } from "./data/move";
import { TrainerConfig, TrainerType } from "./data/trainer-type";

export enum BattleType {
    WILD,
    TRAINER
}

export enum BattlerIndex {
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
};

interface TurnCommands {
    [key: integer]: TurnCommand
}

export default class Battle {
    public waveIndex: integer;
    public battleType: BattleType;
    public trainer: Trainer;
    public enemyLevels: integer[];
    public enemyParty: EnemyPokemon[];
    public seenEnemyPartyMemberIds: Set<integer>;
    public double: boolean;
    public started: boolean;
    public turn: integer;
    public turnCommands: TurnCommands;
    public playerParticipantIds: Set<integer> = new Set<integer>();
    public escapeAttempts: integer = 0;
    public lastMove: Moves;

    constructor(waveIndex: integer, battleType: BattleType, trainer: Trainer, double: boolean) {
        this.waveIndex = waveIndex;
        this.battleType = battleType;
        this.trainer = trainer;
        this.enemyLevels = battleType !== BattleType.TRAINER
            ? new Array(double ? 2 : 1).fill(null).map(() => this.getLevelForWave())
            : trainer.getPartyLevels(this.waveIndex);
        this.enemyParty = [];
        this.seenEnemyPartyMemberIds = new Set<integer>();
        this.double = double;
        this.turn = 0;
        this.started = false;
    }

    private getLevelForWave(): integer {
        let baseLevel = 1 + this.waveIndex / 2 + Math.pow(this.waveIndex / 25, 2);
        const bossMultiplier = 1.2;

        if (!(this.waveIndex % 10)) {
            const ret = Math.floor(baseLevel * bossMultiplier);
            if (this.waveIndex === 200 || !(this.waveIndex % 250))
                return Math.ceil(ret / 25) * 25;
            return ret + Math.round(Phaser.Math.RND.realInRange(-1, 1) * Math.floor(this.waveIndex / 10));
        }

        const deviation = 10 / this.waveIndex;

        return Math.max(Math.round(baseLevel + Math.abs(Utils.randSeedGauss(deviation))), 1);
    }

    getBattlerCount(): integer {
        return this.double ? 2 : 1;
    }

    incrementTurn(scene: BattleScene): void {
        this.turn++;
        this.turnCommands = Object.fromEntries(Utils.getEnumValues(BattlerIndex).map(bt => [ bt, null ]));
    }

    addParticipant(playerPokemon: PlayerPokemon): void {
        this.playerParticipantIds.add(playerPokemon.id);
    }

    removeFaintedParticipant(playerPokemon: PlayerPokemon): void {
        this.playerParticipantIds.delete(playerPokemon.id);
    }

    getBgmOverride(): string {
        const battlers = this.enemyParty.slice(0, this.getBattlerCount());
        if (this.battleType === BattleType.TRAINER) {
            if (!this.started && this.trainer.config.encounterBgm && this.trainer.config.encounterMessages.length)
                return `encounter_${this.trainer.getEncounterBgm()}`;
            return this.trainer.getBattleBgm();
        }
        for (let pokemon of battlers) {
            if (pokemon.species.speciesId === Species.ETERNATUS)
                return 'battle_final';
            if (pokemon.species.legendary || pokemon.species.pseudoLegendary || pokemon.species.mythical) {
                if (pokemon.species.speciesId === Species.KYUREM)
                    return 'battle_legendary_z';
                if (pokemon.species.legendary)
                    return 'battle_legendary_rz';
                return 'battle_legendary';
            }
        }

        if (this.waveIndex <= 4)
            return 'battle_wild';

        return null;
    }
}

export class FixedBattle extends Battle {
    constructor(scene: BattleScene, waveIndex: integer, config: FixedBattleConfig) {
        super(waveIndex, config.battleType, config.battleType === BattleType.TRAINER ? config.getTrainer(scene) : null, config.double);
        if (config.getEnemyParty)
            this.enemyParty = config.getEnemyParty(scene);
    }
}

type GetTrainerFunc = (scene: BattleScene) => Trainer;
type GetEnemyPartyFunc = (scene: BattleScene) => EnemyPokemon[];

export class FixedBattleConfig {
    public battleType: BattleType;
    public double: boolean;
    public getTrainer: GetTrainerFunc;
    public getEnemyParty: GetEnemyPartyFunc;

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
}

interface FixedBattleConfigs {
    [key: integer]: FixedBattleConfig
}

export const fixedBattles: FixedBattleConfigs = {
    [5]: new FixedBattleConfig().setBattleType(BattleType.TRAINER)
        .setGetTrainerFunc(scene => new Trainer(scene, TrainerType.YOUNGSTER, !!Utils.randSeedInt(2))),
    [8]: new FixedBattleConfig().setBattleType(BattleType.TRAINER)
        .setGetTrainerFunc(scene => new Trainer(scene, TrainerType.RIVAL, true)),
    [25]: new FixedBattleConfig().setBattleType(BattleType.TRAINER)
        .setGetTrainerFunc(scene => new Trainer(scene, TrainerType.RIVAL_2, true)),
    [55]: new FixedBattleConfig().setBattleType(BattleType.TRAINER)
        .setGetTrainerFunc(scene => new Trainer(scene, TrainerType.RIVAL_3, true)),
    [95]: new FixedBattleConfig().setBattleType(BattleType.TRAINER)
        .setGetTrainerFunc(scene => new Trainer(scene, TrainerType.RIVAL_4, true)),
    [145]: new FixedBattleConfig().setBattleType(BattleType.TRAINER)
        .setGetTrainerFunc(scene => new Trainer(scene, TrainerType.RIVAL_5, true)),
    [186]: new FixedBattleConfig().setBattleType(BattleType.TRAINER)
        .setGetTrainerFunc(scene => new Trainer(scene, TrainerType.SHAUNTAL)),
    [187]: new FixedBattleConfig().setBattleType(BattleType.TRAINER)
        .setGetTrainerFunc(scene => new Trainer(scene, TrainerType.MARSHAL)),
    [188]: new FixedBattleConfig().setBattleType(BattleType.TRAINER)
        .setGetTrainerFunc(scene => new Trainer(scene, TrainerType.GRIMSLEY)),
    [189]: new FixedBattleConfig().setBattleType(BattleType.TRAINER)
        .setGetTrainerFunc(scene => new Trainer(scene, TrainerType.CAITLIN)),
    [190]: new FixedBattleConfig().setBattleType(BattleType.TRAINER)
        .setGetTrainerFunc(scene => new Trainer(scene, Phaser.Math.RND.pick([ TrainerType.BLUE, TrainerType.RED, TrainerType.LANCE, TrainerType.STEVEN, TrainerType.WALLACE, TrainerType.CYNTHIA, TrainerType.IRIS, TrainerType.ALDER, TrainerType.CYNTHIA ]))),
    [195]: new FixedBattleConfig().setBattleType(BattleType.TRAINER)
        .setGetTrainerFunc(scene => new Trainer(scene, TrainerType.RIVAL_6, true))
}