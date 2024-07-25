import { Status, StatusEffect } from "#app/data/status-effect.js";
import { EnemyPokemon, PlayerPokemon } from "#app/field/pokemon.js";
import {
  MoveEndPhase,
} from "#app/phases";
import GameManager from "#app/test/utils/gameManager";
import { getMovePosition } from "#app/test/utils/gameManagerUtils";
import { Moves } from "#enums/moves";
import { Species } from "#enums/species";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, test } from "vitest";

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
    game.override.battleType("single");

    game.override.starterSpecies(Species.PYUKUMUKU);
    game.override.startingLevel(10);
    game.override.moveset([Moves.PURIFY, Moves.SIZZLY_SLIDE]);

    game.override.enemySpecies(Species.MAGIKARP);
    game.override.enemyLevel(10);
    game.override.enemyMoveset([Moves.SPLASH, Moves.NONE, Moves.NONE, Moves.NONE]);
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
      expect(playerPokemon.isFullHp()).toBe(true);
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
