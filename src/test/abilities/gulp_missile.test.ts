import { BattlerTagType } from "#app/enums/battler-tag-type.js";
import {
  MoveEndPhase,
  TurnEndPhase,
  TurnStartPhase,
} from "#app/phases";
import GameManager from "#app/test/utils/gameManager";
import { getMovePosition } from "#app/test/utils/gameManagerUtils";
import { Abilities } from "#enums/abilities";
import { Moves } from "#enums/moves";
import { Species } from "#enums/species";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { SPLASH_ONLY } from "../utils/testUtils";
import { BattleStat } from "#app/data/battle-stat.js";
import { StatusEffect } from "#app/enums/status-effect.js";

describe("Abilities - Gulp Missile", () => {
  let phaserGame: Phaser.Game;
  let game: GameManager;
  const NORMAL_FORM = 0;
  const GULPING_FORM = 1;
  const GORGING_FORM = 2;

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
    const cramorant = game.scene.getPlayerPokemon();

    game.doAttack(getMovePosition(game.scene, 0, Moves.DIVE));
    await game.toNextTurn();
    game.doAttack(getMovePosition(game.scene, 0, Moves.DIVE));
    await game.phaseInterceptor.to(MoveEndPhase);

    expect(cramorant.getHpRatio()).toBeGreaterThanOrEqual(.5);
    expect(cramorant.getTag(BattlerTagType.GULP_MISSILE_ARROKUDA)).toBeDefined();
    expect(cramorant.formIndex).toBe(GULPING_FORM);
  });

  it("changes to Gorging Form if HP is under half when Surf or Dive is used", async () => {
    await game.startBattle([Species.CRAMORANT]);
    const cramorant = game.scene.getPlayerPokemon();

    vi.spyOn(cramorant, "getHpRatio").mockReturnValue(.49);
    expect(cramorant.getHpRatio()).toBe(.49);

    game.doAttack(getMovePosition(game.scene, 0, Moves.SURF));
    await game.phaseInterceptor.to(MoveEndPhase);

    expect(cramorant.getTag(BattlerTagType.GULP_MISSILE_PIKACHU)).toBeDefined();
    expect(cramorant.formIndex).toBe(GORGING_FORM);
  });

  it("deals ¼ of the attacker's maximum HP when hit by a damaging attack", async () => {
    game.override.enemyMoveset(Array(4).fill(Moves.TACKLE));
    await game.startBattle([Species.CRAMORANT]);

    const enemy = game.scene.getEnemyPokemon();
    vi.spyOn(enemy, "damageAndUpdate");

    game.doAttack(getMovePosition(game.scene, 0, Moves.SURF));
    await game.phaseInterceptor.to(TurnEndPhase);

    expect(enemy.damageAndUpdate).toHaveReturnedWith(Math.floor(enemy.getMaxHp() * 1/4));
  });

  it("does not have any effect when hit by non-damaging attack", async () => {
    game.override.enemyMoveset(Array(4).fill(Moves.TAIL_WHIP));
    await game.startBattle([Species.CRAMORANT]);

    const cramorant = game.scene.getPlayerPokemon();
    vi.spyOn(cramorant, "getHpRatio").mockReturnValue(.55);

    game.doAttack(getMovePosition(game.scene, 0, Moves.SURF));
    await game.phaseInterceptor.to(MoveEndPhase);

    expect(cramorant.getTag(BattlerTagType.GULP_MISSILE_ARROKUDA)).toBeDefined();
    expect(cramorant.formIndex).toBe(GULPING_FORM);

    await game.phaseInterceptor.to(TurnEndPhase);

    expect(cramorant.getTag(BattlerTagType.GULP_MISSILE_ARROKUDA)).toBeDefined();
    expect(cramorant.formIndex).toBe(GULPING_FORM);
  });

  it("lowers the attacker's Defense by 1 stage when hit in Gulping form", async () => {
    game.override.enemyMoveset(Array(4).fill(Moves.TACKLE));
    await game.startBattle([Species.CRAMORANT]);

    const cramorant = game.scene.getPlayerPokemon();
    const enemy = game.scene.getEnemyPokemon();

    vi.spyOn(enemy, "damageAndUpdate");
    vi.spyOn(cramorant, "getHpRatio").mockReturnValue(.55);

    game.doAttack(getMovePosition(game.scene, 0, Moves.SURF));
    await game.phaseInterceptor.to(MoveEndPhase);

    expect(cramorant.getTag(BattlerTagType.GULP_MISSILE_ARROKUDA)).toBeDefined();
    expect(cramorant.formIndex).toBe(GULPING_FORM);

    await game.phaseInterceptor.to(TurnEndPhase);

    expect(enemy.damageAndUpdate).toHaveReturnedWith(Math.floor(enemy.getMaxHp() * 1/4));
    expect(enemy.summonData.battleStats[BattleStat.DEF]).toBe(-1);
    expect(cramorant.getTag(BattlerTagType.GULP_MISSILE_ARROKUDA)).toBeUndefined();
    expect(cramorant.formIndex).toBe(NORMAL_FORM);
  });

  it("paralyzes the enemy when hit in Gorging form", async () => {
    game.override.enemyMoveset(Array(4).fill(Moves.TACKLE));
    await game.startBattle([Species.CRAMORANT]);

    const cramorant = game.scene.getPlayerPokemon();
    const enemy = game.scene.getEnemyPokemon();

    vi.spyOn(enemy, "damageAndUpdate");
    vi.spyOn(cramorant, "getHpRatio").mockReturnValue(.45);

    game.doAttack(getMovePosition(game.scene, 0, Moves.SURF));
    await game.phaseInterceptor.to(MoveEndPhase);

    expect(cramorant.getTag(BattlerTagType.GULP_MISSILE_PIKACHU)).toBeDefined();
    expect(cramorant.formIndex).toBe(GORGING_FORM);

    await game.phaseInterceptor.to(TurnEndPhase);

    expect(enemy.damageAndUpdate).toHaveReturnedWith(Math.floor(enemy.getMaxHp() * 1/4));
    expect(enemy.status.effect).toBe(StatusEffect.PARALYSIS);
    expect(cramorant.getTag(BattlerTagType.GULP_MISSILE_PIKACHU)).toBeUndefined();
    expect(cramorant.formIndex).toBe(NORMAL_FORM);
  });

  it("cannot be suppressed", async () => {
    game.override.enemyMoveset(Array(4).fill(Moves.GASTRO_ACID));
    await game.startBattle([Species.CRAMORANT]);

    const cramorant = game.scene.getPlayerPokemon();
    vi.spyOn(cramorant, "getHpRatio").mockReturnValue(.55);

    game.doAttack(getMovePosition(game.scene, 0, Moves.SURF));
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

    const cramorant = game.scene.getPlayerPokemon();
    vi.spyOn(cramorant, "getHpRatio").mockReturnValue(.55);

    game.doAttack(getMovePosition(game.scene, 0, Moves.SURF));
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
    game.doAttack(getMovePosition(game.scene, 0, Moves.SPLASH));
    await game.phaseInterceptor.to(TurnStartPhase);

    expect(game.scene.getEnemyPokemon().hasAbility(Abilities.GULP_MISSILE)).toBe(false);
  });
});
