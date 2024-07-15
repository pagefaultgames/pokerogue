import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import Phaser from "phaser";
import GameManager from "#app/test/utils/gameManager";
import overrides from "#app/overrides";
import { Species } from "#enums/species";
import {
  TurnEndPhase,
} from "#app/phases";
import { Moves } from "#enums/moves";
import { getMovePosition } from "#app/test/utils/gameManagerUtils";
import { BattleStat } from "#app/data/battle-stat.js";
import { allMoves } from "#app/data/move.js";
import { Abilities } from "#app/enums/abilities.js";

describe("Moves - Double Team", () => {
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
    vi.spyOn(overrides, "SINGLE_BATTLE_OVERRIDE", "get").mockReturnValue(true);
    vi.spyOn(overrides, "MOVESET_OVERRIDE", "get").mockReturnValue([Moves.DOUBLE_TEAM]);
    vi.spyOn(overrides, "NEVER_CRIT_OVERRIDE", "get").mockReturnValue(true);
    vi.spyOn(overrides, "ABILITY_OVERRIDE", "get").mockReturnValue(Abilities.BALL_FETCH);
    vi.spyOn(overrides, "OPP_ABILITY_OVERRIDE", "get").mockReturnValue(Abilities.BALL_FETCH);
    vi.spyOn(overrides, "OPP_MOVESET_OVERRIDE", "get").mockReturnValue([Moves.TACKLE, Moves.TACKLE, Moves.TACKLE, Moves.TACKLE]);
  });

  it("increases the user's evasion by one stage.", async () => {
    const moveToCheck = allMoves[Moves.TACKLE];
    await game.startBattle([Species.MAGIKARP]);

    const ally = game.scene.getPlayerPokemon();
    const enemy = game.scene.getEnemyPokemon();
    const preMoveAccMultiplier = enemy.getAccuracyMultiplier(ally, moveToCheck);

    expect(ally.summonData.battleStats[BattleStat.EVA]).toBe(0);

    game.doAttack(getMovePosition(game.scene, 0, Moves.DOUBLE_TEAM));
    await game.phaseInterceptor.to(TurnEndPhase);
    await game.toNextTurn();

    const postMoveAccMultiplier = enemy.getAccuracyMultiplier(ally, moveToCheck);
    expect(ally.summonData.battleStats[BattleStat.EVA]).toBe(1);
    expect(postMoveAccMultiplier).toBeLessThan(preMoveAccMultiplier);
  });
});
