/*
 * SPDX-FileCopyrightText: 2024-2025 Pagefault Games
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { AbilityId } from "#enums/ability-id";
import { BattlerIndex } from "#enums/battler-index";
import { MoveId } from "#enums/move-id";
import { PokemonType } from "#enums/pokemon-type";
import { SpeciesId } from "#enums/species-id";
import { StatusEffect } from "#enums/status-effect";
import { GameManager } from "#test/test-utils/game-manager";
import Phaser from "phaser";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";

describe("Ability - Color Change", () => {
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
      .enemyAbility(AbilityId.COLOR_CHANGE)
      .enemyMoveset(MoveId.SPLASH)
      .startingLevel(100)
      .enemyLevel(100);
  });

  function checkTypeChange(changed: true, newType: PokemonType): void;
  function checkTypeChange(changed: false): void;
  function checkTypeChange(changed: boolean, newType?: PokemonType): void {
    const enemy = game.field.getEnemyPokemon();
    if (changed) {
      expect(enemy).toHaveAbilityApplied(AbilityId.COLOR_CHANGE);
      expect(enemy).toHaveTypes([newType!]);
      return;
    }
    expect(enemy).not.toHaveAbilityApplied(AbilityId.COLOR_CHANGE);
    expect(enemy).toHaveTypes(enemy.getTypes(true, true, true), { mode: "ordered" });
  }

  it("should change the pokemon's type to the move's type", async () => {
    await game.classicMode.startBattle([SpeciesId.FEEBAS]);

    game.move.use(MoveId.TACKLE);
    await game.toEndOfTurn();

    checkTypeChange(true, PokemonType.NORMAL);
  });

  it("should not change the pokemon's type if their current typing includes the move's type", async () => {
    game.override.enemySpecies(SpeciesId.TENTACOOL);
    await game.classicMode.startBattle([SpeciesId.FEEBAS]);

    game.move.use(MoveId.WATER_GUN);
    await game.toEndOfTurn();

    checkTypeChange(false);
  });

  it("should not change the pokemon's type if they are behind a substitute", async () => {
    await game.classicMode.startBattle([SpeciesId.FEEBAS]);

    game.move.use(MoveId.TACKLE);
    await game.move.forceEnemyMove(MoveId.SUBSTITUTE);
    await game.setTurnOrder([BattlerIndex.ENEMY, BattlerIndex.PLAYER]);
    await game.toEndOfTurn();

    checkTypeChange(false);
  });

  it.each([
    { moveId: MoveId.NUZZLE, moveName: "Nuzzle", status: StatusEffect.PARALYSIS, type: PokemonType.ELECTRIC },
    { moveId: MoveId.MORTAL_SPIN, moveName: "Mortal Spin", status: StatusEffect.POISON, type: PokemonType.POISON },
  ])("should change the pokemon's type after status effects would be inflicted ($moveName)", async ({
    moveId,
    status,
    type,
  }) => {
    await game.classicMode.startBattle([SpeciesId.FEEBAS]);

    game.move.use(moveId);
    await game.toEndOfTurn();

    checkTypeChange(true, type);
    expect(game.field.getEnemyPokemon()).toHaveStatusEffect(status);
  });

  it("should not change the pokemon's type when hit by pain split", async () => {
    await game.classicMode.startBattle([SpeciesId.FEEBAS]);

    game.move.use(MoveId.PAIN_SPLIT);
    await game.toEndOfTurn();

    checkTypeChange(false);
  });

  it("should not change the pokemon's type when hit by typeless moves", async () => {
    await game.classicMode.startBattle([SpeciesId.FEEBAS]);

    game.move.use(MoveId.STRUGGLE);
    await game.toEndOfTurn();

    checkTypeChange(false);
  });

  it("should not change the pokemon's type until after the last hit of a multi-hit move", async () => {
    await game.classicMode.startBattle([SpeciesId.FEEBAS]);

    game.move.use(MoveId.DOUBLE_KICK);
    await game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.ENEMY]);
    await game.phaseInterceptor.to("MoveEffectPhase");
    checkTypeChange(false);
    await game.phaseInterceptor.to("MoveEndPhase");
    checkTypeChange(true, PokemonType.FIGHTING);
    await game.toEndOfTurn();
  });

  it("should change the pokemon's type when hit by future sight", async () => {
    await game.classicMode.startBattle([SpeciesId.FEEBAS]);

    game.move.use(MoveId.FUTURE_SIGHT);
    await game.toNextTurn();
    game.move.use(MoveId.RECOVER);
    await game.toNextTurn();
    game.move.use(MoveId.RECOVER);
    await game.toEndOfTurn();

    checkTypeChange(true, PokemonType.PSYCHIC);
  });

  it("should not change the pokemon's type when the pokemon is terastallized", async () => {
    await game.classicMode.startBattle([SpeciesId.FEEBAS]);

    game.field.forceTera(game.field.getEnemyPokemon());

    game.move.use(MoveId.TACKLE);
    await game.toEndOfTurn();

    checkTypeChange(false);
  });
});
