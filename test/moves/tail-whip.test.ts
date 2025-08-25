import { AbilityId } from "#enums/ability-id";
import { MoveId } from "#enums/move-id";
import { SpeciesId } from "#enums/species-id";
import { Stat } from "#enums/stat";
import { GameManager } from "#test/test-utils/game-manager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";

describe("Moves - Tail whip", () => {
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
    const moveToUse = MoveId.TAIL_WHIP;
    game.override
      .battleStyle("single")
      .enemySpecies(SpeciesId.RATTATA)
      .enemyAbility(AbilityId.INSOMNIA)
      .ability(AbilityId.INSOMNIA)
      .startingLevel(2000)
      .moveset([moveToUse])
      .enemyMoveset(MoveId.SPLASH);
  });

  it("should lower DEF stat stage by 1", async () => {
    const moveToUse = MoveId.TAIL_WHIP;
    await game.classicMode.startBattle([SpeciesId.MIGHTYENA, SpeciesId.MIGHTYENA]);

    const enemyPokemon = game.field.getEnemyPokemon();
    expect(enemyPokemon.getStatStage(Stat.DEF)).toBe(0);

    game.move.select(moveToUse);
    await game.toEndOfTurn();

    expect(enemyPokemon.getStatStage(Stat.DEF)).toBe(-1);
  });
});
