import { AbilityId } from "#enums/ability-id";
import { MoveId } from "#enums/move-id";
import { SpeciesId } from "#enums/species-id";
import { Stat } from "#enums/stat";
import { GameManager } from "#test/test-utils/game-manager";
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
      .moveset([MoveId.MIST, MoveId.SPLASH])
      .ability(AbilityId.BALL_FETCH)
      .battleStyle("double")
      .criticalHits(false)
      .enemySpecies(SpeciesId.SNORLAX)
      .enemyAbility(AbilityId.BALL_FETCH)
      .enemyMoveset(MoveId.GROWL);
  });

  it("should prevent the user's side from having stats lowered", async () => {
    await game.classicMode.startBattle([SpeciesId.MAGIKARP, SpeciesId.FEEBAS]);

    const playerPokemon = game.scene.getPlayerField();

    game.move.select(MoveId.MIST, 0);
    game.move.select(MoveId.SPLASH, 1);

    await game.phaseInterceptor.to("BerryPhase");

    playerPokemon.forEach(p => expect(p.getStatStage(Stat.ATK)).toBe(0));
  });

  it.todo("should be ignored by opponents with Infiltrator");
});
