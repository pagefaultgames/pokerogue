import { SubstituteTag } from "#data/battler-tags";
import { AbilityId } from "#enums/ability-id";
import { ArenaTagType } from "#enums/arena-tag-type";
import { MoveId } from "#enums/move-id";
import { SpeciesId } from "#enums/species-id";
import { Stat } from "#enums/stat";
import { MoveEndPhase } from "#phases/move-end-phase";
import { TurnEndPhase } from "#phases/turn-end-phase";
import { GameManager } from "#test/test-utils/game-manager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";

describe("Moves - Tidy Up", () => {
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
      .enemySpecies(SpeciesId.MAGIKARP)
      .enemyAbility(AbilityId.BALL_FETCH)
      .enemyMoveset(MoveId.SPLASH)
      .starterSpecies(SpeciesId.FEEBAS)
      .ability(AbilityId.BALL_FETCH)
      .moveset([MoveId.TIDY_UP])
      .startingLevel(50);
  });

  it("spikes are cleared", async () => {
    game.override.moveset([MoveId.SPIKES, MoveId.TIDY_UP]).enemyMoveset(MoveId.SPIKES);
    await game.classicMode.startBattle();

    game.move.select(MoveId.SPIKES);
    await game.phaseInterceptor.to(TurnEndPhase);
    game.move.select(MoveId.TIDY_UP);
    await game.phaseInterceptor.to(MoveEndPhase);
    expect(game.scene.arena.getTag(ArenaTagType.SPIKES)).toBeUndefined();
  });

  it("stealth rocks are cleared", async () => {
    game.override.moveset([MoveId.STEALTH_ROCK, MoveId.TIDY_UP]).enemyMoveset(MoveId.STEALTH_ROCK);
    await game.classicMode.startBattle();

    game.move.select(MoveId.STEALTH_ROCK);
    await game.phaseInterceptor.to(TurnEndPhase);
    game.move.select(MoveId.TIDY_UP);
    await game.phaseInterceptor.to(MoveEndPhase);
    expect(game.scene.arena.getTag(ArenaTagType.STEALTH_ROCK)).toBeUndefined();
  });

  it("toxic spikes are cleared", async () => {
    game.override.moveset([MoveId.TOXIC_SPIKES, MoveId.TIDY_UP]).enemyMoveset(MoveId.TOXIC_SPIKES);
    await game.classicMode.startBattle();

    game.move.select(MoveId.TOXIC_SPIKES);
    await game.phaseInterceptor.to(TurnEndPhase);
    game.move.select(MoveId.TIDY_UP);
    await game.phaseInterceptor.to(MoveEndPhase);
    expect(game.scene.arena.getTag(ArenaTagType.TOXIC_SPIKES)).toBeUndefined();
  });

  it("sticky webs are cleared", async () => {
    game.override.moveset([MoveId.STICKY_WEB, MoveId.TIDY_UP]).enemyMoveset(MoveId.STICKY_WEB);

    await game.classicMode.startBattle();

    game.move.select(MoveId.STICKY_WEB);
    await game.phaseInterceptor.to(TurnEndPhase);
    game.move.select(MoveId.TIDY_UP);
    await game.phaseInterceptor.to(MoveEndPhase);
    expect(game.scene.arena.getTag(ArenaTagType.STICKY_WEB)).toBeUndefined();
  });

  it("substitutes are cleared", async () => {
    game.override.moveset([MoveId.SUBSTITUTE, MoveId.TIDY_UP]).enemyMoveset(MoveId.SUBSTITUTE);

    await game.classicMode.startBattle();

    game.move.select(MoveId.SUBSTITUTE);
    await game.phaseInterceptor.to(TurnEndPhase);
    game.move.select(MoveId.TIDY_UP);
    await game.phaseInterceptor.to(MoveEndPhase);

    const pokemon = [game.field.getPlayerPokemon(), game.field.getEnemyPokemon()];
    pokemon.forEach(p => {
      expect(p).toBeDefined();
      expect(p!.getTag(SubstituteTag)).toBeUndefined();
    });
  });

  it("user's stats are raised with no traps set", async () => {
    await game.classicMode.startBattle();

    const playerPokemon = game.field.getPlayerPokemon();

    expect(playerPokemon.getStatStage(Stat.ATK)).toBe(0);
    expect(playerPokemon.getStatStage(Stat.SPD)).toBe(0);

    game.move.select(MoveId.TIDY_UP);
    await game.phaseInterceptor.to(TurnEndPhase);

    expect(playerPokemon.getStatStage(Stat.ATK)).toBe(1);
    expect(playerPokemon.getStatStage(Stat.SPD)).toBe(1);
  });
});
