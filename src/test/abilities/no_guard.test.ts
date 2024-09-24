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

  it("should guarantee double battle with any one LURE", async () => {
    game.override
      .startingModifier([
        { name: "LURE" },
      ])
      .startingWave(2);

    await game.classicMode.startBattle();

    expect(game.scene.getEnemyField().length).toBe(2);
  });
});
