import { BattleStat } from "#app/data/battle-stat.js";
import { Abilities } from "#app/enums/abilities.js";
import { TurnEndPhase } from "#app/phases/turn-end-phase.js";
import GameManager from "#test/utils/gameManager";
import { getMovePosition } from "#test/utils/gameManagerUtils";
import { Moves } from "#enums/moves";
import { Species } from "#enums/species";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

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
    game.override.battleType("single");
    game.override.moveset([Moves.DOUBLE_TEAM]);
    game.override.disableCrits();
    game.override.ability(Abilities.BALL_FETCH);
    game.override.enemySpecies(Species.SHUCKLE);
    game.override.enemyAbility(Abilities.BALL_FETCH);
    game.override.enemyMoveset([Moves.TACKLE, Moves.TACKLE, Moves.TACKLE, Moves.TACKLE]);
  });

  it("increases the user's evasion by one stage.", async () => {
    await game.startBattle([Species.MAGIKARP]);

    const ally = game.scene.getPlayerPokemon()!;
    const enemy = game.scene.getEnemyPokemon()!;

    vi.spyOn(enemy, "getAccuracyMultiplier");
    expect(ally.summonData.battleStats[BattleStat.EVA]).toBe(0);

    game.doAttack(getMovePosition(game.scene, 0, Moves.DOUBLE_TEAM));
    await game.phaseInterceptor.to(TurnEndPhase);
    await game.toNextTurn();

    expect(ally.summonData.battleStats[BattleStat.EVA]).toBe(1);
    expect(enemy.getAccuracyMultiplier).toHaveReturnedWith(.75);
  });
});
