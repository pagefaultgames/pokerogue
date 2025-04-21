import { Stat } from "#enums/stat";
import { Abilities } from "#enums/abilities";
import { Moves } from "#enums/moves";
import { Species } from "#enums/species";
import GameManager from "#test/testUtils/gameManager";
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
      .moveset([Moves.MIST, Moves.SAFEGUARD, Moves.SPLASH])
      .ability(Abilities.BALL_FETCH)
      .battleStyle("single")
      .disableCrits()
      .enemySpecies(Species.SHUCKLE)
      .enemyAbility(Abilities.BALL_FETCH)
      .enemyMoveset([Moves.DEFOG, Moves.GROWL]);
  });

  it("should not allow Safeguard to be active", async () => {
    await game.classicMode.startBattle([Species.REGIELEKI]);

    const playerPokemon = game.scene.getPlayerField();
    const enemyPokemon = game.scene.getEnemyField();

    game.move.select(Moves.SAFEGUARD);
    await game.forceEnemyMove(Moves.DEFOG);
    await game.phaseInterceptor.to("BerryPhase");

    expect(playerPokemon[0].isSafeguarded(enemyPokemon[0])).toBe(false);

    expect(true).toBe(true);
  });

  it("should not allow Mist to be active", async () => {
    await game.classicMode.startBattle([Species.REGIELEKI]);

    const playerPokemon = game.scene.getPlayerField();

    game.move.select(Moves.MIST);
    await game.forceEnemyMove(Moves.DEFOG);

    await game.toNextTurn();

    game.move.select(Moves.SPLASH);
    await game.forceEnemyMove(Moves.GROWL);

    await game.phaseInterceptor.to("BerryPhase");

    expect(playerPokemon[0].getStatStage(Stat.ATK)).toBe(-1);

    expect(true).toBe(true);
  });
});
