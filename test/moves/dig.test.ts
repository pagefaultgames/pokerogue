import { BattlerIndex } from "#app/battle";
import { allMoves } from "#app/data/move";
import { Abilities } from "#enums/abilities";
import { BattlerTagType } from "#enums/battler-tag-type";
import { Moves } from "#enums/moves";
import { Species } from "#enums/species";
import { StatusEffect } from "#enums/status-effect";
import { MoveResult } from "#app/field/pokemon";
import { describe, beforeAll, afterEach, beforeEach, it, expect } from "vitest";
import GameManager from "#test/utils/gameManager";

describe("Moves - Dig", () => {
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
      .moveset(Moves.DIG)
      .battleType("single")
      .startingLevel(100)
      .enemySpecies(Species.SNORLAX)
      .enemyLevel(100)
      .enemyAbility(Abilities.BALL_FETCH)
      .enemyMoveset(Moves.TACKLE);
  });

  it("should make the user semi-invulnerable, then attack over 2 turns", async () => {
    await game.classicMode.startBattle([ Species.MAGIKARP ]);

    const playerPokemon = game.scene.getPlayerPokemon()!;
    const enemyPokemon = game.scene.getEnemyPokemon()!;

    game.move.select(Moves.DIG);

    await game.phaseInterceptor.to("TurnEndPhase");
    expect(playerPokemon.getTag(BattlerTagType.UNDERGROUND)).toBeDefined();
    expect(enemyPokemon.getLastXMoves(1)[0].result).toBe(MoveResult.MISS);
    expect(playerPokemon.hp).toBe(playerPokemon.getMaxHp());
    expect(enemyPokemon.hp).toBe(enemyPokemon.getMaxHp());
    expect(playerPokemon.getMoveQueue()[0].move).toBe(Moves.DIG);

    await game.phaseInterceptor.to("TurnEndPhase");
    expect(playerPokemon.getTag(BattlerTagType.UNDERGROUND)).toBeUndefined();
    expect(enemyPokemon.hp).toBeLessThan(enemyPokemon.getMaxHp());
    expect(playerPokemon.getMoveHistory()).toHaveLength(2);

    const playerDig = playerPokemon.getMoveset().find(mv => mv && mv.moveId === Moves.DIG);
    expect(playerDig?.ppUsed).toBe(1);
  });

  it("should not allow the user to evade attacks from Pokemon with No Guard", async () => {
    game.override.enemyAbility(Abilities.NO_GUARD);

    await game.classicMode.startBattle([ Species.MAGIKARP ]);

    const playerPokemon = game.scene.getPlayerPokemon()!;
    const enemyPokemon = game.scene.getEnemyPokemon()!;

    game.move.select(Moves.DIG);

    await game.phaseInterceptor.to("TurnEndPhase");
    expect(playerPokemon.hp).toBeLessThan(playerPokemon.getMaxHp());
    expect(enemyPokemon.getLastXMoves(1)[0].result).toBe(MoveResult.SUCCESS);
  });

  it("should not expend PP when the attack phase is cancelled", async () => {
    game.override
      .enemyAbility(Abilities.NO_GUARD)
      .enemyMoveset(Moves.SPORE);

    await game.classicMode.startBattle([ Species.MAGIKARP ]);

    const playerPokemon = game.scene.getPlayerPokemon()!;

    game.move.select(Moves.DIG);

    await game.phaseInterceptor.to("TurnEndPhase");
    expect(playerPokemon.getTag(BattlerTagType.UNDERGROUND)).toBeUndefined();
    expect(playerPokemon.status?.effect).toBe(StatusEffect.SLEEP);

    const playerDig = playerPokemon.getMoveset().find(mv => mv && mv.moveId === Moves.DIG);
    expect(playerDig?.ppUsed).toBe(0);
  });

  it("should cause the user to take double damage from Earthquake", async () => {
    await game.classicMode.startBattle([ Species.DONDOZO ]);

    const playerPokemon = game.scene.getPlayerPokemon()!;
    const enemyPokemon = game.scene.getEnemyPokemon()!;

    const preDigEarthquakeDmg = playerPokemon.getAttackDamage(enemyPokemon, allMoves[Moves.EARTHQUAKE]).damage;

    game.move.select(Moves.DIG);
    await game.setTurnOrder([ BattlerIndex.PLAYER, BattlerIndex.ENEMY ]);

    await game.phaseInterceptor.to("MoveEffectPhase");

    const postDigEarthquakeDmg = playerPokemon.getAttackDamage(enemyPokemon, allMoves[Moves.EARTHQUAKE]).damage;
    // these hopefully get avoid rounding errors :shrug:
    expect(postDigEarthquakeDmg).toBeGreaterThanOrEqual(2 * preDigEarthquakeDmg);
    expect(postDigEarthquakeDmg).toBeLessThan(2 * (preDigEarthquakeDmg + 1));
  });
});
