import { Stat } from "#app/enums/stat";
import { AbilityId } from "#enums/ability-id";
import { MoveId } from "#enums/move-id";
import { SpeciesId } from "#enums/species-id";
import GameManager from "#test/testUtils/gameManager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";

describe("Moves - Skill Swap", () => {
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
      .moveset([MoveId.SPLASH, MoveId.SKILL_SWAP])
      .ability(AbilityId.BALL_FETCH)
      .battleStyle("single")
      .criticalHits(false)
      .enemySpecies(SpeciesId.MAGIKARP)
      .enemyAbility(AbilityId.BALL_FETCH)
      .enemyMoveset(MoveId.SPLASH);
  });

  it("should swap the two abilities", async () => {
    game.override.ability(AbilityId.ADAPTABILITY);
    await game.classicMode.startBattle([SpeciesId.FEEBAS]);

    game.move.select(MoveId.SKILL_SWAP);
    await game.phaseInterceptor.to("BerryPhase");

    expect(game.scene.getPlayerPokemon()?.getAbility().id).toBe(AbilityId.BALL_FETCH);
    expect(game.scene.getEnemyPokemon()?.getAbility().id).toBe(AbilityId.ADAPTABILITY);
  });

  it("should activate post-summon abilities", async () => {
    game.override.ability(AbilityId.INTIMIDATE);
    await game.classicMode.startBattle([SpeciesId.FEEBAS]);

    game.move.select(MoveId.SKILL_SWAP);
    await game.phaseInterceptor.to("BerryPhase");

    // player atk should be -1 after opponent gains intimidate and it activates
    expect(game.scene.getPlayerPokemon()?.getStatStage(Stat.ATK)).toBe(-1);
  });
});
