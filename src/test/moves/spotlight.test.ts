import { BattlerIndex } from "#app/battle";
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
    game.override.enemyMoveset([Moves.FOLLOW_ME, Moves.SPLASH]);
  });

  test(
    "move should redirect attacks to the target",
    async () => {
      await game.classicMode.startBattle([Species.AMOONGUSS, Species.CHARIZARD]);

      const enemyPokemon = game.scene.getEnemyField();

      game.move.select(Moves.SPOTLIGHT, 0, BattlerIndex.ENEMY);
      game.move.select(Moves.QUICK_ATTACK, 1, BattlerIndex.ENEMY_2);

      await game.forceEnemyMove(Moves.SPLASH);
      await game.forceEnemyMove(Moves.SPLASH);

      await game.phaseInterceptor.to(TurnEndPhase, false);

      expect(enemyPokemon[0].hp).toBeLessThan(enemyPokemon[0].getMaxHp());
      expect(enemyPokemon[1].hp).toBe(enemyPokemon[1].getMaxHp());
    }, TIMEOUT
  );

  test(
    "move should cause other redirection moves to fail",
    async () => {
      await game.classicMode.startBattle([Species.AMOONGUSS, Species.CHARIZARD]);

      const enemyPokemon = game.scene.getEnemyField();

      game.move.select(Moves.SPOTLIGHT, 0, BattlerIndex.ENEMY);
      game.move.select(Moves.QUICK_ATTACK, 1, BattlerIndex.ENEMY_2);

      await game.forceEnemyMove(Moves.SPLASH);
      await game.forceEnemyMove(Moves.FOLLOW_ME);

      await game.phaseInterceptor.to("BerryPhase", false);

      expect(enemyPokemon[0].hp).toBeLessThan(enemyPokemon[0].getMaxHp());
      expect(enemyPokemon[1].hp).toBe(enemyPokemon[1].getMaxHp());
    }, TIMEOUT
  );
});
