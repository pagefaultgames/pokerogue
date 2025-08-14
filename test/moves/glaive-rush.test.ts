import { allMoves } from "#data/data-lists";
import { AbilityId } from "#enums/ability-id";
import { MoveId } from "#enums/move-id";
import { SpeciesId } from "#enums/species-id";
import { GameManager } from "#test/test-utils/game-manager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";

describe("Moves - Glaive Rush", () => {
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
      .criticalHits(false)
      .enemySpecies(SpeciesId.MAGIKARP)
      .enemyAbility(AbilityId.BALL_FETCH)
      .enemyMoveset([MoveId.GLAIVE_RUSH])
      .ability(AbilityId.BALL_FETCH)
      .moveset([MoveId.SHADOW_SNEAK, MoveId.AVALANCHE, MoveId.SPLASH, MoveId.GLAIVE_RUSH]);
  });

  it("takes double damage from attacks", async () => {
    await game.classicMode.startBattle([SpeciesId.KLINK]);

    const enemy = game.field.getEnemyPokemon();
    enemy.hp = 1000;

    game.move.select(MoveId.SHADOW_SNEAK);
    await game.phaseInterceptor.to("DamageAnimPhase");
    const damageDealt = 1000 - enemy.hp;
    await game.phaseInterceptor.to("TurnEndPhase");
    game.move.select(MoveId.SHADOW_SNEAK);
    await game.phaseInterceptor.to("DamageAnimPhase");
    expect(enemy.hp).toBeLessThanOrEqual(1001 - damageDealt * 3);
  });

  it("always gets hit by attacks", async () => {
    await game.classicMode.startBattle([SpeciesId.KLINK]);

    const enemy = game.field.getEnemyPokemon();
    enemy.hp = 1000;

    allMoves[MoveId.AVALANCHE].accuracy = 0;
    game.move.select(MoveId.AVALANCHE);
    await game.phaseInterceptor.to("TurnEndPhase");
    expect(enemy.hp).toBeLessThan(1000);
  });

  it("interacts properly with multi-lens", async () => {
    game.override.startingHeldItems([{ name: "MULTI_LENS", count: 2 }]).enemyMoveset([MoveId.AVALANCHE]);
    await game.classicMode.startBattle([SpeciesId.KLINK]);

    const player = game.field.getPlayerPokemon();
    const enemy = game.field.getEnemyPokemon();

    enemy.hp = 1000;
    player.hp = 1000;

    allMoves[MoveId.AVALANCHE].accuracy = 0;
    game.move.select(MoveId.GLAIVE_RUSH);
    await game.phaseInterceptor.to("TurnEndPhase");
    expect(player.hp).toBeLessThan(1000);
    player.hp = 1000;
    game.move.select(MoveId.SPLASH);
    await game.phaseInterceptor.to("TurnEndPhase");
    expect(player.hp).toBe(1000);
  });

  it("secondary effects only last until next move", async () => {
    game.override.enemyMoveset([MoveId.SHADOW_SNEAK]);
    await game.classicMode.startBattle([SpeciesId.KLINK]);

    const player = game.field.getPlayerPokemon();
    const enemy = game.field.getEnemyPokemon();

    enemy.hp = 1000;
    player.hp = 1000;
    allMoves[MoveId.SHADOW_SNEAK].accuracy = 0;

    game.move.select(MoveId.GLAIVE_RUSH);
    await game.phaseInterceptor.to("TurnEndPhase");
    expect(player.hp).toBe(1000);

    game.move.select(MoveId.SPLASH);
    await game.phaseInterceptor.to("TurnEndPhase");
    const damagedHp = player.hp;
    expect(player.hp).toBeLessThan(1000);

    game.move.select(MoveId.SPLASH);
    await game.phaseInterceptor.to("TurnEndPhase");
    expect(player.hp).toBe(damagedHp);
  });

  it("secondary effects are removed upon switching", async () => {
    game.override.enemyMoveset([MoveId.SHADOW_SNEAK]);
    await game.classicMode.startBattle([SpeciesId.KLINK, SpeciesId.FEEBAS]);

    const player = game.field.getPlayerPokemon();
    const enemy = game.field.getEnemyPokemon();

    enemy.hp = 1000;
    allMoves[MoveId.SHADOW_SNEAK].accuracy = 0;

    game.move.select(MoveId.GLAIVE_RUSH);
    await game.phaseInterceptor.to("TurnEndPhase");
    expect(player.hp).toBe(player.getMaxHp());

    game.doSwitchPokemon(1);
    await game.phaseInterceptor.to("TurnEndPhase");
    game.doSwitchPokemon(1);
    await game.phaseInterceptor.to("TurnEndPhase");
    expect(player.hp).toBe(player.getMaxHp());
  });

  it("secondary effects don't activate if move fails", async () => {
    game.override
      .moveset([MoveId.SHADOW_SNEAK, MoveId.PROTECT, MoveId.SPLASH, MoveId.GLAIVE_RUSH])
      .enemyMoveset([MoveId.GLAIVE_RUSH, MoveId.SPLASH]);
    await game.classicMode.startBattle([SpeciesId.KLINK]);

    const player = game.field.getPlayerPokemon();
    const enemy = game.field.getEnemyPokemon();

    enemy.hp = 1000;
    player.hp = 1000;

    game.move.select(MoveId.PROTECT);
    await game.move.forceEnemyMove(MoveId.GLAIVE_RUSH);
    await game.phaseInterceptor.to("TurnEndPhase");

    game.move.select(MoveId.SHADOW_SNEAK);
    await game.move.forceEnemyMove(MoveId.GLAIVE_RUSH);
    await game.phaseInterceptor.to("TurnEndPhase");
    const damagedHP1 = 1000 - enemy.hp;
    enemy.hp = 1000;

    game.move.select(MoveId.SHADOW_SNEAK);
    await game.move.forceEnemyMove(MoveId.SPLASH);
    await game.phaseInterceptor.to("TurnEndPhase");
    const damagedHP2 = 1000 - enemy.hp;

    expect(damagedHP2).toBeGreaterThanOrEqual(damagedHP1 * 2 - 1);
  });
});
