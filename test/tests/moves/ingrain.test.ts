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
import { GameManager } from "#test/framework/game-manager";
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

    const player = game.field.getPlayerPokemon();
    const enemy = game.field.getEnemyPokemon();
    enemy.addTag(BattlerTagType.TELEKINESIS);

    game.move.use(MoveId.MUD_SHOT);
    game.setTurnOrder([BattlerIndex.ENEMY, BattlerIndex.PLAYER]);
    await game.move.forceEnemyMove(MoveId.INGRAIN);
    await game.phaseInterceptor.to("MoveEndPhase");

    expect(enemy).toHaveBattlerTag(BattlerTagType.TELEKINESIS);
    expect(enemy).toHaveBattlerTag(BattlerTagType.INGRAIN);
    expect(enemy).toHaveBattlerTag(BattlerTagType.IGNORE_FLYING);
    expect(enemy.isGrounded()).toBe(true);
    expect(game).not.toHaveShownMessage(
      i18next.t("battlerTags:telekinesisOnRemove", {
        pokemonNameWithAffix: getPokemonNameWithAffix(enemy),
      }),
    );

    // check that the accuracy boost still applies
    await game.move.forceMiss();
    await game.toEndOfTurn();

    expect(player).toHaveUsedMove({ move: MoveId.MUD_SHOT, result: MoveResult.SUCCESS });
  });
});
