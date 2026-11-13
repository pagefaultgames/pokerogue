import { AbilityId } from "#enums/ability-id";
import { MoveId } from "#enums/move-id";
import { PokeballType } from "#enums/pokeball";
import { SpeciesId } from "#enums/species-id";
import { Stat } from "#enums/stat";
import { GameManager } from "#test/framework/game-manager";
import Phaser from "phaser";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";

describe("Capture Phase", () => {
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
      .enemyLevel(100)
      .startingModifier([{ name: "MASTER_BALL", count: 1 }]);
  });

  it("should not retain the captured Pokemon's temporary data if sent out immediately in a double battle", async () => {
    game.override.battleStyle("double");
    await game.classicMode.startBattle(SpeciesId.FEEBAS);

    const [karp1, karp2] = game.scene.getEnemyField();

    game.move.use(MoveId.SPLASH);
    await game.move.forceEnemyMove(MoveId.SWORDS_DANCE);
    await game.move.forceEnemyMove(MoveId.SPLASH);
    await game.killPokemon(karp2);
    await game.toNextTurn();

    expect(karp1).not.toHaveFainted();
    expect(karp2).toHaveFainted();
    expect(karp1).toHaveStatStage(Stat.ATK, 2);

    game.doThrowPokeball(PokeballType.MASTER_BALL);
    await game.toEndOfTurn();

    expect(game.field.getPlayerParty()).toHaveLength(2);

    await game.toNextWave();

    const karp = game.scene.getPlayerField()[1];
    expect(karp).toHaveStatStage(Stat.ATK, 0);
  });

  // TODO: Create a table-driven test using datapoints from Cave of Dragonflies:
  // https://www.dragonflycave.com/calculators/gen-vi-vii-catch-rate/
  // Note that PKR removes much of the `4096`-based rounding from the original formula,
  // so the results will likely vary by ~0.3% at most
  it.todo("should have proper odds");
});
