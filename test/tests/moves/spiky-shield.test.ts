/*
 * SPDX-FileCopyrightText: 2024-2026 Pagefault Games
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { AbilityId } from "#enums/ability-id";
import { MoveId } from "#enums/move-id";
import { SpeciesId } from "#enums/species-id";
import { Stat } from "#enums/stat";
import { GameManager } from "#test/framework/game-manager";
import { toDmgValue } from "#utils/common";
import Phaser from "phaser";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";

describe("Move - Spiky Shield", () => {
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
      .enemyMoveset(MoveId.SPIKY_SHIELD)
      .startingLevel(100)
      .enemyLevel(100);
  });

  it("should block damage from contact moves and deal 1/8 damage to the attacker", async () => {
    await game.classicMode.startBattle(SpeciesId.FEEBAS);

    const player = game.field.getPlayerPokemon();
    const maxHp = player.getMaxHp();
    const damageRatio = 1 / 8;
    const enemy = game.field.getEnemyPokemon();

    game.move.use(MoveId.TACKLE);
    await game.toEndOfTurn();

    expect(player).toHaveHp(maxHp - toDmgValue(maxHp * damageRatio));
    expect(enemy).toHaveFullHp();
  });

  it("should block damage from non-contact moves and not deal damage to the attacker", async () => {
    await game.classicMode.startBattle(SpeciesId.FEEBAS);

    const player = game.field.getPlayerPokemon();
    const enemy = game.field.getEnemyPokemon();

    game.move.use(MoveId.EMBER);
    await game.toEndOfTurn();

    expect(player).toHaveFullHp();
    expect(enemy).toHaveFullHp();
  });

  it("should block non-damaging moves and not deal damage to the attacker", async () => {
    await game.classicMode.startBattle(SpeciesId.FEEBAS);

    const player = game.field.getPlayerPokemon();
    const enemy = game.field.getEnemyPokemon();

    game.move.use(MoveId.TICKLE);
    await game.toEndOfTurn();

    expect(player).toHaveFullHp();
    expect(enemy).toHaveStatStage(Stat.ATK, 0);
    expect(enemy).toHaveStatStage(Stat.DEF, 0);
  });
});
