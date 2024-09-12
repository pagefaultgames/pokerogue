import { BattlerIndex } from "#app/battle";
import { Moves } from "#app/enums/moves";
import { Species } from "#app/enums/species";
import { Stat } from "#app/enums/stat";
import { Abilities } from "#enums/abilities";
import GameManager from "#test/utils/gameManager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";

describe("Abilities - Gorilla Tactics", () => {
  let phaserGame: Phaser.Game;
  let game: GameManager;
  const TIMEOUT = 20 * 1000;

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
    game.override
      .battleType("single")
      .enemyAbility(Abilities.BALL_FETCH)
      .enemyMoveset([Moves.SPLASH, Moves.DISABLE])
      .enemySpecies(Species.MAGIKARP)
      .enemyLevel(30)
      .moveset([Moves.SPLASH, Moves.TACKLE, Moves.GROWL])
      .ability(Abilities.GORILLA_TACTICS);
  });

  it(
    "boosts the Pokémon's Attack by 50%, but limits the Pokémon to using only one move",
    async () => {
      await game.classicMode.startBattle([Species.GALAR_DARMANITAN]);

      const darmanitan = game.scene.getPlayerPokemon()!;
      const initialAtkStat = darmanitan.getStat(Stat.ATK);

      game.move.select(Moves.SPLASH);
      await game.forceEnemyMove(Moves.SPLASH);

      await game.phaseInterceptor.to("TurnEndPhase");

      expect(darmanitan.getStat(Stat.ATK, false)).toBeCloseTo(initialAtkStat * 1.5);
      // Other moves should be restricted
      expect(darmanitan.isMoveRestricted(Moves.TACKLE)).toBe(true);
      expect(darmanitan.isMoveRestricted(Moves.SPLASH)).toBe(false);
    },
    TIMEOUT,
  );

  it(
    "should struggle if the only usable move is disabled",
    async () => {
      await game.classicMode.startBattle([Species.GALAR_DARMANITAN]);

      const darmanitan = game.scene.getPlayerPokemon()!;
      const enemy = game.scene.getEnemyPokemon()!;

      // First turn, lock move to Growl
      game.move.select(Moves.GROWL);
      await game.forceEnemyMove(Moves.SPLASH);

      // Second turn, Growl is interrupted by Disable
      await game.toNextTurn();

      game.move.select(Moves.GROWL);
      await game.forceEnemyMove(Moves.DISABLE);
      await game.setTurnOrder([BattlerIndex.ENEMY, BattlerIndex.PLAYER]);

      await game.phaseInterceptor.to("TurnEndPhase");
      expect(enemy.getStatStage(Stat.ATK)).toBe(-1); // Only the effect of the first Growl should be applied

      // Third turn, Struggle is used
      await game.toNextTurn();

      game.move.select(Moves.TACKLE);
      await game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.ENEMY]);

      await game.phaseInterceptor.to("MoveEndPhase");
      expect(darmanitan.hp).toBeLessThan(darmanitan.getMaxHp());
    },
    TIMEOUT,
  );
});
