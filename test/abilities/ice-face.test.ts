import { AbilityId } from "#enums/ability-id";
import { BattlerIndex } from "#enums/battler-index";
import { BattlerTagType } from "#enums/battler-tag-type";
import { MoveId } from "#enums/move-id";
import { SpeciesId } from "#enums/species-id";
import { MoveEffectPhase } from "#phases/move-effect-phase";
import { MoveEndPhase } from "#phases/move-end-phase";
import { QuietFormChangePhase } from "#phases/quiet-form-change-phase";
import { TurnEndPhase } from "#phases/turn-end-phase";
import { TurnInitPhase } from "#phases/turn-init-phase";
import { GameManager } from "#test/test-utils/game-manager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";

describe("Abilities - Ice Face", () => {
  let phaserGame: Phaser.Game;
  let game: GameManager;
  const noiceForm = 1;
  const icefaceForm = 0;

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
      .enemySpecies(SpeciesId.EISCUE)
      .enemyAbility(AbilityId.ICE_FACE)
      .moveset([MoveId.TACKLE, MoveId.ICE_BEAM, MoveId.TOXIC_THREAD, MoveId.HAIL]);
  });

  it("takes no damage from physical move and transforms to Noice", async () => {
    await game.classicMode.startBattle([SpeciesId.HITMONLEE]);

    game.move.select(MoveId.TACKLE);

    await game.phaseInterceptor.to(MoveEndPhase);

    const eiscue = game.field.getEnemyPokemon();

    expect(eiscue.isFullHp()).toBe(true);
    expect(eiscue.formIndex).toBe(noiceForm);
    expect(eiscue.getTag(BattlerTagType.ICE_FACE)).toBeUndefined();
  });

  it("takes no damage from the first hit of multihit physical move and transforms to Noice", async () => {
    game.override.moveset([MoveId.SURGING_STRIKES]).enemyLevel(1);
    await game.classicMode.startBattle([SpeciesId.HITMONLEE]);

    game.move.select(MoveId.SURGING_STRIKES);

    const eiscue = game.field.getEnemyPokemon();
    expect(eiscue.getTag(BattlerTagType.ICE_FACE)).toBeDefined();

    // First hit
    await game.phaseInterceptor.to(MoveEffectPhase);
    expect(eiscue.isFullHp()).toBe(true);
    expect(eiscue.formIndex).toBe(icefaceForm);
    expect(eiscue.getTag(BattlerTagType.ICE_FACE)).toBeUndefined();

    // Second hit
    await game.phaseInterceptor.to(MoveEffectPhase);
    expect(eiscue.hp).lessThan(eiscue.getMaxHp());
    expect(eiscue.formIndex).toBe(noiceForm);

    await game.phaseInterceptor.to(MoveEndPhase);

    expect(eiscue.hp).lessThan(eiscue.getMaxHp());
    expect(eiscue.formIndex).toBe(noiceForm);
    expect(eiscue.getTag(BattlerTagType.ICE_FACE)).toBeUndefined();
  });

  it("takes damage from special moves", async () => {
    await game.classicMode.startBattle([SpeciesId.MAGIKARP]);

    game.move.select(MoveId.ICE_BEAM);

    await game.phaseInterceptor.to(MoveEndPhase);

    const eiscue = game.field.getEnemyPokemon();

    expect(eiscue.getTag(BattlerTagType.ICE_FACE)).not.toBe(undefined);
    expect(eiscue.formIndex).toBe(icefaceForm);
    expect(eiscue.hp).toBeLessThan(eiscue.getMaxHp());
  });

  it("takes effects from status moves", async () => {
    await game.classicMode.startBattle([SpeciesId.MAGIKARP]);

    game.move.select(MoveId.TOXIC_THREAD);

    await game.phaseInterceptor.to(MoveEndPhase);

    const eiscue = game.field.getEnemyPokemon();

    expect(eiscue.getTag(BattlerTagType.ICE_FACE)).not.toBe(undefined);
    expect(eiscue.formIndex).toBe(icefaceForm);
  });

  it("transforms to Ice Face when Hail or Snow starts", async () => {
    game.override.moveset([MoveId.QUICK_ATTACK]).enemyMoveset(MoveId.HAIL);

    await game.classicMode.startBattle([SpeciesId.MAGIKARP]);

    game.move.select(MoveId.QUICK_ATTACK);

    await game.phaseInterceptor.to(MoveEndPhase);

    const eiscue = game.field.getEnemyPokemon();

    expect(eiscue.isFullHp()).toBe(true);
    expect(eiscue.formIndex).toBe(noiceForm);
    expect(eiscue.getTag(BattlerTagType.ICE_FACE)).toBeUndefined();

    await game.phaseInterceptor.to(MoveEndPhase);

    expect(eiscue.getTag(BattlerTagType.ICE_FACE)).not.toBeNull();
    expect(eiscue.formIndex).toBe(icefaceForm);
  });

  it("transforms to Ice Face when summoned on arena with active Snow or Hail", async () => {
    game.override.enemyMoveset(MoveId.TACKLE).moveset([MoveId.SNOWSCAPE]);

    await game.classicMode.startBattle([SpeciesId.EISCUE, SpeciesId.NINJASK]);

    game.move.select(MoveId.SNOWSCAPE);

    await game.phaseInterceptor.to(TurnEndPhase);
    let eiscue = game.field.getPlayerPokemon();

    expect(eiscue.getTag(BattlerTagType.ICE_FACE)).toBeUndefined();
    expect(eiscue.formIndex).toBe(noiceForm);
    expect(eiscue.isFullHp()).toBe(true);

    await game.toNextTurn();
    game.doSwitchPokemon(1);
    await game.toNextTurn();
    game.doSwitchPokemon(1);

    await game.phaseInterceptor.to(QuietFormChangePhase);
    eiscue = game.field.getPlayerPokemon();

    expect(eiscue.formIndex).toBe(icefaceForm);
    expect(eiscue.getTag(BattlerTagType.ICE_FACE)).not.toBe(undefined);
  });

  it("will not revert to its Ice Face if there is already Hail when it changes into Noice", async () => {
    game.override.enemySpecies(SpeciesId.SHUCKLE).enemyMoveset(MoveId.TACKLE);

    await game.classicMode.startBattle([SpeciesId.EISCUE]);

    game.move.select(MoveId.HAIL);
    const eiscue = game.field.getPlayerPokemon();

    await game.phaseInterceptor.to(QuietFormChangePhase);

    expect(eiscue.formIndex).toBe(noiceForm);
    expect(eiscue.getTag(BattlerTagType.ICE_FACE)).toBeUndefined();

    await game.phaseInterceptor.to(TurnEndPhase);

    expect(eiscue.formIndex).toBe(noiceForm);
    expect(eiscue.getTag(BattlerTagType.ICE_FACE)).toBeUndefined();
  });

  it("persists form change when switched out", async () => {
    game.override.enemyMoveset(MoveId.QUICK_ATTACK);

    await game.classicMode.startBattle([SpeciesId.EISCUE, SpeciesId.MAGIKARP]);

    game.move.select(MoveId.ICE_BEAM);

    await game.phaseInterceptor.to(TurnEndPhase);
    let eiscue = game.field.getPlayerPokemon();

    expect(eiscue.getTag(BattlerTagType.ICE_FACE)).toBeUndefined();
    expect(eiscue.formIndex).toBe(noiceForm);
    expect(eiscue.isFullHp()).toBe(true);

    await game.toNextTurn();
    game.doSwitchPokemon(1);

    await game.phaseInterceptor.to(TurnEndPhase);
    eiscue = game.scene.getPlayerParty()[1];

    expect(eiscue.formIndex).toBe(noiceForm);
    expect(eiscue.getTag(BattlerTagType.ICE_FACE)).toBeUndefined();
  });

  it("reverts to Ice Face on arena reset", async () => {
    game.override
      .startingWave(4)
      .startingLevel(4)
      .enemySpecies(SpeciesId.MAGIKARP)
      .starterForms({
        [SpeciesId.EISCUE]: noiceForm,
      });

    await game.classicMode.startBattle([SpeciesId.EISCUE]);

    const eiscue = game.field.getPlayerPokemon();

    expect(eiscue.formIndex).toBe(noiceForm);
    expect(eiscue.getTag(BattlerTagType.ICE_FACE)).toBeUndefined();

    game.move.select(MoveId.ICE_BEAM);
    await game.doKillOpponents();
    await game.phaseInterceptor.to(TurnEndPhase);
    game.doSelectModifier();
    await game.phaseInterceptor.to(TurnInitPhase);

    expect(eiscue.formIndex).toBe(icefaceForm);
    expect(eiscue.getTag(BattlerTagType.ICE_FACE)).not.toBe(undefined);
  });

  it("doesn't trigger if user is behind a substitute", async () => {
    game.override.enemyMoveset(MoveId.SUBSTITUTE).moveset(MoveId.POWER_TRIP);
    await game.classicMode.startBattle();

    game.move.select(MoveId.POWER_TRIP);
    await game.setTurnOrder([BattlerIndex.ENEMY, BattlerIndex.PLAYER]);
    await game.toNextTurn();

    expect(game.field.getEnemyPokemon().formIndex).toBe(icefaceForm);
  });

  it("cannot be suppressed", async () => {
    game.override.moveset([MoveId.GASTRO_ACID]);

    await game.classicMode.startBattle([SpeciesId.MAGIKARP]);

    game.move.select(MoveId.GASTRO_ACID);

    await game.phaseInterceptor.to(TurnEndPhase);

    const eiscue = game.field.getEnemyPokemon();

    expect(eiscue.getTag(BattlerTagType.ICE_FACE)).not.toBe(undefined);
    expect(eiscue.formIndex).toBe(icefaceForm);
    expect(eiscue.summonData.abilitySuppressed).toBe(false);
  });

  it("cannot be swapped with another ability", async () => {
    game.override.moveset([MoveId.SKILL_SWAP]);

    await game.classicMode.startBattle([SpeciesId.MAGIKARP]);

    game.move.select(MoveId.SKILL_SWAP);

    await game.phaseInterceptor.to(TurnEndPhase);

    const eiscue = game.field.getEnemyPokemon();

    expect(eiscue.getTag(BattlerTagType.ICE_FACE)).toBeDefined();
    expect(eiscue.formIndex).toBe(icefaceForm);
    expect(eiscue.hasAbility(AbilityId.ICE_FACE)).toBe(true);
  });

  it("cannot be copied", async () => {
    game.override.ability(AbilityId.TRACE);

    await game.classicMode.startBattle([SpeciesId.MAGIKARP]);

    const eiscue = game.field.getEnemyPokemon();

    expect(eiscue.getTag(BattlerTagType.ICE_FACE)).toBeDefined();
    expect(eiscue.formIndex).toBe(icefaceForm);
    expect(game.field.getPlayerPokemon().hasAbility(AbilityId.TRACE)).toBe(true);
  });
});
