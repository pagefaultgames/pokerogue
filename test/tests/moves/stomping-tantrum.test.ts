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

  it("should do normal damage if no prior move is called", async () => {
    const stompingTantrum = allMoves[MoveId.STOMPING_TANTRUM];
    const powerSpy = vi.spyOn(stompingTantrum, "calculateBattlePower");
    await game.classicMode.startBattle(SpeciesId.FEEBAS);

    game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.ENEMY]);
    game.move.use(MoveId.STOMPING_TANTRUM);

    await game.toEndOfTurn();

    expect(powerSpy).toHaveLastReturnedWith(stompingTantrum.power);
  });

  it("should do normal damage after successfully using a move", async () => {
    const stompingTantrum = allMoves[MoveId.STOMPING_TANTRUM];
    const powerSpy = vi.spyOn(stompingTantrum, "calculateBattlePower");
    await game.classicMode.startBattle(SpeciesId.FEEBAS);
    game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.ENEMY]);

    game.move.use(MoveId.TACKLE);
    await game.toEndOfTurn();

    game.move.use(MoveId.STOMPING_TANTRUM);
    await game.toEndOfTurn();

    expect(powerSpy).toHaveLastReturnedWith(stompingTantrum.power);
  });

  it("should do normal damage after using a recharge move", async () => {
    const stompingTantrum = allMoves[MoveId.STOMPING_TANTRUM];
    const powerSpy = vi.spyOn(stompingTantrum, "calculateBattlePower");
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
    const stompingTantrum = allMoves[MoveId.STOMPING_TANTRUM];
    const powerSpy = vi.spyOn(stompingTantrum, "calculateBattlePower");
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
    const stompingTantrum = allMoves[MoveId.STOMPING_TANTRUM];
    const powerSpy = vi.spyOn(stompingTantrum, "calculateBattlePower");
    await game.classicMode.startBattle(SpeciesId.FEEBAS);
    game.setTurnOrder([BattlerIndex.ENEMY, BattlerIndex.PLAYER]);

    game.move.use(MoveId.TACKLE);
    await game.move.forceEnemyMove(MoveId.SKY_DROP);
    await game.toEndOfTurn();

    game.move.use(MoveId.STOMPING_TANTRUM);
    await game.toEndOfTurn();

    expect(powerSpy).toHaveLastReturnedWith(stompingTantrum.power);
  });
});
