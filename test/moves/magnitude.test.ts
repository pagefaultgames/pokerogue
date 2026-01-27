import { allMoves } from "#data/data-lists";
import { AbilityId } from "#enums/ability-id";
import { MoveId } from "#enums/move-id";
import { SpeciesId } from "#enums/species-id";
import { GameManager } from "#test/test-utils/game-manager";
import { NumberHolder } from "#utils/common";
import Phaser from "phaser";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";

describe("Move - Magnitude", () => {
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
      .ability(AbilityId.BALL_FETCH)
      .battleStyle("single")
      .criticalHits(false)
      .enemySpecies(SpeciesId.MAGIKARP)
      .enemyAbility(AbilityId.BALL_FETCH)
      .enemyMoveset(MoveId.SPLASH)
      .startingLevel(100)
      .enemyLevel(100);
  });

  it("should have the correct rng thresholds and power values", async () => {
    await game.classicMode.runToSummon(SpeciesId.FEEBAS);

    const magnitudeAttr = allMoves[MoveId.MAGNITUDE].getAttrs("MagnitudePowerAttr")[0];
    const movePower = new NumberHolder(0);
    const results = { [0]: 0, [10]: 0, [30]: 0, [50]: 0, [70]: 0, [90]: 0, [110]: 0, [150]: 0 };

    await game.rng.equalSample(100, () => {
      movePower.value = 0;
      magnitudeAttr.apply(null!, null!, null!, [movePower]);
      results[movePower.value]++;
    });

    expect(results).toMatchObject({ [0]: 0, [10]: 5, [30]: 10, [50]: 20, [70]: 30, [90]: 20, [110]: 10, [150]: 5 });
  });
});
