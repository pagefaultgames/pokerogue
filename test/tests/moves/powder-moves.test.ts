/*
 * SPDX-FileCopyrightText: 2024-2026 Pagefault Games
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { AbilityId } from "#enums/ability-id";
import { MoveId } from "#enums/move-id";
import { MoveResult } from "#enums/move-result";
import { SpeciesId } from "#enums/species-id";
import { StatusEffect } from "#enums/status-effect";
import { GameManager } from "#test/framework/game-manager";
import Phaser from "phaser";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";

describe("Powder Moves", () => {
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

  it("should fail against Grass types", async () => {
    game.override.enemySpecies(SpeciesId.SUNKERN);
    await game.classicMode.startBattle(SpeciesId.FEEBAS);

    game.move.use(MoveId.SPORE);
    await game.toEndOfTurn();

    expect(game.field.getPlayerPokemon()).toHaveUsedMove({ move: MoveId.SPORE, result: MoveResult.MISS });
    expect(game.field.getEnemyPokemon()).toHaveStatusEffect(StatusEffect.NONE);
  });

  // regression test for `Move#isTypeImmune`
  it("should fail against Grass/Dark types", async () => {
    game.override.enemySpecies(SpeciesId.CACTURNE);
    await game.classicMode.startBattle(SpeciesId.FEEBAS);

    game.move.use(MoveId.SPORE);
    await game.toEndOfTurn();

    expect(game.field.getPlayerPokemon()).toHaveUsedMove({ move: MoveId.SPORE, result: MoveResult.MISS });
    expect(game.field.getEnemyPokemon()).toHaveStatusEffect(StatusEffect.NONE);
  });
});
