import {afterEach, beforeAll, beforeEach, describe, expect, test, vi} from "vitest";
import Phaser from "phaser";
import GameManager from "#app/test/utils/gameManager";
import * as overrides from "#app/overrides";
import {
  TurnEndPhase
} from "#app/phases";
import {getMovePosition} from "#app/test/utils/gameManagerUtils";
import { Moves } from "#enums/moves";
import { Species } from "#enums/species";
import { ArenaTagType } from "#app/enums/arena-tag-type.js";
import { allMoves } from "#app/data/move.js";

const TIMEOUT = 20 * 1000;

describe("Moves - Ceaseless Edge", () => {
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
    vi.spyOn(overrides, "SINGLE_BATTLE_OVERRIDE", "get").mockReturnValue(true);
    vi.spyOn(overrides, "OPP_SPECIES_OVERRIDE", "get").mockReturnValue(Species.PIDGEY);
    vi.spyOn(overrides, "STARTING_LEVEL_OVERRIDE", "get").mockReturnValue(100);
    vi.spyOn(overrides, "OPP_LEVEL_OVERRIDE", "get").mockReturnValue(100);
    vi.spyOn(overrides, "MOVESET_OVERRIDE", "get").mockReturnValue([ Moves.CEASELESS_EDGE ]);
    vi.spyOn(overrides, "OPP_MOVESET_OVERRIDE", "get").mockReturnValue([Moves.SPLASH,Moves.SPLASH,Moves.SPLASH,Moves.SPLASH]);
    vi.spyOn(allMoves[Moves.CEASELESS_EDGE], "accuracy", "get").mockReturnValue(100);

  });

  test(
    "move should hit and apply spikes",
    async () => {
      await game.startBattle([ Species.ILLUMISE ]);

      const leadPokemon = game.scene.getPlayerPokemon();
      expect(leadPokemon).toBeDefined();

      const enemyPokemon = game.scene.getEnemyPokemon();
      expect(enemyPokemon).toBeDefined();

      const enemyStartingHp = enemyPokemon.hp;

      game.doAttack(getMovePosition(game.scene, 0, Moves.CEASELESS_EDGE));

      await game.phaseInterceptor.to(TurnEndPhase);

      const tag = game.scene.arena.getTagOnSide(ArenaTagType.SPIKES, ArenaTagSide.ENEMY) as ArenaTrapTag;

      expect(tag.layers).toBe(1);
      expect(enemyPokemon.hp).toBeLessThan(enemyStartingHp);
    }, TIMEOUT
  );

  test(
    "move should hit twice with multi lens and apply two layers of spikes",
    async () => {
      vi.spyOn(overrides, "STARTING_HELD_ITEMS_OVERRIDE", "get").mockReturnValue([{name: "MULTI_LENS"}]);

      await game.startBattle([ Species.ILLUMISE ]);

      const leadPokemon = game.scene.getPlayerPokemon();
      expect(leadPokemon).toBeDefined();

      const enemyPokemon = game.scene.getEnemyPokemon();
      expect(enemyPokemon).toBeDefined();

      const enemyStartingHp = enemyPokemon.hp;

      game.doAttack(getMovePosition(game.scene, 0, Moves.CEASELESS_EDGE));

      await game.phaseInterceptor.to(TurnEndPhase);

      const tag = game.scene.arena.getTagOnSide(ArenaTagType.SPIKES, ArenaTagSide.ENEMY) as ArenaTrapTag;

      expect(tag.layers).toBe(2);
      expect(enemyPokemon.hp).toBeLessThan(enemyStartingHp);
    }, TIMEOUT
  );

  test(
    "move should hit twice, apply two layers of spikes, and deal damage on switch in",
    async () => {
      vi.spyOn(overrides, "STARTING_HELD_ITEMS_OVERRIDE", "get").mockReturnValue([{name: "MULTI_LENS"}]);

      await game.startBattle([ Species.ILLUMISE ]);

      const leadPokemon = game.scene.getPlayerPokemon();
      expect(leadPokemon).toBeDefined();

      const enemyPokemon = game.scene.getEnemyPokemon();
      expect(enemyPokemon).toBeDefined();

      const enemyStartingHp = enemyPokemon.hp;

      game.doAttack(getMovePosition(game.scene, 0, Moves.CEASELESS_EDGE));

      await game.phaseInterceptor.to(TurnEndPhase);

      const tag = game.scene.arena.getTagOnSide(ArenaTagType.SPIKES, ArenaTagSide.ENEMY) as ArenaTrapTag;

      expect(tag.layers).toBe(2);
      expect(enemyPokemon.hp).toBeLessThan(enemyStartingHp);
    }, TIMEOUT
  );
});
