/*
 * SPDX-FileCopyrightText: 2024-2025 Pagefault Games
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { getPokemonNameWithAffix } from "#app/messages";
import { AbilityId } from "#enums/ability-id";
import { BattlerTagType } from "#enums/battler-tag-type";
import { MoveId } from "#enums/move-id";
import { SpeciesId } from "#enums/species-id";
import type { EnemyPokemon } from "#field/pokemon";
import { GameManager } from "#test/test-utils/game-manager";
import i18next from "i18next";
import Phaser from "phaser";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";

describe("Move - Misty Terrain", () => {
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
      .enemyLevel(100)
      .moveset([MoveId.MISTY_TERRAIN, MoveId.CONFUSE_RAY, MoveId.DYNAMIC_PUNCH]);
  });

  it("status moves do not confuse target and display message in misty terrain", async () => {
    await game.classicMode.startBattle([SpeciesId.FLOETTE]);

    const enemyPokemon: EnemyPokemon = game.field.getEnemyPokemon();

    game.move.select(MoveId.MISTY_TERRAIN);
    await game.toNextTurn();

    game.move.select(MoveId.CONFUSE_RAY);
    await game.move.forceHit();
    await game.phaseInterceptor.to("BerryPhase", false);

    expect(enemyPokemon).not.toHaveBattlerTag(BattlerTagType.CONFUSED);
    expect(game).toHaveShownMessage(
      i18next.t("terrain:mistyBlockMessage", {
        pokemonNameWithAffix: getPokemonNameWithAffix(enemyPokemon),
      }),
    );
  });

  it("damaging moves that confuse do not display message in misty terrain", async () => {
    await game.classicMode.startBattle([SpeciesId.FLOETTE]);

    const enemyPokemon: EnemyPokemon = game.field.getEnemyPokemon();

    game.move.select(MoveId.MISTY_TERRAIN);
    await game.toNextTurn();

    game.move.select(MoveId.DYNAMIC_PUNCH);
    await game.move.forceHit();
    await game.phaseInterceptor.to("BerryPhase", false);

    expect(enemyPokemon).not.toHaveBattlerTag(BattlerTagType.CONFUSED);
    expect(game).not.toHaveShownMessage(
      i18next.t("terrain:mistyBlockMessage", {
        pokemonNameWithAffix: getPokemonNameWithAffix(enemyPokemon),
      }),
    );
  });
});
