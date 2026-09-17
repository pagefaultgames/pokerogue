/*
 * SPDX-FileCopyrightText: 2025-2026 Despair Games
 * SPDX-FileCopyrightText: 2026 Pagefault Games
 * SPDX-FileContributor: Tempo-Anon
 * SPDX-FileContributor: NightKev
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { AbilityId } from "#enums/ability-id";
import { BattlerIndex } from "#enums/battler-index";
import { BattlerTagType } from "#enums/battler-tag-type";
import { MoveId } from "#enums/move-id";
import { SpeciesId } from "#enums/species-id";
import { Stat } from "#enums/stat";
import { GameManager } from "#test/framework/game-manager";
import Phaser from "phaser";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";

describe("Move - Rage", () => {
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
      .ability(AbilityId.FUR_COAT)
      .battleStyle("double")
      .criticalHits(false)
      .enemySpecies(SpeciesId.SHUCKLE)
      .enemyAbility(AbilityId.NO_GUARD)
      .enemyPassiveAbility(AbilityId.STURDY)
      .enemyMoveset(MoveId.SPLASH)
      .startingLevel(100)
      .enemyLevel(100);
  });

  it("should increase the user's attack by 1 for each time they are hit", async () => {
    await game.classicMode.startBattle(SpeciesId.DUBWOOL);
    const playerPokemon = game.field.getPlayerPokemon();

    game.move.use(MoveId.RAGE, 0, BattlerIndex.ENEMY);
    await game.move.forceEnemyMove(MoveId.TRIPLE_AXEL); // Should give +3
    await game.move.forceEnemyMove(MoveId.TACKLE); // Should give +1

    game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.ENEMY, BattlerIndex.ENEMY_2]);
    await game.toNextTurn();

    expect(playerPokemon).toHaveBattlerTag(BattlerTagType.RAGE);
    expect(playerPokemon).toHaveStatStage(Stat.ATK, 4);

    game.move.use(MoveId.SPLASH);
    await game.move.forceEnemyMove(MoveId.TRIPLE_AXEL); // Should give +0
    await game.move.forceEnemyMove(MoveId.TACKLE); // Should give +0

    await game.toNextTurn();

    expect(playerPokemon).not.toHaveBattlerTag(BattlerTagType.RAGE);
    expect(playerPokemon).toHaveStatStage(Stat.ATK, 4);

    const enemy = game.field.getEnemyParty()[0];
    enemy.hp = enemy.getMaxHp();

    game.move.use(MoveId.RAGE, 0, BattlerIndex.ENEMY);
    await game.move.forceEnemyMove(MoveId.SHADOW_PUNCH); // Should give +0
    await game.move.forceEnemyMove(MoveId.TACKLE); // Should give +1

    await game.toNextTurn();

    expect(playerPokemon).toHaveBattlerTag(BattlerTagType.RAGE);
    expect(playerPokemon).toHaveStatStage(Stat.ATK, 5);
  });
});
