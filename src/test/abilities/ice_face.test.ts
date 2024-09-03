import { MoveEffectPhase } from "#app/phases/move-effect-phase";
import { MoveEndPhase } from "#app/phases/move-end-phase";
import { QuietFormChangePhase } from "#app/phases/quiet-form-change-phase";
import { TurnEndPhase } from "#app/phases/turn-end-phase";
import { TurnInitPhase } from "#app/phases/turn-init-phase";
import { Abilities } from "#enums/abilities";
import { BattlerTagType } from "#enums/battler-tag-type";
import { Moves } from "#enums/moves";
import { Species } from "#enums/species";
import GameManager from "#test/utils/gameManager";
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
    game.override.battleType("single");
    game.override.enemySpecies(Species.EISCUE);
    game.override.enemyAbility(Abilities.ICE_FACE);
    game.override.moveset([Moves.TACKLE, Moves.ICE_BEAM, Moves.TOXIC_THREAD, Moves.HAIL]);
  });

  it("takes no damage from physical move and transforms to Noice", async () => {
    await game.startBattle([Species.HITMONLEE]);

    game.move.select(Moves.TACKLE);

    await game.phaseInterceptor.to(MoveEndPhase);

    const eiscue = game.scene.getEnemyPokemon()!;

    expect(eiscue.isFullHp()).toBe(true);
    expect(eiscue.formIndex).toBe(noiceForm);
    expect(eiscue.getTag(BattlerTagType.ICE_FACE)).toBeUndefined();
  });

  it("takes no damage from the first hit of multihit physical move and transforms to Noice", async () => {
    game.override.moveset([Moves.SURGING_STRIKES]);
    game.override.enemyLevel(1);
    await game.startBattle([Species.HITMONLEE]);

    game.move.select(Moves.SURGING_STRIKES);

    const eiscue = game.scene.getEnemyPokemon()!;
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
    await game.startBattle([Species.MAGIKARP]);

    game.move.select(Moves.ICE_BEAM);

    await game.phaseInterceptor.to(MoveEndPhase);

    const eiscue = game.scene.getEnemyPokemon()!;

    expect(eiscue.getTag(BattlerTagType.ICE_FACE)).not.toBe(undefined);
    expect(eiscue.formIndex).toBe(icefaceForm);
    expect(eiscue.hp).toBeLessThan(eiscue.getMaxHp());
  });

  it("takes effects from status moves", async () => {
    await game.startBattle([Species.MAGIKARP]);

    game.move.select(Moves.TOXIC_THREAD);

    await game.phaseInterceptor.to(MoveEndPhase);

    const eiscue = game.scene.getEnemyPokemon()!;

    expect(eiscue.getTag(BattlerTagType.ICE_FACE)).not.toBe(undefined);
    expect(eiscue.formIndex).toBe(icefaceForm);
  });

  it("transforms to Ice Face when Hail or Snow starts", async () => {
    game.override.moveset([Moves.QUICK_ATTACK]);
    game.override.enemyMoveset([Moves.HAIL, Moves.HAIL, Moves.HAIL, Moves.HAIL]);

    await game.startBattle([Species.MAGIKARP]);

    game.move.select(Moves.QUICK_ATTACK);

    await game.phaseInterceptor.to(MoveEndPhase);

    const eiscue = game.scene.getEnemyPokemon()!;

    expect(eiscue.isFullHp()).toBe(true);
    expect(eiscue.formIndex).toBe(noiceForm);
    expect(eiscue.getTag(BattlerTagType.ICE_FACE)).toBeUndefined();

    await game.phaseInterceptor.to(MoveEndPhase);

    expect(eiscue.getTag(BattlerTagType.ICE_FACE)).not.toBeNull();
    expect(eiscue.formIndex).toBe(icefaceForm);
  });

  it("transforms to Ice Face when summoned on arena with active Snow or Hail", async () => {
    game.override.enemyMoveset([Moves.TACKLE, Moves.TACKLE, Moves.TACKLE, Moves.TACKLE]);
    game.override.moveset([Moves.SNOWSCAPE]);

    await game.startBattle([Species.EISCUE, Species.NINJASK]);

    game.move.select(Moves.SNOWSCAPE);

    await game.phaseInterceptor.to(TurnEndPhase);
    let eiscue = game.scene.getPlayerPokemon()!;

    expect(eiscue.getTag(BattlerTagType.ICE_FACE)).toBeUndefined();
    expect(eiscue.formIndex).toBe(noiceForm);
    expect(eiscue.isFullHp()).toBe(true);

    await game.toNextTurn();
    game.doSwitchPokemon(1);
    await game.toNextTurn();
    game.doSwitchPokemon(1);

    await game.phaseInterceptor.to(QuietFormChangePhase);
    eiscue = game.scene.getPlayerPokemon()!;

    expect(eiscue.formIndex).toBe(icefaceForm);
    expect(eiscue.getTag(BattlerTagType.ICE_FACE)).not.toBe(undefined);
  });

  it("will not revert to its Ice Face if there is already Hail when it changes into Noice", async () => {
    game.override.enemySpecies(Species.SHUCKLE);
    game.override.enemyMoveset([Moves.TACKLE, Moves.TACKLE, Moves.TACKLE, Moves.TACKLE]);

    await game.startBattle([Species.EISCUE]);

    game.move.select(Moves.HAIL);
    const eiscue = game.scene.getPlayerPokemon()!;

    await game.phaseInterceptor.to(QuietFormChangePhase);

    expect(eiscue.formIndex).toBe(noiceForm);
    expect(eiscue.getTag(BattlerTagType.ICE_FACE)).toBeUndefined();

    await game.phaseInterceptor.to(TurnEndPhase);

    expect(eiscue.formIndex).toBe(noiceForm);
    expect(eiscue.getTag(BattlerTagType.ICE_FACE)).toBeUndefined();
  });

  it("persists form change when switched out", async () => {
    game.override.enemyMoveset([Moves.QUICK_ATTACK, Moves.QUICK_ATTACK, Moves.QUICK_ATTACK, Moves.QUICK_ATTACK]);

    await game.startBattle([Species.EISCUE, Species.MAGIKARP]);

    game.move.select(Moves.ICE_BEAM);

    await game.phaseInterceptor.to(TurnEndPhase);
    let eiscue = game.scene.getPlayerPokemon()!;

    expect(eiscue.getTag(BattlerTagType.ICE_FACE)).toBeUndefined();
    expect(eiscue.formIndex).toBe(noiceForm);
    expect(eiscue.isFullHp()).toBe(true);

    await game.toNextTurn();
    game.doSwitchPokemon(1);

    await game.phaseInterceptor.to(TurnEndPhase);
    eiscue = game.scene.getParty()[1];

    expect(eiscue.formIndex).toBe(noiceForm);
    expect(eiscue.getTag(BattlerTagType.ICE_FACE)).toBeUndefined();
  });

  it("reverts to Ice Face on arena reset", async () => {
    game.override.startingWave(4);
    game.override.startingLevel(4);
    game.override.enemySpecies(Species.MAGIKARP);
    game.override.starterForms({
      [Species.EISCUE]: noiceForm,
    });

    await game.startBattle([Species.EISCUE]);

    const eiscue = game.scene.getPlayerPokemon()!;

    expect(eiscue.formIndex).toBe(noiceForm);
    expect(eiscue.getTag(BattlerTagType.ICE_FACE)).toBeUndefined();

    game.move.select(Moves.ICE_BEAM);
    await game.doKillOpponents();
    await game.phaseInterceptor.to(TurnEndPhase);
    game.doSelectModifier();
    await game.phaseInterceptor.to(TurnInitPhase);

    expect(eiscue.formIndex).toBe(icefaceForm);
    expect(eiscue.getTag(BattlerTagType.ICE_FACE)).not.toBe(undefined);
  });

  it("cannot be suppressed", async () => {
    game.override.moveset([Moves.GASTRO_ACID]);

    await game.startBattle([Species.MAGIKARP]);

    game.move.select(Moves.GASTRO_ACID);

    await game.phaseInterceptor.to(TurnEndPhase);

    const eiscue = game.scene.getEnemyPokemon()!;

    expect(eiscue.getTag(BattlerTagType.ICE_FACE)).not.toBe(undefined);
    expect(eiscue.formIndex).toBe(icefaceForm);
    expect(eiscue.summonData.abilitySuppressed).toBe(false);
  });

  it("cannot be swapped with another ability", async () => {
    game.override.moveset([Moves.SKILL_SWAP]);

    await game.startBattle([Species.MAGIKARP]);

    game.move.select(Moves.SKILL_SWAP);

    await game.phaseInterceptor.to(TurnEndPhase);

    const eiscue = game.scene.getEnemyPokemon()!;

    expect(eiscue.getTag(BattlerTagType.ICE_FACE)).not.toBe(undefined);
    expect(eiscue.formIndex).toBe(icefaceForm);
    expect(eiscue.hasAbility(Abilities.ICE_FACE)).toBe(true);
  });

  it("cannot be copied", async () => {
    game.override.ability(Abilities.TRACE);

    await game.startBattle([Species.MAGIKARP]);

    game.move.select(Moves.SIMPLE_BEAM);

    await game.phaseInterceptor.to(TurnInitPhase);

    const eiscue = game.scene.getEnemyPokemon()!;

    expect(eiscue.getTag(BattlerTagType.ICE_FACE)).not.toBe(undefined);
    expect(eiscue.formIndex).toBe(icefaceForm);
    expect(game.scene.getPlayerPokemon()!.hasAbility(Abilities.TRACE)).toBe(true);
  });
});
