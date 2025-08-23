import { AbilityId } from "#enums/ability-id";
import { MoveId } from "#enums/move-id";
import { SpeciesId } from "#enums/species-id";
import { Stat } from "#enums/stat";
import { GameManager } from "#test/test-utils/game-manager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";

describe("Abilities - Simple", () => {
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
      .enemySpecies(SpeciesId.BULBASAUR)
      .enemyAbility(AbilityId.SIMPLE)
      .ability(AbilityId.INTIMIDATE)
      .enemyMoveset(MoveId.SPLASH);
  });

  it("should double stat changes when applied", async () => {
    await game.classicMode.startBattle([SpeciesId.SLOWBRO]);

    const enemyPokemon = game.field.getEnemyPokemon();

    expect(enemyPokemon.getStatStage(Stat.ATK)).toBe(-2);
  });
});
