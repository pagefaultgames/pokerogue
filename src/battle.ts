import BattleScene from "./battle-scene";
import { EnemyPokemon, PlayerPokemon, QueuedMove } from "./field/pokemon";
import { Command } from "./ui/command-ui-handler";
import * as Utils from "./utils";
import Trainer from "./field/trainer";
import { Species } from "./data/enums/species";
import { Moves } from "./data/enums/moves";
import { TrainerType } from "./data/enums/trainer-type";
import { GameMode } from "./game-mode";
import { BattleSpec } from "./enums/battle-spec";
import { PlayerGender } from "./system/game-data";

export enum BattleType {
    WILD,
    TRAINER
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
};

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
    public turn: integer;
    public turnCommands: TurnCommands;
    public playerParticipantIds: Set<integer> = new Set<integer>();
    public escapeAttempts: integer = 0;
    public lastMove: Moves;
    public battleSeed: string;
    private battleSeedState: string;

    constructor(gameMode: integer, waveIndex: integer, battleType: BattleType, trainer: Trainer, double: boolean) {
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
        this.turn = 0;
        this.started = false;
        this.battleSeed = Utils.randomString(16, true);
        this.battleSeedState = null;
    }

    private initBattleSpec(): void {
        let spec = BattleSpec.DEFAULT;
        if (this.gameMode === GameMode.CLASSIC) {
            if (this.waveIndex === 200)
                spec = BattleSpec.FINAL_BOSS;
        }
        this.battleSpec = spec;
    }

    private getLevelForWave(): integer {
        let baseLevel = 1 + this.waveIndex / 2 + Math.pow(this.waveIndex / 25, 2);
        const bossMultiplier = 1.2;

        if (!(this.waveIndex % 10)) {
            const ret = Math.floor(baseLevel * bossMultiplier);
            if (this.battleSpec === BattleSpec.FINAL_BOSS || !(this.waveIndex % 250))
                return Math.ceil(ret / 25) * 25;
            return ret + Math.round(Phaser.Math.RND.realInRange(-1, 1) * Math.floor(this.waveIndex / 10));
        }

        const deviation = 10 / this.waveIndex;

        return Math.max(Math.round(baseLevel + Math.abs(this.randSeedGaussForLevel(deviation))), 1);
    }

    randSeedGaussForLevel(value: number): number { 
        let rand = 0;
        for (let i = value; i > 0; i--)
            rand += Phaser.Math.RND.realInRange(0, 1);
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

    getBgmOverride(scene: BattleScene): string {
        const battlers = this.enemyParty.slice(0, this.getBattlerCount());
        if (this.battleType === BattleType.TRAINER) {
            if (!this.started && this.trainer.config.encounterBgm && this.trainer.getEncounterMessages()?.length)
                return `encounter_${this.trainer.getEncounterBgm()}`;
            return this.trainer.getBattleBgm();
        } else if (this.gameMode === GameMode.CLASSIC && this.waveIndex > 195 && this.battleSpec !== BattleSpec.FINAL_BOSS)
            return 'end_summit';
        for (let pokemon of battlers) {
            if (this.battleSpec === BattleSpec.FINAL_BOSS) {
                if (pokemon.formIndex)
                    return 'battle_final';
                return 'battle_final_encounter';
            }
            if (pokemon.species.legendary || pokemon.species.pseudoLegendary || pokemon.species.mythical) {
                if (pokemon.species.speciesId === Species.KYUREM)
                    return 'battle_legendary_k';
                if (pokemon.species.legendary)
                    return 'battle_legendary_rz';
                return 'battle_legendary';
            }
        }

        if (scene.gameMode === GameMode.CLASSIC && this.waveIndex <= 4)
            return 'battle_wild';

        return null;
    }

    randSeedInt(range: integer, min: integer = 0): integer {
        let ret: integer;
        const state = Phaser.Math.RND.state();
        if (this.battleSeedState)
            Phaser.Math.RND.state(this.battleSeedState);
        else
            Phaser.Math.RND.sow([ Utils.shiftCharCodes(this.battleSeed, this.turn << 6) ]);
        ret = Utils.randSeedInt(range, min);
        this.battleSeedState = Phaser.Math.RND.state();
        Phaser.Math.RND.state(state);
        return ret;
    }
}

export class FixedBattle extends Battle {
    constructor(scene: BattleScene, waveIndex: integer, config: FixedBattleConfig) {
        super(scene.gameMode, waveIndex, config.battleType, config.battleType === BattleType.TRAINER ? config.getTrainer(scene) : null, config.double);
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
        for (let trainerPoolEntry of trainerPool) {
            const trainerType = Array.isArray(trainerPoolEntry)
                ? Utils.randSeedItem(trainerPoolEntry)
                : trainerPoolEntry;
            trainerTypes.push(trainerType);
        }
        return new Trainer(scene, trainerTypes[rand]);
    };
}

interface FixedBattleConfigs {
    [key: integer]: FixedBattleConfig
}

export const fixedBattles: FixedBattleConfigs = {
    [5]: new FixedBattleConfig().setBattleType(BattleType.TRAINER)
        .setGetTrainerFunc(scene => new Trainer(scene, TrainerType.YOUNGSTER, !!Utils.randSeedInt(2))),
    [8]: new FixedBattleConfig().setBattleType(BattleType.TRAINER)
        .setGetTrainerFunc(scene => new Trainer(scene, TrainerType.RIVAL, scene.gameData.gender === PlayerGender.MALE)),
    [25]: new FixedBattleConfig().setBattleType(BattleType.TRAINER)
        .setGetTrainerFunc(scene => new Trainer(scene, TrainerType.RIVAL_2, scene.gameData.gender === PlayerGender.MALE)),
    [55]: new FixedBattleConfig().setBattleType(BattleType.TRAINER)
        .setGetTrainerFunc(scene => new Trainer(scene, TrainerType.RIVAL_3, scene.gameData.gender === PlayerGender.MALE)),
    [95]: new FixedBattleConfig().setBattleType(BattleType.TRAINER)
        .setGetTrainerFunc(scene => new Trainer(scene, TrainerType.RIVAL_4, scene.gameData.gender === PlayerGender.MALE)),
    [145]: new FixedBattleConfig().setBattleType(BattleType.TRAINER)
        .setGetTrainerFunc(scene => new Trainer(scene, TrainerType.RIVAL_5, scene.gameData.gender === PlayerGender.MALE)),
    [182]: new FixedBattleConfig().setBattleType(BattleType.TRAINER)
        .setGetTrainerFunc(getRandomTrainerFunc([ TrainerType.LORELEI, TrainerType.WILL, TrainerType.SIDNEY, TrainerType.AARON, TrainerType.SHAUNTAL, TrainerType.MALVA, [ TrainerType.HALA, TrainerType.MOLAYNE ], TrainerType.RIKA, TrainerType.CRISPIN ])),
    [184]: new FixedBattleConfig().setBattleType(BattleType.TRAINER).setSeedOffsetWave(182)
        .setGetTrainerFunc(getRandomTrainerFunc([ TrainerType.BRUNO, TrainerType.KOGA, TrainerType.PHOEBE, TrainerType.BERTHA, TrainerType.MARSHAL, TrainerType.SIEBOLD, TrainerType.OLIVIA, TrainerType.POPPY, TrainerType.AMARYS ])),
    [186]: new FixedBattleConfig().setBattleType(BattleType.TRAINER).setSeedOffsetWave(182)
        .setGetTrainerFunc(getRandomTrainerFunc([ TrainerType.AGATHA, TrainerType.BRUNO, TrainerType.GLACIA, TrainerType.FLINT, TrainerType.GRIMSLEY, TrainerType.WIKSTROM, TrainerType.ACEROLA, TrainerType.LARRY_ELITE, TrainerType.LACEY ])),
    [188]: new FixedBattleConfig().setBattleType(BattleType.TRAINER).setSeedOffsetWave(182)
        .setGetTrainerFunc(getRandomTrainerFunc([ TrainerType.LANCE, TrainerType.KAREN, TrainerType.DRAKE, TrainerType.LUCIAN, TrainerType.CAITLIN, TrainerType.DRASNA, TrainerType.KAHILI, TrainerType.HASSEL, TrainerType.DRAYTON ])),
    [190]: new FixedBattleConfig().setBattleType(BattleType.TRAINER).setSeedOffsetWave(182)
        .setGetTrainerFunc(getRandomTrainerFunc([ [ TrainerType.BLUE, TrainerType.RED ], TrainerType.LANCE_CHAMPION, [ TrainerType.STEVEN, TrainerType.WALLACE ], TrainerType.CYNTHIA, [ TrainerType.ALDER, TrainerType.IRIS ], TrainerType.DIANTHA, TrainerType.HAU, [ TrainerType.GEETA, TrainerType.NEMONA ], TrainerType.KIERAN, TrainerType.LEON ])),
    [195]: new FixedBattleConfig().setBattleType(BattleType.TRAINER)
        .setGetTrainerFunc(scene => new Trainer(scene, TrainerType.RIVAL_6, scene.gameData.gender === PlayerGender.MALE))
};