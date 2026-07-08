import { allMoves } from "#data/data-lists";
import { getWeatherMultiplierForMove } from "#data/weather";
import { AbilityId } from "#enums/ability-id";
import { BattlerTagType } from "#enums/battler-tag-type";
import { BerryType } from "#enums/berry-type";
import { MoveId } from "#enums/move-id";
import { MoveResult } from "#enums/move-result";
import { PokemonType } from "#enums/pokemon-type";
import { SpeciesId } from "#enums/species-id";
import { Stat } from "#enums/stat";
import { StatusEffect } from "#enums/status-effect";
import { WeatherType } from "#enums/weather-type";
import { BerryModifier } from "#modifiers/modifier";
import { GameManager } from "#test/framework/game-manager";
import type { GetEffectiveStatParams } from "#types/pokemon-common";
import * as Utils from "#utils/common";
import { ValueHolder } from "#utils/value-holder";
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

    expect(getWeatherMultiplierForMove(playerPokemon, allMoves[MoveId.EMBER])).toBe(1.5);
  });

  it("should reduce Water-type move damage as if sunny", async () => {
    await game.classicMode.startBattle(SpeciesId.MEGANIUM);

    const playerPokemon = game.field.getPlayerPokemon();

    expect(getWeatherMultiplierForMove(playerPokemon, allMoves[MoveId.WATER_GUN])).toBe(0.5);
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

    const moveType = new ValueHolder(weatherBall.type);
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

  // TODO: This interaction needs to be verified in game; Bulbapedia may be incorrect
  it("should ignore sandstorm's Special Defense boost to rock types", async () => {
    game.override.enemySpecies(SpeciesId.GEODUDE).weather(WeatherType.SANDSTORM);
    await game.classicMode.startBattle(SpeciesId.MEGANIUM);

    const enemyPokemon = game.field.getEnemyPokemon();
    enemyPokemon.stats[Stat.SPDEF] = 100;
    // Override enemy stats to read as 100
    vi.spyOn(enemyPokemon, "getStat").mockReturnValue(100);
    const playerPokemon = game.field.getPlayerPokemon();

    const params: GetEffectiveStatParams = {
      opponent: playerPokemon,
      move: allMoves[MoveId.DISARMING_VOICE],
      forDefend: true,
      // Ignore mega sol to test stat boost WITHOUT factoring in opponent's mega sol
      ignoreOppAbility: true,
      // the extra ignores defensively avoid modifications that are inconsequential to the test
      ignoreAllyAbility: true,
      ignoreAbility: true,
      ignoreHeldItems: true,
    };

    // Ensure sandstorm boost is applied (otherwise we are testing nothing)
    expect(enemyPokemon.getEffectiveStat(Stat.SPDEF, params)).toBe(150);

    params.ignoreOppAbility = false; // test with mega sol factored in
    expect(enemyPokemon.getEffectiveStat(Stat.SPDEF, params)).toBe(100);
  });

  it("should ignore snowscape's defense boost to ice types", async () => {
    game.override.enemySpecies(SpeciesId.SNORUNT).weather(WeatherType.SNOW);
    await game.classicMode.startBattle(SpeciesId.MEGANIUM);

    const enemyPokemon = game.field.getEnemyPokemon();
    enemyPokemon.stats[Stat.DEF] = 100;
    // Override enemy's defense to be 100
    vi.spyOn(enemyPokemon, "getStat").mockReturnValue(100);
    const playerPokemon = game.field.getPlayerPokemon();

    const params: GetEffectiveStatParams = {
      opponent: playerPokemon,
      move: allMoves[MoveId.TACKLE],
      forDefend: true,
      // Ignore mega sol to test stat boost WITHOUT factoring in opponent's mega sol
      ignoreOppAbility: true,
      // the extra ignores defensively avoid modifications that are inconsequential to the test
      ignoreAllyAbility: true,
      ignoreAbility: true,
      ignoreHeldItems: true,
    };

    // Ensure snowscape boost is applied (otherwise nothing is tested)
    expect(enemyPokemon.getEffectiveStat(Stat.DEF, params)).toBe(150);

    params.ignoreOppAbility = false; // test with mega sol factored in
    expect(enemyPokemon.getEffectiveStat(Stat.DEF, params)).toBe(100);
  });

  it("should change castform form if included as passive ability", async () => {
    game.override.ability(AbilityId.FORECAST).passiveAbility(AbilityId.MEGA_SOL);
    await game.classicMode.startBattle(SpeciesId.CASTFORM);

    const pokemon = game.field.getPlayerPokemon();
    expect(pokemon.formIndex).toBe(1);
  });

  it("should let solar power boost damage and tick damage when included as passive ability", async () => {
    game.override.ability(AbilityId.SOLAR_POWER).passiveAbility(AbilityId.MEGA_SOL);
    await game.classicMode.startBattle(SpeciesId.GROOKEY);

    const playerPokemon = game.field.getPlayerPokemon();
    const enemyPokemon = game.field.getEnemyPokemon();
    const swift = allMoves[MoveId.SWIFT];
    const boostedDamage = enemyPokemon.getAttackDamage({ source: playerPokemon, move: swift }).damage;
    const unboostedDamage = enemyPokemon.getAttackDamage({
      source: playerPokemon,
      move: swift,
      ignoreAbility: true,
    }).damage;

    expect(boostedDamage).toBeGreaterThan(unboostedDamage);

    const maxHp = playerPokemon.getMaxHp();
    game.move.use(MoveId.SPLASH);
    await game.toEndOfTurn();

    expect(playerPokemon.hp).toBe(maxHp - Utils.toDmgValue(maxHp / 8));
  });

  it("should let chlorophyll double speed when mega sol is included as passive ability", async () => {
    game.override.ability(AbilityId.CHLOROPHYLL).passiveAbility(AbilityId.MEGA_SOL);
    await game.classicMode.startBattle(SpeciesId.GROOKEY);

    const playerPokemon = game.field.getPlayerPokemon();
    const baseSpeed = playerPokemon.getEffectiveStat(Stat.SPD, { ignoreAbility: true });

    expect(playerPokemon.getEffectiveStat(Stat.SPD)).toBe(baseSpeed * 2);
  });

  it("should let protosynthesis boost the highest non-Speed stat by 1.3x when mega sol is included as passive ability", async () => {
    game.override.ability(AbilityId.PROTOSYNTHESIS).passiveAbility(AbilityId.MEGA_SOL);
    await game.classicMode.startBattle(SpeciesId.GROOKEY);

    const playerPokemon = game.field.getPlayerPokemon();
    const baseAttack = playerPokemon.getStat(Stat.ATK, false);

    expect(playerPokemon.getTag(BattlerTagType.PROTOSYNTHESIS)).toBeDefined();
    expect(playerPokemon.getEffectiveStat(Stat.ATK)).toBe(Math.floor(baseAttack * 1.3));
  });

  it("should let leaf guard prevent status conditions when mega sol is included as passive ability", async () => {
    game.override.ability(AbilityId.LEAF_GUARD).passiveAbility(AbilityId.MEGA_SOL);
    await game.classicMode.startBattle(SpeciesId.GROOKEY);

    const playerPokemon = game.field.getPlayerPokemon();
    const statusEffects = [
      StatusEffect.POISON,
      StatusEffect.TOXIC,
      StatusEffect.PARALYSIS,
      StatusEffect.SLEEP,
      StatusEffect.FREEZE,
      StatusEffect.BURN,
    ];

    for (const statusEffect of statusEffects) {
      expect(playerPokemon.canSetStatus(statusEffect, true)).toBe(false);
    }
  });

  it("should let harvest always reactivate eaten berries when mega sol is included as passive ability", async () => {
    game.override.ability(AbilityId.HARVEST).passiveAbility(AbilityId.MEGA_SOL);
    vi.spyOn(Utils, "randSeedFloat").mockReturnValueOnce(0.75);
    await game.classicMode.startBattle(SpeciesId.GROOKEY);

    const playerPokemon = game.field.getPlayerPokemon();
    playerPokemon.battleData.berriesEaten = [BerryType.LUM];

    game.move.use(MoveId.SPLASH);
    await game.phaseInterceptor.to("TurnEndPhase");

    const playerBerries = game.scene
      .getModifiers(BerryModifier, true)
      .filter(berry => berry.pokemonId === playerPokemon.id);
    expect(playerBerries).toEqual([expect.objectContaining({ berryType: BerryType.LUM, stackCount: 1 })]);
    expect(playerPokemon.battleData.berriesEaten).toEqual([]);
  });

  it("should let dry skin apply its damage tick when mega sol is included as passive ability", async () => {
    game.override.ability(AbilityId.DRY_SKIN).passiveAbility(AbilityId.MEGA_SOL).weather(WeatherType.NONE);
    await game.classicMode.startBattle(SpeciesId.GROOKEY);

    const playerPokemon = game.field.getPlayerPokemon();
    const maxHp = playerPokemon.getMaxHp();

    game.move.use(MoveId.SPLASH);
    await game.toEndOfTurn();

    expect(playerPokemon.hp).toBe(maxHp - Utils.toDmgValue(maxHp / 8));
  });

  it("should result in net zero hp change when dry skin in rain with mega sol as passive ability", async () => {
    game.override.ability(AbilityId.DRY_SKIN).passiveAbility(AbilityId.MEGA_SOL).weather(WeatherType.RAIN);
    await game.classicMode.startBattle(SpeciesId.GROOKEY);

    const playerPokemon = game.field.getPlayerPokemon();
    const maxHp = playerPokemon.getMaxHp();

    game.move.use(MoveId.SPLASH);
    await game.toEndOfTurn();

    expect(playerPokemon.hp).toBe(maxHp);
  });

  it("should not change cherrim back to normal form when sun starts and ends during battle", async () => {
    game.override.ability(AbilityId.FLOWER_GIFT).passiveAbility(AbilityId.MEGA_SOL).weather(WeatherType.NONE);
    await game.classicMode.startBattle(SpeciesId.CHERRIM);

    const pokemon = game.field.getPlayerPokemon();
    expect(pokemon.formIndex).toBe(1);

    game.move.use(MoveId.SUNNY_DAY);
    await game.toEndOfTurn();

    expect(game.scene.arena.weather?.weatherType).toBe(WeatherType.SUNNY);
    expect(pokemon.formIndex).toBe(1);

    game.scene.arena.weather!.turnsLeft = 1;
    await game.toNextTurn();
    game.move.use(MoveId.SPLASH);
    await game.toEndOfTurn();

    expect(game.scene.arena.weather?.weatherType).toBeUndefined();
    expect(pokemon.formIndex).not.toBe(0);
  });
});
