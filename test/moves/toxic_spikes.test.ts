import type { ArenaTrapTag } from "#app/data/arena-tag";
import { ArenaTagSide } from "#enums/arena-tag-side";
import type { SessionSaveData } from "#app/system/game-data";
import { GameData } from "#app/system/game-data";
import { decrypt, encrypt } from "#app/utils/data";
import { AbilityId } from "#enums/ability-id";
import { ArenaTagType } from "#enums/arena-tag-type";
import { MoveId } from "#enums/move-id";
import { SpeciesId } from "#enums/species-id";
import { StatusEffect } from "#enums/status-effect";
import GameManager from "#test/testUtils/gameManager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";

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
      .battleStyle("single")
      .startingWave(5)
      .enemySpecies(SpeciesId.RATTATA)
      .enemyAbility(AbilityId.BALL_FETCH)
      .ability(AbilityId.BALL_FETCH)
      .enemyMoveset(MoveId.SPLASH)
      .moveset([MoveId.TOXIC_SPIKES, MoveId.SPLASH, MoveId.ROAR, MoveId.COURT_CHANGE]);
  });

  it("should not affect the opponent if they do not switch", async () => {
    await game.classicMode.runToSummon([SpeciesId.MIGHTYENA, SpeciesId.POOCHYENA]);

    const enemy = game.scene.getEnemyField()[0];

    game.move.select(MoveId.TOXIC_SPIKES);
    await game.phaseInterceptor.to("TurnEndPhase");
    game.move.select(MoveId.SPLASH);
    await game.phaseInterceptor.to("TurnEndPhase");
    game.doSwitchPokemon(1);
    await game.phaseInterceptor.to("TurnEndPhase");

    expect(enemy.hp).toBe(enemy.getMaxHp());
    expect(enemy.status?.effect).toBeUndefined();
  });

  it("should poison the opponent if they switch into 1 layer", async () => {
    await game.classicMode.runToSummon([SpeciesId.MIGHTYENA]);

    game.move.select(MoveId.TOXIC_SPIKES);
    await game.phaseInterceptor.to("TurnEndPhase");
    game.move.select(MoveId.ROAR);
    await game.phaseInterceptor.to("TurnEndPhase");

    const enemy = game.scene.getEnemyField()[0];

    expect(enemy.hp).toBeLessThan(enemy.getMaxHp());
    expect(enemy.status?.effect).toBe(StatusEffect.POISON);
  });

  it("should badly poison the opponent if they switch into 2 layers", async () => {
    await game.classicMode.runToSummon([SpeciesId.MIGHTYENA]);

    game.move.select(MoveId.TOXIC_SPIKES);
    await game.phaseInterceptor.to("TurnEndPhase");
    game.move.select(MoveId.TOXIC_SPIKES);
    await game.phaseInterceptor.to("TurnEndPhase");
    game.move.select(MoveId.ROAR);
    await game.phaseInterceptor.to("TurnEndPhase");

    const enemy = game.scene.getEnemyField()[0];
    expect(enemy.hp).toBeLessThan(enemy.getMaxHp());
    expect(enemy.status?.effect).toBe(StatusEffect.TOXIC);
  });

  it("should be removed if a grounded poison pokemon switches in", async () => {
    await game.classicMode.runToSummon([SpeciesId.MUK, SpeciesId.PIDGEY]);

    const muk = game.scene.getPlayerPokemon()!;

    game.move.select(MoveId.TOXIC_SPIKES);
    await game.toNextTurn();
    // also make sure the toxic spikes are removed even if the pokemon
    // that set them up is the one switching in (https://github.com/pagefaultgames/pokerogue/issues/935)
    game.move.select(MoveId.COURT_CHANGE);
    await game.toNextTurn();
    game.doSwitchPokemon(1);
    await game.toNextTurn();
    game.doSwitchPokemon(1);
    await game.toNextTurn();
    game.move.select(MoveId.SPLASH);
    await game.toNextTurn();

    expect(muk.isFullHp()).toBe(true);
    expect(muk.status?.effect).toBeUndefined();
    expect(game.scene.arena.tags.length).toBe(0);
  });

  it("shouldn't create multiple layers per use in doubles", async () => {
    await game.classicMode.runToSummon([SpeciesId.MIGHTYENA, SpeciesId.POOCHYENA]);

    game.move.select(MoveId.TOXIC_SPIKES);
    await game.phaseInterceptor.to("TurnEndPhase");

    const arenaTags = game.scene.arena.getTagOnSide(ArenaTagType.TOXIC_SPIKES, ArenaTagSide.ENEMY) as ArenaTrapTag;
    expect(arenaTags.tagType).toBe(ArenaTagType.TOXIC_SPIKES);
    expect(arenaTags.layers).toBe(1);
  });

  it("should persist through reload", async () => {
    game.override.startingWave(1);
    const gameData = new GameData();

    await game.classicMode.runToSummon([SpeciesId.MIGHTYENA]);

    game.move.select(MoveId.TOXIC_SPIKES);
    await game.phaseInterceptor.to("TurnEndPhase");
    game.move.select(MoveId.SPLASH);
    await game.doKillOpponents();
    await game.phaseInterceptor.to("BattleEndPhase");
    await game.toNextWave();

    const sessionData: SessionSaveData = gameData.getSessionSaveData();
    localStorage.setItem("sessionTestData", encrypt(JSON.stringify(sessionData), true));
    const recoveredData: SessionSaveData = gameData.parseSessionData(
      decrypt(localStorage.getItem("sessionTestData")!, true),
    );
    await gameData.loadSession(0, recoveredData);

    expect(sessionData.arena.tags).toEqual(recoveredData.arena.tags);
    localStorage.removeItem("sessionTestData");
  });
});
