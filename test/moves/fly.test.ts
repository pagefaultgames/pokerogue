import { BattlerTagType } from "#enums/battler-tag-type";
import { StatusEffect } from "#enums/status-effect";
import { MoveResult } from "#app/field/pokemon";
import { Abilities } from "#enums/abilities";
import { Moves } from "#enums/moves";
import { Species } from "#enums/species";
import GameManager from "#test/testUtils/gameManager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, it, expect, vi } from "vitest";
import { BattlerIndex } from "#app/battle";
import { allMoves } from "#app/data/moves/move";

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
      .moveset(Moves.FLY)
      .battleStyle("single")
      .startingLevel(100)
      .enemySpecies(Species.SNORLAX)
      .enemyLevel(100)
      .enemyAbility(Abilities.BALL_FETCH)
      .enemyMoveset(Moves.TACKLE);

    vi.spyOn(allMoves[Moves.FLY], "accuracy", "get").mockReturnValue(100);
  });

  it("should make the user semi-invulnerable, then attack over 2 turns", async () => {
    await game.classicMode.startBattle([Species.MAGIKARP]);

    const playerPokemon = game.scene.getPlayerPokemon()!;
    const enemyPokemon = game.scene.getEnemyPokemon()!;

    game.move.select(Moves.FLY);

    await game.phaseInterceptor.to("TurnEndPhase");
    expect(playerPokemon.getTag(BattlerTagType.FLYING)).toBeDefined();
    expect(enemyPokemon.getLastXMoves(1)[0].result).toBe(MoveResult.MISS);
    expect(playerPokemon.hp).toBe(playerPokemon.getMaxHp());
    expect(enemyPokemon.hp).toBe(enemyPokemon.getMaxHp());
    expect(playerPokemon.getMoveQueue()[0].move).toBe(Moves.FLY);

    await game.phaseInterceptor.to("TurnEndPhase");
    expect(playerPokemon.getTag(BattlerTagType.FLYING)).toBeUndefined();
    expect(enemyPokemon.hp).toBeLessThan(enemyPokemon.getMaxHp());
    expect(playerPokemon.getMoveHistory()).toHaveLength(2);

    const playerFly = playerPokemon.getMoveset().find(mv => mv && mv.moveId === Moves.FLY);
    expect(playerFly?.ppUsed).toBe(1);
  });

  it("should not allow the user to evade attacks from Pokemon with No Guard", async () => {
    game.override.enemyAbility(Abilities.NO_GUARD);

    await game.classicMode.startBattle([Species.MAGIKARP]);

    const playerPokemon = game.scene.getPlayerPokemon()!;
    const enemyPokemon = game.scene.getEnemyPokemon()!;

    game.move.select(Moves.FLY);

    await game.phaseInterceptor.to("TurnEndPhase");
    expect(playerPokemon.hp).toBeLessThan(playerPokemon.getMaxHp());
    expect(enemyPokemon.getLastXMoves(1)[0].result).toBe(MoveResult.SUCCESS);
  });

  it("should not expend PP when the attack phase is cancelled", async () => {
    game.override.enemyAbility(Abilities.NO_GUARD).enemyMoveset(Moves.SPORE);

    await game.classicMode.startBattle([Species.MAGIKARP]);

    const playerPokemon = game.scene.getPlayerPokemon()!;

    game.move.select(Moves.FLY);

    await game.phaseInterceptor.to("TurnEndPhase");
    expect(playerPokemon.getTag(BattlerTagType.FLYING)).toBeUndefined();
    expect(playerPokemon.status?.effect).toBe(StatusEffect.SLEEP);

    const playerFly = playerPokemon.getMoveset().find(mv => mv && mv.moveId === Moves.FLY);
    expect(playerFly?.ppUsed).toBe(0);
  });

  it("should be cancelled when another Pokemon uses Gravity", async () => {
    game.override.enemyMoveset([Moves.SPLASH, Moves.GRAVITY]);

    await game.classicMode.startBattle([Species.MAGIKARP]);

    const playerPokemon = game.scene.getPlayerPokemon()!;
    const enemyPokemon = game.scene.getEnemyPokemon()!;

    game.move.select(Moves.FLY);

    await game.forceEnemyMove(Moves.SPLASH);

    await game.toNextTurn();
    await game.forceEnemyMove(Moves.GRAVITY);
    await game.setTurnOrder([BattlerIndex.ENEMY, BattlerIndex.PLAYER]);

    await game.phaseInterceptor.to("TurnEndPhase");
    expect(playerPokemon.getLastXMoves(1)[0].result).toBe(MoveResult.FAIL);
    expect(enemyPokemon.hp).toBe(enemyPokemon.getMaxHp());

    const playerFly = playerPokemon.getMoveset().find(mv => mv && mv.moveId === Moves.FLY);
    expect(playerFly?.ppUsed).toBe(0);
  });
});
