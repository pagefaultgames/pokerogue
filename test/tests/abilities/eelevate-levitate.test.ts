/*
 * SPDX-FileCopyrightText: 2024-2026 Pagefault Games
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { AbilityId } from "#enums/ability-id";
import { MoveId } from "#enums/move-id";
import { SpeciesId } from "#enums/species-id";
import { Stat } from "#enums/stat";
import { StatusEffect } from "#enums/status-effect";
import { GameManager } from "#test/framework/game-manager";
import Phaser from "phaser";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";

describe.each([
  { abilityId: AbilityId.EELEVATE, abilityName: "Eelevate" },
  { abilityId: AbilityId.LEVITATE, abilityName: "Levitate" },
])("Ability - $abilityName", ({ abilityId }) => {
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
      .ability(abilityId)
      .battleStyle("single")
      .criticalHits(false)
      .enemySpecies(SpeciesId.MAGIKARP)
      .enemyAbility(AbilityId.BALL_FETCH)
      .enemyMoveset(MoveId.SPLASH)
      .startingLevel(100)
      .enemyLevel(100);
  });

  it("should protect the user from Ground-type moves", async () => {
    await game.classicMode.startBattle(SpeciesId.FEEBAS);

    const player = game.field.getPlayerPokemon();

    game.move.use(MoveId.SPLASH);
    await game.move.forceEnemyMove(MoveId.EARTHQUAKE);
    await game.toEndOfTurn();

    expect(player).toHaveFullHp();
  });

  it.each([
    { moveId: MoveId.SPIKES, hazardName: "Spikes" },
    { moveId: MoveId.TOXIC_SPIKES, hazardName: "Toxic Spikes" },
    { moveId: MoveId.STICKY_WEB, hazardName: "Sticky Web" },
  ])("should protect the user from ground hazards ($hazardName)", async ({ moveId }) => {
    await game.classicMode.startBattle(SpeciesId.FEEBAS, SpeciesId.MILOTIC);

    game.move.use(MoveId.SPLASH);
    await game.move.forceEnemyMove(moveId);
    await game.toNextTurn();

    game.doSwitchPokemon(1);
    await game.move.forceEnemyMove(MoveId.SPLASH);
    await game.toEndOfTurn();

    const player = game.field.getPlayerPokemon();
    expect(player.species.speciesId).toBe(SpeciesId.MILOTIC);

    expect(player).toHaveFullHp();
    expect(player).toHaveStatusEffect(StatusEffect.NONE);
    expect(player).toHaveStatStage(Stat.SPD, 0);
  });
});
