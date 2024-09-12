import { BattlerIndex } from "#app/battle";
import { Type } from "#app/data/type";
import { Moves } from "#app/enums/moves";
import { Species } from "#app/enums/species";
import { Stat } from "#app/enums/stat";
import { Abilities } from "#enums/abilities";
import GameManager from "#test/utils/gameManager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

describe("Moves - Tar Shot", () => {
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
      .enemyMoveset(Moves.SPLASH)
      .enemySpecies(Species.TANGELA)
      .enemyLevel(1000)
      .moveset([Moves.TAR_SHOT, Moves.FIRE_PUNCH])
      .disableCrits();
  });

  it(
    "lowers the target's Speed stat by one stage and doubles the effectiveness of Fire-type moves used on the target",
    async () => {
      await game.classicMode.startBattle([Species.PIKACHU]);

      const enemy = game.scene.getEnemyPokemon()!;

      vi.spyOn(enemy, "getMoveEffectiveness");

      game.move.select(Moves.TAR_SHOT);

      await game.phaseInterceptor.to("TurnEndPhase");
      expect(enemy.getStatStage(Stat.SPD)).toBe(-1);

      await game.toNextTurn();

      game.move.select(Moves.FIRE_PUNCH);
      await game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.ENEMY]);

      await game.phaseInterceptor.to("MoveEndPhase");
      expect(enemy.getMoveEffectiveness).toHaveReturnedWith(4);
    },
    TIMEOUT,
  );

  it(
    "will not double the effectiveness of Fire-type moves used on a target that is already under the effect of Tar Shot (but may still lower its Speed)",
    async () => {
      await game.classicMode.startBattle([Species.PIKACHU]);

      const enemy = game.scene.getEnemyPokemon()!;

      vi.spyOn(enemy, "getMoveEffectiveness");

      game.move.select(Moves.TAR_SHOT);

      await game.phaseInterceptor.to("TurnEndPhase");
      expect(enemy.getStatStage(Stat.SPD)).toBe(-1);

      await game.toNextTurn();

      game.move.select(Moves.TAR_SHOT);

      await game.phaseInterceptor.to("TurnEndPhase");
      expect(enemy.getStatStage(Stat.SPD)).toBe(-2);

      await game.toNextTurn();

      game.move.select(Moves.FIRE_PUNCH);
      await game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.ENEMY]);

      await game.phaseInterceptor.to("MoveEndPhase");
      expect(enemy.getMoveEffectiveness).toHaveReturnedWith(4);
    },
    TIMEOUT,
  );

  it(
    "does not double the effectiveness of Fire-type moves against a Pokémon that is Terastallized",
    async () => {
      game.override.enemyHeldItems([{ name: "TERA_SHARD", type: Type.GRASS }]).enemySpecies(Species.SPRIGATITO);
      await game.classicMode.startBattle([Species.PIKACHU]);

      const enemy = game.scene.getEnemyPokemon()!;

      vi.spyOn(enemy, "getMoveEffectiveness");

      game.move.select(Moves.TAR_SHOT);

      await game.phaseInterceptor.to("TurnEndPhase");
      expect(enemy.getStatStage(Stat.SPD)).toBe(-1);

      await game.toNextTurn();

      game.move.select(Moves.FIRE_PUNCH);
      await game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.ENEMY]);

      await game.phaseInterceptor.to("MoveEndPhase");
      expect(enemy.getMoveEffectiveness).toHaveReturnedWith(2);
    },
    TIMEOUT,
  );

  it(
    "doubles the effectiveness of Fire-type moves against a Pokémon that is already under the effects of Tar Shot before it Terastallized",
    async () => {
      game.override.enemySpecies(Species.SPRIGATITO);
      await game.classicMode.startBattle([Species.PIKACHU]);

      const enemy = game.scene.getEnemyPokemon()!;

      vi.spyOn(enemy, "getMoveEffectiveness");

      game.move.select(Moves.TAR_SHOT);

      await game.phaseInterceptor.to("TurnEndPhase");
      expect(enemy.getStatStage(Stat.SPD)).toBe(-1);

      await game.toNextTurn();

      game.override.enemyHeldItems([{ name: "TERA_SHARD", type: Type.GRASS }]);

      game.move.select(Moves.FIRE_PUNCH);
      await game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.ENEMY]);

      await game.phaseInterceptor.to("MoveEndPhase");
      expect(enemy.getMoveEffectiveness).toHaveReturnedWith(4);
    },
    TIMEOUT,
  );
});
