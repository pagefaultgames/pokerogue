import { TrappedTag } from "#data/battler-tags";
import { AbilityId } from "#enums/ability-id";
import { MoveId } from "#enums/move-id";
import { SpeciesId } from "#enums/species-id";
import { Stat } from "#enums/stat";
import { GameManager } from "#test/test-utils/game-manager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";

describe("Moves - Octolock", () => {
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
      .enemySpecies(SpeciesId.MAGIKARP)
      .enemyMoveset(MoveId.SPLASH)
      .enemyAbility(AbilityId.BALL_FETCH)
      .startingLevel(2000)
      .moveset([MoveId.OCTOLOCK, MoveId.SPLASH, MoveId.TRICK_OR_TREAT])
      .ability(AbilityId.BALL_FETCH);
  });

  it("lowers DEF and SPDEF stat stages of the target Pokemon by 1 each turn", async () => {
    await game.classicMode.startBattle([SpeciesId.GRAPPLOCT]);

    const enemyPokemon = game.field.getEnemyPokemon();

    // use Octolock and advance to init phase of next turn to check for stat changes
    game.move.select(MoveId.OCTOLOCK);
    await game.toNextTurn();

    expect(enemyPokemon.getStatStage(Stat.DEF)).toBe(-1);
    expect(enemyPokemon.getStatStage(Stat.SPDEF)).toBe(-1);

    // take a second turn to make sure stat changes occur again
    game.move.select(MoveId.SPLASH);
    await game.toNextTurn();

    expect(enemyPokemon.getStatStage(Stat.DEF)).toBe(-2);
    expect(enemyPokemon.getStatStage(Stat.SPDEF)).toBe(-2);
  });

  it("if target pokemon has BIG_PECKS, should only lower SPDEF stat stage by 1", async () => {
    game.override.enemyAbility(AbilityId.BIG_PECKS);
    await game.classicMode.startBattle([SpeciesId.GRAPPLOCT]);

    const enemyPokemon = game.field.getEnemyPokemon();

    // use Octolock and advance to init phase of next turn to check for stat changes
    game.move.select(MoveId.OCTOLOCK);
    await game.toNextTurn();

    expect(enemyPokemon.getStatStage(Stat.DEF)).toBe(0);
    expect(enemyPokemon.getStatStage(Stat.SPDEF)).toBe(-1);
  });

  it("if target pokemon has WHITE_SMOKE, should not reduce any stat stages", async () => {
    game.override.enemyAbility(AbilityId.WHITE_SMOKE);
    await game.classicMode.startBattle([SpeciesId.GRAPPLOCT]);

    const enemyPokemon = game.field.getEnemyPokemon();

    // use Octolock and advance to init phase of next turn to check for stat changes
    game.move.select(MoveId.OCTOLOCK);
    await game.toNextTurn();

    expect(enemyPokemon.getStatStage(Stat.DEF)).toBe(0);
    expect(enemyPokemon.getStatStage(Stat.SPDEF)).toBe(0);
  });

  it("if target pokemon has CLEAR_BODY, should not reduce any stat stages", async () => {
    game.override.enemyAbility(AbilityId.CLEAR_BODY);
    await game.classicMode.startBattle([SpeciesId.GRAPPLOCT]);

    const enemyPokemon = game.field.getEnemyPokemon();

    // use Octolock and advance to init phase of next turn to check for stat changes
    game.move.select(MoveId.OCTOLOCK);
    await game.toNextTurn();

    expect(enemyPokemon.getStatStage(Stat.DEF)).toBe(0);
    expect(enemyPokemon.getStatStage(Stat.SPDEF)).toBe(0);
  });

  it("traps the target pokemon", async () => {
    await game.classicMode.startBattle([SpeciesId.GRAPPLOCT]);

    const enemyPokemon = game.field.getEnemyPokemon();

    // before Octolock - enemy should not be trapped
    expect(enemyPokemon.findTag(t => t instanceof TrappedTag)).toBeUndefined();

    game.move.select(MoveId.OCTOLOCK);

    // after Octolock - enemy should be trapped
    await game.phaseInterceptor.to("MoveEndPhase");
    expect(enemyPokemon.findTag(t => t instanceof TrappedTag)).toBeDefined();
  });

  it("does not work on ghost type pokemon", async () => {
    game.override.enemyMoveset(MoveId.OCTOLOCK);
    await game.classicMode.startBattle([SpeciesId.GASTLY]);

    const playerPokemon = game.field.getPlayerPokemon();

    // before Octolock - player should not be trapped
    expect(playerPokemon.findTag(t => t instanceof TrappedTag)).toBeUndefined();

    game.move.select(MoveId.SPLASH);
    await game.toNextTurn();

    // after Octolock - player should still not be trapped, and no stat loss
    expect(playerPokemon.findTag(t => t instanceof TrappedTag)).toBeUndefined();
    expect(playerPokemon.getStatStage(Stat.DEF)).toBe(0);
    expect(playerPokemon.getStatStage(Stat.SPDEF)).toBe(0);
  });

  it("does not work on pokemon with added ghost type via Trick-or-Treat", async () => {
    await game.classicMode.startBattle([SpeciesId.FEEBAS]);

    const enemy = game.field.getEnemyPokemon();

    // before Octolock - pokemon should not be trapped
    expect(enemy.findTag(t => t instanceof TrappedTag)).toBeUndefined();

    game.move.select(MoveId.TRICK_OR_TREAT);
    await game.toNextTurn();
    game.move.select(MoveId.OCTOLOCK);
    await game.toNextTurn();

    // after Octolock - pokemon should still not be trapped, and no stat loss
    expect(enemy.findTag(t => t instanceof TrappedTag)).toBeUndefined();
    expect(enemy.getStatStage(Stat.DEF)).toBe(0);
    expect(enemy.getStatStage(Stat.SPDEF)).toBe(0);
  });
});
