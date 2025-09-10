import { allAbilities } from "#data/data-lists";
import { AbilityId } from "#enums/ability-id";
import { MoveId } from "#enums/move-id";
import { SpeciesId } from "#enums/species-id";
import { Stat } from "#enums/stat";
import { GameManager } from "#test/test-utils/game-manager";
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
      .moveset([MoveId.SPLASH])
      .ability(AbilityId.BALL_FETCH)
      .battleStyle("single")
      .criticalHits(false)
      .enemySpecies(SpeciesId.MAGIKARP)
      .enemyAbility(AbilityId.BALL_FETCH)
      .enemyMoveset(MoveId.SPLASH);
  });

  it("should activate post-summon abilities", async () => {
    await game.classicMode.startBattle([SpeciesId.FEEBAS]);

    game.move.select(MoveId.SPLASH);
    game.field.getPlayerPokemon().setTempAbility(allAbilities[AbilityId.INTIMIDATE]);
    await game.phaseInterceptor.to("BerryPhase");

    expect(game.field.getEnemyPokemon().getStatStage(Stat.ATK)).toBe(-1);
  });

  it("should remove primal weather when the setter's ability is removed", async () => {
    game.override.ability(AbilityId.DESOLATE_LAND);
    await game.classicMode.startBattle([SpeciesId.FEEBAS]);

    game.move.select(MoveId.SPLASH);
    game.field.getPlayerPokemon().setTempAbility(allAbilities[AbilityId.BALL_FETCH]);
    await game.phaseInterceptor.to("BerryPhase");

    expect(game.scene.arena.weather?.weatherType).toBeUndefined();
  });

  it("should not activate passive abilities", async () => {
    game.override.passiveAbility(AbilityId.INTREPID_SWORD);
    await game.classicMode.startBattle([SpeciesId.FEEBAS]);

    game.move.select(MoveId.SPLASH);
    game.field.getPlayerPokemon().setTempAbility(allAbilities[AbilityId.BALL_FETCH]);
    await game.phaseInterceptor.to("BerryPhase");

    expect(game.field.getPlayerPokemon().getStatStage(Stat.ATK)).toBe(1); // would be 2 if passive activated again
  });

  // Pickup and Honey Gather are special cases as they're the only abilities to be Unsuppressable but not Unswappable
  it("should be able to swap pickup", async () => {
    game.override.ability(AbilityId.PICKUP).enemyAbility(AbilityId.INTIMIDATE).moveset(MoveId.ROLE_PLAY);
    await game.classicMode.startBattle([SpeciesId.FEEBAS]);

    game.move.select(MoveId.ROLE_PLAY);
    await game.phaseInterceptor.to("BerryPhase");

    expect(game.field.getEnemyPokemon().getStatStage(Stat.ATK)).toBe(-1);
  });
});
