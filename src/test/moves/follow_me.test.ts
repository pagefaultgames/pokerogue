import { Stat } from "#enums/stat";
import { BattlerIndex } from "#app/battle";
import { Abilities } from "#app/enums/abilities";
import { TurnEndPhase } from "#app/phases/turn-end-phase";
import { Moves } from "#enums/moves";
import { Species } from "#enums/species";
import GameManager from "#test/utils/gameManager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, test } from "vitest";

const TIMEOUT = 20 * 1000;

describe("Moves - Follow Me", () => {
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
    game.override.ability(Abilities.BALL_FETCH);
    game.override.enemySpecies(Species.SNORLAX);
    game.override.startingLevel(100);
    game.override.enemyLevel(100);
    game.override.moveset([Moves.FOLLOW_ME, Moves.RAGE_POWDER, Moves.SPOTLIGHT, Moves.QUICK_ATTACK]);
    game.override.enemyMoveset([Moves.TACKLE, Moves.FOLLOW_ME, Moves.SPLASH]);
  });

  test(
    "move should redirect enemy attacks to the user",
    async () => {
      await game.classicMode.startBattle([Species.AMOONGUSS, Species.CHARIZARD]);

      const playerPokemon = game.scene.getPlayerField();

      game.move.select(Moves.FOLLOW_ME);
      game.move.select(Moves.QUICK_ATTACK, 1, BattlerIndex.ENEMY);

      // Force both enemies to target the player Pokemon that did not use Follow Me
      await game.forceEnemyMove(Moves.TACKLE, BattlerIndex.PLAYER_2);
      await game.forceEnemyMove(Moves.TACKLE, BattlerIndex.PLAYER_2);

      await game.phaseInterceptor.to(TurnEndPhase, false);

      expect(playerPokemon[0].hp).toBeLessThan(playerPokemon[0].getMaxHp());
      expect(playerPokemon[1].hp).toBe(playerPokemon[1].getMaxHp());
    }, TIMEOUT
  );

  test(
    "move should redirect enemy attacks to the first ally that uses it",
    async () => {
      await game.classicMode.startBattle([Species.AMOONGUSS, Species.CHARIZARD]);

      const playerPokemon = game.scene.getPlayerField();

      game.move.select(Moves.FOLLOW_ME);
      game.move.select(Moves.FOLLOW_ME, 1);

      // Each player is targeted by an enemy
      await game.forceEnemyMove(Moves.TACKLE, BattlerIndex.PLAYER);
      await game.forceEnemyMove(Moves.TACKLE, BattlerIndex.PLAYER_2);

      await game.phaseInterceptor.to(TurnEndPhase, false);

      playerPokemon.sort((a, b) => a.getEffectiveStat(Stat.SPD) - b.getEffectiveStat(Stat.SPD));

      expect(playerPokemon[1].hp).toBeLessThan(playerPokemon[1].getMaxHp());
      expect(playerPokemon[0].hp).toBe(playerPokemon[0].getMaxHp());
    }, TIMEOUT
  );

  test(
    "move effect should be bypassed by Stalwart",
    async () => {
      game.override.ability(Abilities.STALWART);
      game.override.moveset([Moves.QUICK_ATTACK]);

      await game.classicMode.startBattle([Species.AMOONGUSS, Species.CHARIZARD]);

      const enemyPokemon = game.scene.getEnemyField();

      game.move.select(Moves.QUICK_ATTACK, 0, BattlerIndex.ENEMY);
      game.move.select(Moves.QUICK_ATTACK, 1, BattlerIndex.ENEMY_2);

      // Target doesn't need to be specified if the move is self-targeted
      await game.forceEnemyMove(Moves.FOLLOW_ME);
      await game.forceEnemyMove(Moves.SPLASH);

      await game.phaseInterceptor.to(TurnEndPhase, false);

      // If redirection was bypassed, both enemies should be damaged
      expect(enemyPokemon[0].hp).toBeLessThan(enemyPokemon[0].getMaxHp());
      expect(enemyPokemon[1].hp).toBeLessThan(enemyPokemon[1].getMaxHp());
    }, TIMEOUT
  );

  test(
    "move effect should be bypassed by Snipe Shot",
    async () => {
      game.override.moveset([Moves.SNIPE_SHOT]);

      await game.classicMode.startBattle([Species.AMOONGUSS, Species.CHARIZARD]);

      const enemyPokemon = game.scene.getEnemyField();

      game.move.select(Moves.SNIPE_SHOT, 0, BattlerIndex.ENEMY);
      game.move.select(Moves.SNIPE_SHOT, 1, BattlerIndex.ENEMY_2);

      await game.forceEnemyMove(Moves.FOLLOW_ME);
      await game.forceEnemyMove(Moves.SPLASH);

      await game.phaseInterceptor.to(TurnEndPhase, false);

      // If redirection was bypassed, both enemies should be damaged
      expect(enemyPokemon[0].hp).toBeLessThan(enemyPokemon[0].getMaxHp());
      expect(enemyPokemon[1].hp).toBeLessThan(enemyPokemon[1].getMaxHp());
    }, TIMEOUT
  );
});
