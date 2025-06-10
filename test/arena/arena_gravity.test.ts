import { BattlerIndex } from "#enums/battler-index";
import { allMoves } from "#app/data/data-lists";
import { AbilityId } from "#enums/ability-id";
import { ArenaTagType } from "#enums/arena-tag-type";
import { BattlerTagType } from "#enums/battler-tag-type";
import { MoveId } from "#enums/move-id";
import { SpeciesId } from "#enums/species-id";
import GameManager from "#test/testUtils/gameManager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { StatusEffect } from "#enums/status-effect";
import { MoveResult } from "#enums/move-result";

describe("Arena - Gravity", () => {
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
      .ability(AbilityId.UNNERVE)
      .enemyAbility(AbilityId.BALL_FETCH)
      .enemySpecies(SpeciesId.MAGIKARP)
      .enemyLevel(5);
  });

  // Reference: https://bulbapedia.bulbagarden.net/wiki/Gravity_(move)

  it("should multiply all non-OHKO move accuracy by 1.67x", async () => {
    const accSpy = vi.spyOn(allMoves[MoveId.TACKLE], "calculateBattleAccuracy");
    await game.classicMode.startBattle([SpeciesId.PIKACHU]);

    game.move.use(MoveId.GRAVITY);
    await game.move.forceEnemyMove(MoveId.TACKLE);
    await game.toEndOfTurn();

    expect(game.scene.arena.getTag(ArenaTagType.GRAVITY)).toBeDefined();
    expect(accSpy).toHaveLastReturnedWith(allMoves[MoveId.TACKLE].accuracy * 1.67);
  });

  it("should not affect OHKO move accuracy", async () => {
    const accSpy = vi.spyOn(allMoves[MoveId.FISSURE], "calculateBattleAccuracy");
    await game.classicMode.startBattle([SpeciesId.PIKACHU]);

    game.move.use(MoveId.GRAVITY);
    await game.move.forceEnemyMove(MoveId.FISSURE);
    await game.toEndOfTurn();

    expect(game.scene.arena.getTag(ArenaTagType.GRAVITY)).toBeDefined();
    expect(accSpy).toHaveLastReturnedWith(allMoves[MoveId.FISSURE].accuracy);
  });

  describe.each<{ name: string; overrides: () => unknown }>([
    { name: "Flying-type", overrides: () => game.override.enemySpecies(SpeciesId.MOLTRES) },
    { name: "Levitating", overrides: () => game.override.enemyAbility(AbilityId.LEVITATE) },
  ])("should ground $name Pokemon", ({ overrides }) => {
    beforeEach(overrides);

    it("should remove immunity to Ground-type moves", async () => {
      await game.classicMode.startBattle([SpeciesId.PIKACHU]);

      const enemy = game.field.getEnemyPokemon();
      const effectivenessSpy = vi.spyOn(enemy, "getAttackTypeEffectiveness");

      game.move.use(MoveId.EARTHQUAKE);
      await game.move.forceEnemyMove(MoveId.GRAVITY);
      await game.setTurnOrder([BattlerIndex.ENEMY, BattlerIndex.PLAYER]);
      await game.toNextTurn();

      expect(game.scene.arena.getTag(ArenaTagType.GRAVITY)).toBeDefined();
      expect(effectivenessSpy).toHaveLastReturnedWith(2);
      expect(enemy.isGrounded()).toBe(true);
    });

    it("should preserve normal move effectiveness for secondary type", async () => {
      await game.classicMode.startBattle([SpeciesId.PIKACHU]);

      const enemy = game.field.getEnemyPokemon();
      const effectivenessSpy = vi.spyOn(enemy, "getAttackTypeEffectiveness");

      game.move.use(MoveId.THUNDERBOLT);
      await game.move.forceEnemyMove(MoveId.GRAVITY);
      await game.setTurnOrder([BattlerIndex.ENEMY, BattlerIndex.PLAYER]);
      await game.toEndOfTurn();

      expect(effectivenessSpy).toHaveLastReturnedWith(2);
    });

    it("causes terrain to come into effect", async () => {
      await game.classicMode.startBattle([SpeciesId.PIKACHU]);

      const enemy = game.field.getEnemyPokemon();
      enemy.hp = 1;
      const statusSpy = vi.spyOn(enemy, "canSetStatus");

      // Turn 1: set up electric terrain; spore works due to being ungrounded
      game.move.use(MoveId.SPORE);
      await game.move.forceEnemyMove(MoveId.ELECTRIC_TERRAIN);
      await game.setTurnOrder([BattlerIndex.ENEMY, BattlerIndex.PLAYER]);
      await game.toNextTurn();

      expect(statusSpy).toHaveLastReturnedWith(true);
      expect(enemy.status?.effect).toBe(StatusEffect.SLEEP);

      enemy.resetStatus();

      // Turn 2: gravity grounds enemy; makes spore fail
      game.move.use(MoveId.SPORE);
      await game.move.forceEnemyMove(MoveId.GRAVITY);
      await game.setTurnOrder([BattlerIndex.ENEMY, BattlerIndex.PLAYER]);
      await game.toNextTurn();

      expect(statusSpy).toHaveLastReturnedWith(true);
      expect(enemy.status?.effect).toBeUndefined();
    });
  });

  it.each<{ name: string; move: MoveId }>([
    { name: "Fly", move: MoveId.FLY },
    { name: "Bounce", move: MoveId.BOUNCE },
    { name: "Sky Drop", move: MoveId.SKY_DROP },
  ])("cancels $name if its user is semi-invulnerable", async ({ move }) => {
    await game.classicMode.startBattle([SpeciesId.CHARIZARD]);

    const charizard = game.field.getPlayerPokemon();
    const snorlax = game.field.getEnemyPokemon();

    game.move.use(MoveId.SPLASH);
    await game.move.forceEnemyMove(move);
    await game.toNextTurn();

    expect(snorlax.getTag(BattlerTagType.FLYING)).toBeDefined();

    game.move.select(MoveId.GRAVITY);
    await game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.ENEMY]);
    await game.phaseInterceptor.to("MoveEffectPhase");

    expect(snorlax.getTag(BattlerTagType.INTERRUPTED)).toBeDefined();

    await game.toEndOfTurn();

    expect(charizard.hp).toBe(charizard.getMaxHp());
    expect(snorlax.getTag(BattlerTagType.FLYING)).toBeUndefined();
    expect(snorlax.getLastXMoves()[0].result).toBe(MoveResult.FAIL);
  });
});
