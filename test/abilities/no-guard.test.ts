import { AbilityId } from "#enums/ability-id";
import { BattlerIndex } from "#enums/battler-index";
import { HitCheckResult } from "#enums/hit-check-result";
import { MoveId } from "#enums/move-id";
import { SpeciesId } from "#enums/species-id";
import { MoveEffectPhase } from "#phases/move-effect-phase";
import { MoveEndPhase } from "#phases/move-end-phase";
import { GameManager } from "#test/test-utils/game-manager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

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
      .moveset(MoveId.ZAP_CANNON)
      .ability(AbilityId.NO_GUARD)
      .enemyLevel(200)
      .enemySpecies(SpeciesId.SNORLAX)
      .enemyAbility(AbilityId.BALL_FETCH)
      .enemyMoveset(MoveId.SPLASH);
  });

  it("should make moves always hit regardless of move accuracy", async () => {
    game.override.battleStyle("single");

    await game.classicMode.startBattle([SpeciesId.REGIELEKI]);

    game.move.select(MoveId.ZAP_CANNON);

    await game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.ENEMY]);

    await game.phaseInterceptor.to(MoveEffectPhase, false);

    const moveEffectPhase = game.scene.phaseManager.getCurrentPhase() as MoveEffectPhase;
    vi.spyOn(moveEffectPhase, "hitCheck");

    await game.phaseInterceptor.to(MoveEndPhase);

    expect(moveEffectPhase.hitCheck).toHaveReturnedWith([HitCheckResult.HIT, 1]);
  });

  it("should guarantee double battle with any one LURE", async () => {
    game.override.startingModifier([{ name: "LURE" }]).startingWave(2);

    await game.classicMode.startBattle();

    expect(game.scene.getEnemyField().length).toBe(2);
  });
});
