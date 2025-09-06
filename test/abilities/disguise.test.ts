import { AbilityId } from "#enums/ability-id";
import { BattlerIndex } from "#enums/battler-index";
import { MoveId } from "#enums/move-id";
import { SpeciesId } from "#enums/species-id";
import { Stat } from "#enums/stat";
import { StatusEffect } from "#enums/status-effect";
import { GameManager } from "#test/test-utils/game-manager";
import { toDmgValue } from "#utils/common";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";

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
    game.override
      .battleStyle("single")
      .enemySpecies(SpeciesId.MIMIKYU)
      .enemyMoveset(MoveId.SPLASH)
      .starterSpecies(SpeciesId.REGIELEKI)
      .moveset([MoveId.SHADOW_SNEAK, MoveId.VACUUM_WAVE, MoveId.TOXIC_THREAD, MoveId.SPLASH]);
  });

  it("takes no damage from attacking move and transforms to Busted form, takes 1/8 max HP damage from the disguise breaking", async () => {
    await game.classicMode.startBattle();

    const mimikyu = game.field.getEnemyPokemon();
    const maxHp = mimikyu.getMaxHp();
    const disguiseDamage = toDmgValue(maxHp / 8);

    expect(mimikyu.formIndex).toBe(disguisedForm);

    game.move.select(MoveId.SHADOW_SNEAK);

    await game.phaseInterceptor.to("MoveEndPhase");

    expect(mimikyu.hp).equals(maxHp - disguiseDamage);
    expect(mimikyu.formIndex).toBe(bustedForm);
  });

  it("doesn't break disguise when attacked with ineffective move", async () => {
    await game.classicMode.startBattle();

    const mimikyu = game.field.getEnemyPokemon();

    expect(mimikyu.formIndex).toBe(disguisedForm);

    game.move.select(MoveId.VACUUM_WAVE);

    await game.phaseInterceptor.to("MoveEndPhase");

    expect(mimikyu.formIndex).toBe(disguisedForm);
  });

  it("takes no damage from the first hit of a multihit move and transforms to Busted form, then takes damage from the second hit", async () => {
    game.override.moveset([MoveId.SURGING_STRIKES]).enemyLevel(5);
    await game.classicMode.startBattle();

    const mimikyu = game.field.getEnemyPokemon();
    const maxHp = mimikyu.getMaxHp();
    const disguiseDamage = toDmgValue(maxHp / 8);

    expect(mimikyu.formIndex).toBe(disguisedForm);

    game.move.select(MoveId.SURGING_STRIKES);

    // First hit
    await game.phaseInterceptor.to("MoveEffectPhase");
    expect(mimikyu.hp).equals(maxHp - disguiseDamage);
    expect(mimikyu.formIndex).toBe(disguisedForm);

    // Second hit
    await game.phaseInterceptor.to("MoveEffectPhase");
    expect(mimikyu.hp).lessThan(maxHp - disguiseDamage);
    expect(mimikyu.formIndex).toBe(bustedForm);
  });

  it("takes effects from status moves and damage from status effects", async () => {
    await game.classicMode.startBattle();

    const mimikyu = game.field.getEnemyPokemon();
    expect(mimikyu.hp).toBe(mimikyu.getMaxHp());

    game.move.select(MoveId.TOXIC_THREAD);

    await game.phaseInterceptor.to("TurnEndPhase");

    expect(mimikyu.formIndex).toBe(disguisedForm);
    expect(mimikyu.status?.effect).toBe(StatusEffect.POISON);
    expect(mimikyu.getStatStage(Stat.SPD)).toBe(-1);
    expect(mimikyu.hp).toBeLessThan(mimikyu.getMaxHp());
  });

  it("persists form change when switched out", async () => {
    game.override.enemyMoveset([MoveId.SHADOW_SNEAK]).starterSpecies(0);

    await game.classicMode.startBattle([SpeciesId.MIMIKYU, SpeciesId.FURRET]);

    const mimikyu = game.field.getPlayerPokemon();
    const maxHp = mimikyu.getMaxHp();
    const disguiseDamage = toDmgValue(maxHp / 8);

    game.move.select(MoveId.SPLASH);

    await game.phaseInterceptor.to("TurnEndPhase");

    expect(mimikyu.formIndex).toBe(bustedForm);
    expect(mimikyu.hp).equals(maxHp - disguiseDamage);

    await game.toNextTurn();
    game.doSwitchPokemon(1);

    await game.phaseInterceptor.to("TurnEndPhase");

    expect(mimikyu.formIndex).toBe(bustedForm);
  });

  it("persists form change when wave changes with no arena reset", async () => {
    game.override.starterSpecies(0).starterForms({
      [SpeciesId.MIMIKYU]: bustedForm,
    });
    await game.classicMode.startBattle([SpeciesId.FURRET, SpeciesId.MIMIKYU]);

    const mimikyu = game.scene.getPlayerParty()[1];
    expect(mimikyu.formIndex).toBe(bustedForm);

    game.move.select(MoveId.SPLASH);
    await game.doKillOpponents();
    await game.toNextWave();

    expect(mimikyu.formIndex).toBe(bustedForm);
  });

  it("reverts to Disguised form on arena reset", async () => {
    game.override
      .startingWave(4)
      .starterSpecies(SpeciesId.MIMIKYU)
      .starterForms({
        [SpeciesId.MIMIKYU]: bustedForm,
      });

    await game.classicMode.startBattle();

    const mimikyu = game.field.getPlayerPokemon();

    expect(mimikyu.formIndex).toBe(bustedForm);

    game.move.select(MoveId.SPLASH);
    await game.doKillOpponents();
    await game.toNextWave();

    expect(mimikyu.formIndex).toBe(disguisedForm);
  });

  it("reverts to Disguised form when fainted", async () => {
    game.override
      .startingWave(10)
      .starterSpecies(0)
      .starterForms({
        [SpeciesId.MIMIKYU]: bustedForm,
      });

    await game.classicMode.startBattle([SpeciesId.MIMIKYU, SpeciesId.FURRET]);

    const mimikyu1 = game.field.getPlayerPokemon();

    expect(mimikyu1.formIndex).toBe(bustedForm);

    game.move.select(MoveId.SPLASH);
    await game.killPokemon(mimikyu1);
    await game.phaseInterceptor.to("QuietFormChangePhase");

    expect(mimikyu1.formIndex).toBe(disguisedForm);
  });

  it("doesn't faint twice when fainting due to Disguise break damage, nor prevent faint from Disguise break damage if using Endure", async () => {
    game.override.enemyMoveset([MoveId.ENDURE]);
    await game.classicMode.startBattle();

    const mimikyu = game.field.getEnemyPokemon();
    mimikyu.hp = 1;

    game.move.select(MoveId.SHADOW_SNEAK);
    await game.toNextWave();

    expect(game).toBeAtPhase("CommandPhase");
    expect(game.scene.currentBattle.waveIndex).toBe(2);
  });

  it("activates when Aerilate circumvents immunity to the move's base type", async () => {
    game.override.ability(AbilityId.AERILATE).moveset([MoveId.TACKLE]);

    await game.classicMode.startBattle();

    const mimikyu = game.field.getEnemyPokemon();
    const maxHp = mimikyu.getMaxHp();
    const disguiseDamage = toDmgValue(maxHp / 8);

    game.move.select(MoveId.TACKLE);

    await game.phaseInterceptor.to("MoveEndPhase");

    expect(mimikyu.formIndex).toBe(bustedForm);
    expect(mimikyu.hp).toBe(maxHp - disguiseDamage);
  });

  it("doesn't trigger if user is behind a substitute", async () => {
    game.override.enemyMoveset(MoveId.SUBSTITUTE).moveset(MoveId.POWER_TRIP);
    await game.classicMode.startBattle();

    game.move.select(MoveId.POWER_TRIP);
    await game.setTurnOrder([BattlerIndex.ENEMY, BattlerIndex.PLAYER]);
    await game.toNextTurn();

    expect(game.field.getEnemyPokemon().formIndex).toBe(disguisedForm);
  });
});
