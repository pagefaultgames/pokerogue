import { AbilityId } from "#enums/ability-id";
import { MoveId } from "#enums/move-id";
import { SpeciesId } from "#enums/species-id";
import { StatusEffect } from "#enums/status-effect";
import GameManager from "#test/testUtils/gameManager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";

describe("Abilities - Magma Armor", () => {
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
      .disableCrits()
      .enemySpecies(SpeciesId.MAGIKARP)
      .enemyAbility(AbilityId.BALL_FETCH)
      .enemyMoveset(MoveId.SPLASH);
  });

  it("should remove freeze when gained", async () => {
    game.override
      .ability(AbilityId.MAGMA_ARMOR)
      .enemyAbility(AbilityId.BALL_FETCH)
      .moveset(MoveId.SKILL_SWAP)
      .enemyMoveset(MoveId.SPLASH);
    await game.classicMode.startBattle([SpeciesId.FEEBAS]);
    const enemy = game.scene.getEnemyPokemon();
    enemy?.trySetStatus(StatusEffect.FREEZE);
    expect(enemy?.status?.effect).toBe(StatusEffect.FREEZE);

    game.move.select(MoveId.SKILL_SWAP);
    await game.phaseInterceptor.to("BerryPhase");

    expect(enemy?.status).toBeNull();
  });
});
