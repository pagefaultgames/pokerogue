import { BattleStat } from "#app/data/battle-stat";
import { CommandPhase } from "#app/phases/command-phase";
import { Abilities } from "#enums/abilities";
import { Species } from "#enums/species";
import GameManager from "#test/utils/gameManager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";


describe("Abilities - Intrepid Sword", () => {
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
    game.override.battleType("single");
    game.override.enemySpecies(Species.ZACIAN);
    game.override.enemyAbility(Abilities.INTREPID_SWORD);
    game.override.ability(Abilities.INTREPID_SWORD);
  });

  it("INTREPID SWORD on player", async() => {
    await game.classicMode.runToSummon([
      Species.ZACIAN,
    ]);
    await game.phaseInterceptor.to(CommandPhase, false);
    const battleStatsPokemon = game.scene.getParty()[0].summonData.battleStats;
    expect(battleStatsPokemon[BattleStat.ATK]).toBe(1);
    const battleStatsOpponent = game.scene.currentBattle.enemyParty[0].summonData.battleStats;
    expect(battleStatsOpponent[BattleStat.ATK]).toBe(1);
  }, 20000);
});
