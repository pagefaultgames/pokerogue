import { allMoves, MoveCategory } from "#app/data/move";
import { Abilities } from "#app/enums/abilities";
import { Moves } from "#app/enums/moves";
import { Species } from "#app/enums/species";
import { AiType, EnemyPokemon } from "#app/field/pokemon";
import { randSeedInt } from "#app/utils";
import GameManager from "#test/utils/gameManager";
import Phaser from "phaser";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";

const TIMEOUT = 20 * 1000;
const NUM_TRIALS = 300;

type MoveChoiceSet = { [key: number]: number };

function getEnemyMoveChoices(pokemon: EnemyPokemon, moveChoices: MoveChoiceSet): void {
  // Use an unseeded random number generator in place of the mocked-out randBattleSeedInt
  vi.spyOn(pokemon.scene, "randBattleSeedInt").mockImplementation((range, min?) => {
    return randSeedInt(range, min);
  });
  for (let i = 0; i < NUM_TRIALS; i++) {
    const queuedMove = pokemon.getNextMove();
    moveChoices[queuedMove.move]++;
  }

  for (const [moveId, count] of Object.entries(moveChoices)) {
    console.log(`Move: ${allMoves[moveId].name}   Count: ${count} (${count / NUM_TRIALS * 100}%)`);
  }
}

describe("Enemy Commands - Move Selection", () => {
  let phaserGame: Phaser.Game;
  let game: GameManager;

  beforeAll(() => {
    phaserGame = new Phaser.Game({
      type: Phaser.HEADLESS,
    });
    game = new GameManager(phaserGame);
    game.override.ability(Abilities.BALL_FETCH);
  });

  afterEach(() => {
    game.phaseInterceptor.restoreOg();
  });

  it(
    "should never use Status moves if an attack can KO",
    async () => {
      game.override
        .enemySpecies(Species.ETERNATUS)
        .enemyMoveset([Moves.ETERNABEAM, Moves.SLUDGE_BOMB, Moves.DRAGON_DANCE, Moves.COSMIC_POWER])
        .enemyAbility(Abilities.BALL_FETCH)
        .ability(Abilities.BALL_FETCH)
        .startingLevel(1)
        .enemyLevel(100);

      await game.classicMode.startBattle([Species.MAGIKARP]);

      const enemyPokemon = game.scene.getEnemyPokemon()!;
      enemyPokemon.aiType = AiType.SMART_RANDOM;

      const moveChoices: MoveChoiceSet = {};
      const enemyMoveset = enemyPokemon.getMoveset();
      enemyMoveset.forEach(mv => moveChoices[mv!.moveId] = 0);
      getEnemyMoveChoices(enemyPokemon, moveChoices);

      enemyMoveset.forEach(mv => {
        if (mv?.getMove().category === MoveCategory.STATUS) {
          expect(moveChoices[mv.moveId]).toBe(0);
        }
      });
    }, TIMEOUT
  );
});
