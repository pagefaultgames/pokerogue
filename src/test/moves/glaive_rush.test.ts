import { allMoves } from "#app/data/move";
import { Abilities } from "#app/enums/abilities";
import { Moves } from "#app/enums/moves";
import { Species } from "#app/enums/species";
import GameManager from "#test/utils/gameManager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";

const TIMEOUT = 20 * 1000;

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
      .battleType("single")
      .disableCrits()
      .enemySpecies(Species.MAGIKARP)
      .enemyAbility(Abilities.BALL_FETCH)
      .enemyMoveset(Array(4).fill(Moves.GLAIVE_RUSH))
      .starterSpecies(Species.KLINK)
      .ability(Abilities.BALL_FETCH)
      .moveset([Moves.SHADOW_SNEAK, Moves.AVALANCHE, Moves.SPLASH, Moves.GLAIVE_RUSH]);
  });

  it("takes double damage from attacks", async () => {
    await game.classicMode.startBattle();

    const enemy = game.scene.getEnemyPokemon()!;
    enemy.hp = 1000;

    game.move.select(Moves.SHADOW_SNEAK);
    await game.phaseInterceptor.to("DamagePhase");
    const damageDealt = 1000 - enemy.hp;
    await game.phaseInterceptor.to("TurnEndPhase");
    game.move.select(Moves.SHADOW_SNEAK);
    await game.phaseInterceptor.to("DamagePhase");
    expect(enemy.hp).toBeLessThanOrEqual(1001 - (damageDealt * 3));

  }, TIMEOUT);

  it("always gets hit by attacks", async () => {
    await game.classicMode.startBattle();

    const enemy = game.scene.getEnemyPokemon()!;
    enemy.hp = 1000;

    allMoves[Moves.AVALANCHE].accuracy = 0;
    game.move.select(Moves.AVALANCHE);
    await game.phaseInterceptor.to("TurnEndPhase");
    expect(enemy.hp).toBeLessThan(1000);

  }, TIMEOUT);

  it("interacts properly with multi-lens", async () => {
    game.override
      .startingHeldItems([{ name: "MULTI_LENS", count: 2 }])
      .enemyMoveset(Array(4).fill(Moves.AVALANCHE));
    await game.classicMode.startBattle();

    const player = game.scene.getPlayerPokemon()!;
    const enemy = game.scene.getEnemyPokemon()!;

    enemy.hp = 1000;
    player.hp = 1000;

    allMoves[Moves.AVALANCHE].accuracy = 0;
    game.move.select(Moves.GLAIVE_RUSH);
    await game.phaseInterceptor.to("TurnEndPhase");
    expect(player.hp).toBeLessThan(1000);
    player.hp = 1000;
    game.move.select(Moves.SPLASH);
    await game.phaseInterceptor.to("TurnEndPhase");
    expect(player.hp).toBe(1000);

  }, TIMEOUT);

  it("secondary effects only last until next move", async () => {
    game.override.enemyMoveset(Array(4).fill(Moves.SHADOW_SNEAK));
    await game.classicMode.startBattle();

    const player = game.scene.getPlayerPokemon()!;
    const enemy = game.scene.getEnemyPokemon()!;

    enemy.hp = 1000;
    player.hp = 1000;
    allMoves[Moves.SHADOW_SNEAK].accuracy = 0;

    game.move.select(Moves.GLAIVE_RUSH);
    await game.phaseInterceptor.to("TurnEndPhase");
    expect(player.hp).toBe(1000);

    game.move.select(Moves.SPLASH);
    await game.phaseInterceptor.to("TurnEndPhase");
    const damagedHp = player.hp;
    expect(player.hp).toBeLessThan(1000);

    game.move.select(Moves.SPLASH);
    await game.phaseInterceptor.to("TurnEndPhase");
    expect(player.hp).toBe(damagedHp);

  }, TIMEOUT);

  it("secondary effects are removed upon switching", async () => {
    game.override
      .enemyMoveset(Array(4).fill(Moves.SHADOW_SNEAK))
      .starterSpecies(0);
    await game.classicMode.startBattle([Species.KLINK, Species.FEEBAS]);

    const player = game.scene.getPlayerPokemon()!;
    const enemy = game.scene.getEnemyPokemon()!;

    enemy.hp = 1000;
    allMoves[Moves.SHADOW_SNEAK].accuracy = 0;

    game.move.select(Moves.GLAIVE_RUSH);
    await game.phaseInterceptor.to("TurnEndPhase");
    expect(player.hp).toBe(player.getMaxHp());

    game.doSwitchPokemon(1);
    await game.phaseInterceptor.to("TurnEndPhase");
    game.doSwitchPokemon(1);
    await game.phaseInterceptor.to("TurnEndPhase");
    expect(player.hp).toBe(player.getMaxHp());

  }, TIMEOUT);

  it("secondary effects don't activate if move fails", async () => {
    game.override.moveset([Moves.SHADOW_SNEAK, Moves.PROTECT, Moves.SPLASH, Moves.GLAIVE_RUSH]);
    await game.classicMode.startBattle();

    const player = game.scene.getPlayerPokemon()!;
    const enemy = game.scene.getEnemyPokemon()!;

    enemy.hp = 1000;
    player.hp = 1000;

    game.move.select(Moves.PROTECT);
    await game.phaseInterceptor.to("TurnEndPhase");

    game.move.select(Moves.SHADOW_SNEAK);
    await game.phaseInterceptor.to("TurnEndPhase");
    game.override.enemyMoveset(Array(4).fill(Moves.SPLASH));
    const damagedHP1 = 1000 - enemy.hp;
    enemy.hp = 1000;

    game.move.select(Moves.SHADOW_SNEAK);
    await game.phaseInterceptor.to("TurnEndPhase");
    const damagedHP2 = 1000 - enemy.hp;

    expect(damagedHP2).toBeGreaterThanOrEqual((damagedHP1 * 2) - 1);
  }, TIMEOUT);
});
