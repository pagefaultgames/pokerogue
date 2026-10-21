/*
 * SPDX-FileCopyrightText: 2026 Pagefault Games
 * SPDX-FileContributor: SirzBenjie
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { assetManager } from "#app/global-asset-manager";
import { Status } from "#data/status-effect";
import { AbilityId } from "#enums/ability-id";
import { BattleType } from "#enums/battle-type";
import { MoveId } from "#enums/move-id";
import { SpeciesId } from "#enums/species-id";
import { StatusEffect } from "#enums/status-effect";
import { GameManager } from "#test/framework/game-manager";
import Phaser from "phaser";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

describe("Asset sweep schedule", () => {
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
      .battleStyle("single")
      .battleType(BattleType.WILD)
      .enemySpecies(SpeciesId.MAGIKARP)
      .enemyAbility(AbilityId.BALL_FETCH)
      .enemyMoveset(MoveId.SPLASH)
      .ability(AbilityId.BALL_FETCH)
      .moveset(MoveId.SPLASH)
      .startingLevel(100);
  });

  /** Win the current wave and advance to the next one, returning whether a sweep was called. */
  async function sweptOnNextWave(): Promise<boolean> {
    const sweep = vi.spyOn(assetManager, "sweep");
    game.move.select(MoveId.SPLASH);
    await game.doKillOpponents();
    await game.toNextWave();
    return sweep.mock.calls.length > 0;
  }

  it("sweeps on reaching a wave divisible by 5", async () => {
    game.override.startingWave(4);
    await game.classicMode.startBattle(SpeciesId.FEEBAS);

    expect(await sweptOnNextWave()).toBe(true);
    expect(game.scene.currentBattle.waveIndex).toBe(5);
  });

  it("sweeps on the wave after a trainer battle", async () => {
    game.override.startingWave(2).battleType(BattleType.TRAINER);
    await game.classicMode.startBattle(SpeciesId.FEEBAS);
    expect(game.scene.currentBattle.trainer).toBeDefined();
    // Faint the trainer's reserves, so beating the Pokémon on the field ends the battle
    for (const reserve of game.scene.currentBattle.enemyParty.slice(1)) {
      reserve.hp = 0;
      reserve.status = new Status(StatusEffect.FAINT);
    }
    game.override.battleType(BattleType.WILD);

    expect(await sweptOnNextWave()).toBe(true);
    expect(game.scene.currentBattle.waveIndex).toBe(3);
  });
});
