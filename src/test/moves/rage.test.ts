import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";
import GameManager from "#test/utils/gameManager";
import { Species } from "#enums/species";
import { Abilities } from "#enums/abilities";
import { Moves } from "#enums/moves";
import {BattleStat} from "#app/data/battle-stat";

const TIMEOUT = 20 * 1000;

describe("Moves - Rage", () => {
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
      .battleType("single")
      .ability(Abilities.UNNERVE)
      .moveset([Moves.RAGE,Moves.SPLASH,Moves.SPORE])
      .enemyAbility(Abilities.INSOMNIA)
      .startingLevel(100)
      .enemyLevel(100);
  });

  it(
    "should raise attack if hit after use",
    async () => {
      game.override
        .enemySpecies(Species.SHUCKLE)
        .enemyMoveset([Moves.TACKLE,Moves.TACKLE,Moves.TACKLE,Moves.TACKLE]);
      await game.startBattle([Species.NINJASK]);

      const leadPokemon = game.scene.getPlayerPokemon()!;

      // Ninjask uses rage, then gets hit, gets atk boost
      game.doAttack(0);
      await game.toNextTurn();
      expect(leadPokemon.summonData.battleStats[BattleStat.ATK]).toBe(1);

    }, TIMEOUT
  );

  it(
    "should raise ATK if hit before using non-rage option",
    async () => {
      game.override
        .enemySpecies(Species.NINJASK)
        .enemyMoveset([Moves.TACKLE, Moves.TACKLE, Moves.TACKLE, Moves.TACKLE]);
      await game.startBattle([Species.SHUCKLE]);

      const leadPokemon = game.scene.getPlayerPokemon()!;

      // Ninjask moves first, THEN shuckle uses rage, no ATK boost
      game.doAttack(0);
      await game.toNextTurn();
      expect(leadPokemon.summonData.battleStats[BattleStat.ATK]).toBe(0);

      // Shuckle Raged last turn, so when Ninjask hits it, ATK boost despite not using rage this turn
      game.doAttack(1);
      await game.toNextTurn();
      expect(leadPokemon.summonData.battleStats[BattleStat.ATK]).toBe(1);
    }, TIMEOUT
  );

  it(
    "should not raise ATK if hit by status move",
    async () => {
      game.override
        .enemySpecies(Species.NINJASK)
        .enemyMoveset([Moves.RAGE, Moves.RAGE, Moves.RAGE, Moves.RAGE]);
      await game.startBattle([Species.NINJASK]);

      const leadPokemon = game.scene.getPlayerPokemon()!;

      // Ninjask Rages, then slept. No boost.
      game.doAttack(2);
      await game.toNextTurn();
      expect(leadPokemon.summonData.battleStats[BattleStat.ATK]).toBe(0);
    }, TIMEOUT
  );

  it(
    "should not raise ATK if rage has no effect",
    async () => {
      game.override
        .enemySpecies(Species.GASTLY)
        .enemyMoveset([Moves.TACKLE, Moves.TACKLE, Moves.TACKLE, Moves.TACKLE])
        .moveset([Moves.RAGE]);
      await game.startBattle([Species.NINJASK]);

      const leadPokemon = game.scene.getPlayerPokemon()!;

      // Ninjask uses rage, but it has no effect, no ATK boost
      game.doAttack(0);
      await game.toNextTurn();
      expect(leadPokemon.summonData.battleStats[BattleStat.ATK]).toBe(0);
    }, TIMEOUT
  );
});
