import { AbilityId } from "#enums/ability-id";
import { ArenaTagSide } from "#enums/arena-tag-side";
import { ArenaTagType } from "#enums/arena-tag-type";
import { MoveId } from "#enums/move-id";
import { SpeciesId } from "#enums/species-id";
import { Stat } from "#enums/stat";
import { GameManager } from "#test/test-utils/game-manager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";

describe("Moves - Tailwind", () => {
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
      .battleStyle("double")
      .moveset([MoveId.TAILWIND, MoveId.SPLASH])
      .enemyMoveset(MoveId.SPLASH)
      .enemyAbility(AbilityId.BALL_FETCH)
      .ability(AbilityId.BALL_FETCH);
  });

  it("doubles the Speed stat of the Pokemons on its side", async () => {
    await game.classicMode.startBattle([SpeciesId.MAGIKARP, SpeciesId.MEOWTH]);
    const magikarp = game.scene.getPlayerField()[0];
    const meowth = game.scene.getPlayerField()[1];

    const magikarpSpd = magikarp.getStat(Stat.SPD);
    const meowthSpd = meowth.getStat(Stat.SPD);

    expect(magikarp.getEffectiveStat(Stat.SPD)).equal(magikarpSpd);
    expect(meowth.getEffectiveStat(Stat.SPD)).equal(meowthSpd);

    game.move.select(MoveId.TAILWIND);
    game.move.select(MoveId.SPLASH, 1);

    await game.phaseInterceptor.to("TurnEndPhase");

    expect(magikarp.getEffectiveStat(Stat.SPD)).toBe(magikarpSpd * 2);
    expect(meowth.getEffectiveStat(Stat.SPD)).toBe(meowthSpd * 2);
    expect(game.scene.arena.getTagOnSide(ArenaTagType.TAILWIND, ArenaTagSide.PLAYER)).toBeDefined();
  });

  it("lasts for 4 turns", async () => {
    game.override.battleStyle("single");

    await game.classicMode.startBattle([SpeciesId.MAGIKARP]);

    game.move.select(MoveId.TAILWIND);
    await game.toNextTurn();
    expect(game.scene.arena.getTagOnSide(ArenaTagType.TAILWIND, ArenaTagSide.PLAYER)).toBeDefined();

    game.move.select(MoveId.SPLASH);
    await game.toNextTurn();
    expect(game.scene.arena.getTagOnSide(ArenaTagType.TAILWIND, ArenaTagSide.PLAYER)).toBeDefined();

    game.move.select(MoveId.SPLASH);
    await game.toNextTurn();
    expect(game.scene.arena.getTagOnSide(ArenaTagType.TAILWIND, ArenaTagSide.PLAYER)).toBeDefined();

    game.move.select(MoveId.SPLASH);
    await game.toNextTurn();

    expect(game.scene.arena.getTagOnSide(ArenaTagType.TAILWIND, ArenaTagSide.PLAYER)).toBeUndefined();
  });

  it("does not affect the opposing side", async () => {
    game.override.battleStyle("single");

    await game.classicMode.startBattle([SpeciesId.MAGIKARP]);

    const ally = game.field.getPlayerPokemon();
    const enemy = game.field.getEnemyPokemon();

    const allySpd = ally.getStat(Stat.SPD);
    const enemySpd = enemy.getStat(Stat.SPD);

    expect(ally.getEffectiveStat(Stat.SPD)).equal(allySpd);
    expect(enemy.getEffectiveStat(Stat.SPD)).equal(enemySpd);
    expect(game.scene.arena.getTagOnSide(ArenaTagType.TAILWIND, ArenaTagSide.PLAYER)).toBeUndefined();
    expect(game.scene.arena.getTagOnSide(ArenaTagType.TAILWIND, ArenaTagSide.ENEMY)).toBeUndefined();

    game.move.select(MoveId.TAILWIND);

    await game.phaseInterceptor.to("TurnEndPhase");

    expect(ally.getEffectiveStat(Stat.SPD)).toBe(allySpd * 2);
    expect(enemy.getEffectiveStat(Stat.SPD)).equal(enemySpd);
    expect(game.scene.arena.getTagOnSide(ArenaTagType.TAILWIND, ArenaTagSide.PLAYER)).toBeDefined();
    expect(game.scene.arena.getTagOnSide(ArenaTagType.TAILWIND, ArenaTagSide.ENEMY)).toBeUndefined();
  });
});
