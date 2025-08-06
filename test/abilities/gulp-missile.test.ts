import { AbilityId } from "#enums/ability-id";
import { BattlerIndex } from "#enums/battler-index";
import { BattlerTagType } from "#enums/battler-tag-type";
import { MoveId } from "#enums/move-id";
import { SpeciesId } from "#enums/species-id";
import { Stat } from "#enums/stat";
import { StatusEffect } from "#enums/status-effect";
import type { Pokemon } from "#field/pokemon";
import { GameManager } from "#test/test-utils/game-manager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

describe("Abilities - Gulp Missile", () => {
  let phaserGame: Phaser.Game;
  let game: GameManager;

  const NORMAL_FORM = 0;
  const GULPING_FORM = 1;
  const GORGING_FORM = 2;

  /**
   * Gets the effect damage of Gulp Missile
   * See Gulp Missile {@link https://bulbapedia.bulbagarden.net/wiki/Gulp_Missile_(Ability)}
   * @param {Pokemon} pokemon The pokemon taking the effect damage.
   * @returns The effect damage of Gulp Missile
   */
  const getEffectDamage = (pokemon: Pokemon): number => {
    return Math.max(1, Math.floor((pokemon.getMaxHp() * 1) / 4));
  };

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
      .criticalHits(false)
      .battleStyle("single")
      .moveset([MoveId.SURF, MoveId.DIVE, MoveId.SPLASH, MoveId.SUBSTITUTE])
      .enemySpecies(SpeciesId.SNORLAX)
      .enemyAbility(AbilityId.BALL_FETCH)
      .enemyMoveset(MoveId.SPLASH)
      .enemyLevel(5);
  });

  it("changes to Gulping Form if HP is over half when Surf or Dive is used", async () => {
    await game.classicMode.startBattle([SpeciesId.CRAMORANT]);
    const cramorant = game.field.getPlayerPokemon();

    game.move.select(MoveId.DIVE);
    await game.toNextTurn();
    game.move.select(MoveId.DIVE);
    await game.phaseInterceptor.to("MoveEndPhase");

    expect(cramorant.getHpRatio()).toBeGreaterThanOrEqual(0.5);
    expect(cramorant.getTag(BattlerTagType.GULP_MISSILE_ARROKUDA)).toBeDefined();
    expect(cramorant.formIndex).toBe(GULPING_FORM);
  });

  it("changes to Gorging Form if HP is under half when Surf or Dive is used", async () => {
    await game.classicMode.startBattle([SpeciesId.CRAMORANT]);
    const cramorant = game.field.getPlayerPokemon();

    vi.spyOn(cramorant, "getHpRatio").mockReturnValue(0.49);
    expect(cramorant.getHpRatio()).toBe(0.49);

    game.move.select(MoveId.SURF);
    await game.phaseInterceptor.to("MoveEndPhase");

    expect(cramorant.getTag(BattlerTagType.GULP_MISSILE_PIKACHU)).toBeDefined();
    expect(cramorant.formIndex).toBe(GORGING_FORM);
  });

  it("changes to base form when switched out after Surf or Dive is used", async () => {
    await game.classicMode.startBattle([SpeciesId.CRAMORANT, SpeciesId.MAGIKARP]);
    const cramorant = game.field.getPlayerPokemon();

    game.move.select(MoveId.SURF);
    await game.toNextTurn();

    game.doSwitchPokemon(1);
    await game.toNextTurn(); // form change is delayed until after end of turn

    expect(cramorant.formIndex).toBe(NORMAL_FORM);
    expect(cramorant.getTag(BattlerTagType.GULP_MISSILE_ARROKUDA)).toBeUndefined();
    expect(cramorant.getTag(BattlerTagType.GULP_MISSILE_PIKACHU)).toBeUndefined();
  });

  it("changes form during Dive's charge turn", async () => {
    await game.classicMode.startBattle([SpeciesId.CRAMORANT]);
    const cramorant = game.field.getPlayerPokemon();

    game.move.select(MoveId.DIVE);
    await game.phaseInterceptor.to("MoveEndPhase");

    expect(cramorant.getTag(BattlerTagType.GULP_MISSILE_ARROKUDA)).toBeDefined();
    expect(cramorant.formIndex).toBe(GULPING_FORM);
  });

  it("deals 1/4 of the attacker's maximum HP when hit by a damaging attack", async () => {
    game.override.enemyMoveset(MoveId.TACKLE);
    await game.classicMode.startBattle([SpeciesId.CRAMORANT]);

    const enemy = game.field.getEnemyPokemon();
    vi.spyOn(enemy, "damageAndUpdate");

    game.move.select(MoveId.SURF);
    await game.phaseInterceptor.to("TurnEndPhase");

    expect(enemy.damageAndUpdate).toHaveReturnedWith(getEffectDamage(enemy));
  });

  it("does not have any effect when hit by non-damaging attack", async () => {
    game.override.enemyMoveset(MoveId.TAIL_WHIP);
    await game.classicMode.startBattle([SpeciesId.CRAMORANT]);

    const cramorant = game.field.getPlayerPokemon();
    vi.spyOn(cramorant, "getHpRatio").mockReturnValue(0.55);

    game.move.select(MoveId.SURF);
    await game.phaseInterceptor.to("MoveEndPhase");

    expect(cramorant.getTag(BattlerTagType.GULP_MISSILE_ARROKUDA)).toBeDefined();
    expect(cramorant.formIndex).toBe(GULPING_FORM);

    await game.phaseInterceptor.to("TurnEndPhase");

    expect(cramorant.getTag(BattlerTagType.GULP_MISSILE_ARROKUDA)).toBeDefined();
    expect(cramorant.formIndex).toBe(GULPING_FORM);
  });

  it("lowers attacker's DEF stat stage by 1 when hit in Gulping form", async () => {
    game.override.enemyMoveset(MoveId.TACKLE);
    await game.classicMode.startBattle([SpeciesId.CRAMORANT]);

    const cramorant = game.field.getPlayerPokemon();
    const enemy = game.field.getEnemyPokemon();

    vi.spyOn(enemy, "damageAndUpdate");
    vi.spyOn(cramorant, "getHpRatio").mockReturnValue(0.55);

    game.move.select(MoveId.SURF);
    await game.phaseInterceptor.to("MoveEndPhase");

    expect(cramorant.getTag(BattlerTagType.GULP_MISSILE_ARROKUDA)).toBeDefined();
    expect(cramorant.formIndex).toBe(GULPING_FORM);

    await game.phaseInterceptor.to("TurnEndPhase");

    expect(enemy.damageAndUpdate).toHaveReturnedWith(getEffectDamage(enemy));
    expect(enemy.getStatStage(Stat.DEF)).toBe(-1);
    expect(cramorant.getTag(BattlerTagType.GULP_MISSILE_ARROKUDA)).toBeUndefined();
    expect(cramorant.formIndex).toBe(NORMAL_FORM);
  });

  it("paralyzes the enemy when hit in Gorging form", async () => {
    game.override.enemyMoveset(MoveId.TACKLE);
    await game.classicMode.startBattle([SpeciesId.CRAMORANT]);

    const cramorant = game.field.getPlayerPokemon();
    const enemy = game.field.getEnemyPokemon();

    vi.spyOn(enemy, "damageAndUpdate");
    vi.spyOn(cramorant, "getHpRatio").mockReturnValue(0.45);

    game.move.select(MoveId.SURF);
    await game.phaseInterceptor.to("MoveEndPhase");

    expect(cramorant.getTag(BattlerTagType.GULP_MISSILE_PIKACHU)).toBeDefined();
    expect(cramorant.formIndex).toBe(GORGING_FORM);

    await game.phaseInterceptor.to("TurnEndPhase");

    expect(enemy.damageAndUpdate).toHaveReturnedWith(getEffectDamage(enemy));
    expect(enemy.status?.effect).toBe(StatusEffect.PARALYSIS);
    expect(cramorant.getTag(BattlerTagType.GULP_MISSILE_PIKACHU)).toBeUndefined();
    expect(cramorant.formIndex).toBe(NORMAL_FORM);
  });

  it("does not activate the ability when underwater", async () => {
    game.override.enemyMoveset(MoveId.SURF);
    await game.classicMode.startBattle([SpeciesId.CRAMORANT]);

    const cramorant = game.field.getPlayerPokemon();

    game.move.select(MoveId.DIVE);
    await game.phaseInterceptor.to("BerryPhase", false);

    expect(cramorant.getTag(BattlerTagType.GULP_MISSILE_ARROKUDA)).toBeDefined();
    expect(cramorant.formIndex).toBe(GULPING_FORM);
  });

  it("prevents effect damage but inflicts secondary effect on attacker with Magic Guard", async () => {
    game.override.enemyMoveset(MoveId.TACKLE).enemyAbility(AbilityId.MAGIC_GUARD);
    await game.classicMode.startBattle([SpeciesId.CRAMORANT]);

    const cramorant = game.field.getPlayerPokemon();
    const enemy = game.field.getEnemyPokemon();

    vi.spyOn(cramorant, "getHpRatio").mockReturnValue(0.55);

    game.move.select(MoveId.SURF);
    await game.phaseInterceptor.to("MoveEndPhase");
    const enemyHpPreEffect = enemy.hp;

    expect(cramorant.getTag(BattlerTagType.GULP_MISSILE_ARROKUDA)).toBeDefined();
    expect(cramorant.formIndex).toBe(GULPING_FORM);

    await game.phaseInterceptor.to("TurnEndPhase");

    expect(enemy.hp).toBe(enemyHpPreEffect);
    expect(enemy.getStatStage(Stat.DEF)).toBe(-1);
    expect(cramorant.getTag(BattlerTagType.GULP_MISSILE_ARROKUDA)).toBeUndefined();
    expect(cramorant.formIndex).toBe(NORMAL_FORM);
  });

  it("activates on faint", async () => {
    game.override.enemyMoveset(MoveId.THUNDERBOLT);
    await game.classicMode.startBattle([SpeciesId.CRAMORANT]);

    const cramorant = game.field.getPlayerPokemon();

    game.move.select(MoveId.SURF);
    await game.phaseInterceptor.to("FaintPhase");

    expect(cramorant.hp).toBe(0);
    expect(cramorant.getTag(BattlerTagType.GULP_MISSILE_ARROKUDA)).toBeUndefined();
    expect(cramorant.formIndex).toBe(NORMAL_FORM);
    expect(game.field.getEnemyPokemon().getStatStage(Stat.DEF)).toBe(-1);
  });

  it("doesn't trigger if user is behind a substitute", async () => {
    game.override.enemyAbility(AbilityId.STURDY).enemyMoveset([MoveId.SPLASH, MoveId.POWER_TRIP]);
    await game.classicMode.startBattle([SpeciesId.CRAMORANT]);

    game.move.select(MoveId.SURF);
    await game.move.selectEnemyMove(MoveId.SPLASH);
    await game.toNextTurn();

    expect(game.field.getPlayerPokemon().formIndex).toBe(GULPING_FORM);

    game.move.select(MoveId.SUBSTITUTE);
    await game.move.selectEnemyMove(MoveId.POWER_TRIP);
    await game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.ENEMY]);
    await game.toNextTurn();

    expect(game.field.getPlayerPokemon().formIndex).toBe(GULPING_FORM);
  });

  it("cannot be suppressed", async () => {
    game.override.enemyMoveset(MoveId.GASTRO_ACID);
    await game.classicMode.startBattle([SpeciesId.CRAMORANT]);

    const cramorant = game.field.getPlayerPokemon();
    vi.spyOn(cramorant, "getHpRatio").mockReturnValue(0.55);

    game.move.select(MoveId.SURF);
    await game.phaseInterceptor.to("MoveEndPhase");

    expect(cramorant.getTag(BattlerTagType.GULP_MISSILE_ARROKUDA)).toBeDefined();
    expect(cramorant.formIndex).toBe(GULPING_FORM);

    await game.phaseInterceptor.to("TurnEndPhase");

    expect(cramorant.hasAbility(AbilityId.GULP_MISSILE)).toBe(true);
    expect(cramorant.getTag(BattlerTagType.GULP_MISSILE_ARROKUDA)).toBeDefined();
    expect(cramorant.formIndex).toBe(GULPING_FORM);
  });

  it("cannot be swapped with another ability", async () => {
    game.override.enemyMoveset(MoveId.SKILL_SWAP);
    await game.classicMode.startBattle([SpeciesId.CRAMORANT]);

    const cramorant = game.field.getPlayerPokemon();
    vi.spyOn(cramorant, "getHpRatio").mockReturnValue(0.55);

    game.move.select(MoveId.SURF);
    await game.phaseInterceptor.to("MoveEndPhase");

    expect(cramorant.getTag(BattlerTagType.GULP_MISSILE_ARROKUDA)).toBeDefined();
    expect(cramorant.formIndex).toBe(GULPING_FORM);

    await game.phaseInterceptor.to("TurnEndPhase");

    expect(cramorant.hasAbility(AbilityId.GULP_MISSILE)).toBe(true);
    expect(cramorant.getTag(BattlerTagType.GULP_MISSILE_ARROKUDA)).toBeDefined();
    expect(cramorant.formIndex).toBe(GULPING_FORM);
  });

  it("cannot be copied", async () => {
    game.override.enemyAbility(AbilityId.TRACE);

    await game.classicMode.startBattle([SpeciesId.CRAMORANT]);
    game.move.select(MoveId.SPLASH);
    await game.phaseInterceptor.to("TurnStartPhase");

    expect(game.field.getEnemyPokemon().hasAbility(AbilityId.GULP_MISSILE)).toBe(false);
  });
});
