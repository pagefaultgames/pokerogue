import { TurnEndPhase } from "#app/phases/turn-end-phase";
import { Abilities } from "#enums/abilities";
import { Moves } from "#enums/moves";
import { Species } from "#enums/species";
import GameManager from "#test/utils/gameManager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, test } from "vitest";

const TIMEOUT = 20 * 1000;

describe("Abilities - Unseen Fist", () => {
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
    game.override.battleType("single");
    game.override.starterSpecies(Species.URSHIFU);
    game.override.enemySpecies(Species.SNORLAX);
    game.override.enemyMoveset([Moves.PROTECT, Moves.PROTECT, Moves.PROTECT, Moves.PROTECT]);
    game.override.startingLevel(100);
    game.override.enemyLevel(100);
  });

  test(
    "ability causes a contact move to ignore Protect",
    () => testUnseenFistHitResult(game, Moves.QUICK_ATTACK, Moves.PROTECT, true),
    TIMEOUT
  );

  test(
    "ability does not cause a non-contact move to ignore Protect",
    () => testUnseenFistHitResult(game, Moves.ABSORB, Moves.PROTECT, false),
    TIMEOUT
  );

  test(
    "ability does not apply if the source has Long Reach",
    () => {
      game.override.passiveAbility(Abilities.LONG_REACH);
      testUnseenFistHitResult(game, Moves.QUICK_ATTACK, Moves.PROTECT, false);
    }, TIMEOUT
  );

  test(
    "ability causes a contact move to ignore Wide Guard",
    () => testUnseenFistHitResult(game, Moves.BREAKING_SWIPE, Moves.WIDE_GUARD, true),
    TIMEOUT
  );

  test(
    "ability does not cause a non-contact move to ignore Wide Guard",
    () => testUnseenFistHitResult(game, Moves.BULLDOZE, Moves.WIDE_GUARD, false),
    TIMEOUT
  );
});

async function testUnseenFistHitResult(game: GameManager, attackMove: Moves, protectMove: Moves, shouldSucceed: boolean = true): Promise<void> {
  game.override.moveset([attackMove]);
  game.override.enemyMoveset([protectMove, protectMove, protectMove, protectMove]);

  await game.startBattle();

  const leadPokemon = game.scene.getPlayerPokemon()!;
  expect(leadPokemon).not.toBe(undefined);

  const enemyPokemon = game.scene.getEnemyPokemon()!;
  expect(enemyPokemon).not.toBe(undefined);

  const enemyStartingHp = enemyPokemon.hp;

  game.move.select(attackMove);
  await game.phaseInterceptor.to(TurnEndPhase, false);

  if (shouldSucceed) {
    expect(enemyPokemon.hp).toBeLessThan(enemyStartingHp);
  } else {
    expect(enemyPokemon.hp).toBe(enemyStartingHp);
  }
}
