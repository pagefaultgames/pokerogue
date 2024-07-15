import {afterEach, beforeAll, beforeEach, describe, expect, test, vi} from "vitest";
import Phaser from "phaser";
import GameManager from "#app/test/utils/gameManager";
import overrides from "#app/overrides";
import {
  MoveEndPhase,
} from "#app/phases";
import {getMovePosition} from "#app/test/utils/gameManagerUtils";
import { Moves } from "#enums/moves";
import { Species } from "#enums/species";
import { EnemyPokemon, PlayerPokemon } from "#app/field/pokemon.js";
import { Status, StatusEffect } from "#app/data/status-effect.js";

const TIMEOUT = 20 * 1000;

describe("Moves - Purify", () => {
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

    vi.spyOn(overrides, "STARTER_SPECIES_OVERRIDE", "get").mockReturnValue(Species.PYUKUMUKU);
    vi.spyOn(overrides, "STARTING_LEVEL_OVERRIDE", "get").mockReturnValue(10);
    vi.spyOn(overrides, "MOVESET_OVERRIDE", "get").mockReturnValue([Moves.PURIFY, Moves.SIZZLY_SLIDE]);

    vi.spyOn(overrides, "OPP_SPECIES_OVERRIDE", "get").mockReturnValue(Species.MAGIKARP);
    vi.spyOn(overrides, "OPP_LEVEL_OVERRIDE", "get").mockReturnValue(10);
    vi.spyOn(overrides, "OPP_MOVESET_OVERRIDE", "get").mockReturnValue([Moves.SPLASH, Moves.NONE, Moves.NONE, Moves.NONE]);
  });

  test(
    "Purify heals opponent status effect and restores user hp",
    async () => {
      await game.startBattle();

      const enemyPokemon: EnemyPokemon = game.scene.getEnemyPokemon();
      const playerPokemon: PlayerPokemon = game.scene.getPlayerPokemon();

      playerPokemon.hp = playerPokemon.getMaxHp() - 1;
      enemyPokemon.status = new Status(StatusEffect.BURN);

      game.doAttack(getMovePosition(game.scene, 0, Moves.PURIFY));
      await game.phaseInterceptor.to(MoveEndPhase);

      expect(enemyPokemon.status).toBe(undefined);
      expect(playerPokemon.hp).toBe(playerPokemon.getMaxHp());
    },
    TIMEOUT
  );

  test(
    "Purify does not heal if opponent doesnt have any status effect",
    async () => {
      await game.startBattle();

      const playerPokemon: PlayerPokemon = game.scene.getPlayerPokemon();

      playerPokemon.hp = playerPokemon.getMaxHp() - 1;
      const playerInitialHp = playerPokemon.hp;

      game.doAttack(getMovePosition(game.scene, 0, Moves.PURIFY));
      await game.phaseInterceptor.to(MoveEndPhase);

      expect(playerPokemon.hp).toBe(playerInitialHp);
    },
    TIMEOUT
  );

});
