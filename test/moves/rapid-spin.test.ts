/*
 * SPDX-FileCopyrightText: 2024-2025 Pagefault Games
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { AbilityId } from "#enums/ability-id";
import { ArenaTagSide } from "#enums/arena-tag-side";
import { ArenaTagType } from "#enums/arena-tag-type";
import { MoveId } from "#enums/move-id";
import { SpeciesId } from "#enums/species-id";
import { GameManager } from "#test/test-utils/game-manager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";

describe("Move - Rapid Spin", () => {
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
      .ability(AbilityId.BALL_FETCH)
      .battleStyle("single")
      .criticalHits(false)
      .enemySpecies(SpeciesId.MAGIKARP)
      .enemyAbility(AbilityId.BALL_FETCH)
      .enemyMoveset(MoveId.SPLASH)
      .startingLevel(100)
      .enemyLevel(100);
  });

  it("should remove hazards from the user's side of the field", async () => {
    await game.classicMode.startBattle([SpeciesId.FEEBAS]);

    game.scene.arena.addTag(
      ArenaTagType.STEALTH_ROCK,
      0,
      undefined,
      game.field.getEnemyPokemon().id,
      ArenaTagSide.PLAYER,
    );
    game.scene.arena.addTag(
      ArenaTagType.STEALTH_ROCK,
      0,
      undefined,
      game.field.getPlayerPokemon().id,
      ArenaTagSide.ENEMY,
    );

    game.move.use(MoveId.RAPID_SPIN);
    await game.toEndOfTurn();

    expect(game).not.toHaveArenaTag({ tagType: ArenaTagType.STEALTH_ROCK, side: ArenaTagSide.PLAYER });
    expect(game).toHaveArenaTag({ tagType: ArenaTagType.STEALTH_ROCK, side: ArenaTagSide.ENEMY });
  });
});
