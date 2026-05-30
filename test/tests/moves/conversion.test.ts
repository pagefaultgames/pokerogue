/*
 * SPDX-FileCopyrightText: 2024-2026 Pagefault Games
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { AbilityId } from "#enums/ability-id";
import { MoveId } from "#enums/move-id";
import { MoveResult } from "#enums/move-result";
import { PokemonType } from "#enums/pokemon-type";
import { SpeciesId } from "#enums/species-id";
import { GameManager } from "#test/framework/game-manager";
import Phaser from "phaser";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";

describe("Move - Conversion", () => {
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

  it("should change the user's type to match the type of the move in their first moveset slot", async () => {
    await game.classicMode.startBattle(SpeciesId.FEEBAS);

    const player = game.field.getPlayerPokemon();
    game.move.changeMoveset(player, [MoveId.ABSORB, MoveId.CONVERSION]);

    game.move.select(MoveId.CONVERSION);
    await game.toEndOfTurn();

    expect(player).toHaveTypes(PokemonType.GRASS);
  });

  it("should fail if the user's current types already include the move's type", async () => {
    await game.classicMode.startBattle(SpeciesId.FEEBAS);

    const player = game.field.getPlayerPokemon();
    game.move.changeMoveset(player, [MoveId.WATER_GUN, MoveId.CONVERSION]);

    game.move.select(MoveId.CONVERSION);
    await game.toEndOfTurn();

    expect(player).toHaveUsedMove({ move: MoveId.CONVERSION, result: MoveResult.FAIL });
  });

  it("should fail if the user is Terastallized", async () => {
    await game.classicMode.startBattle(SpeciesId.FEEBAS);

    const player = game.field.getPlayerPokemon();
    game.field.forceTera(player, PokemonType.FIRE);
    game.move.changeMoveset(player, [MoveId.ABSORB, MoveId.CONVERSION]);

    game.move.select(MoveId.CONVERSION);
    await game.toEndOfTurn();

    expect(player).toHaveTypes(PokemonType.FIRE);
    expect(player).toHaveUsedMove({ move: MoveId.CONVERSION, result: MoveResult.FAIL });
  });
});
