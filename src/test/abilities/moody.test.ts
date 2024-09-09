import { BATTLE_STATS, EFFECTIVE_STATS } from "#enums/stat";
import { Abilities } from "#enums/abilities";
import { Moves } from "#enums/moves";
import { Species } from "#enums/species";
import GameManager from "#test/utils/gameManager";
import { SPLASH_ONLY } from "#test/utils/testUtils";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

describe("Abilities - Moody", () => {
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
      .enemySpecies(Species.RATTATA)
      .enemyAbility(Abilities.BALL_FETCH)
      .ability(Abilities.MOODY)
      .enemyMoveset(SPLASH_ONLY)
      .moveset(SPLASH_ONLY);
  });

  it("should increase one stat stage by 2 and decrease a different stat stage by 1",
    async () => {
      await game.classicMode.startBattle();

      const playerPokemon = game.scene.getPlayerPokemon()!;
      game.move.select(Moves.SPLASH);
      await game.toNextTurn();

      // Find the increased and decreased stats, make sure they are different.
      const changedStats = EFFECTIVE_STATS.filter(s => playerPokemon.getStatStage(s) === 2 || playerPokemon.getStatStage(s) === -1);

      expect(changedStats).toBeTruthy();
      expect(changedStats.length).toBe(2);
      expect(changedStats[0] !== changedStats[1]).toBeTruthy();
    });

  it("should only increase one stat stage by 2 if all stat stages are at -6",
    async () => {
      await game.classicMode.startBattle();

      const playerPokemon = game.scene.getPlayerPokemon()!;

      // Set all stat stages to -6
      vi.spyOn(playerPokemon.summonData, "statStages", "get").mockReturnValue(new Array(BATTLE_STATS.length).fill(-6));

      game.move.select(Moves.SPLASH);
      await game.toNextTurn();

      // Should increase one stat stage by 2 (from -6, meaning it will be -4)
      const increasedStat = EFFECTIVE_STATS.filter(s => playerPokemon.getStatStage(s) === -4);

      expect(increasedStat).toBeTruthy();
      expect(increasedStat.length).toBe(1);
    });

  it("should only decrease one stat stage by 1 stage if all stat stages are at 6",
    async () => {
      await game.classicMode.startBattle();

      const playerPokemon = game.scene.getPlayerPokemon()!;

      // Set all stat stages to 6
      vi.spyOn(playerPokemon.summonData, "statStages", "get").mockReturnValue(new Array(BATTLE_STATS.length).fill(6));

      game.move.select(Moves.SPLASH);
      await game.toNextTurn();

      // Should decrease one stat stage by 1 (from 6, meaning it will be 5)
      const decreasedStat = EFFECTIVE_STATS.filter(s => playerPokemon.getStatStage(s) === 5);

      expect(decreasedStat).toBeTruthy();
      expect(decreasedStat.length).toBe(1);
    });
});
