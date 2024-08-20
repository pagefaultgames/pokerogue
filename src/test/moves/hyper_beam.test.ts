import { allMoves } from "#app/data/move";
import { Abilities } from "#app/enums/abilities";
import { BattlerTagType } from "#app/enums/battler-tag-type";
import { Moves } from "#app/enums/moves";
import { Species } from "#app/enums/species";
import { BerryPhase } from "#app/phases/berry-phase";
import { TurnEndPhase } from "#app/phases/turn-end-phase";
import GameManager from "#test/utils/gameManager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

const TIMEOUT = 20 * 1000; // 20 sec timeout for all tests

describe("Moves - Hyper Beam", () => {
  let phaserGame: Phaser.Game;
  let game: GameManager;

  beforeAll(() => {
    phaserGame = new Phaser.Game({
      type: Phaser.HEADLESS
    });
  });

  afterEach(() => {
    game.phaseInterceptor.restoreOg();
  });

  beforeEach(() => {
    game = new GameManager(phaserGame);

    game.override.battleType("single");
    game.override.ability(Abilities.BALL_FETCH);
    game.override.enemySpecies(Species.SNORLAX);
    game.override.enemyAbility(Abilities.BALL_FETCH);
    game.override.enemyMoveset(Array(4).fill(Moves.SPLASH));
    game.override.enemyLevel(100);

    game.override.moveset([Moves.HYPER_BEAM, Moves.TACKLE]);
    vi.spyOn(allMoves[Moves.HYPER_BEAM], "accuracy", "get").mockReturnValue(100);
  });

  it(
    "should force the user to recharge on the next turn (and only that turn)",
    async () => {
      await game.startBattle([Species.MAGIKARP]);

      const leadPokemon = game.scene.getPlayerPokemon()!;
      const enemyPokemon = game.scene.getEnemyPokemon()!;

      game.move.select(Moves.HYPER_BEAM);

      await game.phaseInterceptor.to(TurnEndPhase);

      expect(enemyPokemon.hp).toBeLessThan(enemyPokemon.getMaxHp());
      expect(leadPokemon.getTag(BattlerTagType.RECHARGING)).toBeDefined();

      const enemyPostAttackHp = enemyPokemon.hp;

      /** Game should progress without a new command from the player */
      await game.phaseInterceptor.to(TurnEndPhase);

      expect(enemyPokemon.hp).toBe(enemyPostAttackHp);
      expect(leadPokemon.getTag(BattlerTagType.RECHARGING)).toBeUndefined();

      game.move.select(Moves.TACKLE);

      await game.phaseInterceptor.to(BerryPhase, false);

      expect(enemyPokemon.hp).toBeLessThan(enemyPostAttackHp);
    }, TIMEOUT
  );
});
