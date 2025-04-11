import { ArenaTagSide } from "#app/data/arena-tag";
import { ArenaTagType } from "#app/enums/arena-tag-type";
import { Abilities } from "#enums/abilities";
import { Moves } from "#enums/moves";
import { Species } from "#enums/species";
import GameManager from "#test/testUtils/gameManager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";

describe("Moves - Fairy Lock", () => {
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
      .moveset([Moves.FAIRY_LOCK, Moves.SPLASH])
      .ability(Abilities.BALL_FETCH)
      .battleStyle("double")
      .disableCrits()
      .enemySpecies(Species.MAGIKARP)
      .enemyAbility(Abilities.BALL_FETCH)
      .enemyMoveset([Moves.SPLASH, Moves.U_TURN]);
  });

  it("Applies Fairy Lock tag for two turns", async () => {
    await game.classicMode.startBattle([Species.KLEFKI, Species.TYRUNT]);
    const playerPokemon = game.scene.getPlayerField();
    const enemyField = game.scene.getEnemyField();

    game.move.select(Moves.FAIRY_LOCK);
    game.move.select(Moves.SPLASH, 1);
    await game.forceEnemyMove(Moves.SPLASH, 1);
    await game.forceEnemyMove(Moves.SPLASH, 1);
    await game.phaseInterceptor.to("BerryPhase");
    expect(game.scene.arena.getTagOnSide(ArenaTagType.FAIRY_LOCK, ArenaTagSide.PLAYER)).toBeDefined();
    expect(game.scene.arena.getTagOnSide(ArenaTagType.FAIRY_LOCK, ArenaTagSide.ENEMY)).toBeDefined();

    await game.toNextTurn();

    game.move.select(Moves.SPLASH);
    game.move.select(Moves.SPLASH);
    await game.forceEnemyMove(Moves.SPLASH, 1);
    await game.forceEnemyMove(Moves.SPLASH, 1);
    await game.phaseInterceptor.to("BerryPhase");
    expect(playerPokemon[0].isTrapped()).toEqual(true);
    expect(playerPokemon[1].isTrapped()).toEqual(true);
    expect(enemyField[0].isTrapped()).toEqual(true);
    expect(enemyField[1].isTrapped()).toEqual(true);

    await game.toNextTurn();
    expect(playerPokemon[0].isTrapped()).toEqual(false);
    expect(playerPokemon[1].isTrapped()).toEqual(false);
    expect(enemyField[0].isTrapped()).toEqual(false);
    expect(enemyField[1].isTrapped()).toEqual(false);
  });

  it("Ghost types can escape Fairy Lock", async () => {
    await game.classicMode.startBattle([Species.DUSKNOIR, Species.GENGAR, Species.TYRUNT]);

    game.move.select(Moves.FAIRY_LOCK);
    game.move.select(Moves.SPLASH, 1);
    await game.forceEnemyMove(Moves.SPLASH, 1);
    await game.forceEnemyMove(Moves.SPLASH, 1);
    await game.phaseInterceptor.to("BerryPhase");

    expect(game.scene.arena.getTagOnSide(ArenaTagType.FAIRY_LOCK, ArenaTagSide.PLAYER)).toBeDefined();
    expect(game.scene.arena.getTagOnSide(ArenaTagType.FAIRY_LOCK, ArenaTagSide.ENEMY)).toBeDefined();

    await game.toNextTurn();

    expect(game.scene.getPlayerField()[0].isTrapped()).toEqual(false);
    expect(game.scene.getPlayerField()[1].isTrapped()).toEqual(false);

    game.move.select(Moves.SPLASH);
    game.doSwitchPokemon(2);
    await game.forceEnemyMove(Moves.SPLASH, 1);
    await game.forceEnemyMove(Moves.SPLASH, 1);
    await game.phaseInterceptor.to("BerryPhase");
    await game.toNextTurn();

    expect(game.scene.getPlayerField()[1].species.speciesId).not.toBe(Species.GENGAR);
  });

  it("Phasing moves will still switch out", async () => {
    game.override.enemyMoveset([Moves.SPLASH, Moves.WHIRLWIND]);
    await game.classicMode.startBattle([Species.KLEFKI, Species.TYRUNT, Species.ZYGARDE]);

    game.move.select(Moves.FAIRY_LOCK);
    game.move.select(Moves.SPLASH, 1);
    await game.forceEnemyMove(Moves.SPLASH, 1);
    await game.forceEnemyMove(Moves.SPLASH, 1);
    await game.phaseInterceptor.to("BerryPhase");

    expect(game.scene.arena.getTagOnSide(ArenaTagType.FAIRY_LOCK, ArenaTagSide.PLAYER)).toBeDefined();
    expect(game.scene.arena.getTagOnSide(ArenaTagType.FAIRY_LOCK, ArenaTagSide.ENEMY)).toBeDefined();

    await game.toNextTurn();
    game.move.select(Moves.SPLASH);
    game.move.select(Moves.SPLASH);
    await game.forceEnemyMove(Moves.WHIRLWIND, 0);
    game.doSelectPartyPokemon(2);
    await game.forceEnemyMove(Moves.WHIRLWIND, 1);
    game.doSelectPartyPokemon(2);
    await game.phaseInterceptor.to("BerryPhase");
    await game.toNextTurn();

    expect(game.scene.getPlayerField()[0].species.speciesId).not.toBe(Species.KLEFKI);
    expect(game.scene.getPlayerField()[1].species.speciesId).not.toBe(Species.TYRUNT);
  });

  it("If a Pokemon faints and is replaced the replacement is also trapped", async () => {
    game.override.moveset([Moves.FAIRY_LOCK, Moves.SPLASH, Moves.MEMENTO]);
    await game.classicMode.startBattle([Species.KLEFKI, Species.GUZZLORD, Species.TYRUNT, Species.ZYGARDE]);

    game.move.select(Moves.FAIRY_LOCK);
    game.move.select(Moves.MEMENTO, 1);
    game.doSelectPartyPokemon(2);
    await game.forceEnemyMove(Moves.SPLASH, 1);
    await game.forceEnemyMove(Moves.SPLASH, 1);
    await game.phaseInterceptor.to("BerryPhase");
    expect(game.scene.arena.getTagOnSide(ArenaTagType.FAIRY_LOCK, ArenaTagSide.PLAYER)).toBeDefined();
    expect(game.scene.arena.getTagOnSide(ArenaTagType.FAIRY_LOCK, ArenaTagSide.ENEMY)).toBeDefined();

    await game.toNextTurn();
    game.move.select(Moves.SPLASH);
    game.move.select(Moves.SPLASH);
    await game.forceEnemyMove(Moves.SPLASH, 1);
    await game.forceEnemyMove(Moves.SPLASH, 1);
    await game.phaseInterceptor.to("BerryPhase");
    expect(game.scene.getPlayerField()[0].isTrapped()).toEqual(true);
    expect(game.scene.getPlayerField()[1].isTrapped()).toEqual(true);
    expect(game.scene.getEnemyField()[0].isTrapped()).toEqual(true);
    expect(game.scene.getEnemyField()[1].isTrapped()).toEqual(true);

    await game.toNextTurn();
    expect(game.scene.getPlayerField()[0].isTrapped()).toEqual(false);
    expect(game.scene.getPlayerField()[1].isTrapped()).toEqual(false);
    expect(game.scene.getEnemyField()[0].isTrapped()).toEqual(false);
    expect(game.scene.getEnemyField()[1].isTrapped()).toEqual(false);
  });
});
