import { BattlerTagType } from "#app/enums/battler-tag-type";
import { BattlerIndex } from "#app/battle";
import { Abilities } from "#enums/abilities";
import { Moves } from "#enums/moves";
import { Species } from "#enums/species";
import GameManager from "#test/utils/gameManager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";

describe("Moves - Encore", () => {
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
      .battleType("single")
      .disableCrits()
      .enemySpecies(Species.MAGIKARP)
      .enemyAbility(Abilities.BALL_FETCH)
      .enemyMoveset(Moves.SPLASH);
  });

  it("Pokemon under both Encore and Torment should alternate between Struggle and restricted move", async () => {
    const turnOrder = [ BattlerIndex.ENEMY, BattlerIndex.PLAYER ];
    game.override.moveset([ Moves.ENCORE, Moves.TORMENT, Moves.SPLASH ]);
    await game.classicMode.startBattle([ Species.FEEBAS ]);

    const enemyPokemon = game.scene.getEnemyPokemon();
    game.move.select(Moves.ENCORE);
    await game.setTurnOrder(turnOrder);
    await game.phaseInterceptor.to("BerryPhase");
    expect(enemyPokemon?.getTag(BattlerTagType.ENCORE)).toBeDefined();

    await game.toNextTurn();
    game.move.select(Moves.TORMENT);
    await game.setTurnOrder(turnOrder);
    await game.phaseInterceptor.to("BerryPhase");
    expect(enemyPokemon?.getTag(BattlerTagType.TORMENT)).toBeDefined();

    await game.toNextTurn();
    game.move.select(Moves.SPLASH);
    await game.setTurnOrder(turnOrder);
    await game.phaseInterceptor.to("BerryPhase");
    const lastMove = enemyPokemon?.getLastXMoves()[0];
    expect(lastMove?.move).toBe(Moves.STRUGGLE);
  });
});
