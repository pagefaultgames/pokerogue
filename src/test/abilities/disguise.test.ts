import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import GameManager from "#test/utils/gameManager";
import { getMovePosition } from "#test/utils/gameManagerUtils";
import Overrides from "#app/overrides";
import { Moves } from "#enums/moves";
import { Abilities } from "#enums/abilities";
import { Species } from "#enums/species";
import { StatusEffect } from "#app/data/status-effect.js";
import { MoveEffectPhase, MoveEndPhase, TurnEndPhase, TurnInitPhase } from "#app/phases.js";
import { BattleStat } from "#app/data/battle-stat.js";
import { SPLASH_ONLY } from "../utils/testUtils";

const TIMEOUT = 20 * 1000;

describe("Abilities - Disguise", () => {
  let phaserGame: Phaser.Game;
  let game: GameManager;
  const bustedForm = 1;
  const disguisedForm = 0;

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

    game.override.enemySpecies(Species.MIMIKYU);
    game.override.enemyAbility(Abilities.DISGUISE);
    game.override.enemyMoveset(SPLASH_ONLY);

    game.override.starterSpecies(Species.REGIELEKI);
    game.override.moveset([Moves.SHADOW_SNEAK, Moves.VACUUM_WAVE, Moves.TOXIC_THREAD, Moves.SPLASH]);
    game.override.ability(Abilities.UNNERVE);
  }, TIMEOUT);

  it("takes no damage from attacking move and transforms to Busted form, taking 1/8 max HP damage from the disguise breaking", async () => {
    await game.startBattle();

    const mimikyu = game.scene.getEnemyPokemon();
    const maxHp = mimikyu.getMaxHp();
    const disguiseDamage = Math.floor(maxHp / 8);

    expect(mimikyu.formIndex).toBe(disguisedForm);

    game.doAttack(getMovePosition(game.scene, 0, Moves.SHADOW_SNEAK));

    await game.phaseInterceptor.to(MoveEndPhase);

    expect(mimikyu.hp).equals(maxHp - disguiseDamage);
    expect(mimikyu.formIndex).toBe(bustedForm);
  }, TIMEOUT);

  it("doesn't break disguise when attacked with ineffective move", async () => {
    await game.startBattle();

    const mimikyu = game.scene.getEnemyPokemon();

    expect(mimikyu.formIndex).toBe(disguisedForm);

    game.doAttack(getMovePosition(game.scene, 0, Moves.VACUUM_WAVE));

    await game.phaseInterceptor.to(MoveEndPhase);

    expect(mimikyu.formIndex).toBe(disguisedForm);
  }, TIMEOUT);

  it("takes no damage from the first hit of a multihit move and transforms to Busted form, then takes damage from the second hit", async () => {
    vi.spyOn(Overrides, "MOVESET_OVERRIDE", "get").mockReturnValue([Moves.SURGING_STRIKES]);
    vi.spyOn(Overrides, "OPP_LEVEL_OVERRIDE", "get").mockReturnValue(5);
    await game.startBattle();

    const mimikyu = game.scene.getEnemyPokemon();
    const maxHp = mimikyu.getMaxHp();
    const disguiseDamage = Math.floor(maxHp / 8);

    expect(mimikyu.formIndex).toBe(disguisedForm);

    game.doAttack(getMovePosition(game.scene, 0, Moves.SURGING_STRIKES));

    // First hit
    await game.phaseInterceptor.to(MoveEffectPhase);
    expect(mimikyu.hp).equals(maxHp - disguiseDamage);
    expect(mimikyu.formIndex).toBe(disguisedForm);

    // Second hit
    await game.phaseInterceptor.to(MoveEffectPhase);
    expect(mimikyu.hp).lessThan(maxHp - disguiseDamage);
    expect(mimikyu.formIndex).toBe(bustedForm);
  }, TIMEOUT);

  it("takes effects from status moves and damage from status effects", async () => {
    await game.startBattle();

    const mimikyu = game.scene.getEnemyPokemon();
    expect(mimikyu.hp).toBe(mimikyu.getMaxHp());

    game.doAttack(getMovePosition(game.scene, 0, Moves.TOXIC_THREAD));

    await game.phaseInterceptor.to(TurnEndPhase);

    expect(mimikyu.formIndex).toBe(disguisedForm);
    expect(mimikyu.status.effect).toBe(StatusEffect.POISON);
    expect(mimikyu.summonData.battleStats[BattleStat.SPD]).toBe(-1);
    expect(mimikyu.hp).toBeLessThan(mimikyu.getMaxHp());
  }, TIMEOUT);

  it("persists form change when switched out", async () => {
    vi.spyOn(Overrides, "OPP_MOVESET_OVERRIDE", "get").mockReturnValue([Moves.SHADOW_SNEAK, Moves.SHADOW_SNEAK, Moves.SHADOW_SNEAK, Moves.SHADOW_SNEAK]);
    vi.spyOn(Overrides, "STARTER_SPECIES_OVERRIDE", "get").mockReturnValue(0);
    vi.spyOn(Overrides, "ABILITY_OVERRIDE", "get").mockReturnValue(Abilities.DISGUISE);

    await game.startBattle([Species.MIMIKYU, Species.FURRET]);

    let mimikyu = game.scene.getPlayerPokemon();
    const maxHp = mimikyu.getMaxHp();
    const disguiseDamage = Math.floor(maxHp / 8);

    game.doAttack(getMovePosition(game.scene, 0, Moves.SPLASH));

    await game.phaseInterceptor.to(TurnEndPhase);

    expect(mimikyu.formIndex).toBe(bustedForm);
    expect(mimikyu.hp).equals(maxHp - disguiseDamage);

    await game.toNextTurn();
    game.doSwitchPokemon(1);

    await game.phaseInterceptor.to(TurnEndPhase);
    mimikyu = game.scene.getParty()[1];

    expect(mimikyu.formIndex).toBe(bustedForm);
  }, TIMEOUT);

  it("reverts to Disguised on arena reset", async () => {
    vi.spyOn(Overrides, "STARTING_WAVE_OVERRIDE", "get").mockReturnValue(4);
    vi.spyOn(Overrides, "STARTING_LEVEL_OVERRIDE", "get").mockReturnValue(4);
    vi.spyOn(Overrides, "STARTER_SPECIES_OVERRIDE", "get").mockReturnValue(0);
    vi.spyOn(Overrides, "ABILITY_OVERRIDE", "get").mockReturnValue(Abilities.DISGUISE);
    vi.spyOn(Overrides, "OPP_SPECIES_OVERRIDE", "get").mockReturnValue(Species.MAGIKARP);
    vi.spyOn(Overrides, "OPP_ABILITY_OVERRIDE", "get").mockReturnValue(Abilities.BALL_FETCH);
    vi.spyOn(Overrides, "STARTER_FORM_OVERRIDES", "get").mockReturnValue({
      [Species.MIMIKYU]: bustedForm,
    });

    await game.startBattle([Species.MIMIKYU]);

    const mimikyu = game.scene.getPlayerPokemon();

    expect(mimikyu.formIndex).toBe(bustedForm);

    game.doAttack(getMovePosition(game.scene, 0, Moves.ICE_BEAM));
    await game.doKillOpponents();
    await game.phaseInterceptor.to(TurnEndPhase);
    game.doSelectModifier();
    await game.phaseInterceptor.to(TurnInitPhase);

    expect(mimikyu.formIndex).toBe(disguisedForm);
  }, TIMEOUT);
});
