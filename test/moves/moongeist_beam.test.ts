import { allMoves, RandomMoveAttr } from "#app/data/moves/move";
import { Abilities } from "#enums/abilities";
import { Moves } from "#enums/moves";
import { Species } from "#enums/species";
import GameManager from "#test/testUtils/gameManager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

describe("Moves - Moongeist Beam", () => {
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
      .moveset([Moves.MOONGEIST_BEAM, Moves.METRONOME])
      .ability(Abilities.BALL_FETCH)
      .startingLevel(200)
      .battleStyle("single")
      .disableCrits()
      .enemySpecies(Species.MAGIKARP)
      .enemyAbility(Abilities.STURDY)
      .enemyMoveset(Moves.SPLASH);
  });

  // Also covers Photon Geyser and Sunsteel Strike
  it("should ignore enemy abilities", async () => {
    await game.classicMode.startBattle([Species.MILOTIC]);

    const enemy = game.scene.getEnemyPokemon()!;

    game.move.select(Moves.MOONGEIST_BEAM);
    await game.phaseInterceptor.to("BerryPhase");

    expect(enemy.isFainted()).toBe(true);
  });

  // Also covers Photon Geyser and Sunsteel Strike
  it("should not ignore enemy abilities when called by another move, such as metronome", async () => {
    await game.classicMode.startBattle([Species.MILOTIC]);
    vi.spyOn(allMoves[Moves.METRONOME].getAttrs(RandomMoveAttr)[0], "getMoveOverride").mockReturnValue(
      Moves.MOONGEIST_BEAM,
    );

    game.move.select(Moves.METRONOME);
    await game.phaseInterceptor.to("BerryPhase");

    expect(game.scene.getEnemyPokemon()!.isFainted()).toBe(false);
    expect(game.scene.getPlayerPokemon()!.getLastXMoves()[0].move).toBe(Moves.MOONGEIST_BEAM);
  });
});
