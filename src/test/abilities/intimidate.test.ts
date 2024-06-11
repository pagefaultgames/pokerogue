import {afterEach, beforeAll, beforeEach, describe, expect, it, vi} from "vitest";
import Phaser from "phaser";
import GameManager from "#app/test/utils/gameManager";
import * as overrides from "#app/overrides";
import {Abilities} from "#app/data/enums/abilities";
import {Species} from "#app/data/enums/species";
import {
  CommandPhase, TurnInitPhase
} from "#app/phases";
import {Mode} from "#app/ui/ui";
import {BattleStat} from "#app/data/battle-stat";
import {Moves} from "#app/data/enums/moves";


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
    vi.spyOn(overrides, "OPP_SPECIES_OVERRIDE", "get").mockReturnValue(Species.RATTATA);
    vi.spyOn(overrides, "OPP_ABILITY_OVERRIDE", "get").mockReturnValue(Abilities.INTIMIDATE);
    vi.spyOn(overrides, "OPP_PASSIVE_ABILITY_OVERRIDE", "get").mockReturnValue(Abilities.HYDRATION);
    vi.spyOn(overrides, "ABILITY_OVERRIDE", "get").mockReturnValue(Abilities.INTIMIDATE);
    vi.spyOn(overrides, "STARTING_WAVE_OVERRIDE", "get").mockReturnValue(3);
    vi.spyOn(overrides, "OPP_MOVESET_OVERRIDE", "get").mockReturnValue([Moves.SPLASH,Moves.SPLASH,Moves.SPLASH,Moves.SPLASH]);
  });

  it("single - wild with switch", async() => {
    await game.runToSummon([
      Species.MIGHTYENA,
      Species.POOCHYENA,
    ]);
    game.onNextPrompt("CheckSwitchPhase", Mode.CONFIRM, () => {
      game.setMode(Mode.MESSAGE);
      game.endPhase();
    }, () => game.isCurrentPhase(CommandPhase) || game.isCurrentPhase(TurnInitPhase));
    await game.phaseInterceptor.to(CommandPhase, false);
    expect(game.scene.getParty()[0].species.speciesId).toBe(Species.MIGHTYENA);
    let battleStatsOpponent = game.scene.currentBattle.enemyParty[0].summonData.battleStats;
    expect(battleStatsOpponent[BattleStat.ATK]).toBe(-1);
    let battleStatsPokemon = game.scene.getParty()[0].summonData.battleStats;
    expect(battleStatsPokemon[BattleStat.ATK]).toBe(-1);
    await game.switchPokemon(1);
    expect(game.scene.getParty()[0].species.speciesId).toBe(Species.POOCHYENA);

    battleStatsPokemon = game.scene.getParty()[0].summonData.battleStats;
    expect(battleStatsPokemon[BattleStat.ATK]).toBe(-1);

    battleStatsOpponent = game.scene.currentBattle.enemyParty[0].summonData.battleStats;
    expect(battleStatsOpponent[BattleStat.ATK]).toBe(-2);
  }, 20000);

  it("single - boss should only trigger once then switch", async() => {
    vi.spyOn(overrides, "STARTING_WAVE_OVERRIDE", "get").mockReturnValue(10);
    await game.runToSummon([
      Species.MIGHTYENA,
      Species.POOCHYENA,
    ]);
    game.onNextPrompt("CheckSwitchPhase", Mode.CONFIRM, () => {
      game.setMode(Mode.MESSAGE);
      game.endPhase();
    }, () => game.isCurrentPhase(CommandPhase) || game.isCurrentPhase(TurnInitPhase));
    await game.phaseInterceptor.to(CommandPhase, false);
    let battleStatsOpponent = game.scene.currentBattle.enemyParty[0].summonData.battleStats;
    expect(battleStatsOpponent[BattleStat.ATK]).toBe(-1);
    let battleStatsPokemon = game.scene.getParty()[0].summonData.battleStats;
    expect(battleStatsPokemon[BattleStat.ATK]).toBe(-1);
    await game.switchPokemon(1);
    expect(game.scene.getParty()[0].species.speciesId).toBe(Species.POOCHYENA);

    battleStatsPokemon = game.scene.getParty()[0].summonData.battleStats;
    expect(battleStatsPokemon[BattleStat.ATK]).toBe(-1);

    battleStatsOpponent = game.scene.currentBattle.enemyParty[0].summonData.battleStats;
    expect(battleStatsOpponent[BattleStat.ATK]).toBe(-2);
  }, 20000);

  it("single - trainer should only trigger once with switch", async() => {
    vi.spyOn(overrides, "STARTING_WAVE_OVERRIDE", "get").mockReturnValue(5);
    await game.runToSummon([
      Species.MIGHTYENA,
      Species.POOCHYENA,
    ]);
    game.onNextPrompt("CheckSwitchPhase", Mode.CONFIRM, () => {
      game.setMode(Mode.MESSAGE);
      game.endPhase();
    }, () => game.isCurrentPhase(CommandPhase) || game.isCurrentPhase(TurnInitPhase));
    await game.phaseInterceptor.to(CommandPhase, false);
    let battleStatsOpponent = game.scene.currentBattle.enemyParty[0].summonData.battleStats;
    expect(battleStatsOpponent[BattleStat.ATK]).toBe(-1);
    let battleStatsPokemon = game.scene.getParty()[0].summonData.battleStats;
    expect(battleStatsPokemon[BattleStat.ATK]).toBe(-1);
    await game.switchPokemon(1);
    expect(game.scene.getParty()[0].species.speciesId).toBe(Species.POOCHYENA);

    battleStatsPokemon = game.scene.getParty()[0].summonData.battleStats;
    expect(battleStatsPokemon[BattleStat.ATK]).toBe(-1);

    battleStatsOpponent = game.scene.currentBattle.enemyParty[0].summonData.battleStats;
    expect(battleStatsOpponent[BattleStat.ATK]).toBe(-2);
  }, 200000);

  it("double - trainer should only trigger once per pokemon", async() => {
    vi.spyOn(overrides, "SINGLE_BATTLE_OVERRIDE", "get").mockReturnValue(false);
    vi.spyOn(overrides, "DOUBLE_BATTLE_OVERRIDE", "get").mockReturnValue(true);
    vi.spyOn(overrides, "STARTING_WAVE_OVERRIDE", "get").mockReturnValue(5);
    await game.runToSummon([
      Species.MIGHTYENA,
      Species.POOCHYENA,
    ]);
    game.onNextPrompt("CheckSwitchPhase", Mode.CONFIRM, () => {
      game.setMode(Mode.MESSAGE);
      game.endPhase();
    }, () => game.isCurrentPhase(CommandPhase) || game.isCurrentPhase(TurnInitPhase));
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
      Species.POOCHYENA,
    ]);
    game.onNextPrompt("CheckSwitchPhase", Mode.CONFIRM, () => {
      game.setMode(Mode.MESSAGE);
      game.endPhase();
    }, () => game.isCurrentPhase(CommandPhase) || game.isCurrentPhase(TurnInitPhase));
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
      Species.POOCHYENA,
    ]);
    game.onNextPrompt("CheckSwitchPhase", Mode.CONFIRM, () => {
      game.setMode(Mode.MESSAGE);
      game.endPhase();
    }, () => game.isCurrentPhase(CommandPhase) || game.isCurrentPhase(TurnInitPhase));
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
