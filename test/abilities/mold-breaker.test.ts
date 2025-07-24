import { AbilityId } from "#enums/ability-id";
import { MoveId } from "#enums/move-id";
import { SpeciesId } from "#enums/species-id";
import { GameManager } from "#test/test-utils/game-manager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";

describe("Abilities - Mold Breaker", () => {
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
      .ability(AbilityId.MOLD_BREAKER)
      .battleStyle("single")
      .criticalHits(false)
      .enemySpecies(SpeciesId.MAGIKARP)
      .enemyAbility(AbilityId.STURDY)
      .enemyMoveset(MoveId.SPLASH);
  });

  it("should turn off the ignore abilities arena variable after the user's move", async () => {
    await game.classicMode.startBattle([SpeciesId.PINSIR]);

    const player = game.field.getPlayerPokemon();
    const enemy = game.field.getEnemyPokemon();

    game.move.use(MoveId.X_SCISSOR);
    await game.phaseInterceptor.to("MoveEffectPhase");

    expect(game.scene.arena.ignoreAbilities).toBe(true);
    expect(game.scene.arena.ignoringEffectSource).toBe(player.getBattlerIndex());

    await game.toEndOfTurn();
    expect(game.scene.arena.ignoreAbilities).toBe(false);
    expect(enemy.isFainted()).toBe(true);
  });
});
