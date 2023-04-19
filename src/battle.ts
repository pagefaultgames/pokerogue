import { EnemyPokemon, PlayerPokemon } from "./pokemon";
import * as Utils from "./utils";

export class Battle {
    public waveIndex: integer;
    public enemyLevel: integer;
    public enemyPokemon: EnemyPokemon;
    public playerParticipantIds: Set<integer> = new Set<integer>();

    constructor(waveIndex: integer) {
        this.waveIndex = waveIndex;
        this.enemyLevel = this.getLevelForWave();
    }

    private getLevelForWave(): number {
        let averageLevel = 1 + this.waveIndex / 2 + Math.pow(this.waveIndex / 25, 2);

        if (!(this.waveIndex % 10))
            return Math.floor(averageLevel * 1.2);

        const deviation = 10 / this.waveIndex;

        return Math.max(Math.round(averageLevel + Utils.randGauss(deviation)), 1);
    }

    addParticipant(playerPokemon: PlayerPokemon): void {
        this.playerParticipantIds.add(playerPokemon.id);
    }

    removeFaintedParticipant(playerPokemon: PlayerPokemon): void {
        this.playerParticipantIds.delete(playerPokemon.id);
    }
}