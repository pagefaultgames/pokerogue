import { Abilities } from "#app/enums/abilities";
import { Moves } from "#app/enums/moves";
import { Species } from "#app/enums/species";
import GameManager from "#app/test/utils/gameManager";
import { SPLASH_ONLY } from "#test/utils/testUtils";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";

const TIMEOUT = 20 * 1000;

describe("Abilities - Damp", () => {
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
      .disableCrits()
      .enemySpecies(Species.BIDOOF)
      .enemyMoveset(SPLASH_ONLY)
      .enemyAbility(Abilities.BALL_FETCH)
      .ability(Abilities.DAMP)
      .moveset([Moves.EXPLOSION, Moves.TACKLE, Moves.SPLASH]);
  });

  it("prevents explosive attacks used by others", async() => {
    game.override
      .ability(Abilities.BALL_FETCH)
      .enemyAbility(Abilities.DAMP);

    await game.classicMode.startBattle();

    game.move.select(Moves.EXPLOSION);

    await game.phaseInterceptor.to("TurnEndPhase");

    expect(game.phaseInterceptor.log).toContain("ShowAbilityPhase");
    expect(game.phaseInterceptor.log).not.toContain("FaintPhase");
  }, TIMEOUT);

  it("prevents explosive attacks used by the battler with Damp", async() => {
    await game.classicMode.startBattle();

    game.move.select(Moves.EXPLOSION);

    await game.phaseInterceptor.to("TurnEndPhase");

    expect(game.phaseInterceptor.log).toContain("ShowAbilityPhase");
    expect(game.phaseInterceptor.log).not.toContain("FaintPhase");
  }, TIMEOUT);

  // Invalid if aftermath.test.ts has a failure.
  it("silently prevents Aftermath from triggering", async() => {
    game.override.enemyAbility(Abilities.AFTERMATH);

    await game.classicMode.startBattle();

    game.scene.getEnemyParty()[0].hp = 1;

    game.move.select(Moves.TACKLE);

    await game.phaseInterceptor.to("TurnEndPhase");

    expect(game.phaseInterceptor.log).toContain("FaintPhase");
    expect(game.phaseInterceptor.log).not.toContain("ShowAbilityPhase");
    expect(game.scene.getParty()[0].isFullHp()).toBe(true);
  }, TIMEOUT);

  // Ensures fix of #1476.
  it("does not show ability popup during AI calculations", async() => {
    game.override.enemyMoveset([Moves.EXPLOSION, Moves.SELF_DESTRUCT, Moves.MIND_BLOWN, Moves.MISTY_EXPLOSION]);

    await game.classicMode.startBattle();

    game.move.select(Moves.SPLASH);

    await game.phaseInterceptor.to("TurnEndPhase");

    expect(game.phaseInterceptor.log).not.toContain("ShowAbilityPhase");
  }, TIMEOUT);
});
