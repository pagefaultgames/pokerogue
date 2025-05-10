import { BattlerIndex } from "#app/battle";
import { Stat } from "#app/enums/stat";
import { MoveResult } from "#app/field/pokemon";
import { CommandPhase } from "#app/phases/command-phase";
import { Abilities } from "#enums/abilities";
import { Moves } from "#enums/moves";
import { Species } from "#enums/species";
import GameManager from "#test/testUtils/gameManager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";

describe("Moves - Assist", () => {
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
    // Manual moveset overrides are required for the player pokemon in these tests
    // because the normal moveset override doesn't allow for accurate testing of moveset changes
    game.override
      .ability(Abilities.BALL_FETCH)
      .battleStyle("double")
      .disableCrits()
      .enemySpecies(Species.MAGIKARP)
      .enemyLevel(100)
      .enemyAbility(Abilities.BALL_FETCH)
      .enemyMoveset(Moves.SPLASH);
  });

  it("should only use an ally's moves", async () => {
    game.override.enemyMoveset(Moves.SWORDS_DANCE);
    await game.classicMode.startBattle([Species.FEEBAS, Species.SHUCKLE]);

    const [feebas, shuckle] = game.scene.getPlayerField();
    // These are all moves Assist cannot call; Sketch will be used to test that it can call other moves properly
    game.move.changeMoveset(feebas, [Moves.ASSIST, Moves.SKETCH, Moves.PROTECT, Moves.DRAGON_TAIL]);
    game.move.changeMoveset(shuckle, [Moves.ASSIST, Moves.SKETCH, Moves.PROTECT, Moves.DRAGON_TAIL]);

    game.move.select(Moves.ASSIST, 0);
    game.move.select(Moves.SKETCH, 1);
    await game.setTurnOrder([BattlerIndex.ENEMY, BattlerIndex.ENEMY_2, BattlerIndex.PLAYER_2, BattlerIndex.PLAYER]);
    // Player_2 uses Sketch, copies Swords Dance, Player_1 uses Assist, uses Player_2's Sketched Swords Dance
    await game.toNextTurn();

    expect(game.scene.getPlayerPokemon()!.getStatStage(Stat.ATK)).toBe(2); // Stat raised from Assist -> Swords Dance
  });

  it("should fail if there are no allies", async () => {
    await game.classicMode.startBattle([Species.FEEBAS]);

    const feebas = game.scene.getPlayerPokemon()!;
    game.move.changeMoveset(feebas, [Moves.ASSIST, Moves.SKETCH, Moves.PROTECT, Moves.DRAGON_TAIL]);

    game.move.select(Moves.ASSIST, 0);
    await game.toNextTurn();
    expect(game.scene.getPlayerPokemon()!.getLastXMoves()[0].result).toBe(MoveResult.FAIL);
  });

  it("should fail if ally has no usable moves and user has usable moves", async () => {
    game.override.enemyMoveset(Moves.SWORDS_DANCE);
    await game.classicMode.startBattle([Species.FEEBAS, Species.SHUCKLE]);

    const [feebas, shuckle] = game.scene.getPlayerField();
    game.move.changeMoveset(feebas, [Moves.ASSIST, Moves.SKETCH, Moves.PROTECT, Moves.DRAGON_TAIL]);
    game.move.changeMoveset(shuckle, [Moves.ASSIST, Moves.SKETCH, Moves.PROTECT, Moves.DRAGON_TAIL]);

    game.move.select(Moves.SKETCH, 0);
    game.move.select(Moves.PROTECT, 1);
    await game.setTurnOrder([BattlerIndex.ENEMY, BattlerIndex.ENEMY_2, BattlerIndex.PLAYER, BattlerIndex.PLAYER_2]);
    // Player uses Sketch to copy Swords Dance, Player_2 stalls a turn. Player will attempt Assist and should have no usable moves
    await game.toNextTurn();
    game.move.select(Moves.ASSIST, 0);
    await game.phaseInterceptor.to(CommandPhase);
    game.move.select(Moves.PROTECT, 1);
    await game.toNextTurn();

    expect(game.scene.getPlayerPokemon()!.getLastXMoves()[0].result).toBe(MoveResult.FAIL);
  });

  it("should apply secondary effects of a move", async () => {
    game.override.moveset([Moves.ASSIST, Moves.WOOD_HAMMER, Moves.WOOD_HAMMER, Moves.WOOD_HAMMER]);
    await game.classicMode.startBattle([Species.FEEBAS, Species.SHUCKLE]);

    const [feebas, shuckle] = game.scene.getPlayerField();
    game.move.changeMoveset(feebas, [Moves.ASSIST, Moves.SKETCH, Moves.PROTECT, Moves.DRAGON_TAIL]);
    game.move.changeMoveset(shuckle, [Moves.ASSIST, Moves.SKETCH, Moves.PROTECT, Moves.DRAGON_TAIL]);

    game.move.select(Moves.ASSIST, 0);
    await game.phaseInterceptor.to(CommandPhase);
    game.move.select(Moves.ASSIST, 1);
    await game.toNextTurn();

    expect(game.scene.getPlayerPokemon()!.isFullHp()).toBeFalsy(); // should receive recoil damage from Wood Hammer
  });
});
