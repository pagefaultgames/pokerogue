import { Abilities } from "#app/enums/abilities";
import { Moves } from "#app/enums/moves";
import { MapModifier } from "#app/modifier/modifier";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";
import GameManager from "./utils/gameManager";
import { itemPoolChecks } from "#app/modifier/modifier-type";

const TIMEOUT = 20 * 1000;

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
  });

  afterEach(() => {
    game.phaseInterceptor.restoreOg();
  });

  it("should only allow Mini Black Hole and Eviolite outside of Daily if unlocked", async () => {
    await game.classicMode.startBattle();

    itemPoolChecks.set("EVIOLITE", false);
    itemPoolChecks.set("MINI_BLACK_HOLE", false);

    game.move.select(Moves.SURF);
    await game.phaseInterceptor.to("SelectModifierPhase", false);
    expect(itemPoolChecks.get("EVIOLITE")).toBeFalsy();
    expect(itemPoolChecks.get("MINI_BLACK_HOLE")).toBeFalsy();

    itemPoolChecks.clear();
  }, TIMEOUT);

  it("should allow Eviolite and Mini Black Hole in shop when in Daily Run", async () => {
    await game.dailyMode.startBattle();

    itemPoolChecks.set("EVIOLITE", false);
    itemPoolChecks.set("MINI_BLACK_HOLE", false);

    game.move.select(Moves.SURF);
    await game.phaseInterceptor.to("SelectModifierPhase", false);
    expect(itemPoolChecks.get("EVIOLITE")).toBeTruthy();
    expect(itemPoolChecks.get("MINI_BLACK_HOLE")).toBeTruthy();

    itemPoolChecks.clear();
  }, TIMEOUT);
});
