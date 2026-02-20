/*
 * SPDX-FileCopyrightText: 2024-2026 Pagefault Games
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { getPokemonNameWithAffix } from "#app/messages";
import { AbilityId } from "#enums/ability-id";
import { BattlerIndex } from "#enums/battler-index";
import { BattlerTagType } from "#enums/battler-tag-type";
import { MoveId } from "#enums/move-id";
import { MoveResult } from "#enums/move-result";
import { SpeciesId } from "#enums/species-id";
import { GameManager } from "#test/test-utils/game-manager";
import i18next from "i18next";
import Phaser from "phaser";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";

describe("Move - Ingrain", () => {
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

  // TODO: Write tests
  it.todo("should heal the user by 1/16 of their max HP at the end of each turn");

  it.todo("should prevent the user from switching out normally");

  it("should forcibly ground the user without removing relevant effects", async () => {
    await game.classicMode.startBattle(SpeciesId.FEEBAS);

    const feebas = game.field.getPlayerPokemon();
    const karp = game.field.getEnemyPokemon();
    karp.addTag(BattlerTagType.TELEKINESIS);

    game.move.use(MoveId.MUD_SHOT);
    await game.move.forceEnemyMove(MoveId.INGRAIN);
    await game.setTurnOrder([BattlerIndex.ENEMY, BattlerIndex.PLAYER]);
    await game.phaseInterceptor.to("MoveEndPhase");

    expect(karp).toHaveBattlerTag(BattlerTagType.TELEKINESIS);
    expect(karp).toHaveBattlerTag(BattlerTagType.INGRAIN);
    expect(karp).toHaveBattlerTag(BattlerTagType.IGNORE_FLYING);
    expect(karp.isGrounded()).toBe(true);
    expect(game).not.toHaveShownMessage(
      i18next.t("battlerTags:telekinesisOnRemove", {
        pokemonNameWithAffix: getPokemonNameWithAffix(karp),
      }),
    );

    // check that the accuracy boost still applies
    await game.move.forceMiss();
    await game.toEndOfTurn();

    expect(feebas).toHaveUsedMove({ move: MoveId.MUD_SHOT, result: MoveResult.SUCCESS });
  });
});
