import { BattlerIndex } from "#app/battle";
import { allMoves } from "#app/data/data-lists";
import { AbilityId } from "#enums/ability-id";
import { BattlerTagType } from "#enums/battler-tag-type";
import { MoveId } from "#enums/move-id";
import { SpeciesId } from "#enums/species-id";
import { StatusEffect } from "#enums/status-effect";
import { MoveResult } from "#app/field/pokemon";
import { describe, beforeAll, afterEach, beforeEach, it, expect } from "vitest";
import GameManager from "#test/testUtils/gameManager";

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
      .moveset(MoveId.DIG)
      .battleStyle("single")
      .startingLevel(100)
      .enemySpecies(SpeciesId.SNORLAX)
      .enemyLevel(100)
      .enemyAbility(AbilityId.BALL_FETCH)
      .enemyMoveset(MoveId.TACKLE);
  });

  it("should make the user semi-invulnerable, then attack over 2 turns", async () => {
    await game.classicMode.startBattle([SpeciesId.MAGIKARP]);

    const playerPokemon = game.scene.getPlayerPokemon()!;
    const enemyPokemon = game.scene.getEnemyPokemon()!;

    game.move.select(MoveId.DIG);

    await game.phaseInterceptor.to("TurnEndPhase");
    expect(playerPokemon.getTag(BattlerTagType.UNDERGROUND)).toBeDefined();
    expect(enemyPokemon.getLastXMoves(1)[0].result).toBe(MoveResult.MISS);
    expect(playerPokemon.hp).toBe(playerPokemon.getMaxHp());
    expect(enemyPokemon.hp).toBe(enemyPokemon.getMaxHp());
    expect(playerPokemon.getMoveQueue()[0].move).toBe(MoveId.DIG);

    await game.phaseInterceptor.to("TurnEndPhase");
    expect(playerPokemon.getTag(BattlerTagType.UNDERGROUND)).toBeUndefined();
    expect(enemyPokemon.hp).toBeLessThan(enemyPokemon.getMaxHp());
    expect(playerPokemon.getMoveHistory()).toHaveLength(2);

    const playerDig = playerPokemon.getMoveset().find(mv => mv && mv.moveId === MoveId.DIG);
    expect(playerDig?.ppUsed).toBe(1);
  });

  it("should not allow the user to evade attacks from Pokemon with No Guard", async () => {
    game.override.enemyAbility(AbilityId.NO_GUARD);

    await game.classicMode.startBattle([SpeciesId.MAGIKARP]);

    const playerPokemon = game.scene.getPlayerPokemon()!;
    const enemyPokemon = game.scene.getEnemyPokemon()!;

    game.move.select(MoveId.DIG);

    await game.phaseInterceptor.to("TurnEndPhase");
    expect(playerPokemon.hp).toBeLessThan(playerPokemon.getMaxHp());
    expect(enemyPokemon.getLastXMoves(1)[0].result).toBe(MoveResult.SUCCESS);
  });

  it("should not expend PP when the attack phase is cancelled", async () => {
    game.override.enemyAbility(AbilityId.NO_GUARD).enemyMoveset(MoveId.SPORE);

    await game.classicMode.startBattle([SpeciesId.MAGIKARP]);

    const playerPokemon = game.scene.getPlayerPokemon()!;

    game.move.select(MoveId.DIG);

    await game.phaseInterceptor.to("TurnEndPhase");
    expect(playerPokemon.getTag(BattlerTagType.UNDERGROUND)).toBeUndefined();
    expect(playerPokemon.status?.effect).toBe(StatusEffect.SLEEP);

    const playerDig = playerPokemon.getMoveset().find(mv => mv && mv.moveId === MoveId.DIG);
    expect(playerDig?.ppUsed).toBe(0);
  });

  it("should cause the user to take double damage from Earthquake", async () => {
    await game.classicMode.startBattle([SpeciesId.DONDOZO]);

    const playerPokemon = game.scene.getPlayerPokemon()!;
    const enemyPokemon = game.scene.getEnemyPokemon()!;

    const preDigEarthquakeDmg = playerPokemon.getAttackDamage({
      source: enemyPokemon,
      move: allMoves[MoveId.EARTHQUAKE],
    }).damage;

    game.move.select(MoveId.DIG);
    await game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.ENEMY]);

    await game.phaseInterceptor.to("MoveEffectPhase");

    const postDigEarthquakeDmg = playerPokemon.getAttackDamage({
      source: enemyPokemon,
      move: allMoves[MoveId.EARTHQUAKE],
    }).damage;
    // these hopefully get avoid rounding errors :shrug:
    expect(postDigEarthquakeDmg).toBeGreaterThanOrEqual(2 * preDigEarthquakeDmg);
    expect(postDigEarthquakeDmg).toBeLessThan(2 * (preDigEarthquakeDmg + 1));
  });
});
