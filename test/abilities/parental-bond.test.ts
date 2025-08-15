import { AbilityId } from "#enums/ability-id";
import { BattlerTagType } from "#enums/battler-tag-type";
import { MoveId } from "#enums/move-id";
import { PokemonType } from "#enums/pokemon-type";
import { SpeciesId } from "#enums/species-id";
import { Stat } from "#enums/stat";
import { StatusEffect } from "#enums/status-effect";
import { GameManager } from "#test/test-utils/game-manager";
import { toDmgValue } from "#utils/common";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

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
    game.override
      .battleStyle("single")
      .criticalHits(false)
      .ability(AbilityId.PARENTAL_BOND)
      .enemySpecies(SpeciesId.SNORLAX)
      .enemyAbility(AbilityId.FUR_COAT)
      .enemyMoveset(MoveId.SPLASH)
      .startingLevel(100)
      .enemyLevel(100);
  });

  it("should add second strike to attack move", async () => {
    game.override.moveset([MoveId.TACKLE]);

    await game.classicMode.startBattle([SpeciesId.MAGIKARP]);

    const leadPokemon = game.field.getPlayerPokemon();
    const enemyPokemon = game.field.getEnemyPokemon();

    let enemyStartingHp = enemyPokemon.hp;

    game.move.select(MoveId.TACKLE);

    await game.phaseInterceptor.to("DamageAnimPhase");
    const firstStrikeDamage = enemyStartingHp - enemyPokemon.hp;
    enemyStartingHp = enemyPokemon.hp;

    await game.phaseInterceptor.to("BerryPhase", false);

    const secondStrikeDamage = enemyStartingHp - enemyPokemon.hp;

    expect(leadPokemon.turnData.hitCount).toBe(2);
    expect(secondStrikeDamage).toBe(toDmgValue(0.25 * firstStrikeDamage));
  });

  it("should apply secondary effects to both strikes", async () => {
    game.override.moveset([MoveId.POWER_UP_PUNCH]).enemySpecies(SpeciesId.AMOONGUSS);

    await game.classicMode.startBattle([SpeciesId.MAGIKARP]);

    const leadPokemon = game.field.getPlayerPokemon();

    game.move.select(MoveId.POWER_UP_PUNCH);

    await game.phaseInterceptor.to("BerryPhase", false);

    expect(leadPokemon.turnData.hitCount).toBe(2);
    expect(leadPokemon.getStatStage(Stat.ATK)).toBe(2);
  });

  it("should not apply to Status moves", async () => {
    game.override.moveset([MoveId.BABY_DOLL_EYES]);

    await game.classicMode.startBattle([SpeciesId.MAGIKARP]);

    const enemyPokemon = game.field.getEnemyPokemon();

    game.move.select(MoveId.BABY_DOLL_EYES);

    await game.phaseInterceptor.to("BerryPhase", false);

    expect(enemyPokemon.getStatStage(Stat.ATK)).toBe(-1);
  });

  it("should not apply to multi-hit moves", async () => {
    game.override.moveset([MoveId.DOUBLE_HIT]);

    await game.classicMode.startBattle([SpeciesId.MAGIKARP]);

    const leadPokemon = game.field.getPlayerPokemon();

    game.move.select(MoveId.DOUBLE_HIT);
    await game.move.forceHit();

    await game.phaseInterceptor.to("BerryPhase", false);

    expect(leadPokemon.turnData.hitCount).toBe(2);
  });

  it("should not apply to self-sacrifice moves", async () => {
    game.override.moveset([MoveId.SELF_DESTRUCT]);

    await game.classicMode.startBattle([SpeciesId.MAGIKARP]);

    const leadPokemon = game.field.getPlayerPokemon();

    game.move.select(MoveId.SELF_DESTRUCT);

    await game.phaseInterceptor.to("DamageAnimPhase", false);

    expect(leadPokemon.turnData.hitCount).toBe(1);
  });

  it("should not apply to Rollout", async () => {
    game.override.moveset([MoveId.ROLLOUT]);

    await game.classicMode.startBattle([SpeciesId.MAGIKARP]);

    const leadPokemon = game.field.getPlayerPokemon();

    game.move.select(MoveId.ROLLOUT);
    await game.move.forceHit();

    await game.phaseInterceptor.to("DamageAnimPhase", false);

    expect(leadPokemon.turnData.hitCount).toBe(1);
  });

  it("should not apply multiplier to fixed-damage moves", async () => {
    game.override.moveset([MoveId.DRAGON_RAGE]);

    await game.classicMode.startBattle([SpeciesId.MAGIKARP]);

    const enemyPokemon = game.field.getEnemyPokemon();

    game.move.select(MoveId.DRAGON_RAGE);
    await game.phaseInterceptor.to("BerryPhase", false);

    expect(enemyPokemon.hp).toBe(enemyPokemon.getMaxHp() - 80);
  });

  it("should not apply multiplier to counter moves", async () => {
    game.override.moveset([MoveId.COUNTER]).enemyMoveset([MoveId.TACKLE]);

    await game.classicMode.startBattle([SpeciesId.SHUCKLE]);

    const leadPokemon = game.field.getPlayerPokemon();
    const enemyPokemon = game.field.getEnemyPokemon();

    game.move.select(MoveId.COUNTER);
    await game.phaseInterceptor.to("DamageAnimPhase");

    const playerDamage = leadPokemon.getMaxHp() - leadPokemon.hp;

    await game.phaseInterceptor.to("BerryPhase", false);

    expect(enemyPokemon.hp).toBe(enemyPokemon.getMaxHp() - 4 * playerDamage);
  });

  it("should not apply to multi-target moves", async () => {
    game.override.battleStyle("double").moveset([MoveId.EARTHQUAKE]).passiveAbility(AbilityId.LEVITATE);

    await game.classicMode.startBattle([SpeciesId.MAGIKARP, SpeciesId.FEEBAS]);

    const playerPokemon = game.scene.getPlayerField();

    game.move.select(MoveId.EARTHQUAKE);
    game.move.select(MoveId.EARTHQUAKE, 1);

    await game.phaseInterceptor.to("BerryPhase", false);

    playerPokemon.forEach(p => expect(p.turnData.hitCount).toBe(1));
  });

  it("should apply to multi-target moves when hitting only one target", async () => {
    game.override.moveset([MoveId.EARTHQUAKE]);

    await game.classicMode.startBattle([SpeciesId.MAGIKARP]);

    const leadPokemon = game.field.getPlayerPokemon();

    game.move.select(MoveId.EARTHQUAKE);
    await game.phaseInterceptor.to("DamageAnimPhase", false);

    expect(leadPokemon.turnData.hitCount).toBe(2);
  });

  // TODO: consolidate all these tests into 1 block
  it("should only trigger post-target move effects once", async () => {
    game.override.moveset([MoveId.MIND_BLOWN]);

    await game.classicMode.startBattle([SpeciesId.MAGIKARP]);

    const leadPokemon = game.field.getPlayerPokemon();

    game.move.select(MoveId.MIND_BLOWN);

    await game.phaseInterceptor.to("DamageAnimPhase", false);

    expect(leadPokemon.turnData.hitCount).toBe(2);

    // This test will time out if the user faints
    await game.phaseInterceptor.to("BerryPhase", false);

    expect(leadPokemon.hp).toBe(Math.ceil(leadPokemon.getMaxHp() / 2));
  });

  it("Burn Up only removes type after the second strike", async () => {
    game.override.moveset([MoveId.BURN_UP]);

    await game.classicMode.startBattle([SpeciesId.CHARIZARD]);

    const leadPokemon = game.field.getPlayerPokemon();
    const enemyPokemon = game.field.getEnemyPokemon();

    game.move.select(MoveId.BURN_UP);

    await game.phaseInterceptor.to("MoveEffectPhase");

    expect(leadPokemon.turnData.hitCount).toBe(2);
    expect(enemyPokemon.hp).toBeGreaterThan(0);
    expect(leadPokemon.isOfType(PokemonType.FIRE)).toBe(true);

    await game.phaseInterceptor.to("BerryPhase", false);

    expect(leadPokemon.isOfType(PokemonType.FIRE)).toBe(false);
  });

  it("Hyper Beam boosted by this ability should strike twice, then recharge", async () => {
    game.override.moveset([MoveId.HYPER_BEAM]);

    await game.classicMode.startBattle([SpeciesId.MAGIKARP]);

    const leadPokemon = game.field.getPlayerPokemon();

    game.move.select(MoveId.HYPER_BEAM);
    await game.move.forceHit();

    await game.phaseInterceptor.to("DamageAnimPhase");

    expect(leadPokemon.turnData.hitCount).toBe(2);
    expect(leadPokemon.getTag(BattlerTagType.RECHARGING)).toBeUndefined();

    await game.phaseInterceptor.to("TurnEndPhase");

    expect(leadPokemon.getTag(BattlerTagType.RECHARGING)).toBeDefined();
  });

  it("Anchor Shot boosted by this ability should only trap the target after the second hit", async () => {
    game.override.moveset([MoveId.ANCHOR_SHOT]);

    await game.classicMode.startBattle([SpeciesId.MAGIKARP]);

    const leadPokemon = game.field.getPlayerPokemon();
    const enemyPokemon = game.field.getEnemyPokemon();

    game.move.select(MoveId.ANCHOR_SHOT);
    await game.move.forceHit();

    await game.phaseInterceptor.to("DamageAnimPhase");

    expect(leadPokemon.turnData.hitCount).toBe(2);
    expect(enemyPokemon.getTag(BattlerTagType.TRAPPED)).toBeUndefined();

    await game.phaseInterceptor.to("MoveEndPhase");
    expect(enemyPokemon.getTag(BattlerTagType.TRAPPED)).toBeDefined();

    await game.phaseInterceptor.to("TurnEndPhase");

    expect(enemyPokemon.getTag(BattlerTagType.TRAPPED)).toBeDefined();
  });

  it("Smack Down boosted by this ability should only ground the target after the second hit", async () => {
    game.override.moveset([MoveId.SMACK_DOWN]);

    await game.classicMode.startBattle([SpeciesId.MAGIKARP]);

    const leadPokemon = game.field.getPlayerPokemon();
    const enemyPokemon = game.field.getEnemyPokemon();

    game.move.select(MoveId.SMACK_DOWN);
    await game.move.forceHit();

    await game.phaseInterceptor.to("DamageAnimPhase");

    expect(leadPokemon.turnData.hitCount).toBe(2);
    expect(enemyPokemon.getTag(BattlerTagType.IGNORE_FLYING)).toBeUndefined();

    await game.phaseInterceptor.to("TurnEndPhase");

    expect(enemyPokemon.getTag(BattlerTagType.IGNORE_FLYING)).toBeDefined();
  });

  it("U-turn boosted by this ability should strike twice before forcing a switch", async () => {
    game.override.moveset([MoveId.U_TURN]);

    await game.classicMode.startBattle([SpeciesId.MAGIKARP, SpeciesId.BLASTOISE]);

    const leadPokemon = game.field.getPlayerPokemon();

    game.move.select(MoveId.U_TURN);
    await game.move.forceHit();

    await game.phaseInterceptor.to("MoveEffectPhase");
    expect(leadPokemon.turnData.hitCount).toBe(2);

    // This will cause this test to time out if the switch was forced on the first hit.
    await game.phaseInterceptor.to("MoveEffectPhase", false);
  });

  it("Wake-Up Slap boosted by this ability should only wake up the target after the second hit", async () => {
    game.override.moveset([MoveId.WAKE_UP_SLAP]).enemyStatusEffect(StatusEffect.SLEEP);

    await game.classicMode.startBattle([SpeciesId.MAGIKARP]);

    const leadPokemon = game.field.getPlayerPokemon();
    const enemyPokemon = game.field.getEnemyPokemon();

    game.move.select(MoveId.WAKE_UP_SLAP);
    await game.move.forceHit();

    await game.phaseInterceptor.to("DamageAnimPhase");

    expect(leadPokemon.turnData.hitCount).toBe(2);
    expect(enemyPokemon.status?.effect).toBe(StatusEffect.SLEEP);

    await game.phaseInterceptor.to("BerryPhase", false);

    expect(enemyPokemon.status?.effect).toBeUndefined();
  });

  it("should not cause user to hit into King's Shield more than once", async () => {
    game.override.moveset([MoveId.TACKLE]).enemyMoveset([MoveId.KINGS_SHIELD]);

    await game.classicMode.startBattle([SpeciesId.MAGIKARP]);

    const leadPokemon = game.field.getPlayerPokemon();

    game.move.select(MoveId.TACKLE);

    await game.phaseInterceptor.to("BerryPhase", false);

    expect(leadPokemon.getStatStage(Stat.ATK)).toBe(-1);
  });

  it("should not cause user to hit into Storm Drain more than once", async () => {
    game.override.moveset([MoveId.WATER_GUN]).enemyAbility(AbilityId.STORM_DRAIN);

    await game.classicMode.startBattle([SpeciesId.MAGIKARP]);

    const enemyPokemon = game.field.getEnemyPokemon();

    game.move.select(MoveId.WATER_GUN);

    await game.phaseInterceptor.to("BerryPhase", false);

    expect(enemyPokemon.getStatStage(Stat.SPATK)).toBe(1);
  });

  it("should not allow Future Sight to hit infinitely many times if the user switches out", async () => {
    game.override.enemyLevel(1000).moveset(MoveId.FUTURE_SIGHT);
    await game.classicMode.startBattle([SpeciesId.BULBASAUR, SpeciesId.CHARMANDER, SpeciesId.SQUIRTLE]);

    const enemyPokemon = game.field.getEnemyPokemon();
    vi.spyOn(enemyPokemon, "damageAndUpdate");

    game.move.select(MoveId.FUTURE_SIGHT);
    await game.toNextTurn();

    game.doSwitchPokemon(1);
    await game.toNextTurn();

    game.doSwitchPokemon(2);
    await game.toNextTurn();

    // TODO: Update hit count to 1 once Future Sight is fixed to not activate abilities if user is off the field
    expect(enemyPokemon.damageAndUpdate).toHaveBeenCalledTimes(2);
  });
});
