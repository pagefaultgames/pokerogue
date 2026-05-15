/*
 * SPDX-FileCopyrightText: 2024-2025 Pagefault Games
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { AbilityId } from "#enums/ability-id";
import { BattlerIndex } from "#enums/battler-index";
import { Challenges } from "#enums/challenges";
import { MoveId } from "#enums/move-id";
import { MoveResult } from "#enums/move-result";
import { PokemonType } from "#enums/pokemon-type";
import { SpeciesId } from "#enums/species-id";
import { WeatherType } from "#enums/weather-type";
import { GameManager } from "#test/framework/game-manager";
import Phaser from "phaser";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";

describe("Move - Conversion 2", () => {
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

  it("should change the user to a random type resisting the target's last move", async () => {
    await game.classicMode.startBattle(SpeciesId.PIDGEOT);

    const player = game.field.getPlayerPokemon();

    game.move.use(MoveId.CONVERSION_2);
    await game.move.forceEnemyMove(MoveId.QUICK_ATTACK);
    await game.toEndOfTurn();

    expect(player).toHaveTypes([PokemonType.ROCK, PokemonType.STEEL], { mode: "oneOf" });
    expect(player.getTypes()).toHaveLength(1);
  });

  it("should fail if the target has not used a move", async () => {
    await game.classicMode.startBattle(SpeciesId.FEEBAS);

    const player = game.field.getPlayerPokemon();

    game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.ENEMY]);
    game.move.use(MoveId.CONVERSION_2);
    await game.move.forceEnemyMove(MoveId.TACKLE);
    await game.toEndOfTurn();

    expect(player).toHaveUsedMove({ move: MoveId.CONVERSION_2, result: MoveResult.FAIL });
    expect(player).toHaveTypes(PokemonType.WATER);
  });

  // TODO: not implemented yet
  it.todo("should fail if the user already has all types that resist the target's move", async () => {
    await game.classicMode.startBattle(SpeciesId.AGGRON);

    const player = game.field.getPlayerPokemon();

    game.setTurnOrder([BattlerIndex.ENEMY, BattlerIndex.PLAYER]);
    game.move.use(MoveId.CONVERSION_2);
    await game.move.forceEnemyMove(MoveId.TACKLE);
    await game.toEndOfTurn();

    expect(player).toHaveUsedMove({ move: MoveId.CONVERSION_2, result: MoveResult.FAIL });
    expect(player).toHaveTypes([PokemonType.ROCK, PokemonType.STEEL]);
  });

  it("should respect inverse battles", async () => {
    game.challengeMode.addChallenge(Challenges.INVERSE_BATTLE, 1, 0);
    await game.challengeMode.startBattle(SpeciesId.PIDGEOT);

    const player = game.field.getPlayerPokemon();

    game.setTurnOrder([BattlerIndex.ENEMY, BattlerIndex.PLAYER]);
    game.move.use(MoveId.CONVERSION_2);
    await game.move.forceEnemyMove(MoveId.GUST);
    await game.toEndOfTurn();

    expect(player).toHaveTypes([PokemonType.FIGHTING, PokemonType.BUG, PokemonType.GRASS], { mode: "oneOf" });
    expect(player.getTypes()).toHaveLength(1);
  });

  // TODO: not implemented yet
  it.todo("should fail if the target's last move has no resistances", async () => {
    await game.classicMode.startBattle(SpeciesId.FEEBAS);

    const player = game.field.getPlayerPokemon();

    game.setTurnOrder([BattlerIndex.ENEMY, BattlerIndex.PLAYER]);
    game.move.use(MoveId.CONVERSION_2);
    await game.move.forceEnemyMove(MoveId.STRUGGLE);
    await game.toEndOfTurn();

    expect(player).toHaveUsedMove({ move: MoveId.CONVERSION_2, result: MoveResult.FAIL });
    expect(player).toHaveTypes(PokemonType.WATER);
  });

  it("should fail if the user is Terastallized", async () => {
    await game.classicMode.startBattle(SpeciesId.FEEBAS);

    const player = game.field.getPlayerPokemon();
    game.field.forceTera(player, PokemonType.FIRE);

    game.move.use(MoveId.CONVERSION_2);
    await game.move.forceEnemyMove(MoveId.QUICK_ATTACK);
    await game.toEndOfTurn();

    expect(player).toHaveUsedMove({ move: MoveId.CONVERSION_2, result: MoveResult.FAIL });
    expect(player).toHaveTypes(PokemonType.FIRE);
  });

  // TODO: not implemented yet
  it.todo("should consider the resolved type of variable-type moves", async () => {
    game.override.weather(WeatherType.RAIN);
    await game.classicMode.startBattle(SpeciesId.AERODACTYL);

    const player = game.field.getPlayerPokemon();

    game.setTurnOrder([BattlerIndex.ENEMY, BattlerIndex.PLAYER]);
    game.move.use(MoveId.CONVERSION_2);
    await game.move.forceEnemyMove(MoveId.WEATHER_BALL);
    await game.toEndOfTurn();

    expect(player).toHaveTypes([PokemonType.WATER, PokemonType.GRASS, PokemonType.DRAGON], { mode: "oneOf" });
    expect(player.getTypes()).toHaveLength(1);
  });

  // TODO: not implemented yet
  it.todo("should consider the resolved type of moves whose type was changed by an ability", async () => {
    game.override.enemyAbility(AbilityId.NORMALIZE);
    await game.classicMode.startBattle(SpeciesId.PIDGEOT);

    const player = game.field.getPlayerPokemon();

    game.setTurnOrder([BattlerIndex.ENEMY, BattlerIndex.PLAYER]);
    game.move.use(MoveId.CONVERSION_2);
    await game.move.forceEnemyMove(MoveId.WATER_GUN);
    await game.toEndOfTurn();

    expect(player).toHaveTypes([PokemonType.ROCK, PokemonType.STEEL], { mode: "oneOf" });
    expect(player.getTypes()).toHaveLength(1);
  });

  // TODO: Verify how Conversion 2 works with status-based failures & move-calling moves
});
