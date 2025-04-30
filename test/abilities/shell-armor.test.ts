import type Move from "#app/data/moves/move";
import Pokemon from "#app/field/pokemon";
import { Abilities } from "#enums/abilities";
import { Moves } from "#enums/moves";
import { Species } from "#enums/species";
import { StatusEffect } from "#enums/status-effect";
import GameManager from "#test/testUtils/gameManager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi, type MockInstance } from "vitest";

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
      .moveset(Moves.SPLASH)
      .ability(Abilities.SHELL_ARMOR)
      .battleStyle("single")
      .enemySpecies(Species.MAGIKARP)
      .enemyAbility(Abilities.BALL_FETCH)
      .enemyMoveset([Moves.TACKLE, Moves.FLOWER_TRICK])
      .statusEffect(StatusEffect.POISON);

    critSpy = vi.spyOn(Pokemon.prototype, "getCriticalHitResult");
  });

  it("should prevent natural crit rolls from suceeding", async () => {
    game.override.criticalHits(true); // force random crit rolls to always succeed
    await game.classicMode.startBattle([Species.ABOMASNOW]);

    game.move.select(Moves.SPLASH);
    await game.forceEnemyMove(Moves.TACKLE);
    await game.phaseInterceptor.to("TurnEndPhase");

    expect(critSpy).toHaveReturnedWith(false);
  });

  it("should prevent guaranteed-crit moves from critting", async () => {
    await game.classicMode.startBattle([Species.ABOMASNOW]);

    game.move.select(Moves.SPLASH);
    await game.forceEnemyMove(Moves.FLOWER_TRICK);
    await game.phaseInterceptor.to("TurnEndPhase");

    expect(critSpy).toHaveReturnedWith(false);
  });

  it("should block Merciless guaranteed crits", async () => {
    game.override.enemyMoveset(Moves.ACCELEROCK).enemyAbility(Abilities.MERCILESS);
    await game.classicMode.startBattle([Species.ABOMASNOW]);

    game.move.select(Moves.SPLASH);
    await game.phaseInterceptor.to("TurnEndPhase");

    expect(critSpy).toHaveReturnedWith(false);
  });
});
