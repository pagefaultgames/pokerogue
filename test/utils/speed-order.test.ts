import { AbilityId } from "#enums/ability-id";
import { MoveId } from "#enums/move-id";
import { SpeciesId } from "#enums/species-id";
import { Stat } from "#enums/stat";
import { GameManager } from "#test/test-utils/game-manager";
import { sortInSpeedOrder } from "#utils/speed-order";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";

describe("Utils - Speed Order", () => {
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
      .startingLevel(100)
      .enemyLevel(100)
      .enemyMoveset(MoveId.SPLASH)
      .enemyAbility(AbilityId.BALL_FETCH)
      .ability(AbilityId.BALL_FETCH)
      .enemySpecies(SpeciesId.REGIELEKI);
  });

  it("Sorts correctly in the basic case", async () => {
    await game.classicMode.startBattle([SpeciesId.SLOWPOKE, SpeciesId.MEW]);
    const [slowpoke, mew] = game.field.getPlayerParty();
    const regieleki = game.field.getEnemyPokemon();
    const pkmnList = [slowpoke, regieleki, mew];

    expect(sortInSpeedOrder(pkmnList)).toEqual([regieleki, mew, slowpoke]);
  });

  it("Correctly sorts grouped pokemon", async () => {
    await game.classicMode.startBattle([SpeciesId.SLOWPOKE, SpeciesId.MEW, SpeciesId.DITTO]);
    const [slowpoke, mew, ditto] = game.field.getPlayerParty();
    const regieleki = game.field.getEnemyPokemon();
    ditto.stats[Stat.SPD] = slowpoke.getStat(Stat.SPD);

    const pkmnList = [slowpoke, slowpoke, ditto, ditto, mew, regieleki, regieleki];
    const sorted = sortInSpeedOrder(pkmnList);

    expect([
      [regieleki, regieleki, mew, slowpoke, slowpoke, ditto, ditto],
      [regieleki, regieleki, mew, ditto, ditto, slowpoke, slowpoke],
    ]).toContainEqual(sorted);
  });
});
