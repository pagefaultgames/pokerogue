import { allMoves } from "#app/data/data-lists";
import { PokemonType } from "#enums/pokemon-type";
import { Weather } from "#app/data/weather";
import type { PlayerPokemon } from "#app/field/pokemon";
import { TurnEndPhase } from "#app/phases/turn-end-phase";
import { AbilityId } from "#enums/ability-id";
import { BattlerTagType } from "#enums/battler-tag-type";
import { BiomeId } from "#enums/biome-id";
import { MoveId } from "#enums/move-id";
import { SpeciesId } from "#enums/species-id";
import { WeatherType } from "#enums/weather-type";
import GameManager from "#test/testUtils/gameManager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, test } from "vitest";

describe("Abilities - Libero", () => {
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
      .ability(AbilityId.LIBERO)
      .startingLevel(100)
      .enemySpecies(SpeciesId.RATTATA)
      .enemyMoveset(MoveId.ENDURE);
  });

  test("ability applies and changes a pokemon's type", async () => {
    game.override.moveset([MoveId.SPLASH]);

    await game.classicMode.startBattle([SpeciesId.MAGIKARP]);

    const leadPokemon = game.scene.getPlayerPokemon()!;
    expect(leadPokemon).not.toBe(undefined);

    game.move.select(MoveId.SPLASH);
    await game.phaseInterceptor.to(TurnEndPhase);

    testPokemonTypeMatchesDefaultMoveType(leadPokemon, MoveId.SPLASH);
  });

  // Test for Gen9+ functionality, we are using previous funcionality
  test.skip("ability applies only once per switch in", async () => {
    game.override.moveset([MoveId.SPLASH, MoveId.AGILITY]);

    await game.classicMode.startBattle([SpeciesId.MAGIKARP, SpeciesId.BULBASAUR]);

    let leadPokemon = game.scene.getPlayerPokemon()!;
    expect(leadPokemon).not.toBe(undefined);

    game.move.select(MoveId.SPLASH);
    await game.phaseInterceptor.to(TurnEndPhase);

    testPokemonTypeMatchesDefaultMoveType(leadPokemon, MoveId.SPLASH);

    game.move.select(MoveId.AGILITY);
    await game.phaseInterceptor.to(TurnEndPhase);

    expect(leadPokemon.waveData.abilitiesApplied).toContain(AbilityId.LIBERO);
    const leadPokemonType = PokemonType[leadPokemon.getTypes()[0]];
    const moveType = PokemonType[allMoves[MoveId.AGILITY].type];
    expect(leadPokemonType).not.toBe(moveType);

    await game.toNextTurn();
    game.doSwitchPokemon(1);
    await game.toNextTurn();
    game.doSwitchPokemon(1);
    await game.toNextTurn();

    leadPokemon = game.scene.getPlayerPokemon()!;
    expect(leadPokemon).not.toBe(undefined);

    game.move.select(MoveId.SPLASH);
    await game.phaseInterceptor.to(TurnEndPhase);

    testPokemonTypeMatchesDefaultMoveType(leadPokemon, MoveId.SPLASH);
  });

  test("ability applies correctly even if the pokemon's move has a variable type", async () => {
    game.override.moveset([MoveId.WEATHER_BALL]);

    await game.classicMode.startBattle([SpeciesId.MAGIKARP]);

    const leadPokemon = game.scene.getPlayerPokemon()!;
    expect(leadPokemon).not.toBe(undefined);

    game.scene.arena.weather = new Weather(WeatherType.SUNNY);
    game.move.select(MoveId.WEATHER_BALL);
    await game.phaseInterceptor.to(TurnEndPhase);

    expect(leadPokemon.waveData.abilitiesApplied).toContain(AbilityId.LIBERO);
    expect(leadPokemon.getTypes()).toHaveLength(1);
    const leadPokemonType = PokemonType[leadPokemon.getTypes()[0]],
      moveType = PokemonType[PokemonType.FIRE];
    expect(leadPokemonType).toBe(moveType);
  });

  test("ability applies correctly even if the type has changed by another ability", async () => {
    game.override.moveset([MoveId.TACKLE]).passiveAbility(AbilityId.REFRIGERATE);

    await game.classicMode.startBattle([SpeciesId.MAGIKARP]);

    const leadPokemon = game.scene.getPlayerPokemon()!;
    expect(leadPokemon).not.toBe(undefined);

    game.move.select(MoveId.TACKLE);
    await game.phaseInterceptor.to(TurnEndPhase);

    expect(leadPokemon.waveData.abilitiesApplied).toContain(AbilityId.LIBERO);
    expect(leadPokemon.getTypes()).toHaveLength(1);
    const leadPokemonType = PokemonType[leadPokemon.getTypes()[0]],
      moveType = PokemonType[PokemonType.ICE];
    expect(leadPokemonType).toBe(moveType);
  });

  test("ability applies correctly even if the pokemon's move calls another move", async () => {
    game.override.moveset([MoveId.NATURE_POWER]);

    await game.classicMode.startBattle([SpeciesId.MAGIKARP]);

    const leadPokemon = game.scene.getPlayerPokemon()!;
    expect(leadPokemon).not.toBe(undefined);

    game.scene.arena.biomeType = BiomeId.MOUNTAIN;
    game.move.select(MoveId.NATURE_POWER);
    await game.phaseInterceptor.to(TurnEndPhase);

    testPokemonTypeMatchesDefaultMoveType(leadPokemon, MoveId.AIR_SLASH);
  });

  test("ability applies correctly even if the pokemon's move is delayed / charging", async () => {
    game.override.moveset([MoveId.DIG]);

    await game.classicMode.startBattle([SpeciesId.MAGIKARP]);

    const leadPokemon = game.scene.getPlayerPokemon()!;
    expect(leadPokemon).not.toBe(undefined);

    game.move.select(MoveId.DIG);
    await game.phaseInterceptor.to(TurnEndPhase);

    testPokemonTypeMatchesDefaultMoveType(leadPokemon, MoveId.DIG);
  });

  test("ability applies correctly even if the pokemon's move misses", async () => {
    game.override.moveset([MoveId.TACKLE]).enemyMoveset(MoveId.SPLASH);

    await game.classicMode.startBattle([SpeciesId.MAGIKARP]);

    const leadPokemon = game.scene.getPlayerPokemon()!;
    expect(leadPokemon).not.toBe(undefined);

    game.move.select(MoveId.TACKLE);
    await game.move.forceMiss();
    await game.phaseInterceptor.to(TurnEndPhase);

    const enemyPokemon = game.scene.getEnemyPokemon()!;
    expect(enemyPokemon.isFullHp()).toBe(true);
    testPokemonTypeMatchesDefaultMoveType(leadPokemon, MoveId.TACKLE);
  });

  test("ability applies correctly even if the pokemon's move is protected against", async () => {
    game.override.moveset([MoveId.TACKLE]).enemyMoveset(MoveId.PROTECT);

    await game.classicMode.startBattle([SpeciesId.MAGIKARP]);

    const leadPokemon = game.scene.getPlayerPokemon()!;
    expect(leadPokemon).not.toBe(undefined);

    game.move.select(MoveId.TACKLE);
    await game.phaseInterceptor.to(TurnEndPhase);

    testPokemonTypeMatchesDefaultMoveType(leadPokemon, MoveId.TACKLE);
  });

  test("ability applies correctly even if the pokemon's move fails because of type immunity", async () => {
    game.override.moveset([MoveId.TACKLE]).enemySpecies(SpeciesId.GASTLY);

    await game.classicMode.startBattle([SpeciesId.MAGIKARP]);

    const leadPokemon = game.scene.getPlayerPokemon()!;
    expect(leadPokemon).not.toBe(undefined);

    game.move.select(MoveId.TACKLE);
    await game.phaseInterceptor.to(TurnEndPhase);

    testPokemonTypeMatchesDefaultMoveType(leadPokemon, MoveId.TACKLE);
  });

  test("ability is not applied if pokemon's type is the same as the move's type", async () => {
    game.override.moveset([MoveId.SPLASH]);

    await game.classicMode.startBattle([SpeciesId.MAGIKARP]);

    const leadPokemon = game.scene.getPlayerPokemon()!;
    expect(leadPokemon).not.toBe(undefined);

    leadPokemon.summonData.types = [allMoves[MoveId.SPLASH].type];
    game.move.select(MoveId.SPLASH);
    await game.phaseInterceptor.to(TurnEndPhase);

    expect(leadPokemon.waveData.abilitiesApplied).not.toContain(AbilityId.LIBERO);
  });

  test("ability is not applied if pokemon is terastallized", async () => {
    game.override.moveset([MoveId.SPLASH]);

    await game.classicMode.startBattle([SpeciesId.MAGIKARP]);

    const leadPokemon = game.scene.getPlayerPokemon()!;
    expect(leadPokemon).not.toBe(undefined);

    leadPokemon.isTerastallized = true;

    game.move.select(MoveId.SPLASH);
    await game.phaseInterceptor.to(TurnEndPhase);

    expect(leadPokemon.waveData.abilitiesApplied).not.toContain(AbilityId.LIBERO);
  });

  test("ability is not applied if pokemon uses struggle", async () => {
    game.override.moveset([MoveId.STRUGGLE]);

    await game.classicMode.startBattle([SpeciesId.MAGIKARP]);

    const leadPokemon = game.scene.getPlayerPokemon()!;
    expect(leadPokemon).not.toBe(undefined);

    game.move.select(MoveId.STRUGGLE);
    await game.phaseInterceptor.to(TurnEndPhase);

    expect(leadPokemon.waveData.abilitiesApplied).not.toContain(AbilityId.LIBERO);
  });

  test("ability is not applied if the pokemon's move fails", async () => {
    game.override.moveset([MoveId.BURN_UP]);

    await game.classicMode.startBattle([SpeciesId.MAGIKARP]);

    const leadPokemon = game.scene.getPlayerPokemon()!;
    expect(leadPokemon).not.toBe(undefined);

    game.move.select(MoveId.BURN_UP);
    await game.phaseInterceptor.to(TurnEndPhase);

    expect(leadPokemon.waveData.abilitiesApplied).not.toContain(AbilityId.LIBERO);
  });

  test("ability applies correctly even if the pokemon's Trick-or-Treat fails", async () => {
    game.override.moveset([MoveId.TRICK_OR_TREAT]).enemySpecies(SpeciesId.GASTLY);

    await game.classicMode.startBattle([SpeciesId.MAGIKARP]);

    const leadPokemon = game.scene.getPlayerPokemon()!;
    expect(leadPokemon).not.toBe(undefined);

    game.move.select(MoveId.TRICK_OR_TREAT);
    await game.phaseInterceptor.to(TurnEndPhase);

    testPokemonTypeMatchesDefaultMoveType(leadPokemon, MoveId.TRICK_OR_TREAT);
  });

  test("ability applies correctly and the pokemon curses itself", async () => {
    game.override.moveset([MoveId.CURSE]);

    await game.classicMode.startBattle([SpeciesId.MAGIKARP]);

    const leadPokemon = game.scene.getPlayerPokemon()!;
    expect(leadPokemon).not.toBe(undefined);

    game.move.select(MoveId.CURSE);
    await game.phaseInterceptor.to(TurnEndPhase);

    testPokemonTypeMatchesDefaultMoveType(leadPokemon, MoveId.CURSE);
    expect(leadPokemon.getTag(BattlerTagType.CURSED)).not.toBe(undefined);
  });
});

function testPokemonTypeMatchesDefaultMoveType(pokemon: PlayerPokemon, move: MoveId) {
  expect(pokemon.waveData.abilitiesApplied).toContain(AbilityId.LIBERO);
  expect(pokemon.getTypes()).toHaveLength(1);
  const pokemonType = PokemonType[pokemon.getTypes()[0]],
    moveType = PokemonType[allMoves[move].type];
  expect(pokemonType).toBe(moveType);
}
