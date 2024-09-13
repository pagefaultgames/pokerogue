import BattleScene from "#app/battle-scene";
import { BattlerIndex } from "#app/battle";
import { Command } from "#app/ui/command-ui-handler";
import { FieldPhase } from "./field-phase";

/**
 * Phase for determining an enemy AI's action for the next turn.
 * During this phase, the enemy decides whether to switch (if it has a trainer)
 * or to use a move from its moveset.
 *
 * For more information on how the Enemy AI works, see docs/enemy-ai.md
 * @see {@linkcode Pokemon.getMatchupScore}
 * @see {@linkcode EnemyPokemon.getNextMove}
 */
export class EnemyCommandPhase extends FieldPhase {
  protected fieldIndex: integer;

  constructor(scene: BattleScene, fieldIndex: integer) {
    super(scene);

    this.fieldIndex = fieldIndex;
  }

  start() {
    super.start();

    const enemyPokemon = this.scene.getEnemyField()[this.fieldIndex];

    const battle = this.scene.currentBattle;

    const trainer = battle.trainer;

    /**
       * If the enemy has a trainer, decide whether or not the enemy should switch
       * to another member in its party.
       *
       * This block compares the active enemy Pokemon's {@linkcode Pokemon.getMatchupScore | matchup score}
       * against the active player Pokemon with the enemy party's other non-fainted Pokemon. If a party
       * member's matchup score is 3x the active enemy's score (or 2x for "boss" trainers),
       * the enemy will switch to that Pokemon.
       */
    if (trainer && !enemyPokemon.getMoveQueue().length) {
      const opponents = enemyPokemon.getOpponents();

      if (!enemyPokemon.isTrapped()) {
        const partyMemberScores = trainer.getPartyMemberMatchupScores(enemyPokemon.trainerSlot, true);

        if (partyMemberScores.length) {
          const matchupScores = opponents.map(opp => enemyPokemon.getMatchupScore(opp));
          const matchupScore = matchupScores.reduce((total, score) => total += score, 0) / matchupScores.length;

          const sortedPartyMemberScores = trainer.getSortedPartyMemberMatchupScores(partyMemberScores);

          const switchMultiplier = 1 - (battle.enemySwitchCounter ? Math.pow(0.1, (1 / battle.enemySwitchCounter)) : 0);

          if (sortedPartyMemberScores[0][1] * switchMultiplier >= matchupScore * (trainer.config.isBoss ? 2 : 3)) {
            const index = trainer.getNextSummonIndex(enemyPokemon.trainerSlot, partyMemberScores);

            battle.turnCommands[this.fieldIndex + BattlerIndex.ENEMY] =
                { command: Command.POKEMON, cursor: index, args: [false] };

            battle.enemySwitchCounter++;

            return this.end();
          }
        }
      }
    }

    /** Select a move to use (and a target to use it against, if applicable) */
    const nextMove = enemyPokemon.getNextMove();

    this.scene.currentBattle.turnCommands[this.fieldIndex + BattlerIndex.ENEMY] =
        { command: Command.FIGHT, move: nextMove };

    this.scene.currentBattle.enemySwitchCounter = Math.max(this.scene.currentBattle.enemySwitchCounter - 1, 0);

    this.end();
  }

  getFieldIndex(): number {
    return this.fieldIndex;
  }
}
