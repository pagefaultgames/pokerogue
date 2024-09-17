import { Stat } from "#enums/stat";
import { ArenaTagType } from "#app/enums/arena-tag-type";
import { MoveEndPhase } from "#app/phases/move-end-phase";
import { TurnEndPhase } from "#app/phases/turn-end-phase";
import { Abilities } from "#enums/abilities";
import { Moves } from "#enums/moves";
import { Species } from "#enums/species";
import GameManager from "#test/utils/gameManager";
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
    game.override.battleType("single");
    game.override.enemySpecies(Species.MAGIKARP);
    game.override.enemyAbility(Abilities.BALL_FETCH);
    game.override.enemyMoveset(Moves.SPLASH);
    game.override.starterSpecies(Species.FEEBAS);
    game.override.ability(Abilities.BALL_FETCH);
    game.override.moveset([Moves.TIDY_UP]);
    game.override.startingLevel(50);
  });

  it("spikes are cleared", async () => {
    game.override.moveset([Moves.SPIKES, Moves.TIDY_UP]);
    game.override.enemyMoveset([Moves.SPIKES, Moves.SPIKES, Moves.SPIKES, Moves.SPIKES]);
    await game.classicMode.startBattle();

    game.move.select(Moves.SPIKES);
    await game.phaseInterceptor.to(TurnEndPhase);
    game.move.select(Moves.TIDY_UP);
    await game.phaseInterceptor.to(MoveEndPhase);
    expect(game.scene.arena.getTag(ArenaTagType.SPIKES)).toBeUndefined();

  }, 20000);

  it("stealth rocks are cleared", async () => {
    game.override.moveset([Moves.STEALTH_ROCK, Moves.TIDY_UP]);
    game.override.enemyMoveset([Moves.STEALTH_ROCK, Moves.STEALTH_ROCK, Moves.STEALTH_ROCK, Moves.STEALTH_ROCK]);
    await game.classicMode.startBattle();

    game.move.select(Moves.STEALTH_ROCK);
    await game.phaseInterceptor.to(TurnEndPhase);
    game.move.select(Moves.TIDY_UP);
    await game.phaseInterceptor.to(MoveEndPhase);
    expect(game.scene.arena.getTag(ArenaTagType.STEALTH_ROCK)).toBeUndefined();
  }, 20000);

  it("toxic spikes are cleared", async () => {
    game.override.moveset([Moves.TOXIC_SPIKES, Moves.TIDY_UP]);
    game.override.enemyMoveset([Moves.TOXIC_SPIKES, Moves.TOXIC_SPIKES, Moves.TOXIC_SPIKES, Moves.TOXIC_SPIKES]);
    await game.classicMode.startBattle();

    game.move.select(Moves.TOXIC_SPIKES);
    await game.phaseInterceptor.to(TurnEndPhase);
    game.move.select(Moves.TIDY_UP);
    await game.phaseInterceptor.to(MoveEndPhase);
    expect(game.scene.arena.getTag(ArenaTagType.TOXIC_SPIKES)).toBeUndefined();
  }, 20000);

  it("sticky webs are cleared", async () => {
    game.override.moveset([Moves.STICKY_WEB, Moves.TIDY_UP]);
    game.override.enemyMoveset([Moves.STICKY_WEB, Moves.STICKY_WEB, Moves.STICKY_WEB, Moves.STICKY_WEB]);

    await game.classicMode.startBattle();

    game.move.select(Moves.STICKY_WEB);
    await game.phaseInterceptor.to(TurnEndPhase);
    game.move.select(Moves.TIDY_UP);
    await game.phaseInterceptor.to(MoveEndPhase);
    expect(game.scene.arena.getTag(ArenaTagType.STICKY_WEB)).toBeUndefined();
  }, 20000);

  it("substitutes are cleared", async () => {
    game.override.moveset([Moves.SUBSTITUTE, Moves.TIDY_UP]);
    game.override.enemyMoveset([Moves.SUBSTITUTE, Moves.SUBSTITUTE, Moves.SUBSTITUTE, Moves.SUBSTITUTE]);

    await game.classicMode.startBattle();

    game.move.select(Moves.SUBSTITUTE);
    await game.phaseInterceptor.to(TurnEndPhase);
    game.move.select(Moves.TIDY_UP);
    await game.phaseInterceptor.to(MoveEndPhase);

    const pokemon = [ game.scene.getPlayerPokemon()!, game.scene.getEnemyPokemon()! ];
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

    game.move.select(Moves.TIDY_UP);
    await game.phaseInterceptor.to(TurnEndPhase);

    expect(playerPokemon.getStatStage(Stat.ATK)).toBe(1);
    expect(playerPokemon.getStatStage(Stat.SPD)).toBe(1);
  }, 20000);
});
