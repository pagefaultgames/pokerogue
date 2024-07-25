import { BattleStat } from "#app/data/battle-stat.js";
import { StatusEffect } from "#app/data/status-effect.js";
import { Type } from "#app/data/type.js";
import { BattlerTagType } from "#app/enums/battler-tag-type.js";
import { BerryPhase, CommandPhase, DamagePhase, MoveEffectPhase, MoveEndPhase, TurnEndPhase } from "#app/phases.js";
import { Abilities } from "#enums/abilities";
import { Moves } from "#enums/moves";
import { Species } from "#enums/species";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, test, vi } from "vitest";
import GameManager from "../utils/gameManager";
import { getMovePosition } from "../utils/gameManagerUtils";
import { SPLASH_ONLY } from "../utils/testUtils";

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
    game.override.battleType("single");
    game.override.disableCrits();
    game.override.ability(Abilities.PARENTAL_BOND);
    game.override.enemySpecies(Species.SNORLAX);
    game.override.enemyAbility(Abilities.INSOMNIA);
    game.override.enemyMoveset(SPLASH_ONLY);
    game.override.startingLevel(100);
    game.override.enemyLevel(100);
  });

  test(
    "ability should add second strike to attack move",
    async () => {
      game.override.moveset([Moves.TACKLE]);

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
      game.override.moveset([Moves.POWER_UP_PUNCH]);
      game.override.enemySpecies(Species.AMOONGUSS);

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
      game.override.moveset([Moves.BABY_DOLL_EYES]);

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
      game.override.moveset([Moves.DOUBLE_HIT]);

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
      game.override.moveset([Moves.SELF_DESTRUCT]);

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
      game.override.moveset([Moves.ROLLOUT]);

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
      game.override.moveset([Moves.DRAGON_RAGE]);

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
      game.override.moveset([Moves.COUNTER]);
      game.override.enemyMoveset([Moves.TACKLE,Moves.TACKLE,Moves.TACKLE,Moves.TACKLE]);

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
      game.override.battleType("double");
      game.override.moveset([Moves.EARTHQUAKE]);

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
      game.override.moveset([Moves.EARTHQUAKE]);

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
      game.override.moveset([Moves.MIND_BLOWN]);

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
      game.override.moveset([Moves.BURN_UP]);

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
      game.override.moveset([Moves.TACKLE]);
      game.override.startingHeldItems([{name: "MULTI_LENS", count: 1}]);

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
      game.override.moveset([Moves.SUPER_FANG]);
      game.override.startingHeldItems([{name: "MULTI_LENS", count: 1}]);

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
      game.override.moveset([Moves.SEISMIC_TOSS]);
      game.override.startingHeldItems([{name: "MULTI_LENS", count: 1}]);

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
      game.override.moveset([Moves.HYPER_BEAM]);

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
      game.override.moveset([Moves.ANCHOR_SHOT]);

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
      game.override.moveset([Moves.SMACK_DOWN]);

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
      game.override.moveset([Moves.U_TURN]);

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
      game.override.moveset([Moves.WAKE_UP_SLAP]).enemyStatusEffect(StatusEffect.SLEEP);

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
      game.override.moveset([Moves.TACKLE]);
      game.override.enemyMoveset([Moves.KINGS_SHIELD,Moves.KINGS_SHIELD,Moves.KINGS_SHIELD,Moves.KINGS_SHIELD]);

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
      game.override.moveset([Moves.WATER_GUN]);
      game.override.enemyAbility(Abilities.STORM_DRAIN);

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
      game.override.battleType("double");
      game.override.moveset([Moves.EARTHQUAKE, Moves.SPLASH]);
      game.override.startingHeldItems([{name: "MULTI_LENS", count: 1}]);

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
