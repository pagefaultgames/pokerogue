import { allMoves } from "#app/data/data-lists";
import { AbilityId } from "#enums/ability-id";
import { MoveId } from "#enums/move-id";
import { SpeciesId } from "#enums/species-id";
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
      .moveset([MoveId.MOONGEIST_BEAM, MoveId.METRONOME])
      .ability(AbilityId.BALL_FETCH)
      .startingLevel(200)
      .battleStyle("single")
      .criticalHits(false)
      .enemySpecies(SpeciesId.MAGIKARP)
      .enemyAbility(AbilityId.STURDY)
      .enemyMoveset(MoveId.SPLASH);
  });

  // Also covers Photon Geyser and Sunsteel Strike
  it("should ignore enemy abilities", async () => {
    await game.classicMode.startBattle([SpeciesId.MILOTIC]);

    const enemy = game.scene.getEnemyPokemon()!;

    game.move.select(MoveId.MOONGEIST_BEAM);
    await game.phaseInterceptor.to("BerryPhase");

    expect(enemy.isFainted()).toBe(true);
  });

  // Also covers Photon Geyser and Sunsteel Strike
  it("should not ignore enemy abilities when called by another move, such as metronome", async () => {
    await game.classicMode.startBattle([SpeciesId.MILOTIC]);
    vi.spyOn(allMoves[MoveId.METRONOME].getAttrs("RandomMoveAttr")[0], "getMoveOverride").mockReturnValue(
      MoveId.MOONGEIST_BEAM,
    );

    game.move.select(MoveId.METRONOME);
    await game.phaseInterceptor.to("BerryPhase");

    expect(game.scene.getEnemyPokemon()!.isFainted()).toBe(false);
    expect(game.scene.getPlayerPokemon()!.getLastXMoves()[0].move).toBe(MoveId.MOONGEIST_BEAM);
  });
});
