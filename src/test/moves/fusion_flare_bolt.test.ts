import { Stat } from "#enums/stat";
import { BattlerIndex } from "#app/battle";
import { allMoves } from "#app/data/move";
import { DamagePhase } from "#app/phases/damage-phase";
import { MoveEffectPhase } from "#app/phases/move-effect-phase";
import { MoveEndPhase } from "#app/phases/move-end-phase";
import { MovePhase } from "#app/phases/move-phase";
import { Moves } from "#enums/moves";
import { Species } from "#enums/species";
import GameManager from "#test/utils/gameManager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

describe("Moves - Fusion Flare and Fusion Bolt", () => {
  let phaserGame: Phaser.Game;
  let game: GameManager;

  const fusionFlare = allMoves[Moves.FUSION_FLARE];
  const fusionBolt = allMoves[Moves.FUSION_BOLT];

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
    game.override.moveset([fusionFlare.id, fusionBolt.id]);
    game.override.startingLevel(1);

    game.override.enemySpecies(Species.RESHIRAM);
    game.override.enemyMoveset([Moves.REST, Moves.REST, Moves.REST, Moves.REST]);

    game.override.battleType("double");
    game.override.startingWave(97);
    game.override.disableCrits();

    vi.spyOn(fusionFlare, "calculateBattlePower");
    vi.spyOn(fusionBolt, "calculateBattlePower");
  });

  it("FUSION_FLARE should double power of subsequent FUSION_BOLT", async () => {
    await game.startBattle([
      Species.ZEKROM,
      Species.ZEKROM
    ]);

    game.move.select(fusionFlare.id, 0, BattlerIndex.ENEMY);
    game.move.select(fusionBolt.id, 1, BattlerIndex.ENEMY);

    // Force user party to act before enemy party
    await game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.PLAYER_2, BattlerIndex.ENEMY, BattlerIndex.ENEMY_2]);

    await game.phaseInterceptor.to(MoveEffectPhase, false);
    expect((game.scene.getCurrentPhase() as MoveEffectPhase).move.moveId).toBe(fusionFlare.id);
    await game.phaseInterceptor.to(DamagePhase, false);
    expect(fusionFlare.calculateBattlePower).toHaveLastReturnedWith(100);

    await game.phaseInterceptor.to(MoveEffectPhase, false);
    expect((game.scene.getCurrentPhase() as MoveEffectPhase).move.moveId).toBe(fusionBolt.id);
    await game.phaseInterceptor.to(DamagePhase, false);
    expect(fusionBolt.calculateBattlePower).toHaveLastReturnedWith(200);
  }, 20000);

  it("FUSION_BOLT should double power of subsequent FUSION_FLARE", async () => {
    await game.startBattle([
      Species.ZEKROM,
      Species.ZEKROM
    ]);

    game.move.select(fusionBolt.id, 0, BattlerIndex.ENEMY);
    game.move.select(fusionFlare.id, 1, BattlerIndex.ENEMY);

    // Force user party to act before enemy party
    await game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.PLAYER_2, BattlerIndex.ENEMY, BattlerIndex.ENEMY_2]);

    await game.phaseInterceptor.to(MoveEffectPhase, false);
    expect((game.scene.getCurrentPhase() as MoveEffectPhase).move.moveId).toBe(fusionBolt.id);
    await game.phaseInterceptor.to(DamagePhase, false);
    expect(fusionBolt.calculateBattlePower).toHaveLastReturnedWith(100);

    await game.phaseInterceptor.to(MoveEffectPhase, false);
    expect((game.scene.getCurrentPhase() as MoveEffectPhase).move.moveId).toBe(fusionFlare.id);
    await game.phaseInterceptor.to(DamagePhase, false);
    expect(fusionFlare.calculateBattlePower).toHaveLastReturnedWith(200);
  }, 20000);

  it("FUSION_FLARE should double power of subsequent FUSION_BOLT if a move failed in between", async () => {
    await game.startBattle([
      Species.ZEKROM,
      Species.ZEKROM
    ]);

    game.move.select(fusionFlare.id, 0, BattlerIndex.PLAYER);
    game.move.select(fusionBolt.id, 1, BattlerIndex.PLAYER);

    // Force first enemy to act (and fail) in between party
    await game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.ENEMY_2, BattlerIndex.PLAYER_2, BattlerIndex.ENEMY]);

    await game.phaseInterceptor.to(MoveEffectPhase, false);
    expect((game.scene.getCurrentPhase() as MoveEffectPhase).move.moveId).toBe(fusionFlare.id);
    await game.phaseInterceptor.to(DamagePhase, false);
    expect(fusionFlare.calculateBattlePower).toHaveLastReturnedWith(100);

    await game.phaseInterceptor.to(MoveEndPhase);

    // Skip enemy move; because the enemy is at full HP, Rest should fail
    await game.phaseInterceptor.runFrom(MovePhase).to(MoveEndPhase);

    await game.phaseInterceptor.to(MoveEffectPhase, false);
    expect((game.scene.getCurrentPhase() as MoveEffectPhase).move.moveId).toBe(fusionBolt.id);
    await game.phaseInterceptor.to(DamagePhase, false);
    expect(fusionBolt.calculateBattlePower).toHaveLastReturnedWith(200);
  }, 20000);

  it("FUSION_FLARE should not double power of subsequent FUSION_BOLT if a move succeeded in between", async () => {
    game.override.enemyMoveset([Moves.SPLASH, Moves.SPLASH, Moves.SPLASH, Moves.SPLASH]);
    await game.startBattle([
      Species.ZEKROM,
      Species.ZEKROM
    ]);

    game.move.select(fusionFlare.id, 0, BattlerIndex.ENEMY);
    game.move.select(fusionBolt.id, 1, BattlerIndex.ENEMY);

    // Force first enemy to act in between party
    await game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.ENEMY_2, BattlerIndex.PLAYER_2, BattlerIndex.ENEMY]);

    await game.phaseInterceptor.to(MoveEffectPhase, false);
    expect((game.scene.getCurrentPhase() as MoveEffectPhase).move.moveId).toBe(fusionFlare.id);
    await game.phaseInterceptor.to(DamagePhase, false);
    expect(fusionFlare.calculateBattlePower).toHaveLastReturnedWith(100);

    await game.phaseInterceptor.to(MoveEndPhase);
    // Skip enemy move
    await game.phaseInterceptor.runFrom(MovePhase).to(MoveEndPhase);

    await game.phaseInterceptor.to(MoveEffectPhase, false);
    expect((game.scene.getCurrentPhase() as MoveEffectPhase).move.moveId).toBe(fusionBolt.id);
    await game.phaseInterceptor.to(DamagePhase, false);
    expect(fusionBolt.calculateBattlePower).toHaveLastReturnedWith(100);
  }, 20000);

  it("FUSION_FLARE should double power of subsequent FUSION_BOLT if moves are aimed at allies", async () => {
    await game.startBattle([
      Species.ZEKROM,
      Species.RESHIRAM
    ]);

    game.move.select(fusionBolt.id, 0, BattlerIndex.PLAYER_2);
    game.move.select(fusionFlare.id, 1, BattlerIndex.PLAYER);

    // Force user party to act before enemy party
    await game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.PLAYER_2, BattlerIndex.ENEMY, BattlerIndex.ENEMY_2]);

    await game.phaseInterceptor.to(MoveEffectPhase, false);
    expect((game.scene.getCurrentPhase() as MoveEffectPhase).move.moveId).toBe(fusionBolt.id);
    await game.phaseInterceptor.to(DamagePhase, false);
    expect(fusionBolt.calculateBattlePower).toHaveLastReturnedWith(100);

    await game.phaseInterceptor.to(MoveEffectPhase, false);
    expect((game.scene.getCurrentPhase() as MoveEffectPhase).move.moveId).toBe(fusionFlare.id);
    await game.phaseInterceptor.to(DamagePhase, false);
    expect(fusionFlare.calculateBattlePower).toHaveLastReturnedWith(200);
  }, 20000);

  it("FUSION_FLARE and FUSION_BOLT alternating throughout turn should double power of subsequent moves", async () => {
    game.override.enemyMoveset([fusionFlare.id, fusionFlare.id, fusionFlare.id, fusionFlare.id]);
    await game.startBattle([
      Species.ZEKROM,
      Species.ZEKROM
    ]);

    const party = game.scene.getParty();
    const enemyParty = game.scene.getEnemyParty();

    // Get rid of any modifiers that may alter power
    game.scene.clearEnemyHeldItemModifiers();
    game.scene.clearEnemyModifiers();

    // Mock stats by replacing entries in copy with desired values for specific stats
    const stats = {
      enemy: [
        [...enemyParty[0].stats],
        [...enemyParty[1].stats],
      ],
      player: [
        [...party[0].stats],
        [...party[1].stats],
      ]
    };

    // Ensure survival by reducing enemy Sp. Atk and boosting party Sp. Def
    vi.spyOn(enemyParty[0], "stats", "get").mockReturnValue(stats.enemy[0].map((val, i) => (i === Stat.SPATK ? 1 : val)));
    vi.spyOn(enemyParty[1], "stats", "get").mockReturnValue(stats.enemy[1].map((val, i) => (i === Stat.SPATK ? 1 : val)));
    vi.spyOn(party[1], "stats", "get").mockReturnValue(stats.player[0].map((val, i) => (i === Stat.SPDEF ? 250 : val)));
    vi.spyOn(party[1], "stats", "get").mockReturnValue(stats.player[1].map((val, i) => (i === Stat.SPDEF ? 250 : val)));

    game.move.select(fusionBolt.id, 0, BattlerIndex.ENEMY);
    game.move.select(fusionBolt.id, 1, BattlerIndex.ENEMY);

    // Force first enemy to act in between party
    await game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.ENEMY_2, BattlerIndex.PLAYER_2, BattlerIndex.ENEMY]);

    await game.phaseInterceptor.to(MoveEffectPhase, false);
    expect((game.scene.getCurrentPhase() as MoveEffectPhase).move.moveId).toBe(fusionBolt.id);
    await game.phaseInterceptor.to(DamagePhase, false);
    expect(fusionBolt.calculateBattlePower).toHaveLastReturnedWith(100);

    await game.phaseInterceptor.to(MoveEffectPhase, false);
    expect((game.scene.getCurrentPhase() as MoveEffectPhase).move.moveId).toBe(fusionFlare.id);
    await game.phaseInterceptor.to(DamagePhase, false);
    expect(fusionFlare.calculateBattlePower).toHaveLastReturnedWith(200);

    await game.phaseInterceptor.to(MoveEffectPhase, false);
    expect((game.scene.getCurrentPhase() as MoveEffectPhase).move.moveId).toBe(fusionBolt.id);
    await game.phaseInterceptor.to(DamagePhase, false);
    expect(fusionBolt.calculateBattlePower).toHaveLastReturnedWith(200);

    await game.phaseInterceptor.to(MoveEffectPhase, false);
    expect((game.scene.getCurrentPhase() as MoveEffectPhase).move.moveId).toBe(fusionFlare.id);
    await game.phaseInterceptor.to(DamagePhase, false);
    expect(fusionFlare.calculateBattlePower).toHaveLastReturnedWith(200);
  }, 20000);

  it("FUSION_FLARE and FUSION_BOLT alternating throughout turn should double power of subsequent moves if moves are aimed at allies", async () => {
    game.override.enemyMoveset([fusionFlare.id, fusionFlare.id, fusionFlare.id, fusionFlare.id]);
    await game.startBattle([
      Species.ZEKROM,
      Species.ZEKROM
    ]);

    const party = game.scene.getParty();
    const enemyParty = game.scene.getEnemyParty();

    // Get rid of any modifiers that may alter power
    game.scene.clearEnemyHeldItemModifiers();
    game.scene.clearEnemyModifiers();

    // Mock stats by replacing entries in copy with desired values for specific stats
    const stats = {
      enemy: [
        [...enemyParty[0].stats],
        [...enemyParty[1].stats],
      ],
      player: [
        [...party[0].stats],
        [...party[1].stats],
      ]
    };

    // Ensure survival by reducing enemy Sp. Atk and boosting party Sp. Def
    vi.spyOn(enemyParty[0], "stats", "get").mockReturnValue(stats.enemy[0].map((val, i) => (i === Stat.SPATK ? 1 : val)));
    vi.spyOn(enemyParty[1], "stats", "get").mockReturnValue(stats.enemy[1].map((val, i) => (i === Stat.SPATK ? 1 : val)));
    vi.spyOn(party[1], "stats", "get").mockReturnValue(stats.player[0].map((val, i) => (i === Stat.SPDEF ? 250 : val)));
    vi.spyOn(party[1], "stats", "get").mockReturnValue(stats.player[1].map((val, i) => (i === Stat.SPDEF ? 250 : val)));

    game.move.select(fusionBolt.id, 0, BattlerIndex.PLAYER_2);
    game.move.select(fusionBolt.id, 1, BattlerIndex.PLAYER);

    // Force first enemy to act in between party
    await game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.ENEMY_2, BattlerIndex.PLAYER_2, BattlerIndex.ENEMY]);

    await game.phaseInterceptor.to(MoveEffectPhase, false);
    expect((game.scene.getCurrentPhase() as MoveEffectPhase).move.moveId).toBe(fusionBolt.id);
    await game.phaseInterceptor.to(DamagePhase, false);
    expect(fusionBolt.calculateBattlePower).toHaveLastReturnedWith(100);

    await game.phaseInterceptor.to(MoveEffectPhase, false);
    expect((game.scene.getCurrentPhase() as MoveEffectPhase).move.moveId).toBe(fusionFlare.id);
    await game.phaseInterceptor.to(DamagePhase, false);
    expect(fusionFlare.calculateBattlePower).toHaveLastReturnedWith(200);

    await game.phaseInterceptor.to(MoveEffectPhase, false);
    expect((game.scene.getCurrentPhase() as MoveEffectPhase).move.moveId).toBe(fusionBolt.id);
    await game.phaseInterceptor.to(DamagePhase, false);
    expect(fusionBolt.calculateBattlePower).toHaveLastReturnedWith(200);

    await game.phaseInterceptor.to(MoveEffectPhase, false);
    expect((game.scene.getCurrentPhase() as MoveEffectPhase).move.moveId).toBe(fusionFlare.id);
    await game.phaseInterceptor.to(DamagePhase, false);
    expect(fusionFlare.calculateBattlePower).toHaveLastReturnedWith(200);
  }, 20000);
});
