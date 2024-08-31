import { BattlerIndex } from "#app/battle";
import { Stat } from "#app/data/pokemon-stat";
import { TurnEndPhase } from "#app/phases/turn-end-phase";
import { Moves } from "#enums/moves";
import { Species } from "#enums/species";
import GameManager from "#test/utils/gameManager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, test } from "vitest";

const TIMEOUT = 20 * 1000;

describe("Moves - Spotlight", () => {
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
    game.override.battleType("double");
    game.override.starterSpecies(Species.AMOONGUSS);
    game.override.enemySpecies(Species.SNORLAX);
    game.override.startingLevel(100);
    game.override.enemyLevel(100);
    game.override.moveset([Moves.FOLLOW_ME, Moves.RAGE_POWDER, Moves.SPOTLIGHT, Moves.QUICK_ATTACK]);
    game.override.enemyMoveset([Moves.TACKLE, Moves.TACKLE, Moves.TACKLE, Moves.TACKLE]);
  });

  test(
    "move should redirect attacks to the target",
    async () => {
      await game.startBattle([Species.AMOONGUSS, Species.CHARIZARD]);

      const enemyPokemon = game.scene.getEnemyField();

      const enemyStartingHp = enemyPokemon.map(p => p.hp);

      game.move.select(Moves.SPOTLIGHT, 0, BattlerIndex.ENEMY);
      game.move.select(Moves.QUICK_ATTACK, 1, BattlerIndex.ENEMY_2);
      await game.phaseInterceptor.to(TurnEndPhase, false);

      expect(enemyPokemon[0].hp).toBeLessThan(enemyStartingHp[0]);
      expect(enemyPokemon[1].hp).toBe(enemyStartingHp[1]);
    }, TIMEOUT
  );

  test(
    "move should cause other redirection moves to fail",
    async () => {
      game.override.enemyMoveset([Moves.FOLLOW_ME, Moves.FOLLOW_ME, Moves.FOLLOW_ME, Moves.FOLLOW_ME]);

      await game.startBattle([Species.AMOONGUSS, Species.CHARIZARD]);

      const enemyPokemon = game.scene.getEnemyField();

      /**
       * Spotlight will target the slower enemy. In this situation without Spotlight being used,
       * the faster enemy would normally end up with the Center of Attention tag.
       */
      enemyPokemon.sort((a, b) => b.getBattleStat(Stat.SPD) - a.getBattleStat(Stat.SPD));
      const spotTarget = enemyPokemon[1].getBattlerIndex();
      const attackTarget = enemyPokemon[0].getBattlerIndex();

      const enemyStartingHp = enemyPokemon.map(p => p.hp);

      game.move.select(Moves.SPOTLIGHT, 0, spotTarget);
      game.move.select(Moves.QUICK_ATTACK, 1, attackTarget);
      await game.phaseInterceptor.to(TurnEndPhase, false);

      expect(enemyPokemon[1].hp).toBeLessThan(enemyStartingHp[1]);
      expect(enemyPokemon[0].hp).toBe(enemyStartingHp[0]);
    }, TIMEOUT
  );
});
