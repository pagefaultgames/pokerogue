import { AbilityId } from "#enums/ability-id";
import { ArenaTagSide } from "#enums/arena-tag-side";
import { ArenaTagType } from "#enums/arena-tag-type";
import { SpeciesId } from "#enums/species-id";
import { WeatherType } from "#enums/weather-type";
import { GameManager } from "#test/test-utils/game-manager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";

describe("Abilities - Screen Cleaner", () => {
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
      .ability(AbilityId.SCREEN_CLEANER)
      .enemySpecies(SpeciesId.SHUCKLE)
      .weather(WeatherType.SNOW);
  });

  it.each([
    { name: "Reflect", tagType: ArenaTagType.REFLECT },
    { name: "Light Screen", tagType: ArenaTagType.LIGHT_SCREEN },
    { name: "Aurora Veil", tagType: ArenaTagType.AURORA_VEIL },
  ])("should remove all instances of $name on entrance", async ({ tagType }) => {
    game.scene.arena.addTag(tagType, 0, 0, 0, ArenaTagSide.PLAYER);
    game.scene.arena.addTag(tagType, 0, 0, 0, ArenaTagSide.ENEMY);
    game.scene.arena.addTag(tagType, 0, 0, 0, ArenaTagSide.BOTH);
    expect(game).toHaveArenaTag(tagType);

    await game.classicMode.startBattle([SpeciesId.SLOWKING]);

    const slowking = game.field.getPlayerPokemon();
    expect(slowking).toHaveAbilityApplied(AbilityId.SCREEN_CLEANER);
    expect(game).not.toHaveArenaTag(tagType);
  });

  it("should remove all tag types at once", async () => {
    game.scene.arena.addTag(ArenaTagType.REFLECT, 0, 0, 0);
    game.scene.arena.addTag(ArenaTagType.LIGHT_SCREEN, 0, 0, 0);
    game.scene.arena.addTag(ArenaTagType.AURORA_VEIL, 0, 0, 0);
    expect(game).toHaveArenaTag(ArenaTagType.REFLECT);
    expect(game).toHaveArenaTag(ArenaTagType.LIGHT_SCREEN);
    expect(game).toHaveArenaTag(ArenaTagType.AURORA_VEIL);

    await game.classicMode.startBattle([SpeciesId.SLOWKING]);

    const slowking = game.field.getPlayerPokemon();
    expect(slowking).toHaveAbilityApplied(AbilityId.SCREEN_CLEANER);
    expect(game).not.toHaveArenaTag(ArenaTagType.REFLECT);
    expect(game).not.toHaveArenaTag(ArenaTagType.LIGHT_SCREEN);
    expect(game).not.toHaveArenaTag(ArenaTagType.AURORA_VEIL);
  });
});
