import { ArenaTagSide, ArenaTrapTag } from "#app/data/arena-tag";
import { StatusEffect } from "#app/data/status-effect";
import { decrypt, encrypt, GameData, SessionSaveData } from "#app/system/game-data";
import { Abilities } from "#enums/abilities";
import { ArenaTagType } from "#enums/arena-tag-type";
import { Moves } from "#enums/moves";
import { Species } from "#enums/species";
import GameManager from "#test/utils/gameManager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";

const TIMEOUT = 20 * 1000;

describe("Moves - Toxic Spikes", () => {
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
      .battleType("single")
      .startingWave(5)
      .enemySpecies(Species.RATTATA)
      .enemyAbility(Abilities.BALL_FETCH)
      .ability(Abilities.BALL_FETCH)
      .enemyMoveset(Moves.SPLASH)
      .moveset([Moves.TOXIC_SPIKES, Moves.SPLASH, Moves.ROAR]);
  });

  it("should not affect the opponent if they do not switch", async() => {
    await game.classicMode.runToSummon([Species.MIGHTYENA, Species.POOCHYENA]);

    const enemy = game.scene.getEnemyField()[0];

    game.move.select(Moves.TOXIC_SPIKES);
    await game.phaseInterceptor.to("TurnEndPhase");
    game.move.select(Moves.SPLASH);
    await game.phaseInterceptor.to("TurnEndPhase");
    game.doSwitchPokemon(1);
    await game.phaseInterceptor.to("TurnEndPhase");

    expect(enemy.hp).toBe(enemy.getMaxHp());
    expect(enemy.status?.effect).toBeUndefined();
  }, TIMEOUT);

  it("should poison the opponent if they switch into 1 layer", async() => {
    await game.classicMode.runToSummon([Species.MIGHTYENA]);

    game.move.select(Moves.TOXIC_SPIKES);
    await game.phaseInterceptor.to("TurnEndPhase");
    game.move.select(Moves.ROAR);
    await game.phaseInterceptor.to("TurnEndPhase");

    const enemy = game.scene.getEnemyField()[0];

    expect(enemy.hp).toBeLessThan(enemy.getMaxHp());
    expect(enemy.status?.effect).toBe(StatusEffect.POISON);
  }, TIMEOUT);

  it("should badly poison the opponent if they switch into 2 layers", async() => {
    await game.classicMode.runToSummon([Species.MIGHTYENA]);

    game.move.select(Moves.TOXIC_SPIKES);
    await game.phaseInterceptor.to("TurnEndPhase");
    game.move.select(Moves.TOXIC_SPIKES);
    await game.phaseInterceptor.to("TurnEndPhase");
    game.move.select(Moves.ROAR);
    await game.phaseInterceptor.to("TurnEndPhase");

    const enemy = game.scene.getEnemyField()[0];
    expect(enemy.hp).toBeLessThan(enemy.getMaxHp());
    expect(enemy.status?.effect).toBe(StatusEffect.TOXIC);
  }, TIMEOUT);

  it("should be removed if a grounded poison pokemon switches in", async() => {
    game.override.enemySpecies(Species.GRIMER);
    await game.classicMode.runToSummon([Species.MIGHTYENA]);

    game.move.select(Moves.TOXIC_SPIKES);
    await game.phaseInterceptor.to("TurnEndPhase");
    game.move.select(Moves.TOXIC_SPIKES);
    await game.phaseInterceptor.to("TurnEndPhase");
    game.move.select(Moves.ROAR);
    await game.phaseInterceptor.to("TurnEndPhase");

    const enemy = game.scene.getEnemyField()[0];
    expect(enemy.hp).toBe(enemy.getMaxHp());
    expect(enemy.status?.effect).toBeUndefined();

    expect(game.scene.arena.tags.length).toBe(0);
  }, TIMEOUT);

  it("shouldn't create multiple layers per use in doubles", async() => {
    await game.classicMode.runToSummon([Species.MIGHTYENA, Species.POOCHYENA]);

    game.move.select(Moves.TOXIC_SPIKES);
    await game.phaseInterceptor.to("TurnEndPhase");

    const arenaTags = (game.scene.arena.getTagOnSide(ArenaTagType.TOXIC_SPIKES, ArenaTagSide.ENEMY) as ArenaTrapTag);
    expect(arenaTags.tagType).toBe(ArenaTagType.TOXIC_SPIKES);
    expect(arenaTags.layers).toBe(1);
  }, TIMEOUT);

  it("should persist through reload", async() => {
    game.override.startingWave(1);
    const scene = game.scene;
    const gameData = new GameData(scene);

    await game.classicMode.runToSummon([Species.MIGHTYENA]);

    game.move.select(Moves.TOXIC_SPIKES);
    await game.phaseInterceptor.to("TurnEndPhase");
    game.move.select(Moves.SPLASH);
    await game.doKillOpponents();
    await game.phaseInterceptor.to("BattleEndPhase");
    await game.toNextWave();

    const sessionData : SessionSaveData = gameData["getSessionSaveData"](game.scene);
    localStorage.setItem("sessionTestData", encrypt(JSON.stringify(sessionData), true));
    const recoveredData : SessionSaveData = gameData.parseSessionData(decrypt(localStorage.getItem("sessionTestData")!, true));
    gameData.loadSession(game.scene, 0, recoveredData);

    expect(sessionData.arena.tags).toEqual(recoveredData.arena.tags);
    localStorage.removeItem("sessionTestData");
  }, TIMEOUT);
});
