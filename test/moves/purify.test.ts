import { Status } from "#data/status-effect";
import { BattlerIndex } from "#enums/battler-index";
import { MoveId } from "#enums/move-id";
import { SpeciesId } from "#enums/species-id";
import { StatusEffect } from "#enums/status-effect";
import type { EnemyPokemon, PlayerPokemon } from "#field/pokemon";
import { MoveEndPhase } from "#phases/move-end-phase";
import { GameManager } from "#test/test-utils/game-manager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, test } from "vitest";

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
    game.override
      .battleStyle("single")
      .starterSpecies(SpeciesId.PYUKUMUKU)
      .startingLevel(10)
      .moveset([MoveId.PURIFY, MoveId.SIZZLY_SLIDE])
      .enemySpecies(SpeciesId.MAGIKARP)
      .enemyLevel(10)
      .enemyMoveset([MoveId.SPLASH]);
  });

  test("Purify heals opponent status effect and restores user hp", async () => {
    await game.classicMode.startBattle();

    const enemyPokemon: EnemyPokemon = game.field.getEnemyPokemon();
    const playerPokemon: PlayerPokemon = game.field.getPlayerPokemon();

    playerPokemon.hp = playerPokemon.getMaxHp() - 1;
    enemyPokemon.status = new Status(StatusEffect.BURN);

    game.move.select(MoveId.PURIFY);
    await game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.ENEMY]);
    await game.phaseInterceptor.to(MoveEndPhase);

    expect(enemyPokemon.status).toBeNull();
    expect(playerPokemon.isFullHp()).toBe(true);
  });

  test("Purify does not heal if opponent doesnt have any status effect", async () => {
    await game.classicMode.startBattle();

    const playerPokemon: PlayerPokemon = game.field.getPlayerPokemon();

    playerPokemon.hp = playerPokemon.getMaxHp() - 1;
    const playerInitialHp = playerPokemon.hp;

    game.move.select(MoveId.PURIFY);
    await game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.ENEMY]);
    await game.phaseInterceptor.to(MoveEndPhase);

    expect(playerPokemon.hp).toBe(playerInitialHp);
  });
});
