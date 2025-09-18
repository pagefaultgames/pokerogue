import { AbilityId } from "#enums/ability-id";
import { BattlerIndex } from "#enums/battler-index";
import { BattlerTagType } from "#enums/battler-tag-type";
import { MoveId } from "#enums/move-id";
import { PositionalTagType } from "#enums/positional-tag-type";
import { SpeciesId } from "#enums/species-id";
import { WeatherType } from "#enums/weather-type";
import { GameManager } from "#test/test-utils/game-manager";
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
      .moveset([MoveId.ABSORB, MoveId.WISH, MoveId.SPLASH, MoveId.AQUA_RING])
      .enemyMoveset(MoveId.HEAL_BLOCK)
      .ability(AbilityId.NO_GUARD)
      .enemyAbility(AbilityId.BALL_FETCH)
      .enemySpecies(SpeciesId.BLISSEY)
      .criticalHits(false);
  });

  it("shouldn't stop damage from HP-drain attacks, just HP restoration", async () => {
    await game.classicMode.startBattle([SpeciesId.CHARIZARD]);

    const player = game.field.getPlayerPokemon();
    const enemy = game.field.getEnemyPokemon();

    player.damageAndUpdate(player.getMaxHp() - 1);

    game.move.select(MoveId.ABSORB);
    await game.setTurnOrder([BattlerIndex.ENEMY, BattlerIndex.PLAYER]);
    await game.phaseInterceptor.to("TurnEndPhase");

    expect(player.hp).toBe(1);
    expect(enemy.hp).toBeLessThan(enemy.getMaxHp());
  });

  it("shouldn't stop Liquid Ooze from dealing damage", async () => {
    game.override.enemyAbility(AbilityId.LIQUID_OOZE);

    await game.classicMode.startBattle([SpeciesId.CHARIZARD]);

    const player = game.field.getPlayerPokemon();
    const enemy = game.field.getEnemyPokemon();

    game.move.select(MoveId.ABSORB);
    await game.setTurnOrder([BattlerIndex.ENEMY, BattlerIndex.PLAYER]);
    await game.phaseInterceptor.to("TurnEndPhase");

    expect(player.isFullHp()).toBe(false);
    expect(enemy.isFullHp()).toBe(false);
  });

  it("should prevent Wish from restoring HP", async () => {
    await game.classicMode.startBattle([SpeciesId.CHARIZARD]);

    const player = game.field.getPlayerPokemon();

    player.hp = 1;

    game.move.use(MoveId.WISH);
    await game.toNextTurn();

    expect(game.scene.arena.positionalTagManager.tags.filter(t => t.tagType === PositionalTagType.WISH)) //
      .toHaveLength(1);

    game.move.use(MoveId.SPLASH);
    await game.toNextTurn();

    // wish triggered, but did NOT heal the player
    expect(game.scene.arena.positionalTagManager.tags.filter(t => t.tagType === PositionalTagType.WISH)) //
      .toHaveLength(0);
    expect(player.hp).toBe(1);
  });

  it("should prevent Grassy Terrain from restoring HP", async () => {
    game.override.enemyAbility(AbilityId.GRASSY_SURGE);

    await game.classicMode.startBattle([SpeciesId.CHARIZARD]);

    const player = game.field.getPlayerPokemon();

    player.damageAndUpdate(player.getMaxHp() - 1);

    game.move.select(MoveId.SPLASH);
    await game.phaseInterceptor.to("TurnEndPhase");

    expect(player.hp).toBe(1);
  });

  it("should prevent healing from heal-over-time moves", async () => {
    await game.classicMode.startBattle([SpeciesId.CHARIZARD]);

    const player = game.field.getPlayerPokemon();

    player.damageAndUpdate(player.getMaxHp() - 1);

    game.move.select(MoveId.AQUA_RING);
    await game.phaseInterceptor.to("TurnEndPhase");

    expect(player.getTag(BattlerTagType.AQUA_RING)).toBeDefined();
    expect(player.hp).toBe(1);
  });

  it("should prevent abilities from restoring HP", async () => {
    game.override.weather(WeatherType.RAIN).ability(AbilityId.RAIN_DISH);

    await game.classicMode.startBattle([SpeciesId.CHARIZARD]);

    const player = game.field.getPlayerPokemon();

    player.damageAndUpdate(player.getMaxHp() - 1);

    game.move.select(MoveId.SPLASH);
    await game.phaseInterceptor.to("TurnEndPhase");

    expect(player.hp).toBe(1);
  });

  it("should stop healing from items", async () => {
    game.override.startingHeldItems([{ name: "LEFTOVERS" }]);

    await game.classicMode.startBattle([SpeciesId.CHARIZARD]);

    const player = game.field.getPlayerPokemon();
    player.damageAndUpdate(player.getMaxHp() - 1);

    game.move.select(MoveId.SPLASH);
    await game.phaseInterceptor.to("TurnEndPhase");

    expect(player.hp).toBe(1);
  });
});
