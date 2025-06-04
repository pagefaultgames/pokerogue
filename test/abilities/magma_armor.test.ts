import { AbilityId } from "#enums/abilities";
import { Moves } from "#enums/moves";
import { Species } from "#enums/species";
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
      .moveset([Moves.SPLASH])
      .ability(AbilityId.BALL_FETCH)
      .battleStyle("single")
      .disableCrits()
      .enemySpecies(Species.MAGIKARP)
      .enemyAbility(AbilityId.BALL_FETCH)
      .enemyMoveset(Moves.SPLASH);
  });

  it("should remove freeze when gained", async () => {
    game.override
      .ability(AbilityId.MAGMA_ARMOR)
      .enemyAbility(AbilityId.BALL_FETCH)
      .moveset(Moves.SKILL_SWAP)
      .enemyMoveset(Moves.SPLASH);
    await game.classicMode.startBattle([Species.FEEBAS]);
    const enemy = game.scene.getEnemyPokemon();
    enemy?.trySetStatus(StatusEffect.FREEZE);
    expect(enemy?.status?.effect).toBe(StatusEffect.FREEZE);

    game.move.select(Moves.SKILL_SWAP);
    await game.phaseInterceptor.to("BerryPhase");

    expect(enemy?.status).toBeNull();
  });
});
