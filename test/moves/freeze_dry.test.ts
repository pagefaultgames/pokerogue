import { BattlerIndex } from "#app/battle";
import { Abilities } from "#app/enums/abilities";
import { Moves } from "#app/enums/moves";
import { Species } from "#app/enums/species";
import { PokemonType } from "#enums/pokemon-type";
import { Challenges } from "#enums/challenges";
import GameManager from "#test/testUtils/gameManager";
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
      .enemySpecies(Species.MAGIKARP)
      .enemyAbility(Abilities.BALL_FETCH)
      .enemyMoveset(Moves.SPLASH)
      .starterSpecies(Species.FEEBAS)
      .ability(Abilities.BALL_FETCH)
      .moveset([Moves.FREEZE_DRY, Moves.FORESTS_CURSE, Moves.SOAK]);
  });

  it("should deal 2x damage to pure water types", async () => {
    await game.classicMode.startBattle();

    const enemy = game.scene.getEnemyPokemon()!;
    vi.spyOn(enemy, "getMoveEffectiveness");

    game.move.select(Moves.FREEZE_DRY);
    await game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.ENEMY]);
    await game.phaseInterceptor.to("MoveEffectPhase");

    expect(enemy.getMoveEffectiveness).toHaveReturnedWith(2);
  });

  it("should deal 4x damage to water/flying types", async () => {
    game.override.enemySpecies(Species.WINGULL);
    await game.classicMode.startBattle();

    const enemy = game.scene.getEnemyPokemon()!;
    vi.spyOn(enemy, "getMoveEffectiveness");

    game.move.select(Moves.FREEZE_DRY);
    await game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.ENEMY]);
    await game.phaseInterceptor.to("MoveEffectPhase");

    expect(enemy.getMoveEffectiveness).toHaveReturnedWith(4);
  });

  it("should deal 1x damage to water/fire types", async () => {
    game.override.enemySpecies(Species.VOLCANION);
    await game.classicMode.startBattle();

    const enemy = game.scene.getEnemyPokemon()!;
    vi.spyOn(enemy, "getMoveEffectiveness");

    game.move.select(Moves.FREEZE_DRY);
    await game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.ENEMY]);
    await game.phaseInterceptor.to("MoveEffectPhase");

    expect(enemy.getMoveEffectiveness).toHaveReturnedWith(1);
  });

  /**
   * Freeze drys forced super effectiveness should overwrite wonder guard
   */
  it("should deal 2x dmg against soaked wonder guard target", async () => {
    game.override
      .enemySpecies(Species.SHEDINJA)
      .enemyMoveset(Moves.SPLASH)
      .starterSpecies(Species.MAGIKARP)
      .moveset([Moves.SOAK, Moves.FREEZE_DRY]);
    await game.classicMode.startBattle();

    const enemy = game.scene.getEnemyPokemon()!;
    vi.spyOn(enemy, "getMoveEffectiveness");

    game.move.select(Moves.SOAK);
    await game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.ENEMY]);
    await game.toNextTurn();

    game.move.select(Moves.FREEZE_DRY);
    await game.phaseInterceptor.to("MoveEffectPhase");

    expect(enemy.getMoveEffectiveness).toHaveReturnedWith(2);
    expect(enemy.hp).toBeLessThan(enemy.getMaxHp());
  });

  it("should deal 8x damage to water/ground/grass type under Forest's Curse", async () => {
    game.override.enemySpecies(Species.QUAGSIRE);
    await game.classicMode.startBattle();

    const enemy = game.scene.getEnemyPokemon()!;
    vi.spyOn(enemy, "getMoveEffectiveness");

    game.move.select(Moves.FORESTS_CURSE);
    await game.toNextTurn();

    game.move.select(Moves.FREEZE_DRY);
    await game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.ENEMY]);
    await game.phaseInterceptor.to("MoveEffectPhase");

    expect(enemy.getMoveEffectiveness).toHaveReturnedWith(8);
  });

  it("should deal 2x damage to steel type terastallized into water", async () => {
    game.override.enemySpecies(Species.SKARMORY);
    await game.classicMode.startBattle();

    const enemy = game.scene.getEnemyPokemon()!;
    enemy.teraType = PokemonType.WATER;
    enemy.isTerastallized = true;
    vi.spyOn(enemy, "getMoveEffectiveness");

    game.move.select(Moves.FREEZE_DRY);
    await game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.ENEMY]);
    await game.phaseInterceptor.to("MoveEffectPhase");

    expect(enemy.getMoveEffectiveness).toHaveReturnedWith(2);
  });

  it("should deal 0.5x damage to water type terastallized into fire", async () => {
    game.override.enemySpecies(Species.PELIPPER);
    await game.classicMode.startBattle();

    const enemy = game.scene.getEnemyPokemon()!;
    enemy.teraType = PokemonType.FIRE;
    enemy.isTerastallized = true;
    vi.spyOn(enemy, "getMoveEffectiveness");

    game.move.select(Moves.FREEZE_DRY);
    await game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.ENEMY]);
    await game.phaseInterceptor.to("MoveEffectPhase");

    expect(enemy.getMoveEffectiveness).toHaveReturnedWith(0.5);
  });

  it("should deal 0.5x damage to water type Terapagos with Tera Shell", async () => {
    game.override.enemySpecies(Species.TERAPAGOS).enemyAbility(Abilities.TERA_SHELL);
    await game.classicMode.startBattle();

    const enemy = game.scene.getEnemyPokemon()!;
    vi.spyOn(enemy, "getMoveEffectiveness");

    game.move.select(Moves.SOAK);
    await game.toNextTurn();

    game.move.select(Moves.FREEZE_DRY);
    await game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.ENEMY]);
    await game.phaseInterceptor.to("MoveEffectPhase");

    expect(enemy.getMoveEffectiveness).toHaveReturnedWith(0.5);
  });

  it("should deal 2x damage to water type under Normalize", async () => {
    game.override.ability(Abilities.NORMALIZE);
    await game.classicMode.startBattle();

    const enemy = game.scene.getEnemyPokemon()!;
    vi.spyOn(enemy, "getMoveEffectiveness");

    game.move.select(Moves.FREEZE_DRY);
    await game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.ENEMY]);
    await game.phaseInterceptor.to("MoveEffectPhase");

    expect(enemy.getMoveEffectiveness).toHaveReturnedWith(2);
  });

  it("should deal 0.25x damage to rock/steel type under Normalize", async () => {
    game.override.ability(Abilities.NORMALIZE).enemySpecies(Species.SHIELDON);
    await game.classicMode.startBattle();

    const enemy = game.scene.getEnemyPokemon()!;
    vi.spyOn(enemy, "getMoveEffectiveness");

    game.move.select(Moves.FREEZE_DRY);
    await game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.ENEMY]);
    await game.phaseInterceptor.to("MoveEffectPhase");

    expect(enemy.getMoveEffectiveness).toHaveReturnedWith(0.25);
  });

  it("should deal 0x damage to water/ghost type under Normalize", async () => {
    game.override.ability(Abilities.NORMALIZE).enemySpecies(Species.JELLICENT);
    await game.classicMode.startBattle();

    const enemy = game.scene.getEnemyPokemon()!;
    vi.spyOn(enemy, "getMoveEffectiveness");

    game.move.select(Moves.FREEZE_DRY);
    await game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.ENEMY]);
    await game.phaseInterceptor.to("BerryPhase");

    expect(enemy.getMoveEffectiveness).toHaveReturnedWith(0);
  });

  it("should deal 2x damage to water type under Electrify", async () => {
    game.override.enemyMoveset([Moves.ELECTRIFY]);
    await game.classicMode.startBattle();

    const enemy = game.scene.getEnemyPokemon()!;
    vi.spyOn(enemy, "getMoveEffectiveness");

    game.move.select(Moves.FREEZE_DRY);
    await game.setTurnOrder([BattlerIndex.ENEMY, BattlerIndex.PLAYER]);
    await game.phaseInterceptor.to("BerryPhase");

    expect(enemy.getMoveEffectiveness).toHaveReturnedWith(2);
  });

  it("should deal 4x damage to water/flying type under Electrify", async () => {
    game.override.enemyMoveset([Moves.ELECTRIFY]).enemySpecies(Species.GYARADOS);
    await game.classicMode.startBattle();

    const enemy = game.scene.getEnemyPokemon()!;
    vi.spyOn(enemy, "getMoveEffectiveness");

    game.move.select(Moves.FREEZE_DRY);
    await game.setTurnOrder([BattlerIndex.ENEMY, BattlerIndex.PLAYER]);
    await game.phaseInterceptor.to("BerryPhase");

    expect(enemy.getMoveEffectiveness).toHaveReturnedWith(4);
  });

  it("should deal 0x damage to water/ground type under Electrify", async () => {
    game.override.enemyMoveset([Moves.ELECTRIFY]).enemySpecies(Species.BARBOACH);
    await game.classicMode.startBattle();

    const enemy = game.scene.getEnemyPokemon()!;
    vi.spyOn(enemy, "getMoveEffectiveness");

    game.move.select(Moves.FREEZE_DRY);
    await game.setTurnOrder([BattlerIndex.ENEMY, BattlerIndex.PLAYER]);
    await game.phaseInterceptor.to("BerryPhase");

    expect(enemy.getMoveEffectiveness).toHaveReturnedWith(0);
  });

  it("should deal 0.25x damage to Grass/Dragon type under Electrify", async () => {
    game.override.enemyMoveset([Moves.ELECTRIFY]).enemySpecies(Species.FLAPPLE);
    await game.classicMode.startBattle();

    const enemy = game.scene.getEnemyPokemon()!;
    vi.spyOn(enemy, "getMoveEffectiveness");

    game.move.select(Moves.FREEZE_DRY);
    await game.setTurnOrder([BattlerIndex.ENEMY, BattlerIndex.PLAYER]);
    await game.phaseInterceptor.to("BerryPhase");

    expect(enemy.getMoveEffectiveness).toHaveReturnedWith(0.25);
  });

  it("should deal 2x damage to Water type during inverse battle", async () => {
    game.override.moveset([Moves.FREEZE_DRY]).enemySpecies(Species.MAGIKARP);
    game.challengeMode.addChallenge(Challenges.INVERSE_BATTLE, 1, 1);

    await game.challengeMode.startBattle();

    const enemy = game.scene.getEnemyPokemon()!;
    vi.spyOn(enemy, "getMoveEffectiveness");

    game.move.select(Moves.FREEZE_DRY);
    await game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.ENEMY]);
    await game.phaseInterceptor.to("MoveEffectPhase");

    expect(enemy.getMoveEffectiveness).toHaveLastReturnedWith(2);
  });

  it("should deal 2x damage to Water type during inverse battle under Normalize", async () => {
    game.override.moveset([Moves.FREEZE_DRY]).ability(Abilities.NORMALIZE).enemySpecies(Species.MAGIKARP);
    game.challengeMode.addChallenge(Challenges.INVERSE_BATTLE, 1, 1);

    await game.challengeMode.startBattle();

    const enemy = game.scene.getEnemyPokemon()!;
    vi.spyOn(enemy, "getMoveEffectiveness");

    game.move.select(Moves.FREEZE_DRY);
    await game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.ENEMY]);
    await game.phaseInterceptor.to("MoveEffectPhase");

    expect(enemy.getMoveEffectiveness).toHaveLastReturnedWith(2);
  });

  it("should deal 2x damage to Water type during inverse battle under Electrify", async () => {
    game.override.moveset([Moves.FREEZE_DRY]).enemySpecies(Species.MAGIKARP).enemyMoveset([Moves.ELECTRIFY]);
    game.challengeMode.addChallenge(Challenges.INVERSE_BATTLE, 1, 1);

    await game.challengeMode.startBattle();

    const enemy = game.scene.getEnemyPokemon()!;
    vi.spyOn(enemy, "getMoveEffectiveness");

    game.move.select(Moves.FREEZE_DRY);
    await game.setTurnOrder([BattlerIndex.ENEMY, BattlerIndex.PLAYER]);
    await game.phaseInterceptor.to("MoveEffectPhase");

    expect(enemy.getMoveEffectiveness).toHaveLastReturnedWith(2);
  });

  it("should deal 1x damage to water/flying type during inverse battle under Electrify", async () => {
    game.override.enemyMoveset([Moves.ELECTRIFY]).enemySpecies(Species.GYARADOS);

    game.challengeMode.addChallenge(Challenges.INVERSE_BATTLE, 1, 1);

    await game.challengeMode.startBattle();

    const enemy = game.scene.getEnemyPokemon()!;
    vi.spyOn(enemy, "getMoveEffectiveness");

    game.move.select(Moves.FREEZE_DRY);
    await game.setTurnOrder([BattlerIndex.ENEMY, BattlerIndex.PLAYER]);
    await game.phaseInterceptor.to("BerryPhase");

    expect(enemy.getMoveEffectiveness).toHaveReturnedWith(1);
  });
});
