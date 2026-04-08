import { allMoves } from "#data/data-lists";
import { AbilityId } from "#enums/ability-id";
import { BattlerTagType } from "#enums/battler-tag-type";
import { MoveId } from "#enums/move-id";
import { MoveResult } from "#enums/move-result";
import { PokemonType } from "#enums/pokemon-type";
import { SpeciesId } from "#enums/species-id";
import { Stat } from "#enums/stat";
import { WeatherType } from "#enums/weather-type";
import { GameManager } from "#test/framework/game-manager";
import Phaser from "phaser";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

describe("Abilities - Mega Sol", () => {
  let phaserGame: Phaser.Game;
  let game: GameManager;

  beforeAll(() => {
    phaserGame = new Phaser.Game({
      type: Phaser.HEADLESS,
    });
  });

  beforeEach(() => {
    game = new GameManager(phaserGame);
    game.override
      .battleStyle("single")
      .startingLevel(100)
      .enemySpecies(SpeciesId.SNORLAX)
      .enemyLevel(100)
      .enemyAbility(AbilityId.BALL_FETCH)
      .enemyMoveset(MoveId.SPLASH)
      .ability(AbilityId.MEGA_SOL)
      .weather(WeatherType.RAIN);
  });

  it("should allow Solar Beam to skip charging in rain", async () => {
    await game.classicMode.startBattle(SpeciesId.MEGANIUM);

    const playerPokemon = game.field.getPlayerPokemon();
    const enemyPokemon = game.field.getEnemyPokemon();

    game.move.use(MoveId.SOLAR_BEAM);
    await game.phaseInterceptor.to("TurnEndPhase");

    expect(playerPokemon.getTag(BattlerTagType.CHARGING)).toBeUndefined();
    expect(enemyPokemon.hp).toBeLessThan(enemyPokemon.getMaxHp());
    expect(playerPokemon.getLastXMoves(1)[0].result).toBe(MoveResult.SUCCESS);
  });

  it("should prevent Solar Beam power reduction in rain", async () => {
    await game.classicMode.startBattle(SpeciesId.MEGANIUM);

    const solarBeam = allMoves[MoveId.SOLAR_BEAM];
    vi.spyOn(solarBeam, "calculateBattlePower");

    game.move.use(MoveId.SOLAR_BEAM);
    await game.phaseInterceptor.to("TurnEndPhase");

    expect(solarBeam.calculateBattlePower).toHaveLastReturnedWith(120);
  });

  it("should reduce Thunder accuracy as if sunny", async () => {
    await game.classicMode.startBattle(SpeciesId.MEGANIUM);

    const thunder = allMoves[MoveId.THUNDER];
    vi.spyOn(thunder, "calculateBattleAccuracy");

    game.move.use(MoveId.THUNDER);
    await game.phaseInterceptor.to("MoveEffectPhase");

    expect(thunder.calculateBattleAccuracy).toHaveReturnedWith(50);
  });

  it("should boost Fire-type move damage as if sunny", async () => {
    await game.classicMode.startBattle(SpeciesId.MEGANIUM);

    const playerPokemon = game.field.getPlayerPokemon();

    const arenaMultiplier = game.scene.arena.getAttackTypeMultiplier(
      allMoves[MoveId.EMBER].type,
      playerPokemon.isGrounded(),
      playerPokemon.getEffectiveWeatherTypeForMoves(),
    );
    expect(arenaMultiplier).toBe(1.5);
  });

  it("should reduce Water-type move damage as if sunny", async () => {
    await game.classicMode.startBattle(SpeciesId.MEGANIUM);

    const playerPokemon = game.field.getPlayerPokemon();

    const arenaMultiplier = game.scene.arena.getAttackTypeMultiplier(
      allMoves[MoveId.SURF].type,
      playerPokemon.isGrounded(),
      playerPokemon.getEffectiveWeatherTypeForMoves(),
    );
    expect(arenaMultiplier).toBe(0.5);
  });

  it("should double Growth stat stage changes as if sunny", async () => {
    await game.classicMode.startBattle(SpeciesId.MEGANIUM);

    const playerPokemon = game.field.getPlayerPokemon();

    expect(playerPokemon.getStatStage(Stat.ATK)).toBe(0);
    expect(playerPokemon.getStatStage(Stat.SPATK)).toBe(0);

    game.move.use(MoveId.GROWTH);
    await game.toEndOfTurn();

    expect(playerPokemon.getStatStage(Stat.ATK)).toBe(2);
    expect(playerPokemon.getStatStage(Stat.SPATK)).toBe(2);
  });

  it("should change Weather Ball to Fire type and double its power", async () => {
    await game.classicMode.startBattle(SpeciesId.MEGANIUM);

    const weatherBall = allMoves[MoveId.WEATHER_BALL];
    vi.spyOn(weatherBall, "calculateBattlePower");

    game.move.use(MoveId.WEATHER_BALL);
    await game.phaseInterceptor.to("MoveEffectPhase");

    const moveType = new (await import("#utils/common")).NumberHolder(weatherBall.type);
    weatherBall
      .getAttrs("VariableMoveTypeAttr")[0]
      .apply(game.field.getPlayerPokemon(), game.field.getEnemyPokemon(), weatherBall, [moveType]);
    expect(moveType.value).toBe(PokemonType.FIRE);
    expect(weatherBall.calculateBattlePower).toHaveLastReturnedWith(100);
  });

  it("should cause Synthesis to heal 2/3 HP as if sunny", async () => {
    await game.classicMode.startBattle(SpeciesId.MEGANIUM);

    const playerPokemon = game.field.getPlayerPokemon();
    const maxHp = playerPokemon.getMaxHp();
    playerPokemon.hp = 1;

    game.move.use(MoveId.SYNTHESIS);
    await game.toEndOfTurn();

    const expectedHeal = Math.floor(maxHp * (2 / 3));
    expect(playerPokemon.hp).toBeGreaterThanOrEqual(1 + expectedHeal - 1);
    expect(playerPokemon.hp).toBeLessThanOrEqual(1 + expectedHeal + 1);
  });
});
