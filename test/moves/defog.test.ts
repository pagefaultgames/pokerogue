import { AbilityId } from "#enums/ability-id";
import { MoveId } from "#enums/move-id";
import { SpeciesId } from "#enums/species-id";
import { Stat } from "#enums/stat";
import { GameManager } from "#test/test-utils/game-manager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";

describe("Moves - Defog", () => {
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
      .moveset([MoveId.MIST, MoveId.SAFEGUARD, MoveId.SPLASH])
      .ability(AbilityId.BALL_FETCH)
      .battleStyle("single")
      .criticalHits(false)
      .enemySpecies(SpeciesId.SHUCKLE)
      .enemyAbility(AbilityId.BALL_FETCH)
      .enemyMoveset([MoveId.DEFOG, MoveId.GROWL]);
  });

  it("should not allow Safeguard to be active", async () => {
    await game.classicMode.startBattle([SpeciesId.REGIELEKI]);

    const playerPokemon = game.scene.getPlayerField();
    const enemyPokemon = game.scene.getEnemyField();

    game.move.select(MoveId.SAFEGUARD);
    await game.move.selectEnemyMove(MoveId.DEFOG);
    await game.phaseInterceptor.to("BerryPhase");

    expect(playerPokemon[0].isSafeguarded(enemyPokemon[0])).toBe(false);

    expect(true).toBe(true);
  });

  it("should not allow Mist to be active", async () => {
    await game.classicMode.startBattle([SpeciesId.REGIELEKI]);

    const playerPokemon = game.scene.getPlayerField();

    game.move.select(MoveId.MIST);
    await game.move.selectEnemyMove(MoveId.DEFOG);

    await game.toNextTurn();

    game.move.select(MoveId.SPLASH);
    await game.move.selectEnemyMove(MoveId.GROWL);

    await game.phaseInterceptor.to("BerryPhase");

    expect(playerPokemon[0].getStatStage(Stat.ATK)).toBe(-1);

    expect(true).toBe(true);
  });
});
