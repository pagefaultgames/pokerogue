import {afterEach, beforeAll, beforeEach, describe, expect, it, vi} from "vitest";
import Phaser from "phaser";
import GameManager from "#app/test/utils/gameManager";
import * as overrides from "#app/overrides";
import {Abilities} from "#app/data/enums/abilities";
import {Species} from "#app/data/enums/species";
import {
  MessagePhase,
  PostSummonPhase,
  ShowAbilityPhase,
  StatChangePhase,
  ToggleDoublePositionPhase
} from "#app/phases";
import {BattleStat} from "#app/data/battle-stat";


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
    vi.spyOn(overrides, "SINGLE_BATTLE_OVERRIDE", "get").mockReturnValue(true);
    vi.spyOn(overrides, "OPP_SPECIES_OVERRIDE", "get").mockReturnValue(Species.ZACIAN);
    vi.spyOn(overrides, "OPP_ABILITY_OVERRIDE", "get").mockReturnValue(Abilities.INTREPID_SWORD);
    vi.spyOn(overrides, "ABILITY_OVERRIDE", "get").mockReturnValue(Abilities.INTREPID_SWORD);
  });

  it("INTREPID SWORD on player", async() => {
    await game.runToSummon([
      Species.ZACIAN,
    ]);
    await game.phaseInterceptor.runFrom(PostSummonPhase).to(PostSummonPhase);
    expect(game.scene.getParty()[0].summonData).not.toBeUndefined();
    let battleStatsPokemon = game.scene.getParty()[0].summonData.battleStats;
    expect(battleStatsPokemon[BattleStat.ATK]).toBe(0);
    await game.phaseInterceptor.run(ShowAbilityPhase);
    await game.phaseInterceptor.run(StatChangePhase);
    battleStatsPokemon = game.scene.getParty()[0].summonData.battleStats;
    expect(battleStatsPokemon[BattleStat.ATK]).toBe(1);
  }, 20000);

  it("INTREPID SWORD on opponent", async() => {
    await game.runToSummon([
      Species.ZACIAN,
    ]);
    let battleStatsOpponent = game.scene.currentBattle.enemyParty[0].summonData.battleStats;
    expect(battleStatsOpponent[BattleStat.ATK]).toBe(0);
    await game.phaseInterceptor.runFrom(PostSummonPhase).to(ToggleDoublePositionPhase);
    await game.phaseInterceptor.run(StatChangePhase);
    await game.phaseInterceptor.run(MessagePhase);
    battleStatsOpponent = game.scene.currentBattle.enemyParty[0].summonData.battleStats;
    expect(battleStatsOpponent[BattleStat.ATK]).toBe(1);
  }, 20000);
});
