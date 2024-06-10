import {afterEach, beforeAll, beforeEach, describe, expect, it, vi} from "vitest";
import Phaser from "phaser";
import GameManager from "#app/test/utils/gameManager";
import * as overrides from "#app/overrides";
import {Abilities} from "#app/data/enums/abilities";
import {Species} from "#app/data/enums/species";
import {
  CommandPhase
} from "#app/phases";
import {Mode} from "#app/ui/ui";
import {BattleStat} from "#app/data/battle-stat";


describe("Abilities - Intimidate", () => {
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
    vi.spyOn(overrides, "OPP_ABILITY_OVERRIDE", "get").mockReturnValue(Abilities.INTIMIDATE);
    vi.spyOn(overrides, "ABILITY_OVERRIDE", "get").mockReturnValue(Abilities.INTIMIDATE);
    vi.spyOn(overrides, "STARTING_WAVE_OVERRIDE", "get").mockReturnValue(3);
  });

  it("single - wild", async() => {
    await game.runToSummon([
      Species.MIGHTYENA,
      Species.MIGHTYENA,
    ]);
    game.onNextPrompt("CheckSwitchPhase", Mode.CONFIRM, () => {
      game.setMode(Mode.MESSAGE);
      game.endPhase();
    });
    await game.phaseInterceptor.to(CommandPhase, false);
    const battleStatsOpponent = game.scene.currentBattle.enemyParty[0].summonData.battleStats;
    expect(battleStatsOpponent[BattleStat.ATK]).toBe(-1);
    const battleStatsPokemon = game.scene.getParty()[0].summonData.battleStats;
    expect(battleStatsPokemon[BattleStat.ATK]).toBe(-1);
  }, 20000);

  it("single - trainer should only trigger once", async() => {
    vi.spyOn(overrides, "STARTING_WAVE_OVERRIDE", "get").mockReturnValue(5);
    await game.runToSummon([
      Species.MIGHTYENA,
      Species.MIGHTYENA,
    ]);
    game.onNextPrompt("CheckSwitchPhase", Mode.CONFIRM, () => {
      game.setMode(Mode.MESSAGE);
      game.endPhase();
    });
    await game.phaseInterceptor.to(CommandPhase, false);
    const battleStatsOpponent = game.scene.currentBattle.enemyParty[0].summonData.battleStats;
    expect(battleStatsOpponent[BattleStat.ATK]).toBe(-1);
    const battleStatsPokemon = game.scene.getParty()[0].summonData.battleStats;
    expect(battleStatsPokemon[BattleStat.ATK]).toBe(-1);
  }, 20000);

  it("single - boss should only trigger once", async() => {
    vi.spyOn(overrides, "STARTING_WAVE_OVERRIDE", "get").mockReturnValue(10);
    await game.runToSummon([
      Species.MIGHTYENA,
      Species.MIGHTYENA,
    ]);
    game.onNextPrompt("CheckSwitchPhase", Mode.CONFIRM, () => {
      game.setMode(Mode.MESSAGE);
      game.endPhase();
    });
    await game.phaseInterceptor.to(CommandPhase, false);
    const battleStatsOpponent = game.scene.currentBattle.enemyParty[0].summonData.battleStats;
    expect(battleStatsOpponent[BattleStat.ATK]).toBe(-1);
    const battleStatsPokemon = game.scene.getParty()[0].summonData.battleStats;
    expect(battleStatsPokemon[BattleStat.ATK]).toBe(-1);
  }, 20000);

  it("double - trainer should only trigger once per pokemon", async() => {
    vi.spyOn(overrides, "SINGLE_BATTLE_OVERRIDE", "get").mockReturnValue(false);
    vi.spyOn(overrides, "DOUBLE_BATTLE_OVERRIDE", "get").mockReturnValue(true);
    vi.spyOn(overrides, "STARTING_WAVE_OVERRIDE", "get").mockReturnValue(5);
    await game.runToSummon([
      Species.MIGHTYENA,
      Species.MIGHTYENA,
    ]);
    game.onNextPrompt("CheckSwitchPhase", Mode.CONFIRM, () => {
      game.setMode(Mode.MESSAGE);
      game.endPhase();
    });
    await game.phaseInterceptor.to(CommandPhase, false);
    const battleStatsOpponent = game.scene.currentBattle.enemyParty[0].summonData.battleStats;
    expect(battleStatsOpponent[BattleStat.ATK]).toBe(-2);
    const battleStatsOpponent2 = game.scene.currentBattle.enemyParty[1].summonData.battleStats;
    expect(battleStatsOpponent2[BattleStat.ATK]).toBe(-2);

    const battleStatsPokemon = game.scene.getParty()[0].summonData.battleStats;
    expect(battleStatsPokemon[BattleStat.ATK]).toBe(-2);

    const battleStatsPokemon2 = game.scene.getParty()[1].summonData.battleStats;
    expect(battleStatsPokemon2[BattleStat.ATK]).toBe(-2);
  }, 20000);

  it("double - wild: should only trigger once per pokemon", async() => {
    vi.spyOn(overrides, "SINGLE_BATTLE_OVERRIDE", "get").mockReturnValue(false);
    vi.spyOn(overrides, "DOUBLE_BATTLE_OVERRIDE", "get").mockReturnValue(true);
    vi.spyOn(overrides, "STARTING_WAVE_OVERRIDE", "get").mockReturnValue(3);
    await game.runToSummon([
      Species.MIGHTYENA,
      Species.MIGHTYENA,
    ]);
    game.onNextPrompt("CheckSwitchPhase", Mode.CONFIRM, () => {
      game.setMode(Mode.MESSAGE);
      game.endPhase();
    });
    await game.phaseInterceptor.to(CommandPhase, false);
    const battleStatsOpponent = game.scene.currentBattle.enemyParty[0].summonData.battleStats;
    expect(battleStatsOpponent[BattleStat.ATK]).toBe(-2);
    const battleStatsOpponent2 = game.scene.currentBattle.enemyParty[1].summonData.battleStats;
    expect(battleStatsOpponent2[BattleStat.ATK]).toBe(-2);

    const battleStatsPokemon = game.scene.getParty()[0].summonData.battleStats;
    expect(battleStatsPokemon[BattleStat.ATK]).toBe(-2);

    const battleStatsPokemon2 = game.scene.getParty()[1].summonData.battleStats;
    expect(battleStatsPokemon2[BattleStat.ATK]).toBe(-2);
  }, 20000);

  it("double - boss: should only trigger once per pokemon", async() => {
    vi.spyOn(overrides, "SINGLE_BATTLE_OVERRIDE", "get").mockReturnValue(false);
    vi.spyOn(overrides, "DOUBLE_BATTLE_OVERRIDE", "get").mockReturnValue(true);
    vi.spyOn(overrides, "STARTING_WAVE_OVERRIDE", "get").mockReturnValue(10);
    await game.runToSummon([
      Species.MIGHTYENA,
      Species.MIGHTYENA,
    ]);
    game.onNextPrompt("CheckSwitchPhase", Mode.CONFIRM, () => {
      game.setMode(Mode.MESSAGE);
      game.endPhase();
    });
    await game.phaseInterceptor.to(CommandPhase, false);
    const battleStatsOpponent = game.scene.currentBattle.enemyParty[0].summonData.battleStats;
    expect(battleStatsOpponent[BattleStat.ATK]).toBe(-2);
    const battleStatsOpponent2 = game.scene.currentBattle.enemyParty[1].summonData.battleStats;
    expect(battleStatsOpponent2[BattleStat.ATK]).toBe(-2);

    const battleStatsPokemon = game.scene.getParty()[0].summonData.battleStats;
    expect(battleStatsPokemon[BattleStat.ATK]).toBe(-2);

    const battleStatsPokemon2 = game.scene.getParty()[1].summonData.battleStats;
    expect(battleStatsPokemon2[BattleStat.ATK]).toBe(-2);
  }, 20000);
});
