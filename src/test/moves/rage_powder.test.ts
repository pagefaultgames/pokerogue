import { BattlerIndex } from "#app/battle";
import { Abilities } from "#enums/abilities";
import { Moves } from "#enums/moves";
import { Species } from "#enums/species";
import GameManager from "#test/utils/gameManager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, test } from "vitest";

const TIMEOUT = 20 * 1000;

describe("Moves - Rage Powder", () => {
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
    game.override.enemySpecies(Species.SNORLAX);
    game.override.startingLevel(100);
    game.override.enemyLevel(100);
    game.override.moveset([Moves.FOLLOW_ME, Moves.RAGE_POWDER, Moves.SPOTLIGHT, Moves.QUICK_ATTACK]);
    game.override.enemyMoveset([Moves.RAGE_POWDER, Moves.TACKLE, Moves.SPLASH]);
  });

  test(
    "move effect should be bypassed by Grass type",
    async () => {
      await game.classicMode.startBattle([Species.AMOONGUSS, Species.VENUSAUR]);

      const enemyPokemon = game.scene.getEnemyField();

      game.move.select(Moves.QUICK_ATTACK, 0, BattlerIndex.ENEMY);
      game.move.select(Moves.QUICK_ATTACK, 1, BattlerIndex.ENEMY_2);

      await game.forceEnemyMove(Moves.RAGE_POWDER);
      await game.forceEnemyMove(Moves.SPLASH);

      await game.phaseInterceptor.to("BerryPhase", false);

      // If redirection was bypassed, both enemies should be damaged
      expect(enemyPokemon[0].hp).toBeLessThan(enemyPokemon[0].getMaxHp());
      expect(enemyPokemon[1].hp).toBeLessThan(enemyPokemon[0].getMaxHp());
    }, TIMEOUT
  );

  test(
    "move effect should be bypassed by Overcoat",
    async () => {
      game.override.ability(Abilities.OVERCOAT);

      // Test with two non-Grass type player Pokemon
      await game.classicMode.startBattle([Species.BLASTOISE, Species.CHARIZARD]);

      const enemyPokemon = game.scene.getEnemyField();

      const enemyStartingHp = enemyPokemon.map(p => p.hp);

      game.move.select(Moves.QUICK_ATTACK, 0, BattlerIndex.ENEMY);
      game.move.select(Moves.QUICK_ATTACK, 1, BattlerIndex.ENEMY_2);

      await game.forceEnemyMove(Moves.RAGE_POWDER);
      await game.forceEnemyMove(Moves.SPLASH);

      await game.phaseInterceptor.to("BerryPhase", false);

      // If redirection was bypassed, both enemies should be damaged
      expect(enemyPokemon[0].hp).toBeLessThan(enemyStartingHp[0]);
      expect(enemyPokemon[1].hp).toBeLessThan(enemyStartingHp[1]);
    }, TIMEOUT
  );
});
