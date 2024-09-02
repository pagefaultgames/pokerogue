import { BattleStat } from "#app/data/battle-stat";
import { Abilities } from "#enums/abilities";
import { Moves } from "#enums/moves";
import { Species } from "#enums/species";
import GameManager from "#test/utils/gameManager";
import { SPLASH_ONLY } from "#test/utils/testUtils";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";

describe("Abilities - Moody", () => {
  let phaserGame: Phaser.Game;
  let game: GameManager;

  const battleStatsArray = [BattleStat.ATK, BattleStat.DEF, BattleStat.SPATK, BattleStat.SPDEF, BattleStat.SPD];

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
      .enemyPassiveAbility(Abilities.HYDRATION)
      .ability(Abilities.MOODY)
      .enemyMoveset(SPLASH_ONLY)
      .moveset(SPLASH_ONLY);
  });

  it(
    "should increase one BattleStat by 2 stages and decrease a different BattleStat by 1 stage",
    async () => {
      await game.startBattle();

      const playerPokemon = game.scene.getPlayerPokemon()!;
      game.move.select(Moves.SPLASH);
      await game.toNextTurn();

      // Find the increased and decreased stats, make sure they are different.
      const statChanges = playerPokemon.summonData.battleStats;
      const changedStats = battleStatsArray.filter(bs => statChanges[bs] === 2 || statChanges[bs] === -1);

      expect(changedStats).toBeTruthy();
      expect(changedStats.length).toBe(2);
      expect(changedStats[0] !== changedStats[1]).toBeTruthy();
    });

  it(
    "should only increase one BattleStat by 2 stages if all BattleStats are at -6",
    async () => {
      await game.startBattle();

      const playerPokemon = game.scene.getPlayerPokemon()!;
      // Set all BattleStats to -6
      battleStatsArray.forEach(bs => playerPokemon.summonData.battleStats[bs] = -6);

      game.move.select(Moves.SPLASH);
      await game.toNextTurn();

      // Should increase one BattleStat by 2 (from -6, meaning it will be -4)
      const increasedStat = battleStatsArray.filter(bs => playerPokemon.summonData.battleStats[bs] === -4);

      expect(increasedStat).toBeTruthy();
      expect(increasedStat.length).toBe(1);
    });

  it(
    "should only decrease one BattleStat by 1 stage if all BattleStats are at 6",
    async () => {
      await game.startBattle();

      const playerPokemon = game.scene.getPlayerPokemon()!;
      // Set all BattleStats to 6
      battleStatsArray.forEach(bs => playerPokemon.summonData.battleStats[bs] = 6);

      game.move.select(Moves.SPLASH);
      await game.toNextTurn();

      // Should decrease one BattleStat by 1 (from 6, meaning it will be 5)
      const decreasedStat = battleStatsArray.filter(bs => playerPokemon.summonData.battleStats[bs] === 5);
      expect(decreasedStat).toBeTruthy();
      expect(decreasedStat.length).toBe(1);
    });
});
