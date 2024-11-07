import { Stat } from "#app/enums/stat";
import { Abilities } from "#enums/abilities";
import { Moves } from "#enums/moves";
import { Species } from "#enums/species";
import GameManager from "#test/utils/gameManager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";

describe("Moves - Spectral Thief", () => {
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
      .moveset([ Moves.SPLASH, Moves.SPECTRAL_THIEF ])
      .ability(Abilities.BALL_FETCH)
      .battleType("single")
      .disableCrits()
      .enemySpecies(Species.MAGIKARP)
      .enemyAbility(Abilities.BALL_FETCH)
      .enemyMoveset(Moves.ENDURE);
  });

  it("should steal positive stat changes if any before dealing damage", async () => {
    await game.classicMode.startBattle([ Species.MARSHADOW ]);
    const player = game.scene.getPlayerPokemon()!;
    const enemy = game.scene.getEnemyPokemon()!;
    enemy.setStatStage(Stat.ATK, -3);
    enemy.setStatStage(Stat.DEF, 3);
    enemy.setStatStage(Stat.SPDEF, 6);
    enemy.setStatStage(Stat.SPD, 1);

    game.move.select(Moves.SPECTRAL_THIEF);
    await game.phaseInterceptor.to("MoveEffectPhase");

    await game.phaseInterceptor.to("StatStageChangePhase");
    expect(player.getStatStage(Stat.ATK)).toBe(0);
    expect(enemy.getStatStage(Stat.ATK)).toBe(-3);

    expect(player.getStatStage(Stat.DEF)).toBe(3);
    expect(enemy.getStatStage(Stat.DEF)).toBe(0);

    await game.phaseInterceptor.to("StatStageChangePhase");
    expect(player.getStatStage(Stat.SPDEF)).toBe(6);
    expect(enemy.getStatStage(Stat.SPDEF)).toBe(0);

    await game.phaseInterceptor.to("StatStageChangePhase");
    expect(player.getStatStage(Stat.SPD)).toBe(1);
    expect(enemy.getStatStage(Stat.SPD)).toBe(0);

    expect(enemy.getHpRatio()).toBe(1);

    await game.phaseInterceptor.to("TurnEndPhase");
    expect(enemy.getHpRatio()).toBeLessThan(1);
  });

  it("should bypass substitute", async () => {
    game.override.enemyMoveset(Moves.SUBSTITUTE);
    await game.classicMode.startBattle([ Species.MARSHADOW ]);
    const player = game.scene.getPlayerPokemon()!;
    const enemy = game.scene.getEnemyPokemon()!;
    enemy.setStatStage(Stat.ATK, 6);
    enemy.setStatStage(Stat.DEF, 6);
    enemy.setStatStage(Stat.SPATK, 6);
    enemy.setStatStage(Stat.SPDEF, 6);
    enemy.setStatStage(Stat.SPD, 6);

    player.setStatStage(Stat.ATK, 6);
    player.setStatStage(Stat.DEF, 6);
    player.setStatStage(Stat.SPATK, 6);
    player.setStatStage(Stat.SPDEF, 6);
    player.setStatStage(Stat.SPD, 6);

    game.move.select(Moves.SPLASH);
    await game.phaseInterceptor.to("TurnEndPhase");
    await game.toNextTurn();

    game.move.select(Moves.SPECTRAL_THIEF);
    await game.phaseInterceptor.to("BerryPhase");

    expect(player.getStatStage(Stat.ATK)).toBe(6);
    expect(player.getStatStage(Stat.DEF)).toBe(6);
    expect(player.getStatStage(Stat.SPATK)).toBe(6);
    expect(player.getStatStage(Stat.SPDEF)).toBe(6);
    expect(player.getStatStage(Stat.SPD)).toBe(6);

    expect(enemy.getStatStage(Stat.ATK)).toBe(0);
    expect(enemy.getStatStage(Stat.DEF)).toBe(0);
    expect(enemy.getStatStage(Stat.SPATK)).toBe(0);
    expect(enemy.getStatStage(Stat.SPDEF)).toBe(0);
    expect(enemy.getStatStage(Stat.SPD)).toBe(0);

    expect(enemy.getHpRatio()).toBeLessThan(0.75);
  });

  it("should steal positive stat changes from pokemon with abilities that protect stat drops (clear body, white smoke)", async () => {
    game.override.enemyAbility(Abilities.CLEAR_BODY);
    await game.classicMode.startBattle([ Species.MARSHADOW ]);
    const player = game.scene.getPlayerPokemon()!;
    const enemy = game.scene.getEnemyPokemon()!;
    enemy.setStatStage(Stat.ATK, -3);
    enemy.setStatStage(Stat.DEF, 3);
    enemy.setStatStage(Stat.SPDEF, 6);
    enemy.setStatStage(Stat.SPD, 1);

    game.move.select(Moves.SPECTRAL_THIEF);
    await game.phaseInterceptor.to("BerryPhase");

    expect(player.getStatStage(Stat.ATK)).toBe(0);
    expect(player.getStatStage(Stat.DEF)).toBe(3);
    expect(player.getStatStage(Stat.SPDEF)).toBe(6);
    expect(player.getStatStage(Stat.SPD)).toBe(1);

    expect(enemy.getStatStage(Stat.ATK)).toBe(-3);
    expect(enemy.getStatStage(Stat.DEF)).toBe(0);
    expect(enemy.getStatStage(Stat.SPDEF)).toBe(0);
    expect(enemy.getStatStage(Stat.SPD)).toBe(0);

    expect(enemy.getHpRatio()).toBeLessThan(1);
  });

  it("should drop stolen stat boosts when user has contrary", async () => {
    game.override.ability(Abilities.CONTRARY);
    await game.classicMode.startBattle([ Species.MARSHADOW ]);
    const player = game.scene.getPlayerPokemon()!;
    const enemy = game.scene.getEnemyPokemon()!;
    enemy.setStatStage(Stat.ATK, -3);
    enemy.setStatStage(Stat.DEF, 3);
    enemy.setStatStage(Stat.SPDEF, 6);
    enemy.setStatStage(Stat.SPD, 1);

    game.move.select(Moves.SPECTRAL_THIEF);
    await game.phaseInterceptor.to("BerryPhase");

    expect(player.getStatStage(Stat.ATK)).toBe(0);
    expect(player.getStatStage(Stat.DEF)).toBe(-3);
    expect(player.getStatStage(Stat.SPDEF)).toBe(-6);
    expect(player.getStatStage(Stat.SPD)).toBe(-1);

    expect(enemy.getStatStage(Stat.ATK)).toBe(-3);
    expect(enemy.getStatStage(Stat.DEF)).toBe(0);
    expect(enemy.getStatStage(Stat.SPDEF)).toBe(0);
    expect(enemy.getStatStage(Stat.SPD)).toBe(0);

    expect(enemy.getHpRatio()).toBeLessThan(1);
  });

  it("should double stolen stat boosts when user has simple", async () => {
    game.override.ability(Abilities.SIMPLE);
    await game.classicMode.startBattle([ Species.MARSHADOW ]);
    const player = game.scene.getPlayerPokemon()!;
    const enemy = game.scene.getEnemyPokemon()!;
    enemy.setStatStage(Stat.ATK, -3);
    enemy.setStatStage(Stat.DEF, 3);
    enemy.setStatStage(Stat.SPDEF, 6);
    enemy.setStatStage(Stat.SPD, 1);

    game.move.select(Moves.SPECTRAL_THIEF);
    await game.phaseInterceptor.to("BerryPhase");

    expect(player.getStatStage(Stat.ATK)).toBe(0);
    expect(player.getStatStage(Stat.DEF)).toBe(6);
    expect(player.getStatStage(Stat.SPDEF)).toBe(6);
    expect(player.getStatStage(Stat.SPD)).toBe(2);

    expect(enemy.getStatStage(Stat.ATK)).toBe(-3);
    expect(enemy.getStatStage(Stat.DEF)).toBe(0);
    expect(enemy.getStatStage(Stat.SPDEF)).toBe(0);
    expect(enemy.getStatStage(Stat.SPD)).toBe(0);

    expect(enemy.getHpRatio()).toBeLessThan(1);
  });

  it("should not steal stat boosts when target is immune", async () => {
    game.override.enemySpecies(Species.RATTATA);
    await game.classicMode.startBattle([ Species.MARSHADOW ]);
    const player = game.scene.getPlayerPokemon()!;
    const enemy = game.scene.getEnemyPokemon()!;
    enemy.setStatStage(Stat.ATK, -3);
    enemy.setStatStage(Stat.DEF, 3);
    enemy.setStatStage(Stat.SPDEF, 6);
    enemy.setStatStage(Stat.SPD, 1);

    game.move.select(Moves.SPECTRAL_THIEF);
    await game.phaseInterceptor.to("BerryPhase");

    expect(player.getStatStage(Stat.ATK)).toBe(0);
    expect(player.getStatStage(Stat.DEF)).toBe(0);
    expect(player.getStatStage(Stat.SPDEF)).toBe(0);
    expect(player.getStatStage(Stat.SPD)).toBe(0);

    expect(enemy.getStatStage(Stat.ATK)).toBe(-3);
    expect(enemy.getStatStage(Stat.DEF)).toBe(3);
    expect(enemy.getStatStage(Stat.SPDEF)).toBe(6);
    expect(enemy.getStatStage(Stat.SPD)).toBe(1);

    expect(enemy.getHpRatio()).toBe(1);
  });

  it("should not steal stat boosts when target is protected", async () => {
    game.override.enemyMoveset(Moves.PROTECT);
    await game.classicMode.startBattle([ Species.MARSHADOW ]);
    const player = game.scene.getPlayerPokemon()!;
    const enemy = game.scene.getEnemyPokemon()!;
    enemy.setStatStage(Stat.ATK, -3);
    enemy.setStatStage(Stat.DEF, 3);
    enemy.setStatStage(Stat.SPDEF, 6);
    enemy.setStatStage(Stat.SPD, 1);

    game.move.select(Moves.SPECTRAL_THIEF);
    await game.phaseInterceptor.to("BerryPhase");

    expect(player.getStatStage(Stat.ATK)).toBe(0);
    expect(player.getStatStage(Stat.DEF)).toBe(0);
    expect(player.getStatStage(Stat.SPDEF)).toBe(0);
    expect(player.getStatStage(Stat.SPD)).toBe(0);

    expect(enemy.getStatStage(Stat.ATK)).toBe(-3);
    expect(enemy.getStatStage(Stat.DEF)).toBe(3);
    expect(enemy.getStatStage(Stat.SPDEF)).toBe(6);
    expect(enemy.getStatStage(Stat.SPD)).toBe(1);

    expect(enemy.getHpRatio()).toBe(1);
  });

});
