import { allMoves } from "#app/data/move";
import { Abilities } from "#app/enums/abilities";
import { DamagePhase } from "#app/phases/damage-phase";
import { TurnEndPhase } from "#app/phases/turn-end-phase";
import GameManager from "#test/utils/gameManager";
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
    game.override.battleType("single");
    game.override.disableCrits();
    game.override.enemySpecies(Species.MAGIKARP);
    game.override.enemyAbility(Abilities.BALL_FETCH);
    game.override.enemyMoveset(Array(4).fill(Moves.GLAIVE_RUSH));
    game.override.starterSpecies(Species.KLINK);
    game.override.ability(Abilities.BALL_FETCH);
    game.override.moveset([Moves.SHADOW_SNEAK, Moves.AVALANCHE, Moves.SPLASH, Moves.GLAIVE_RUSH]);
  });

  it("takes double damage from attacks", async () => {
    await game.startBattle();
    const enemy = game.scene.getEnemyPokemon()!;
    enemy.hp = 1000;

    game.move.select(Moves.SHADOW_SNEAK);
    await game.phaseInterceptor.to(DamagePhase);
    const damageDealt = 1000 - enemy.hp;
    await game.phaseInterceptor.to(TurnEndPhase);
    game.move.select(Moves.SHADOW_SNEAK);
    await game.phaseInterceptor.to(DamagePhase);
    expect(enemy.hp).toBeLessThanOrEqual(1001 - (damageDealt * 3));

  }, 20000);

  it("always gets hit by attacks", async () => {
    await game.startBattle();
    const enemy = game.scene.getEnemyPokemon()!;
    enemy.hp = 1000;

    allMoves[Moves.AVALANCHE].accuracy = 0;
    game.move.select(Moves.AVALANCHE);
    await game.phaseInterceptor.to(TurnEndPhase);
    expect(enemy.hp).toBeLessThan(1000);

  }, 20000);

  it("interacts properly with multi-lens", async () => {
    game.override.startingHeldItems([{ name: "MULTI_LENS", count: 2 }]);
    game.override.enemyMoveset(Array(4).fill(Moves.AVALANCHE));
    await game.startBattle();
    const player = game.scene.getPlayerPokemon()!;
    const enemy = game.scene.getEnemyPokemon()!;
    enemy.hp = 1000;
    player.hp = 1000;

    allMoves[Moves.AVALANCHE].accuracy = 0;
    game.move.select(Moves.GLAIVE_RUSH);
    await game.phaseInterceptor.to(TurnEndPhase);
    expect(player.hp).toBeLessThan(1000);
    player.hp = 1000;
    game.move.select(Moves.SPLASH);
    await game.phaseInterceptor.to(TurnEndPhase);
    expect(player.hp).toBe(1000);

  }, 20000);

  it("secondary effects only last until next move", async () => {
    game.override.enemyMoveset(Array(4).fill(Moves.SHADOW_SNEAK));
    await game.startBattle();
    const player = game.scene.getPlayerPokemon()!;
    const enemy = game.scene.getEnemyPokemon()!;
    enemy.hp = 1000;
    player.hp = 1000;
    allMoves[Moves.SHADOW_SNEAK].accuracy = 0;

    game.move.select(Moves.GLAIVE_RUSH);
    await game.phaseInterceptor.to(TurnEndPhase);
    expect(player.hp).toBe(1000);

    game.move.select(Moves.SPLASH);
    await game.phaseInterceptor.to(TurnEndPhase);
    const damagedHp = player.hp;
    expect(player.hp).toBeLessThan(1000);

    game.move.select(Moves.SPLASH);
    await game.phaseInterceptor.to(TurnEndPhase);
    expect(player.hp).toBe(damagedHp);

  }, 20000);

  it("secondary effects are removed upon switching", async () => {
    game.override.enemyMoveset(Array(4).fill(Moves.SHADOW_SNEAK));
    game.override.starterSpecies(0);
    await game.startBattle([Species.KLINK, Species.FEEBAS]);
    const player = game.scene.getPlayerPokemon()!;
    const enemy = game.scene.getEnemyPokemon()!;
    enemy.hp = 1000;
    allMoves[Moves.SHADOW_SNEAK].accuracy = 0;

    game.move.select(Moves.GLAIVE_RUSH);
    await game.phaseInterceptor.to(TurnEndPhase);
    expect(player.hp).toBe(player.getMaxHp());

    game.doSwitchPokemon(1);
    await game.phaseInterceptor.to(TurnEndPhase);
    game.doSwitchPokemon(1);
    await game.phaseInterceptor.to(TurnEndPhase);
    expect(player.hp).toBe(player.getMaxHp());

  }, 20000);

  it("secondary effects don't activate if move fails", async () => {
    game.override.moveset([Moves.SHADOW_SNEAK, Moves.PROTECT, Moves.SPLASH, Moves.GLAIVE_RUSH]);
    await game.startBattle();
    const player = game.scene.getPlayerPokemon()!;
    const enemy = game.scene.getEnemyPokemon()!;
    enemy.hp = 1000;
    player.hp = 1000;

    game.move.select(Moves.PROTECT);
    await game.phaseInterceptor.to(TurnEndPhase);

    game.move.select(Moves.SHADOW_SNEAK);
    await game.phaseInterceptor.to(TurnEndPhase);
    game.override.enemyMoveset(Array(4).fill(Moves.SPLASH));
    const damagedHP1 = 1000 - enemy.hp;
    enemy.hp = 1000;

    game.move.select(Moves.SHADOW_SNEAK);
    await game.phaseInterceptor.to(TurnEndPhase);
    const damagedHP2 = 1000 - enemy.hp;

    expect(damagedHP2).toBeGreaterThanOrEqual((damagedHP1 * 2) - 1);
  }, 20000);
});
