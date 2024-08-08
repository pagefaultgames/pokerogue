import { ArenaTagSide } from "#app/data/arena-tag.js";
import { Stat } from "#app/data/pokemon-stat.js";
import { ArenaTagType } from "#app/enums/arena-tag-type.js";
import { TurnEndPhase } from "#app/phases";
import GameManager from "#test/utils/gameManager";
import { getMovePosition } from "#test/utils/gameManagerUtils";
import { Moves } from "#enums/moves";
import { Species } from "#enums/species";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { SPLASH_ONLY } from "#test/utils/testUtils";

describe("Abilities - Wind Rider", () => {
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
    game.override.battleType("double");
    game.override.moveset([Moves.TAILWIND, Moves.SPLASH, Moves.PETAL_BLIZZARD, Moves.SANDSTORM]);
    game.override.enemyMoveset(SPLASH_ONLY);
  });

  it("doubles the Speed stat of the Pokemons on its side", async () => {
    await game.startBattle([Species.MAGIKARP, Species.MEOWTH]);
    const magikarp = game.scene.getPlayerField()[0];
    const meowth = game.scene.getPlayerField()[1];

    const magikarpSpd = magikarp.getStat(Stat.SPD);
    const meowthSpd = meowth.getStat(Stat.SPD);

    expect(magikarp.getBattleStat(Stat.SPD)).equal(magikarpSpd);
    expect(meowth.getBattleStat(Stat.SPD)).equal(meowthSpd);

    game.doAttack(getMovePosition(game.scene, 0, Moves.TAILWIND));
    game.doAttack(getMovePosition(game.scene, 1, Moves.SPLASH));

    await game.phaseInterceptor.to(TurnEndPhase);

    expect(magikarp.getBattleStat(Stat.SPD)).toBe(magikarpSpd * 2);
    expect(meowth.getBattleStat(Stat.SPD)).toBe(meowthSpd * 2);
    expect(game.scene.arena.getTagOnSide(ArenaTagType.TAILWIND, ArenaTagSide.PLAYER)).toBeDefined();
  });

  it("lasts for 4 turns", async () => {
    game.override.battleType("single");

    await game.startBattle([Species.MAGIKARP]);

    game.doAttack(getMovePosition(game.scene, 0, Moves.TAILWIND));
    await game.toNextTurn();
    expect(game.scene.arena.getTagOnSide(ArenaTagType.TAILWIND, ArenaTagSide.PLAYER)).toBeDefined();

    game.doAttack(getMovePosition(game.scene, 0, Moves.SPLASH));
    await game.toNextTurn();
    expect(game.scene.arena.getTagOnSide(ArenaTagType.TAILWIND, ArenaTagSide.PLAYER)).toBeDefined();

    game.doAttack(getMovePosition(game.scene, 0, Moves.SPLASH));
    await game.toNextTurn();
    expect(game.scene.arena.getTagOnSide(ArenaTagType.TAILWIND, ArenaTagSide.PLAYER)).toBeDefined();

    game.doAttack(getMovePosition(game.scene, 0, Moves.SPLASH));
    await game.toNextTurn();

    expect(game.scene.arena.getTagOnSide(ArenaTagType.TAILWIND, ArenaTagSide.PLAYER)).toBeUndefined();
  });

  it("does not affect the opposing side", async () => {
    game.override.battleType("single");

    await game.startBattle([Species.MAGIKARP]);

    const ally = game.scene.getPlayerPokemon()!;
    const enemy = game.scene.getEnemyPokemon()!;

    const allySpd = ally.getStat(Stat.SPD);
    const enemySpd = enemy.getStat(Stat.SPD);


    expect(ally.getBattleStat(Stat.SPD)).equal(allySpd);
    expect(enemy.getBattleStat(Stat.SPD)).equal(enemySpd);
    expect(game.scene.arena.getTagOnSide(ArenaTagType.TAILWIND, ArenaTagSide.PLAYER)).toBeUndefined();
    expect(game.scene.arena.getTagOnSide(ArenaTagType.TAILWIND, ArenaTagSide.ENEMY)).toBeUndefined();

    game.doAttack(getMovePosition(game.scene, 0, Moves.TAILWIND));

    await game.phaseInterceptor.to(TurnEndPhase);

    expect(ally.getBattleStat(Stat.SPD)).toBe(allySpd * 2);
    expect(enemy.getBattleStat(Stat.SPD)).equal(enemySpd);
    expect(game.scene.arena.getTagOnSide(ArenaTagType.TAILWIND, ArenaTagSide.PLAYER)).toBeDefined();
    expect(game.scene.arena.getTagOnSide(ArenaTagType.TAILWIND, ArenaTagSide.ENEMY)).toBeUndefined();
  });
});
