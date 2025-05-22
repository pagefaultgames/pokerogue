import { RandomMoveAttr } from "#app/data/moves/move";
import { Abilities } from "#app/enums/abilities";
import { MoveResult } from "#app/field/pokemon";
import { getPokemonNameWithAffix } from "#app/messages";
import { Moves } from "#enums/moves";
import { Species } from "#enums/species";
import { WeatherType } from "#enums/weather-type";
import GameManager from "#test/testUtils/gameManager";
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
      .moveset([Moves.CHILLY_RECEPTION, Moves.SNOWSCAPE, Moves.SPLASH, Moves.METRONOME])
      .enemyMoveset(Moves.SPLASH)
      .enemyAbility(Abilities.BALL_FETCH)
      .ability(Abilities.BALL_FETCH);
  });

  it("should display message before use, switch the user out and change the weather to snow", async () => {
    await game.classicMode.startBattle([Species.SLOWKING, Species.MEOWTH]);

    const [slowking, meowth] = game.scene.getPlayerParty();

    game.move.select(Moves.CHILLY_RECEPTION);
    game.doSelectPartyPokemon(1);
    await game.phaseInterceptor.to("BerryPhase", false);

    expect(game.scene.arena.weather?.weatherType).toBe(WeatherType.SNOW);
    expect(game.scene.getPlayerPokemon()).toBe(meowth);
    expect(slowking.isOnField()).toBe(false);
    expect(game.phaseInterceptor.log).toContain("SwitchSummonPhase");
    expect(game.textInterceptor.logs).toContain(
      i18next.t("moveTriggers:chillyReception", { pokemonName: getPokemonNameWithAffix(slowking) }),
    );
  });

  it("should still change weather if user can't switch out", async () => {
    await game.classicMode.startBattle([Species.SLOWKING]);

    game.move.select(Moves.CHILLY_RECEPTION);

    await game.phaseInterceptor.to("BerryPhase", false);
    expect(game.scene.arena.weather?.weatherType).toBe(WeatherType.SNOW);
    expect(game.phaseInterceptor.log).not.toContain("SwitchSummonPhase");
    expect(game.scene.getPlayerPokemon()?.getLastXMoves()[0].result).toBe(MoveResult.SUCCESS);
  });

  it("should still switch out even if weather cannot be changed", async () => {
    await game.classicMode.startBattle([Species.SLOWKING, Species.MEOWTH]);

    expect(game.scene.arena.weather?.weatherType).not.toBe(WeatherType.SNOW);

    const [slowking, meowth] = game.scene.getPlayerParty();

    game.move.select(Moves.SNOWSCAPE);
    await game.toNextTurn();

    expect(game.scene.arena.weather?.weatherType).toBe(WeatherType.SNOW);

    game.move.select(Moves.CHILLY_RECEPTION);
    game.doSelectPartyPokemon(1);
    // TODO: Uncomment lines once wimp out PR fixes force switches to not reset summon data immediately
    //  await game.phaseInterceptor.to("SwitchSummonPhase", false);
    //  expect(slowking.getLastXMoves()[0].result).toBe(MoveResult.SUCCESS);

    await game.phaseInterceptor.to("BerryPhase", false);

    expect(game.scene.arena.weather?.weatherType).toBe(WeatherType.SNOW);
    expect(game.phaseInterceptor.log).toContain("SwitchSummonPhase");
    expect(game.scene.getPlayerPokemon()).toBe(meowth);
    expect(slowking.isOnField()).toBe(false);
  });

  // Source: https://replay.pokemonshowdown.com/gen9ou-2367532550
  it("should fail (while still displaying message) if neither weather change nor switch out succeeds", async () => {
    await game.classicMode.startBattle([Species.SLOWKING]);

    expect(game.scene.arena.weather?.weatherType).not.toBe(WeatherType.SNOW);

    const slowking = game.scene.getPlayerPokemon()!;

    game.move.select(Moves.SNOWSCAPE);
    await game.toNextTurn();

    expect(game.scene.arena.weather?.weatherType).toBe(WeatherType.SNOW);

    game.move.select(Moves.CHILLY_RECEPTION);
    game.doSelectPartyPokemon(1);
    await game.phaseInterceptor.to("BerryPhase", false);

    expect(game.scene.arena.weather?.weatherType).toBe(WeatherType.SNOW);
    expect(game.phaseInterceptor.log).not.toContain("SwitchSummonPhase");
    expect(game.scene.getPlayerPokemon()).toBe(slowking);
    expect(slowking.getLastXMoves()[0].result).toBe(MoveResult.FAIL);
    expect(game.textInterceptor.logs).toContain(
      i18next.t("moveTriggers:chillyReception", { pokemonName: getPokemonNameWithAffix(slowking) }),
    );
  });

  it("should succeed without message if called indirectly", async () => {
    vi.spyOn(RandomMoveAttr.prototype, "getMoveOverride").mockReturnValue(Moves.CHILLY_RECEPTION);
    await game.classicMode.startBattle([Species.SLOWKING, Species.MEOWTH]);

    const [slowking, meowth] = game.scene.getPlayerParty();

    game.move.select(Moves.METRONOME);
    game.doSelectPartyPokemon(1);
    await game.phaseInterceptor.to("BerryPhase", false);

    expect(game.scene.arena.weather?.weatherType).toBe(WeatherType.SNOW);
    expect(game.scene.getPlayerPokemon()).toBe(meowth);
    expect(slowking.isOnField()).toBe(false);
    expect(game.phaseInterceptor.log).toContain("SwitchSummonPhase");
    expect(game.textInterceptor.logs).not.toContain(
      i18next.t("moveTriggers:chillyReception", { pokemonName: getPokemonNameWithAffix(slowking) }),
    );
  });

  // Bugcheck test for enemy AI bug
  it("check case - enemy not selecting chilly reception doesn't change weather", async () => {
    game.override.enemyMoveset([Moves.CHILLY_RECEPTION, Moves.TACKLE]);
    await game.classicMode.startBattle([Species.SLOWKING, Species.MEOWTH]);

    game.move.select(Moves.SPLASH);
    await game.forceEnemyMove(Moves.TACKLE);

    await game.phaseInterceptor.to("BerryPhase", false);
    expect(game.scene.arena.weather?.weatherType).toBeUndefined();
  });
});
