/*
 * SPDX-FileCopyrightText: 2024-2026 Pagefault Games
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { AbilityId } from "#enums/ability-id";
import { BattlerIndex } from "#enums/battler-index";
import { MoveId } from "#enums/move-id";
import { SpeciesId } from "#enums/species-id";
import { GameManager } from "#test/framework/game-manager";
import Phaser from "phaser";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

describe("Move - Frenzy retargeting", () => {
  let phaserGame: Phaser.Game;
  let game: GameManager;

  beforeAll(() => {
    phaserGame = new Phaser.Game({ type: Phaser.HEADLESS });
  });

  beforeEach(() => {
    game = new GameManager(phaserGame);
    game.override
      .ability(AbilityId.BALL_FETCH)
      .battleStyle("single")
      .criticalHits(false)
      .enemySpecies(SpeciesId.SHUCKLE)
      .enemyAbility(AbilityId.BALL_FETCH)
      .enemyMoveset(MoveId.SPLASH)
      .startingLevel(100)
      .enemyLevel(100);
  });

  it("queues a target for each frenzy turn", async () => {
    game.override.battleStyle("double");
    await game.classicMode.startBattle(SpeciesId.FEEBAS, SpeciesId.MAGIKARP);

    const feebas = game.field.getPlayerPokemon();
    vi.spyOn(feebas, "randBattleSeedIntRange").mockReturnValue(2);

    game.move.use(MoveId.THRASH, 0);
    game.move.use(MoveId.SPLASH, 1);
    await game.toNextTurn();

    const targets = feebas.summonData.moveQueue.map(q => q.targets[0]);
    expect(targets).toHaveLength(2);
    for (const target of targets) {
      expect([BattlerIndex.ENEMY, BattlerIndex.ENEMY_2]).toContain(target);
    }
  });

  it("hits different enemies on different turns with Thrash", async () => {
    game.override.battleStyle("double");
    await game.classicMode.startBattle(SpeciesId.FEEBAS, SpeciesId.MAGIKARP);

    const feebas = game.field.getPlayerPokemon();
    let pick = 0;
    vi.spyOn(feebas, "randBattleSeedIntRange").mockReturnValue(2);
    vi.spyOn(feebas, "randBattleSeedInt").mockImplementation(() => pick++ % 2);

    game.move.use(MoveId.THRASH, 0);
    game.move.use(MoveId.SPLASH, 1);
    await game.toNextTurn();

    const targets = feebas.summonData.moveQueue.map(q => q.targets[0]);
    expect(new Set(targets).size).toBe(2);
  });

  it("hits different enemies on different turns with Outrage", async () => {
    game.override.battleStyle("double");
    await game.classicMode.startBattle(SpeciesId.FEEBAS, SpeciesId.MAGIKARP);

    const feebas = game.field.getPlayerPokemon();
    let pick = 0;
    vi.spyOn(feebas, "randBattleSeedIntRange").mockReturnValue(2);
    vi.spyOn(feebas, "randBattleSeedInt").mockImplementation(() => pick++ % 2);

    game.move.use(MoveId.OUTRAGE, 0);
    game.move.use(MoveId.SPLASH, 1);
    await game.toNextTurn();

    const targets = feebas.summonData.moveQueue.map(q => q.targets[0]);
    expect(new Set(targets).size).toBe(2);
  });

  it("hits different enemies on different turns with Petal Dance", async () => {
    game.override.battleStyle("double");
    await game.classicMode.startBattle(SpeciesId.FEEBAS, SpeciesId.MAGIKARP);

    const feebas = game.field.getPlayerPokemon();
    let pick = 0;
    vi.spyOn(feebas, "randBattleSeedIntRange").mockReturnValue(2);
    vi.spyOn(feebas, "randBattleSeedInt").mockImplementation(() => pick++ % 2);

    game.move.use(MoveId.PETAL_DANCE, 0);
    game.move.use(MoveId.SPLASH, 1);
    await game.toNextTurn();

    const targets = feebas.summonData.moveQueue.map(q => q.targets[0]);
    expect(new Set(targets).size).toBe(2);
  });

  it("hits the only enemy in a single battle", async () => {
    await game.classicMode.startBattle(SpeciesId.FEEBAS);

    const feebas = game.field.getPlayerPokemon();
    game.move.use(MoveId.THRASH);
    await game.toNextTurn();

    const targets = feebas.summonData.moveQueue.map(q => q.targets[0]);
    expect(targets.every(t => t === BattlerIndex.ENEMY)).toBe(true);
  });

  it.todo("works the same for Raging Fury");
  it.todo("doesn't crash if a pre-picked target faints first");
  it.todo("Rollout keeps the SAME target every turn (no re-roll)");
  it.todo("Ice Ball keeps the SAME target every turn (no re-roll)");
});