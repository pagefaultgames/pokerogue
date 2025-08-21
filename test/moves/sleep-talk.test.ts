import { AbilityId } from "#enums/ability-id";
import { MoveId } from "#enums/move-id";
import { MoveResult } from "#enums/move-result";
import { MoveUseMode } from "#enums/move-use-mode";
import { SpeciesId } from "#enums/species-id";
import { Stat } from "#enums/stat";
import { StatusEffect } from "#enums/status-effect";
import { GameManager } from "#test/test-utils/game-manager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";

describe("Moves - Sleep Talk", () => {
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
      .moveset([MoveId.SPLASH, MoveId.SLEEP_TALK])
      .statusEffect(StatusEffect.SLEEP)
      .ability(AbilityId.BALL_FETCH)
      .battleStyle("single")
      .criticalHits(false)
      .enemySpecies(SpeciesId.MAGIKARP)
      .enemyAbility(AbilityId.NO_GUARD)
      .enemyMoveset(MoveId.SPLASH)
      .enemyLevel(100);
  });

  it("should call a random valid move if the user is asleep", async () => {
    game.override.moveset([MoveId.SLEEP_TALK, MoveId.DIG, MoveId.FLY, MoveId.SWORDS_DANCE]); // Dig and Fly are invalid moves, Swords Dance should always be called
    await game.classicMode.startBattle([SpeciesId.FEEBAS]);

    game.move.select(MoveId.SLEEP_TALK);
    await game.toNextTurn();

    const feebas = game.field.getPlayerPokemon();
    expect(feebas.getStatStage(Stat.ATK)).toBe(2);
    expect(feebas.getLastXMoves(2)).toEqual([
      expect.objectContaining({
        move: MoveId.SWORDS_DANCE,
        result: MoveResult.SUCCESS,
        useMode: MoveUseMode.FOLLOW_UP,
      }),
      expect.objectContaining({
        move: MoveId.SLEEP_TALK,
        result: MoveResult.SUCCESS,
        useMode: MoveUseMode.NORMAL,
      }),
    ]);
  });

  it("should fail if the user is not asleep", async () => {
    game.override.statusEffect(StatusEffect.POISON);
    await game.classicMode.startBattle([SpeciesId.FEEBAS]);

    game.move.select(MoveId.SLEEP_TALK);
    await game.toNextTurn();
    expect(game.field.getPlayerPokemon().getLastXMoves()[0].result).toBe(MoveResult.FAIL);
  });

  it("should fail the turn the user wakes up from Sleep", async () => {
    await game.classicMode.startBattle([SpeciesId.FEEBAS]);

    const feebas = game.field.getPlayerPokemon();
    expect(feebas.status?.effect).toBe(StatusEffect.SLEEP);
    feebas.status!.sleepTurnsRemaining = 1;

    game.move.select(MoveId.SLEEP_TALK);
    await game.toNextTurn();

    expect(feebas).toHaveUsedMove({ result: MoveResult.FAIL });
  });

  it("should fail if the user has no valid moves", async () => {
    game.override.moveset([MoveId.SLEEP_TALK, MoveId.DIG, MoveId.METRONOME, MoveId.SOLAR_BEAM]);
    await game.classicMode.startBattle([SpeciesId.FEEBAS]);

    game.move.select(MoveId.SLEEP_TALK);
    await game.toNextTurn();
    expect(game.field.getPlayerPokemon().getLastXMoves()[0].result).toBe(MoveResult.FAIL);
  });

  it("should apply secondary effects of the called move", async () => {
    game.override.moveset([MoveId.SLEEP_TALK, MoveId.SCALE_SHOT]);
    await game.classicMode.startBattle([SpeciesId.FEEBAS]);

    game.move.select(MoveId.SLEEP_TALK);
    await game.toNextTurn();

    const feebas = game.field.getPlayerPokemon();
    expect(feebas.getStatStage(Stat.SPD)).toBe(1);
    expect(feebas.getStatStage(Stat.DEF)).toBe(-1);
  });
});
