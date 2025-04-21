import { allAbilities } from "#app/data/data-lists";
import { Stat } from "#app/enums/stat";
import { Abilities } from "#enums/abilities";
import { Moves } from "#enums/moves";
import { Species } from "#enums/species";
import GameManager from "#test/testUtils/gameManager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";

describe("Test Ability Swapping", () => {
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
      .ability(Abilities.BALL_FETCH)
      .battleStyle("single")
      .disableCrits()
      .enemySpecies(Species.MAGIKARP)
      .enemyAbility(Abilities.BALL_FETCH)
      .enemyMoveset(Moves.SPLASH);
  });

  it("should activate post-summon abilities", async () => {
    await game.classicMode.startBattle([Species.FEEBAS]);

    game.move.select(Moves.SPLASH);
    game.scene.getPlayerPokemon()?.setTempAbility(allAbilities[Abilities.INTIMIDATE]);
    await game.phaseInterceptor.to("BerryPhase");

    expect(game.scene.getEnemyPokemon()?.getStatStage(Stat.ATK)).toBe(-1);
  });

  it("should remove primal weather when the setter's ability is removed", async () => {
    game.override.ability(Abilities.DESOLATE_LAND);
    await game.classicMode.startBattle([Species.FEEBAS]);

    game.move.select(Moves.SPLASH);
    game.scene.getPlayerPokemon()?.setTempAbility(allAbilities[Abilities.BALL_FETCH]);
    await game.phaseInterceptor.to("BerryPhase");

    expect(game.scene.arena.weather?.weatherType).toBeUndefined();
  });

  it("should not activate passive abilities", async () => {
    game.override.passiveAbility(Abilities.INTREPID_SWORD);
    await game.classicMode.startBattle([Species.FEEBAS]);

    game.move.select(Moves.SPLASH);
    game.scene.getPlayerPokemon()?.setTempAbility(allAbilities[Abilities.BALL_FETCH]);
    await game.phaseInterceptor.to("BerryPhase");

    expect(game.scene.getPlayerPokemon()?.getStatStage(Stat.ATK)).toBe(1); // would be 2 if passive activated again
  });

  // Pickup and Honey Gather are special cases as they're the only abilities to be Unsuppressable but not Unswappable
  it("should be able to swap pickup", async () => {
    game.override.ability(Abilities.PICKUP).enemyAbility(Abilities.INTIMIDATE).moveset(Moves.ROLE_PLAY);
    await game.classicMode.startBattle([Species.FEEBAS]);

    game.move.select(Moves.ROLE_PLAY);
    await game.phaseInterceptor.to("BerryPhase");

    expect(game.scene.getEnemyPokemon()?.getStatStage(Stat.ATK)).toBe(-1);
  });
});
