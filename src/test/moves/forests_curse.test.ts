import { Abilities } from "#enums/abilities";
import { Moves } from "#enums/moves";
import { Species } from "#enums/species";
import { Type } from "#enums/type";
import GameManager from "#test/utils/gameManager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";

describe("Moves - Forest's Curse", () => {
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
      .moveset([ Moves.FORESTS_CURSE, Moves.TRICK_OR_TREAT ])
      .ability(Abilities.BALL_FETCH)
      .battleType("single")
      .disableCrits()
      .enemySpecies(Species.MAGIKARP)
      .enemyAbility(Abilities.BALL_FETCH)
      .enemyMoveset(Moves.SPLASH);
  });

  it("will replace the added type from Trick Or Treat", async () => {
    await game.classicMode.startBattle([ Species.FEEBAS ]);

    const enemyPokemon = game.scene.getEnemyPokemon();
    game.move.select(Moves.TRICK_OR_TREAT);
    await game.phaseInterceptor.to("TurnEndPhase");
    expect(enemyPokemon!.summonData.addedType).toBe(Type.GHOST);

    game.move.select(Moves.FORESTS_CURSE);
    await game.phaseInterceptor.to("TurnEndPhase");
    expect(enemyPokemon?.summonData.addedType).toBe(Type.GRASS);
  });
});
