import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import Phaser from "phaser";
import GameManager from "#app/test/utils/gameManager";
import overrides from "#app/overrides";
import { MoveEffectPhase, MovePhase, MoveEndPhase, TurnStartPhase, DamagePhase } from "#app/phases";
import { getMovePosition } from "#app/test/utils/gameManagerUtils";
import { Stat } from "#app/data/pokemon-stat";
import { allMoves } from "#app/data/move";
import { BattlerIndex } from "#app/battle";
import { Species } from "#enums/species";
import { Moves } from "#enums/moves";

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
    vi.spyOn(overrides, "MOVESET_OVERRIDE", "get").mockReturnValue([ fusionFlare.id, fusionBolt.id ]);
    vi.spyOn(overrides, "STARTING_LEVEL_OVERRIDE", "get").mockReturnValue(1);

    vi.spyOn(overrides, "OPP_SPECIES_OVERRIDE", "get").mockReturnValue(Species.RESHIRAM);
    vi.spyOn(overrides, "OPP_MOVESET_OVERRIDE", "get").mockReturnValue([ Moves.REST, Moves.REST, Moves.REST, Moves.REST ]);

    vi.spyOn(overrides, "BATTLE_TYPE_OVERRIDE", "get").mockReturnValue("double");
    vi.spyOn(overrides, "STARTING_WAVE_OVERRIDE", "get").mockReturnValue(97);
    vi.spyOn(overrides, "NEVER_CRIT_OVERRIDE", "get").mockReturnValue(true);

    vi.spyOn(fusionFlare, "calculateBattlePower");
    vi.spyOn(fusionBolt, "calculateBattlePower");
  });

  it("FUSION_FLARE should double power of subsequent FUSION_BOLT", async() => {
    await game.startBattle([
      Species.ZEKROM,
      Species.ZEKROM
    ]);

    game.doAttack(getMovePosition(game.scene, 0, fusionFlare.id));
    game.doSelectTarget(BattlerIndex.ENEMY);

    game.doAttack(getMovePosition(game.scene, 0, fusionBolt.id));
    game.doSelectTarget(BattlerIndex.ENEMY);

    await game.phaseInterceptor.to(TurnStartPhase, false);

    // Force user party to act before enemy party
    vi.spyOn(game.scene.getCurrentPhase() as TurnStartPhase, "getOrder").mockReturnValue([ BattlerIndex.PLAYER, BattlerIndex.PLAYER_2, BattlerIndex.ENEMY, BattlerIndex.ENEMY_2 ]);

    await game.phaseInterceptor.to(MoveEffectPhase, false);
    expect((game.scene.getCurrentPhase() as MoveEffectPhase).move.moveId).toBe(fusionFlare.id);
    await game.phaseInterceptor.to(DamagePhase, false);
    expect(fusionFlare.calculateBattlePower).toHaveLastReturnedWith(100);

    await game.phaseInterceptor.to(MoveEffectPhase, false);
    expect((game.scene.getCurrentPhase() as MoveEffectPhase).move.moveId).toBe(fusionBolt.id);
    await game.phaseInterceptor.to(DamagePhase, false);
    expect(fusionBolt.calculateBattlePower).toHaveLastReturnedWith(200);
  }, 20000);

  it("FUSION_BOLT should double power of subsequent FUSION_FLARE", async() => {
    await game.startBattle([
      Species.ZEKROM,
      Species.ZEKROM
    ]);

    game.doAttack(getMovePosition(game.scene, 0, fusionBolt.id));
    game.doSelectTarget(BattlerIndex.ENEMY);

    game.doAttack(getMovePosition(game.scene, 0, fusionFlare.id));
    game.doSelectTarget(BattlerIndex.ENEMY);

    await game.phaseInterceptor.to(TurnStartPhase, false);

    // Force user party to act before enemy party
    vi.spyOn(game.scene.getCurrentPhase() as TurnStartPhase, "getOrder").mockReturnValue([ BattlerIndex.PLAYER, BattlerIndex.PLAYER_2, BattlerIndex.ENEMY, BattlerIndex.ENEMY_2 ]);

    await game.phaseInterceptor.to(MoveEffectPhase, false);
    expect((game.scene.getCurrentPhase() as MoveEffectPhase).move.moveId).toBe(fusionBolt.id);
    await game.phaseInterceptor.to(DamagePhase, false);
    expect(fusionBolt.calculateBattlePower).toHaveLastReturnedWith(100);

    await game.phaseInterceptor.to(MoveEffectPhase, false);
    expect((game.scene.getCurrentPhase() as MoveEffectPhase).move.moveId).toBe(fusionFlare.id);
    await game.phaseInterceptor.to(DamagePhase, false);
    expect(fusionFlare.calculateBattlePower).toHaveLastReturnedWith(200);
  }, 20000);

  it("FUSION_FLARE should double power of subsequent FUSION_BOLT if a move failed in between", async() => {
    await game.startBattle([
      Species.ZEKROM,
      Species.ZEKROM
    ]);

    game.doAttack(getMovePosition(game.scene, 0, fusionFlare.id));
    game.doSelectTarget(0);

    game.doAttack(getMovePosition(game.scene, 0, fusionBolt.id));
    game.doSelectTarget(0);

    await game.phaseInterceptor.to(TurnStartPhase, false);

    // Force first enemy to act (and fail) in between party
    vi.spyOn(game.scene.getCurrentPhase() as TurnStartPhase, "getOrder").mockReturnValue([ BattlerIndex.PLAYER, BattlerIndex.ENEMY_2, BattlerIndex.PLAYER_2, BattlerIndex.ENEMY ]);

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

  it("FUSION_FLARE should not double power of subsequent FUSION_BOLT if a move succeeded in between", async() => {
    vi.spyOn(overrides, "OPP_MOVESET_OVERRIDE", "get").mockReturnValue([ Moves.SPLASH, Moves.SPLASH, Moves.SPLASH, Moves.SPLASH ]);
    await game.startBattle([
      Species.ZEKROM,
      Species.ZEKROM
    ]);

    game.doAttack(getMovePosition(game.scene, 0, fusionFlare.id));
    game.doSelectTarget(BattlerIndex.ENEMY);

    game.doAttack(getMovePosition(game.scene, 0, fusionBolt.id));
    game.doSelectTarget(BattlerIndex.ENEMY);

    await game.phaseInterceptor.to(TurnStartPhase, false);

    // Force first enemy to act in between party
    vi.spyOn(game.scene.getCurrentPhase() as TurnStartPhase, "getOrder").mockReturnValue([ BattlerIndex.PLAYER, BattlerIndex.ENEMY_2, BattlerIndex.PLAYER_2, BattlerIndex.ENEMY ]);

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

  it("FUSION_FLARE should double power of subsequent FUSION_BOLT if moves are aimed at allies", async() => {
    await game.startBattle([
      Species.ZEKROM,
      Species.RESHIRAM
    ]);

    game.doAttack(getMovePosition(game.scene, 0, fusionBolt.id));
    game.doSelectTarget(BattlerIndex.PLAYER_2);

    game.doAttack(getMovePosition(game.scene, 0, fusionFlare.id));
    game.doSelectTarget(BattlerIndex.PLAYER);

    await game.phaseInterceptor.to(TurnStartPhase, false);

    // Force user party to act before enemy party
    vi.spyOn(game.scene.getCurrentPhase() as TurnStartPhase, "getOrder").mockReturnValue([ BattlerIndex.PLAYER, BattlerIndex.PLAYER_2, BattlerIndex.ENEMY, BattlerIndex.ENEMY_2 ]);

    await game.phaseInterceptor.to(MoveEffectPhase, false);
    expect((game.scene.getCurrentPhase() as MoveEffectPhase).move.moveId).toBe(fusionBolt.id);
    await game.phaseInterceptor.to(DamagePhase, false);
    expect(fusionBolt.calculateBattlePower).toHaveLastReturnedWith(100);

    await game.phaseInterceptor.to(MoveEffectPhase, false);
    expect((game.scene.getCurrentPhase() as MoveEffectPhase).move.moveId).toBe(fusionFlare.id);
    await game.phaseInterceptor.to(DamagePhase, false);
    expect(fusionFlare.calculateBattlePower).toHaveLastReturnedWith(200);
  }, 20000);

  it("FUSION_FLARE and FUSION_BOLT alternating throughout turn should double power of subsequent moves", async() => {
    vi.spyOn(overrides, "OPP_MOVESET_OVERRIDE", "get").mockReturnValue([ fusionFlare.id, fusionFlare.id, fusionFlare.id, fusionFlare.id ]);
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

    game.doAttack(getMovePosition(game.scene, 0, fusionBolt.id));
    game.doSelectTarget(BattlerIndex.ENEMY);

    game.doAttack(getMovePosition(game.scene, 0, fusionBolt.id));
    game.doSelectTarget(BattlerIndex.ENEMY);

    await game.phaseInterceptor.to(TurnStartPhase, false);

    // Force first enemy to act in between party
    vi.spyOn(game.scene.getCurrentPhase() as TurnStartPhase, "getOrder").mockReturnValue([ BattlerIndex.PLAYER, BattlerIndex.ENEMY_2, BattlerIndex.PLAYER_2, BattlerIndex.ENEMY ]);

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

  it("FUSION_FLARE and FUSION_BOLT alternating throughout turn should double power of subsequent moves if moves are aimed at allies", async() => {
    vi.spyOn(overrides, "OPP_MOVESET_OVERRIDE", "get").mockReturnValue([ fusionFlare.id, fusionFlare.id, fusionFlare.id, fusionFlare.id ]);
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

    game.doAttack(getMovePosition(game.scene, 0, fusionBolt.id));
    game.doSelectTarget(BattlerIndex.PLAYER_2);

    game.doAttack(getMovePosition(game.scene, 0, fusionBolt.id));
    game.doSelectTarget(BattlerIndex.PLAYER);

    await game.phaseInterceptor.to(TurnStartPhase, false);

    // Force first enemy to act in between party
    vi.spyOn(game.scene.getCurrentPhase() as TurnStartPhase, "getOrder").mockReturnValue([ BattlerIndex.PLAYER, BattlerIndex.ENEMY_2, BattlerIndex.PLAYER_2, BattlerIndex.ENEMY ]);

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
