import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, test, vi } from "vitest";
import GameManager from "../utils/gameManager";
import Overrides from "#app/overrides";
import { Species } from "#enums/species";
import { Abilities } from "#enums/abilities";
import { Moves } from "#enums/moves";
import { getMovePosition } from "../utils/gameManagerUtils";
import { BerryPhase, CommandPhase, DamagePhase, MoveEffectPhase, MoveEndPhase, TurnEndPhase } from "#app/phases.js";
import { BattleStat } from "#app/data/battle-stat.js";
import { Type } from "#app/data/type.js";
import { BattlerTagType } from "#app/enums/battler-tag-type.js";
import { StatusEffect } from "#app/data/status-effect.js";

const TIMEOUT = 20 * 1000;

describe("Abilities - Parental Bond", () => {
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
    vi.spyOn(Overrides, "SINGLE_BATTLE_OVERRIDE", "get").mockReturnValue(true);
    vi.spyOn(Overrides, "NEVER_CRIT_OVERRIDE", "get").mockReturnValue(true);
    vi.spyOn(Overrides, "ABILITY_OVERRIDE", "get").mockReturnValue(Abilities.PARENTAL_BOND);
    vi.spyOn(Overrides, "OPP_SPECIES_OVERRIDE", "get").mockReturnValue(Species.SNORLAX);
    vi.spyOn(Overrides, "OPP_ABILITY_OVERRIDE", "get").mockReturnValue(Abilities.INSOMNIA);
    vi.spyOn(Overrides, "OPP_MOVESET_OVERRIDE", "get").mockReturnValue([Moves.SPLASH, Moves.SPLASH, Moves.SPLASH, Moves.SPLASH]);
    vi.spyOn(Overrides, "STARTING_LEVEL_OVERRIDE", "get").mockReturnValue(100);
    vi.spyOn(Overrides, "OPP_LEVEL_OVERRIDE", "get").mockReturnValue(100);
  });

  test(
    "ability should add second strike to attack move",
    async () => {
      vi.spyOn(Overrides, "MOVESET_OVERRIDE", "get").mockReturnValue([Moves.TACKLE]);

      await game.startBattle([Species.CHARIZARD]);

      const leadPokemon = game.scene.getPlayerPokemon();
      expect(leadPokemon).not.toBe(undefined);

      const enemyPokemon = game.scene.getEnemyPokemon();
      expect(enemyPokemon).not.toBe(undefined);

      let enemyStartingHp = enemyPokemon.hp;

      game.doAttack(getMovePosition(game.scene, 0, Moves.TACKLE));

      await game.phaseInterceptor.to(MoveEffectPhase, false);

      await game.phaseInterceptor.to(DamagePhase);
      const firstStrikeDamage = enemyStartingHp - enemyPokemon.hp;
      enemyStartingHp = enemyPokemon.hp;

      await game.phaseInterceptor.to(BerryPhase, false);

      const secondStrikeDamage = enemyStartingHp - enemyPokemon.hp;

      expect(leadPokemon.turnData.hitCount).toBe(2);
      expect(secondStrikeDamage).toBe(Math.ceil(0.25 * firstStrikeDamage));
    }, TIMEOUT
  );

  test(
    "ability should apply secondary effects to both strikes",
    async () => {
      vi.spyOn(Overrides, "MOVESET_OVERRIDE", "get").mockReturnValue([Moves.POWER_UP_PUNCH]);
      vi.spyOn(Overrides, "OPP_SPECIES_OVERRIDE", "get").mockReturnValue(Species.AMOONGUSS);

      await game.startBattle([Species.CHARIZARD]);

      const leadPokemon = game.scene.getPlayerPokemon();
      expect(leadPokemon).not.toBe(undefined);

      const enemyPokemon = game.scene.getEnemyPokemon();
      expect(enemyPokemon).not.toBe(undefined);

      game.doAttack(getMovePosition(game.scene, 0, Moves.POWER_UP_PUNCH));

      await game.phaseInterceptor.to(BerryPhase, false);

      expect(leadPokemon.turnData.hitCount).toBe(2);
      expect(leadPokemon.summonData.battleStats[BattleStat.ATK]).toBe(2);
    }, TIMEOUT
  );

  test(
    "ability should not apply to Status moves",
    async () => {
      vi.spyOn(Overrides, "MOVESET_OVERRIDE", "get").mockReturnValue([Moves.BABY_DOLL_EYES]);

      await game.startBattle([Species.CHARIZARD]);

      const leadPokemon = game.scene.getPlayerPokemon();
      expect(leadPokemon).not.toBe(undefined);

      const enemyPokemon = game.scene.getEnemyPokemon();
      expect(enemyPokemon).not.toBe(undefined);

      game.doAttack(getMovePosition(game.scene, 0, Moves.BABY_DOLL_EYES));
      await game.phaseInterceptor.to(BerryPhase, false);

      expect(enemyPokemon.summonData.battleStats[BattleStat.ATK]).toBe(-1);
    }, TIMEOUT
  );

  test(
    "ability should not apply to multi-hit moves",
    async () => {
      vi.spyOn(Overrides, "MOVESET_OVERRIDE", "get").mockReturnValue([Moves.DOUBLE_HIT]);

      await game.startBattle([Species.CHARIZARD]);

      const leadPokemon = game.scene.getPlayerPokemon();
      expect(leadPokemon).not.toBe(undefined);

      const enemyPokemon = game.scene.getEnemyPokemon();
      expect(enemyPokemon).not.toBe(undefined);

      game.doAttack(getMovePosition(game.scene, 0, Moves.DOUBLE_HIT));

      await game.phaseInterceptor.to(MoveEffectPhase, false);

      vi.spyOn(game.scene.getCurrentPhase() as MoveEffectPhase, "hitCheck").mockReturnValue(true);

      await game.phaseInterceptor.to(BerryPhase, false);

      expect(leadPokemon.turnData.hitCount).toBe(2);
    }, TIMEOUT
  );

  test(
    "ability should not apply to self-sacrifice moves",
    async () => {
      vi.spyOn(Overrides, "MOVESET_OVERRIDE", "get").mockReturnValue([Moves.SELF_DESTRUCT]);

      await game.startBattle([Species.CHARIZARD]);

      const leadPokemon = game.scene.getPlayerPokemon();
      expect(leadPokemon).not.toBe(undefined);

      const enemyPokemon = game.scene.getEnemyPokemon();
      expect(enemyPokemon).not.toBe(undefined);

      game.doAttack(getMovePosition(game.scene, 0, Moves.SELF_DESTRUCT));

      await game.phaseInterceptor.to(DamagePhase, false);

      expect(leadPokemon.turnData.hitCount).toBe(1);
    }, TIMEOUT
  );

  test(
    "ability should not apply to Rollout",
    async () => {
      vi.spyOn(Overrides, "MOVESET_OVERRIDE", "get").mockReturnValue([Moves.ROLLOUT]);

      await game.startBattle([Species.CHARIZARD]);

      const leadPokemon = game.scene.getPlayerPokemon();
      expect(leadPokemon).not.toBe(undefined);

      const enemyPokemon = game.scene.getEnemyPokemon();
      expect(enemyPokemon).not.toBe(undefined);

      game.doAttack(getMovePosition(game.scene, 0, Moves.ROLLOUT));

      await game.phaseInterceptor.to(MoveEffectPhase, false);
      vi.spyOn(game.scene.getCurrentPhase() as MoveEffectPhase, "hitCheck").mockReturnValue(true);

      await game.phaseInterceptor.to(DamagePhase, false);

      expect(leadPokemon.turnData.hitCount).toBe(1);
    }, TIMEOUT
  );

  test(
    "ability should not apply multiplier to fixed-damage moves",
    async () => {
      vi.spyOn(Overrides, "MOVESET_OVERRIDE", "get").mockReturnValue([Moves.DRAGON_RAGE]);

      await game.startBattle([Species.CHARIZARD]);

      const leadPokemon = game.scene.getPlayerPokemon();
      expect(leadPokemon).not.toBe(undefined);

      const enemyPokemon = game.scene.getEnemyPokemon();
      expect(enemyPokemon).not.toBe(undefined);

      const enemyStartingHp = enemyPokemon.hp;

      game.doAttack(getMovePosition(game.scene, 0, Moves.DRAGON_RAGE));
      await game.phaseInterceptor.to(BerryPhase, false);

      expect(enemyPokemon.hp).toBe(enemyStartingHp - 80);
    }, TIMEOUT
  );

  test(
    "ability should not apply multiplier to counter moves",
    async () => {
      vi.spyOn(Overrides, "MOVESET_OVERRIDE", "get").mockReturnValue([Moves.COUNTER]);
      vi.spyOn(Overrides, "OPP_MOVESET_OVERRIDE", "get").mockReturnValue([Moves.TACKLE,Moves.TACKLE,Moves.TACKLE,Moves.TACKLE]);

      await game.startBattle([Species.CHARIZARD]);

      const leadPokemon = game.scene.getPlayerPokemon();
      expect(leadPokemon).not.toBe(undefined);

      const enemyPokemon = game.scene.getEnemyPokemon();
      expect(enemyPokemon).not.toBe(undefined);

      const playerStartingHp = leadPokemon.hp;
      const enemyStartingHp = enemyPokemon.hp;

      game.doAttack(getMovePosition(game.scene, 0, Moves.COUNTER));
      await game.phaseInterceptor.to(DamagePhase);

      const playerDamage = playerStartingHp - leadPokemon.hp;

      await game.phaseInterceptor.to(BerryPhase, false);

      expect(enemyPokemon.hp).toBe(enemyStartingHp - 4*playerDamage);
    }, TIMEOUT
  );

  test(
    "ability should not apply to multi-target moves",
    async () => {
      vi.spyOn(Overrides, "DOUBLE_BATTLE_OVERRIDE", "get").mockReturnValue(true);
      vi.spyOn(Overrides, "SINGLE_BATTLE_OVERRIDE", "get").mockReturnValue(false);
      vi.spyOn(Overrides, "MOVESET_OVERRIDE", "get").mockReturnValue([Moves.EARTHQUAKE]);

      await game.startBattle([Species.CHARIZARD, Species.PIDGEOT]);

      const playerPokemon = game.scene.getPlayerField();
      expect(playerPokemon.length).toBe(2);
      playerPokemon.forEach(p => expect(p).not.toBe(undefined));

      const enemyPokemon = game.scene.getEnemyField();
      expect(enemyPokemon.length).toBe(2);
      enemyPokemon.forEach(p => expect(p).not.toBe(undefined));

      game.doAttack(getMovePosition(game.scene, 0, Moves.EARTHQUAKE));
      await game.phaseInterceptor.to(CommandPhase);

      game.doAttack(getMovePosition(game.scene, 1, Moves.EARTHQUAKE));
      await game.phaseInterceptor.to(BerryPhase, false);

      playerPokemon.forEach(p => expect(p.turnData.hitCount).toBe(1));
    }, TIMEOUT
  );

  test(
    "ability should apply to multi-target moves when hitting only one target",
    async () => {
      vi.spyOn(Overrides, "MOVESET_OVERRIDE", "get").mockReturnValue([Moves.EARTHQUAKE]);

      await game.startBattle([Species.CHARIZARD]);

      const leadPokemon = game.scene.getPlayerPokemon();
      expect(leadPokemon).not.toBe(undefined);

      const enemyPokemon = game.scene.getEnemyPokemon();
      expect(enemyPokemon).not.toBe(undefined);

      game.doAttack(getMovePosition(game.scene, 0, Moves.EARTHQUAKE));
      await game.phaseInterceptor.to(DamagePhase, false);

      expect(leadPokemon.turnData.hitCount).toBe(2);
    }, TIMEOUT
  );

  test(
    "ability should only trigger post-target move effects once",
    async () => {
      vi.spyOn(Overrides, "MOVESET_OVERRIDE", "get").mockReturnValue([Moves.MIND_BLOWN]);

      await game.startBattle([Species.PIDGEOT]);

      const leadPokemon = game.scene.getPlayerPokemon();
      expect(leadPokemon).not.toBe(undefined);

      const enemyPokemon = game.scene.getEnemyPokemon();
      expect(enemyPokemon).not.toBe(undefined);

      game.doAttack(getMovePosition(game.scene, 0, Moves.MIND_BLOWN));

      await game.phaseInterceptor.to(DamagePhase, false);

      expect(leadPokemon.turnData.hitCount).toBe(2);

      // This test will time out if the user faints
      await game.phaseInterceptor.to(BerryPhase, false);

      expect(leadPokemon.hp).toBe(Math.floor(leadPokemon.getMaxHp()/2));
    }, TIMEOUT
  );

  test(
    "Burn Up only removes type after second strike with this ability",
    async () => {
      vi.spyOn(Overrides, "MOVESET_OVERRIDE", "get").mockReturnValue([Moves.BURN_UP]);

      await game.startBattle([Species.CHARIZARD]);

      const leadPokemon = game.scene.getPlayerPokemon();
      expect(leadPokemon).not.toBe(undefined);

      const enemyPokemon = game.scene.getEnemyPokemon();
      expect(enemyPokemon).not.toBe(undefined);

      game.doAttack(getMovePosition(game.scene, 0, Moves.BURN_UP));

      await game.phaseInterceptor.to(DamagePhase);

      expect(leadPokemon.turnData.hitCount).toBe(2);
      expect(enemyPokemon.hp).toBeGreaterThan(0);
      expect(leadPokemon.isOfType(Type.FIRE)).toBe(true);

      await game.phaseInterceptor.to(BerryPhase, false);

      expect(leadPokemon.isOfType(Type.FIRE)).toBe(false);
    }, TIMEOUT
  );

  test(
    "Moves boosted by this ability and Multi-Lens should strike 4 times",
    async () => {
      vi.spyOn(Overrides, "MOVESET_OVERRIDE", "get").mockReturnValue([Moves.TACKLE]);
      vi.spyOn(Overrides, "STARTING_HELD_ITEMS_OVERRIDE", "get").mockReturnValue([{name: "MULTI_LENS", count: 1}]);

      await game.startBattle([Species.CHARIZARD]);

      const leadPokemon = game.scene.getPlayerPokemon();
      expect(leadPokemon).not.toBe(undefined);

      const enemyPokemon = game.scene.getEnemyPokemon();
      expect(enemyPokemon).not.toBe(undefined);

      game.doAttack(getMovePosition(game.scene, 0, Moves.TACKLE));

      await game.phaseInterceptor.to(DamagePhase);

      expect(leadPokemon.turnData.hitCount).toBe(4);
    }, TIMEOUT
  );

  test(
    "Super Fang boosted by this ability and Multi-Lens should strike twice",
    async () => {
      vi.spyOn(Overrides, "MOVESET_OVERRIDE", "get").mockReturnValue([Moves.SUPER_FANG]);
      vi.spyOn(Overrides, "STARTING_HELD_ITEMS_OVERRIDE", "get").mockReturnValue([{name: "MULTI_LENS", count: 1}]);

      await game.startBattle([Species.CHARIZARD]);

      const leadPokemon = game.scene.getPlayerPokemon();
      expect(leadPokemon).not.toBe(undefined);

      const enemyPokemon = game.scene.getEnemyPokemon();
      expect(enemyPokemon).not.toBe(undefined);

      const enemyStartingHp = enemyPokemon.hp;

      game.doAttack(getMovePosition(game.scene, 0, Moves.SUPER_FANG));

      await game.phaseInterceptor.to(MoveEffectPhase, false);
      vi.spyOn(game.scene.getCurrentPhase() as MoveEffectPhase, "hitCheck").mockReturnValue(true);

      await game.phaseInterceptor.to(DamagePhase);

      expect(leadPokemon.turnData.hitCount).toBe(2);

      await game.phaseInterceptor.to(MoveEndPhase, false);

      expect(enemyPokemon.hp).toBe(Math.ceil(enemyStartingHp * 0.25));
    }, TIMEOUT
  );

  test(
    "Seismic Toss boosted by this ability and Multi-Lens should strike twice",
    async () => {
      vi.spyOn(Overrides, "MOVESET_OVERRIDE", "get").mockReturnValue([Moves.SEISMIC_TOSS]);
      vi.spyOn(Overrides, "STARTING_HELD_ITEMS_OVERRIDE", "get").mockReturnValue([{name: "MULTI_LENS", count: 1}]);

      await game.startBattle([Species.CHARIZARD]);

      const leadPokemon = game.scene.getPlayerPokemon();
      expect(leadPokemon).not.toBe(undefined);

      const enemyPokemon = game.scene.getEnemyPokemon();
      expect(enemyPokemon).not.toBe(undefined);

      const enemyStartingHp = enemyPokemon.hp;

      game.doAttack(getMovePosition(game.scene, 0, Moves.SEISMIC_TOSS));

      await game.phaseInterceptor.to(MoveEffectPhase, false);
      vi.spyOn(game.scene.getCurrentPhase() as MoveEffectPhase, "hitCheck").mockReturnValue(true);

      await game.phaseInterceptor.to(DamagePhase);

      expect(leadPokemon.turnData.hitCount).toBe(2);

      await game.phaseInterceptor.to(MoveEndPhase, false);

      expect(enemyPokemon.hp).toBe(enemyStartingHp - 200);
    }, TIMEOUT
  );

  test(
    "Hyper Beam boosted by this ability should strike twice, then recharge",
    async () => {
      vi.spyOn(Overrides, "MOVESET_OVERRIDE", "get").mockReturnValue([Moves.HYPER_BEAM]);

      await game.startBattle([Species.CHARIZARD]);

      const leadPokemon = game.scene.getPlayerPokemon();
      expect(leadPokemon).not.toBe(undefined);

      const enemyPokemon = game.scene.getEnemyPokemon();
      expect(enemyPokemon).not.toBe(undefined);

      game.doAttack(getMovePosition(game.scene, 0, Moves.HYPER_BEAM));

      await game.phaseInterceptor.to(MoveEffectPhase, false);
      vi.spyOn(game.scene.getCurrentPhase() as MoveEffectPhase, "hitCheck").mockReturnValue(true);

      await game.phaseInterceptor.to(DamagePhase);

      expect(leadPokemon.turnData.hitCount).toBe(2);
      expect(leadPokemon.getTag(BattlerTagType.RECHARGING)).toBeUndefined();

      await game.phaseInterceptor.to(TurnEndPhase);

      expect(leadPokemon.getTag(BattlerTagType.RECHARGING)).toBeDefined();
    }, TIMEOUT
  );

  /** TODO: Fix TRAPPED tag lapsing incorrectly, then run this test */
  test(
    "Anchor Shot boosted by this ability should only trap the target after the second hit",
    async () => {
      vi.spyOn(Overrides, "MOVESET_OVERRIDE", "get").mockReturnValue([Moves.ANCHOR_SHOT]);

      await game.startBattle([Species.CHARIZARD]);

      const leadPokemon = game.scene.getPlayerPokemon();
      expect(leadPokemon).not.toBe(undefined);

      const enemyPokemon = game.scene.getEnemyPokemon();
      expect(enemyPokemon).not.toBe(undefined);

      game.doAttack(getMovePosition(game.scene, 0, Moves.ANCHOR_SHOT));

      await game.phaseInterceptor.to(MoveEffectPhase, false);
      vi.spyOn(game.scene.getCurrentPhase() as MoveEffectPhase, "hitCheck").mockReturnValue(true);

      await game.phaseInterceptor.to(DamagePhase);

      expect(leadPokemon.turnData.hitCount).toBe(2);
      expect(enemyPokemon.getTag(BattlerTagType.TRAPPED)).toBeUndefined(); // Passes

      await game.phaseInterceptor.to(MoveEndPhase);
      expect(enemyPokemon.getTag(BattlerTagType.TRAPPED)).toBeDefined(); // Passes

      await game.phaseInterceptor.to(TurnEndPhase);

      expect(enemyPokemon.getTag(BattlerTagType.TRAPPED)).toBeDefined(); // Fails :(
    }, TIMEOUT
  );

  test(
    "Smack Down boosted by this ability should only ground the target after the second hit",
    async () => {
      vi.spyOn(Overrides, "MOVESET_OVERRIDE", "get").mockReturnValue([Moves.SMACK_DOWN]);

      await game.startBattle([Species.CHARIZARD]);

      const leadPokemon = game.scene.getPlayerPokemon();
      expect(leadPokemon).not.toBe(undefined);

      const enemyPokemon = game.scene.getEnemyPokemon();
      expect(enemyPokemon).not.toBe(undefined);

      game.doAttack(getMovePosition(game.scene, 0, Moves.SMACK_DOWN));

      await game.phaseInterceptor.to(MoveEffectPhase, false);
      vi.spyOn(game.scene.getCurrentPhase() as MoveEffectPhase, "hitCheck").mockReturnValue(true);

      await game.phaseInterceptor.to(DamagePhase);

      expect(leadPokemon.turnData.hitCount).toBe(2);
      expect(enemyPokemon.getTag(BattlerTagType.IGNORE_FLYING)).toBeUndefined();

      await game.phaseInterceptor.to(TurnEndPhase);

      expect(enemyPokemon.getTag(BattlerTagType.IGNORE_FLYING)).toBeDefined();
    }, TIMEOUT
  );

  test(
    "U-turn boosted by this ability should strike twice before forcing a switch",
    async () => {
      vi.spyOn(Overrides, "MOVESET_OVERRIDE", "get").mockReturnValue([Moves.U_TURN]);

      await game.startBattle([Species.CHARIZARD, Species.BLASTOISE]);

      const leadPokemon = game.scene.getPlayerPokemon();
      expect(leadPokemon).not.toBe(undefined);

      const enemyPokemon = game.scene.getEnemyPokemon();
      expect(enemyPokemon).not.toBe(undefined);

      game.doAttack(getMovePosition(game.scene, 0, Moves.U_TURN));

      await game.phaseInterceptor.to(MoveEffectPhase, false);
      vi.spyOn(game.scene.getCurrentPhase() as MoveEffectPhase, "hitCheck").mockReturnValue(true);

      await game.phaseInterceptor.to(MoveEffectPhase);
      expect(leadPokemon.turnData.hitCount).toBe(2);

      // This will cause this test to time out if the switch was forced on the first hit.
      await game.phaseInterceptor.to(MoveEffectPhase, false);
    }, TIMEOUT
  );

  test(
    "Wake-Up Slap boosted by this ability should only wake up the target after the second hit",
    async () => {
      vi.spyOn(Overrides, "MOVESET_OVERRIDE", "get").mockReturnValue([Moves.WAKE_UP_SLAP]);
      vi.spyOn(Overrides, "OPP_STATUS_OVERRIDE", "get").mockReturnValue(StatusEffect.SLEEP);

      await game.startBattle([Species.CHARIZARD]);

      const leadPokemon = game.scene.getPlayerPokemon();
      expect(leadPokemon).not.toBe(undefined);

      const enemyPokemon = game.scene.getEnemyPokemon();
      expect(enemyPokemon).not.toBe(undefined);

      game.doAttack(getMovePosition(game.scene, 0, Moves.WAKE_UP_SLAP));

      await game.phaseInterceptor.to(MoveEffectPhase, false);
      vi.spyOn(game.scene.getCurrentPhase() as MoveEffectPhase, "hitCheck").mockReturnValue(true);

      await game.phaseInterceptor.to(DamagePhase);

      expect(leadPokemon.turnData.hitCount).toBe(2);
      expect(enemyPokemon.status?.effect).toBe(StatusEffect.SLEEP);

      await game.phaseInterceptor.to(BerryPhase, false);

      expect(enemyPokemon.status?.effect).toBeUndefined();
    }, TIMEOUT
  );

  test(
    "ability should not cause user to hit into King's Shield more than once",
    async () => {
      vi.spyOn(Overrides, "MOVESET_OVERRIDE", "get").mockReturnValue([Moves.TACKLE]);
      vi.spyOn(Overrides, "OPP_MOVESET_OVERRIDE", "get").mockReturnValue([Moves.KINGS_SHIELD,Moves.KINGS_SHIELD,Moves.KINGS_SHIELD,Moves.KINGS_SHIELD]);

      await game.startBattle([Species.CHARIZARD]);

      const leadPokemon = game.scene.getPlayerPokemon();
      expect(leadPokemon).not.toBe(undefined);

      const enemyPokemon = game.scene.getEnemyPokemon();
      expect(enemyPokemon).not.toBe(undefined);

      game.doAttack(getMovePosition(game.scene, 0, Moves.TACKLE));

      await game.phaseInterceptor.to(BerryPhase, false);

      expect(leadPokemon.summonData.battleStats[BattleStat.ATK]).toBe(-1);
    }, TIMEOUT
  );

  test(
    "ability should not cause user to hit into Storm Drain more than once",
    async () => {
      vi.spyOn(Overrides, "MOVESET_OVERRIDE", "get").mockReturnValue([Moves.WATER_GUN]);
      vi.spyOn(Overrides, "OPP_ABILITY_OVERRIDE", "get").mockReturnValue(Abilities.STORM_DRAIN);

      await game.startBattle([Species.CHARIZARD]);

      const leadPokemon = game.scene.getPlayerPokemon();
      expect(leadPokemon).not.toBe(undefined);

      const enemyPokemon = game.scene.getEnemyPokemon();
      expect(enemyPokemon).not.toBe(undefined);

      game.doAttack(getMovePosition(game.scene, 0, Moves.WATER_GUN));

      await game.phaseInterceptor.to(BerryPhase, false);

      expect(enemyPokemon.summonData.battleStats[BattleStat.SPATK]).toBe(1);
    }, TIMEOUT
  );

  test(
    "ability should not apply to multi-target moves with Multi-Lens",
    async () => {
      vi.spyOn(Overrides, "DOUBLE_BATTLE_OVERRIDE", "get").mockReturnValue(true);
      vi.spyOn(Overrides, "SINGLE_BATTLE_OVERRIDE", "get").mockReturnValue(false);
      vi.spyOn(Overrides, "MOVESET_OVERRIDE", "get").mockReturnValue([Moves.EARTHQUAKE, Moves.SPLASH]);
      vi.spyOn(Overrides, "STARTING_HELD_ITEMS_OVERRIDE", "get").mockReturnValue([{name: "MULTI_LENS", count: 1}]);

      await game.startBattle([Species.CHARIZARD, Species.PIDGEOT]);

      const playerPokemon = game.scene.getPlayerField();
      expect(playerPokemon.length).toBe(2);
      playerPokemon.forEach(p => expect(p).not.toBe(undefined));

      const enemyPokemon = game.scene.getEnemyField();
      expect(enemyPokemon.length).toBe(2);
      enemyPokemon.forEach(p => expect(p).not.toBe(undefined));

      const enemyStartingHp = enemyPokemon.map(p => p.hp);

      game.doAttack(getMovePosition(game.scene, 0, Moves.EARTHQUAKE));
      await game.phaseInterceptor.to(CommandPhase);

      game.doAttack(getMovePosition(game.scene, 1, Moves.SPLASH));

      await game.phaseInterceptor.to(MoveEffectPhase, false);

      await game.phaseInterceptor.to(DamagePhase);
      const enemyFirstHitDamage = enemyStartingHp.map((hp, i) => hp - enemyPokemon[i].hp);

      await game.phaseInterceptor.to(BerryPhase, false);

      enemyPokemon.forEach((p, i) => expect(enemyStartingHp[i] - p.hp).toBe(2*enemyFirstHitDamage[i]));

    }, TIMEOUT
  );
});
