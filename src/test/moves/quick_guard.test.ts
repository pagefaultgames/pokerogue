import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, test } from "vitest";
import GameManager from "../utils/gameManager";
import { Species } from "#enums/species";
import { Abilities } from "#enums/abilities";
import { Moves } from "#enums/moves";
import { Stat } from "#enums/stat";
import { BattlerIndex } from "#app/battle";
import { MoveResult } from "#app/field/pokemon";

const TIMEOUT = 20 * 1000;

describe("Moves - Quick Guard", () => {
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

    game.override.moveset([Moves.QUICK_GUARD, Moves.SPLASH, Moves.FOLLOW_ME]);

    game.override.enemySpecies(Species.SNORLAX);
    game.override.enemyMoveset(Array(4).fill(Moves.QUICK_ATTACK));
    game.override.enemyAbility(Abilities.INSOMNIA);

    game.override.startingLevel(100);
    game.override.enemyLevel(100);
  });

  test(
    "should protect the user and allies from priority moves",
    async () => {
      await game.classicMode.startBattle([Species.CHARIZARD, Species.BLASTOISE]);

      const playerPokemon = game.scene.getPlayerField();

      game.move.select(Moves.QUICK_GUARD);
      game.move.select(Moves.SPLASH, 1);

      await game.phaseInterceptor.to("BerryPhase", false);

      playerPokemon.forEach(p => expect(p.hp).toBe(p.getMaxHp()));
    }, TIMEOUT
  );

  test(
    "should protect the user and allies from Prankster-boosted moves",
    async () => {
      game.override.enemyAbility(Abilities.PRANKSTER);
      game.override.enemyMoveset(Array(4).fill(Moves.GROWL));

      await game.classicMode.startBattle([Species.CHARIZARD, Species.BLASTOISE]);

      const playerPokemon = game.scene.getPlayerField();

      game.move.select(Moves.QUICK_GUARD);
      game.move.select(Moves.SPLASH, 1);

      await game.phaseInterceptor.to("BerryPhase", false);

      playerPokemon.forEach(p => expect(p.getStatStage(Stat.ATK)).toBe(0));
    }, TIMEOUT
  );

  test(
    "should stop subsequent hits of a multi-hit priority move",
    async () => {
      game.override.enemyMoveset(Array(4).fill(Moves.WATER_SHURIKEN));

      await game.classicMode.startBattle([Species.CHARIZARD, Species.BLASTOISE]);

      const playerPokemon = game.scene.getPlayerField();
      const enemyPokemon = game.scene.getEnemyField();

      game.move.select(Moves.QUICK_GUARD);
      game.move.select(Moves.FOLLOW_ME, 1);

      await game.phaseInterceptor.to("BerryPhase", false);

      playerPokemon.forEach(p => expect(p.hp).toBe(p.getMaxHp()));
      enemyPokemon.forEach(p => expect(p.turnData.hitCount).toBe(1));
    }
  );

  test(
    "should fail if the user is the last to move in the turn",
    async () => {
      game.override.battleType("single");
      game.override.enemyMoveset(Array(4).fill(Moves.QUICK_GUARD));

      await game.classicMode.startBattle([Species.CHARIZARD]);

      const playerPokemon = game.scene.getPlayerPokemon()!;
      const enemyPokemon = game.scene.getEnemyPokemon()!;

      game.move.select(Moves.QUICK_GUARD);

      await game.setTurnOrder([BattlerIndex.ENEMY, BattlerIndex.PLAYER]);

      await game.phaseInterceptor.to("BerryPhase", false);

      expect(enemyPokemon.getLastXMoves()[0].result).toBe(MoveResult.SUCCESS);
      expect(playerPokemon.getLastXMoves()[0].result).toBe(MoveResult.FAIL);
    }, TIMEOUT
  );
});
