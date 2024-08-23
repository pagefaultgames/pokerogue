import { Stat } from "#enums/stat";
import GameManager from "#test/utils/gameManager";
import { Abilities } from "#enums/abilities";
import { Species } from "#enums/species";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { SPLASH_ONLY } from "../utils/testUtils";

describe("Abilities - Contrary", () => {
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
      .enemySpecies(Species.BULBASAUR)
      .enemyAbility(Abilities.CONTRARY)
      .ability(Abilities.INTIMIDATE)
      .enemyMoveset(SPLASH_ONLY);
  });

  it("should invert stat changes when applied", async() => {
    await game.startBattle([
      Species.SLOWBRO
    ]);

    const enemyPokemon = game.scene.getEnemyPokemon()!;

    expect(enemyPokemon.getStatStage(Stat.ATK)).toBe(1);
  }, 20000);
});
