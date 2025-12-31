/*
 * SPDX-FileCopyrightText: 2024-2025 Pagefault Games
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { AbilityId } from "#enums/ability-id";
import { ArenaTagSide } from "#enums/arena-tag-side";
import { ArenaTagType } from "#enums/arena-tag-type";
import { BattlerIndex } from "#enums/battler-index";
import { BattlerTagType } from "#enums/battler-tag-type";
import { MoveId } from "#enums/move-id";
import { SpeciesId } from "#enums/species-id";
import { Stat } from "#enums/stat";
import { StatusEffect } from "#enums/status-effect";
import { GameManager } from "#test/test-utils/game-manager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";

describe("Move - Feint", () => {
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
  });

  it.each<{ moveId: MoveId; tagType: ArenaTagType; moveName: string }>([
    { moveId: MoveId.QUICK_GUARD, tagType: ArenaTagType.QUICK_GUARD, moveName: "Quick Guard" },
    { moveId: MoveId.WIDE_GUARD, tagType: ArenaTagType.WIDE_GUARD, moveName: "Wide Guard" },
    { moveId: MoveId.MAT_BLOCK, tagType: ArenaTagType.MAT_BLOCK, moveName: "Mat Block" },
    { moveId: MoveId.CRAFTY_SHIELD, tagType: ArenaTagType.CRAFTY_SHIELD, moveName: "Crafty Shield" },
  ])("should bypass and remove $moveName from opposing pokemon", async ({ moveId, tagType }) => {
    await game.classicMode.startBattle([SpeciesId.FEEBAS]);

    game.move.use(MoveId.FEINT);
    await game.move.forceEnemyMove(moveId);
    await game.toEndOfTurn();

    expect(game).not.toHaveArenaTag({ tagType, side: ArenaTagSide.ENEMY });
    expect(game.field.getEnemyPokemon()).not.toHaveFullHp();
  });

  it.each<{ moveId: MoveId; tagType: ArenaTagType; moveName: string }>([
    { moveId: MoveId.QUICK_GUARD, tagType: ArenaTagType.QUICK_GUARD, moveName: "Quick Guard" },
    { moveId: MoveId.WIDE_GUARD, tagType: ArenaTagType.WIDE_GUARD, moveName: "Wide Guard" },
    { moveId: MoveId.MAT_BLOCK, tagType: ArenaTagType.MAT_BLOCK, moveName: "Mat Block" },
    { moveId: MoveId.CRAFTY_SHIELD, tagType: ArenaTagType.CRAFTY_SHIELD, moveName: "Crafty Shield" },
  ])("should bypass and remove $moveName from target side even if target is an ally", async ({ moveId, tagType }) => {
    game.override.battleStyle("double");
    await game.classicMode.startBattle([SpeciesId.FEEBAS, SpeciesId.MILOTIC]);

    game.move.use(MoveId.FEINT, BattlerIndex.PLAYER, BattlerIndex.PLAYER_2);
    game.move.use(moveId, BattlerIndex.PLAYER_2);
    await game.toEndOfTurn();

    expect(game).not.toHaveArenaTag({ tagType, side: ArenaTagSide.PLAYER });
    expect(game.field.getPlayerParty()[1]).not.toHaveFullHp();
  });

  it.each<{ moveId: MoveId; moveName: string }>([
    { moveId: MoveId.PROTECT, moveName: "Protect" },
    { moveId: MoveId.DETECT, moveName: "Detect" },
    { moveId: MoveId.KINGS_SHIELD, moveName: "King's Shield" },
    { moveId: MoveId.SILK_TRAP, moveName: "Silk Trap" },
    { moveId: MoveId.OBSTRUCT, moveName: "Obstruct" },
    { moveId: MoveId.BURNING_BULWARK, moveName: "Burning Bulwark" },
    { moveId: MoveId.BANEFUL_BUNKER, moveName: "Baneful Bunker" },
  ])("should ignore and remove the effects of $moveName from opposing pokemon", async ({ moveId }) => {
    await game.classicMode.startBattle([SpeciesId.FEEBAS]);

    const player = game.field.getPlayerPokemon();
    const enemy = game.field.getEnemyPokemon();

    game.move.use(MoveId.FEINT);
    await game.move.forceEnemyMove(moveId);
    await game.toEndOfTurn();

    expect(enemy).not.toHaveBattlerTag(BattlerTagType.PROTECTED);
    expect(enemy).not.toHaveFullHp();

    switch (moveId) {
      case MoveId.KINGS_SHIELD:
        expect(player).toHaveStatStage(Stat.ATK, 0);
        break;
      case MoveId.SILK_TRAP:
        expect(player).toHaveStatStage(Stat.SPD, 0);
        break;
      case MoveId.OBSTRUCT:
        expect(player).toHaveStatStage(Stat.DEF, 0);
        break;
      case MoveId.BURNING_BULWARK:
        expect(player).not.toHaveStatusEffect(StatusEffect.BURN);
        break;
      case MoveId.BANEFUL_BUNKER:
        expect(player).not.toHaveStatusEffect(StatusEffect.POISON);
    }
  });

  it.each<{ moveId: MoveId; moveName: string }>([
    { moveId: MoveId.PROTECT, moveName: "Protect" },
    { moveId: MoveId.DETECT, moveName: "Detect" },
    { moveId: MoveId.KINGS_SHIELD, moveName: "King's Shield" },
    { moveId: MoveId.SILK_TRAP, moveName: "Silk Trap" },
    { moveId: MoveId.OBSTRUCT, moveName: "Obstruct" },
    { moveId: MoveId.BURNING_BULWARK, moveName: "Burning Bulwark" },
    { moveId: MoveId.BANEFUL_BUNKER, moveName: "Baneful Bunker" },
  ])("should ignore and remove the effects of $moveName from target even if target is an ally", async ({ moveId }) => {
    game.override.battleStyle("double");
    await game.classicMode.startBattle([SpeciesId.FEEBAS, SpeciesId.MILOTIC]);

    const [player, player2] = game.field.getPlayerParty();

    game.move.use(MoveId.FEINT, BattlerIndex.PLAYER, BattlerIndex.PLAYER_2);
    game.move.use(moveId, BattlerIndex.PLAYER_2);
    await game.toEndOfTurn();

    expect(player2).not.toHaveBattlerTag(BattlerTagType.PROTECTED);
    expect(player2).not.toHaveFullHp();

    switch (moveId) {
      case MoveId.KINGS_SHIELD:
        expect(player).toHaveStatStage(Stat.ATK, 0);
        break;
      case MoveId.SILK_TRAP:
        expect(player).toHaveStatStage(Stat.SPD, 0);
        break;
      case MoveId.OBSTRUCT:
        expect(player).toHaveStatStage(Stat.DEF, 0);
        break;
      case MoveId.BURNING_BULWARK:
        expect(player).not.toHaveStatusEffect(StatusEffect.BURN);
        break;
      case MoveId.BANEFUL_BUNKER:
        expect(player).not.toHaveStatusEffect(StatusEffect.POISON);
    }
  });
});
