/*
 * SPDX-FileCopyrightText: 2024-2026 Pagefault Games
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { BattleType } from "#enums/battle-type";
import { MoveId } from "#enums/move-id";
import { SpeciesId } from "#enums/species-id";
import { TrainerType } from "#enums/trainer-type";
import { UiMode } from "#enums/ui-mode";
import { GameManager } from "#test/framework/game-manager";
import type { ModifierSelectUiHandler } from "#ui/modifier-select-ui-handler";
import Phaser from "phaser";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

describe("Move - Roar", () => {
  let phaserGame: Phaser.Game;
  let game: GameManager;

  beforeAll(() => {
    phaserGame = new Phaser.Game({
      type: Phaser.HEADLESS,
    });
  });

  beforeEach(() => {
    game = new GameManager(phaserGame);
    game.override.moveset([MoveId.SPLASH, MoveId.ROAR]).startingLevel(100).enemyLevel(10).criticalHits(false);
  });

  async function getModifierShopHandler(): Promise<ModifierSelectUiHandler> {
    await game.phaseInterceptor.to("BattleEndPhase");
    await vi.waitUntil(() => !game.scene.phaseManager.getCurrentPhase()?.is("BattleEndPhase"));

    const currentPhase = game.scene.phaseManager.getCurrentPhase()?.phaseName;
    expect(currentPhase, "Expected battle to transition to SelectModifierPhase").toBe("SelectModifierPhase");

    await game.phaseInterceptor.to("SelectModifierPhase");
    await vi.waitUntil(() => game.scene.ui.getMode() === UiMode.MODIFIER_SELECT);

    return game.scene.ui.getHandler() as ModifierSelectUiHandler;
  }

  it("should offer no rewards on player-initiated force out (Roar)", async () => {
    game.override.enemySpecies(SpeciesId.MAGIKARP).enemyMoveset([MoveId.SPLASH]).battleStyle("single");
    await game.classicMode.startBattle(SpeciesId.MAGIKARP);

    game.move.select(MoveId.ROAR);

    const handler = await getModifierShopHandler();
    expect(handler.options.length).toBe(0);
  });

  it("should bypass rewards and fail to end battle when roar is used in trainer battles", async () => {
    game.override
      .battleStyle("single")
      .battleType(BattleType.TRAINER)
      .randomTrainer({ trainerType: TrainerType.YOUNGSTER })
      .enemySpecies(SpeciesId.RATTATA)
      .enemyMoveset([MoveId.SPLASH]);

    await game.classicMode.startBattle(SpeciesId.RATTATA, SpeciesId.PIDGEY);

    const enemyIdBefore = game.field.getEnemyPokemon().id;

    game.move.select(MoveId.ROAR);
    await game.toNextTurn();

    const enemyIdAfter = game.field.getEnemyPokemon().id;

    expect(enemyIdAfter).not.toBe(enemyIdBefore);
    expect(game.scene.ui.getMode()).not.toBe(UiMode.MODIFIER_SELECT);
    expect(game.field.getEnemyPokemon().isFainted()).toBe(false);
  });
});
