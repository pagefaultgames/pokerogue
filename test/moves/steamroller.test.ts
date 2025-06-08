import { BattlerIndex } from "#app/battle";
import { allMoves } from "#app/data/data-lists";
import { BattlerTagType } from "#app/enums/battler-tag-type";
import type { DamageCalculationResult } from "#app/field/pokemon";
import { AbilityId } from "#enums/ability-id";
import { MoveId } from "#enums/move-id";
import { SpeciesId } from "#enums/species-id";
import GameManager from "#test/testUtils/gameManager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

describe("Moves - Steamroller", () => {
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
    game.override.moveset([MoveId.STEAMROLLER]).battleStyle("single").enemyAbility(AbilityId.BALL_FETCH);
  });

  it("should always hit a minimzed target with double damage", async () => {
    game.override.enemySpecies(SpeciesId.DITTO).enemyMoveset(MoveId.MINIMIZE);
    await game.classicMode.startBattle([SpeciesId.IRON_BOULDER]);

    const ditto = game.scene.getEnemyPokemon()!;
    vi.spyOn(ditto, "getAttackDamage");
    ditto.hp = 5000;
    const steamroller = allMoves[MoveId.STEAMROLLER];
    vi.spyOn(steamroller, "calculateBattleAccuracy");
    const ironBoulder = game.scene.getPlayerPokemon()!;
    vi.spyOn(ironBoulder, "getAccuracyMultiplier");
    // Turn 1
    game.move.select(MoveId.STEAMROLLER);
    await game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.ENEMY]);
    await game.toNextTurn();
    // Turn 2
    game.move.select(MoveId.STEAMROLLER);
    await game.toNextTurn();

    const [dmgCalcTurn1, dmgCalcTurn2]: DamageCalculationResult[] = vi
      .mocked(ditto.getAttackDamage)
      .mock.results.map(r => r.value);

    expect(dmgCalcTurn2.damage).toBeGreaterThanOrEqual(dmgCalcTurn1.damage * 2);
    expect(ditto.getTag(BattlerTagType.MINIMIZED)).toBeDefined();
    expect(steamroller.calculateBattleAccuracy).toHaveReturnedWith(-1);
  });
});
