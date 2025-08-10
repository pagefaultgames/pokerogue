import { AbilityId } from "#enums/ability-id";
import { BattlerIndex } from "#enums/battler-index";
import { MoveId } from "#enums/move-id";
import { MoveResult } from "#enums/move-result";
import { SpeciesId } from "#enums/species-id";
import { GameManager } from "#test/test-utils/game-manager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";

describe("Moves - Upper Hand", () => {
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
      .moveset(MoveId.UPPER_HAND)
      .ability(AbilityId.BALL_FETCH)
      .battleStyle("single")
      .criticalHits(false)
      .enemySpecies(SpeciesId.MAGIKARP)
      .enemyAbility(AbilityId.BALL_FETCH)
      .enemyMoveset(MoveId.QUICK_ATTACK)
      .startingLevel(100)
      .enemyLevel(100);
  });

  it("should flinch the opponent before they use a priority attack", async () => {
    await game.classicMode.startBattle([SpeciesId.FEEBAS]);

    const feebas = game.field.getPlayerPokemon();
    const magikarp = game.field.getEnemyPokemon();

    game.move.select(MoveId.UPPER_HAND);
    await game.phaseInterceptor.to("BerryPhase");

    expect(feebas.getLastXMoves()[0].result).toBe(MoveResult.SUCCESS);
    expect(magikarp.isFullHp()).toBeFalsy();
    expect(feebas.isFullHp()).toBeTruthy();
  });

  it.each([
    { descriptor: "non-priority attack", move: MoveId.TACKLE },
    { descriptor: "status move", move: MoveId.BABY_DOLL_EYES },
  ])("should fail when the opponent selects a $descriptor", async ({ move }) => {
    game.override.enemyMoveset(move);

    await game.classicMode.startBattle([SpeciesId.FEEBAS]);

    const feebas = game.field.getPlayerPokemon();

    game.move.select(MoveId.UPPER_HAND);
    await game.phaseInterceptor.to("BerryPhase");

    expect(feebas.getLastXMoves()[0].result).toBe(MoveResult.FAIL);
  });

  it("should flinch the opponent before they use an attack boosted by Gale Wings", async () => {
    game.override.enemyAbility(AbilityId.GALE_WINGS).enemyMoveset(MoveId.GUST);

    await game.classicMode.startBattle([SpeciesId.FEEBAS]);

    const feebas = game.field.getPlayerPokemon();
    const magikarp = game.field.getEnemyPokemon();

    game.move.select(MoveId.UPPER_HAND);
    await game.phaseInterceptor.to("BerryPhase");

    expect(feebas.getLastXMoves()[0].result).toBe(MoveResult.SUCCESS);
    expect(magikarp.isFullHp()).toBeFalsy();
    expect(feebas.isFullHp()).toBeTruthy();
  });

  it("should fail if the target has already moved", async () => {
    game.override.enemyMoveset(MoveId.FAKE_OUT).enemyAbility(AbilityId.SHEER_FORCE);

    await game.classicMode.startBattle([SpeciesId.FEEBAS]);

    const feebas = game.field.getPlayerPokemon();

    game.move.select(MoveId.UPPER_HAND);

    await game.setTurnOrder([BattlerIndex.ENEMY, BattlerIndex.PLAYER]);
    await game.phaseInterceptor.to("BerryPhase");

    expect(feebas.getLastXMoves()[0].result).toBe(MoveResult.FAIL);
    expect(feebas.isFullHp()).toBeFalsy();
  });
});
