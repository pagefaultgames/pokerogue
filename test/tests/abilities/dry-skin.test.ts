import { AbilityId } from "#enums/ability-id";
import { BattlerIndex } from "#enums/battler-index";
import { MoveId } from "#enums/move-id";
import { SpeciesId } from "#enums/species-id";
import { WeatherType } from "#enums/weather-type";
import { GameManager } from "#test/framework/game-manager";
import Phaser from "phaser";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";

describe("Abilities - Dry Skin", () => {
  let phaserGame: Phaser.Game;
  let game: GameManager;

  beforeAll(() => {
    phaserGame = new Phaser.Game({
      type: Phaser.HEADLESS,
    });
  });

  beforeEach(() => {
    game = new GameManager(phaserGame);
    game.override
      .battleStyle("single")
      .criticalHits(false)
      .enemyAbility(AbilityId.DRY_SKIN)
      .enemyMoveset(MoveId.SPLASH)
      .enemySpecies(SpeciesId.CHARMANDER)
      .ability(AbilityId.BALL_FETCH);
  });

  it.each([
    { name: "Harsh Sunlight", weather: WeatherType.SUNNY },
    { name: "Extremely Harsh Sunlight", weather: WeatherType.HARSH_SUN },
  ])("should take 1/8 max HP damage each turn in $name weather", async ({ weather }) => {
    game.override.weather(weather);
    await game.classicMode.startBattle(SpeciesId.CHANDELURE);

    const enemy = game.field.getEnemyPokemon();

    game.move.use(MoveId.SPLASH);
    await game.toEndOfTurn();

    expect(enemy).toHaveTakenDamage(enemy.getMaxHp() / 8);
  });

  it.each([
    { name: "Rain", weather: WeatherType.RAIN },
    { name: "Heavy Rain", weather: WeatherType.HEAVY_RAIN },
  ])("should heal 1/8 max HP health each turn in $name weather", async ({ weather }) => {
    game.override.weather(weather);
    await game.classicMode.startBattle(SpeciesId.CHANDELURE);

    const enemy = game.field.getEnemyPokemon();
    enemy.hp = 1;

    game.move.use(MoveId.SPLASH);
    await game.toEndOfTurn();

    expect(enemy).toHaveHp(enemy.getMaxHp() / 8 + 1);
  });

  it("should increase damage taken by opposing Fire-type attacks by 25%", async () => {
    game.override.enemyAbility(AbilityId.BALL_FETCH);
    await game.classicMode.startBattle(SpeciesId.CHANDELURE);

    const enemy = game.field.getEnemyPokemon();

    // first turn w/o dry skin
    game.move.use(MoveId.FLAMETHROWER);
    await game.toNextTurn();
    const initialDmg = enemy.getInverseHp();

    enemy.hp = enemy.getMaxHp();
    game.field.mockAbility(enemy, AbilityId.DRY_SKIN);

    game.move.use(MoveId.FLAMETHROWER);
    await game.toEndOfTurn();

    expect(enemy).toHaveTakenDamage(initialDmg * 1.25);
  });

  it("should heal 1/4 of max HP instead of receiving damage if hit by a Water-type move", async () => {
    await game.classicMode.startBattle(SpeciesId.CHANDELURE);

    const enemy = game.field.getEnemyPokemon();
    enemy.hp = 1;

    game.move.use(MoveId.WATER_GUN);
    await game.toEndOfTurn();

    expect(enemy).toHaveHp(enemy.getMaxHp() / 4 + 1);
  });

  it("should not absorb incoming Water-type moves if the ability source is protected", async () => {
    await game.classicMode.startBattle(SpeciesId.CHANDELURE);

    const enemy = game.field.getEnemyPokemon();
    enemy.hp = 1;

    game.move.use(MoveId.WATER_GUN);
    await game.move.forceEnemyMove(MoveId.PROTECT);
    await game.toEndOfTurn();

    expect(enemy).toHaveHp(1);
  });

  it("should only heal once from multi-strike Water-type attacks", async () => {
    await game.classicMode.startBattle(SpeciesId.CHANDELURE);

    const enemy = game.field.getEnemyPokemon();
    enemy.hp = 1;

    game.move.use(MoveId.WATER_SHURIKEN);
    await game.toEndOfTurn();

    expect(enemy).toHaveHp(1 + enemy.getMaxHp() / 4);
  });

  it("should absorb incoming Water-type moves regardless of accuracy check", async () => {
    await game.classicMode.startBattle(SpeciesId.CHANDELURE);

    const enemy = game.field.getEnemyPokemon();
    enemy.hp -= 1;

    game.move.use(MoveId.WATER_GUN);
    game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.ENEMY]);
    await game.move.forceMiss();
    await game.toEndOfTurn();

    expect(enemy).toHaveFullHp();
  });
});
