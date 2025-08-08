import type { BattleScene } from "#app/battle-scene";
import { allMoves } from "#data/data-lists";
import { AbilityId } from "#enums/ability-id";
import { AiType } from "#enums/ai-type";
import { MoveCategory } from "#enums/move-category";
import { MoveId } from "#enums/move-id";
import { SpeciesId } from "#enums/species-id";
import type { EnemyPokemon } from "#field/pokemon";
import { GameManager } from "#test/test-utils/game-manager";
import { randSeedInt } from "#utils/common";
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

    game.override.ability(AbilityId.BALL_FETCH).enemyAbility(AbilityId.BALL_FETCH);
  });

  it("should never use Status moves if an attack can KO", async () => {
    game.override
      .enemySpecies(SpeciesId.ETERNATUS)
      .enemyMoveset([MoveId.ETERNABEAM, MoveId.SLUDGE_BOMB, MoveId.DRAGON_DANCE, MoveId.COSMIC_POWER])
      .startingLevel(1)
      .enemyLevel(100);

    await game.classicMode.startBattle([SpeciesId.MAGIKARP]);

    const enemyPokemon = game.field.getEnemyPokemon();
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
      .enemySpecies(SpeciesId.KANGASKHAN)
      .enemyMoveset([MoveId.LAST_RESORT, MoveId.GIGA_IMPACT, MoveId.SPLASH, MoveId.SWORDS_DANCE])
      .startingLevel(1)
      .enemyLevel(100);

    await game.classicMode.startBattle([SpeciesId.MAGIKARP]);

    const enemyPokemon = game.field.getEnemyPokemon();
    enemyPokemon.aiType = AiType.SMART_RANDOM;

    const moveChoices: MoveChoiceSet = {};
    const enemyMoveset = enemyPokemon.getMoveset();
    enemyMoveset.forEach(mv => (moveChoices[mv!.moveId] = 0));
    getEnemyMoveChoices(enemyPokemon, moveChoices);

    enemyMoveset.forEach(mv => {
      if (mv?.getMove().category === MoveCategory.STATUS || mv?.moveId === MoveId.LAST_RESORT) {
        expect(moveChoices[mv.moveId]).toBe(0);
      }
    });
  });
});
