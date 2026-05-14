/*
 * SPDX-FileCopyrightText: 2024-2026 Pagefault Games
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { AbilityId } from "#enums/ability-id";
import { BattlerIndex } from "#enums/battler-index";
import { MoveId } from "#enums/move-id";
import { MoveResult } from "#enums/move-result";
import { SpeciesId } from "#enums/species-id";
import { GameManager } from "#test/framework/game-manager";
import Phaser from "phaser";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";

describe.each([
  { abilityId: AbilityId.DAZZLING, abilityName: "Dazzling" },
  { abilityId: AbilityId.QUEENLY_MAJESTY, abilityName: "Queenly Majesty" },
])("Ability - $abilityName", ({ abilityId }) => {
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
      .enemyAbility(abilityId)
      .enemyMoveset(MoveId.SPLASH)
      .startingLevel(100)
      .enemyLevel(100);
  });

  it("should block enemy single-target increased priority moves", async () => {
    await game.classicMode.startBattle(SpeciesId.FEEBAS);

    game.move.use(MoveId.QUICK_ATTACK);
    await game.toEndOfTurn();

    expect(game.field.getPlayerPokemon()).toHaveUsedMove({ move: MoveId.QUICK_ATTACK, result: MoveResult.FAIL });
  });

  describe("Doubles Interactions", () => {
    beforeEach(() => {
      game.override.battleStyle("double");
    });

    it("should block enemy single-target increased priority moves from affecting allies", async () => {
      game.override.enemyAbility(AbilityId.BALL_FETCH);
      await game.classicMode.startBattle(SpeciesId.FEEBAS, SpeciesId.MILOTIC);

      game.field.mockAbility(game.field.getEnemyPokemon(), abilityId);

      game.move.use(MoveId.SPLASH);
      game.move.use(MoveId.QUICK_ATTACK, 1, BattlerIndex.ENEMY_2);
      await game.toEndOfTurn();

      expect(game.scene.getPlayerField()[1]).toHaveUsedMove({ move: MoveId.QUICK_ATTACK, result: MoveResult.FAIL });
      expect(game.scene.getEnemyField()[1].hasAbility(AbilityId.BALL_FETCH)).toBeTruthy();
    });

    it("should not block allied single-target increased priority moves", async () => {
      await game.classicMode.startBattle(SpeciesId.FEEBAS, SpeciesId.MILOTIC);

      game.move.use(MoveId.SPLASH);
      game.move.use(MoveId.SPLASH, 1);
      await game.move.forceEnemyMove(MoveId.QUICK_ATTACK, BattlerIndex.ENEMY_2);
      await game.toEndOfTurn();

      expect(game.field.getEnemyPokemon()).toHaveUsedMove({ move: MoveId.QUICK_ATTACK, result: MoveResult.SUCCESS });
    });

    it("should not block enemy single-target increased priority moves if the enemy targeted the other enemy", async () => {
      await game.classicMode.startBattle(SpeciesId.FEEBAS, SpeciesId.MILOTIC);

      game.move.use(MoveId.SPLASH);
      game.move.use(MoveId.QUICK_ATTACK, 1, BattlerIndex.PLAYER);
      await game.toEndOfTurn();

      expect(game.scene.getPlayerField()[1]).toHaveUsedMove({ move: MoveId.QUICK_ATTACK, result: MoveResult.SUCCESS });
    });
  });
});
