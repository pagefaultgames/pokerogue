import { ArenaTagSide, ArenaTrapTag } from "#app/data/arena-tag";
import { BattleStat } from "#app/data/battle-stat";
import { allMoves } from "#app/data/move";
import { BerryPhase } from "#app/phases/berry-phase";
import { Abilities } from "#enums/abilities";
import { Moves } from "#enums/moves";
import { Species } from "#enums/species";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, test, vi } from "vitest";
import GameManager from "../utils/gameManager";

const TIMEOUT = 20 * 1000;

describe("Moves - Protect", () => {
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

    game.override.moveset([Moves.PROTECT]);
    game.override.enemySpecies(Species.SNORLAX);

    game.override.enemyAbility(Abilities.INSOMNIA);
    game.override.enemyMoveset(Array(4).fill(Moves.TACKLE));

    game.override.startingLevel(100);
    game.override.enemyLevel(100);
  });

  test(
    "should protect the user from attacks",
    async () => {
      await game.startBattle([Species.CHARIZARD]);

      const leadPokemon = game.scene.getPlayerPokemon()!;

      game.move.select(Moves.PROTECT);

      await game.phaseInterceptor.to(BerryPhase, false);

      expect(leadPokemon.hp).toBe(leadPokemon.getMaxHp());
    }, TIMEOUT
  );

  test(
    "should prevent secondary effects from the opponent's attack",
    async () => {
      game.override.enemyMoveset(Array(4).fill(Moves.CEASELESS_EDGE));
      vi.spyOn(allMoves[Moves.CEASELESS_EDGE], "accuracy", "get").mockReturnValue(100);

      await game.startBattle([Species.CHARIZARD]);

      const leadPokemon = game.scene.getPlayerPokemon()!;

      game.move.select(Moves.PROTECT);

      await game.phaseInterceptor.to(BerryPhase, false);

      expect(leadPokemon.hp).toBe(leadPokemon.getMaxHp());
      expect(game.scene.arena.getTagOnSide(ArenaTrapTag, ArenaTagSide.ENEMY)).toBeUndefined();
    }, TIMEOUT
  );

  test(
    "should protect the user from status moves",
    async () => {
      game.override.enemyMoveset(Array(4).fill(Moves.CHARM));

      await game.startBattle([Species.CHARIZARD]);

      const leadPokemon = game.scene.getPlayerPokemon()!;

      game.move.select(Moves.PROTECT);

      await game.phaseInterceptor.to(BerryPhase, false);

      expect(leadPokemon.summonData.battleStats[BattleStat.ATK]).toBe(0);
    }, TIMEOUT
  );

  test(
    "should stop subsequent hits of a multi-hit move",
    async () => {
      game.override.enemyMoveset(Array(4).fill(Moves.TACHYON_CUTTER));

      await game.startBattle([Species.CHARIZARD]);

      const leadPokemon = game.scene.getPlayerPokemon()!;

      const enemyPokemon = game.scene.getEnemyPokemon()!;

      game.move.select(Moves.PROTECT);

      await game.phaseInterceptor.to(BerryPhase, false);

      expect(leadPokemon.hp).toBe(leadPokemon.getMaxHp());
      expect(enemyPokemon.turnData.hitCount).toBe(1);
    }, TIMEOUT
  );
});
