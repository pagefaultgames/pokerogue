import { allMoves } from "#data/data-lists";
import { AbilityId } from "#enums/ability-id";
import { BattlerIndex } from "#enums/battler-index";
import { BattlerTagType } from "#enums/battler-tag-type";
import { MoveId } from "#enums/move-id";
import { MoveResult } from "#enums/move-result";
import { SpeciesId } from "#enums/species-id";
import { StatusEffect } from "#enums/status-effect";
import { GameManager } from "#test/test-utils/game-manager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

describe("Moves - Fly", () => {
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
      .moveset(MoveId.FLY)
      .battleStyle("single")
      .startingLevel(100)
      .enemySpecies(SpeciesId.SNORLAX)
      .enemyLevel(100)
      .enemyAbility(AbilityId.BALL_FETCH)
      .enemyMoveset(MoveId.TACKLE);

    vi.spyOn(allMoves[MoveId.FLY], "accuracy", "get").mockReturnValue(100);
  });

  it("should make the user semi-invulnerable, then attack over 2 turns", async () => {
    await game.classicMode.startBattle([SpeciesId.MAGIKARP]);

    const playerPokemon = game.field.getPlayerPokemon();
    const enemyPokemon = game.field.getEnemyPokemon();

    game.move.select(MoveId.FLY);

    await game.phaseInterceptor.to("TurnEndPhase");
    expect(playerPokemon.getTag(BattlerTagType.FLYING)).toBeDefined();
    expect(enemyPokemon.getLastXMoves(1)[0].result).toBe(MoveResult.MISS);
    expect(playerPokemon.hp).toBe(playerPokemon.getMaxHp());
    expect(enemyPokemon.hp).toBe(enemyPokemon.getMaxHp());
    expect(playerPokemon.getMoveQueue()[0].move).toBe(MoveId.FLY);

    await game.phaseInterceptor.to("TurnEndPhase");
    expect(playerPokemon.getTag(BattlerTagType.FLYING)).toBeUndefined();
    expect(enemyPokemon.hp).toBeLessThan(enemyPokemon.getMaxHp());
    expect(playerPokemon.getMoveHistory()).toHaveLength(2);

    const playerFly = playerPokemon.getMoveset().find(mv => mv && mv.moveId === MoveId.FLY);
    expect(playerFly?.ppUsed).toBe(1);
  });

  it("should not allow the user to evade attacks from Pokemon with No Guard", async () => {
    game.override.enemyAbility(AbilityId.NO_GUARD);

    await game.classicMode.startBattle([SpeciesId.MAGIKARP]);

    const playerPokemon = game.field.getPlayerPokemon();
    const enemyPokemon = game.field.getEnemyPokemon();

    game.move.select(MoveId.FLY);

    await game.phaseInterceptor.to("TurnEndPhase");
    expect(playerPokemon.hp).toBeLessThan(playerPokemon.getMaxHp());
    expect(enemyPokemon.getLastXMoves(1)[0].result).toBe(MoveResult.SUCCESS);
  });

  it("should not expend PP when the attack phase is cancelled", async () => {
    game.override.enemyAbility(AbilityId.NO_GUARD).enemyMoveset(MoveId.SPORE);

    await game.classicMode.startBattle([SpeciesId.MAGIKARP]);

    const playerPokemon = game.field.getPlayerPokemon();

    game.move.select(MoveId.FLY);

    await game.phaseInterceptor.to("TurnEndPhase");
    expect(playerPokemon.getTag(BattlerTagType.FLYING)).toBeUndefined();
    expect(playerPokemon.status?.effect).toBe(StatusEffect.SLEEP);

    const playerFly = playerPokemon.getMoveset().find(mv => mv && mv.moveId === MoveId.FLY);
    expect(playerFly?.ppUsed).toBe(0);
  });

  it("should be cancelled when another Pokemon uses Gravity", async () => {
    game.override.enemyMoveset([MoveId.SPLASH, MoveId.GRAVITY]);

    await game.classicMode.startBattle([SpeciesId.MAGIKARP]);

    const playerPokemon = game.field.getPlayerPokemon();
    const enemyPokemon = game.field.getEnemyPokemon();

    game.move.select(MoveId.FLY);

    await game.move.selectEnemyMove(MoveId.SPLASH);

    await game.toNextTurn();
    await game.move.selectEnemyMove(MoveId.GRAVITY);
    await game.setTurnOrder([BattlerIndex.ENEMY, BattlerIndex.PLAYER]);

    await game.phaseInterceptor.to("TurnEndPhase");
    expect(playerPokemon.getLastXMoves(1)[0].result).toBe(MoveResult.FAIL);
    expect(enemyPokemon.hp).toBe(enemyPokemon.getMaxHp());

    const playerFly = playerPokemon.getMoveset().find(mv => mv && mv.moveId === MoveId.FLY);
    expect(playerFly?.ppUsed).toBe(0);
  });
});
