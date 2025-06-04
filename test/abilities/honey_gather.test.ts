import type { CommandPhase } from "#app/phases/command-phase";
import { Command } from "#app/ui/command-ui-handler";
import { AbilityId } from "#enums/ability-id";
import { MoveId } from "#enums/move-id";
import { SpeciesId } from "#enums/species-id";
import GameManager from "#test/testUtils/gameManager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

describe("Abilities - Honey Gather", () => {
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
      .moveset([MoveId.SPLASH, MoveId.ROAR, MoveId.THUNDERBOLT])
      .startingLevel(100)
      .ability(AbilityId.HONEY_GATHER)
      .passiveAbility(AbilityId.RUN_AWAY)
      .battleStyle("single")
      .disableCrits()
      .enemySpecies(SpeciesId.MAGIKARP)
      .enemyAbility(AbilityId.BALL_FETCH)
      .enemyMoveset(MoveId.SPLASH);
  });

  it("should give money when winning a battle", async () => {
    await game.classicMode.startBattle([SpeciesId.MILOTIC]);
    game.scene.money = 1000;

    game.move.select(MoveId.THUNDERBOLT);
    await game.toNextWave();

    expect(game.scene.money).toBeGreaterThan(1000);
  });

  it("should not give money when the enemy pokemon flees", async () => {
    await game.classicMode.startBattle([SpeciesId.MILOTIC]);
    game.scene.money = 1000;

    game.move.select(MoveId.ROAR);
    await game.toNextTurn();

    expect(game.scene.money).toBe(1000);
    expect(game.scene.currentBattle.waveIndex).toBe(2);
  });

  it("should not give money when the player flees", async () => {
    await game.classicMode.startBattle([SpeciesId.MILOTIC]);
    game.scene.money = 1000;

    // something weird is going on with the test framework, so this is required to prevent a crash
    const enemy = game.scene.getEnemyPokemon()!;
    vi.spyOn(enemy, "scene", "get").mockReturnValue(game.scene);

    const commandPhase = game.scene.getCurrentPhase() as CommandPhase;
    commandPhase.handleCommand(Command.RUN, 0);
    await game.toNextTurn();

    expect(game.scene.money).toBe(1000);
    expect(game.scene.currentBattle.waveIndex).toBe(2);
  });
});
