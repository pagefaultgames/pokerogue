import { BattlerIndex } from "#enums/battler-index";
import { AbilityId } from "#enums/ability-id";
import { MoveId } from "#enums/move-id";
import { SpeciesId } from "#enums/species-id";
import GameManager from "#test/testUtils/gameManager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";

describe("Moves - Pollen Puff", () => {
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
      .moveset([MoveId.POLLEN_PUFF])
      .ability(AbilityId.BALL_FETCH)
      .battleStyle("single")
      .criticalHits(false)
      .enemySpecies(SpeciesId.MAGIKARP)
      .enemyAbility(AbilityId.BALL_FETCH)
      .enemyMoveset(MoveId.SPLASH);
  });

  it("should not heal more than once when the user has a source of multi-hit", async () => {
    game.override.battleStyle("double").moveset([MoveId.POLLEN_PUFF, MoveId.ENDURE]).ability(AbilityId.PARENTAL_BOND);
    await game.classicMode.startBattle([SpeciesId.BULBASAUR, SpeciesId.OMANYTE]);

    const [_, rightPokemon] = game.scene.getPlayerField();

    rightPokemon.damageAndUpdate(rightPokemon.hp - 1);

    game.move.select(MoveId.POLLEN_PUFF, 0, BattlerIndex.PLAYER_2);
    game.move.select(MoveId.ENDURE, 1);

    await game.phaseInterceptor.to("BerryPhase");

    // Pollen Puff heals with a ratio of 0.5, as long as Pollen Puff triggers only once the pokemon will always be <= (0.5 * Max HP) + 1
    expect(rightPokemon.hp).toBeLessThanOrEqual(0.5 * rightPokemon.getMaxHp() + 1);
  });

  it("should damage an enemy multiple times when the user has a source of multi-hit", async () => {
    game.override.moveset([MoveId.POLLEN_PUFF]).ability(AbilityId.PARENTAL_BOND).enemyLevel(100);
    await game.classicMode.startBattle([SpeciesId.MAGIKARP]);

    const target = game.scene.getEnemyPokemon()!;

    game.move.select(MoveId.POLLEN_PUFF);

    await game.phaseInterceptor.to("BerryPhase");

    expect(target.battleData.hitCount).toBe(2);
  });
});
