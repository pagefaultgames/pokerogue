/*
 * SPDX-FileCopyrightText: 2024-2025 Pagefault Games
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { AbilityId } from "#enums/ability-id";
import { MoveId } from "#enums/move-id";
import { SpeciesId } from "#enums/species-id";
import { GameManager } from "#test/test-utils/game-manager";
import Phaser from "phaser";
import { beforeAll, beforeEach, describe, it } from "vitest";

describe("Move - Conversion 2", () => {
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
      .enemyLevel(100);
  });

  // TODO: These interactions are implemented; need tests
  it.todo("should change the user to a random type resisting the target's last move");
  it.todo("should fail if the target has not used a move");
  it.todo("should fail if the user already has all types that resist the target's move");
  it.todo("should respect inverse battles");

  // TODO: These interactions are not implemented
  it.todo("should fail if the target's last move has no resistances");
  it.todo("should fail if the user is Terastallized");
  it.todo("should consider the resolved type of variable-type moves");

  // TODO: Verify how Conversion 2 works with status-based failures & move-calling moves
});
