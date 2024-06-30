import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, test, vi } from "vitest";
import GameManager from "../utils/gameManager";
import * as Overrides from "#app/overrides";
import { Species } from "#enums/species";
import { Abilities } from "#enums/abilities";
import { Moves } from "#enums/moves";
import { getMovePosition } from "../utils/gameManagerUtils";
import { BerryPhase } from "#app/phases.js";
import { BattleStat } from "#app/data/battle-stat.js";
import { allMoves } from "#app/data/move.js";
import { ArenaTagSide, ArenaTrapTag } from "#app/data/arena-tag.js";

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
    vi.spyOn(Overrides, "SINGLE_BATTLE_OVERRIDE", "get").mockReturnValue(true);
    vi.spyOn(Overrides, "MOVESET_OVERRIDE", "get").mockReturnValue([Moves.PROTECT]);
    vi.spyOn(Overrides, "OPP_SPECIES_OVERRIDE", "get").mockReturnValue(Species.SNORLAX);
    vi.spyOn(Overrides, "OPP_ABILITY_OVERRIDE", "get").mockReturnValue(Abilities.INSOMNIA);
    vi.spyOn(Overrides, "OPP_MOVESET_OVERRIDE", "get").mockReturnValue([Moves.TACKLE, Moves.TACKLE, Moves.TACKLE, Moves.TACKLE]);
    vi.spyOn(Overrides, "STARTING_LEVEL_OVERRIDE", "get").mockReturnValue(100);
    vi.spyOn(Overrides, "OPP_LEVEL_OVERRIDE", "get").mockReturnValue(100);
  });

  test(
    "should protect the user from attacks",
    async () => {
      await game.startBattle([Species.CHARIZARD]);

      const leadPokemon = game.scene.getPlayerPokemon();
      expect(leadPokemon).toBeDefined();

      const enemyPokemon = game.scene.getEnemyPokemon();
      expect(enemyPokemon).toBeDefined();

      game.doAttack(getMovePosition(game.scene, 0, Moves.PROTECT));

      await game.phaseInterceptor.to(BerryPhase, false);

      expect(leadPokemon.hp).toBe(leadPokemon.getMaxHp());
    }, TIMEOUT
  );

  test(
    "should prevent secondary effects from the opponent's attack",
    async () => {
      vi.spyOn(Overrides, "OPP_MOVESET_OVERRIDE", "get").mockReturnValue([Moves.CEASELESS_EDGE,Moves.CEASELESS_EDGE,Moves.CEASELESS_EDGE,Moves.CEASELESS_EDGE]);
      vi.spyOn(allMoves[Moves.CEASELESS_EDGE], "accuracy", "get").mockReturnValue(100);

      await game.startBattle([Species.CHARIZARD]);

      const leadPokemon = game.scene.getPlayerPokemon();
      expect(leadPokemon).toBeDefined();

      const enemyPokemon = game.scene.getEnemyPokemon();
      expect(enemyPokemon).toBeDefined();

      game.doAttack(getMovePosition(game.scene, 0, Moves.PROTECT));

      await game.phaseInterceptor.to(BerryPhase, false);

      expect(leadPokemon.hp).toBe(leadPokemon.getMaxHp());
      expect(game.scene.arena.getTagOnSide(ArenaTrapTag, ArenaTagSide.ENEMY)).toBeUndefined();
    }, TIMEOUT
  );

  test(
    "should protect the user from status moves",
    async () => {
      vi.spyOn(Overrides, "OPP_MOVESET_OVERRIDE", "get").mockReturnValue([Moves.CHARM, Moves.CHARM, Moves.CHARM, Moves.CHARM]);

      await game.startBattle([Species.CHARIZARD]);

      const leadPokemon = game.scene.getPlayerPokemon();
      expect(leadPokemon).toBeDefined();

      const enemyPokemon = game.scene.getEnemyPokemon();
      expect(enemyPokemon).toBeDefined();

      game.doAttack(getMovePosition(game.scene, 0, Moves.PROTECT));

      await game.phaseInterceptor.to(BerryPhase, false);

      expect(leadPokemon.summonData.battleStats[BattleStat.ATK]).toBe(0);
    }, TIMEOUT
  );

  test(
    "should stop subsequent hits of a multi-hit move",
    async () => {
      vi.spyOn(Overrides, "OPP_MOVESET_OVERRIDE", "get").mockReturnValue([Moves.TACHYON_CUTTER,Moves.TACHYON_CUTTER,Moves.TACHYON_CUTTER,Moves.TACHYON_CUTTER]);

      await game.startBattle([Species.CHARIZARD]);

      const leadPokemon = game.scene.getPlayerPokemon();
      expect(leadPokemon).toBeDefined();

      const enemyPokemon = game.scene.getEnemyPokemon();
      expect(enemyPokemon).toBeDefined();

      game.doAttack(getMovePosition(game.scene, 0, Moves.PROTECT));

      await game.phaseInterceptor.to(BerryPhase, false);

      expect(leadPokemon.hp).toBe(leadPokemon.getMaxHp());
      expect(enemyPokemon.turnData.hitCount).toBe(1);
    }, TIMEOUT
  );
});
