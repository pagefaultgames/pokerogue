/*
 * SPDX-FileCopyrightText: 2025 Pagefault Games
 * SPDX-FileContributor: SirzBenjie
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { getPokemonNameWithAffix } from "#app/messages";
import { AbilityId } from "#enums/ability-id";
import { BattlerIndex } from "#enums/battler-index";
import { BattlerTagType } from "#enums/battler-tag-type";
import { MoveId } from "#enums/move-id";
import { MoveResult } from "#enums/move-result";
import { PokemonType } from "#enums/pokemon-type";
import { SpeciesId } from "#enums/species-id";
import { Stat } from "#enums/stat";
import { GameManager } from "#test/test-utils/game-manager";
import i18next from "i18next";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";

describe("Move - Curse", () => {
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
      .enemyAbility(AbilityId.BALL_FETCH)
      .enemyMoveset(MoveId.SPLASH)
      .moveset(MoveId.CURSE)
      .startingLevel(100)
      .enemyLevel(100);
  });

  it("should raise attack and defense if used by a non-ghost type", async () => {
    await game.classicMode.startBattle([SpeciesId.BULBASAUR]);

    const user = game.field.getPlayerPokemon();

    game.move.select(MoveId.CURSE);
    await game.toEndOfTurn();

    expect(user, "curse move unsuccessful").toHaveUsedMove({
      move: MoveId.CURSE,
      result: MoveResult.SUCCESS,
      targets: [BattlerIndex.PLAYER],
    });

    expect(user, "incorrect attack stage").toHaveStatStage(Stat.ATK, 1);
    expect(user, "incorrect defense stage").toHaveStatStage(Stat.DEF, 1);
    expect(user, "incorrect speed stage").toHaveStatStage(Stat.SPD, -1);
  });

  // Find more awesome utility functions inside `#test/test-utils`!
  it("should apply curse to enemy when used as by a ghost type", async () => {
    await game.classicMode.startBattle([SpeciesId.GASTLY]);

    const user = game.field.getPlayerPokemon();
    const target = game.field.getEnemyPokemon();

    game.move.select(MoveId.CURSE);
    await game.toEndOfTurn();

    expect(user, "curse was not used successfully").toHaveUsedMove({
      move: MoveId.CURSE,
      result: MoveResult.SUCCESS,
      targets: [BattlerIndex.ENEMY],
    });

    expect(game, '"placed curse" message not shown').toHaveShownMessage(
      i18next.t("battlerTags:cursedOnAdd", {
        pokemonNameWithAffix: getPokemonNameWithAffix(user),
        pokemonName: getPokemonNameWithAffix(target),
      }),
    );

    expect(target, "curse status not applied").toHaveBattlerTag(BattlerTagType.CURSED);
    expect(target, "curse damage not applied").toHaveTakenDamage(target.getMaxHp() / 4);
  });

  it("should self-apply curse when used by a protean user", async () => {
    game.override.ability(AbilityId.PROTEAN);
    await game.classicMode.startBattle([SpeciesId.BULBASAUR]);
    // Set player hp to a multiple of 4 so we can easily check damage

    const player = game.field.getPlayerPokemon();
    player.setStat(Stat.HP, 100);
    player.hp = 100;

    game.move.select(MoveId.CURSE);
    await game.toEndOfTurn();

    expect(player, "curse was not used successfully").toHaveUsedMove({
      move: MoveId.CURSE,
      result: MoveResult.SUCCESS,
    });

    expect(player, "curse status not applied").toHaveBattlerTag(BattlerTagType.CURSED);
    // 50 damage for using curse, 25 for its application
    expect(player, "curse damage not applied").toHaveTakenDamage(75);
  });

  describe("should not take user's health if the move is not used successfully", async () => {
    it("due to opponent being semi-invulnerable", async () => {
      game.override.enemyMoveset(MoveId.DIG);
      // flying type to ignore dig's damage
      await game.classicMode.startBattle([SpeciesId.DRIFBLIM]);

      const user = game.field.getPlayerPokemon();
      const target = game.field.getEnemyPokemon();

      // Curse against semi-invulnerable target
      game.move.select(MoveId.CURSE);
      await game.setTurnOrder([target.getBattlerIndex(), user.getBattlerIndex()]);
      await game.toEndOfTurn();

      expect(user, "curse did not miss").toHaveUsedMove({
        move: MoveId.CURSE,
        targets: [target.getBattlerIndex()],
        result: MoveResult.MISS,
      });
      expect(target, "target should not be cursed").not.toHaveBattlerTag(BattlerTagType.CURSED);
    });

    it("due to opponent already having curse", async () => {
      await game.classicMode.startBattle([SpeciesId.GASTLY]);

      const user = game.field.getPlayerPokemon();
      const target = game.field.getEnemyPokemon();
      game.move.select(MoveId.CURSE);
      await game.toEndOfTurn();
      expect(target, "curse was not applied first time").toHaveBattlerTag(BattlerTagType.CURSED);

      user.hp = user.getMaxHp();
      // Curse against target that is already cursed
      game.move.select(MoveId.CURSE);
      await game.toEndOfTurn();

      // Curse against target that is immune due to already being cursed
      expect(user, "curse user should not have lost health").toHaveFullHp();

      /* TODO: Curse's result should be FAIL in this case.
      expect(user, "second curse should have failed").toHaveUsedMove({
         move: MoveId.CURSE,
         turn: 2,
         targets: [target.getBattlerIndex()],
         result: MoveResult.FAIL,
      });
      */
    });

    it("due to target being immune (e.g. crafty shield)", async () => {
      game.override.enemyMoveset(MoveId.CRAFTY_SHIELD);
      await game.classicMode.startBattle([SpeciesId.GASTLY]);
      const user = game.field.getPlayerPokemon();
      const target = game.field.getEnemyPokemon();

      game.move.select(MoveId.CURSE);
      await game.toEndOfTurn();
      // expect(user, "curse should have failed").toHaveUsedMove({
      //   move: MoveId.CURSE,
      //   targets: [target.getBattlerIndex()],
      //   result: MoveResult.FAIL,
      // });
      expect(user, "curse user should not have lost health").toHaveFullHp();
      expect(target, "target should not be cursed").not.toHaveBattlerTag(BattlerTagType.CURSED);
    });
  });

  // TODO: https://github.com/pagefaultgames/pokerogue/issues/6829
  it.todo("should not self-apply curse when used on the turn a mon terastallizes", async () => {
    await game.classicMode.startBattle([SpeciesId.GASTLY]);

    const player = game.field.getPlayerPokemon();
    player.teraType = PokemonType.GHOST;
    const target = game.field.getEnemyPokemon();

    game.move.selectWithTera(MoveId.CURSE);
    await game.toEndOfTurn();

    expect(target, "curse status not applied").toHaveBattlerTag(BattlerTagType.CURSED);
  });
});
