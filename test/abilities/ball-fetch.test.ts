/*
 * SPDX-FileCopyrightText: 2024-2025 Pagefault Games
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { getPokemonNameWithAffix } from "#app/messages";
import { getPokeballName } from "#data/pokeball";
import { AbilityId } from "#enums/ability-id";
import { MoveId } from "#enums/move-id";
import { PokeballType } from "#enums/pokeball";
import { SpeciesId } from "#enums/species-id";
import { GameManager } from "#test/test-utils/game-manager";
import i18next from "i18next";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

// NB: These tests pass when done locally, but we currently have no mechanism to make catches fail
// due to battle scene RNG overrides making ball shake checks always succeed.
//
// TODO: Enable suite once `AttemptCapturePhase` is made sane
describe.todo("Ability - Ball Fetch", () => {
  let phaserGame: Phaser.Game;
  let game: GameManager;

  beforeAll(() => {
    phaserGame = new Phaser.Game({
      type: Phaser.HEADLESS,
    });
  });

  afterEach(() => {
    game.phaseInterceptor.restoreOg();
  });

  beforeEach(() => {
    game = new GameManager(phaserGame);
    game.override
      .ability(AbilityId.BALL_FETCH)
      .battleStyle("single")
      .criticalHits(false)
      .enemySpecies(SpeciesId.MAGIKARP)
      .enemyMoveset(MoveId.SPLASH)
      .startingLevel(100)
      .enemyLevel(100);
  });

  it("should restore the user's first failed ball throw at end of turn", async () => {
    await game.classicMode.startBattle([SpeciesId.FEEBAS]);

    const feebas = game.field.getPlayerPokemon();
    const karp = game.field.getEnemyPokemon();

    vi.spyOn(karp.species, "catchRate", "get").mockReturnValue(0);

    game.doThrowPokeball(PokeballType.POKEBALL);
    await game.toEndOfTurn(false);

    expect(game.scene.pokeballCounts[PokeballType.POKEBALL]).toBe(4);

    await game.toEndOfTurn();

    expect(feebas).toHaveAbilityApplied(AbilityId.BALL_FETCH);
    expect(game.scene.pokeballCounts[PokeballType.POKEBALL]).toBe(5);
    expect(game).toHaveShownMessage(
      i18next.t("abilityTriggers:fetchBall", {
        pokemonNameWithAffix: getPokemonNameWithAffix(feebas),
        pokeballName: getPokeballName(PokeballType.POKEBALL),
      }),
    );
  });

  it("should not work on enemies", async () => {
    game.override.ability(AbilityId.AIR_LOCK).enemyAbility(AbilityId.BALL_FETCH);
    await game.classicMode.startBattle([SpeciesId.FEEBAS]);

    const karp = game.field.getEnemyPokemon();

    vi.spyOn(karp.species, "catchRate", "get").mockReturnValue(0);

    game.doThrowPokeball(PokeballType.POKEBALL);
    await game.toEndOfTurn(false);

    expect(game.scene.pokeballCounts[PokeballType.POKEBALL]).toBe(4);

    await game.toEndOfTurn();

    // did nothing; still at 4 balls
    expect(karp).not.toHaveAbilityApplied(AbilityId.BALL_FETCH);
    expect(game.scene.pokeballCounts[PokeballType.POKEBALL]).toBe(4);
  });
});
