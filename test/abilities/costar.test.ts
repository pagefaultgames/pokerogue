import { AbilityId } from "#enums/ability-id";
import { MoveId } from "#enums/move-id";
import { SpeciesId } from "#enums/species-id";
import { Stat } from "#enums/stat";
import { MessagePhase } from "#phases/message-phase";
import { GameManager } from "#test/test-utils/game-manager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, test } from "vitest";

describe("Abilities - COSTAR", () => {
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
      .battleStyle("double")
      .ability(AbilityId.COSTAR)
      .moveset([MoveId.SPLASH, MoveId.NASTY_PLOT])
      .enemyMoveset(MoveId.SPLASH);
  });

  test("ability copies positive stat stages", async () => {
    game.override.enemyAbility(AbilityId.BALL_FETCH);

    await game.classicMode.startBattle([SpeciesId.MAGIKARP, SpeciesId.MAGIKARP, SpeciesId.FLAMIGO]);

    let [leftPokemon, rightPokemon] = game.scene.getPlayerField();

    game.move.select(MoveId.NASTY_PLOT);
    game.move.select(MoveId.SPLASH, 1);
    await game.toNextTurn();

    expect(leftPokemon.getStatStage(Stat.SPATK)).toBe(2);
    expect(rightPokemon.getStatStage(Stat.SPATK)).toBe(0);

    game.move.select(MoveId.SPLASH);
    game.doSwitchPokemon(2);
    await game.phaseInterceptor.to(MessagePhase);

    [leftPokemon, rightPokemon] = game.scene.getPlayerField();
    expect(leftPokemon.getStatStage(Stat.SPATK)).toBe(2);
    expect(rightPokemon.getStatStage(Stat.SPATK)).toBe(2);
  });

  test("ability copies negative stat stages", async () => {
    game.override.enemyAbility(AbilityId.INTIMIDATE);

    await game.classicMode.startBattle([SpeciesId.MAGIKARP, SpeciesId.MAGIKARP, SpeciesId.FLAMIGO]);

    let [leftPokemon, rightPokemon] = game.scene.getPlayerField();

    expect(leftPokemon.getStatStage(Stat.ATK)).toBe(-2);
    expect(leftPokemon.getStatStage(Stat.ATK)).toBe(-2);

    game.move.select(MoveId.SPLASH);
    game.doSwitchPokemon(2);
    await game.phaseInterceptor.to(MessagePhase);

    [leftPokemon, rightPokemon] = game.scene.getPlayerField();
    expect(leftPokemon.getStatStage(Stat.ATK)).toBe(-2);
    expect(rightPokemon.getStatStage(Stat.ATK)).toBe(-2);
  });
});
