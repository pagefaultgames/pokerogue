/*
 * SPDX-FileCopyrightText: 2024-2025 Pagefault Games
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { AbilityId } from "#enums/ability-id";
import { MoveId } from "#enums/move-id";
import { SpeciesId } from "#enums/species-id";
import { type BattleStat, Stat, type StatStage } from "#enums/stat";
import { GameManager } from "#test/test-utils/game-manager";
import { toDmgValue } from "#utils/common";
import Phaser from "phaser";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

describe.each<{ name: string; ability: AbilityId; stages: Partial<Record<BattleStat, StatStage>> }>([
  {
    name: "Anger Shell",
    ability: AbilityId.ANGER_SHELL,
    stages: { [Stat.ATK]: 1, [Stat.SPATK]: 1, [Stat.SPD]: 1, [Stat.DEF]: -1, [Stat.SPDEF]: -1 },
  },
  { name: "Berserk", ability: AbilityId.BERSERK, stages: { [Stat.SPATK]: 1 } },
])("Ability - $name", ({ ability, stages }) => {
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
      .ability(ability)
      .battleStyle("single")
      .criticalHits(false)
      .enemySpecies(SpeciesId.MAGIKARP)
      .enemyAbility(AbilityId.BALL_FETCH)
      .enemyMoveset(MoveId.SPLASH)
      .startingLevel(100)
      .enemyLevel(100);
  });

  it("should change the user's stat stages when dropping below 50% HP", async () => {
    await game.classicMode.startBattle(SpeciesId.FEEBAS);

    const feebas = game.field.getPlayerPokemon();
    feebas.hp = toDmgValue(feebas.getMaxHp() / 2) + 1;

    game.move.use(MoveId.SPLASH);
    await game.move.forceEnemyMove(MoveId.FALSE_SWIPE);
    await game.toEndOfTurn();

    expect(feebas).toHaveAbilityApplied(ability);
    for (const [statStr, stage] of Object.entries(stages)) {
      // TODO: Remove type assertion once Object.entries is properly typed
      const stat = Number(statStr) as BattleStat;
      expect(feebas).toHaveStatStage(stat, stage);
    }
  });

  it("should not trigger if not knocked below half HP", async () => {
    await game.classicMode.startBattle(SpeciesId.FEEBAS);

    const feebas = game.field.getPlayerPokemon();
    vi.spyOn(feebas, "getBaseDamage").mockReturnValue(1);

    game.move.use(MoveId.SPLASH);
    await game.move.forceEnemyMove(MoveId.TACKLE);
    await game.toNextTurn();

    expect(feebas.getHpRatio()).toBeGreaterThan(0.5);
    expect(feebas).not.toHaveAbilityApplied(ability);

    // do it again, but start already below half
    feebas.hp = toDmgValue(feebas.getMaxHp() / 2) - 1;

    game.move.use(MoveId.SPLASH);
    await game.move.forceEnemyMove(MoveId.TACKLE);
    await game.toEndOfTurn();

    expect(feebas).not.toHaveAbilityApplied(ability);
  });

  // TODO: Merge into below test case once latter bug is fixed;
  // this regression test is extremely similar to the one below but skips checks that would fail the test

  it("should only proc once for multi-hits with parental bond", async () => {
    game.override.enemyAbility(AbilityId.PARENTAL_BOND);
    await game.classicMode.startBattle(SpeciesId.FEEBAS);

    const feebas = game.field.getPlayerPokemon();
    feebas.hp = toDmgValue(feebas.getMaxHp() / 2) + 2;
    const applySpy = vi.spyOn(feebas.waveData.abilitiesApplied, "add");

    game.move.use(MoveId.SPLASH);
    await game.move.forceEnemyMove(MoveId.TACKLE);
    await game.phaseInterceptor.to("MoveEffectPhase");

    expect(feebas.getHpRatio()).toBeLessThan(0.5);

    // Fake the 2nd hit to always do 1 damage.
    // This checks for a bug where the ability would only look at the first hit's damage for HP thresholds
    // and potentially proc twice
    vi.spyOn(feebas, "getBaseDamage").mockReturnValue(1);

    await game.toEndOfTurn();

    expect(feebas).toHaveAbilityApplied(ability);
    // TODO: Currently Anger Shell technically activates its ability twice due to its stat increases & drops both using a separate attribute.
    // Fix once stat changing effects are reworked to allow changing multiple stats in differing amounts.
    expect(applySpy).toHaveBeenCalledTimes(ability === AbilityId.ANGER_SHELL ? 2 : 1);
    for (const [statStr, stage] of Object.entries(stages)) {
      const stat = Number(statStr) as BattleStat;
      expect(feebas).toHaveStatStage(stat, stage);
    }
  });

  // TODO: This is not implemented yet for lack of multi-hit damage aggregates
  it.todo("should only trigger once after all multi-strike hits finish", async () => {
    await game.classicMode.startBattle(SpeciesId.FEEBAS);

    const feebas = game.field.getPlayerPokemon();
    feebas.hp = toDmgValue(feebas.getMaxHp() / 2) + 1;

    game.move.use(MoveId.SPLASH);
    await game.move.forceEnemyMove(MoveId.TACKLE);
    await game.phaseInterceptor.to("MoveEffectPhase");

    // should not have triggered yet
    expect(feebas).not.toHaveAbilityApplied(ability);

    await game.toEndOfTurn();

    expect(feebas).toHaveAbilityApplied(ability);
    for (const [statStr, stage] of Object.entries(stages)) {
      const stat = Number(statStr) as BattleStat;
      expect(feebas).toHaveStatStage(stat, stage);
    }
  });
});
