import { MapModifier } from "#app/modifier/modifier";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";
import GameManager from "./utils/gameManager";
//import { Abilities } from "#app/enums/abilities";
//import { Moves } from "#app/enums/moves";
//import { itemPoolChecks } from "#app/modifier/modifier-type";

//const TIMEOUT = 20 * 1000;

describe("Daily Mode", () => {
  let phaserGame: Phaser.Game;
  let game: GameManager;

  beforeAll(() => {
    phaserGame = new Phaser.Game({
      type: Phaser.HEADLESS,
    });
  });

  beforeEach(() => {
    game = new GameManager(phaserGame);
  });

  afterEach(() => {
    game.phaseInterceptor.restoreOg();
  });

  it("should initialize properly", async () => {
    await game.dailyMode.runToSummon();

    const party = game.scene.getParty();
    expect(party).toHaveLength(3);
    party.forEach(pkm => {
      expect(pkm.level).toBe(20);
      expect(pkm.moveset.length).toBeGreaterThan(0);
    });
    expect(game.scene.getModifiers(MapModifier).length).toBeGreaterThan(0);
  });
});

/*
// Need to figure out how to properly start a battle
// Need to fix eviolite - test keeps insisting it is not in loot table, even though Mini Black Hole (which is using the exact same condition) is
describe("Shop modifications", async () => {
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
      .battleType("single")
      .startingLevel(200)
      .moveset([Moves.SURF])
      .enemyAbility(Abilities.BALL_FETCH);
    itemPoolChecks.set("EVIOLITE", false);
    itemPoolChecks.set("MINI_BLACK_HOLE", false);
  });

  afterEach(() => {
    game.phaseInterceptor.restoreOg();
    itemPoolChecks.clear();
  });
});
//*/
