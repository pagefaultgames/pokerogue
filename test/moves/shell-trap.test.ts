import { allMoves } from "#data/data-lists";
import { BattlerIndex } from "#enums/battler-index";
import { MoveId } from "#enums/move-id";
import { MoveResult } from "#enums/move-result";
import { SpeciesId } from "#enums/species-id";
import { BerryPhase } from "#phases/berry-phase";
import { MoveEndPhase } from "#phases/move-end-phase";
import { MovePhase } from "#phases/move-phase";
import { GameManager } from "#test/test-utils/game-manager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

describe("Moves - Shell Trap", () => {
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
      .battleStyle("double")
      .moveset([MoveId.SHELL_TRAP, MoveId.SPLASH, MoveId.BULLDOZE])
      .enemySpecies(SpeciesId.SNORLAX)
      .enemyMoveset([MoveId.RAZOR_LEAF])
      .startingLevel(100)
      .enemyLevel(100);

    vi.spyOn(allMoves[MoveId.RAZOR_LEAF], "accuracy", "get").mockReturnValue(100);
  });

  it("should activate after the user is hit by a physical attack", async () => {
    await game.classicMode.startBattle([SpeciesId.CHARIZARD, SpeciesId.TURTONATOR]);

    const playerPokemon = game.scene.getPlayerField();
    const enemyPokemon = game.scene.getEnemyField();

    game.move.select(MoveId.SPLASH);
    game.move.select(MoveId.SHELL_TRAP, 1);

    await game.setTurnOrder([BattlerIndex.ENEMY, BattlerIndex.ENEMY_2, BattlerIndex.PLAYER, BattlerIndex.PLAYER_2]);

    await game.phaseInterceptor.to(MoveEndPhase);

    const movePhase = game.scene.phaseManager.getCurrentPhase();
    expect(movePhase instanceof MovePhase).toBeTruthy();
    expect((movePhase as MovePhase).pokemon).toBe(playerPokemon[1]);

    await game.phaseInterceptor.to(MoveEndPhase);
    enemyPokemon.forEach(p => expect(p.hp).toBeLessThan(p.getMaxHp()));
  });

  it("should fail if the user is only hit by special attacks", async () => {
    game.override.enemyMoveset([MoveId.SWIFT]);

    await game.classicMode.startBattle([SpeciesId.CHARIZARD, SpeciesId.TURTONATOR]);

    const playerPokemon = game.scene.getPlayerField();
    const enemyPokemon = game.scene.getEnemyField();

    game.move.select(MoveId.SPLASH);
    game.move.select(MoveId.SHELL_TRAP, 1);

    await game.setTurnOrder([BattlerIndex.ENEMY, BattlerIndex.ENEMY_2, BattlerIndex.PLAYER, BattlerIndex.PLAYER_2]);

    await game.phaseInterceptor.to(MoveEndPhase);

    const movePhase = game.scene.phaseManager.getCurrentPhase();
    expect(movePhase instanceof MovePhase).toBeTruthy();
    expect((movePhase as MovePhase).pokemon).not.toBe(playerPokemon[1]);

    await game.phaseInterceptor.to(BerryPhase, false);
    enemyPokemon.forEach(p => expect(p.hp).toBe(p.getMaxHp()));
  });

  it("should fail if the user isn't hit with any attack", async () => {
    game.override.enemyMoveset(MoveId.SPLASH);

    await game.classicMode.startBattle([SpeciesId.CHARIZARD, SpeciesId.TURTONATOR]);

    const playerPokemon = game.scene.getPlayerField();
    const enemyPokemon = game.scene.getEnemyField();

    game.move.select(MoveId.SPLASH);
    game.move.select(MoveId.SHELL_TRAP, 1);

    await game.setTurnOrder([BattlerIndex.ENEMY, BattlerIndex.ENEMY_2, BattlerIndex.PLAYER, BattlerIndex.PLAYER_2]);

    await game.phaseInterceptor.to(MoveEndPhase);

    const movePhase = game.scene.phaseManager.getCurrentPhase();
    expect(movePhase instanceof MovePhase).toBeTruthy();
    expect((movePhase as MovePhase).pokemon).not.toBe(playerPokemon[1]);

    await game.phaseInterceptor.to(BerryPhase, false);
    enemyPokemon.forEach(p => expect(p.hp).toBe(p.getMaxHp()));
  });

  it("should not activate from an ally's attack", async () => {
    game.override.enemyMoveset(MoveId.SPLASH);

    await game.classicMode.startBattle([SpeciesId.BLASTOISE, SpeciesId.CHARIZARD]);

    const playerPokemon = game.scene.getPlayerField();
    const enemyPokemon = game.scene.getEnemyField();

    game.move.select(MoveId.SHELL_TRAP);
    game.move.select(MoveId.BULLDOZE, 1);

    await game.phaseInterceptor.to(MoveEndPhase);

    const movePhase = game.scene.phaseManager.getCurrentPhase();
    expect(movePhase instanceof MovePhase).toBeTruthy();
    expect((movePhase as MovePhase).pokemon).not.toBe(playerPokemon[1]);

    const enemyStartingHp = enemyPokemon.map(p => p.hp);

    await game.phaseInterceptor.to(BerryPhase, false);
    enemyPokemon.forEach((p, i) => expect(p.hp).toBe(enemyStartingHp[i]));
  });

  it("should not activate from a subsequent physical attack", async () => {
    game.override.battleStyle("single");
    vi.spyOn(allMoves[MoveId.RAZOR_LEAF], "priority", "get").mockReturnValue(-4);

    await game.classicMode.startBattle([SpeciesId.CHARIZARD]);

    const playerPokemon = game.field.getPlayerPokemon();
    const enemyPokemon = game.field.getEnemyPokemon();

    game.move.select(MoveId.SHELL_TRAP);

    await game.phaseInterceptor.to(BerryPhase, false);

    expect(playerPokemon.getLastXMoves()[0].result).toBe(MoveResult.FAIL);
    expect(enemyPokemon.hp).toBe(enemyPokemon.getMaxHp());
  });
});
