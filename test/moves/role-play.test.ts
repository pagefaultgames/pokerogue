import { AbilityId } from "#enums/ability-id";
import { MoveId } from "#enums/move-id";
import { SpeciesId } from "#enums/species-id";
import { Stat } from "#enums/stat";
import { GameManager } from "#test/test-utils/game-manager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";

describe("Moves - Role Play", () => {
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
      .moveset([MoveId.SPLASH, MoveId.ROLE_PLAY])
      .ability(AbilityId.ADAPTABILITY)
      .battleStyle("single")
      .criticalHits(false)
      .enemySpecies(SpeciesId.MAGIKARP)
      .enemyAbility(AbilityId.BALL_FETCH)
      .enemyMoveset(MoveId.SPLASH);
  });

  it("should set the user's ability to the target's ability", async () => {
    await game.classicMode.startBattle([SpeciesId.FEEBAS]);

    game.move.select(MoveId.ROLE_PLAY);
    await game.phaseInterceptor.to("BerryPhase");

    expect(game.field.getPlayerPokemon().getAbility().id).toBe(AbilityId.BALL_FETCH);
  });

  it("should activate post-summon abilities", async () => {
    game.override.enemyAbility(AbilityId.INTIMIDATE);
    await game.classicMode.startBattle([SpeciesId.FEEBAS]);

    game.move.select(MoveId.ROLE_PLAY);
    await game.phaseInterceptor.to("BerryPhase");

    expect(game.field.getEnemyPokemon().getStatStage(Stat.ATK)).toBe(-1);
  });
});
