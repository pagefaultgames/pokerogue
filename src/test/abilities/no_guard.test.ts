import { BattlerIndex } from "#app/battle";
import { MoveEffectPhase } from "#app/phases/move-effect-phase";
import { MoveEndPhase } from "#app/phases/move-end-phase";
import { Abilities } from "#enums/abilities";
import { Moves } from "#enums/moves";
import { Species } from "#enums/species";
import GameManager from "#test/utils/gameManager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, it, expect, vi } from "vitest";

describe("Abilities - No Guard", () => {
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
      .moveset(Moves.ZAP_CANNON)
      .ability(Abilities.NO_GUARD)
      .enemyLevel(200)
      .enemyAbility(Abilities.BALL_FETCH)
      .enemyMoveset(Moves.SPLASH);
  });

  it("should make moves always hit regardless of move accuracy", async () => {
    game.override.battleType("single");

    await game.classicMode.startBattle([
      Species.REGIELEKI
    ]);

    game.move.select(Moves.ZAP_CANNON);

    await game.setTurnOrder([ BattlerIndex.PLAYER, BattlerIndex.ENEMY ]);

    await game.phaseInterceptor.to(MoveEffectPhase, false);

    const moveEffectPhase = game.scene.getCurrentPhase() as MoveEffectPhase;
    vi.spyOn(moveEffectPhase, "hitCheck");

    await game.phaseInterceptor.to(MoveEndPhase);

    expect(moveEffectPhase.hitCheck).toHaveReturnedWith(true);
  });


  it("should increase the chance of double battles", async () => {
    game.override
      .moveset(Moves.SPLASH)
      .ability(Abilities.NO_GUARD)
      .enemySpecies(Species.SUNKERN)
      .enemyAbility(Abilities.BALL_FETCH)
      .enemyMoveset(Moves.SPLASH)
      .startingWave(9);

    vi.spyOn(game.scene, "getDoubleBattleChance");
    await game.classicMode.startBattle();

    let expected: number = 8;
    game.move.select(Moves.SPLASH);
    if (game.scene.currentBattle.double) {
      game.move.select(Moves.SPLASH);
      expected = 2;
    }
    await game.doKillOpponents();
    await game.toNextWave();
    expect(game.scene.getDoubleBattleChance).toHaveLastReturnedWith(expected);

    expected = 2;
    game.move.select(Moves.SPLASH);
    if (game.scene.currentBattle.double) {
      game.move.select(Moves.SPLASH);
      expected = 1;
    }
    await game.doKillOpponents();
    await game.toNextWave();
    expect(game.scene.getDoubleBattleChance).toHaveLastReturnedWith(expected);
  });

});
