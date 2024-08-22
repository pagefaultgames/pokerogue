import { BattleStat } from "#app/data/battle-stat";
import { StatusEffect } from "#app/data/status-effect";
import { CommandPhase } from "#app/phases/command-phase";
import { MoveEffectPhase } from "#app/phases/move-effect-phase";
import { MoveEndPhase } from "#app/phases/move-end-phase";
import { TurnEndPhase } from "#app/phases/turn-end-phase";
import { TurnInitPhase } from "#app/phases/turn-init-phase";
import { Mode } from "#app/ui/ui";
import { toDmgValue } from "#app/utils";
import { Moves } from "#enums/moves";
import { Species } from "#enums/species";
import GameManager from "#test/utils/gameManager";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";
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
    game.override.enemyMoveset(SPLASH_ONLY);

    game.override.starterSpecies(Species.REGIELEKI);
    game.override.moveset([Moves.SHADOW_SNEAK, Moves.VACUUM_WAVE, Moves.TOXIC_THREAD, Moves.SPLASH]);
  }, TIMEOUT);

  it("takes no damage from attacking move and transforms to Busted form, takes 1/8 max HP damage from the disguise breaking", async () => {
    await game.classicMode.startBattle();

    const mimikyu = game.scene.getEnemyPokemon()!;
    const maxHp = mimikyu.getMaxHp();
    const disguiseDamage = toDmgValue(maxHp / 8);

    expect(mimikyu.formIndex).toBe(disguisedForm);

    game.move.select(Moves.SHADOW_SNEAK);

    await game.phaseInterceptor.to(MoveEndPhase);

    expect(mimikyu.hp).equals(maxHp - disguiseDamage);
    expect(mimikyu.formIndex).toBe(bustedForm);
  }, TIMEOUT);

  it("doesn't break disguise when attacked with ineffective move", async () => {
    await game.classicMode.startBattle();

    const mimikyu = game.scene.getEnemyPokemon()!;

    expect(mimikyu.formIndex).toBe(disguisedForm);

    game.move.select(Moves.VACUUM_WAVE);

    await game.phaseInterceptor.to(MoveEndPhase);

    expect(mimikyu.formIndex).toBe(disguisedForm);
  }, TIMEOUT);

  it("takes no damage from the first hit of a multihit move and transforms to Busted form, then takes damage from the second hit", async () => {
    game.override.moveset([Moves.SURGING_STRIKES]);
    game.override.enemyLevel(5);
    await game.classicMode.startBattle();

    const mimikyu = game.scene.getEnemyPokemon()!;
    const maxHp = mimikyu.getMaxHp();
    const disguiseDamage = toDmgValue(maxHp / 8);

    expect(mimikyu.formIndex).toBe(disguisedForm);

    game.move.select(Moves.SURGING_STRIKES);

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
    await game.classicMode.startBattle();

    const mimikyu = game.scene.getEnemyPokemon()!;
    expect(mimikyu.hp).toBe(mimikyu.getMaxHp());

    game.move.select(Moves.TOXIC_THREAD);

    await game.phaseInterceptor.to(TurnEndPhase);

    expect(mimikyu.formIndex).toBe(disguisedForm);
    expect(mimikyu.status?.effect).toBe(StatusEffect.POISON);
    expect(mimikyu.summonData.battleStats[BattleStat.SPD]).toBe(-1);
    expect(mimikyu.hp).toBeLessThan(mimikyu.getMaxHp());
  }, TIMEOUT);

  it("persists form change when switched out", async () => {
    game.override.enemyMoveset(Array(4).fill(Moves.SHADOW_SNEAK));
    game.override.starterSpecies(0);

    await game.classicMode.startBattle([Species.MIMIKYU, Species.FURRET]);

    const mimikyu = game.scene.getPlayerPokemon()!;
    const maxHp = mimikyu.getMaxHp();
    const disguiseDamage = toDmgValue(maxHp / 8);

    game.move.select(Moves.SPLASH);

    await game.phaseInterceptor.to(TurnEndPhase);

    expect(mimikyu.formIndex).toBe(bustedForm);
    expect(mimikyu.hp).equals(maxHp - disguiseDamage);

    await game.toNextTurn();
    game.doSwitchPokemon(1);

    await game.phaseInterceptor.to(TurnEndPhase);

    expect(mimikyu.formIndex).toBe(bustedForm);
  }, TIMEOUT);

  it("persists form change when wave changes with no arena reset", async () => {
    game.override.starterSpecies(0);
    game.override.starterForms({
      [Species.MIMIKYU]: bustedForm
    });
    await game.classicMode.startBattle([Species.FURRET, Species.MIMIKYU]);

    const mimikyu = game.scene.getParty()[1]!;
    expect(mimikyu.formIndex).toBe(bustedForm);

    game.move.select(Moves.SPLASH);
    await game.doKillOpponents();
    await game.toNextWave();

    expect(mimikyu.formIndex).toBe(bustedForm);
  }, TIMEOUT);

  it("reverts to Disguised form on arena reset", async () => {
    game.override.startingWave(4);
    game.override.starterSpecies(Species.MIMIKYU);
    game.override.starterForms({
      [Species.MIMIKYU]: bustedForm
    });

    await game.classicMode.startBattle();

    const mimikyu = game.scene.getPlayerPokemon()!;

    expect(mimikyu.formIndex).toBe(bustedForm);

    game.move.select(Moves.SPLASH);
    await game.doKillOpponents();
    await game.toNextWave();

    expect(mimikyu.formIndex).toBe(disguisedForm);
  }, TIMEOUT);

  it("reverts to Disguised form on biome change when fainted", async () => {
    game.override.startingWave(10);
    game.override.starterSpecies(0);
    game.override.starterForms({
      [Species.MIMIKYU]: bustedForm
    });

    await game.classicMode.startBattle([Species.MIMIKYU, Species.FURRET]);

    const mimikyu1 = game.scene.getPlayerPokemon()!;

    expect(mimikyu1.formIndex).toBe(bustedForm);

    game.move.select(Moves.SPLASH);
    await game.killPokemon(mimikyu1);
    game.doSelectPartyPokemon(1);
    await game.toNextTurn();
    game.move.select(Moves.SPLASH);
    await game.doKillOpponents();
    game.onNextPrompt("CheckSwitchPhase", Mode.CONFIRM, () => { // TODO: Make tests run in set mode instead of switch mode
      game.setMode(Mode.MESSAGE);
      game.endPhase();
    }, () => game.isCurrentPhase(CommandPhase) || game.isCurrentPhase(TurnInitPhase));

    game.onNextPrompt("CheckSwitchPhase", Mode.CONFIRM, () => {
      game.setMode(Mode.MESSAGE);
      game.endPhase();
    }, () => game.isCurrentPhase(CommandPhase) || game.isCurrentPhase(TurnInitPhase));
    await game.phaseInterceptor.to("PartyHealPhase");

    expect(mimikyu1.formIndex).toBe(disguisedForm);
  }, TIMEOUT);
});
