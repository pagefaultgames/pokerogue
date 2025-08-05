import { allMoves } from "#data/data-lists";
import { AbilityId } from "#enums/ability-id";
import { ArenaTagType } from "#enums/arena-tag-type";
import { BattlerIndex } from "#enums/battler-index";
import { BattlerTagType } from "#enums/battler-tag-type";
import { MoveId } from "#enums/move-id";
import { SpeciesId } from "#enums/species-id";
import { GameManager } from "#test/test-utils/game-manager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

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
      .moveset([MoveId.TACKLE, MoveId.GRAVITY, MoveId.FISSURE])
      .ability(AbilityId.UNNERVE)
      .enemyAbility(AbilityId.BALL_FETCH)
      .enemySpecies(SpeciesId.SHUCKLE)
      .enemyMoveset(MoveId.SPLASH)
      .enemyLevel(5);
  });

  // Reference: https://bulbapedia.bulbagarden.net/wiki/Gravity_(move)

  it("non-OHKO move accuracy is multiplied by 1.67", async () => {
    const moveToCheck = allMoves[MoveId.TACKLE];

    vi.spyOn(moveToCheck, "calculateBattleAccuracy");

    // Setup Gravity on first turn
    await game.classicMode.startBattle([SpeciesId.PIKACHU]);
    game.move.select(MoveId.GRAVITY);
    await game.phaseInterceptor.to("TurnEndPhase");

    expect(game.scene.arena.getTag(ArenaTagType.GRAVITY)).toBeDefined();

    // Use non-OHKO move on second turn
    await game.toNextTurn();
    game.move.select(MoveId.TACKLE);
    await game.phaseInterceptor.to("MoveEffectPhase");

    expect(moveToCheck.calculateBattleAccuracy).toHaveLastReturnedWith(100 * 1.67);
  });

  it("OHKO move accuracy is not affected", async () => {
    /** See Fissure {@link https://bulbapedia.bulbagarden.net/wiki/Fissure_(move)} */
    const moveToCheck = allMoves[MoveId.FISSURE];

    vi.spyOn(moveToCheck, "calculateBattleAccuracy");

    // Setup Gravity on first turn
    await game.classicMode.startBattle([SpeciesId.PIKACHU]);
    game.move.select(MoveId.GRAVITY);
    await game.phaseInterceptor.to("TurnEndPhase");

    expect(game.scene.arena.getTag(ArenaTagType.GRAVITY)).toBeDefined();

    // Use OHKO move on second turn
    await game.toNextTurn();
    game.move.select(MoveId.FISSURE);
    await game.phaseInterceptor.to("MoveEffectPhase");

    expect(moveToCheck.calculateBattleAccuracy).toHaveLastReturnedWith(30);
  });

  describe("Against flying types", () => {
    it("can be hit by ground-type moves now", async () => {
      game.override.enemySpecies(SpeciesId.PIDGEOT).moveset([MoveId.GRAVITY, MoveId.EARTHQUAKE]);

      await game.classicMode.startBattle([SpeciesId.PIKACHU]);

      const pidgeot = game.field.getEnemyPokemon();
      vi.spyOn(pidgeot, "getAttackTypeEffectiveness");

      // Try earthquake on 1st turn (fails!);
      game.move.select(MoveId.EARTHQUAKE);
      await game.phaseInterceptor.to("TurnEndPhase");

      expect(pidgeot.getAttackTypeEffectiveness).toHaveLastReturnedWith(0);

      // Setup Gravity on 2nd turn
      await game.toNextTurn();
      game.move.select(MoveId.GRAVITY);
      await game.phaseInterceptor.to("TurnEndPhase");

      expect(game.scene.arena.getTag(ArenaTagType.GRAVITY)).toBeDefined();

      // Use ground move on 3rd turn
      await game.toNextTurn();
      game.move.select(MoveId.EARTHQUAKE);
      await game.phaseInterceptor.to("TurnEndPhase");

      expect(pidgeot.getAttackTypeEffectiveness).toHaveLastReturnedWith(1);
    });

    it("keeps super-effective moves super-effective after using gravity", async () => {
      game.override.enemySpecies(SpeciesId.PIDGEOT).moveset([MoveId.GRAVITY, MoveId.THUNDERBOLT]);

      await game.classicMode.startBattle([SpeciesId.PIKACHU]);

      const pidgeot = game.field.getEnemyPokemon();
      vi.spyOn(pidgeot, "getAttackTypeEffectiveness");

      // Setup Gravity on 1st turn
      game.move.select(MoveId.GRAVITY);
      await game.phaseInterceptor.to("TurnEndPhase");

      expect(game.scene.arena.getTag(ArenaTagType.GRAVITY)).toBeDefined();

      // Use electric move on 2nd turn
      await game.toNextTurn();
      game.move.select(MoveId.THUNDERBOLT);
      await game.phaseInterceptor.to("TurnEndPhase");

      expect(pidgeot.getAttackTypeEffectiveness).toHaveLastReturnedWith(2);
    });
  });

  it("cancels Fly if its user is semi-invulnerable", async () => {
    game.override.enemySpecies(SpeciesId.SNORLAX).enemyMoveset(MoveId.FLY).moveset([MoveId.GRAVITY, MoveId.SPLASH]);

    await game.classicMode.startBattle([SpeciesId.CHARIZARD]);

    const charizard = game.field.getPlayerPokemon();
    const snorlax = game.field.getEnemyPokemon();

    game.move.select(MoveId.SPLASH);

    await game.toNextTurn();
    expect(snorlax.getTag(BattlerTagType.FLYING)).toBeDefined();

    game.move.select(MoveId.GRAVITY);
    await game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.ENEMY]);

    await game.phaseInterceptor.to("MoveEffectPhase");
    expect(snorlax.getTag(BattlerTagType.INTERRUPTED)).toBeDefined();

    await game.phaseInterceptor.to("TurnEndPhase");
    expect(charizard.hp).toBe(charizard.getMaxHp());
  });
});
