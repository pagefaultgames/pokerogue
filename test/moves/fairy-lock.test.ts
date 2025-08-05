import { AbilityId } from "#enums/ability-id";
import { ArenaTagSide } from "#enums/arena-tag-side";
import { ArenaTagType } from "#enums/arena-tag-type";
import { MoveId } from "#enums/move-id";
import { SpeciesId } from "#enums/species-id";
import { GameManager } from "#test/test-utils/game-manager";
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
      .moveset([MoveId.FAIRY_LOCK, MoveId.SPLASH])
      .ability(AbilityId.BALL_FETCH)
      .battleStyle("double")
      .criticalHits(false)
      .enemySpecies(SpeciesId.MAGIKARP)
      .enemyAbility(AbilityId.BALL_FETCH)
      .enemyMoveset([MoveId.SPLASH, MoveId.U_TURN]);
  });

  it("Applies Fairy Lock tag for two turns", async () => {
    await game.classicMode.startBattle([SpeciesId.KLEFKI, SpeciesId.TYRUNT]);
    const playerPokemon = game.scene.getPlayerField();
    const enemyField = game.scene.getEnemyField();

    game.move.select(MoveId.FAIRY_LOCK);
    game.move.select(MoveId.SPLASH, 1);
    await game.move.selectEnemyMove(MoveId.SPLASH, 1);
    await game.move.selectEnemyMove(MoveId.SPLASH, 1);
    await game.phaseInterceptor.to("BerryPhase");
    expect(game.scene.arena.getTagOnSide(ArenaTagType.FAIRY_LOCK, ArenaTagSide.PLAYER)).toBeDefined();
    expect(game.scene.arena.getTagOnSide(ArenaTagType.FAIRY_LOCK, ArenaTagSide.ENEMY)).toBeDefined();

    await game.toNextTurn();

    game.move.select(MoveId.SPLASH);
    game.move.select(MoveId.SPLASH);
    await game.move.selectEnemyMove(MoveId.SPLASH, 1);
    await game.move.selectEnemyMove(MoveId.SPLASH, 1);
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
    await game.classicMode.startBattle([SpeciesId.DUSKNOIR, SpeciesId.GENGAR, SpeciesId.TYRUNT]);

    game.move.select(MoveId.FAIRY_LOCK);
    game.move.select(MoveId.SPLASH, 1);
    await game.move.selectEnemyMove(MoveId.SPLASH, 1);
    await game.move.selectEnemyMove(MoveId.SPLASH, 1);
    await game.phaseInterceptor.to("BerryPhase");

    expect(game.scene.arena.getTagOnSide(ArenaTagType.FAIRY_LOCK, ArenaTagSide.PLAYER)).toBeDefined();
    expect(game.scene.arena.getTagOnSide(ArenaTagType.FAIRY_LOCK, ArenaTagSide.ENEMY)).toBeDefined();

    await game.toNextTurn();

    expect(game.scene.getPlayerField()[0].isTrapped()).toEqual(false);
    expect(game.scene.getPlayerField()[1].isTrapped()).toEqual(false);

    game.move.select(MoveId.SPLASH);
    game.doSwitchPokemon(2);
    await game.move.selectEnemyMove(MoveId.SPLASH, 1);
    await game.move.selectEnemyMove(MoveId.SPLASH, 1);
    await game.phaseInterceptor.to("BerryPhase");
    await game.toNextTurn();

    expect(game.scene.getPlayerField()[1].species.speciesId).not.toBe(SpeciesId.GENGAR);
  });

  it("Phasing moves will still switch out", async () => {
    game.override.enemyMoveset([MoveId.SPLASH, MoveId.WHIRLWIND]);
    await game.classicMode.startBattle([SpeciesId.KLEFKI, SpeciesId.TYRUNT, SpeciesId.ZYGARDE]);

    game.move.select(MoveId.FAIRY_LOCK);
    game.move.select(MoveId.SPLASH, 1);
    await game.move.selectEnemyMove(MoveId.SPLASH, 1);
    await game.move.selectEnemyMove(MoveId.SPLASH, 1);
    await game.phaseInterceptor.to("BerryPhase");

    expect(game.scene.arena.getTagOnSide(ArenaTagType.FAIRY_LOCK, ArenaTagSide.PLAYER)).toBeDefined();
    expect(game.scene.arena.getTagOnSide(ArenaTagType.FAIRY_LOCK, ArenaTagSide.ENEMY)).toBeDefined();

    await game.toNextTurn();
    game.move.select(MoveId.SPLASH);
    game.move.select(MoveId.SPLASH);
    await game.move.selectEnemyMove(MoveId.WHIRLWIND, 0);
    game.doSelectPartyPokemon(2);
    await game.move.selectEnemyMove(MoveId.WHIRLWIND, 1);
    game.doSelectPartyPokemon(2);
    await game.phaseInterceptor.to("BerryPhase");
    await game.toNextTurn();

    expect(game.scene.getPlayerField()[0].species.speciesId).not.toBe(SpeciesId.KLEFKI);
    expect(game.scene.getPlayerField()[1].species.speciesId).not.toBe(SpeciesId.TYRUNT);
  });

  it("If a Pokemon faints and is replaced the replacement is also trapped", async () => {
    game.override.moveset([MoveId.FAIRY_LOCK, MoveId.SPLASH, MoveId.MEMENTO]);
    await game.classicMode.startBattle([SpeciesId.KLEFKI, SpeciesId.GUZZLORD, SpeciesId.TYRUNT, SpeciesId.ZYGARDE]);

    game.move.select(MoveId.FAIRY_LOCK);
    game.move.select(MoveId.MEMENTO, 1);
    game.doSelectPartyPokemon(2);
    await game.move.selectEnemyMove(MoveId.SPLASH, 1);
    await game.move.selectEnemyMove(MoveId.SPLASH, 1);
    await game.phaseInterceptor.to("BerryPhase");
    expect(game.scene.arena.getTagOnSide(ArenaTagType.FAIRY_LOCK, ArenaTagSide.PLAYER)).toBeDefined();
    expect(game.scene.arena.getTagOnSide(ArenaTagType.FAIRY_LOCK, ArenaTagSide.ENEMY)).toBeDefined();

    await game.toNextTurn();
    game.move.select(MoveId.SPLASH);
    game.move.select(MoveId.SPLASH);
    await game.move.selectEnemyMove(MoveId.SPLASH, 1);
    await game.move.selectEnemyMove(MoveId.SPLASH, 1);
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
