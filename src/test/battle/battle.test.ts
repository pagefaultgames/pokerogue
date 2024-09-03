import { allSpecies } from "#app/data/pokemon-species";
import { Stat } from "#enums/stat";
import { GameModes, getGameMode } from "#app/game-mode";
import { BattleEndPhase } from "#app/phases/battle-end-phase";
import { CommandPhase } from "#app/phases/command-phase";
import { DamagePhase } from "#app/phases/damage-phase";
import { EncounterPhase } from "#app/phases/encounter-phase";
import { EnemyCommandPhase } from "#app/phases/enemy-command-phase";
import { LoginPhase } from "#app/phases/login-phase";
import { NextEncounterPhase } from "#app/phases/next-encounter-phase";
import { SelectGenderPhase } from "#app/phases/select-gender-phase";
import { SelectModifierPhase } from "#app/phases/select-modifier-phase";
import { SelectStarterPhase } from "#app/phases/select-starter-phase";
import { SummonPhase } from "#app/phases/summon-phase";
import { SwitchPhase } from "#app/phases/switch-phase";
import { TitlePhase } from "#app/phases/title-phase";
import { TurnInitPhase } from "#app/phases/turn-init-phase";
import { VictoryPhase } from "#app/phases/victory-phase";
import GameManager from "#app/test/utils/gameManager";
import { generateStarter } from "#app/test/utils/gameManagerUtils";
import { Mode } from "#app/ui/ui";
import { Abilities } from "#enums/abilities";
import { Moves } from "#enums/moves";
import { PlayerGender } from "#enums/player-gender";
import { Species } from "#enums/species";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { SPLASH_ONLY } from "../utils/testUtils";

describe("Test Battle Phase", () => {
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
    game.scene.gameData.gender = undefined!; // just for these tests!
  });

  it("test phase interceptor with prompt", async () => {
    await game.phaseInterceptor.run(LoginPhase);

    game.onNextPrompt("SelectGenderPhase", Mode.OPTION_SELECT, () => {
      game.scene.gameData.gender = PlayerGender.MALE;
      game.endPhase();
    });

    await game.phaseInterceptor.run(SelectGenderPhase);

    await game.phaseInterceptor.run(TitlePhase);
    await game.waitMode(Mode.TITLE);


    expect(game.scene.ui?.getMode()).toBe(Mode.TITLE);
    expect(game.scene.gameData.gender).toBe(PlayerGender.MALE);
  }, 20000);

  it("test phase interceptor with prompt with preparation for a future prompt", async () => {
    await game.phaseInterceptor.run(LoginPhase);

    game.onNextPrompt("SelectGenderPhase", Mode.OPTION_SELECT, () => {
      game.scene.gameData.gender = PlayerGender.MALE;
      game.endPhase();
    });

    game.onNextPrompt("CheckSwitchPhase", Mode.CONFIRM, () => {
      game.setMode(Mode.MESSAGE);
      game.endPhase();
    });
    await game.phaseInterceptor.run(SelectGenderPhase);

    await game.phaseInterceptor.run(TitlePhase);
    await game.waitMode(Mode.TITLE);


    expect(game.scene.ui?.getMode()).toBe(Mode.TITLE);
    expect(game.scene.gameData.gender).toBe(PlayerGender.MALE);
  }, 20000);

  it("newGame one-liner", async () => {
    await game.startBattle();
    expect(game.scene.ui?.getMode()).toBe(Mode.COMMAND);
    expect(game.scene.getCurrentPhase()!.constructor.name).toBe(CommandPhase.name);
  }, 20000);

  it("do attack wave 3 - single battle - regular - OHKO", async () => {
    game.override.starterSpecies(Species.MEWTWO);
    game.override.enemySpecies(Species.RATTATA);
    game.override.startingLevel(2000);
    game.override
      .startingWave(3)
      .battleType("single");
    game.override.moveset([Moves.TACKLE]);
    game.override.enemyAbility(Abilities.HYDRATION);
    game.override.enemyMoveset([Moves.TACKLE, Moves.TACKLE, Moves.TACKLE, Moves.TACKLE]);
    await game.startBattle();
    game.move.select(Moves.TACKLE);
    await game.phaseInterceptor.runFrom(EnemyCommandPhase).to(SelectModifierPhase, false);
  }, 20000);

  it("do attack wave 3 - single battle - regular - NO OHKO with opponent using non damage attack", async () => {
    game.override.starterSpecies(Species.MEWTWO);
    game.override.enemySpecies(Species.RATTATA);
    game.override.startingLevel(5);
    game.override.startingWave(3);
    game.override.moveset([Moves.TACKLE]);
    game.override.enemyAbility(Abilities.HYDRATION);
    game.override.enemyMoveset([Moves.TAIL_WHIP, Moves.TAIL_WHIP, Moves.TAIL_WHIP, Moves.TAIL_WHIP]);
    game.override.battleType("single");
    await game.startBattle();
    game.move.select(Moves.TACKLE);
    await game.phaseInterceptor.runFrom(EnemyCommandPhase).to(TurnInitPhase, false);
  }, 20000);

  it("load 100% data file", async () => {
    await game.importData("src/test/utils/saves/everything.prsv");
    const caughtCount = Object.keys(game.scene.gameData.dexData).filter((key) => {
      const species = game.scene.gameData.dexData[key];
      return species.caughtAttr !== 0n;
    }).length;
    expect(caughtCount).toBe(Object.keys(allSpecies).length);
  }, 20000);

  it("start battle with selected team", async () => {
    await game.startBattle([
      Species.CHARIZARD,
      Species.CHANSEY,
      Species.MEW
    ]);
    expect(game.scene.getParty()[0].species.speciesId).toBe(Species.CHARIZARD);
    expect(game.scene.getParty()[1].species.speciesId).toBe(Species.CHANSEY);
    expect(game.scene.getParty()[2].species.speciesId).toBe(Species.MEW);
  }, 20000);

  it("test remove random battle seed int", async () => {
    for (let i = 0; i < 10; i++) {
      const rand = game.scene.randBattleSeedInt(16);
      expect(rand).toBe(15);
    }
  });

  it("wrong phase", async () => {
    await game.phaseInterceptor.run(LoginPhase);
    await game.phaseInterceptor.run(LoginPhase).catch((e) => {
      expect(e).toBe("Wrong phase: this is SelectGenderPhase and not LoginPhase");
    });
  }, 20000);

  it("wrong phase but skip", async () => {
    await game.phaseInterceptor.run(LoginPhase);
    await game.phaseInterceptor.run(LoginPhase, () => game.isCurrentPhase(SelectGenderPhase));
  }, 20000);

  it("good run", async () => {
    await game.phaseInterceptor.run(LoginPhase);
    game.onNextPrompt("SelectGenderPhase", Mode.OPTION_SELECT, () => {
      game.scene.gameData.gender = PlayerGender.MALE;
      game.endPhase();
    }, () => game.isCurrentPhase(TitlePhase));
    await game.phaseInterceptor.run(SelectGenderPhase, () => game.isCurrentPhase(TitlePhase));
    await game.phaseInterceptor.run(TitlePhase);
  }, 20000);

  it("good run from select gender to title", async () => {
    await game.phaseInterceptor.run(LoginPhase);
    game.onNextPrompt("SelectGenderPhase", Mode.OPTION_SELECT, () => {
      game.scene.gameData.gender = PlayerGender.MALE;
      game.endPhase();
    }, () => game.isCurrentPhase(TitlePhase));
    await game.phaseInterceptor.runFrom(SelectGenderPhase).to(TitlePhase);
  }, 20000);

  it("good run to SummonPhase phase", async () => {
    await game.phaseInterceptor.run(LoginPhase);
    game.onNextPrompt("SelectGenderPhase", Mode.OPTION_SELECT, () => {
      game.scene.gameData.gender = PlayerGender.MALE;
      game.endPhase();
    }, () => game.isCurrentPhase(TitlePhase));
    game.onNextPrompt("TitlePhase", Mode.TITLE, () => {
      game.scene.gameMode = getGameMode(GameModes.CLASSIC);
      const starters = generateStarter(game.scene);
      const selectStarterPhase = new SelectStarterPhase(game.scene);
      game.scene.pushPhase(new EncounterPhase(game.scene, false));
      selectStarterPhase.initBattle(starters);
    });
    await game.phaseInterceptor.runFrom(SelectGenderPhase).to(SummonPhase);
  }, 20000);

  it("2vs1", async () => {
    game.override.battleType("single");
    game.override.enemySpecies(Species.MIGHTYENA);
    game.override.enemyAbility(Abilities.HYDRATION);
    game.override.ability(Abilities.HYDRATION);
    await game.startBattle([
      Species.BLASTOISE,
      Species.CHARIZARD,
    ]);
    expect(game.scene.ui?.getMode()).toBe(Mode.COMMAND);
    expect(game.scene.getCurrentPhase()!.constructor.name).toBe(CommandPhase.name);
  }, 20000);

  it("1vs1", async () => {
    game.override.battleType("single");
    game.override.enemySpecies(Species.MIGHTYENA);
    game.override.enemyAbility(Abilities.HYDRATION);
    game.override.ability(Abilities.HYDRATION);
    await game.startBattle([
      Species.BLASTOISE,
    ]);
    expect(game.scene.ui?.getMode()).toBe(Mode.COMMAND);
    expect(game.scene.getCurrentPhase()!.constructor.name).toBe(CommandPhase.name);
  }, 20000);

  it("2vs2", async () => {
    game.override.battleType("double");
    game.override.enemySpecies(Species.MIGHTYENA);
    game.override.enemyAbility(Abilities.HYDRATION);
    game.override.ability(Abilities.HYDRATION);
    game.override.startingWave(3);
    await game.startBattle([
      Species.BLASTOISE,
      Species.CHARIZARD,
    ]);
    expect(game.scene.ui?.getMode()).toBe(Mode.COMMAND);
    expect(game.scene.getCurrentPhase()!.constructor.name).toBe(CommandPhase.name);
  }, 20000);

  it("4vs2", async () => {
    game.override.battleType("double");
    game.override.enemySpecies(Species.MIGHTYENA);
    game.override.enemyAbility(Abilities.HYDRATION);
    game.override.ability(Abilities.HYDRATION);
    game.override.startingWave(3);
    await game.startBattle([
      Species.BLASTOISE,
      Species.CHARIZARD,
      Species.DARKRAI,
      Species.GABITE,
    ]);
    expect(game.scene.ui?.getMode()).toBe(Mode.COMMAND);
    expect(game.scene.getCurrentPhase()!.constructor.name).toBe(CommandPhase.name);
  }, 20000);

  it("kill opponent pokemon", async () => {
    const moveToUse = Moves.SPLASH;
    game.override.battleType("single");
    game.override.starterSpecies(Species.MEWTWO);
    game.override.enemySpecies(Species.RATTATA);
    game.override.enemyAbility(Abilities.HYDRATION);
    game.override.ability(Abilities.ZEN_MODE);
    game.override.startingLevel(2000);
    game.override.startingWave(3);
    game.override.moveset([moveToUse]);
    game.override.enemyMoveset([Moves.TACKLE, Moves.TACKLE, Moves.TACKLE, Moves.TACKLE]);
    await game.startBattle([
      Species.DARMANITAN,
      Species.CHARIZARD,
    ]);

    game.move.select(moveToUse);
    await game.phaseInterceptor.to(DamagePhase, false);
    await game.killPokemon(game.scene.currentBattle.enemyParty[0]);
    expect(game.scene.currentBattle.enemyParty[0].isFainted()).toBe(true);
    await game.phaseInterceptor.to(VictoryPhase, false);
  }, 200000);

  it("to next turn", async () => {
    const moveToUse = Moves.SPLASH;
    game.override.battleType("single");
    game.override.starterSpecies(Species.MEWTWO);
    game.override.enemySpecies(Species.RATTATA);
    game.override.enemyAbility(Abilities.HYDRATION);
    game.override.ability(Abilities.ZEN_MODE);
    game.override.startingLevel(2000);
    game.override.startingWave(3);
    game.override.moveset([moveToUse]);
    game.override.enemyMoveset([Moves.TACKLE, Moves.TACKLE, Moves.TACKLE, Moves.TACKLE]);
    await game.startBattle();
    const turn = game.scene.currentBattle.turn;
    game.move.select(moveToUse);
    await game.toNextTurn();
    expect(game.scene.currentBattle.turn).toBeGreaterThan(turn);
  }, 20000);

  it("to next wave with pokemon killed, single", async () => {
    const moveToUse = Moves.SPLASH;
    game.override.battleType("single");
    game.override.starterSpecies(Species.MEWTWO);
    game.override.enemySpecies(Species.RATTATA);
    game.override.enemyAbility(Abilities.HYDRATION);
    game.override.ability(Abilities.ZEN_MODE);
    game.override.startingLevel(2000);
    game.override.startingWave(3);
    game.override.moveset([moveToUse]);
    game.override.enemyMoveset([Moves.TACKLE, Moves.TACKLE, Moves.TACKLE, Moves.TACKLE]);
    await game.startBattle();
    const waveIndex = game.scene.currentBattle.waveIndex;
    game.move.select(moveToUse);
    await game.doKillOpponents();
    await game.toNextWave();
    expect(game.scene.currentBattle.waveIndex).toBeGreaterThan(waveIndex);
  }, 20000);

  it("does not force switch if active pokemon faints at same time as enemy mon and is revived in post-battle", async () => {
    const moveToUse = Moves.TAKE_DOWN;
    game.override
      .battleType("single")
      .starterSpecies(Species.SAWK)
      .enemySpecies(Species.RATTATA)
      .startingWave(1)
      .startingLevel(100)
      .moveset([moveToUse])
      .enemyMoveset(SPLASH_ONLY)
      .startingHeldItems([{ name: "TEMP_STAT_STAGE_BOOSTER", type: Stat.ACC }]);

    await game.startBattle();
    game.scene.getPlayerPokemon()!.hp = 1;
    game.move.select(moveToUse);

    await game.phaseInterceptor.to(BattleEndPhase);
    game.doRevivePokemon(0); // pretend max revive was picked
    game.doSelectModifier();

    game.onNextPrompt("SwitchPhase", Mode.PARTY, () => {
      expect.fail("Switch was forced");
    }, () => game.isCurrentPhase(NextEncounterPhase));
    await game.phaseInterceptor.to(SwitchPhase);
  }, 20000);
});

