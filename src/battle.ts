import { EnemyPokemon, PlayerPokemon } from "./pokemon";
import * as Utils from "./utils";

export class Battle {
    public waveIndex: integer;
    public enemyLevel: integer;
    public enemyPokemon: EnemyPokemon;
    public turn: integer;
    public playerParticipantIds: Set<integer> = new Set<integer>();

    constructor(waveIndex: integer) {
        this.waveIndex = waveIndex;
        this.enemyLevel = this.getLevelForWave();
        this.turn = 1;
    }

    private getLevelForWave(): number {
        let baseLevel = 1 + this.waveIndex / 2 + Math.pow(this.waveIndex / 25, 2);

        if (!(this.waveIndex % 10))
            return Math.floor(baseLevel * 1.2);

        const deviation = 10 / this.waveIndex;

        return Math.max(Math.round(baseLevel + Math.abs(Utils.randGauss(deviation))), 1);
    }

    incrementTurn() {
        this.turn++;
    }

    addParticipant(playerPokemon: PlayerPokemon): void {
        this.playerParticipantIds.add(playerPokemon.id);
    }

    removeFaintedParticipant(playerPokemon: PlayerPokemon): void {
        this.playerParticipantIds.delete(playerPokemon.id);
    }
}