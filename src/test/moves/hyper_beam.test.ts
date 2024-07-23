import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import Phaser from "phaser";
import GameManager from "#app/test/utils/gameManager";
import overrides from "#app/overrides";
import { Abilities } from "#app/enums/abilities.js";
import { Species } from "#app/enums/species.js";
import { Moves } from "#app/enums/moves.js";
import { allMoves } from "#app/data/move.js";
import { getMovePosition } from "../utils/gameManagerUtils";
import { BerryPhase, TurnEndPhase } from "#app/phases.js";
import { BattlerTagType } from "#app/enums/battler-tag-type.js";

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

    vi.spyOn(overrides, "BATTLE_TYPE_OVERRIDE", "get").mockReturnValue("single");
    vi.spyOn(overrides, "ABILITY_OVERRIDE", "get").mockReturnValue(Abilities.BALL_FETCH);
    vi.spyOn(overrides, "OPP_SPECIES_OVERRIDE", "get").mockReturnValue(Species.SNORLAX);
    vi.spyOn(overrides, "OPP_ABILITY_OVERRIDE", "get").mockReturnValue(Abilities.BALL_FETCH);
    vi.spyOn(overrides, "OPP_MOVESET_OVERRIDE", "get").mockReturnValue(Array(4).fill(Moves.SPLASH));

    vi.spyOn(overrides, "MOVESET_OVERRIDE", "get").mockReturnValue([Moves.HYPER_BEAM, Moves.TACKLE]);
    vi.spyOn(allMoves[Moves.HYPER_BEAM], "accuracy", "get").mockReturnValue(100);
  });

  it(
    "should force the user to recharge on the next turn (and only that turn)",
    async () => {
      await game.startBattle([Species.MAGIKARP]);

      const leadPokemon = game.scene.getPlayerPokemon();
      const enemyPokemon = game.scene.getEnemyPokemon();

      game.doAttack(getMovePosition(game.scene, 0, Moves.HYPER_BEAM));

      await game.phaseInterceptor.to(TurnEndPhase);

      expect(enemyPokemon.hp).toBeLessThan(enemyPokemon.getMaxHp());
      expect(leadPokemon.getTag(BattlerTagType.RECHARGING)).toBeDefined();

      const enemyPostAttackHp = enemyPokemon.hp;

      /** Game should progress without a new command from the player */
      await game.phaseInterceptor.to(TurnEndPhase);

      expect(enemyPokemon.hp).toBe(enemyPostAttackHp);
      expect(leadPokemon.getTag(BattlerTagType.RECHARGING)).toBeUndefined();

      game.doAttack(getMovePosition(game.scene, 0, Moves.TACKLE));

      await game.phaseInterceptor.to(BerryPhase, false);

      expect(enemyPokemon.hp).toBeLessThan(enemyPostAttackHp);
    }, TIMEOUT
  );
});
