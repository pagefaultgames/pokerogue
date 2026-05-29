/*
 * SPDX-FileCopyrightText: 2024-2026 Pagefault Games
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { allMoves } from "#data/data-lists";
import { AbilityId } from "#enums/ability-id";
import { BattlerIndex } from "#enums/battler-index";
import { MoveId } from "#enums/move-id";
import { SpeciesId } from "#enums/species-id";
import { GameManager } from "#test/framework/game-manager";
import Phaser from "phaser";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

describe("Move - Stomping Tantrum", () => {
  let phaserGame: Phaser.Game;
  let game: GameManager;

  beforeAll(() => {
    phaserGame = new Phaser.Game({
      type: Phaser.HEADLESS,
    });
  });

  beforeEach(() => {
    game = new GameManager(phaserGame);
    game.override
      .ability(AbilityId.BALL_FETCH)
      .battleStyle("single")
      .criticalHits(false)
      .enemySpecies(SpeciesId.MAGIKARP)
      .enemyAbility(AbilityId.BALL_FETCH)
      .enemyMoveset(MoveId.SPLASH)
      .startingLevel(100)
      .enemyLevel(100)
      .moveset([MoveId.STOMPING_TANTRUM, MoveId.GIGA_IMPACT, MoveId.SUCKER_PUNCH, MoveId.SPLASH]);
  });

  function setUpTest() {
    const stompingTantrum = allMoves[MoveId.STOMPING_TANTRUM];
    const powerSpy = vi.spyOn(stompingTantrum, "calculateBattlePower");

    return { stompingTantrum, powerSpy };
  }

  it("should do normal damage if no prior move is called", async () => {
    const { stompingTantrum, powerSpy } = setUpTest();
    await game.classicMode.startBattle(SpeciesId.FEEBAS);

    game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.ENEMY]);
    game.move.use(MoveId.STOMPING_TANTRUM);

    await game.toEndOfTurn();

    expect(powerSpy).toHaveLastReturnedWith(stompingTantrum.power);
  });

  it("should do normal damage after successfully using a move", async () => {
    const { stompingTantrum, powerSpy } = setUpTest();
    await game.classicMode.startBattle(SpeciesId.FEEBAS);
    game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.ENEMY]);

    game.move.use(MoveId.TACKLE);
    await game.toEndOfTurn();

    game.move.use(MoveId.STOMPING_TANTRUM);
    await game.toEndOfTurn();

    expect(powerSpy).toHaveLastReturnedWith(stompingTantrum.power);
  });

  it("should do normal damage after using a recharge move", async () => {
    const { stompingTantrum, powerSpy } = setUpTest();
    // Guaranteeing Giga Impact hits
    vi.spyOn(allMoves[MoveId.GIGA_IMPACT], "accuracy", "get").mockReturnValue(100);
    await game.classicMode.startBattle(SpeciesId.FEEBAS);
    game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.ENEMY]);

    game.move.use(MoveId.GIGA_IMPACT);
    await game.toEndOfTurn();

    // Recharge turn
    game.move.use(MoveId.SPLASH);
    await game.toEndOfTurn();

    game.move.use(MoveId.STOMPING_TANTRUM);
    await game.toEndOfTurn();

    expect(powerSpy).toHaveLastReturnedWith(stompingTantrum.power);
  });

  it("should do double damage after a move fails", async () => {
    const { stompingTantrum, powerSpy } = setUpTest();
    await game.classicMode.startBattle(SpeciesId.FEEBAS);
    game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.ENEMY]);

    // Intentionally failing Sucker Punch
    game.move.use(MoveId.SUCKER_PUNCH);
    await game.move.forceEnemyMove(MoveId.SPLASH);
    await game.toEndOfTurn();

    game.move.use(MoveId.STOMPING_TANTRUM);
    await game.toEndOfTurn();

    expect(powerSpy).toHaveLastReturnedWith(stompingTantrum.power * 2);
  });

  it("should do normal damage after getting targeted by Sky Drop", async () => {
    const { stompingTantrum, powerSpy } = setUpTest();
    await game.classicMode.startBattle(SpeciesId.FEEBAS);
    game.setTurnOrder([BattlerIndex.ENEMY, BattlerIndex.PLAYER]);

    game.move.use(MoveId.TACKLE);
    await game.move.forceEnemyMove(MoveId.SKY_DROP);
    await game.toEndOfTurn();

    game.move.use(MoveId.STOMPING_TANTRUM);
    await game.toEndOfTurn();

    expect(powerSpy).toHaveLastReturnedWith(stompingTantrum.power);
  });

  it("should check both Pokemon for exceptions in a double battle", async () => {
    const { stompingTantrum, powerSpy } = setUpTest();
    game.override.battleStyle("double");
    await game.classicMode.startBattle(SpeciesId.FEEBAS, SpeciesId.WEEDLE);

    // First enemy uses Sky Drop, causing Feebas' move to fail
    game.move.use(MoveId.TACKLE);
    game.move.use(MoveId.TACKLE, 1);
    await game.move.forceEnemyMove(MoveId.SKY_DROP, BattlerIndex.PLAYER);
    await game.move.forceEnemyMove(MoveId.SPLASH, BattlerIndex.PLAYER_2);
    await game.toEndOfTurn();

    // Targeting the enemy that didn't use Sky Drop with Stomping Tantrum
    game.move.use(MoveId.STOMPING_TANTRUM, 0, 3);
    game.move.use(MoveId.TACKLE, 1);
    await game.toEndOfTurn();

    expect(powerSpy).toHaveLastReturnedWith(stompingTantrum.power);
  });

  // TODO: Activate this test when Stomping Tantrum correctly checks for move failure caused by Protect-like moves
  it.todo("should do normal damage after a move fails because of Protect", async () => {
    const { stompingTantrum, powerSpy } = setUpTest();
    await game.classicMode.startBattle(SpeciesId.FEEBAS);

    game.move.use(MoveId.TACKLE);
    await game.move.forceEnemyMove(MoveId.PROTECT);
    await game.toEndOfTurn();

    game.move.use(MoveId.STOMPING_TANTRUM);
    await game.move.forceEnemyMove(MoveId.SPLASH);
    await game.toEndOfTurn();

    expect(powerSpy).toHaveLastReturnedWith(stompingTantrum.power);
  });
});
