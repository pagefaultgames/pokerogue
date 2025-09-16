import { AbilityId } from "#enums/ability-id";
import { BattlerIndex } from "#enums/battler-index";
import { Challenges } from "#enums/challenges";
import { MoveId } from "#enums/move-id";
import { PokemonType } from "#enums/pokemon-type";
import { SpeciesId } from "#enums/species-id";
import { GameManager } from "#test/test-utils/game-manager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

describe("Moves - Freeze-Dry", () => {
  let phaserGame: Phaser.Game;
  let game: GameManager;
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
      .enemySpecies(SpeciesId.MAGIKARP)
      .enemyAbility(AbilityId.BALL_FETCH)
      .enemyMoveset(MoveId.SPLASH)
      .starterSpecies(SpeciesId.FEEBAS)
      .ability(AbilityId.BALL_FETCH)
      .moveset([MoveId.FREEZE_DRY, MoveId.FORESTS_CURSE, MoveId.SOAK]);
  });

  it("should deal 2x damage to pure water types", async () => {
    await game.classicMode.startBattle();

    const enemy = game.field.getEnemyPokemon();
    vi.spyOn(enemy, "getMoveEffectiveness");

    game.move.select(MoveId.FREEZE_DRY);
    await game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.ENEMY]);
    await game.phaseInterceptor.to("MoveEffectPhase");

    expect(enemy.getMoveEffectiveness).toHaveReturnedWith(2);
  });

  it("should deal 4x damage to water/flying types", async () => {
    game.override.enemySpecies(SpeciesId.WINGULL);
    await game.classicMode.startBattle();

    const enemy = game.field.getEnemyPokemon();
    vi.spyOn(enemy, "getMoveEffectiveness");

    game.move.select(MoveId.FREEZE_DRY);
    await game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.ENEMY]);
    await game.phaseInterceptor.to("MoveEffectPhase");

    expect(enemy.getMoveEffectiveness).toHaveReturnedWith(4);
  });

  it("should deal 1x damage to water/fire types", async () => {
    game.override.enemySpecies(SpeciesId.VOLCANION);
    await game.classicMode.startBattle();

    const enemy = game.field.getEnemyPokemon();
    vi.spyOn(enemy, "getMoveEffectiveness");

    game.move.select(MoveId.FREEZE_DRY);
    await game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.ENEMY]);
    await game.phaseInterceptor.to("MoveEffectPhase");

    expect(enemy.getMoveEffectiveness).toHaveReturnedWith(1);
  });

  /**
   * Freeze drys forced super effectiveness should overwrite wonder guard
   */
  it("should deal 2x dmg against soaked wonder guard target", async () => {
    game.override
      .enemySpecies(SpeciesId.SHEDINJA)
      .enemyMoveset(MoveId.SPLASH)
      .starterSpecies(SpeciesId.MAGIKARP)
      .moveset([MoveId.SOAK, MoveId.FREEZE_DRY]);
    await game.classicMode.startBattle();

    const enemy = game.field.getEnemyPokemon();
    vi.spyOn(enemy, "getMoveEffectiveness");

    game.move.select(MoveId.SOAK);
    await game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.ENEMY]);
    await game.toNextTurn();

    game.move.select(MoveId.FREEZE_DRY);
    await game.phaseInterceptor.to("MoveEffectPhase");

    expect(enemy.getMoveEffectiveness).toHaveReturnedWith(2);
    expect(enemy.hp).toBeLessThan(enemy.getMaxHp());
  });

  it("should deal 8x damage to water/ground/grass type under Forest's Curse", async () => {
    game.override.enemySpecies(SpeciesId.QUAGSIRE);
    await game.classicMode.startBattle();

    const enemy = game.field.getEnemyPokemon();
    vi.spyOn(enemy, "getMoveEffectiveness");

    game.move.select(MoveId.FORESTS_CURSE);
    await game.toNextTurn();

    game.move.select(MoveId.FREEZE_DRY);
    await game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.ENEMY]);
    await game.phaseInterceptor.to("MoveEffectPhase");

    expect(enemy.getMoveEffectiveness).toHaveReturnedWith(8);
  });

  it("should deal 2x damage to steel type terastallized into water", async () => {
    game.override.enemySpecies(SpeciesId.SKARMORY);
    await game.classicMode.startBattle();

    const enemy = game.field.getEnemyPokemon();
    enemy.teraType = PokemonType.WATER;
    enemy.isTerastallized = true;
    vi.spyOn(enemy, "getMoveEffectiveness");

    game.move.select(MoveId.FREEZE_DRY);
    await game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.ENEMY]);
    await game.phaseInterceptor.to("MoveEffectPhase");

    expect(enemy.getMoveEffectiveness).toHaveReturnedWith(2);
  });

  it("should deal 0.5x damage to water type terastallized into fire", async () => {
    game.override.enemySpecies(SpeciesId.PELIPPER);
    await game.classicMode.startBattle();

    const enemy = game.field.getEnemyPokemon();
    enemy.teraType = PokemonType.FIRE;
    enemy.isTerastallized = true;
    vi.spyOn(enemy, "getMoveEffectiveness");

    game.move.select(MoveId.FREEZE_DRY);
    await game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.ENEMY]);
    await game.phaseInterceptor.to("MoveEffectPhase");

    expect(enemy.getMoveEffectiveness).toHaveReturnedWith(0.5);
  });

  it("should deal 0.5x damage to water type Terapagos with Tera Shell", async () => {
    game.override.enemySpecies(SpeciesId.TERAPAGOS).enemyAbility(AbilityId.TERA_SHELL);
    await game.classicMode.startBattle();

    const enemy = game.field.getEnemyPokemon();
    vi.spyOn(enemy, "getMoveEffectiveness");

    game.move.select(MoveId.SOAK);
    await game.toNextTurn();

    game.move.select(MoveId.FREEZE_DRY);
    await game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.ENEMY]);
    await game.phaseInterceptor.to("MoveEffectPhase");

    expect(enemy.getMoveEffectiveness).toHaveReturnedWith(0.5);
  });

  it("should deal 2x damage to water type under Normalize", async () => {
    game.override.ability(AbilityId.NORMALIZE);
    await game.classicMode.startBattle();

    const enemy = game.field.getEnemyPokemon();
    vi.spyOn(enemy, "getMoveEffectiveness");

    game.move.select(MoveId.FREEZE_DRY);
    await game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.ENEMY]);
    await game.phaseInterceptor.to("MoveEffectPhase");

    expect(enemy.getMoveEffectiveness).toHaveReturnedWith(2);
  });

  it("should deal 0.25x damage to rock/steel type under Normalize", async () => {
    game.override.ability(AbilityId.NORMALIZE).enemySpecies(SpeciesId.SHIELDON);
    await game.classicMode.startBattle();

    const enemy = game.field.getEnemyPokemon();
    vi.spyOn(enemy, "getMoveEffectiveness");

    game.move.select(MoveId.FREEZE_DRY);
    await game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.ENEMY]);
    await game.phaseInterceptor.to("MoveEffectPhase");

    expect(enemy.getMoveEffectiveness).toHaveReturnedWith(0.25);
  });

  it("should deal 0x damage to water/ghost type under Normalize", async () => {
    game.override.ability(AbilityId.NORMALIZE).enemySpecies(SpeciesId.JELLICENT);
    await game.classicMode.startBattle();

    const enemy = game.field.getEnemyPokemon();
    vi.spyOn(enemy, "getMoveEffectiveness");

    game.move.select(MoveId.FREEZE_DRY);
    await game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.ENEMY]);
    await game.phaseInterceptor.to("BerryPhase");

    expect(enemy.getMoveEffectiveness).toHaveReturnedWith(0);
  });

  it("should deal 2x damage to water type under Electrify", async () => {
    game.override.enemyMoveset([MoveId.ELECTRIFY]);
    await game.classicMode.startBattle();

    const enemy = game.field.getEnemyPokemon();
    vi.spyOn(enemy, "getMoveEffectiveness");

    game.move.select(MoveId.FREEZE_DRY);
    await game.setTurnOrder([BattlerIndex.ENEMY, BattlerIndex.PLAYER]);
    await game.phaseInterceptor.to("BerryPhase");

    expect(enemy.getMoveEffectiveness).toHaveReturnedWith(2);
  });

  it("should deal 4x damage to water/flying type under Electrify", async () => {
    game.override.enemyMoveset([MoveId.ELECTRIFY]).enemySpecies(SpeciesId.GYARADOS);
    await game.classicMode.startBattle();

    const enemy = game.field.getEnemyPokemon();
    vi.spyOn(enemy, "getMoveEffectiveness");

    game.move.select(MoveId.FREEZE_DRY);
    await game.setTurnOrder([BattlerIndex.ENEMY, BattlerIndex.PLAYER]);
    await game.phaseInterceptor.to("BerryPhase");

    expect(enemy.getMoveEffectiveness).toHaveReturnedWith(4);
  });

  it("should deal 0x damage to water/ground type under Electrify", async () => {
    game.override.enemyMoveset([MoveId.ELECTRIFY]).enemySpecies(SpeciesId.BARBOACH);
    await game.classicMode.startBattle();

    const enemy = game.field.getEnemyPokemon();
    vi.spyOn(enemy, "getMoveEffectiveness");

    game.move.select(MoveId.FREEZE_DRY);
    await game.setTurnOrder([BattlerIndex.ENEMY, BattlerIndex.PLAYER]);
    await game.phaseInterceptor.to("BerryPhase");

    expect(enemy.getMoveEffectiveness).toHaveReturnedWith(0);
  });

  it("should deal 0.25x damage to Grass/Dragon type under Electrify", async () => {
    game.override.enemyMoveset([MoveId.ELECTRIFY]).enemySpecies(SpeciesId.FLAPPLE);
    await game.classicMode.startBattle();

    const enemy = game.field.getEnemyPokemon();
    vi.spyOn(enemy, "getMoveEffectiveness");

    game.move.select(MoveId.FREEZE_DRY);
    await game.setTurnOrder([BattlerIndex.ENEMY, BattlerIndex.PLAYER]);
    await game.phaseInterceptor.to("BerryPhase");

    expect(enemy.getMoveEffectiveness).toHaveReturnedWith(0.25);
  });

  it("should deal 2x damage to Water type during inverse battle", async () => {
    game.override.moveset([MoveId.FREEZE_DRY]).enemySpecies(SpeciesId.MAGIKARP);
    game.challengeMode.addChallenge(Challenges.INVERSE_BATTLE, 1, 1);

    await game.challengeMode.startBattle();

    const enemy = game.field.getEnemyPokemon();
    vi.spyOn(enemy, "getMoveEffectiveness");

    game.move.select(MoveId.FREEZE_DRY);
    await game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.ENEMY]);
    await game.phaseInterceptor.to("MoveEffectPhase");

    expect(enemy.getMoveEffectiveness).toHaveLastReturnedWith(2);
  });

  it("should deal 2x damage to Water type during inverse battle under Normalize", async () => {
    game.override.moveset([MoveId.FREEZE_DRY]).ability(AbilityId.NORMALIZE).enemySpecies(SpeciesId.MAGIKARP);
    game.challengeMode.addChallenge(Challenges.INVERSE_BATTLE, 1, 1);

    await game.challengeMode.startBattle();

    const enemy = game.field.getEnemyPokemon();
    vi.spyOn(enemy, "getMoveEffectiveness");

    game.move.select(MoveId.FREEZE_DRY);
    await game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.ENEMY]);
    await game.phaseInterceptor.to("MoveEffectPhase");

    expect(enemy.getMoveEffectiveness).toHaveLastReturnedWith(2);
  });

  it("should deal 2x damage to Water type during inverse battle under Electrify", async () => {
    game.override.moveset([MoveId.FREEZE_DRY]).enemySpecies(SpeciesId.MAGIKARP).enemyMoveset([MoveId.ELECTRIFY]);
    game.challengeMode.addChallenge(Challenges.INVERSE_BATTLE, 1, 1);

    await game.challengeMode.startBattle();

    const enemy = game.field.getEnemyPokemon();
    vi.spyOn(enemy, "getMoveEffectiveness");

    game.move.select(MoveId.FREEZE_DRY);
    await game.setTurnOrder([BattlerIndex.ENEMY, BattlerIndex.PLAYER]);
    await game.phaseInterceptor.to("MoveEffectPhase");

    expect(enemy.getMoveEffectiveness).toHaveLastReturnedWith(2);
  });

  it("should deal 1x damage to water/flying type during inverse battle under Electrify", async () => {
    game.override.enemyMoveset([MoveId.ELECTRIFY]).enemySpecies(SpeciesId.GYARADOS);

    game.challengeMode.addChallenge(Challenges.INVERSE_BATTLE, 1, 1);

    await game.challengeMode.startBattle();

    const enemy = game.field.getEnemyPokemon();
    vi.spyOn(enemy, "getMoveEffectiveness");

    game.move.select(MoveId.FREEZE_DRY);
    await game.setTurnOrder([BattlerIndex.ENEMY, BattlerIndex.PLAYER]);
    await game.phaseInterceptor.to("BerryPhase");

    expect(enemy.getMoveEffectiveness).toHaveReturnedWith(1);
  });
});
