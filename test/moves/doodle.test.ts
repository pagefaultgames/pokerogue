import { BattlerIndex } from "#app/battle";
import { Stat } from "#app/enums/stat";
import { Abilities } from "#enums/abilities";
import { Moves } from "#enums/moves";
import { Species } from "#enums/species";
import GameManager from "#test/testUtils/gameManager";
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
      .moveset([Moves.SPLASH, Moves.DOODLE])
      .ability(Abilities.ADAPTABILITY)
      .battleStyle("single")
      .disableCrits()
      .enemySpecies(Species.MAGIKARP)
      .enemyAbility(Abilities.BALL_FETCH)
      .enemyMoveset(Moves.SPLASH);
  });

  it("should copy the opponent's ability in singles", async () => {
    await game.classicMode.startBattle([Species.FEEBAS]);

    game.move.select(Moves.DOODLE);
    await game.phaseInterceptor.to("BerryPhase");

    expect(game.scene.getPlayerPokemon()?.getAbility().id).toBe(Abilities.BALL_FETCH);
  });

  it("should copy the opponent's ability to itself and its ally in doubles", async () => {
    game.override.battleStyle("double");
    await game.classicMode.startBattle([Species.FEEBAS, Species.MAGIKARP]);

    game.move.select(Moves.DOODLE, 0, BattlerIndex.ENEMY);
    game.move.select(Moves.SPLASH, 1);
    await game.phaseInterceptor.to("BerryPhase");

    expect(game.scene.getPlayerField()[0].getAbility().id).toBe(Abilities.BALL_FETCH);
    expect(game.scene.getPlayerField()[1].getAbility().id).toBe(Abilities.BALL_FETCH);
  });

  it("should activate post-summon abilities", async () => {
    game.override.battleStyle("double").enemyAbility(Abilities.INTIMIDATE);

    await game.classicMode.startBattle([Species.FEEBAS, Species.MAGIKARP]);

    game.move.select(Moves.DOODLE, 0, BattlerIndex.ENEMY);
    game.move.select(Moves.SPLASH, 1);
    await game.phaseInterceptor.to("BerryPhase");

    // Enemies should have been intimidated twice
    expect(game.scene.getEnemyPokemon()?.getStatStage(Stat.ATK)).toBe(-2);
  });
});
