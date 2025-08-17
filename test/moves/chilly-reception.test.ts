import { getPokemonNameWithAffix } from "#app/messages";
import { AbilityId } from "#enums/ability-id";
import { MoveId } from "#enums/move-id";
import { MoveResult } from "#enums/move-result";
import { SpeciesId } from "#enums/species-id";
import { WeatherType } from "#enums/weather-type";
import { RandomMoveAttr } from "#moves/move";
import { GameManager } from "#test/test-utils/game-manager";
import i18next from "i18next";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

describe("Moves - Chilly Reception", () => {
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
      .moveset([MoveId.CHILLY_RECEPTION, MoveId.SNOWSCAPE, MoveId.SPLASH, MoveId.METRONOME])
      .enemyMoveset(MoveId.SPLASH)
      .enemyAbility(AbilityId.BALL_FETCH)
      .ability(AbilityId.BALL_FETCH);
  });

  it("should display message before use, switch the user out and change the weather to snow", async () => {
    await game.classicMode.startBattle([SpeciesId.SLOWKING, SpeciesId.MEOWTH]);

    const [slowking, meowth] = game.scene.getPlayerParty();

    game.move.select(MoveId.CHILLY_RECEPTION);
    game.doSelectPartyPokemon(1);
    await game.toEndOfTurn();

    expect(game.scene.arena.weather?.weatherType).toBe(WeatherType.SNOW);
    expect(game.field.getPlayerPokemon()).toBe(meowth);
    expect(slowking.isOnField()).toBe(false);
    expect(game.phaseInterceptor.log).toContain("SwitchSummonPhase");
    expect(game.textInterceptor.logs).toContain(
      i18next.t("moveTriggers:chillyReception", { pokemonName: getPokemonNameWithAffix(slowking) }),
    );
  });

  it("should still change weather if user can't switch out", async () => {
    await game.classicMode.startBattle([SpeciesId.SLOWKING]);

    game.move.select(MoveId.CHILLY_RECEPTION);
    await game.toEndOfTurn();

    expect(game.scene.arena.weather?.weatherType).toBe(WeatherType.SNOW);
    expect(game.phaseInterceptor.log).not.toContain("SwitchSummonPhase");
    expect(game.field.getPlayerPokemon().getLastXMoves()[0].result).toBe(MoveResult.SUCCESS);
  });

  it("should still switch out even if weather cannot be changed", async () => {
    await game.classicMode.startBattle([SpeciesId.SLOWKING, SpeciesId.MEOWTH]);

    expect(game.scene.arena.weather?.weatherType).not.toBe(WeatherType.SNOW);

    const [slowking, meowth] = game.scene.getPlayerParty();

    game.move.select(MoveId.SNOWSCAPE);
    await game.toNextTurn();

    expect(game.scene.arena.weather?.weatherType).toBe(WeatherType.SNOW);

    game.move.select(MoveId.CHILLY_RECEPTION);
    game.doSelectPartyPokemon(1);
    // TODO: Uncomment lines once wimp out PR fixes force switches to not reset summon data immediately
    //  await game.phaseInterceptor.to("SwitchSummonPhase", false);
    //  expect(slowking.getLastXMoves()[0].result).toBe(MoveResult.SUCCESS);

    await game.toEndOfTurn();

    expect(game.scene.arena.weather?.weatherType).toBe(WeatherType.SNOW);
    expect(game.phaseInterceptor.log).toContain("SwitchSummonPhase");
    expect(game.field.getPlayerPokemon()).toBe(meowth);
    expect(slowking.isOnField()).toBe(false);
  });

  // Source: https://replay.pokemonshowdown.com/gen9ou-2367532550
  it("should fail (while still displaying message) if neither weather change nor switch out succeeds", async () => {
    await game.classicMode.startBattle([SpeciesId.SLOWKING]);

    expect(game.scene.arena.weather?.weatherType).not.toBe(WeatherType.SNOW);

    const slowking = game.field.getPlayerPokemon();

    game.move.select(MoveId.SNOWSCAPE);
    await game.toNextTurn();

    expect(game.scene.arena.weather?.weatherType).toBe(WeatherType.SNOW);

    game.move.select(MoveId.CHILLY_RECEPTION);
    game.doSelectPartyPokemon(1);
    await game.toEndOfTurn();

    expect(game.scene.arena.weather?.weatherType).toBe(WeatherType.SNOW);
    expect(game.phaseInterceptor.log).not.toContain("SwitchSummonPhase");
    expect(game.field.getPlayerPokemon()).toBe(slowking);
    expect(slowking.getLastXMoves()[0].result).toBe(MoveResult.FAIL);
    expect(game.textInterceptor.logs).toContain(
      i18next.t("moveTriggers:chillyReception", { pokemonName: getPokemonNameWithAffix(slowking) }),
    );
  });

  it("should succeed without message if called indirectly", async () => {
    vi.spyOn(RandomMoveAttr.prototype, "getMoveOverride").mockReturnValue(MoveId.CHILLY_RECEPTION);
    await game.classicMode.startBattle([SpeciesId.SLOWKING, SpeciesId.MEOWTH]);

    const [slowking, meowth] = game.scene.getPlayerParty();

    game.move.select(MoveId.METRONOME);
    game.doSelectPartyPokemon(1);
    await game.toEndOfTurn();

    expect(game.scene.arena.weather?.weatherType).toBe(WeatherType.SNOW);
    expect(game.field.getPlayerPokemon()).toBe(meowth);
    expect(slowking.isOnField()).toBe(false);
    expect(game.phaseInterceptor.log).toContain("SwitchSummonPhase");
    expect(game.textInterceptor.logs).not.toContain(
      i18next.t("moveTriggers:chillyReception", { pokemonName: getPokemonNameWithAffix(slowking) }),
    );
  });

  // Bugcheck test for enemy AI bug
  it("check case - enemy not selecting chilly reception doesn't change weather", async () => {
    game.override.enemyMoveset([MoveId.CHILLY_RECEPTION, MoveId.TACKLE]);
    await game.classicMode.startBattle([SpeciesId.SLOWKING, SpeciesId.MEOWTH]);

    game.move.select(MoveId.SPLASH);
    await game.move.selectEnemyMove(MoveId.TACKLE);
    await game.toEndOfTurn();

    expect(game.scene.arena.weather?.weatherType).toBeUndefined();
  });
});
