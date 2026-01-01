/*
 * SPDX-FileCopyrightText: 2024-2025 Pagefault Games
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { AbilityId } from "#enums/ability-id";
import { ArenaTagSide } from "#enums/arena-tag-side";
import { ArenaTagType } from "#enums/arena-tag-type";
import { BattlerIndex } from "#enums/battler-index";
import { MoveId } from "#enums/move-id";
import { MoveResult } from "#enums/move-result";
import { SpeciesId } from "#enums/species-id";
import { GameManager } from "#test/test-utils/game-manager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";

describe.each([
  { moveId: MoveId.BRICK_BREAK, moveName: "Brick Break" },
  { moveId: MoveId.PSYCHIC_FANGS, moveName: "Psychic Fangs" },
])("Move - $moveName", ({ moveId }) => {
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
      .ability(AbilityId.NO_GUARD)
      .battleStyle("single")
      .criticalHits(false)
      .enemySpecies(SpeciesId.MAGIKARP)
      .enemyAbility(AbilityId.BALL_FETCH)
      .enemyMoveset(MoveId.SPLASH)
      .startingLevel(100)
      .enemyLevel(100);
  });

  it.each<{ tagType: ArenaTagType; tagName: string }>([
    { tagType: ArenaTagType.REFLECT, tagName: "Reflect" },
    { tagType: ArenaTagType.LIGHT_SCREEN, tagName: "Light Screen" },
    { tagType: ArenaTagType.AURORA_VEIL, tagName: "Aurora Veil" },
  ])("should remove $tagName only from the target's side of the field", async ({ tagType }) => {
    await game.classicMode.startBattle([SpeciesId.FEEBAS]);

    game.scene.arena.addTag(tagType, 0, undefined, game.field.getEnemyPokemon().id, ArenaTagSide.ENEMY);
    game.scene.arena.addTag(tagType, 0, undefined, game.field.getPlayerPokemon().id, ArenaTagSide.PLAYER);

    game.move.use(moveId);
    await game.toEndOfTurn();

    expect(game).toHaveArenaTag({ tagType, side: ArenaTagSide.PLAYER });
    expect(game).not.toHaveArenaTag({ tagType, side: ArenaTagSide.ENEMY });
  });

  it.each<{ tagType: ArenaTagType; tagName: string }>([
    { tagType: ArenaTagType.REFLECT, tagName: "Reflect" },
    { tagType: ArenaTagType.LIGHT_SCREEN, tagName: "Light Screen" },
    { tagType: ArenaTagType.AURORA_VEIL, tagName: "Aurora Veil" },
  ])("should remove $tagName from the target's side even if the target is the user's ally", async ({ tagType }) => {
    game.override.battleStyle("double");
    await game.classicMode.startBattle([SpeciesId.FEEBAS, SpeciesId.MILOTIC]);

    game.scene.arena.addTag(tagType, 0, undefined, game.field.getPlayerPokemon().id, ArenaTagSide.PLAYER);

    game.move.use(moveId, BattlerIndex.PLAYER, BattlerIndex.PLAYER_2);
    game.move.use(MoveId.SPLASH, BattlerIndex.PLAYER_2);
    await game.toEndOfTurn();

    expect(game).not.toHaveArenaTag({ tagType, side: ArenaTagSide.PLAYER });
  });

  it("should not remove screens if the target is immune to the move", async () => {
    game.override.enemySpecies(SpeciesId.SABLEYE);
    await game.classicMode.startBattle([SpeciesId.FEEBAS]);

    game.scene.arena.addTag(ArenaTagType.REFLECT, 0, undefined, game.field.getEnemyPokemon().id, ArenaTagSide.ENEMY);

    game.move.use(moveId);
    await game.toEndOfTurn();

    const player = game.field.getPlayerPokemon();
    expect(player).toHaveUsedMove({ move: moveId, result: MoveResult.MISS });
    expect(game).toHaveArenaTag({ tagType: ArenaTagType.REFLECT, side: ArenaTagSide.ENEMY });
  });
});
