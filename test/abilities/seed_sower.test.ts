import { TerrainType } from "#app/data/terrain";
import { Abilities } from "#enums/abilities";
import { Moves } from "#enums/moves";
import { Species } from "#enums/species";
import GameManager from "#test/testUtils/gameManager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";

describe("Abilities - Seed Sower", () => {
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
    game.override.battleStyle("single");
    game.override.disableCrits();

    game.override.enemySpecies(Species.MAGIKARP);
    game.override.enemyAbility(Abilities.BALL_FETCH);

    game.override.starterSpecies(Species.ARBOLIVA);
    game.override.ability(Abilities.SEED_SOWER);
    game.override.moveset([Moves.SPLASH]);
  });

  it("should trigger when hit with damaging move", async () => {
    game.override.enemyMoveset([Moves.TACKLE]);
    await game.classicMode.startBattle();

    game.move.select(Moves.SPLASH);
    await game.toNextTurn();

    expect(game.scene.arena.terrain?.terrainType).toBe(TerrainType.GRASSY);
  });

  it("should trigger even when fainting", async () => {
    game.override.enemyMoveset([Moves.TACKLE]).enemyLevel(100).startingLevel(1);
    await game.classicMode.startBattle([Species.ARBOLIVA, Species.MAGIKARP]);

    game.move.select(Moves.SPLASH);
    game.doSelectPartyPokemon(1);
    await game.toNextTurn();

    expect(game.scene.arena.terrain?.terrainType).toBe(TerrainType.GRASSY);
  });

  it("should not trigger when targetted with status moves", async () => {
    game.override.enemyMoveset([Moves.GROWL]);
    await game.classicMode.startBattle();

    game.move.select(Moves.SPLASH);
    await game.toNextTurn();

    expect(game.scene.arena.terrain?.terrainType).not.toBe(TerrainType.GRASSY);
  });
});
