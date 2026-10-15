/*
 * SPDX-FileCopyrightText: 2024-2026 Pagefault Games
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { AbilityId } from "#enums/ability-id";
import { MoveId } from "#enums/move-id";
import { MoveResult } from "#enums/move-result";
import { SpeciesId } from "#enums/species-id";
import { Stat } from "#enums/stat";
import { GameManager } from "#test/framework/game-manager";
import Phaser from "phaser";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";

describe("Ability - Prankster", () => {
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
      .ability(AbilityId.PRANKSTER)
      .battleStyle("single")
      .criticalHits(false)
      .enemySpecies(SpeciesId.MAGIKARP)
      .enemyAbility(AbilityId.BALL_FETCH)
      .enemyMoveset(MoveId.SPLASH)
      .startingLevel(100)
      .enemyLevel(100);
  });

  // TODO: create test when we have a method to check the actual turn order
  it.todo("should increase the priority of status moves", async () => {
    game.override.enemySpecies(SpeciesId.NINJASK);
    await game.classicMode.startBattle(SpeciesId.SHUCKLE);
  });

  it("should cause status moves to fail against Dark types", async () => {
    game.override.enemySpecies(SpeciesId.POOCHYENA);
    await game.classicMode.startBattle(SpeciesId.FEEBAS);

    game.move.use(MoveId.TICKLE);
    await game.toEndOfTurn();

    expect(game.field.getEnemyPokemon()).toHaveStatStage(Stat.ATK, 0);
    expect(game.field.getEnemyPokemon()).toHaveStatStage(Stat.DEF, 0);
    expect(game.field.getPlayerPokemon()).toHaveUsedMove({ move: MoveId.TICKLE, result: MoveResult.MISS });
  });

  // regression test for `Move#isTypeImmune`
  it("should cause status moves to fail against Grass/Dark types", async () => {
    game.override.enemySpecies(SpeciesId.CACTURNE);
    await game.classicMode.startBattle(SpeciesId.FEEBAS);

    game.move.use(MoveId.TICKLE);
    await game.toEndOfTurn();

    expect(game.field.getEnemyPokemon()).toHaveStatStage(Stat.ATK, 0);
    expect(game.field.getEnemyPokemon()).toHaveStatStage(Stat.DEF, 0);
    expect(game.field.getPlayerPokemon()).toHaveUsedMove({ move: MoveId.TICKLE, result: MoveResult.MISS });
  });
});
