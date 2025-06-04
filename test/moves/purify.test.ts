import { BattlerIndex } from "#app/battle";
import { Status } from "#app/data/status-effect";
import type { EnemyPokemon, PlayerPokemon } from "#app/field/pokemon";
import { MoveEndPhase } from "#app/phases/move-end-phase";
import { MoveId } from "#enums/move-id";
import { SpeciesId } from "#enums/species-id";
import { StatusEffect } from "#enums/status-effect";
import GameManager from "#test/testUtils/gameManager";
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
    game.override.battleStyle("single");

    game.override.starterSpecies(SpeciesId.PYUKUMUKU);
    game.override.startingLevel(10);
    game.override.moveset([MoveId.PURIFY, MoveId.SIZZLY_SLIDE]);

    game.override.enemySpecies(SpeciesId.MAGIKARP);
    game.override.enemyLevel(10);
    game.override.enemyMoveset([MoveId.SPLASH, MoveId.NONE, MoveId.NONE, MoveId.NONE]);
  });

  test("Purify heals opponent status effect and restores user hp", async () => {
    await game.classicMode.startBattle();

    const enemyPokemon: EnemyPokemon = game.scene.getEnemyPokemon()!;
    const playerPokemon: PlayerPokemon = game.scene.getPlayerPokemon()!;

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

    const playerPokemon: PlayerPokemon = game.scene.getPlayerPokemon()!;

    playerPokemon.hp = playerPokemon.getMaxHp() - 1;
    const playerInitialHp = playerPokemon.hp;

    game.move.select(MoveId.PURIFY);
    await game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.ENEMY]);
    await game.phaseInterceptor.to(MoveEndPhase);

    expect(playerPokemon.hp).toBe(playerInitialHp);
  });
});
