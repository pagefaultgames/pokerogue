import { Stat } from "#enums/stat";
import { Abilities } from "#enums/abilities";
import { Moves } from "#enums/moves";
import { Species } from "#enums/species";
import GameManager from "#test/utils/gameManager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";

describe("Moves - Mist", () => {
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
      .moveset([ Moves.MIST, Moves.SPLASH ])
      .ability(Abilities.BALL_FETCH)
      .battleType("double")
      .disableCrits()
      .enemySpecies(Species.SNORLAX)
      .enemyAbility(Abilities.BALL_FETCH)
      .enemyMoveset(Moves.GROWL);
  });

  it("should prevent the user's side from having stats lowered", async () => {
    await game.classicMode.startBattle([ Species.MAGIKARP, Species.FEEBAS ]);

    const playerPokemon = game.scene.getPlayerField();

    game.move.select(Moves.MIST, 0);
    game.move.select(Moves.SPLASH, 1);

    await game.phaseInterceptor.to("BerryPhase");

    playerPokemon.forEach(p => expect(p.getStatStage(Stat.ATK)).toBe(0));
  });

  it.todo("should be ignored by opponents with Infiltrator");
});
