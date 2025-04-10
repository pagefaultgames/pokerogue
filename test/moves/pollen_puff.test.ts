import { BattlerIndex } from "#app/battle";
import { Abilities } from "#enums/abilities";
import { Moves } from "#enums/moves";
import { Species } from "#enums/species";
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
      .moveset([Moves.POLLEN_PUFF])
      .ability(Abilities.BALL_FETCH)
      .battleStyle("single")
      .disableCrits()
      .enemySpecies(Species.MAGIKARP)
      .enemyAbility(Abilities.BALL_FETCH)
      .enemyMoveset(Moves.SPLASH);
  });

  it("should not heal more than once when the user has a source of multi-hit", async () => {
    game.override.battleStyle("double").moveset([Moves.POLLEN_PUFF, Moves.ENDURE]).ability(Abilities.PARENTAL_BOND);
    await game.classicMode.startBattle([Species.BULBASAUR, Species.OMANYTE]);

    const [_, rightPokemon] = game.scene.getPlayerField();

    rightPokemon.damageAndUpdate(rightPokemon.hp - 1);

    game.move.select(Moves.POLLEN_PUFF, 0, BattlerIndex.PLAYER_2);
    game.move.select(Moves.ENDURE, 1);

    await game.phaseInterceptor.to("BerryPhase");

    // Pollen Puff heals with a ratio of 0.5, as long as Pollen Puff triggers only once the pokemon will always be <= (0.5 * Max HP) + 1
    expect(rightPokemon.hp).toBeLessThanOrEqual(0.5 * rightPokemon.getMaxHp() + 1);
  });

  it("should damage an enemy multiple times when the user has a source of multi-hit", async () => {
    game.override.moveset([Moves.POLLEN_PUFF]).ability(Abilities.PARENTAL_BOND).enemyLevel(100);
    await game.classicMode.startBattle([Species.MAGIKARP]);

    const target = game.scene.getEnemyPokemon()!;

    game.move.select(Moves.POLLEN_PUFF);

    await game.phaseInterceptor.to("BerryPhase");

    expect(target.battleData.hitCount).toBe(2);
  });
});
