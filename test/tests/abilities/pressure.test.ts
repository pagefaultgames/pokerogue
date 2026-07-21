/*
 * SPDX-FileCopyrightText: 2024-2026 Pagefault Games
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { getPokemonNameWithAffix } from "#app/messages";
import { AbilityId } from "#enums/ability-id";
import { BattlerIndex } from "#enums/battler-index";
import { MoveId } from "#enums/move-id";
import { SpeciesId } from "#enums/species-id";
import { GameManager } from "#test/framework/game-manager";
import i18next from "i18next";
import Phaser from "phaser";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";

describe("Ability - Pressure", () => {
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
      .ability(AbilityId.PRESSURE)
      .battleStyle("single")
      .criticalHits(false)
      .enemySpecies(SpeciesId.MAGIKARP)
      .enemyAbility(AbilityId.BALL_FETCH)
      .startingLevel(100)
      .enemyLevel(100);
  });

  it("should increase the PP consumption of moves targeting the user by 1", async () => {
    await game.classicMode.startBattle(SpeciesId.FEEBAS);

    const feebas = game.field.getPlayerPokemon();
    feebas.summonData.abilitiesApplied.clear();

    game.move.use(MoveId.SPLASH);
    await game.move.forceEnemyMove(MoveId.TACKLE);
    await game.toEndOfTurn();

    const karp = game.field.getEnemyPokemon();
    expect(feebas).toHaveAbilityApplied(AbilityId.PRESSURE);
    expect(karp).toHaveUsedPP(MoveId.TACKLE, 2);
  });

  it("should stack in double battles if multiple targets have Pressure", async () => {
    game.override.battleStyle("double");
    await game.classicMode.startBattle(SpeciesId.FEEBAS, SpeciesId.MILOTIC);

    game.move.use(MoveId.SPLASH, BattlerIndex.PLAYER);
    game.move.use(MoveId.SPLASH, BattlerIndex.PLAYER_2);
    await game.move.forceEnemyMove(MoveId.SURF);
    await game.move.forceEnemyMove(MoveId.TACKLE);
    await game.toEndOfTurn();

    // surf got docked twice for hitting 2 opponents; tackle only hit 1 and only got docked once
    const [karp1, karp2] = game.scene.getEnemyField();
    expect(karp1).toHaveUsedPP(MoveId.SURF, 3);
    expect(karp2).toHaveUsedPP(MoveId.TACKLE, 2);
  });

  it("should not allow move PP to go below 0", async () => {
    await game.classicMode.startBattle(SpeciesId.FEEBAS);

    const karp = game.field.getEnemyPokemon();

    game.move.use(MoveId.SPLASH);
    await game.move.forceEnemyMove(MoveId.TACKLE);
    karp.moveset[0].ppUsed = karp.moveset[0].getMovePp() - 1;
    await game.toEndOfTurn();

    expect(karp).toHaveUsedPP(MoveId.TACKLE, "all");
  });

  it("should not affect self-targeting moves", async () => {
    await game.classicMode.startBattle(SpeciesId.FEEBAS);

    game.move.use(MoveId.SPLASH);
    await game.move.forceEnemyMove(MoveId.SPLASH);
    await game.toEndOfTurn();

    const karp = game.field.getEnemyPokemon();
    expect(karp).toHaveUsedPP(MoveId.SPLASH, 1);
  });

  it("should not affect allies' moves", async () => {
    game.override.battleStyle("double");
    await game.classicMode.startBattle(SpeciesId.FEEBAS, SpeciesId.MILOTIC);

    game.move.use(MoveId.SPLASH, BattlerIndex.PLAYER);
    game.move.use(MoveId.TACKLE, BattlerIndex.PLAYER_2, BattlerIndex.PLAYER);
    await game.move.forceEnemyMove(MoveId.SPLASH);
    await game.move.forceEnemyMove(MoveId.SPLASH);
    await game.toEndOfTurn();

    const milotic = game.scene.getPlayerField()[1];
    expect(milotic).toHaveUsedPP(MoveId.TACKLE, 1);
  });

  it("should show a message on summon", async () => {
    await game.classicMode.startBattle(SpeciesId.FEEBAS);
    const feebas = game.field.getPlayerPokemon();

    expect(game).toHaveShownMessage(
      i18next.t("abilityTriggers:postSummonPressure", { pokemonNameWithAffix: getPokemonNameWithAffix(feebas) }),
    );
  });
});
