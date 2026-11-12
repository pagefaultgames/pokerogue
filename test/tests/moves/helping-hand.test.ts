/*
 * SPDX-FileCopyrightText: 2024-2026 Pagefault Games
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { getPokemonNameWithAffix } from "#app/messages";
import { allMoves } from "#data/data-lists";
import { AbilityId } from "#enums/ability-id";
import { BattlerIndex } from "#enums/battler-index";
import { BattlerTagType } from "#enums/battler-tag-type";
import { MoveId } from "#enums/move-id";
import { MoveResult } from "#enums/move-result";
import { SpeciesId } from "#enums/species-id";
import { GameManager } from "#test/framework/game-manager";
import i18next from "i18next";
import Phaser from "phaser";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

describe("Move - Helping Hand", () => {
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
      .battleStyle("double")
      .criticalHits(false)
      .enemySpecies(SpeciesId.MAGIKARP)
      .enemyAbility(AbilityId.BALL_FETCH)
      .enemyMoveset(MoveId.SPLASH)
      .startingLevel(100)
      .enemyLevel(100);
  });

  it("should boost the power of the target ally's move by 1.5x", async () => {
    await game.classicMode.startBattle(SpeciesId.FEEBAS, SpeciesId.MILOTIC);

    const [feebas, milotic] = game.scene.getPlayerField();
    const tackle = allMoves[MoveId.TACKLE];
    vi.spyOn(tackle, "calculateBattlePower");

    game.move.use(MoveId.TACKLE, BattlerIndex.PLAYER, BattlerIndex.ENEMY);
    game.move.use(MoveId.HELPING_HAND, BattlerIndex.PLAYER_2, BattlerIndex.PLAYER);
    await game.toEndOfTurn();

    expect(milotic).toHaveUsedMove({ move: MoveId.HELPING_HAND, result: MoveResult.SUCCESS });
    expect(game).toHaveShownMessage(
      i18next.t("battlerTags:helpingHandOnAdd", {
        pokemonNameWithAffix: getPokemonNameWithAffix(milotic),
        pokemonName: getPokemonNameWithAffix(feebas),
      }),
    );
    expect(tackle.calculateBattlePower).toHaveLastReturnedWith(tackle.power * 1.5);
  });

  // https://github.com/pagefaultgames/pokerogue/issues/5011
  it.each([
    { name: "Fly", move: MoveId.FLY, tagType: BattlerTagType.FLYING },
    { name: "Bounce", move: MoveId.BOUNCE, tagType: BattlerTagType.FLYING },
    { name: "Dig", move: MoveId.DIG, tagType: BattlerTagType.UNDERGROUND },
    { name: "Dive", move: MoveId.DIVE, tagType: BattlerTagType.UNDERWATER },
    { name: "Phantom Force", move: MoveId.PHANTOM_FORCE, tagType: BattlerTagType.HIDDEN },
    { name: "Shadow Force", move: MoveId.SHADOW_FORCE, tagType: BattlerTagType.HIDDEN },
  ])("should boost an ally that is semi-invulnerable from $name", async ({ move, tagType }) => {
    await game.classicMode.startBattle(SpeciesId.FEEBAS, SpeciesId.MILOTIC);

    const [feebas, milotic] = game.scene.getPlayerField();
    const enemy = game.field.getEnemyPokemon();
    const chargingMove = allMoves[move];

    // Turn 1: Feebas becomes semi-invulnerable
    game.move.use(move, BattlerIndex.PLAYER, BattlerIndex.ENEMY);
    game.move.use(MoveId.SPLASH, BattlerIndex.PLAYER_2);
    await game.toNextTurn();

    expect(feebas).toHaveBattlerTag(tagType);

    // Turn 2: Milotic uses Helping Hand before Feebas's attack lands
    game.move.use(MoveId.HELPING_HAND, BattlerIndex.PLAYER_2, BattlerIndex.PLAYER);
    await game.phaseInterceptor.to("MoveEndPhase");

    // Check the boost directly so the result doesn't depend on Feebas's attack hitting
    expect(feebas).toHaveBattlerTag(tagType);
    expect(feebas).toHaveBattlerTag(BattlerTagType.HELPING_HAND);
    expect(chargingMove.calculateBattlePower(feebas, enemy, true)).toBe(chargingMove.power * 1.5);

    await game.toEndOfTurn();

    expect(milotic).toHaveUsedMove({ move: MoveId.HELPING_HAND, result: MoveResult.SUCCESS });
    expect(game).toHaveShownMessage(
      i18next.t("battlerTags:helpingHandOnAdd", {
        pokemonNameWithAffix: getPokemonNameWithAffix(milotic),
        pokemonName: getPokemonNameWithAffix(feebas),
      }),
    );
  });
});
