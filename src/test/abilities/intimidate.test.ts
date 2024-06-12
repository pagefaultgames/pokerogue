import {afterEach, beforeAll, beforeEach, describe, expect, it, vi} from "vitest";
import Phaser from "phaser";
import GameManager from "#app/test/utils/gameManager";
import * as overrides from "#app/overrides";
import {Abilities} from "#app/data/enums/abilities";
import {Species} from "#app/data/enums/species";
import {
  CommandPhase, DamagePhase,
  EnemyCommandPhase,
  TurnInitPhase,
} from "#app/phases";
import {Mode} from "#app/ui/ui";
import {BattleStat} from "#app/data/battle-stat";
import {Moves} from "#app/data/enums/moves";
import {getMovePosition} from "#app/test/utils/gameManagerUtils";
import {Command} from "#app/ui/command-ui-handler";


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
    game.doSwitchPokemon(1);
    await game.phaseInterceptor.run(CommandPhase);
    await game.phaseInterceptor.to(CommandPhase);
    expect(game.scene.getParty()[0].species.speciesId).toBe(Species.POOCHYENA);

    battleStatsPokemon = game.scene.getParty()[0].summonData.battleStats;
    expect(battleStatsPokemon[BattleStat.ATK]).toBe(0);

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
    game.doSwitchPokemon(1);
    await game.phaseInterceptor.run(CommandPhase);
    await game.phaseInterceptor.to(CommandPhase);
    expect(game.scene.getParty()[0].species.speciesId).toBe(Species.POOCHYENA);

    battleStatsPokemon = game.scene.getParty()[0].summonData.battleStats;
    expect(battleStatsPokemon[BattleStat.ATK]).toBe(0);

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
    game.doSwitchPokemon(1);
    await game.phaseInterceptor.run(CommandPhase);
    await game.phaseInterceptor.to(CommandPhase);
    expect(game.scene.getParty()[0].species.speciesId).toBe(Species.POOCHYENA);

    battleStatsPokemon = game.scene.getParty()[0].summonData.battleStats;
    expect(battleStatsPokemon[BattleStat.ATK]).toBe(0);

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

  it("single - wild next wave opp triger once, us: none", async() => {
    vi.spyOn(overrides, "STARTING_WAVE_OVERRIDE", "get").mockReturnValue(2);
    vi.spyOn(overrides, "MOVESET_OVERRIDE", "get").mockReturnValue([Moves.AERIAL_ACE]);
    await game.startBattle([
      Species.MIGHTYENA,
      Species.POOCHYENA,
    ]);
    let battleStatsOpponent = game.scene.currentBattle.enemyParty[0].summonData.battleStats;
    expect(battleStatsOpponent[BattleStat.ATK]).toBe(-1);
    let battleStatsPokemon = game.scene.getParty()[0].summonData.battleStats;
    expect(battleStatsPokemon[BattleStat.ATK]).toBe(-1);

    game.onNextPrompt("CommandPhase", Mode.COMMAND, () => {
      game.scene.ui.setMode(Mode.FIGHT, (game.scene.getCurrentPhase() as CommandPhase).getFieldIndex());
    });
    game.onNextPrompt("CommandPhase", Mode.FIGHT, () => {
      const movePosition = getMovePosition(game.scene, 0, Moves.AERIAL_ACE);
      (game.scene.getCurrentPhase() as CommandPhase).handleCommand(Command.FIGHT, movePosition, false);
    });
    await game.phaseInterceptor.runFrom(EnemyCommandPhase).to(DamagePhase);
    await game.killPokemon(game.scene.currentBattle.enemyParty[0]);
    expect(game.scene.currentBattle.enemyParty[0].isFainted()).toBe(true);
    await game.toNextWave();
    battleStatsPokemon = game.scene.getParty()[0].summonData.battleStats;
    expect(battleStatsPokemon[BattleStat.ATK]).toBe(-2);
    battleStatsOpponent = game.scene.currentBattle.enemyParty[0].summonData.battleStats;
    expect(battleStatsOpponent[BattleStat.ATK]).toBe(0);
  }, 20000);

  it("single - wild next turn - no retrigger on next turn", async() => {
    vi.spyOn(overrides, "STARTING_WAVE_OVERRIDE", "get").mockReturnValue(2);
    vi.spyOn(overrides, "MOVESET_OVERRIDE", "get").mockReturnValue([Moves.SPLASH]);
    await game.startBattle([
      Species.MIGHTYENA,
      Species.POOCHYENA,
    ]);
    let battleStatsOpponent = game.scene.currentBattle.enemyParty[0].summonData.battleStats;
    expect(battleStatsOpponent[BattleStat.ATK]).toBe(-1);
    let battleStatsPokemon = game.scene.getParty()[0].summonData.battleStats;
    expect(battleStatsPokemon[BattleStat.ATK]).toBe(-1);

    game.onNextPrompt("CommandPhase", Mode.COMMAND, () => {
      game.scene.ui.setMode(Mode.FIGHT, (game.scene.getCurrentPhase() as CommandPhase).getFieldIndex());
    });
    game.onNextPrompt("CommandPhase", Mode.FIGHT, () => {
      const movePosition = getMovePosition(game.scene, 0, Moves.AERIAL_ACE);
      (game.scene.getCurrentPhase() as CommandPhase).handleCommand(Command.FIGHT, movePosition, false);
    });
    console.log("===to new turn===");
    await game.toNextTurn();
    battleStatsPokemon = game.scene.getParty()[0].summonData.battleStats;
    expect(battleStatsPokemon[BattleStat.ATK]).toBe(-1);
    battleStatsOpponent = game.scene.currentBattle.enemyParty[0].summonData.battleStats;
    expect(battleStatsOpponent[BattleStat.ATK]).toBe(-1);
  }, 20000);

  it("single - trainer should only trigger once and each time he switch", async() => {
    vi.spyOn(overrides, "MOVESET_OVERRIDE", "get").mockReturnValue([Moves.SPLASH]);
    vi.spyOn(overrides, "OPP_MOVESET_OVERRIDE", "get").mockReturnValue([Moves.VOLT_SWITCH,Moves.VOLT_SWITCH,Moves.VOLT_SWITCH,Moves.VOLT_SWITCH]);
    vi.spyOn(overrides, "STARTING_WAVE_OVERRIDE", "get").mockReturnValue(5);
    await game.startBattle([
      Species.MIGHTYENA,
      Species.POOCHYENA,
    ]);
    let battleStatsOpponent = game.scene.currentBattle.enemyParty[0].summonData.battleStats;
    expect(battleStatsOpponent[BattleStat.ATK]).toBe(-1);
    let battleStatsPokemon = game.scene.getParty()[0].summonData.battleStats;
    expect(battleStatsPokemon[BattleStat.ATK]).toBe(-1);

    game.onNextPrompt("CommandPhase", Mode.COMMAND, () => {
      game.scene.ui.setMode(Mode.FIGHT, (game.scene.getCurrentPhase() as CommandPhase).getFieldIndex());
    });
    game.onNextPrompt("CommandPhase", Mode.FIGHT, () => {
      const movePosition = getMovePosition(game.scene, 0, Moves.AERIAL_ACE);
      (game.scene.getCurrentPhase() as CommandPhase).handleCommand(Command.FIGHT, movePosition, false);
    });
    console.log("===to new turn===");
    await game.toNextTurn();
    battleStatsPokemon = game.scene.getParty()[0].summonData.battleStats;
    expect(battleStatsPokemon[BattleStat.ATK]).toBe(-2);
    battleStatsOpponent = game.scene.currentBattle.enemyParty[0].summonData.battleStats;
    expect(battleStatsOpponent[BattleStat.ATK]).toBe(0);


    game.onNextPrompt("CommandPhase", Mode.COMMAND, () => {
      game.scene.ui.setMode(Mode.FIGHT, (game.scene.getCurrentPhase() as CommandPhase).getFieldIndex());
    });
    game.onNextPrompt("CommandPhase", Mode.FIGHT, () => {
      const movePosition = getMovePosition(game.scene, 0, Moves.AERIAL_ACE);
      (game.scene.getCurrentPhase() as CommandPhase).handleCommand(Command.FIGHT, movePosition, false);
    });
    console.log("===to new turn===");
    await game.toNextTurn();
    battleStatsPokemon = game.scene.getParty()[0].summonData.battleStats;
    expect(battleStatsPokemon[BattleStat.ATK]).toBe(-3);
    battleStatsOpponent = game.scene.currentBattle.enemyParty[0].summonData.battleStats;
    expect(battleStatsOpponent[BattleStat.ATK]).toBe(0);
  }, 200000);

  it("single - trainer should only trigger once whatever turn we are", async() => {
    vi.spyOn(overrides, "MOVESET_OVERRIDE", "get").mockReturnValue([Moves.SPLASH]);
    vi.spyOn(overrides, "OPP_MOVESET_OVERRIDE", "get").mockReturnValue([Moves.SPLASH,Moves.SPLASH,Moves.SPLASH,Moves.SPLASH]);
    vi.spyOn(overrides, "STARTING_WAVE_OVERRIDE", "get").mockReturnValue(5);
    await game.startBattle([
      Species.MIGHTYENA,
      Species.POOCHYENA,
    ]);
    let battleStatsOpponent = game.scene.currentBattle.enemyParty[0].summonData.battleStats;
    expect(battleStatsOpponent[BattleStat.ATK]).toBe(-1);
    let battleStatsPokemon = game.scene.getParty()[0].summonData.battleStats;
    expect(battleStatsPokemon[BattleStat.ATK]).toBe(-1);

    game.onNextPrompt("CommandPhase", Mode.COMMAND, () => {
      game.scene.ui.setMode(Mode.FIGHT, (game.scene.getCurrentPhase() as CommandPhase).getFieldIndex());
    });
    game.onNextPrompt("CommandPhase", Mode.FIGHT, () => {
      const movePosition = getMovePosition(game.scene, 0, Moves.AERIAL_ACE);
      (game.scene.getCurrentPhase() as CommandPhase).handleCommand(Command.FIGHT, movePosition, false);
    });
    console.log("===to new turn===");
    await game.toNextTurn();
    battleStatsPokemon = game.scene.getParty()[0].summonData.battleStats;
    expect(battleStatsPokemon[BattleStat.ATK]).toBe(-1);
    battleStatsOpponent = game.scene.currentBattle.enemyParty[0].summonData.battleStats;
    expect(battleStatsOpponent[BattleStat.ATK]).toBe(-1);


    game.onNextPrompt("CommandPhase", Mode.COMMAND, () => {
      game.scene.ui.setMode(Mode.FIGHT, (game.scene.getCurrentPhase() as CommandPhase).getFieldIndex());
    });
    game.onNextPrompt("CommandPhase", Mode.FIGHT, () => {
      const movePosition = getMovePosition(game.scene, 0, Moves.AERIAL_ACE);
      (game.scene.getCurrentPhase() as CommandPhase).handleCommand(Command.FIGHT, movePosition, false);
    });
    console.log("===to new turn===");
    await game.toNextTurn();
    battleStatsPokemon = game.scene.getParty()[0].summonData.battleStats;
    expect(battleStatsPokemon[BattleStat.ATK]).toBe(-1);
    battleStatsOpponent = game.scene.currentBattle.enemyParty[0].summonData.battleStats;
    expect(battleStatsOpponent[BattleStat.ATK]).toBe(-1);
  }, 200000);
});
