import { Stat } from "#enums/stat";
import { ArenaTagType } from "#app/enums/arena-tag-type";
import { MoveEndPhase } from "#app/phases/move-end-phase";
import { TurnEndPhase } from "#app/phases/turn-end-phase";
import { AbilityId } from "#enums/ability-id";
import { MoveId } from "#enums/move-id";
import { SpeciesId } from "#enums/species-id";
import GameManager from "#test/testUtils/gameManager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { SubstituteTag } from "#app/data/battler-tags";

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
    game.override.battleStyle("single");
    game.override.enemySpecies(SpeciesId.MAGIKARP);
    game.override.enemyAbility(AbilityId.BALL_FETCH);
    game.override.enemyMoveset(MoveId.SPLASH);
    game.override.starterSpecies(SpeciesId.FEEBAS);
    game.override.ability(AbilityId.BALL_FETCH);
    game.override.moveset([MoveId.TIDY_UP]);
    game.override.startingLevel(50);
  });

  it("spikes are cleared", async () => {
    game.override.moveset([MoveId.SPIKES, MoveId.TIDY_UP]).enemyMoveset(MoveId.SPIKES);
    await game.classicMode.startBattle();

    game.move.select(MoveId.SPIKES);
    await game.phaseInterceptor.to(TurnEndPhase);
    game.move.select(MoveId.TIDY_UP);
    await game.phaseInterceptor.to(MoveEndPhase);
    expect(game.scene.arena.getTag(ArenaTagType.SPIKES)).toBeUndefined();
  }, 20000);

  it("stealth rocks are cleared", async () => {
    game.override.moveset([MoveId.STEALTH_ROCK, MoveId.TIDY_UP]).enemyMoveset(MoveId.STEALTH_ROCK);
    await game.classicMode.startBattle();

    game.move.select(MoveId.STEALTH_ROCK);
    await game.phaseInterceptor.to(TurnEndPhase);
    game.move.select(MoveId.TIDY_UP);
    await game.phaseInterceptor.to(MoveEndPhase);
    expect(game.scene.arena.getTag(ArenaTagType.STEALTH_ROCK)).toBeUndefined();
  }, 20000);

  it("toxic spikes are cleared", async () => {
    game.override.moveset([MoveId.TOXIC_SPIKES, MoveId.TIDY_UP]).enemyMoveset(MoveId.TOXIC_SPIKES);
    await game.classicMode.startBattle();

    game.move.select(MoveId.TOXIC_SPIKES);
    await game.phaseInterceptor.to(TurnEndPhase);
    game.move.select(MoveId.TIDY_UP);
    await game.phaseInterceptor.to(MoveEndPhase);
    expect(game.scene.arena.getTag(ArenaTagType.TOXIC_SPIKES)).toBeUndefined();
  }, 20000);

  it("sticky webs are cleared", async () => {
    game.override.moveset([MoveId.STICKY_WEB, MoveId.TIDY_UP]).enemyMoveset(MoveId.STICKY_WEB);

    await game.classicMode.startBattle();

    game.move.select(MoveId.STICKY_WEB);
    await game.phaseInterceptor.to(TurnEndPhase);
    game.move.select(MoveId.TIDY_UP);
    await game.phaseInterceptor.to(MoveEndPhase);
    expect(game.scene.arena.getTag(ArenaTagType.STICKY_WEB)).toBeUndefined();
  }, 20000);

  it("substitutes are cleared", async () => {
    game.override.moveset([MoveId.SUBSTITUTE, MoveId.TIDY_UP]).enemyMoveset(MoveId.SUBSTITUTE);

    await game.classicMode.startBattle();

    game.move.select(MoveId.SUBSTITUTE);
    await game.phaseInterceptor.to(TurnEndPhase);
    game.move.select(MoveId.TIDY_UP);
    await game.phaseInterceptor.to(MoveEndPhase);

    const pokemon = [game.scene.getPlayerPokemon()!, game.scene.getEnemyPokemon()!];
    pokemon.forEach(p => {
      expect(p).toBeDefined();
      expect(p!.getTag(SubstituteTag)).toBeUndefined();
    });
  }, 20000);

  it("user's stats are raised with no traps set", async () => {
    await game.classicMode.startBattle();

    const playerPokemon = game.scene.getPlayerPokemon()!;

    expect(playerPokemon.getStatStage(Stat.ATK)).toBe(0);
    expect(playerPokemon.getStatStage(Stat.SPD)).toBe(0);

    game.move.select(MoveId.TIDY_UP);
    await game.phaseInterceptor.to(TurnEndPhase);

    expect(playerPokemon.getStatStage(Stat.ATK)).toBe(1);
    expect(playerPokemon.getStatStage(Stat.SPD)).toBe(1);
  }, 20000);
});
