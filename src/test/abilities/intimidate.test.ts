import { BattleStat } from "#app/data/battle-stat";
import { Status, StatusEffect } from "#app/data/status-effect";
import { GameModes, getGameMode } from "#app/game-mode";
import { EncounterPhase } from "#app/phases/encounter-phase";
import { SelectStarterPhase } from "#app/phases/select-starter-phase";
import { Mode } from "#app/ui/ui";
import { Abilities } from "#enums/abilities";
import { Moves } from "#enums/moves";
import { Species } from "#enums/species";
import GameManager from "#test/utils/gameManager";
import { generateStarter } from "#test/utils/gameManagerUtils";
import { SPLASH_ONLY } from "#test/utils/testUtils";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";

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
    game.override
      .battleType("single")
      .enemySpecies(Species.MAGIKARP)
      .enemyAbility(Abilities.INTIMIDATE)
      .ability(Abilities.INTIMIDATE)
      .moveset([Moves.SPLASH, Moves.AERIAL_ACE])
      .enemyMoveset(SPLASH_ONLY);
  });

  it("single - wild with switch", async () => {
    await game.startBattle([Species.MIGHTYENA, Species.POOCHYENA]);

    let battleStatsOpponent = game.scene.currentBattle.enemyParty[0].summonData.battleStats;
    expect(battleStatsOpponent[BattleStat.ATK]).toBe(-1);

    let battleStatsPokemon = game.scene.getParty()[0].summonData.battleStats;
    expect(battleStatsPokemon[BattleStat.ATK]).toBe(-1);

    game.doSwitchPokemon(1);
    await game.phaseInterceptor.to("CommandPhase");

    battleStatsPokemon = game.scene.getParty()[0].summonData.battleStats;
    expect(battleStatsPokemon[BattleStat.ATK]).toBe(0);

    battleStatsOpponent = game.scene.currentBattle.enemyParty[0].summonData.battleStats;
    expect(battleStatsOpponent[BattleStat.ATK]).toBe(-2);
  }, 20000);

  it("single - boss should only trigger once then switch", async () => {
    game.override.startingWave(10);
    await game.startBattle([Species.MIGHTYENA, Species.POOCHYENA]);

    let battleStatsOpponent = game.scene.currentBattle.enemyParty[0].summonData.battleStats;
    expect(battleStatsOpponent[BattleStat.ATK]).toBe(-1);

    let battleStatsPokemon = game.scene.getParty()[0].summonData.battleStats;
    expect(battleStatsPokemon[BattleStat.ATK]).toBe(-1);

    game.doSwitchPokemon(1);
    await game.phaseInterceptor.to("CommandPhase");

    battleStatsPokemon = game.scene.getParty()[0].summonData.battleStats;
    expect(battleStatsPokemon[BattleStat.ATK]).toBe(0);

    battleStatsOpponent = game.scene.currentBattle.enemyParty[0].summonData.battleStats;
    expect(battleStatsOpponent[BattleStat.ATK]).toBe(-2);
  }, 20000);

  it("single - trainer should only trigger once with switch", async () => {
    game.override.startingWave(5);
    await game.startBattle([Species.MIGHTYENA, Species.POOCHYENA]);

    let battleStatsOpponent = game.scene.currentBattle.enemyParty[0].summonData.battleStats;
    expect(battleStatsOpponent[BattleStat.ATK]).toBe(-1);

    let battleStatsPokemon = game.scene.getParty()[0].summonData.battleStats;
    expect(battleStatsPokemon[BattleStat.ATK]).toBe(-1);

    game.doSwitchPokemon(1);
    await game.phaseInterceptor.to("CommandPhase");

    battleStatsPokemon = game.scene.getParty()[0].summonData.battleStats;
    expect(battleStatsPokemon[BattleStat.ATK]).toBe(0);

    battleStatsOpponent = game.scene.currentBattle.enemyParty[0].summonData.battleStats;
    expect(battleStatsOpponent[BattleStat.ATK]).toBe(-2);
  }, 200000);

  it("double - trainer should only trigger once per pokemon", async () => {
    game.override
      .battleType("double")
      .startingWave(5);
    await game.startBattle([Species.MIGHTYENA, Species.POOCHYENA]);

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
    await game.startBattle([Species.MIGHTYENA, Species.POOCHYENA]);

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
    game.override
      .battleType("double")
      .startingWave(10);
    await game.startBattle([Species.MIGHTYENA, Species.POOCHYENA]);

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
    await game.startBattle([Species.MIGHTYENA]);

    let battleStatsOpponent = game.scene.currentBattle.enemyParty[0].summonData.battleStats;
    expect(battleStatsOpponent[BattleStat.ATK]).toBe(-1);

    let battleStatsPokemon = game.scene.getParty()[0].summonData.battleStats;
    expect(battleStatsPokemon[BattleStat.ATK]).toBe(-1);

    game.move.select(Moves.AERIAL_ACE);
    await game.phaseInterceptor.to("DamagePhase");
    await game.doKillOpponents();
    await game.toNextWave();

    battleStatsPokemon = game.scene.getParty()[0].summonData.battleStats;
    expect(battleStatsPokemon[BattleStat.ATK]).toBe(-2);

    battleStatsOpponent = game.scene.currentBattle.enemyParty[0].summonData.battleStats;
    expect(battleStatsOpponent[BattleStat.ATK]).toBe(0);
  }, 20000);

  it("single - wild next turn - no retrigger on next turn", async () => {
    await game.startBattle([Species.MIGHTYENA]);

    let battleStatsOpponent = game.scene.currentBattle.enemyParty[0].summonData.battleStats;
    expect(battleStatsOpponent[BattleStat.ATK]).toBe(-1);

    let battleStatsPokemon = game.scene.getParty()[0].summonData.battleStats;
    expect(battleStatsPokemon[BattleStat.ATK]).toBe(-1);

    game.move.select(Moves.SPLASH);
    await game.toNextTurn();

    battleStatsPokemon = game.scene.getParty()[0].summonData.battleStats;
    expect(battleStatsPokemon[BattleStat.ATK]).toBe(-1);

    battleStatsOpponent = game.scene.currentBattle.enemyParty[0].summonData.battleStats;
    expect(battleStatsOpponent[BattleStat.ATK]).toBe(-1);
  }, 20000);

  it("single - trainer should only trigger once and each time he switch", async () => {
    game.override
      .enemyMoveset(Array(4).fill(Moves.VOLT_SWITCH))
      .startingWave(5);
    await game.startBattle([Species.MIGHTYENA]);

    let battleStatsOpponent = game.scene.currentBattle.enemyParty[0].summonData.battleStats;
    expect(battleStatsOpponent[BattleStat.ATK]).toBe(-1);

    let battleStatsPokemon = game.scene.getParty()[0].summonData.battleStats;
    expect(battleStatsPokemon[BattleStat.ATK]).toBe(-1);

    game.move.select(Moves.SPLASH);
    await game.toNextTurn();

    battleStatsPokemon = game.scene.getParty()[0].summonData.battleStats;
    expect(battleStatsPokemon[BattleStat.ATK]).toBe(-2);

    battleStatsOpponent = game.scene.currentBattle.enemyParty[0].summonData.battleStats;
    expect(battleStatsOpponent[BattleStat.ATK]).toBe(0);

    game.move.select(Moves.SPLASH);
    await game.toNextTurn();

    battleStatsPokemon = game.scene.getParty()[0].summonData.battleStats;
    expect(battleStatsPokemon[BattleStat.ATK]).toBe(-3);

    battleStatsOpponent = game.scene.currentBattle.enemyParty[0].summonData.battleStats;
    expect(battleStatsOpponent[BattleStat.ATK]).toBe(0);
  }, 200000);

  it("single - trainer should only trigger once whatever turn we are", async () => {
    game.override.startingWave(5);
    await game.startBattle([Species.MIGHTYENA]);

    const battleStatsOpponent = game.scene.currentBattle.enemyParty[0].summonData.battleStats;
    const battleStatsPokemon = game.scene.getParty()[0].summonData.battleStats;

    expect(battleStatsOpponent[BattleStat.ATK]).toBe(-1);
    expect(battleStatsPokemon[BattleStat.ATK]).toBe(-1);

    game.move.select(Moves.SPLASH);
    await game.toNextTurn();

    expect(battleStatsPokemon[BattleStat.ATK]).toBe(-1);
    expect(battleStatsOpponent[BattleStat.ATK]).toBe(-1);
  }, 20000);

  it("double - wild vs only 1 on player side", async () => {
    game.override.battleType("double");
    await game.classicMode.runToSummon([Species.MIGHTYENA]);
    await game.phaseInterceptor.to("CommandPhase", false);

    const battleStatsOpponent = game.scene.currentBattle.enemyParty[0].summonData.battleStats;
    expect(battleStatsOpponent[BattleStat.ATK]).toBe(-1);

    const battleStatsOpponent2 = game.scene.currentBattle.enemyParty[1].summonData.battleStats;
    expect(battleStatsOpponent2[BattleStat.ATK]).toBe(-1);

    const battleStatsPokemon = game.scene.getParty()[0].summonData.battleStats;
    expect(battleStatsPokemon[BattleStat.ATK]).toBe(-2);
  }, 20000);

  it("double - wild vs only 1 alive on player side", async () => {
    game.override.battleType("double");
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

    await game.phaseInterceptor.to("CommandPhase", false);

    const battleStatsOpponent = game.scene.currentBattle.enemyParty[0].summonData.battleStats;
    expect(battleStatsOpponent[BattleStat.ATK]).toBe(-1);

    const battleStatsOpponent2 = game.scene.currentBattle.enemyParty[1].summonData.battleStats;
    expect(battleStatsOpponent2[BattleStat.ATK]).toBe(-1);

    const battleStatsPokemon = game.scene.getParty()[0].summonData.battleStats;
    expect(battleStatsPokemon[BattleStat.ATK]).toBe(-2);
  }, 20000);
});
