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
  { abilityId: AbilityId.ARMOR_TAIL, abilityName: "Armor Tail" },
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

  it("should block enemy multi-target increased priority moves", async () => {
    game.override.ability(AbilityId.TRIAGE);
    await game.classicMode.startBattle(SpeciesId.FEEBAS);

    game.move.use(MoveId.MATCHA_GOTCHA);
    await game.toEndOfTurn();

    expect(game.field.getPlayerPokemon()).toHaveUsedMove({ move: MoveId.MATCHA_GOTCHA, result: MoveResult.FAIL });
  });

  it("should not block self-targeted increased priority moves", async () => {
    await game.classicMode.startBattle(SpeciesId.FEEBAS);

    game.move.use(MoveId.PROTECT);
    await game.move.forceEnemyMove(MoveId.PROTECT);
    await game.toEndOfTurn();

    expect(game.field.getPlayerPokemon()).toHaveUsedMove({ move: MoveId.PROTECT, result: MoveResult.SUCCESS });
    expect(game.field.getEnemyPokemon()).toHaveUsedMove({ move: MoveId.PROTECT, result: MoveResult.SUCCESS });
  });

  describe("Doubles Interactions", () => {
    beforeEach(() => {
      game.override.battleStyle("double");
    });

    it("should prevent enemy increased priority moves from affecting allies", async () => {
      game.override.enemyAbility(AbilityId.BALL_FETCH);
      await game.classicMode.startBattle(SpeciesId.FEEBAS);

      game.field.mockAbility(game.field.getEnemyPokemon(), abilityId);

      game.move.use(MoveId.QUICK_ATTACK, BattlerIndex.PLAYER, BattlerIndex.ENEMY_2);
      await game.toEndOfTurn();

      const player = game.field.getPlayerPokemon();
      expect(player).toHaveUsedMove({ move: MoveId.QUICK_ATTACK, result: MoveResult.FAIL });
    });

    it("should not affect the user or their allies", async () => {
      await game.classicMode.startBattle(SpeciesId.FEEBAS);

      game.move.use(MoveId.SPLASH);
      await game.move.forceEnemyMove(MoveId.QUICK_ATTACK, BattlerIndex.ENEMY_2);
      await game.move.forceEnemyMove(MoveId.ACCELEROCK, BattlerIndex.PLAYER);
      await game.toEndOfTurn();

      const [enemy1, enemy2] = game.scene.getEnemyField();
      expect(enemy1).toHaveUsedMove({ move: MoveId.QUICK_ATTACK, result: MoveResult.SUCCESS });
      expect(enemy2).toHaveUsedMove({ move: MoveId.ACCELEROCK, result: MoveResult.SUCCESS });
    });

    it("should not block opposing increased priority moves that do not target the user's side", async () => {
      await game.classicMode.startBattle(SpeciesId.FEEBAS, SpeciesId.MILOTIC);

      game.move.use(MoveId.SPLASH, BattlerIndex.PLAYER);
      game.move.use(MoveId.QUICK_ATTACK, BattlerIndex.PLAYER_2, BattlerIndex.PLAYER);
      await game.toEndOfTurn();

      expect(game.scene.getPlayerField()[1]).toHaveUsedMove({ move: MoveId.QUICK_ATTACK, result: MoveResult.SUCCESS });
    });
  });
});
