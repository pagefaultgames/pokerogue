import { TurnEndPhase } from "#app/phases/turn-end-phase";
import { Abilities } from "#enums/abilities";
import { Moves } from "#enums/moves";
import { Species } from "#enums/species";
import GameManager from "#test/utils/gameManager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { BattlerTagType } from "#app/enums/battler-tag-type";
import { BerryPhase } from "#app/phases/berry-phase";



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

  it(
    "should cause a contact move to ignore Protect",
    () => testUnseenFistHitResult(game, Moves.QUICK_ATTACK, Moves.PROTECT, true),
  );

  it(
    "should not cause a non-contact move to ignore Protect",
    () => testUnseenFistHitResult(game, Moves.ABSORB, Moves.PROTECT, false),
  );

  it(
    "should not apply if the source has Long Reach",
    () => {
      game.override.passiveAbility(Abilities.LONG_REACH);
      testUnseenFistHitResult(game, Moves.QUICK_ATTACK, Moves.PROTECT, false);
    }
  );

  it(
    "should cause a contact move to ignore Wide Guard",
    () => testUnseenFistHitResult(game, Moves.BREAKING_SWIPE, Moves.WIDE_GUARD, true),
  );

  it(
    "should not cause a non-contact move to ignore Wide Guard",
    () => testUnseenFistHitResult(game, Moves.BULLDOZE, Moves.WIDE_GUARD, false),
  );

  it(
    "should cause a contact move to ignore Protect, but not Substitute",
    async () => {
      game.override.enemyLevel(1);
      game.override.moveset([Moves.TACKLE]);

      await game.startBattle();

      const enemyPokemon = game.scene.getEnemyPokemon()!;
      enemyPokemon.addTag(BattlerTagType.SUBSTITUTE, 0, Moves.NONE, enemyPokemon.id);

      game.move.select(Moves.TACKLE);

      await game.phaseInterceptor.to(BerryPhase, false);

      expect(enemyPokemon.getTag(BattlerTagType.SUBSTITUTE)).toBeUndefined();
      expect(enemyPokemon.hp).toBe(enemyPokemon.getMaxHp());
    }
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
