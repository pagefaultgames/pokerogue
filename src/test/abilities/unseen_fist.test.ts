import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, test, vi } from "vitest";
import GameManager from "../utils/gameManager";
import * as Overrides from "#app/overrides";
import { Species } from "#enums/species";
import { Abilities } from "#enums/abilities";
import { Moves } from "#enums/moves";
import { getMovePosition } from "../utils/gameManagerUtils";
import { TurnEndPhase } from "#app/phases.js";

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
    vi.spyOn(Overrides, "SINGLE_BATTLE_OVERRIDE", "get").mockReturnValue(true);
    vi.spyOn(Overrides, "STARTER_SPECIES_OVERRIDE", "get").mockReturnValue(Species.URSHIFU);
    vi.spyOn(Overrides, "OPP_SPECIES_OVERRIDE", "get").mockReturnValue(Species.SNORLAX);
    vi.spyOn(Overrides, "OPP_MOVESET_OVERRIDE", "get").mockReturnValue([Moves.PROTECT, Moves.PROTECT, Moves.PROTECT, Moves.PROTECT]);
    vi.spyOn(Overrides, "STARTING_LEVEL_OVERRIDE", "get").mockReturnValue(100);
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
      vi.spyOn(Overrides, "PASSIVE_ABILITY_OVERRIDE", "get").mockReturnValue(Abilities.LONG_REACH);
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
  vi.spyOn(Overrides, "MOVESET_OVERRIDE", "get").mockReturnValue([attackMove]);
  vi.spyOn(Overrides, "OPP_MOVESET_OVERRIDE", "get").mockReturnValue([protectMove, protectMove, protectMove, protectMove]);

  await game.startBattle();

  const leadPokemon = game.scene.getPlayerPokemon();
  expect(leadPokemon).not.toBe(undefined);

  const enemyPokemon = game.scene.getEnemyPokemon();
  expect(enemyPokemon).not.toBe(undefined);

  const enemyStartingHp = enemyPokemon.hp;

  game.doAttack(getMovePosition(game.scene, 0, attackMove));
  await game.phaseInterceptor.to(TurnEndPhase);

  if (shouldSucceed) {
    expect(enemyPokemon.hp).toBeLessThan(enemyStartingHp);
  } else {
    expect(enemyPokemon.hp).toBe(enemyStartingHp);
  }
}
