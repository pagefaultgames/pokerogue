import { Stat } from "#enums/stat";
import { StatusEffect } from "#app/data/status-effect";
import { Type } from "#app/data/type";
import { BattlerTagType } from "#app/enums/battler-tag-type";
import { toDmgValue } from "#app/utils";
import { Abilities } from "#enums/abilities";
import { Moves } from "#enums/moves";
import { Species } from "#enums/species";
import GameManager from "#test/utils/gameManager";
import { SPLASH_ONLY } from "#test/utils/testUtils";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";

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
    game.override.enemyAbility(Abilities.FUR_COAT);
    game.override.enemyMoveset(SPLASH_ONLY);
    game.override.startingLevel(100);
    game.override.enemyLevel(100);
  });

  it(
    "should add second strike to attack move",
    async () => {
      game.override.moveset([Moves.TACKLE]);

      await game.classicMode.startBattle([Species.MAGIKARP]);

      const leadPokemon = game.scene.getPlayerPokemon()!;
      const enemyPokemon = game.scene.getEnemyPokemon()!;

      let enemyStartingHp = enemyPokemon.hp;

      game.move.select(Moves.TACKLE);

      await game.phaseInterceptor.to("DamagePhase");
      const firstStrikeDamage = enemyStartingHp - enemyPokemon.hp;
      enemyStartingHp = enemyPokemon.hp;

      await game.phaseInterceptor.to("BerryPhase", false);

      const secondStrikeDamage = enemyStartingHp - enemyPokemon.hp;

      expect(leadPokemon.turnData.hitCount).toBe(2);
      expect(secondStrikeDamage).toBe(toDmgValue(0.25 * firstStrikeDamage));
    }, TIMEOUT
  );

  it(
    "should apply secondary effects to both strikes",
    async () => {
      game.override.moveset([Moves.POWER_UP_PUNCH]);
      game.override.enemySpecies(Species.AMOONGUSS);

      await game.classicMode.startBattle([Species.MAGIKARP]);

      const leadPokemon = game.scene.getPlayerPokemon()!;

      game.move.select(Moves.POWER_UP_PUNCH);

      await game.phaseInterceptor.to("BerryPhase", false);

      expect(leadPokemon.turnData.hitCount).toBe(2);
      expect(leadPokemon.getStatStage(Stat.ATK)).toBe(2);
    }, TIMEOUT
  );

  it(
    "should not apply to Status moves",
    async () => {
      game.override.moveset([Moves.BABY_DOLL_EYES]);

      await game.classicMode.startBattle([Species.MAGIKARP]);

      const enemyPokemon = game.scene.getEnemyPokemon()!;

      game.move.select(Moves.BABY_DOLL_EYES);

      await game.phaseInterceptor.to("BerryPhase", false);

      expect(enemyPokemon.getStatStage(Stat.ATK)).toBe(-1);
    }, TIMEOUT
  );

  it(
    "should not apply to multi-hit moves",
    async () => {
      game.override.moveset([Moves.DOUBLE_HIT]);

      await game.classicMode.startBattle([Species.MAGIKARP]);

      const leadPokemon = game.scene.getPlayerPokemon()!;

      game.move.select(Moves.DOUBLE_HIT);
      await game.move.forceHit();

      await game.phaseInterceptor.to("BerryPhase", false);

      expect(leadPokemon.turnData.hitCount).toBe(2);
    }, TIMEOUT
  );

  it(
    "should not apply to self-sacrifice moves",
    async () => {
      game.override.moveset([Moves.SELF_DESTRUCT]);

      await game.classicMode.startBattle([Species.MAGIKARP]);

      const leadPokemon = game.scene.getPlayerPokemon()!;

      game.move.select(Moves.SELF_DESTRUCT);

      await game.phaseInterceptor.to("DamagePhase", false);

      expect(leadPokemon.turnData.hitCount).toBe(1);
    }, TIMEOUT
  );

  it(
    "should not apply to Rollout",
    async () => {
      game.override.moveset([Moves.ROLLOUT]);

      await game.classicMode.startBattle([Species.MAGIKARP]);

      const leadPokemon = game.scene.getPlayerPokemon()!;

      game.move.select(Moves.ROLLOUT);
      await game.move.forceHit();

      await game.phaseInterceptor.to("DamagePhase", false);

      expect(leadPokemon.turnData.hitCount).toBe(1);
    }, TIMEOUT
  );

  it(
    "should not apply multiplier to fixed-damage moves",
    async () => {
      game.override.moveset([Moves.DRAGON_RAGE]);

      await game.classicMode.startBattle([Species.MAGIKARP]);

      const enemyPokemon = game.scene.getEnemyPokemon()!;

      game.move.select(Moves.DRAGON_RAGE);
      await game.phaseInterceptor.to("BerryPhase", false);

      expect(enemyPokemon.hp).toBe(enemyPokemon.getMaxHp() - 80);
    }, TIMEOUT
  );

  it(
    "should not apply multiplier to counter moves",
    async () => {
      game.override.moveset([Moves.COUNTER]);
      game.override.enemyMoveset(Array(4).fill(Moves.TACKLE));

      await game.classicMode.startBattle([Species.SHUCKLE]);

      const leadPokemon = game.scene.getPlayerPokemon()!;
      const enemyPokemon = game.scene.getEnemyPokemon()!;

      game.move.select(Moves.COUNTER);
      await game.phaseInterceptor.to("DamagePhase");

      const playerDamage = leadPokemon.getMaxHp() - leadPokemon.hp;

      await game.phaseInterceptor.to("BerryPhase", false);

      expect(enemyPokemon.hp).toBe(enemyPokemon.getMaxHp() - 4 * playerDamage);
    }, TIMEOUT
  );

  it(
    "should not apply to multi-target moves",
    async () => {
      game.override.battleType("double");
      game.override.moveset([Moves.EARTHQUAKE]);
      game.override.passiveAbility(Abilities.LEVITATE);

      await game.classicMode.startBattle([Species.MAGIKARP, Species.FEEBAS]);

      const playerPokemon = game.scene.getPlayerField();

      game.move.select(Moves.EARTHQUAKE);
      game.move.select(Moves.EARTHQUAKE, 1);

      await game.phaseInterceptor.to("BerryPhase", false);

      playerPokemon.forEach(p => expect(p.turnData.hitCount).toBe(1));
    }, TIMEOUT
  );

  it(
    "should apply to multi-target moves when hitting only one target",
    async () => {
      game.override.moveset([Moves.EARTHQUAKE]);

      await game.classicMode.startBattle([Species.MAGIKARP]);

      const leadPokemon = game.scene.getPlayerPokemon()!;

      game.move.select(Moves.EARTHQUAKE);
      await game.phaseInterceptor.to("DamagePhase", false);

      expect(leadPokemon.turnData.hitCount).toBe(2);
    }, TIMEOUT
  );

  it(
    "should only trigger post-target move effects once",
    async () => {
      game.override.moveset([Moves.MIND_BLOWN]);

      await game.classicMode.startBattle([Species.MAGIKARP]);

      const leadPokemon = game.scene.getPlayerPokemon()!;

      game.move.select(Moves.MIND_BLOWN);

      await game.phaseInterceptor.to("DamagePhase", false);

      expect(leadPokemon.turnData.hitCount).toBe(2);

      // This test will time out if the user faints
      await game.phaseInterceptor.to("BerryPhase", false);

      expect(leadPokemon.hp).toBe(Math.ceil(leadPokemon.getMaxHp() / 2));
    }, TIMEOUT
  );

  it(
    "Burn Up only removes type after the second strike",
    async () => {
      game.override.moveset([Moves.BURN_UP]);

      await game.classicMode.startBattle([Species.CHARIZARD]);

      const leadPokemon = game.scene.getPlayerPokemon()!;
      const enemyPokemon = game.scene.getEnemyPokemon()!;

      game.move.select(Moves.BURN_UP);

      await game.phaseInterceptor.to("MoveEffectPhase");

      expect(leadPokemon.turnData.hitCount).toBe(2);
      expect(enemyPokemon.hp).toBeGreaterThan(0);
      expect(leadPokemon.isOfType(Type.FIRE)).toBe(true);

      await game.phaseInterceptor.to("BerryPhase", false);

      expect(leadPokemon.isOfType(Type.FIRE)).toBe(false);
    }, TIMEOUT
  );

  it(
    "Moves boosted by this ability and Multi-Lens should strike 4 times",
    async () => {
      game.override.moveset([Moves.TACKLE]);
      game.override.startingHeldItems([{ name: "MULTI_LENS", count: 1 }]);

      await game.classicMode.startBattle([Species.MAGIKARP]);

      const leadPokemon = game.scene.getPlayerPokemon()!;

      game.move.select(Moves.TACKLE);

      await game.phaseInterceptor.to("DamagePhase");

      expect(leadPokemon.turnData.hitCount).toBe(4);
    }, TIMEOUT
  );

  it(
    "Super Fang boosted by this ability and Multi-Lens should strike twice",
    async () => {
      game.override.moveset([Moves.SUPER_FANG]);
      game.override.startingHeldItems([{ name: "MULTI_LENS", count: 1 }]);

      await game.classicMode.startBattle([Species.MAGIKARP]);

      const leadPokemon = game.scene.getPlayerPokemon()!;
      const enemyPokemon = game.scene.getEnemyPokemon()!;

      game.move.select(Moves.SUPER_FANG);
      await game.move.forceHit();

      await game.phaseInterceptor.to("DamagePhase");

      expect(leadPokemon.turnData.hitCount).toBe(2);

      await game.phaseInterceptor.to("MoveEndPhase", false);

      expect(enemyPokemon.hp).toBe(Math.ceil(enemyPokemon.getMaxHp() * 0.25));
    }, TIMEOUT
  );

  it(
    "Seismic Toss boosted by this ability and Multi-Lens should strike twice",
    async () => {
      game.override.moveset([Moves.SEISMIC_TOSS]);
      game.override.startingHeldItems([{ name: "MULTI_LENS", count: 1 }]);

      await game.classicMode.startBattle([Species.MAGIKARP]);

      const leadPokemon = game.scene.getPlayerPokemon()!;
      const enemyPokemon = game.scene.getEnemyPokemon()!;

      const enemyStartingHp = enemyPokemon.hp;

      game.move.select(Moves.SEISMIC_TOSS);
      await game.move.forceHit();

      await game.phaseInterceptor.to("DamagePhase");

      expect(leadPokemon.turnData.hitCount).toBe(2);

      await game.phaseInterceptor.to("MoveEndPhase", false);

      expect(enemyPokemon.hp).toBe(enemyStartingHp - 200);
    }, TIMEOUT
  );

  it(
    "Hyper Beam boosted by this ability should strike twice, then recharge",
    async () => {
      game.override.moveset([Moves.HYPER_BEAM]);

      await game.classicMode.startBattle([Species.MAGIKARP]);

      const leadPokemon = game.scene.getPlayerPokemon()!;

      game.move.select(Moves.HYPER_BEAM);
      await game.move.forceHit();

      await game.phaseInterceptor.to("DamagePhase");

      expect(leadPokemon.turnData.hitCount).toBe(2);
      expect(leadPokemon.getTag(BattlerTagType.RECHARGING)).toBeUndefined();

      await game.phaseInterceptor.to("TurnEndPhase");

      expect(leadPokemon.getTag(BattlerTagType.RECHARGING)).toBeDefined();
    }, TIMEOUT
  );

  it(
    "Anchor Shot boosted by this ability should only trap the target after the second hit",
    async () => {
      game.override.moveset([Moves.ANCHOR_SHOT]);

      await game.classicMode.startBattle([Species.MAGIKARP]);

      const leadPokemon = game.scene.getPlayerPokemon()!;
      const enemyPokemon = game.scene.getEnemyPokemon()!;

      game.move.select(Moves.ANCHOR_SHOT);
      await game.move.forceHit();

      await game.phaseInterceptor.to("DamagePhase");

      expect(leadPokemon.turnData.hitCount).toBe(2);
      expect(enemyPokemon.getTag(BattlerTagType.TRAPPED)).toBeUndefined();

      await game.phaseInterceptor.to("MoveEndPhase");
      expect(enemyPokemon.getTag(BattlerTagType.TRAPPED)).toBeDefined();

      await game.phaseInterceptor.to("TurnEndPhase");

      expect(enemyPokemon.getTag(BattlerTagType.TRAPPED)).toBeDefined();
    }, TIMEOUT
  );

  it(
    "Smack Down boosted by this ability should only ground the target after the second hit",
    async () => {
      game.override.moveset([Moves.SMACK_DOWN]);

      await game.classicMode.startBattle([Species.MAGIKARP]);

      const leadPokemon = game.scene.getPlayerPokemon()!;
      const enemyPokemon = game.scene.getEnemyPokemon()!;

      game.move.select(Moves.SMACK_DOWN);
      await game.move.forceHit();

      await game.phaseInterceptor.to("DamagePhase");

      expect(leadPokemon.turnData.hitCount).toBe(2);
      expect(enemyPokemon.getTag(BattlerTagType.IGNORE_FLYING)).toBeUndefined();

      await game.phaseInterceptor.to("TurnEndPhase");

      expect(enemyPokemon.getTag(BattlerTagType.IGNORE_FLYING)).toBeDefined();
    }, TIMEOUT
  );

  it(
    "U-turn boosted by this ability should strike twice before forcing a switch",
    async () => {
      game.override.moveset([Moves.U_TURN]);

      await game.classicMode.startBattle([Species.MAGIKARP, Species.BLASTOISE]);

      const leadPokemon = game.scene.getPlayerPokemon()!;

      game.move.select(Moves.U_TURN);
      await game.move.forceHit();

      await game.phaseInterceptor.to("MoveEffectPhase");
      expect(leadPokemon.turnData.hitCount).toBe(2);

      // This will cause this test to time out if the switch was forced on the first hit.
      await game.phaseInterceptor.to("MoveEffectPhase", false);
    }, TIMEOUT
  );

  it(
    "Wake-Up Slap boosted by this ability should only wake up the target after the second hit",
    async () => {
      game.override.moveset([Moves.WAKE_UP_SLAP]).enemyStatusEffect(StatusEffect.SLEEP);

      await game.classicMode.startBattle([Species.MAGIKARP]);

      const leadPokemon = game.scene.getPlayerPokemon()!;
      const enemyPokemon = game.scene.getEnemyPokemon()!;

      game.move.select(Moves.WAKE_UP_SLAP);
      await game.move.forceHit();

      await game.phaseInterceptor.to("DamagePhase");

      expect(leadPokemon.turnData.hitCount).toBe(2);
      expect(enemyPokemon.status?.effect).toBe(StatusEffect.SLEEP);

      await game.phaseInterceptor.to("BerryPhase", false);

      expect(enemyPokemon.status?.effect).toBeUndefined();
    }, TIMEOUT
  );

  it(
    "should not cause user to hit into King's Shield more than once",
    async () => {
      game.override.moveset([Moves.TACKLE]);
      game.override.enemyMoveset(Array(4).fill(Moves.KINGS_SHIELD));

      await game.classicMode.startBattle([Species.MAGIKARP]);

      const leadPokemon = game.scene.getPlayerPokemon()!;

      game.move.select(Moves.TACKLE);

      await game.phaseInterceptor.to("BerryPhase", false);

      expect(leadPokemon.getStatStage(Stat.ATK)).toBe(-1);
    }, TIMEOUT
  );

  it(
    "should not cause user to hit into Storm Drain more than once",
    async () => {
      game.override.moveset([Moves.WATER_GUN]);
      game.override.enemyAbility(Abilities.STORM_DRAIN);

      await game.classicMode.startBattle([Species.MAGIKARP]);

      const enemyPokemon = game.scene.getEnemyPokemon()!;

      game.move.select(Moves.WATER_GUN);

      await game.phaseInterceptor.to("BerryPhase", false);

      expect(enemyPokemon.getStatStage(Stat.SPATK)).toBe(1);
    }, TIMEOUT
  );

  it(
    "should not apply to multi-target moves with Multi-Lens",
    async () => {
      game.override.battleType("double");
      game.override.moveset([Moves.EARTHQUAKE, Moves.SPLASH]);
      game.override.passiveAbility(Abilities.LEVITATE);
      game.override.startingHeldItems([{ name: "MULTI_LENS", count: 1 }]);

      await game.classicMode.startBattle([Species.MAGIKARP, Species.FEEBAS]);

      const enemyPokemon = game.scene.getEnemyField();

      const enemyStartingHp = enemyPokemon.map(p => p.hp);

      game.move.select(Moves.EARTHQUAKE);
      game.move.select(Moves.SPLASH, 1);

      await game.phaseInterceptor.to("DamagePhase");
      const enemyFirstHitDamage = enemyStartingHp.map((hp, i) => hp - enemyPokemon[i].hp);

      await game.phaseInterceptor.to("BerryPhase", false);

      enemyPokemon.forEach((p, i) => expect(enemyStartingHp[i] - p.hp).toBe(2 * enemyFirstHitDamage[i]));
    }, TIMEOUT
  );
});
