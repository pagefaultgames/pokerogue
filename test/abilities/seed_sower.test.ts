import { TerrainType } from "#app/data/terrain";
import { AbilityId } from "#enums/ability-id";
import { MoveId } from "#enums/move-id";
import { SpeciesId } from "#enums/species-id";
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

    game.override.enemySpecies(SpeciesId.MAGIKARP);
    game.override.enemyAbility(AbilityId.BALL_FETCH);

    game.override.starterSpecies(SpeciesId.ARBOLIVA);
    game.override.ability(AbilityId.SEED_SOWER);
    game.override.moveset([MoveId.SPLASH]);
  });

  it("should trigger when hit with damaging move", async () => {
    game.override.enemyMoveset([MoveId.TACKLE]);
    await game.classicMode.startBattle();

    game.move.select(MoveId.SPLASH);
    await game.toNextTurn();

    expect(game.scene.arena.terrain?.terrainType).toBe(TerrainType.GRASSY);
  });

  it("should trigger even when fainting", async () => {
    game.override.enemyMoveset([MoveId.TACKLE]).enemyLevel(100).startingLevel(1);
    await game.classicMode.startBattle([SpeciesId.ARBOLIVA, SpeciesId.MAGIKARP]);

    game.move.select(MoveId.SPLASH);
    game.doSelectPartyPokemon(1);
    await game.toNextTurn();

    expect(game.scene.arena.terrain?.terrainType).toBe(TerrainType.GRASSY);
  });

  it("should not trigger when targetted with status moves", async () => {
    game.override.enemyMoveset([MoveId.GROWL]);
    await game.classicMode.startBattle();

    game.move.select(MoveId.SPLASH);
    await game.toNextTurn();

    expect(game.scene.arena.terrain?.terrainType).not.toBe(TerrainType.GRASSY);
  });
});
