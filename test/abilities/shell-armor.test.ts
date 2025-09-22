import { AbilityId } from "#enums/ability-id";
import { MoveId } from "#enums/move-id";
import { SpeciesId } from "#enums/species-id";
import { StatusEffect } from "#enums/status-effect";
import { Pokemon } from "#field/pokemon";
import type { Move } from "#moves/move";
import { GameManager } from "#test/test-utils/game-manager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it, type MockInstance, vi } from "vitest";

describe("Abilities - Shell Armor", () => {
  let phaserGame: Phaser.Game;
  let game: GameManager;
  let critSpy: MockInstance<(source: Pokemon, move: Move, simulated?: boolean) => boolean>;

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
      .ability(AbilityId.SHELL_ARMOR)
      .battleStyle("single")
      .enemySpecies(SpeciesId.MAGIKARP)
      .enemyAbility(AbilityId.BALL_FETCH)
      .statusEffect(StatusEffect.POISON);

    critSpy = vi.spyOn(Pokemon.prototype, "getCriticalHitResult");
  });

  it("should prevent natural crit rolls from suceeding", async () => {
    game.override.criticalHits(true); // force random crit rolls to always succeed
    await game.classicMode.startBattle([SpeciesId.ABOMASNOW]);

    game.move.use(MoveId.SPLASH);
    await game.move.forceEnemyMove(MoveId.TACKLE);
    await game.phaseInterceptor.to("TurnEndPhase");

    expect(critSpy).toHaveReturnedWith(false);
  });

  it("should prevent guaranteed-crit moves from critting", async () => {
    await game.classicMode.startBattle([SpeciesId.ABOMASNOW]);

    game.move.use(MoveId.SPLASH);
    await game.move.forceEnemyMove(MoveId.FLOWER_TRICK);
    await game.phaseInterceptor.to("TurnEndPhase");

    expect(critSpy).toHaveReturnedWith(false);
  });

  it("should block Merciless guaranteed crits", async () => {
    game.override.enemyAbility(AbilityId.MERCILESS);
    await game.classicMode.startBattle([SpeciesId.ABOMASNOW]);

    game.move.use(MoveId.SPLASH);
    await game.move.forceEnemyMove(MoveId.TACKLE);
    await game.phaseInterceptor.to("TurnEndPhase");

    expect(critSpy).toHaveReturnedWith(false);
  });
});
