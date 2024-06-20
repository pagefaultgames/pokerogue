import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import Phaser from "phaser";
import GameManager from "#app/test/utils/gameManager";
import * as overrides from "#app/overrides";
import { Species } from "#enums/species";
import {
  TurnEndPhase,
} from "#app/phases";
import { Moves } from "#enums/moves";
import { getMovePosition } from "#app/test/utils/gameManagerUtils";
import { Stat } from "#app/data/pokemon-stat.js";
import { ArenaTagType } from "#app/enums/arena-tag-type.js";
import { ArenaTagSide } from "#app/data/arena-tag.js";

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
    vi.spyOn(overrides, "DOUBLE_BATTLE_OVERRIDE", "get").mockReturnValue(true);
    vi.spyOn(overrides, "MOVESET_OVERRIDE", "get").mockReturnValue([Moves.TAILWIND, Moves.SPLASH, Moves.PETAL_BLIZZARD, Moves.SANDSTORM]);
    vi.spyOn(overrides, "OPP_MOVESET_OVERRIDE", "get").mockReturnValue([Moves.SPLASH, Moves.SPLASH, Moves.SPLASH, Moves.SPLASH]);
  });

  it("doubles the Speed stat of the Pokemons on its side", async () => {
    await game.startBattle([Species.MAGIKARP, Species.MEOWTH]);
    const magikarp = game.scene.getPlayerField()[0];
    const meowth = game.scene.getPlayerField()[1];

    const magikarpSpd = magikarp.getStat(Stat.SPD);
    const meowthSpd = meowth.getStat(Stat.SPD);

    expect(magikarp.getStat(Stat.SPD)).toBe(magikarpSpd);
    expect(meowth.getStat(Stat.SPD)).toBe(meowthSpd);

    game.doAttack(getMovePosition(game.scene, 0, Moves.TAILWIND));
    game.doAttack(getMovePosition(game.scene, 1, Moves.SPLASH));

    await game.phaseInterceptor.to(TurnEndPhase);

    expect(magikarp.getBattleStat(Stat.SPD)).toBe(magikarpSpd * 2);
    expect(meowth.getBattleStat(Stat.SPD)).toBe(meowthSpd * 2);
    expect(game.scene.arena.getTagOnSide(ArenaTagType.TAILWIND, ArenaTagSide.PLAYER)).toBeDefined();
  });

  it("lasts for 4 turns", async () => {
    vi.spyOn(overrides, "DOUBLE_BATTLE_OVERRIDE", "get").mockReturnValue(false);
    vi.spyOn(overrides, "SINGLE_BATTLE_OVERRIDE", "get").mockReturnValue(true);

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
});
