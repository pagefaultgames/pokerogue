import { Abilities } from "#enums/abilities";
import { Moves } from "#enums/moves";
import { Species } from "#enums/species";
import { Type } from "#app/data/type";
import GameManager from "#test/utils/gameManager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";

describe("Moves - Reflect Type", () => {
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
      .enemyAbility(Abilities.BALL_FETCH);
  });

  it("will make the user Normal/Grass if targetting a typeless Pokemon affected by Forest's Curse", async () => {
    game.override
      .moveset([ Moves.FORESTS_CURSE, Moves.REFLECT_TYPE ])
      .startingLevel(60)
      .enemySpecies(Species.CHARMANDER)
      .enemyMoveset([ Moves.BURN_UP, Moves.SPLASH ]);
    await game.classicMode.startBattle([ Species.FEEBAS ]);

    const playerPokemon = game.scene.getPlayerPokemon();
    const enemyPokemon = game.scene.getEnemyPokemon();

    game.move.select(Moves.SPLASH);
    await game.forceEnemyMove(Moves.BURN_UP);
    await game.toNextTurn();

    game.move.select(Moves.FORESTS_CURSE);
    await game.forceEnemyMove(Moves.SPLASH);
    await game.toNextTurn();
    expect(enemyPokemon?.getTypes().includes(Type.UNKNOWN)).toBe(true);
    expect(enemyPokemon?.getTypes().includes(Type.GRASS)).toBe(true);

    game.move.select(Moves.REFLECT_TYPE);
    await game.forceEnemyMove(Moves.SPLASH);
    await game.phaseInterceptor.to("TurnEndPhase");
    expect(playerPokemon?.getTypes()[0]).toBe(Type.NORMAL);
    expect(playerPokemon?.getTypes().includes(Type.GRASS)).toBe(true);
  });
});
