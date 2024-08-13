import { Abilities } from "#app/enums/abilities.js";
import { Moves } from "#app/enums/moves";
import { Species } from "#app/enums/species";
import { TurnEndPhase } from "#app/phases";
import GameManager from "#app/test/utils/gameManager";
import { getMovePosition } from "#app/test/utils/gameManagerUtils";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { SPLASH_ONLY } from "../utils/testUtils";

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
    game.override.battleType("single");
    game.override.disableCrits();
    game.override.enemySpecies(Species.BIDOOF);
  });

  it("prevents explosive attacks used by others", async() => {
    const moveToUse = Moves.EXPLOSION;
    const enemyAbility = Abilities.DAMP;

    game.override.ability(Abilities.NONE);
    game.override.moveset(Array(4).fill(moveToUse));
    game.override.enemyMoveset(SPLASH_ONLY);
    game.override.enemyAbility(enemyAbility);

    await game.startBattle();

    game.doAttack(getMovePosition(game.scene, 0, moveToUse));

    await game.phaseInterceptor.to(TurnEndPhase);

    expect(game.phaseInterceptor.log).toContain("ShowAbilityPhase");
    expect(game.phaseInterceptor.log).not.toContain("FaintPhase");
  }, TIMEOUT);

  it("prevents explosive attacks used by the battler with Damp", async() => {
    const moveToUse = Moves.EXPLOSION;
    const playerAbility = Abilities.DAMP;

    game.override.ability(playerAbility);
    game.override.moveset(Array(4).fill(moveToUse));
    game.override.enemyMoveset(SPLASH_ONLY);
    game.override.enemySpecies(Species.BIDOOF);
    game.override.enemyAbility(Abilities.NONE);

    await game.startBattle();

    game.doAttack(getMovePosition(game.scene, 0, moveToUse));

    await game.phaseInterceptor.to(TurnEndPhase);

    expect(game.phaseInterceptor.log).toContain("ShowAbilityPhase");
    expect(game.phaseInterceptor.log).not.toContain("FaintPhase");
  }, TIMEOUT);

  // Invalid if aftermath.test.ts has a failure.
  it("silently prevents Aftermath from triggering", async() => {
    const moveToUse = Moves.TACKLE;
    const playerAbility = Abilities.DAMP;
    const enemyAbility = Abilities.AFTERMATH;

    game.override.ability(playerAbility);
    game.override.moveset(Array(4).fill(moveToUse));
    game.override.enemyAbility(enemyAbility);
    game.override.enemyMoveset(SPLASH_ONLY);
    game.override.enemySpecies(Species.BIDOOF);

    await game.startBattle();

    game.scene.getEnemyParty()[0].hp = 1;

    game.doAttack(getMovePosition(game.scene, 0, moveToUse));

    await game.phaseInterceptor.to(TurnEndPhase);

    expect(game.phaseInterceptor.log).toContain("FaintPhase");
    expect(game.phaseInterceptor.log).not.toContain("ShowAbilityPhase");
    expect(game.scene.getParty()[0].getHpRatio()).toBe(1);
  }, TIMEOUT);


  // Ensures fix of #1476.
  it("does not show ability popup during AI calculations", async() => {
    const moveToUse = Moves.SPLASH;
    const playerAbility = Abilities.DAMP;

    game.override.ability(playerAbility);
    game.override.moveset(Array(4).fill(moveToUse));
    game.override.enemyAbility(Abilities.NONE);
    game.override.enemyMoveset([Moves.EXPLOSION, Moves.SELF_DESTRUCT, Moves.MIND_BLOWN, Moves.MISTY_EXPLOSION]);

    await game.startBattle();

    game.doAttack(getMovePosition(game.scene, 0, moveToUse));

    await game.phaseInterceptor.to(TurnEndPhase);

    expect(game.phaseInterceptor.log).not.toContain("ShowAbilityPhase");
  }, TIMEOUT);
});
