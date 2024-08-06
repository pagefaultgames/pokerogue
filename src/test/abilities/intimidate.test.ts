import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";
import Phaser from "phaser";
import GameManager from "#test/utils/gameManager";
import { Mode } from "#app/ui/ui";
import { BattleStat } from "#app/data/battle-stat";
import { generateStarter, getMovePosition } from "#test/utils/gameManagerUtils";
import { Command } from "#app/ui/command-ui-handler";
import { Status, StatusEffect } from "#app/data/status-effect";
import { GameModes, getGameMode } from "#app/game-mode";
import { CommandPhase, DamagePhase, EncounterPhase, EnemyCommandPhase, SelectStarterPhase, TurnInitPhase } from "#app/phases";
import { Abilities } from "#enums/abilities";
import { Moves } from "#enums/moves";
import { Species } from "#enums/species";
import { SPLASH_ONLY } from "#test/utils/testUtils";

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
    game.override.battleType("single");
    game.override.enemySpecies(Species.RATTATA);
    game.override.enemyAbility(Abilities.INTIMIDATE);
    game.override.enemyPassiveAbility(Abilities.HYDRATION);
    game.override.ability(Abilities.INTIMIDATE);
    game.override.startingWave(3);
    game.override.enemyMoveset(SPLASH_ONLY);
  });

  it("single - wild with switch", async () => {
    await game.runToSummon([Species.MIGHTYENA, Species.POOCHYENA]);
    game.onNextPrompt(
      "CheckSwitchPhase",
      Mode.CONFIRM,
      () => {
        game.setMode(Mode.MESSAGE);
        game.endPhase();
      },
      () => game.isCurrentPhase(CommandPhase) || game.isCurrentPhase(TurnInitPhase)
    );
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

  it("single - boss should only trigger once then switch", async () => {
    game.override.startingWave(10);
    await game.runToSummon([Species.MIGHTYENA, Species.POOCHYENA]);
    game.onNextPrompt(
      "CheckSwitchPhase",
      Mode.CONFIRM,
      () => {
        game.setMode(Mode.MESSAGE);
        game.endPhase();
      },
      () => game.isCurrentPhase(CommandPhase) || game.isCurrentPhase(TurnInitPhase)
    );
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

  it("single - trainer should only trigger once with switch", async () => {
    game.override.startingWave(5);
    await game.runToSummon([Species.MIGHTYENA, Species.POOCHYENA]);
    game.onNextPrompt(
      "CheckSwitchPhase",
      Mode.CONFIRM,
      () => {
        game.setMode(Mode.MESSAGE);
        game.endPhase();
      },
      () => game.isCurrentPhase(CommandPhase) || game.isCurrentPhase(TurnInitPhase)
    );
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

  it("double - trainer should only trigger once per pokemon", async () => {
    game.override.battleType("double");
    game.override.startingWave(5);
    await game.runToSummon([Species.MIGHTYENA, Species.POOCHYENA]);
    game.onNextPrompt(
      "CheckSwitchPhase",
      Mode.CONFIRM,
      () => {
        game.setMode(Mode.MESSAGE);
        game.endPhase();
      },
      () => game.isCurrentPhase(CommandPhase) || game.isCurrentPhase(TurnInitPhase)
    );
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

  it("double - wild: should only trigger once per pokemon", async () => {
    game.override.battleType("double");
    game.override.startingWave(3);
    await game.runToSummon([Species.MIGHTYENA, Species.POOCHYENA]);
    game.onNextPrompt(
      "CheckSwitchPhase",
      Mode.CONFIRM,
      () => {
        game.setMode(Mode.MESSAGE);
        game.endPhase();
      },
      () => game.isCurrentPhase(CommandPhase) || game.isCurrentPhase(TurnInitPhase)
    );
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

  it("double - boss: should only trigger once per pokemon", async () => {
    game.override.battleType("double");
    game.override.startingWave(10);
    await game.runToSummon([Species.MIGHTYENA, Species.POOCHYENA]);
    game.onNextPrompt(
      "CheckSwitchPhase",
      Mode.CONFIRM,
      () => {
        game.setMode(Mode.MESSAGE);
        game.endPhase();
      },
      () => game.isCurrentPhase(CommandPhase) || game.isCurrentPhase(TurnInitPhase)
    );
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

  it("single - wild next wave opp triger once, us: none", async () => {
    game.override.startingWave(2);
    game.override.moveset([Moves.AERIAL_ACE]);
    await game.startBattle([Species.MIGHTYENA, Species.POOCHYENA]);
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

  it("single - wild next turn - no retrigger on next turn", async () => {
    game.override.startingWave(2);
    game.override.moveset([Moves.SPLASH]);
    await game.startBattle([Species.MIGHTYENA, Species.POOCHYENA]);
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

  it("single - trainer should only trigger once and each time he switch", async () => {
    game.override.moveset([Moves.SPLASH]);
    game.override.enemyMoveset([Moves.VOLT_SWITCH, Moves.VOLT_SWITCH, Moves.VOLT_SWITCH, Moves.VOLT_SWITCH]);
    game.override.startingWave(5);
    await game.startBattle([Species.MIGHTYENA, Species.POOCHYENA]);
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

  it("single - trainer should only trigger once whatever turn we are", async () => {
    game.override.moveset([Moves.SPLASH]);
    game.override.enemyMoveset(SPLASH_ONLY);
    game.override.startingWave(5);
    await game.startBattle([Species.MIGHTYENA, Species.POOCHYENA]);
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
  }, 20000);

  it("double - wild vs only 1 on player side", async () => {
    game.override.battleType("double");
    game.override.startingWave(3);
    await game.runToSummon([Species.MIGHTYENA]);
    await game.phaseInterceptor.to(CommandPhase, false);
    const battleStatsOpponent = game.scene.currentBattle.enemyParty[0].summonData.battleStats;
    expect(battleStatsOpponent[BattleStat.ATK]).toBe(-1);
    const battleStatsOpponent2 = game.scene.currentBattle.enemyParty[1].summonData.battleStats;
    expect(battleStatsOpponent2[BattleStat.ATK]).toBe(-1);

    const battleStatsPokemon = game.scene.getParty()[0].summonData.battleStats;
    expect(battleStatsPokemon[BattleStat.ATK]).toBe(-2);
  }, 20000);

  it("double - wild vs only 1 alive on player side", async () => {
    game.override.battleType("double");
    game.override.startingWave(3);
    await game.runToTitle();

    game.onNextPrompt("TitlePhase", Mode.TITLE, () => {
      game.scene.gameMode = getGameMode(GameModes.CLASSIC);
      const starters = generateStarter(game.scene, [Species.MIGHTYENA, Species.POOCHYENA]);
      const selectStarterPhase = new SelectStarterPhase(game.scene);
      game.scene.pushPhase(new EncounterPhase(game.scene, false));
      selectStarterPhase.initBattle(starters);
      game.scene.getParty()[1].hp = 0;
      game.scene.getParty()[1].status = new Status(StatusEffect.FAINT);
    });

    await game.phaseInterceptor.run(EncounterPhase);

    await game.phaseInterceptor.to(CommandPhase, false);
    const battleStatsOpponent = game.scene.currentBattle.enemyParty[0].summonData.battleStats;
    expect(battleStatsOpponent[BattleStat.ATK]).toBe(-1);
    const battleStatsOpponent2 = game.scene.currentBattle.enemyParty[1].summonData.battleStats;
    expect(battleStatsOpponent2[BattleStat.ATK]).toBe(-1);

    const battleStatsPokemon = game.scene.getParty()[0].summonData.battleStats;
    expect(battleStatsPokemon[BattleStat.ATK]).toBe(-2);
  }, 20000);
});
