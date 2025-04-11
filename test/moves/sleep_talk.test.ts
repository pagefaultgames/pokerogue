import { Stat } from "#app/enums/stat";
import { StatusEffect } from "#app/enums/status-effect";
import { MoveResult } from "#app/field/pokemon";
import { Abilities } from "#enums/abilities";
import { Moves } from "#enums/moves";
import { Species } from "#enums/species";
import GameManager from "#test/testUtils/gameManager";
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
      .moveset([Moves.SPLASH, Moves.SLEEP_TALK])
      .statusEffect(StatusEffect.SLEEP)
      .ability(Abilities.BALL_FETCH)
      .battleStyle("single")
      .disableCrits()
      .enemySpecies(Species.MAGIKARP)
      .enemyAbility(Abilities.BALL_FETCH)
      .enemyMoveset(Moves.SPLASH)
      .enemyLevel(100);
  });

  it("should fail when the user is not asleep", async () => {
    game.override.statusEffect(StatusEffect.NONE);
    await game.classicMode.startBattle([Species.FEEBAS]);

    game.move.select(Moves.SLEEP_TALK);
    await game.toNextTurn();
    expect(game.scene.getPlayerPokemon()!.getLastXMoves()[0].result).toBe(MoveResult.FAIL);
  });

  it("should fail if the user has no valid moves", async () => {
    game.override.moveset([Moves.SLEEP_TALK, Moves.DIG, Moves.METRONOME, Moves.SOLAR_BEAM]);
    await game.classicMode.startBattle([Species.FEEBAS]);

    game.move.select(Moves.SLEEP_TALK);
    await game.toNextTurn();
    expect(game.scene.getPlayerPokemon()!.getLastXMoves()[0].result).toBe(MoveResult.FAIL);
  });

  it("should call a random valid move if the user is asleep", async () => {
    game.override.moveset([Moves.SLEEP_TALK, Moves.DIG, Moves.FLY, Moves.SWORDS_DANCE]); // Dig and Fly are invalid moves, Swords Dance should always be called
    await game.classicMode.startBattle([Species.FEEBAS]);

    game.move.select(Moves.SLEEP_TALK);
    await game.toNextTurn();
    expect(game.scene.getPlayerPokemon()!.getStatStage(Stat.ATK));
  });

  it("should apply secondary effects of a move", async () => {
    game.override.moveset([Moves.SLEEP_TALK, Moves.DIG, Moves.FLY, Moves.WOOD_HAMMER]); // Dig and Fly are invalid moves, Wood Hammer should always be called
    await game.classicMode.startBattle();

    game.move.select(Moves.SLEEP_TALK);
    await game.toNextTurn();

    expect(game.scene.getPlayerPokemon()!.isFullHp()).toBeFalsy(); // Wood Hammer recoil effect should be applied
  });
});
