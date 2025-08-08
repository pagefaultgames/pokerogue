import { AbilityId } from "#enums/ability-id";
import { BattlerIndex } from "#enums/battler-index";
import { BattlerTagType } from "#enums/battler-tag-type";
import { MoveId } from "#enums/move-id";
import { MoveResult } from "#enums/move-result";
import { SpeciesId } from "#enums/species-id";
import { GameManager } from "#test/test-utils/game-manager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";

describe("Moves - Encore", () => {
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
      .moveset([MoveId.SPLASH, MoveId.ENCORE])
      .ability(AbilityId.BALL_FETCH)
      .battleStyle("single")
      .criticalHits(false)
      .enemySpecies(SpeciesId.MAGIKARP)
      .enemyAbility(AbilityId.BALL_FETCH)
      .enemyMoveset([MoveId.SPLASH, MoveId.TACKLE])
      .startingLevel(100)
      .enemyLevel(100);
  });

  it("should prevent the target from using any move except the last used move", async () => {
    await game.classicMode.startBattle([SpeciesId.SNORLAX]);

    const enemyPokemon = game.field.getEnemyPokemon();

    game.move.select(MoveId.ENCORE);
    await game.move.selectEnemyMove(MoveId.SPLASH);

    await game.toNextTurn();
    expect(enemyPokemon.getTag(BattlerTagType.ENCORE)).toBeDefined();

    game.move.select(MoveId.SPLASH);
    // The enemy AI would normally be inclined to use Tackle, but should be
    // forced into using Splash.
    await game.phaseInterceptor.to("BerryPhase", false);

    expect(enemyPokemon.getLastXMoves().every(turnMove => turnMove.move === MoveId.SPLASH)).toBeTruthy();
  });

  describe("should fail against the following moves:", () => {
    it.each([
      { moveId: MoveId.TRANSFORM, name: "Transform", delay: false },
      { moveId: MoveId.MIMIC, name: "Mimic", delay: true },
      { moveId: MoveId.SKETCH, name: "Sketch", delay: true },
      { moveId: MoveId.ENCORE, name: "Encore", delay: false },
      { moveId: MoveId.STRUGGLE, name: "Struggle", delay: false },
    ])("$name", async ({ moveId, delay }) => {
      game.override.enemyMoveset(moveId);

      await game.classicMode.startBattle([SpeciesId.SNORLAX]);

      const playerPokemon = game.field.getPlayerPokemon();
      const enemyPokemon = game.field.getEnemyPokemon();

      if (delay) {
        game.move.select(MoveId.SPLASH);
        await game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.ENEMY]);
        await game.toNextTurn();
      }

      game.move.select(MoveId.ENCORE);

      const turnOrder = delay ? [BattlerIndex.PLAYER, BattlerIndex.ENEMY] : [BattlerIndex.ENEMY, BattlerIndex.PLAYER];
      await game.setTurnOrder(turnOrder);

      await game.phaseInterceptor.to("BerryPhase", false);
      expect(playerPokemon.getLastXMoves(1)[0].result).toBe(MoveResult.FAIL);
      expect(enemyPokemon.getTag(BattlerTagType.ENCORE)).toBeUndefined();
    });
  });

  it("Pokemon under both Encore and Torment should alternate between Struggle and restricted move", async () => {
    const turnOrder = [BattlerIndex.ENEMY, BattlerIndex.PLAYER];
    game.override.moveset([MoveId.ENCORE, MoveId.TORMENT, MoveId.SPLASH]);
    await game.classicMode.startBattle([SpeciesId.FEEBAS]);

    const enemyPokemon = game.field.getEnemyPokemon();
    game.move.select(MoveId.ENCORE);
    await game.setTurnOrder(turnOrder);
    await game.phaseInterceptor.to("BerryPhase");
    expect(enemyPokemon.getTag(BattlerTagType.ENCORE)).toBeDefined();

    await game.toNextTurn();
    game.move.select(MoveId.TORMENT);
    await game.setTurnOrder(turnOrder);
    await game.phaseInterceptor.to("BerryPhase");
    expect(enemyPokemon.getTag(BattlerTagType.TORMENT)).toBeDefined();

    await game.toNextTurn();
    game.move.select(MoveId.SPLASH);
    await game.setTurnOrder(turnOrder);
    await game.phaseInterceptor.to("BerryPhase");
    const lastMove = enemyPokemon.getLastXMoves()[0];
    expect(lastMove?.move).toBe(MoveId.STRUGGLE);
  });
});
