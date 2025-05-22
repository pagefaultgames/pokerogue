import type BattleScene from "#app/battle-scene";
import { allMoves } from "#app/data/moves/move";
import { MoveCategory } from "#enums/MoveCategory";
import { Abilities } from "#app/enums/abilities";
import { Moves } from "#app/enums/moves";
import { Species } from "#app/enums/species";
import type { EnemyPokemon } from "#app/field/pokemon";
import { AiType } from "#app/field/pokemon";
import { randSeedInt } from "#app/utils/common";
import GameManager from "#test/testUtils/gameManager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

let globalScene: BattleScene;
const NUM_TRIALS = 300;

type MoveChoiceSet = { [key: number]: number };

function getEnemyMoveChoices(pokemon: EnemyPokemon, moveChoices: MoveChoiceSet): void {
  // Use an unseeded random number generator in place of the mocked-out randBattleSeedInt
  vi.spyOn(globalScene, "randBattleSeedInt").mockImplementation((range, min?) => {
    return randSeedInt(range, min);
  });
  for (let i = 0; i < NUM_TRIALS; i++) {
    const queuedMove = pokemon.getNextMove();
    moveChoices[queuedMove.move]++;
  }

  for (const [moveId, count] of Object.entries(moveChoices)) {
    console.log(`Move: ${allMoves[moveId].name}   Count: ${count} (${(count / NUM_TRIALS) * 100}%)`);
  }
}

describe("Enemy Commands - Move Selection", () => {
  let phaserGame: Phaser.Game;
  let game: GameManager;

  beforeAll(() => {
    phaserGame = new Phaser.Game({
      type: Phaser.HEADLESS,
    });
  });

  afterEach(() => {
    game.phaseInterceptor.restoreOg();
  });

  beforeEach(() => {
    game = new GameManager(phaserGame);
    globalScene = game.scene;

    game.override.ability(Abilities.BALL_FETCH).enemyAbility(Abilities.BALL_FETCH);
  });

  it("should never use Status moves if an attack can KO", async () => {
    game.override
      .enemySpecies(Species.ETERNATUS)
      .enemyMoveset([Moves.ETERNABEAM, Moves.SLUDGE_BOMB, Moves.DRAGON_DANCE, Moves.COSMIC_POWER])
      .startingLevel(1)
      .enemyLevel(100);

    await game.classicMode.startBattle([Species.MAGIKARP]);

    const enemyPokemon = game.scene.getEnemyPokemon()!;
    enemyPokemon.aiType = AiType.SMART_RANDOM;

    const moveChoices: MoveChoiceSet = {};
    const enemyMoveset = enemyPokemon.getMoveset();
    enemyMoveset.forEach(mv => (moveChoices[mv!.moveId] = 0));
    getEnemyMoveChoices(enemyPokemon, moveChoices);

    enemyMoveset.forEach(mv => {
      if (mv?.getMove().category === MoveCategory.STATUS) {
        expect(moveChoices[mv.moveId]).toBe(0);
      }
    });
  });

  it("should not select Last Resort if it would fail, even if the move KOs otherwise", async () => {
    game.override
      .enemySpecies(Species.KANGASKHAN)
      .enemyMoveset([Moves.LAST_RESORT, Moves.GIGA_IMPACT, Moves.SPLASH, Moves.SWORDS_DANCE])
      .startingLevel(1)
      .enemyLevel(100);

    await game.classicMode.startBattle([Species.MAGIKARP]);

    const enemyPokemon = game.scene.getEnemyPokemon()!;
    enemyPokemon.aiType = AiType.SMART_RANDOM;

    const moveChoices: MoveChoiceSet = {};
    const enemyMoveset = enemyPokemon.getMoveset();
    enemyMoveset.forEach(mv => (moveChoices[mv!.moveId] = 0));
    getEnemyMoveChoices(enemyPokemon, moveChoices);

    enemyMoveset.forEach(mv => {
      if (mv?.getMove().category === MoveCategory.STATUS || mv?.moveId === Moves.LAST_RESORT) {
        expect(moveChoices[mv.moveId]).toBe(0);
      }
    });
  });
});
