import BattleScene, { PokeballCounts } from "./battle-scene";
import { EnemyPokemon, PlayerPokemon, QueuedMove } from "./pokemon";
import { Command } from "./ui/command-ui-handler";
import * as Utils from "./utils";
import Trainer from "./trainer";
import { Species } from "./data/species";
import { Moves } from "./data/move";
import { TrainerType } from "./data/trainer-type";

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
    public double: boolean;
    public turn: integer;
    public turnCommands: TurnCommands;
    public turnPokeballCounts: PokeballCounts;
    public playerParticipantIds: Set<integer> = new Set<integer>();
    public escapeAttempts: integer = 0;
    public lastMove: Moves;

    constructor(waveIndex: integer, battleType: BattleType, trainer: Trainer, double: boolean) {
        this.waveIndex = waveIndex;
        this.battleType = battleType;
        this.trainer = trainer;
        this.enemyLevels = new Array(battleType !== BattleType.TRAINER ? double ? 2 : 1 : trainer.config.genPartySize()).fill(null).map(() => this.getLevelForWave());
        this.enemyParty = [];
        this.double = double;
        this.turn = 0;
    }

    private getLevelForWave(): integer {
        let baseLevel = 1 + this.waveIndex / 2 + Math.pow(this.waveIndex / 25, 2);

        if (!(this.waveIndex % 10)) {
            if (this.waveIndex === 200)
                return 200;
            return Math.floor(baseLevel * 1.2);
        }

        const deviation = 10 / this.waveIndex;

        return Math.max(Math.round(baseLevel + Math.abs(Utils.randGauss(deviation))), 1);
    }

    getBattlerCount(): integer {
        return this.double ? 2 : 1;
    }

    incrementTurn(scene: BattleScene): void {
        this.turn++;
        this.turnCommands = Object.fromEntries(Utils.getEnumValues(BattlerIndex).map(bt => [ bt, null ]));
        this.turnPokeballCounts = Object.assign({}, scene.pokeballCounts);
    }

    addParticipant(playerPokemon: PlayerPokemon): void {
        this.playerParticipantIds.add(playerPokemon.id);
    }

    removeFaintedParticipant(playerPokemon: PlayerPokemon): void {
        this.playerParticipantIds.delete(playerPokemon.id);
    }

    getBgmOverride(): string {
        const battlers = this.enemyParty.slice(0, this.getBattlerCount());
        for (let pokemon of battlers) {
            if (this.battleType === BattleType.TRAINER) {
                if (this.trainer.config.trainerType === TrainerType.RIVAL)
                    return 'battle_rival';
                return 'battle_trainer';
            }
            if (pokemon.species.speciesId === Species.ETERNATUS)
                return 'battle_final';
            if (pokemon.species.legendary) {
                if (pokemon.species.speciesId === Species.RESHIRAM || pokemon.species.speciesId === Species.ZEKROM)
                    return 'battle_legendary_rz';
                if (pokemon.species.speciesId === Species.KYUREM)
                    return 'battle_legendary_z';
                return 'battle_legendary';
            }
        }

        return null;
    }
}