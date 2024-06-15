import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import Phaser from "phaser";
import GameManager from "#app/test/utils/gameManager";
import * as overrides from "#app/overrides";
import { Species } from "#enums/species";
import {
  MoveEndPhase,
  TurnEndPhase,
  TurnInitPhase,
} from "#app/phases";
import { Moves } from "#enums/moves";
import { getMovePosition } from "#app/test/utils/gameManagerUtils";
import { Abilities } from "#enums/abilities";
import { BattlerTagType } from "#enums/battler-tag-type";
import { QuietFormChangePhase } from "#app/form-change-phase";

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
    vi.spyOn(overrides, "SINGLE_BATTLE_OVERRIDE", "get").mockReturnValue(true);
    vi.spyOn(overrides, "OPP_SPECIES_OVERRIDE", "get").mockReturnValue(Species.EISCUE);
    vi.spyOn(overrides, "OPP_ABILITY_OVERRIDE", "get").mockReturnValue(Abilities.ICE_FACE);
    vi.spyOn(overrides, "MOVESET_OVERRIDE", "get").mockReturnValue([Moves.TACKLE, Moves.ICE_BEAM, Moves.TOXIC_THREAD, Moves.HAIL]);
  });

  it("takes no damage from physical move and transforms to Noice", async () => {
    await game.startBattle([Species.HITMONLEE]);

    game.doAttack(getMovePosition(game.scene, 0, Moves.TACKLE));

    await game.phaseInterceptor.to(MoveEndPhase);

    const eiscue = game.scene.getEnemyPokemon();

    expect(eiscue.hp).equals(eiscue.getMaxHp());
    expect(eiscue.formIndex).toBe(noiceForm);
    expect(eiscue.getTag(BattlerTagType.ICE_FACE)).toBe(undefined);
  });

  it("takes damage from special moves", async () => {
    await game.startBattle([Species.MAGIKARP]);

    game.doAttack(getMovePosition(game.scene, 0, Moves.ICE_BEAM));

    await game.phaseInterceptor.to(MoveEndPhase);

    const eiscue = game.scene.getEnemyPokemon();

    expect(eiscue.getTag(BattlerTagType.ICE_FACE)).not.toBe(undefined);
    expect(eiscue.formIndex).toBe(icefaceForm);
    expect(eiscue.hp).toBeLessThan(eiscue.getMaxHp());
  });

  it("takes effects from status moves", async () => {
    await game.startBattle([Species.MAGIKARP]);

    game.doAttack(getMovePosition(game.scene, 0, Moves.TOXIC_THREAD));

    await game.phaseInterceptor.to(MoveEndPhase);

    const eiscue = game.scene.getEnemyPokemon();

    expect(eiscue.getTag(BattlerTagType.ICE_FACE)).not.toBe(undefined);
    expect(eiscue.formIndex).toBe(icefaceForm);
  });

  it("transforms to Ice Face when Hail or Snow starts", async () => {
    vi.spyOn(overrides, "MOVESET_OVERRIDE", "get").mockReturnValue([Moves.QUICK_ATTACK]);
    vi.spyOn(overrides, "OPP_MOVESET_OVERRIDE", "get").mockReturnValue([Moves.HAIL, Moves.HAIL, Moves.HAIL, Moves.HAIL]);

    await game.startBattle([Species.MAGIKARP]);

    game.doAttack(getMovePosition(game.scene, 0, Moves.QUICK_ATTACK));

    await game.phaseInterceptor.to(MoveEndPhase);

    const eiscue = game.scene.getEnemyPokemon();

    expect(eiscue.hp).equals(eiscue.getMaxHp());
    expect(eiscue.formIndex).toBe(noiceForm);
    expect(eiscue.getTag(BattlerTagType.ICE_FACE)).toBe(undefined);

    await game.phaseInterceptor.to(MoveEndPhase);

    expect(eiscue.getTag(BattlerTagType.ICE_FACE)).not.toBe(undefined);
    expect(eiscue.formIndex).toBe(icefaceForm);
  });

  it("transforms to Ice Face when summoned on arena with active Snow or Hail", async () => {
    vi.spyOn(overrides, "OPP_MOVESET_OVERRIDE", "get").mockReturnValue([Moves.TACKLE, Moves.TACKLE, Moves.TACKLE, Moves.TACKLE]);
    vi.spyOn(overrides, "MOVESET_OVERRIDE", "get").mockReturnValue([Moves.SNOWSCAPE]);

    await game.startBattle([Species.EISCUE, Species.NINJASK]);

    game.doAttack(getMovePosition(game.scene, 0, Moves.SNOWSCAPE));

    await game.phaseInterceptor.to(TurnEndPhase);
    let eiscue = game.scene.getPlayerPokemon();

    expect(eiscue.getTag(BattlerTagType.ICE_FACE)).toBe(undefined);
    expect(eiscue.formIndex).toBe(noiceForm);
    expect(eiscue.hp).equals(eiscue.getMaxHp());

    await game.toNextTurn();
    game.doSwitchPokemon(1);
    await game.toNextTurn();
    game.doSwitchPokemon(1);

    await game.phaseInterceptor.to(QuietFormChangePhase);
    eiscue = game.scene.getPlayerPokemon();

    expect(eiscue.formIndex).toBe(icefaceForm);
    expect(eiscue.getTag(BattlerTagType.ICE_FACE)).not.toBe(undefined);
  });

  it("will not revert to its Ice Face if there is already Hail when it changes into Noice", async () => {
    vi.spyOn(overrides, "OPP_SPECIES_OVERRIDE", "get").mockReturnValue(Species.SHUCKLE);
    vi.spyOn(overrides, "OPP_MOVESET_OVERRIDE", "get").mockReturnValue([Moves.TACKLE, Moves.TACKLE, Moves.TACKLE, Moves.TACKLE]);

    await game.startBattle([Species.EISCUE]);

    game.doAttack(getMovePosition(game.scene, 0, Moves.HAIL));
    const eiscue = game.scene.getPlayerPokemon();

    await game.phaseInterceptor.to(QuietFormChangePhase);

    expect(eiscue.formIndex).toBe(noiceForm);
    expect(eiscue.getTag(BattlerTagType.ICE_FACE)).toBe(undefined);

    await game.phaseInterceptor.to(TurnEndPhase);

    expect(eiscue.formIndex).toBe(noiceForm);
    expect(eiscue.getTag(BattlerTagType.ICE_FACE)).toBe(undefined);
  });

  it("persists form change when switched out", async () => {
    vi.spyOn(overrides, "OPP_MOVESET_OVERRIDE", "get").mockReturnValue([Moves.QUICK_ATTACK, Moves.QUICK_ATTACK, Moves.QUICK_ATTACK, Moves.QUICK_ATTACK]);

    await game.startBattle([Species.EISCUE, Species.MAGIKARP]);

    game.doAttack(getMovePosition(game.scene, 0, Moves.ICE_BEAM));

    await game.phaseInterceptor.to(TurnEndPhase);
    let eiscue = game.scene.getPlayerPokemon();

    expect(eiscue.getTag(BattlerTagType.ICE_FACE)).toBe(undefined);
    expect(eiscue.formIndex).toBe(noiceForm);
    expect(eiscue.hp).equals(eiscue.getMaxHp());

    await game.toNextTurn();
    game.doSwitchPokemon(1);

    await game.phaseInterceptor.to(TurnEndPhase);
    eiscue = game.scene.getParty()[1];

    expect(eiscue.formIndex).toBe(noiceForm);
    expect(eiscue.getTag(BattlerTagType.ICE_FACE)).toBe(undefined);
  });

  it("reverts to Ice Face on arena reset", async () => {
    vi.spyOn(overrides, "STARTING_WAVE_OVERRIDE", "get").mockReturnValue(4);
    vi.spyOn(overrides, "STARTING_LEVEL_OVERRIDE", "get").mockReturnValue(4);
    vi.spyOn(overrides, "OPP_SPECIES_OVERRIDE", "get").mockReturnValue(Species.MAGIKARP);
    vi.spyOn(overrides, "STARTER_FORM_OVERRIDES", "get").mockReturnValue({
      [Species.EISCUE]: noiceForm,
    });

    await game.startBattle([Species.EISCUE]);

    const eiscue = game.scene.getPlayerPokemon();

    expect(eiscue.formIndex).toBe(noiceForm);
    expect(eiscue.getTag(BattlerTagType.ICE_FACE)).toBe(undefined);

    game.doAttack(getMovePosition(game.scene, 0, Moves.ICE_BEAM));
    await game.doKillOpponents();
    await game.phaseInterceptor.to(TurnEndPhase);
    game.doSelectModifier();
    await game.phaseInterceptor.to(TurnInitPhase);

    expect(eiscue.formIndex).toBe(icefaceForm);
    expect(eiscue.getTag(BattlerTagType.ICE_FACE)).not.toBe(undefined);
  });

  it("cannot be suppressed", async () => {
    vi.spyOn(overrides, "MOVESET_OVERRIDE", "get").mockReturnValue([Moves.GASTRO_ACID]);

    await game.startBattle([Species.MAGIKARP]);

    game.doAttack(getMovePosition(game.scene, 0, Moves.GASTRO_ACID));

    await game.phaseInterceptor.to(TurnEndPhase);

    const eiscue = game.scene.getEnemyPokemon();

    expect(eiscue.getTag(BattlerTagType.ICE_FACE)).not.toBe(undefined);
    expect(eiscue.formIndex).toBe(icefaceForm);
    expect(eiscue.summonData.abilitySuppressed).toBe(false);
  });

  it("cannot be swapped with another ability", async () => {
    vi.spyOn(overrides, "MOVESET_OVERRIDE", "get").mockReturnValue([Moves.SKILL_SWAP]);

    await game.startBattle([Species.MAGIKARP]);

    game.doAttack(getMovePosition(game.scene, 0, Moves.SKILL_SWAP));

    await game.phaseInterceptor.to(TurnEndPhase);

    const eiscue = game.scene.getEnemyPokemon();

    expect(eiscue.getTag(BattlerTagType.ICE_FACE)).not.toBe(undefined);
    expect(eiscue.formIndex).toBe(icefaceForm);
    expect(eiscue.hasAbility(Abilities.ICE_FACE)).toBe(true);
  });

  it("cannot be copied", async () => {
    vi.spyOn(overrides, "ABILITY_OVERRIDE", "get").mockReturnValue(Abilities.TRACE);

    await game.startBattle([Species.MAGIKARP]);

    game.doAttack(getMovePosition(game.scene, 0, Moves.SIMPLE_BEAM));

    await game.phaseInterceptor.to(TurnInitPhase);

    const eiscue = game.scene.getEnemyPokemon();

    expect(eiscue.getTag(BattlerTagType.ICE_FACE)).not.toBe(undefined);
    expect(eiscue.formIndex).toBe(icefaceForm);
    expect(game.scene.getPlayerPokemon().hasAbility(Abilities.TRACE)).toBe(true);
  });
});
