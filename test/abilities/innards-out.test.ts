import { Abilities } from "#enums/abilities";
import { Moves } from "#enums/moves";
import { Species } from "#enums/species";
import GameManager from "#test/testUtils/gameManager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";

describe("Abilities - Innards Out", () => {
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
      .ability(Abilities.BALL_FETCH)
      .battleStyle("single")
      .disableCrits()
      .enemySpecies(Species.MAGIKARP)
      .enemyAbility(Abilities.INNARDS_OUT)
      .enemyMoveset(Moves.SPLASH)
      .startingLevel(100);
  });

  it("should damage opppnents that faint the ability holder for equal damage", async () => {
    await game.classicMode.startBattle([Species.FEEBAS]);

    const magikarp = game.field.getEnemyPokemon();
    magikarp.hp = 20;
    game.move.use(Moves.X_SCISSOR);
    await game.phaseInterceptor.to("BerryPhase");

    expect(magikarp.isFainted()).toBe(true);
    const feebas = game.field.getPlayerPokemon();
    expect(feebas.getInverseHp()).toBe(20);
  });

  it("should not damage an ally in Double Battles", async () => {
    game.override.battleStyle("double");
    await game.classicMode.startBattle([Species.FEEBAS]);

    const [magikarp1, magikarp2] = game.scene.getEnemyField();
    magikarp1.hp = 1;

    game.move.use(Moves.PROTECT);
    await game.move.forceEnemyMove(Moves.SPLASH);
    await game.move.forceEnemyMove(Moves.SURF);
    await game.phaseInterceptor.to("BerryPhase");

    expect(magikarp1.isFainted()).toBe(true);
    expect(magikarp2.getInverseHp()).toBe(0);
  });
});
