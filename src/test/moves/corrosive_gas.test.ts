import { Moves } from "#enums/moves";
import { Species } from "#enums/species";
import GameManager from "#test/utils/gameManager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";

describe("Moves - Corrosive Gas", () => {
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
      .moveset([ Moves.SPLASH, Moves.CORROSIVE_GAS ])
      .battleType("double")
      .enemySpecies(Species.MAGIKARP)
      .enemyMoveset(Moves.SPLASH);
  });

  it("should remove enemy and player items", async () => {
    game.override
      .enemyHeldItems([
        { name: "SOUL_DEW", count: 1 },
        { name: "LUCKY_EGG", count: 1 },
        { name: "LEFTOVERS", count: 1 },
        { name: "GRIP_CLAW", count: 1 },
        { name: "MULTI_LENS", count: 1 },
      ])
      .startingHeldItems(
        [
          { name: "SOUL_DEW", count: 1 },
          { name: "LUCKY_EGG", count: 1 },
          { name: "LEFTOVERS", count: 1 },
          { name: "GRIP_CLAW", count: 1 },
          { name: "MULTI_LENS", count: 1 },
        ]
      );
    await game.classicMode.startBattle([ Species.STAKATAKA, Species.SALAZZLE ]);
    const playerPokemon = game.scene.getPlayerField()!;
    const enemyPokemon = game.scene.getEnemyField()!;

    const staka = playerPokemon[0];
    const salazzle = playerPokemon[1];
    const karp1 = enemyPokemon[0];
    const karp2 = enemyPokemon[1];

    const stakaHeldItemCt = staka.getHeldItems().length;
    const salazzleHeldItemCt = salazzle.getHeldItems().length;
    const magikarpItemCt1 = karp1.getHeldItems().length;
    const magikarpItemCt2 = karp2.getHeldItems().length;

    game.move.select(Moves.SPLASH);
    game.move.select(Moves.CORROSIVE_GAS);
    await game.phaseInterceptor.to("BerryPhase");

    expect(salazzle.getHeldItems().length).toEqual(salazzleHeldItemCt);
    expect(staka.getHeldItems().length).toBeLessThan(stakaHeldItemCt);
    expect(karp1.getHeldItems().length).toBeLessThan(magikarpItemCt1);
    expect(karp2.getHeldItems().length).toBeLessThan(magikarpItemCt2);
  });

  it("should not remove untransferrable items", async () => {
    game.override
      .enemyMoveset(Moves.CORROSIVE_GAS)
      .enemyHeldItems([
        { name: "BASE_STAT_BOOSTER", count: 1 },
        { name: "TEMP_STAT_STAGE_BOOSTER", count: 1 }
      ])
      .startingHeldItems(
        [
          { name: "FORM_CHANGE_ITEM", count: 1 },
          { name: "BASE_STAT_BOOSTER", count: 1 },
          { name: "TEMP_STAT_STAGE_BOOSTER", count: 1 }
        ]
      );
    await game.classicMode.startBattle([ Species.GIRATINA, Species.AGGRON ]);
    const playerPokemon = game.scene.getPlayerField()!;
    const enemyPokemon = game.scene.getEnemyField()!;

    const giratina = playerPokemon[0];
    const aggron = playerPokemon[1];
    const karp1 = enemyPokemon[0];
    const karp2 = enemyPokemon[1];

    const giratinaHeldItemCt = giratina.getHeldItems().length;
    const aggronHeldItemCt = aggron.getHeldItems().length;
    const magikarpItemCt1 = karp1.getHeldItems().length;
    const magikarpItemCt2 = karp2.getHeldItems().length;

    game.move.select(Moves.SPLASH);
    game.move.select(Moves.SPLASH);
    await game.phaseInterceptor.to("BerryPhase");

    expect(giratina.getHeldItems().length).toEqual(giratinaHeldItemCt);
    expect(aggron.getHeldItems().length).toEqual(aggronHeldItemCt);
    expect(karp1.getHeldItems().length).toEqual(magikarpItemCt1);
    expect(karp2.getHeldItems().length).toEqual(magikarpItemCt2);
  });

});
