import { allMoves } from "#data/data-lists";
import { AbilityId } from "#enums/ability-id";
import { MoveId } from "#enums/move-id";
import { SpeciesId } from "#enums/species-id";
import { GameManager } from "#test/test-utils/game-manager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

describe("Moves - Rollout", () => {
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
      .criticalHits(false)
      .battleStyle("single")
      .starterSpecies(SpeciesId.RATTATA)
      .ability(AbilityId.BALL_FETCH)
      .enemySpecies(SpeciesId.BIDOOF)
      .enemyAbility(AbilityId.BALL_FETCH)
      .startingLevel(100)
      .enemyLevel(100)
      .enemyMoveset(MoveId.SPLASH);
  });

  it("should double its dmg on sequential uses but reset after 5", async () => {
    game.override.moveset([MoveId.ROLLOUT]);
    vi.spyOn(allMoves[MoveId.ROLLOUT], "accuracy", "get").mockReturnValue(100); //always hit

    const variance = 5;
    const turns = 6;
    const dmgHistory: number[] = [];

    await game.classicMode.startBattle();

    const playerPkm = game.field.getPlayerPokemon();
    vi.spyOn(playerPkm, "stats", "get").mockReturnValue([500000, 1, 1, 1, 1, 1]); // HP, ATK, DEF, SPATK, SPDEF, SPD

    const enemyPkm = game.field.getEnemyPokemon();
    vi.spyOn(enemyPkm, "stats", "get").mockReturnValue([500000, 1, 1, 1, 1, 1]); // HP, ATK, DEF, SPATK, SPDEF, SPD
    vi.spyOn(enemyPkm, "getHeldItems").mockReturnValue([]); //no berries

    enemyPkm.hp = enemyPkm.getMaxHp();
    let previousHp = enemyPkm.hp;

    for (let i = 0; i < turns; i++) {
      game.move.select(MoveId.ROLLOUT);
      await game.toNextTurn();
      dmgHistory.push(previousHp - enemyPkm.hp);
      previousHp = enemyPkm.hp;
    }

    const [turn1Dmg, turn2Dmg, turn3Dmg, turn4Dmg, turn5Dmg, turn6Dmg] = dmgHistory;

    expect(turn2Dmg).toBeGreaterThanOrEqual(turn1Dmg * 2 - variance);
    expect(turn2Dmg).toBeLessThanOrEqual(turn1Dmg * 2 + variance);
    expect(turn3Dmg).toBeGreaterThanOrEqual(turn2Dmg * 2 - variance);
    expect(turn3Dmg).toBeLessThanOrEqual(turn2Dmg * 2 + variance);
    expect(turn4Dmg).toBeGreaterThanOrEqual(turn3Dmg * 2 - variance);
    expect(turn4Dmg).toBeLessThanOrEqual(turn3Dmg * 2 + variance);
    expect(turn5Dmg).toBeGreaterThanOrEqual(turn4Dmg * 2 - variance);
    expect(turn5Dmg).toBeLessThanOrEqual(turn4Dmg * 2 + variance);
    // reset
    expect(turn6Dmg).toBeGreaterThanOrEqual(turn1Dmg - variance);
    expect(turn6Dmg).toBeLessThanOrEqual(turn1Dmg + variance);
  });
});
