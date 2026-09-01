/*
 * SPDX-FileCopyrightText: 2024-2026 Pagefault Games
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { AbilityId } from "#enums/ability-id";
import { MoveId } from "#enums/move-id";
import { SpeciesId } from "#enums/species-id";
import { UiMode } from "#enums/ui-mode";
import { GameManager } from "#test/framework/game-manager";
import type { ModifierSelectUiHandler } from "#ui/modifier-select-ui-handler";
import Phaser from "phaser";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

describe("Ability - Emergency Exit", () => {
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
      .moveset([MoveId.SPLASH, MoveId.ROAR])
      .startingLevel(100)
      .enemyLevel(10)
      .criticalHits(false)
      .enemyAbility(AbilityId.EMERGENCY_EXIT);
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

  it("should offer no rewards when triggered in a single battle", async () => {
    game.override.startingWave(2).battleStyle("single").enemySpecies(SpeciesId.GOLISOPOD);
    await game.classicMode.startBattle(SpeciesId.GOLISOPOD);

    const player = game.scene.getPlayerParty()[0];
    game.move.changeMoveset(player, [MoveId.FALSE_SWIPE]);

    game.move.select(MoveId.FALSE_SWIPE);

    const handler = await getModifierShopHandler();
    expect(handler.options.length).toBe(0);
  });

  it("should offer partial rewards in a double battle when one opponent is defeated and the other triggers Emergency Exit", async () => {
    game.override.startingWave(2).battleStyle("double");
    await game.classicMode.startBattle(SpeciesId.MAGIKARP, SpeciesId.GOLISOPOD);

    const [p1, p2] = game.scene.getPlayerParty();
    game.move.changeMoveset(p1, [MoveId.THUNDERBOLT, MoveId.FALSE_SWIPE]);
    game.move.changeMoveset(p2, [MoveId.SPLASH]);

    game.move.select(MoveId.THUNDERBOLT, 0, 2);
    game.move.select(MoveId.SPLASH, 1);
    await game.toNextTurn();

    game.move.select(MoveId.FALSE_SWIPE, 0, 3);
    game.move.select(MoveId.SPLASH, 1);

    const handler = await getModifierShopHandler();
    expect(handler.options.length).toBe(3);
  });

  it("should offer no rewards in a double battle when one opponent is forced out and the other triggers Emergency Exit", async () => {
    game.override.startingWave(2).battleStyle("double");
    await game.classicMode.startBattle(SpeciesId.MAGIKARP, SpeciesId.GOLISOPOD);

    const [p1, p2] = game.scene.getPlayerParty();
    game.move.changeMoveset(p1, [MoveId.ROAR, MoveId.FALSE_SWIPE]);
    game.move.changeMoveset(p2, [MoveId.SPLASH]);

    game.move.select(MoveId.ROAR, 0, 2);
    game.move.select(MoveId.SPLASH, 1);
    await game.toNextTurn();

    game.move.select(MoveId.FALSE_SWIPE, 0, 3);
    game.move.select(MoveId.SPLASH, 1);

    const handler = await getModifierShopHandler();
    expect(handler.options.length).toBe(0);
  });
});
