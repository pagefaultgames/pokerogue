import { AbilityId } from "#enums/ability-id";
import { BattlerIndex } from "#enums/battler-index";
import { BattlerTagType } from "#enums/battler-tag-type";
import { MoveId } from "#enums/move-id";
import { SpeciesId } from "#enums/species-id";
import { WeatherType } from "#enums/weather-type";
import { GameManager } from "#test/test-utils/game-manager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";

describe("Moves - Grudge", () => {
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
      .ability(AbilityId.BALL_FETCH)
      .battleStyle("single")
      .criticalHits(false)
      .enemySpecies(SpeciesId.RATTATA)
      .startingLevel(100)
      .enemyAbility(AbilityId.NO_GUARD);
  });

  it("should reduce the PP of an attack that faints the user to 0", async () => {
    await game.classicMode.startBattle([SpeciesId.FEEBAS]);

    const feebas = game.field.getPlayerPokemon();
    const ratatta = game.field.getEnemyPokemon();

    game.move.use(MoveId.GUILLOTINE);
    await game.move.forceEnemyMove(MoveId.GRUDGE);
    await game.setTurnOrder([BattlerIndex.ENEMY, BattlerIndex.PLAYER]);
    await game.phaseInterceptor.to("FaintPhase");

    // Ratatta should have fainted and consumed all of Guillotine's PP
    expect(ratatta).toHaveFainted();
    expect(feebas).toHaveUsedPP(MoveId.GUILLOTINE, "all");
  });

  it("should remain in effect until the user's next move", async () => {
    await game.classicMode.startBattle([SpeciesId.FEEBAS]);

    const feebas = game.field.getPlayerPokemon();
    const ratatta = game.field.getEnemyPokemon();

    game.move.use(MoveId.SPLASH);
    await game.move.forceEnemyMove(MoveId.GRUDGE);
    await game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.ENEMY]);
    await game.toNextTurn();

    expect(ratatta).toHaveBattlerTag(BattlerTagType.GRUDGE);

    game.move.use(MoveId.GUILLOTINE);
    await game.move.forceEnemyMove(MoveId.SPLASH);
    await game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.ENEMY]);
    await game.toEndOfTurn();

    expect(ratatta).toHaveFainted();
    expect(feebas).toHaveUsedPP(MoveId.GUILLOTINE, "all");
  });

  it("should not reduce PP if the user dies to weather/indirect damage", async () => {
    // Opponent will be reduced to 1 HP by False Swipe, then faint to Sandstorm
    game.override.weather(WeatherType.SANDSTORM);
    await game.classicMode.startBattle([SpeciesId.FEEBAS]);

    const feebas = game.field.getPlayerPokemon();
    const ratatta = game.field.getEnemyPokemon();

    game.move.use(MoveId.FALSE_SWIPE);
    await game.move.forceEnemyMove(MoveId.GRUDGE);
    await game.setTurnOrder([BattlerIndex.ENEMY, BattlerIndex.PLAYER]);
    await game.toEndOfTurn();

    expect(ratatta).toHaveFainted();
    expect(feebas).toHaveUsedPP(MoveId.FALSE_SWIPE, 1);
  });
});
