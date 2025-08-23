import { allMoves } from "#data/data-lists";
import { BattlerIndex } from "#enums/battler-index";
import { MoveId } from "#enums/move-id";
import { SpeciesId } from "#enums/species-id";
import { Stat } from "#enums/stat";
import type { Move } from "#moves/move";
import type { MoveEffectPhase } from "#phases/move-effect-phase";
import { GameManager } from "#test/test-utils/game-manager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

describe("Moves - Fusion Flare and Fusion Bolt", () => {
  let phaserGame: Phaser.Game;
  let game: GameManager;

  let fusionFlare: Move;
  let fusionBolt: Move;

  beforeAll(() => {
    phaserGame = new Phaser.Game({
      type: Phaser.HEADLESS,
    });
  });

  afterEach(() => {
    game.phaseInterceptor.restoreOg();
  });

  beforeEach(() => {
    fusionFlare = allMoves[MoveId.FUSION_FLARE];
    fusionBolt = allMoves[MoveId.FUSION_BOLT];
    game = new GameManager(phaserGame);
    game.override
      .moveset([fusionFlare.id, fusionBolt.id])
      .startingLevel(1)
      .enemySpecies(SpeciesId.RESHIRAM)
      .enemyMoveset(MoveId.REST)
      .battleStyle("double")
      .startingWave(97)
      .criticalHits(false);

    vi.spyOn(fusionFlare, "calculateBattlePower");
    vi.spyOn(fusionBolt, "calculateBattlePower");
  });

  it("FUSION_FLARE should double power of subsequent FUSION_BOLT", async () => {
    await game.classicMode.startBattle([SpeciesId.ZEKROM, SpeciesId.ZEKROM]);

    game.move.select(fusionFlare.id, 0, BattlerIndex.ENEMY);
    game.move.select(fusionBolt.id, 1, BattlerIndex.ENEMY);

    // Force user party to act before enemy party
    await game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.PLAYER_2, BattlerIndex.ENEMY, BattlerIndex.ENEMY_2]);

    await game.phaseInterceptor.to("MoveEffectPhase", false);
    expect((game.scene.phaseManager.getCurrentPhase() as MoveEffectPhase).move.id).toBe(fusionFlare.id);
    await game.phaseInterceptor.to("DamageAnimPhase", false);
    expect(fusionFlare.calculateBattlePower).toHaveLastReturnedWith(100);

    await game.phaseInterceptor.to("MoveEffectPhase", false);
    expect((game.scene.phaseManager.getCurrentPhase() as MoveEffectPhase).move.id).toBe(fusionBolt.id);
    await game.phaseInterceptor.to("DamageAnimPhase", false);
    expect(fusionBolt.calculateBattlePower).toHaveLastReturnedWith(200);
  });

  it("FUSION_BOLT should double power of subsequent FUSION_FLARE", async () => {
    await game.classicMode.startBattle([SpeciesId.ZEKROM, SpeciesId.ZEKROM]);

    game.move.select(fusionBolt.id, 0, BattlerIndex.ENEMY);
    game.move.select(fusionFlare.id, 1, BattlerIndex.ENEMY);

    // Force user party to act before enemy party
    await game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.PLAYER_2, BattlerIndex.ENEMY, BattlerIndex.ENEMY_2]);

    await game.phaseInterceptor.to("MoveEffectPhase", false);
    expect((game.scene.phaseManager.getCurrentPhase() as MoveEffectPhase).move.id).toBe(fusionBolt.id);
    await game.phaseInterceptor.to("DamageAnimPhase", false);
    expect(fusionBolt.calculateBattlePower).toHaveLastReturnedWith(100);

    await game.phaseInterceptor.to("MoveEffectPhase", false);
    expect((game.scene.phaseManager.getCurrentPhase() as MoveEffectPhase).move.id).toBe(fusionFlare.id);
    await game.phaseInterceptor.to("DamageAnimPhase", false);
    expect(fusionFlare.calculateBattlePower).toHaveLastReturnedWith(200);
  });

  it("FUSION_FLARE should double power of subsequent FUSION_BOLT if a move failed in between", async () => {
    await game.classicMode.startBattle([SpeciesId.ZEKROM, SpeciesId.ZEKROM]);

    game.move.select(fusionFlare.id, 0, BattlerIndex.PLAYER);
    game.move.select(fusionBolt.id, 1, BattlerIndex.PLAYER);

    // Force first enemy to act (and fail) in between party
    await game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.ENEMY_2, BattlerIndex.PLAYER_2, BattlerIndex.ENEMY]);

    await game.phaseInterceptor.to("MoveEffectPhase", false);
    expect((game.scene.phaseManager.getCurrentPhase() as MoveEffectPhase).move.id).toBe(fusionFlare.id);
    await game.phaseInterceptor.to("DamageAnimPhase", false);
    expect(fusionFlare.calculateBattlePower).toHaveLastReturnedWith(100);

    await game.phaseInterceptor.to("MoveEndPhase");

    // Skip enemy move; because the enemy is at full HP, Rest should fail
    await game.phaseInterceptor.to("MoveEndPhase");

    await game.phaseInterceptor.to("MoveEffectPhase", false);
    expect((game.scene.phaseManager.getCurrentPhase() as MoveEffectPhase).move.id).toBe(fusionBolt.id);
    await game.phaseInterceptor.to("DamageAnimPhase", false);
    expect(fusionBolt.calculateBattlePower).toHaveLastReturnedWith(200);
  });

  it("FUSION_FLARE should not double power of subsequent FUSION_BOLT if a move succeeded in between", async () => {
    game.override.enemyMoveset(MoveId.SPLASH);
    await game.classicMode.startBattle([SpeciesId.ZEKROM, SpeciesId.ZEKROM]);

    game.move.select(fusionFlare.id, 0, BattlerIndex.ENEMY);
    game.move.select(fusionBolt.id, 1, BattlerIndex.ENEMY);

    // Force first enemy to act in between party
    await game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.ENEMY_2, BattlerIndex.PLAYER_2, BattlerIndex.ENEMY]);

    await game.phaseInterceptor.to("MoveEffectPhase", false);
    expect((game.scene.phaseManager.getCurrentPhase() as MoveEffectPhase).move.id).toBe(fusionFlare.id);
    await game.phaseInterceptor.to("DamageAnimPhase", false);
    expect(fusionFlare.calculateBattlePower).toHaveLastReturnedWith(100);

    await game.phaseInterceptor.to("MoveEndPhase");
    // Skip enemy move
    await game.phaseInterceptor.to("MoveEndPhase");

    await game.phaseInterceptor.to("MoveEffectPhase", false);
    expect((game.scene.phaseManager.getCurrentPhase() as MoveEffectPhase).move.id).toBe(fusionBolt.id);
    await game.phaseInterceptor.to("DamageAnimPhase", false);
    expect(fusionBolt.calculateBattlePower).toHaveLastReturnedWith(100);
  });

  it("FUSION_FLARE should double power of subsequent FUSION_BOLT if moves are aimed at allies", async () => {
    await game.classicMode.startBattle([SpeciesId.ZEKROM, SpeciesId.RESHIRAM]);

    game.move.select(fusionBolt.id, 0, BattlerIndex.PLAYER_2);
    game.move.select(fusionFlare.id, 1, BattlerIndex.PLAYER);

    // Force user party to act before enemy party
    await game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.PLAYER_2, BattlerIndex.ENEMY, BattlerIndex.ENEMY_2]);

    await game.phaseInterceptor.to("MoveEffectPhase", false);
    expect((game.scene.phaseManager.getCurrentPhase() as MoveEffectPhase).move.id).toBe(fusionBolt.id);
    await game.phaseInterceptor.to("DamageAnimPhase", false);
    expect(fusionBolt.calculateBattlePower).toHaveLastReturnedWith(100);

    await game.phaseInterceptor.to("MoveEffectPhase", false);
    expect((game.scene.phaseManager.getCurrentPhase() as MoveEffectPhase).move.id).toBe(fusionFlare.id);
    await game.phaseInterceptor.to("DamageAnimPhase", false);
    expect(fusionFlare.calculateBattlePower).toHaveLastReturnedWith(200);
  });

  it("FUSION_FLARE and FUSION_BOLT alternating throughout turn should double power of subsequent moves", async () => {
    game.override.enemyMoveset(fusionFlare.id);
    await game.classicMode.startBattle([SpeciesId.ZEKROM, SpeciesId.ZEKROM]);

    const party = game.scene.getPlayerParty();
    const enemyParty = game.scene.getEnemyParty();

    // Get rid of any modifiers that may alter power
    game.scene.clearEnemyHeldItemModifiers();
    game.scene.clearEnemyModifiers();

    // Mock stats by replacing entries in copy with desired values for specific stats
    const stats = {
      enemy: [[...enemyParty[0].stats], [...enemyParty[1].stats]],
      player: [[...party[0].stats], [...party[1].stats]],
    };

    // Ensure survival by reducing enemy Sp. Atk and boosting party Sp. Def
    vi.spyOn(enemyParty[0], "stats", "get").mockReturnValue(
      stats.enemy[0].map((val, i) => (i === Stat.SPATK ? 1 : val)),
    );
    vi.spyOn(enemyParty[1], "stats", "get").mockReturnValue(
      stats.enemy[1].map((val, i) => (i === Stat.SPATK ? 1 : val)),
    );
    vi.spyOn(party[1], "stats", "get").mockReturnValue(stats.player[0].map((val, i) => (i === Stat.SPDEF ? 250 : val)));
    vi.spyOn(party[1], "stats", "get").mockReturnValue(stats.player[1].map((val, i) => (i === Stat.SPDEF ? 250 : val)));

    game.move.select(fusionBolt.id, 0, BattlerIndex.ENEMY);
    game.move.select(fusionBolt.id, 1, BattlerIndex.ENEMY);

    // Force first enemy to act in between party
    await game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.ENEMY_2, BattlerIndex.PLAYER_2, BattlerIndex.ENEMY]);

    await game.phaseInterceptor.to("MoveEffectPhase", false);
    expect((game.scene.phaseManager.getCurrentPhase() as MoveEffectPhase).move.id).toBe(fusionBolt.id);
    await game.phaseInterceptor.to("DamageAnimPhase", false);
    expect(fusionBolt.calculateBattlePower).toHaveLastReturnedWith(100);

    await game.phaseInterceptor.to("MoveEffectPhase", false);
    expect((game.scene.phaseManager.getCurrentPhase() as MoveEffectPhase).move.id).toBe(fusionFlare.id);
    await game.phaseInterceptor.to("DamageAnimPhase", false);
    expect(fusionFlare.calculateBattlePower).toHaveLastReturnedWith(200);

    await game.phaseInterceptor.to("MoveEffectPhase", false);
    expect((game.scene.phaseManager.getCurrentPhase() as MoveEffectPhase).move.id).toBe(fusionBolt.id);
    await game.phaseInterceptor.to("DamageAnimPhase", false);
    expect(fusionBolt.calculateBattlePower).toHaveLastReturnedWith(200);

    await game.phaseInterceptor.to("MoveEffectPhase", false);
    expect((game.scene.phaseManager.getCurrentPhase() as MoveEffectPhase).move.id).toBe(fusionFlare.id);
    await game.phaseInterceptor.to("DamageAnimPhase", false);
    expect(fusionFlare.calculateBattlePower).toHaveLastReturnedWith(200);
  });

  it("FUSION_FLARE and FUSION_BOLT alternating throughout turn should double power of subsequent moves if moves are aimed at allies", async () => {
    game.override.enemyMoveset(fusionFlare.id);
    await game.classicMode.startBattle([SpeciesId.ZEKROM, SpeciesId.ZEKROM]);

    const party = game.scene.getPlayerParty();
    const enemyParty = game.scene.getEnemyParty();

    // Get rid of any modifiers that may alter power
    game.scene.clearEnemyHeldItemModifiers();
    game.scene.clearEnemyModifiers();

    // Mock stats by replacing entries in copy with desired values for specific stats
    const stats = {
      enemy: [[...enemyParty[0].stats], [...enemyParty[1].stats]],
      player: [[...party[0].stats], [...party[1].stats]],
    };

    // Ensure survival by reducing enemy Sp. Atk and boosting party Sp. Def
    vi.spyOn(enemyParty[0], "stats", "get").mockReturnValue(
      stats.enemy[0].map((val, i) => (i === Stat.SPATK ? 1 : val)),
    );
    vi.spyOn(enemyParty[1], "stats", "get").mockReturnValue(
      stats.enemy[1].map((val, i) => (i === Stat.SPATK ? 1 : val)),
    );
    vi.spyOn(party[1], "stats", "get").mockReturnValue(stats.player[0].map((val, i) => (i === Stat.SPDEF ? 250 : val)));
    vi.spyOn(party[1], "stats", "get").mockReturnValue(stats.player[1].map((val, i) => (i === Stat.SPDEF ? 250 : val)));

    game.move.select(fusionBolt.id, 0, BattlerIndex.PLAYER_2);
    game.move.select(fusionBolt.id, 1, BattlerIndex.PLAYER);

    // Force first enemy to act in between party
    await game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.ENEMY_2, BattlerIndex.PLAYER_2, BattlerIndex.ENEMY]);

    await game.phaseInterceptor.to("MoveEffectPhase", false);
    expect((game.scene.phaseManager.getCurrentPhase() as MoveEffectPhase).move.id).toBe(fusionBolt.id);
    await game.phaseInterceptor.to("DamageAnimPhase", false);
    expect(fusionBolt.calculateBattlePower).toHaveLastReturnedWith(100);

    await game.phaseInterceptor.to("MoveEffectPhase", false);
    expect((game.scene.phaseManager.getCurrentPhase() as MoveEffectPhase).move.id).toBe(fusionFlare.id);
    await game.phaseInterceptor.to("DamageAnimPhase", false);
    expect(fusionFlare.calculateBattlePower).toHaveLastReturnedWith(200);

    await game.phaseInterceptor.to("MoveEffectPhase", false);
    expect((game.scene.phaseManager.getCurrentPhase() as MoveEffectPhase).move.id).toBe(fusionBolt.id);
    await game.phaseInterceptor.to("DamageAnimPhase", false);
    expect(fusionBolt.calculateBattlePower).toHaveLastReturnedWith(200);

    await game.phaseInterceptor.to("MoveEffectPhase", false);
    expect((game.scene.phaseManager.getCurrentPhase() as MoveEffectPhase).move.id).toBe(fusionFlare.id);
    await game.phaseInterceptor.to("DamageAnimPhase", false);
    expect(fusionFlare.calculateBattlePower).toHaveLastReturnedWith(200);
  });
});
