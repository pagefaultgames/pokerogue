import { allMoves } from "#app/data/moves/move";
import { Abilities } from "#enums/abilities";
import { Moves } from "#enums/moves";
import { Species } from "#enums/species";
import GameManager from "#test/testUtils/gameManager";
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
    game.override.disableCrits();
    game.override.battleStyle("single");
    game.override.starterSpecies(Species.RATTATA);
    game.override.ability(Abilities.BALL_FETCH);
    game.override.enemySpecies(Species.BIDOOF);
    game.override.enemyAbility(Abilities.BALL_FETCH);
    game.override.startingLevel(100);
    game.override.enemyLevel(100);
    game.override.enemyMoveset(Moves.SPLASH);
  });

  it("should double dmg on sequential uses but reset after 5", async () => {
    game.override.moveset(Moves.ROLLOUT);
    vi.spyOn(allMoves[Moves.ROLLOUT], "accuracy", "get").mockReturnValue(100); // always hit

    await game.startBattle();

    const playerPkm = game.scene.getPlayerParty()[0];
    vi.spyOn(playerPkm, "stats", "get").mockReturnValue([500000, 1, 1, 1, 1, 1]); // HP, ATK, DEF, SPATK, SPDEF, SPD

    const enemyPkm = game.scene.getEnemyParty()[0];
    vi.spyOn(enemyPkm, "stats", "get").mockReturnValue([500000, 1, 1, 1, 1, 1]); // HP, ATK, DEF, SPATK, SPDEF, SPD

    let previousHp = enemyPkm.hp;
    const dmgHistory: number[] = [];

    for (let i = 0; i < 6; i++) {
      game.move.select(Moves.ROLLOUT);
      await game.toNextTurn();

      dmgHistory.push(previousHp - enemyPkm.hp);
      previousHp = enemyPkm.hp;
    }

    const [turn1Dmg, turn2Dmg, turn3Dmg, turn4Dmg, turn5Dmg, turn6Dmg] = dmgHistory;

    // 2 sig figs precision is more than enough
    expect(turn2Dmg).toBeCloseTo(turn1Dmg * 2);
    expect(turn3Dmg).toBeCloseTo(turn2Dmg * 2);
    expect(turn4Dmg).toBeCloseTo(turn3Dmg * 2);
    expect(turn5Dmg).toBeCloseTo(turn4Dmg * 2);
    // reset on turn 6
    expect(turn6Dmg).toBeCloseTo(turn1Dmg);
  });
});
