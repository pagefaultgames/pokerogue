import { AbilityId } from "#enums/ability-id";
import { MoveId } from "#enums/move-id";
import { SpeciesId } from "#enums/species-id";
import { Stat } from "#enums/stat";
import { GameManager } from "#test/test-utils/game-manager";
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
      .moveset([MoveId.SPLASH])
      .ability(AbilityId.WANDERING_SPIRIT)
      .battleStyle("single")
      .criticalHits(false)
      .enemySpecies(SpeciesId.MAGIKARP)
      .enemyAbility(AbilityId.BALL_FETCH)
      .enemyMoveset(MoveId.TACKLE);
  });

  it("should exchange abilities when hit with a contact move", async () => {
    await game.classicMode.startBattle([SpeciesId.FEEBAS]);

    game.move.select(MoveId.SPLASH);
    await game.phaseInterceptor.to("BerryPhase");

    expect(game.field.getPlayerPokemon().getAbility().id).toBe(AbilityId.BALL_FETCH);
    expect(game.field.getEnemyPokemon().getAbility().id).toBe(AbilityId.WANDERING_SPIRIT);
  });

  it("should not exchange abilities when hit with a non-contact move", async () => {
    game.override.enemyMoveset(MoveId.EARTHQUAKE);
    await game.classicMode.startBattle([SpeciesId.FEEBAS]);

    game.move.select(MoveId.SPLASH);
    await game.phaseInterceptor.to("BerryPhase");

    expect(game.field.getPlayerPokemon().getAbility().id).toBe(AbilityId.WANDERING_SPIRIT);
    expect(game.field.getEnemyPokemon().getAbility().id).toBe(AbilityId.BALL_FETCH);
  });

  it("should activate post-summon abilities", async () => {
    game.override.enemyAbility(AbilityId.INTIMIDATE);
    await game.classicMode.startBattle([SpeciesId.FEEBAS]);

    game.move.select(MoveId.SPLASH);
    await game.phaseInterceptor.to("BerryPhase");

    expect(game.field.getEnemyPokemon().getStatStage(Stat.ATK)).toBe(-1);
  });
});
