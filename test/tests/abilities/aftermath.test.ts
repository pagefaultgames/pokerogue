/*
 * SPDX-FileCopyrightText: 2024-2026 Pagefault Games
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { AbilityId } from "#enums/ability-id";
import { BattlerIndex } from "#enums/battler-index";
import { MoveId } from "#enums/move-id";
import { SpeciesId } from "#enums/species-id";
import { StatusEffect } from "#enums/status-effect";
import { GameManager } from "#test/framework/game-manager";
import Phaser from "phaser";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";

describe("Abilities - Aftermath", () => {
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
      .enemyAbility(AbilityId.AFTERMATH)
      .enemyMoveset(MoveId.SPLASH)
      .startingLevel(100)
      .enemyLevel(100);
  });

  it("should damage an attacker that knocks out the holder with a contact move by 1/4 of its max HP", async () => {
    await game.classicMode.startBattle(SpeciesId.FEEBAS);

    const feebas = game.field.getPlayerPokemon();
    const magikarp = game.field.getEnemyPokemon();
    magikarp.hp = 1;

    game.move.use(MoveId.TACKLE);
    await game.toEndOfTurn();

    expect(magikarp).toHaveFainted();
    expect(feebas).toHaveTakenDamage(feebas.getMaxHp() / 4);
  });

  it("should not damage an attacker that knocks out the holder with a non-contact move", async () => {
    await game.classicMode.startBattle(SpeciesId.FEEBAS);

    const feebas = game.field.getPlayerPokemon();
    const magikarp = game.field.getEnemyPokemon();
    magikarp.hp = 1;

    game.move.use(MoveId.WATER_GUN);
    await game.toEndOfTurn();

    expect(magikarp).toHaveFainted();
    expect(feebas).toHaveFullHp();
  });

  // https://github.com/pagefaultgames/pokerogue/issues/2621
  it("should not activate when the holder faints from its own Explosion after being hit by a contact move", async () => {
    // Gastly is immune to Explosion, so any damage it takes would come from Aftermath
    await game.classicMode.startBattle(SpeciesId.GASTLY);

    const gastly = game.field.getPlayerPokemon();
    const magikarp = game.field.getEnemyPokemon();

    game.move.use(MoveId.TACKLE);
    await game.move.forceEnemyMove(MoveId.EXPLOSION);
    game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.ENEMY]);
    await game.toEndOfTurn();

    expect(magikarp).toHaveFainted();
    expect(gastly).toHaveFullHp();
  });

  // https://github.com/pagefaultgames/pokerogue/issues/2621
  it("should not activate when the holder faints from poison after being hit by a contact move", async () => {
    await game.classicMode.startBattle(SpeciesId.FEEBAS);

    const feebas = game.field.getPlayerPokemon();
    const magikarp = game.field.getEnemyPokemon();
    magikarp.hp = 2;
    magikarp.doSetStatus(StatusEffect.POISON);

    // False Swipe always leaves the target with at least 1 HP, so the poison damage is what knocks it out
    game.move.use(MoveId.FALSE_SWIPE);
    await game.toEndOfTurn();

    expect(magikarp).toHaveFainted();
    expect(feebas).toHaveFullHp();
  });

  // https://github.com/pagefaultgames/pokerogue/issues/2621
  it("should not crash or activate when the holder uses Self-Destruct after the attacker switches out with U-turn", async () => {
    await game.classicMode.startBattle(SpeciesId.FEEBAS, SpeciesId.MILOTIC);

    const [feebas, milotic] = game.scene.getPlayerParty();
    const magikarp = game.field.getEnemyPokemon();

    game.move.use(MoveId.U_TURN);
    game.doSelectPartyPokemon(1);
    await game.move.forceEnemyMove(MoveId.SELF_DESTRUCT);
    game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.ENEMY]);
    await game.toEndOfTurn();

    expect(magikarp).toHaveFainted();
    expect(milotic.isOnField()).toBe(true);
    expect(feebas).toHaveFullHp();
  });
});
