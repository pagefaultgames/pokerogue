import { Stat } from "#app/enums/stat";
import { Abilities } from "#enums/abilities";
import { Moves } from "#enums/moves";
import { Species } from "#enums/species";
import GameManager from "#test/testUtils/gameManager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";

describe("Abilities - Wandering Spirit", () => {
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
      .moveset([Moves.SPLASH])
      .ability(Abilities.WANDERING_SPIRIT)
      .battleStyle("single")
      .disableCrits()
      .enemySpecies(Species.MAGIKARP)
      .enemyAbility(Abilities.BALL_FETCH)
      .enemyMoveset(Moves.TACKLE);
  });

  it("should exchange abilities when hit with a contact move", async () => {
    await game.classicMode.startBattle([Species.FEEBAS]);

    game.move.select(Moves.SPLASH);
    await game.phaseInterceptor.to("BerryPhase");

    expect(game.scene.getPlayerPokemon()?.getAbility().id).toBe(Abilities.BALL_FETCH);
    expect(game.scene.getEnemyPokemon()?.getAbility().id).toBe(Abilities.WANDERING_SPIRIT);
  });

  it("should not exchange abilities when hit with a non-contact move", async () => {
    game.override.enemyMoveset(Moves.EARTHQUAKE);
    await game.classicMode.startBattle([Species.FEEBAS]);

    game.move.select(Moves.SPLASH);
    await game.phaseInterceptor.to("BerryPhase");

    expect(game.scene.getPlayerPokemon()?.getAbility().id).toBe(Abilities.WANDERING_SPIRIT);
    expect(game.scene.getEnemyPokemon()?.getAbility().id).toBe(Abilities.BALL_FETCH);
  });

  it("should activate post-summon abilities", async () => {
    game.override.enemyAbility(Abilities.INTIMIDATE);
    await game.classicMode.startBattle([Species.FEEBAS]);

    game.move.select(Moves.SPLASH);
    await game.phaseInterceptor.to("BerryPhase");

    expect(game.scene.getEnemyPokemon()?.getStatStage(Stat.ATK)).toBe(-1);
  });
});
