import { BattlerTagType } from "#app/enums/battler-tag-type";
import { StatusEffect } from "#app/enums/status-effect";
import Pokemon from "#app/field/pokemon";
import { BerryPhase } from "#app/phases/berry-phase";
import { MoveEndPhase } from "#app/phases/move-end-phase";
import { TurnEndPhase } from "#app/phases/turn-end-phase";
import { TurnStartPhase } from "#app/phases/turn-start-phase";
import GameManager from "#app/test/utils/gameManager";
import { Abilities } from "#enums/abilities";
import { Moves } from "#enums/moves";
import { Species } from "#enums/species";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { SPLASH_ONLY } from "../utils/testUtils";
import { Stat } from "#enums/stat";

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
    return Math.max(1, Math.floor(pokemon.getMaxHp() * 1 / 4));
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
      .battleType("single")
      .moveset([Moves.SURF, Moves.DIVE, Moves.SPLASH])
      .enemySpecies(Species.SNORLAX)
      .enemyAbility(Abilities.BALL_FETCH)
      .enemyMoveset(SPLASH_ONLY)
      .enemyLevel(5);
  });

  it("changes to Gulping Form if HP is over half when Surf or Dive is used", async () => {
    await game.startBattle([Species.CRAMORANT]);
    const cramorant = game.scene.getPlayerPokemon()!;

    game.move.select(Moves.DIVE);
    await game.toNextTurn();
    game.move.select(Moves.DIVE);
    await game.phaseInterceptor.to(MoveEndPhase);

    expect(cramorant.getHpRatio()).toBeGreaterThanOrEqual(.5);
    expect(cramorant.getTag(BattlerTagType.GULP_MISSILE_ARROKUDA)).toBeDefined();
    expect(cramorant.formIndex).toBe(GULPING_FORM);
  });

  it("changes to Gorging Form if HP is under half when Surf or Dive is used", async () => {
    await game.startBattle([Species.CRAMORANT]);
    const cramorant = game.scene.getPlayerPokemon()!;

    vi.spyOn(cramorant, "getHpRatio").mockReturnValue(.49);
    expect(cramorant.getHpRatio()).toBe(.49);

    game.move.select(Moves.SURF);
    await game.phaseInterceptor.to(MoveEndPhase);

    expect(cramorant.getTag(BattlerTagType.GULP_MISSILE_PIKACHU)).toBeDefined();
    expect(cramorant.formIndex).toBe(GORGING_FORM);
  });

  it("changes to base form when switched out after Surf or Dive is used", async () => {
    await game.startBattle([Species.CRAMORANT, Species.MAGIKARP]);
    const cramorant = game.scene.getPlayerPokemon()!;

    game.move.select(Moves.SURF);
    await game.toNextTurn();

    game.doSwitchPokemon(1);
    await game.toNextTurn(); // form change is delayed until after end of turn

    expect(cramorant.formIndex).toBe(NORMAL_FORM);
    expect(cramorant.getTag(BattlerTagType.GULP_MISSILE_ARROKUDA)).toBeUndefined();
    expect(cramorant.getTag(BattlerTagType.GULP_MISSILE_PIKACHU)).toBeUndefined();
  });

  it("changes form during Dive's charge turn", async () => {
    await game.startBattle([Species.CRAMORANT]);
    const cramorant = game.scene.getPlayerPokemon()!;

    game.move.select(Moves.DIVE);
    await game.phaseInterceptor.to(MoveEndPhase);

    expect(cramorant.getTag(BattlerTagType.GULP_MISSILE_ARROKUDA)).toBeDefined();
    expect(cramorant.formIndex).toBe(GULPING_FORM);
  });

  it("deals 1/4 of the attacker's maximum HP when hit by a damaging attack", async () => {
    game.override.enemyMoveset(Array(4).fill(Moves.TACKLE));
    await game.startBattle([Species.CRAMORANT]);

    const enemy = game.scene.getEnemyPokemon()!;
    vi.spyOn(enemy, "damageAndUpdate");

    game.move.select(Moves.SURF);
    await game.phaseInterceptor.to(TurnEndPhase);

    expect(enemy.damageAndUpdate).toHaveReturnedWith(getEffectDamage(enemy));
  });

  it("does not have any effect when hit by non-damaging attack", async () => {
    game.override.enemyMoveset(Array(4).fill(Moves.TAIL_WHIP));
    await game.startBattle([Species.CRAMORANT]);

    const cramorant = game.scene.getPlayerPokemon()!;
    vi.spyOn(cramorant, "getHpRatio").mockReturnValue(.55);

    game.move.select(Moves.SURF);
    await game.phaseInterceptor.to(MoveEndPhase);

    expect(cramorant.getTag(BattlerTagType.GULP_MISSILE_ARROKUDA)).toBeDefined();
    expect(cramorant.formIndex).toBe(GULPING_FORM);

    await game.phaseInterceptor.to(TurnEndPhase);

    expect(cramorant.getTag(BattlerTagType.GULP_MISSILE_ARROKUDA)).toBeDefined();
    expect(cramorant.formIndex).toBe(GULPING_FORM);
  });

  it("lowers attacker's DEF stat stage by 1 when hit in Gulping form", async () => {
    game.override.enemyMoveset(Array(4).fill(Moves.TACKLE));
    await game.startBattle([Species.CRAMORANT]);

    const cramorant = game.scene.getPlayerPokemon()!;
    const enemy = game.scene.getEnemyPokemon()!;

    vi.spyOn(enemy, "damageAndUpdate");
    vi.spyOn(cramorant, "getHpRatio").mockReturnValue(.55);

    game.move.select(Moves.SURF);
    await game.phaseInterceptor.to(MoveEndPhase);

    expect(cramorant.getTag(BattlerTagType.GULP_MISSILE_ARROKUDA)).toBeDefined();
    expect(cramorant.formIndex).toBe(GULPING_FORM);

    await game.phaseInterceptor.to(TurnEndPhase);

    expect(enemy.damageAndUpdate).toHaveReturnedWith(getEffectDamage(enemy));
    expect(enemy.getStatStage(Stat.DEF)).toBe(-1);
    expect(cramorant.getTag(BattlerTagType.GULP_MISSILE_ARROKUDA)).toBeUndefined();
    expect(cramorant.formIndex).toBe(NORMAL_FORM);
  });

  it("paralyzes the enemy when hit in Gorging form", async () => {
    game.override.enemyMoveset(Array(4).fill(Moves.TACKLE));
    await game.startBattle([Species.CRAMORANT]);

    const cramorant = game.scene.getPlayerPokemon()!;
    const enemy = game.scene.getEnemyPokemon()!;

    vi.spyOn(enemy, "damageAndUpdate");
    vi.spyOn(cramorant, "getHpRatio").mockReturnValue(.45);

    game.move.select(Moves.SURF);
    await game.phaseInterceptor.to(MoveEndPhase);

    expect(cramorant.getTag(BattlerTagType.GULP_MISSILE_PIKACHU)).toBeDefined();
    expect(cramorant.formIndex).toBe(GORGING_FORM);

    await game.phaseInterceptor.to(TurnEndPhase);

    expect(enemy.damageAndUpdate).toHaveReturnedWith(getEffectDamage(enemy));
    expect(enemy.status?.effect).toBe(StatusEffect.PARALYSIS);
    expect(cramorant.getTag(BattlerTagType.GULP_MISSILE_PIKACHU)).toBeUndefined();
    expect(cramorant.formIndex).toBe(NORMAL_FORM);
  });

  it("does not activate the ability when underwater", async () => {
    game.override.enemyMoveset(Array(4).fill(Moves.SURF));
    await game.startBattle([Species.CRAMORANT]);

    const cramorant = game.scene.getPlayerPokemon()!;

    game.move.select(Moves.DIVE);
    await game.phaseInterceptor.to(BerryPhase, false);

    expect(cramorant.getTag(BattlerTagType.GULP_MISSILE_ARROKUDA)).toBeDefined();
    expect(cramorant.formIndex).toBe(GULPING_FORM);
  });

  it("prevents effect damage but inflicts secondary effect on attacker with Magic Guard", async () => {
    game.override.enemyMoveset(Array(4).fill(Moves.TACKLE)).enemyAbility(Abilities.MAGIC_GUARD);
    await game.startBattle([Species.CRAMORANT]);

    const cramorant = game.scene.getPlayerPokemon()!;
    const enemy = game.scene.getEnemyPokemon()!;

    vi.spyOn(cramorant, "getHpRatio").mockReturnValue(.55);

    game.move.select(Moves.SURF);
    await game.phaseInterceptor.to(MoveEndPhase);
    const enemyHpPreEffect = enemy.hp;

    expect(cramorant.getTag(BattlerTagType.GULP_MISSILE_ARROKUDA)).toBeDefined();
    expect(cramorant.formIndex).toBe(GULPING_FORM);

    await game.phaseInterceptor.to(TurnEndPhase);

    expect(enemy.hp).toBe(enemyHpPreEffect);
    expect(enemy.getStatStage(Stat.DEF)).toBe(-1);
    expect(cramorant.getTag(BattlerTagType.GULP_MISSILE_ARROKUDA)).toBeUndefined();
    expect(cramorant.formIndex).toBe(NORMAL_FORM);
  });

  it("cannot be suppressed", async () => {
    game.override.enemyMoveset(Array(4).fill(Moves.GASTRO_ACID));
    await game.startBattle([Species.CRAMORANT]);

    const cramorant = game.scene.getPlayerPokemon()!;
    vi.spyOn(cramorant, "getHpRatio").mockReturnValue(.55);

    game.move.select(Moves.SURF);
    await game.phaseInterceptor.to(MoveEndPhase);

    expect(cramorant.getTag(BattlerTagType.GULP_MISSILE_ARROKUDA)).toBeDefined();
    expect(cramorant.formIndex).toBe(GULPING_FORM);

    await game.phaseInterceptor.to(TurnEndPhase);

    expect(cramorant.hasAbility(Abilities.GULP_MISSILE)).toBe(true);
    expect(cramorant.getTag(BattlerTagType.GULP_MISSILE_ARROKUDA)).toBeDefined();
    expect(cramorant.formIndex).toBe(GULPING_FORM);
  });

  it("cannot be swapped with another ability", async () => {
    game.override.enemyMoveset(Array(4).fill(Moves.SKILL_SWAP));
    await game.startBattle([Species.CRAMORANT]);

    const cramorant = game.scene.getPlayerPokemon()!;
    vi.spyOn(cramorant, "getHpRatio").mockReturnValue(.55);

    game.move.select(Moves.SURF);
    await game.phaseInterceptor.to(MoveEndPhase);

    expect(cramorant.getTag(BattlerTagType.GULP_MISSILE_ARROKUDA)).toBeDefined();
    expect(cramorant.formIndex).toBe(GULPING_FORM);

    await game.phaseInterceptor.to(TurnEndPhase);

    expect(cramorant.hasAbility(Abilities.GULP_MISSILE)).toBe(true);
    expect(cramorant.getTag(BattlerTagType.GULP_MISSILE_ARROKUDA)).toBeDefined();
    expect(cramorant.formIndex).toBe(GULPING_FORM);
  });

  it("cannot be copied", async () => {
    game.override.enemyAbility(Abilities.TRACE);

    await game.startBattle([Species.CRAMORANT]);
    game.move.select(Moves.SPLASH);
    await game.phaseInterceptor.to(TurnStartPhase);

    expect(game.scene.getEnemyPokemon()?.hasAbility(Abilities.GULP_MISSILE)).toBe(false);
  });
});
