import { BattlerIndex } from "#app/battle";
import { ArenaTagSide } from "#app/data/arena-tag";
import { WeatherType } from "#app/data/weather";
import GameManager from "#app/test/utils/gameManager";
import { Abilities } from "#enums/abilities";
import { ArenaTagType } from "#enums/arena-tag-type";
import { BattlerTagType } from "#enums/battler-tag-type";
import { Moves } from "#enums/moves";
import { Species } from "#enums/species";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";

// Bulbapedia Reference: https://bulbapedia.bulbagarden.net/wiki/Heal_Block_(move)
describe("Moves - Heal Block", () => {
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
      .moveset([Moves.ABSORB, Moves.WISH, Moves.SPLASH, Moves.AQUA_RING])
      .enemyMoveset(Moves.HEAL_BLOCK)
      .ability(Abilities.NO_GUARD)
      .enemyAbility(Abilities.BALL_FETCH)
      .enemySpecies(Species.BLISSEY)
      .disableCrits();
  });

  it("shouldn't stop damage from HP-drain attacks, just HP restoration", async() => {

    await game.classicMode.startBattle([Species.CHARIZARD]);

    const player = game.scene.getPlayerPokemon()!;
    const enemy = game.scene.getEnemyPokemon()!;

    player.damageAndUpdate(enemy.getMaxHp() - 1);

    game.move.select(Moves.ABSORB);
    await game.setTurnOrder([BattlerIndex.ENEMY, BattlerIndex.PLAYER]);
    await game.phaseInterceptor.to("TurnEndPhase");

    expect(player.hp).toBe(1);
    expect(enemy.hp).toBeLessThan(enemy.getMaxHp());
  });

  it("shouldn't stop Liquid Ooze from dealing damage", async() => {
    game.override.enemyAbility(Abilities.LIQUID_OOZE);

    await game.classicMode.startBattle([Species.CHARIZARD]);

    const player = game.scene.getPlayerPokemon()!;
    const enemy = game.scene.getEnemyPokemon()!;

    game.move.select(Moves.ABSORB);
    await game.setTurnOrder([BattlerIndex.ENEMY, BattlerIndex.PLAYER]);
    await game.phaseInterceptor.to("TurnEndPhase");

    expect(player.isFullHp()).toBe(false);
    expect(enemy.isFullHp()).toBe(false);
  });

  it("should stop delayed heals, such as from Wish", async() => {
    await game.classicMode.startBattle([Species.CHARIZARD]);

    const player = game.scene.getPlayerPokemon()!;

    player.damageAndUpdate(player.getMaxHp() - 1);

    game.move.select(Moves.WISH);
    await game.phaseInterceptor.to("TurnEndPhase");

    expect(game.scene.arena.getTagOnSide(ArenaTagType.WISH, ArenaTagSide.PLAYER)).toBeDefined();
    while (game.scene.arena.getTagOnSide(ArenaTagType.WISH, ArenaTagSide.PLAYER)) {
      game.move.select(Moves.SPLASH);
      await game.phaseInterceptor.to("TurnEndPhase");
    }

    expect(player.hp).toBe(1);
  });

  it("should prevent Grassy Terrain from restoring HP", async() => {
    game.override.enemyAbility(Abilities.GRASSY_SURGE);

    await game.classicMode.startBattle([Species.CHARIZARD]);

    const player = game.scene.getPlayerPokemon()!;

    player.damageAndUpdate(player.getMaxHp() - 1);

    game.move.select(Moves.SPLASH);
    await game.phaseInterceptor.to("TurnEndPhase");

    expect(player.hp).toBe(1);
  });

  it("should prevent healing from heal-over-time moves", async() => {
    await game.classicMode.startBattle([Species.CHARIZARD]);

    const player = game.scene.getPlayerPokemon()!;

    player.damageAndUpdate(player.getMaxHp() - 1);

    game.move.select(Moves.AQUA_RING);
    await game.phaseInterceptor.to("TurnEndPhase");

    expect(player.getTag(BattlerTagType.AQUA_RING)).toBeDefined();
    expect(player.hp).toBe(1);
  });

  it("should prevent abilities from restoring HP", async() => {
    game.override
      .weather(WeatherType.RAIN)
      .ability(Abilities.RAIN_DISH);

    await game.classicMode.startBattle([Species.CHARIZARD]);

    const player = game.scene.getPlayerPokemon()!;

    player.damageAndUpdate(player.getMaxHp() - 1);

    game.move.select(Moves.SPLASH);
    await game.phaseInterceptor.to("TurnEndPhase");

    expect(player.hp).toBe(1);
  });

  it("should stop healing from items", async() => {
    game.override.startingHeldItems([{name: "LEFTOVERS"}]);

    await game.classicMode.startBattle([Species.CHARIZARD]);

    const player = game.scene.getPlayerPokemon()!;
    player.damageAndUpdate(player.getMaxHp() - 1);

    game.move.select(Moves.SPLASH);
    await game.phaseInterceptor.to("TurnEndPhase");

    expect(player.hp).toBe(1);
  });
});
