import { toDmgValue } from "#app/utils";
import { Abilities } from "#enums/abilities";
import { Moves } from "#enums/moves";
import { Species } from "#enums/species";
import { StatusEffect } from "#app/data/status-effect";
import { Stat } from "#enums/stat";
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
    game.override
      .battleType("single")
      .enemySpecies(Species.MIMIKYU)
      .enemyMoveset(SPLASH_ONLY)
      .starterSpecies(Species.REGIELEKI)
      .moveset([Moves.SHADOW_SNEAK, Moves.VACUUM_WAVE, Moves.TOXIC_THREAD, Moves.SPLASH]);
  }, TIMEOUT);

  it("takes no damage from attacking move and transforms to Busted form, takes 1/8 max HP damage from the disguise breaking", async () => {
    await game.classicMode.startBattle();

    const mimikyu = game.scene.getEnemyPokemon()!;
    const maxHp = mimikyu.getMaxHp();
    const disguiseDamage = toDmgValue(maxHp / 8);

    expect(mimikyu.formIndex).toBe(disguisedForm);

    game.move.select(Moves.SHADOW_SNEAK);

    await game.phaseInterceptor.to("MoveEndPhase");

    expect(mimikyu.hp).equals(maxHp - disguiseDamage);
    expect(mimikyu.formIndex).toBe(bustedForm);
  }, TIMEOUT);

  it("doesn't break disguise when attacked with ineffective move", async () => {
    await game.classicMode.startBattle();

    const mimikyu = game.scene.getEnemyPokemon()!;

    expect(mimikyu.formIndex).toBe(disguisedForm);

    game.move.select(Moves.VACUUM_WAVE);

    await game.phaseInterceptor.to("MoveEndPhase");

    expect(mimikyu.formIndex).toBe(disguisedForm);
  }, TIMEOUT);

  it("takes no damage from the first hit of a multihit move and transforms to Busted form, then takes damage from the second hit", async () => {
    game.override.moveset([ Moves.SURGING_STRIKES ]);
    game.override.enemyLevel(5);
    await game.classicMode.startBattle();

    const mimikyu = game.scene.getEnemyPokemon()!;
    const maxHp = mimikyu.getMaxHp();
    const disguiseDamage = toDmgValue(maxHp / 8);

    expect(mimikyu.formIndex).toBe(disguisedForm);

    game.move.select(Moves.SURGING_STRIKES);

    // First hit
    await game.phaseInterceptor.to("MoveEffectPhase");
    expect(mimikyu.hp).equals(maxHp - disguiseDamage);
    expect(mimikyu.formIndex).toBe(disguisedForm);

    // Second hit
    await game.phaseInterceptor.to("MoveEffectPhase");
    expect(mimikyu.hp).lessThan(maxHp - disguiseDamage);
    expect(mimikyu.formIndex).toBe(bustedForm);
  }, TIMEOUT);

  it("takes effects from status moves and damage from status effects", async () => {
    await game.classicMode.startBattle();

    const mimikyu = game.scene.getEnemyPokemon()!;
    expect(mimikyu.hp).toBe(mimikyu.getMaxHp());

    game.move.select(Moves.TOXIC_THREAD);

    await game.phaseInterceptor.to("TurnEndPhase");

    expect(mimikyu.formIndex).toBe(disguisedForm);
    expect(mimikyu.status?.effect).toBe(StatusEffect.POISON);
    expect(mimikyu.getStatStage(Stat.SPD)).toBe(-1);
    expect(mimikyu.hp).toBeLessThan(mimikyu.getMaxHp());
  }, TIMEOUT);

  it("persists form change when switched out", async () => {
    game.override.enemyMoveset(Array(4).fill(Moves.SHADOW_SNEAK));
    game.override.starterSpecies(0);

    await game.classicMode.startBattle([ Species.MIMIKYU, Species.FURRET ]);

    const mimikyu = game.scene.getPlayerPokemon()!;
    const maxHp = mimikyu.getMaxHp();
    const disguiseDamage = toDmgValue(maxHp / 8);

    game.move.select(Moves.SPLASH);

    await game.phaseInterceptor.to("TurnEndPhase");

    expect(mimikyu.formIndex).toBe(bustedForm);
    expect(mimikyu.hp).equals(maxHp - disguiseDamage);

    await game.toNextTurn();
    game.doSwitchPokemon(1);

    await game.phaseInterceptor.to("TurnEndPhase");

    expect(mimikyu.formIndex).toBe(bustedForm);
  }, TIMEOUT);

  it("persists form change when wave changes with no arena reset", async () => {
    game.override.starterSpecies(0);
    game.override.starterForms({
      [Species.MIMIKYU]: bustedForm
    });
    await game.classicMode.startBattle([ Species.FURRET, Species.MIMIKYU ]);

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

    await game.classicMode.startBattle([ Species.MIMIKYU, Species.FURRET ]);

    const mimikyu1 = game.scene.getPlayerPokemon()!;

    expect(mimikyu1.formIndex).toBe(bustedForm);

    game.move.select(Moves.SPLASH);
    await game.killPokemon(mimikyu1);
    game.doSelectPartyPokemon(1);
    await game.toNextTurn();
    game.move.select(Moves.SPLASH);
    await game.doKillOpponents();
    await game.phaseInterceptor.to("PartyHealPhase");

    expect(mimikyu1.formIndex).toBe(disguisedForm);
  }, TIMEOUT);

  it("doesn't faint twice when fainting due to Disguise break damage, nor prevent faint from Disguise break damage if using Endure", async () => {
    game.override.enemyMoveset(Array(4).fill(Moves.ENDURE));
    await game.classicMode.startBattle();

    const mimikyu = game.scene.getEnemyPokemon()!;
    mimikyu.hp = 1;

    game.move.select(Moves.SHADOW_SNEAK);
    await game.toNextWave();

    expect(game.scene.getCurrentPhase()?.constructor.name).toBe("CommandPhase");
    expect(game.scene.currentBattle.waveIndex).toBe(2);
  }, TIMEOUT);

  it("activates when Aerilate circumvents immunity to the move's base type", async () => {
    game.override.ability(Abilities.AERILATE);
    game.override.moveset([Moves.TACKLE]);

    await game.classicMode.startBattle();

    const mimikyu = game.scene.getEnemyPokemon()!;
    const maxHp = mimikyu.getMaxHp();
    const disguiseDamage = toDmgValue(maxHp / 8);

    game.move.select(Moves.TACKLE);

    await game.phaseInterceptor.to("MoveEndPhase");

    expect(mimikyu.formIndex).toBe(bustedForm);
    expect(mimikyu.hp).toBe(maxHp - disguiseDamage);
  }, TIMEOUT);
});
