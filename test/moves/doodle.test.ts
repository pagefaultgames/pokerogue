import { AbilityId } from "#enums/ability-id";
import { BattlerIndex } from "#enums/battler-index";
import { MoveId } from "#enums/move-id";
import { SpeciesId } from "#enums/species-id";
import { Stat } from "#enums/stat";
import { GameManager } from "#test/test-utils/game-manager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";

describe("Moves - Doodle", () => {
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
      .moveset([MoveId.SPLASH, MoveId.DOODLE])
      .ability(AbilityId.ADAPTABILITY)
      .battleStyle("single")
      .criticalHits(false)
      .enemySpecies(SpeciesId.MAGIKARP)
      .enemyAbility(AbilityId.BALL_FETCH)
      .enemyMoveset(MoveId.SPLASH);
  });

  it("should copy the opponent's ability in singles", async () => {
    await game.classicMode.startBattle([SpeciesId.FEEBAS]);

    game.move.select(MoveId.DOODLE);
    await game.phaseInterceptor.to("BerryPhase");

    expect(game.field.getPlayerPokemon().getAbility().id).toBe(AbilityId.BALL_FETCH);
  });

  it("should copy the opponent's ability to itself and its ally in doubles", async () => {
    game.override.battleStyle("double");
    await game.classicMode.startBattle([SpeciesId.FEEBAS, SpeciesId.MAGIKARP]);

    game.move.select(MoveId.DOODLE, 0, BattlerIndex.ENEMY);
    game.move.select(MoveId.SPLASH, 1);
    await game.phaseInterceptor.to("BerryPhase");

    expect(game.scene.getPlayerField()[0].getAbility().id).toBe(AbilityId.BALL_FETCH);
    expect(game.scene.getPlayerField()[1].getAbility().id).toBe(AbilityId.BALL_FETCH);
  });

  it("should activate post-summon abilities", async () => {
    game.override.battleStyle("double").enemyAbility(AbilityId.INTIMIDATE);

    await game.classicMode.startBattle([SpeciesId.FEEBAS, SpeciesId.MAGIKARP]);

    game.move.select(MoveId.DOODLE, 0, BattlerIndex.ENEMY);
    game.move.select(MoveId.SPLASH, 1);
    await game.phaseInterceptor.to("BerryPhase");

    // Enemies should have been intimidated twice
    expect(game.field.getEnemyPokemon().getStatStage(Stat.ATK)).toBe(-2);
  });
});
