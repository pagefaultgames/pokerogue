import { Abilities } from "#enums/abilities";
import { BattlerIndex } from "#app/battle";
import { Stat } from "#enums/stat";
import { allMoves } from "#app/data/moves/move";
import { Moves } from "#enums/moves";
import { Species } from "#enums/species";
import { TurnEndPhase } from "#app/phases/turn-end-phase";
import GameManager from "#test/testUtils/gameManager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";

describe("Moves - Spectral Thief", () => {
  let phaserGame: Phaser.Game;
  let game: GameManager;

  beforeAll(() => {
    phaserGame = new Phaser.Game({ type: Phaser.HEADLESS });
  });

  afterEach(() => {
    game.phaseInterceptor.restoreOg();
  });

  beforeEach(() => {
    game = new GameManager(phaserGame);
    game.override
      .enemySpecies(Species.SHUCKLE)
      .enemyLevel(100)
      .enemyMoveset(Moves.SPLASH)
      .enemyAbility(Abilities.BALL_FETCH)
      .moveset([Moves.SPECTRAL_THIEF, Moves.SPLASH])
      .ability(Abilities.BALL_FETCH).disableCrits;
  });

  it("should steal max possible positive stat changes and ignore negative ones.", async () => {
    await game.classicMode.startBattle();

    const player = game.scene.getPlayerPokemon()!;
    const enemy = game.scene.getEnemyPokemon()!;

    enemy.setStatStage(Stat.ATK, 6);
    enemy.setStatStage(Stat.DEF, -6);
    enemy.setStatStage(Stat.SPATK, 6);
    enemy.setStatStage(Stat.SPDEF, -6);
    enemy.setStatStage(Stat.SPD, 3);

    player.setStatStage(Stat.ATK, 4);
    player.setStatStage(Stat.DEF, 1);
    player.setStatStage(Stat.SPATK, 0);
    player.setStatStage(Stat.SPDEF, 0);
    player.setStatStage(Stat.SPD, -2);

    game.move.select(Moves.SPECTRAL_THIEF);
    await game.phaseInterceptor.to(TurnEndPhase);

    /**
     * enemy has +6 ATK and player +4 => player only steals +2
     * enemy has -6 DEF and player 1 => player should not steal
     * enemy has +6 SPATK and player 0 => player only steals +6
     * enemy has -6 SPDEF and player 0 => player should not steal
     * enemy has +3 SPD and player -2 => player only steals +3
     */
    expect(player.getStatStages()).toEqual([6, 1, 6, 0, 1, 0, 0]);
    expect(enemy.getStatStages()).toEqual([4, -6, 0, -6, 0, 0, 0]);
  });

  it("should steal stat stages before dmg calculation", async () => {
    game.override.enemySpecies(Species.MAGIKARP).enemyLevel(50);
    await game.classicMode.startBattle();

    const player = game.scene.getPlayerPokemon()!;
    const enemy = game.scene.getEnemyPokemon()!;
    const moveToCheck = allMoves[Moves.SPECTRAL_THIEF];
    const dmgBefore = enemy.getAttackDamage({ source: player, move: moveToCheck }).damage;

    enemy.setStatStage(Stat.ATK, 6);

    player.setStatStage(Stat.ATK, 0);

    game.move.select(Moves.SPECTRAL_THIEF);
    await game.phaseInterceptor.to(TurnEndPhase);

    expect(dmgBefore).toBeLessThan(enemy.getAttackDamage({ source: player, move: moveToCheck }).damage);
  });

  it("should steal stat stages as a negative value with Contrary.", async () => {
    game.override.ability(Abilities.CONTRARY);
    await game.classicMode.startBattle();

    const player = game.scene.getPlayerPokemon()!;
    const enemy = game.scene.getEnemyPokemon()!;

    enemy.setStatStage(Stat.ATK, 6);

    player.setStatStage(Stat.ATK, 0);

    game.move.select(Moves.SPECTRAL_THIEF);
    await game.phaseInterceptor.to(TurnEndPhase);

    expect(player.getStatStage(Stat.ATK)).toEqual(-6);
    expect(enemy.getStatStage(Stat.ATK)).toEqual(0);
  });

  it("should steal double the stat stages with Simple.", async () => {
    game.override.ability(Abilities.SIMPLE);
    await game.classicMode.startBattle();

    const player = game.scene.getPlayerPokemon()!;
    const enemy = game.scene.getEnemyPokemon()!;

    enemy.setStatStage(Stat.ATK, 3);

    player.setStatStage(Stat.ATK, 0);

    game.move.select(Moves.SPECTRAL_THIEF);
    await game.phaseInterceptor.to(TurnEndPhase);

    expect(player.getStatStage(Stat.ATK)).toEqual(6);
    expect(enemy.getStatStage(Stat.ATK)).toEqual(0);
  });

  it("should steal the stat stages through Clear Body.", async () => {
    game.override.enemyAbility(Abilities.CLEAR_BODY);
    await game.classicMode.startBattle();

    const player = game.scene.getPlayerPokemon()!;
    const enemy = game.scene.getEnemyPokemon()!;

    enemy.setStatStage(Stat.ATK, 3);

    player.setStatStage(Stat.ATK, 0);

    game.move.select(Moves.SPECTRAL_THIEF);
    await game.phaseInterceptor.to(TurnEndPhase);

    expect(player.getStatStage(Stat.ATK)).toEqual(3);
    expect(enemy.getStatStage(Stat.ATK)).toEqual(0);
  });

  it("should steal the stat stages through White Smoke.", async () => {
    game.override.enemyAbility(Abilities.WHITE_SMOKE);
    await game.classicMode.startBattle();

    const player = game.scene.getPlayerPokemon()!;
    const enemy = game.scene.getEnemyPokemon()!;

    enemy.setStatStage(Stat.ATK, 3);

    player.setStatStage(Stat.ATK, 0);

    game.move.select(Moves.SPECTRAL_THIEF);
    await game.phaseInterceptor.to(TurnEndPhase);

    expect(player.getStatStage(Stat.ATK)).toEqual(3);
    expect(enemy.getStatStage(Stat.ATK)).toEqual(0);
  });

  it("should steal the stat stages through Hyper Cutter.", async () => {
    game.override.enemyAbility(Abilities.HYPER_CUTTER);
    await game.classicMode.startBattle();

    const player = game.scene.getPlayerPokemon()!;
    const enemy = game.scene.getEnemyPokemon()!;

    enemy.setStatStage(Stat.ATK, 3);

    player.setStatStage(Stat.ATK, 0);

    game.move.select(Moves.SPECTRAL_THIEF);
    await game.phaseInterceptor.to(TurnEndPhase);

    expect(player.getStatStage(Stat.ATK)).toEqual(3);
    expect(enemy.getStatStage(Stat.ATK)).toEqual(0);
  });

  it("should bypass Substitute.", async () => {
    game.override.enemyMoveset(Moves.SUBSTITUTE);
    await game.classicMode.startBattle();

    const player = game.scene.getPlayerPokemon()!;
    const enemy = game.scene.getEnemyPokemon()!;

    enemy.setStatStage(Stat.ATK, 3);

    player.setStatStage(Stat.ATK, 0);

    game.move.select(Moves.SPECTRAL_THIEF);
    await game.setTurnOrder([BattlerIndex.ENEMY, BattlerIndex.PLAYER]);
    await game.phaseInterceptor.to(TurnEndPhase);

    expect(player.getStatStage(Stat.ATK)).toEqual(3);
    expect(enemy.getStatStage(Stat.ATK)).toEqual(0);
    expect(enemy.hp).toBeLessThan(enemy.getMaxHp() - 1);
  });

  it("should get blocked by protect.", async () => {
    game.override.enemyMoveset(Moves.PROTECT);
    await game.classicMode.startBattle();

    const player = game.scene.getPlayerPokemon()!;
    const enemy = game.scene.getEnemyPokemon()!;

    enemy.setStatStage(Stat.ATK, 3);

    player.setStatStage(Stat.ATK, 0);

    game.move.select(Moves.SPECTRAL_THIEF);
    await game.phaseInterceptor.to(TurnEndPhase);

    expect(player.getStatStage(Stat.ATK)).toEqual(0);
    expect(enemy.getStatStage(Stat.ATK)).toEqual(3);
    expect(enemy.hp).toBe(enemy.getMaxHp());
  });
});
