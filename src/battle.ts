import { EnemyPokemon, PlayerPokemon } from "./pokemon";

export class Battle {
    public waveIndex: integer;
    public enemyPokemon: EnemyPokemon;
    public playerParticipantIds: Set<integer> = new Set<integer>();

    constructor(waveIndex: integer, enemyPokemon: EnemyPokemon) {
        this.waveIndex = waveIndex;
        this.enemyPokemon = enemyPokemon;
    }

    addParticipant(playerPokemon: PlayerPokemon) {
        console.log('add participant', playerPokemon.name)
        this.playerParticipantIds.add(playerPokemon.id);
    }

    removeFaintedParticipant(playerPokemon: PlayerPokemon) {
        this.playerParticipantIds.delete(playerPokemon.id);
    }
}