import { AbilityId } from "#enums/ability-id";
import { MoveId } from "#enums/move-id";
import { MoveResult } from "#enums/move-result";
import { SpeciesId } from "#enums/species-id";
import { Stat } from "#enums/stat";
import { GameManager } from "#test/test-utils/game-manager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";

describe("Moves - Parting Shot", () => {
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
      .battleStyle("single")
      .ability(AbilityId.BALL_FETCH)
      .enemySpecies(SpeciesId.MAGIKARP)
      .enemyAbility(AbilityId.BALL_FETCH)
      .enemyMoveset(MoveId.SPLASH);
  });

  it("should switch the user out and lower the target's ATK/SPATK by 1", async () => {
    await game.classicMode.startBattle([SpeciesId.FEEBAS, SpeciesId.MILOTIC]);

    const [feebas, milotic] = game.scene.getPlayerParty();

    game.move.use(MoveId.PARTING_SHOT);
    game.doSelectPartyPokemon(1);
    await game.toEndOfTurn();

    const enemy = game.field.getEnemyPokemon();

    expect(feebas.isOnField()).toBe(false);
    expect(milotic.isOnField()).toBe(false);
    expect(enemy).toHaveStatStage(Stat.ATK, -1);
    expect(enemy).toHaveStatStage(Stat.SPATK, -1);
  });

  // TODO: This is not currently implemented
  it.todo("should fail without switching if stat stages cannot be lowered", async () => {
    await game.classicMode.startBattle([SpeciesId.FEEBAS, SpeciesId.MILOTIC]);

    const feebas = game.field.getPlayerPokemon();
    const enemy = game.field.getEnemyPokemon();
    enemy.setStatStage(Stat.ATK, -6);
    enemy.setStatStage(Stat.SPATK, -6);

    game.move.use(MoveId.PARTING_SHOT);
    game.doSelectPartyPokemon(1);
    await game.toEndOfTurn();

    expect(feebas).toHaveUsedMove({ move: MoveId.PARTING_SHOT, result: MoveResult.FAIL });
    expect(feebas.isOnField()).toBe(true);
    expect(enemy).toHaveStatStage(Stat.ATK, -6);
    expect(enemy).toHaveStatStage(Stat.SPATK, -6);
  });

  // TODO: This is broken
  it.todo("should lower stats without failing if unable to switch", async () => {
    await game.classicMode.startBattle([SpeciesId.FEEBAS]);

    const feebas = game.field.getPlayerPokemon();
    const karp = game.field.getEnemyPokemon();

    game.move.use(MoveId.PARTING_SHOT);
    await game.toEndOfTurn();

    // move should have suceeded despite lack of switch
    expect(feebas).toHaveUsedMove({ move: MoveId.PARTING_SHOT, result: MoveResult.SUCCESS });
    expect(feebas.isOnField()).toBe(true);
    expect(karp).toHaveStatStage(Stat.ATK, -1);
    expect(karp).toHaveStatStage(Stat.SPATK, -1);
  });
});
