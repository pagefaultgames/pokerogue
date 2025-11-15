import { allMoves } from "#data/data-lists";
import { AbilityId } from "#enums/ability-id";
import { BattlerIndex } from "#enums/battler-index";
import { MoveId } from "#enums/move-id";
import { SpeciesId } from "#enums/species-id";
import { StatusEffect } from "#enums/status-effect";
import type { Move } from "#moves/move";
import { GameManager } from "#test/test-utils/game-manager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it, type MockInstance, vi } from "vitest";

describe("Moves - Retaliate", () => {
  let phaserGame: Phaser.Game;
  let game: GameManager;

  let powerSpy: MockInstance<Move["calculateBattlePower"]>;

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
      .ability(AbilityId.NO_GUARD)
      .enemyAbility(AbilityId.BALL_FETCH)
      .enemyMoveset(MoveId.SPLASH)
      .criticalHits(false)
      .startingLevel(100)
      .enemyLevel(100);

    powerSpy = vi.spyOn(allMoves[MoveId.RETALIATE], "calculateBattlePower");
  });

  it("should double in power if an allied party member fainted last turn", async () => {
    await game.classicMode.startBattle([SpeciesId.FEEBAS, SpeciesId.MILOTIC]);

    const [feebas, milotic] = game.scene.getPlayerParty();

    game.move.use(MoveId.RETALIATE);
    await game.toNextTurn();

    expect(powerSpy).toHaveLastReturnedWith(70);

    game.move.use(MoveId.EXPLOSION);
    game.doSelectPartyPokemon(1);
    await game.toNextTurn();

    expect(feebas).toHaveFainted();
    expect(milotic.isOnField()).toBe(true);
    expect(game.scene.arena.playerFaintedLastTurn).toBe(true);

    game.move.use(MoveId.RETALIATE);
    await game.toEndOfTurn();

    // power doubled, counter was reset
    expect(powerSpy).toHaveLastReturnedWith(140);
    expect(game.scene.arena.playerFaintedLastTurn).toBe(false);
  });

  it("should not work for same-turn faints", async () => {
    game.override.battleStyle("double");
    await game.classicMode.startBattle([SpeciesId.FEEBAS, SpeciesId.MILOTIC]);

    game.move.use(MoveId.RETALIATE, BattlerIndex.PLAYER, BattlerIndex.ENEMY);
    game.move.use(MoveId.MEMENTO, BattlerIndex.PLAYER_2, BattlerIndex.ENEMY);
    await game.setTurnOrder([BattlerIndex.PLAYER_2, BattlerIndex.ENEMY, BattlerIndex.ENEMY_2, BattlerIndex.PLAYER]);
    await game.phaseInterceptor.to("FaintPhase");

    // milotic fainted this turn, but nobody did _last_ turn
    expect(game.scene.arena.playerFaintedLastTurn).toBe(false);
    expect(game.scene.arena.playerFaintedThisTurn).toBe(true);

    await game.toEndOfTurn();

    expect(powerSpy).toHaveLastReturnedWith(70);
  });

  it("should work for enemies", async () => {
    game.override.battleStyle("double");
    await game.classicMode.startBattle([SpeciesId.FEEBAS]);

    const karp2 = game.scene.getEnemyField()[1];

    game.move.use(MoveId.GUILLOTINE, BattlerIndex.PLAYER, BattlerIndex.ENEMY_2);
    await game.toNextTurn();

    expect(karp2).toHaveFainted();
    expect(game.scene.currentBattle.enemyFaintedLastTurn).toBe(true);

    game.move.use(MoveId.SPLASH);
    await game.move.forceEnemyMove(MoveId.RETALIATE);
    await game.toEndOfTurn();

    expect(powerSpy).toHaveLastReturnedWith(140);
  });

  it("should reset enemy counter on new wave start", async () => {
    await game.classicMode.startBattle([SpeciesId.FEEBAS]);

    game.move.use(MoveId.GUILLOTINE);
    await game.toEndOfTurn();

    expect(game.scene.currentBattle.enemyFaintedLastTurn).toBe(true);

    await game.toNextWave();

    expect(game.scene.currentBattle.enemyFaintedLastTurn).toBe(false);
  });

  it("should preserve tracker on new wave/reload for players", async () => {
    await game.classicMode.startBattle([SpeciesId.FEEBAS, SpeciesId.MILOTIC]);

    const feebas = game.field.getPlayerPokemon();
    feebas.hp = 1;
    feebas.doSetStatus(StatusEffect.TOXIC);

    game.move.use(MoveId.GUILLOTINE);
    game.doSelectModifier();
    game.doSelectPartyPokemon(1);
    await game.toNextTurn();

    expect(feebas).toHaveFainted();
    expect(game.scene.arena.playerFaintedLastTurn).toBe(true);

    await game.reload.reloadSession();

    expect(game.scene.arena.playerFaintedLastTurn).toBe(true);

    game.move.use(MoveId.RETALIATE);
    await game.toEndOfTurn();

    expect(powerSpy).toHaveLastReturnedWith(140);
  });
});
