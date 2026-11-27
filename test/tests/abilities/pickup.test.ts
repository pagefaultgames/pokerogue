/*
 * SPDX-FileCopyrightText: 2024-2026 Pagefault Games
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { AbilityId } from "#enums/ability-id";
import { BattlerIndex } from "#enums/battler-index";
import { BerryType } from "#enums/berry-type";
import { MoveId } from "#enums/move-id";
import { PokeballType } from "#enums/pokeball";
import { SpeciesId } from "#enums/species-id";
import { GameManager } from "#test/framework/game-manager";
import Phaser from "phaser";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";

describe("Ability - Pickup", () => {
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
      .ability(AbilityId.PICKUP)
      .battleStyle("single")
      .criticalHits(false)
      .enemySpecies(SpeciesId.MAGIKARP)
      .enemyAbility(AbilityId.BALL_FETCH)
      .enemyMoveset(MoveId.SPLASH)
      .startingLevel(100)
      .enemyLevel(1);
  });

  it("should grab one of the enemies' items after the end of a battle", async () => {
    game.override.enemyHeldItems([{ name: "BERRY", type: BerryType.LUM }]);
    await game.classicMode.startBattle(SpeciesId.FEEBAS);

    const player = game.field.getPlayerPokemon();
    expect(player.getHeldItems()).toHaveLength(0);

    game.move.use(MoveId.AERIAL_ACE);
    await game.toNextWave();

    expect(player.summonData.abilitiesApplied).toContain(AbilityId.PICKUP);
    expect(player.getHeldItems()).toHaveLength(1);
  });

  it("should grab one of the enemies' items in a double battle if the other is caught", async () => {
    game.override //
      .battleStyle("double")
      .enemyHeldItems([{ name: "BERRY", type: BerryType.LUM }]);
    await game.classicMode.startBattle(SpeciesId.FEEBAS);

    const player = game.field.getPlayerPokemon();
    expect(player.getHeldItems()).toHaveLength(0);

    const enemy1 = game.field.getEnemyPokemon();
    game.field.mockAbility(enemy1, AbilityId.STURDY);

    game.move.use(MoveId.NUZZLE, BattlerIndex.PLAYER, BattlerIndex.ENEMY);
    await game.toNextTurn();
    expect(enemy1.getHeldItems()).toHaveLength(0);

    game.move.use(MoveId.AERIAL_ACE, BattlerIndex.PLAYER, BattlerIndex.ENEMY_2);
    await game.toNextTurn();

    game.scene.pokeballCounts[PokeballType.MASTER_BALL] = 1;
    game.doThrowPokeball(PokeballType.MASTER_BALL);
    await game.toNextWave();

    expect(player.summonData.abilitiesApplied).toContain(AbilityId.PICKUP);
    expect(player.getHeldItems()).toHaveLength(1);
  });
});
