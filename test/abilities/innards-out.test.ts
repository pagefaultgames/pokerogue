import { AbilityId } from "#enums/ability-id";
import { MoveId } from "#enums/move-id";
import { SpeciesId } from "#enums/species-id";
import { GameManager } from "#test/test-utils/game-manager";
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
      .ability(AbilityId.BALL_FETCH)
      .battleStyle("single")
      .criticalHits(false)
      .enemySpecies(SpeciesId.MAGIKARP)
      .enemyAbility(AbilityId.INNARDS_OUT)
      .enemyMoveset(MoveId.SPLASH)
      .startingLevel(100);
  });

  it("should damage opppnents that faint the ability holder for equal damage", async () => {
    await game.classicMode.startBattle([SpeciesId.FEEBAS]);

    const magikarp = game.field.getEnemyPokemon();
    magikarp.hp = 20;
    game.move.use(MoveId.X_SCISSOR);
    await game.toEndOfTurn();

    expect(magikarp.isFainted()).toBe(true);
    const feebas = game.field.getPlayerPokemon();
    expect(feebas.getInverseHp()).toBe(20);
  });

  it("should not damage an ally in Double Battles", async () => {
    game.override.battleStyle("double");
    await game.classicMode.startBattle([SpeciesId.FEEBAS]);

    const [magikarp1, magikarp2] = game.scene.getEnemyField();
    magikarp1.hp = 1;

    game.move.use(MoveId.PROTECT);
    await game.move.forceEnemyMove(MoveId.SPLASH);
    await game.move.forceEnemyMove(MoveId.SURF);
    await game.toEndOfTurn();

    expect(magikarp1.isFainted()).toBe(true);
    expect(magikarp2.getInverseHp()).toBe(0);
  });
});
