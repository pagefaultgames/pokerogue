/*
 * SPDX-FileCopyrightText: 2024-2025 Pagefault Games
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { AbilityId } from "#enums/ability-id";
import { ArenaTagSide } from "#enums/arena-tag-side";
import { ArenaTagType } from "#enums/arena-tag-type";
import { BattlerTagType } from "#enums/battler-tag-type";
import { MoveId } from "#enums/move-id";
import { SpeciesId } from "#enums/species-id";
import { Stat } from "#enums/stat";
import { StatusEffect } from "#enums/status-effect";
import { GameManager } from "#test/test-utils/game-manager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";

describe.each<{ moveId: MoveId; moveName: string }>([
  { moveId: MoveId.RAPID_SPIN, moveName: "Rapid Spin" },
  { moveId: MoveId.MORTAL_SPIN, moveName: "Mortal Spin" },
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

  beforeEach(async () => {
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

    await game.classicMode.startBattle([SpeciesId.FEEBAS]);
  });

  it.each<{ tagType: ArenaTagType; tagName: string }>([
    { tagType: ArenaTagType.SPIKES, tagName: "Spikes" },
    { tagType: ArenaTagType.STEALTH_ROCK, tagName: "Stealth Rocks" },
    { tagType: ArenaTagType.TOXIC_SPIKES, tagName: "Toxic Spikes" },
    { tagType: ArenaTagType.STICKY_WEB, tagName: "Sticky Web" },
  ])("should remove $tagName only from the user's side of the field", async ({ tagType }) => {
    game.scene.arena.addTag(tagType, 0, undefined, game.field.getEnemyPokemon().id, ArenaTagSide.PLAYER);
    game.scene.arena.addTag(tagType, 0, undefined, game.field.getPlayerPokemon().id, ArenaTagSide.ENEMY);

    game.move.use(moveId);
    await game.toEndOfTurn();

    expect(game).not.toHaveArenaTag({ tagType, side: ArenaTagSide.PLAYER });
    expect(game).toHaveArenaTag({ tagType, side: ArenaTagSide.ENEMY });
  });

  it.each<{ tagType: BattlerTagType; tagName: string }>([
    { tagType: BattlerTagType.SEEDED, tagName: "Leech Seed" },
    { tagType: BattlerTagType.FIRE_SPIN, tagName: "Binding effects" },
  ])("should remove $tagName from the user", async ({ tagType }) => {
    const player = game.field.getPlayerPokemon();
    player.addTag(tagType, 0, undefined, game.field.getEnemyPokemon().id);

    game.move.use(moveId);
    await game.toEndOfTurn();

    expect(player).not.toHaveBattlerTag(tagType);
  });

  // not using `it.runIf` because that causes unwanted and potentially confusing entries in the test list
  if (moveId === MoveId.RAPID_SPIN) {
    it("should increase the user's speed stage by 1", async () => {
      game.move.use(MoveId.RAPID_SPIN);
      await game.toEndOfTurn();

      expect(game.field.getPlayerPokemon()).toHaveStatStage(Stat.SPD, 1);
    });
  }

  if (moveId === MoveId.MORTAL_SPIN) {
    it("should poison the target", async () => {
      game.move.use(MoveId.MORTAL_SPIN);
      await game.toEndOfTurn();

      expect(game.field.getEnemyPokemon()).toHaveStatusEffect(StatusEffect.POISON);
    });
  }
});
