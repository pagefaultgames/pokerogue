import { allSpecies } from "#app/data/pokemon-species";
import { Stat } from "#enums/stat";
import { GameModes, getGameMode } from "#app/game-mode";
import { CommandPhase } from "#app/phases/command-phase";
import { DamageAnimPhase } from "#app/phases/damage-anim-phase";
import { EncounterPhase } from "#app/phases/encounter-phase";
import { LoginPhase } from "#app/phases/login-phase";
import { NextEncounterPhase } from "#app/phases/next-encounter-phase";
import { SelectGenderPhase } from "#app/phases/select-gender-phase";
import { SelectStarterPhase } from "#app/phases/select-starter-phase";
import { SummonPhase } from "#app/phases/summon-phase";
import { TitlePhase } from "#app/phases/title-phase";
import GameManager from "#test/testUtils/gameManager";
import { generateStarter } from "#test/testUtils/gameManagerUtils";
import { UiMode } from "#enums/ui-mode";
import { Abilities } from "#enums/abilities";
import { Moves } from "#enums/moves";
import { PlayerGender } from "#enums/player-gender";
import { Species } from "#enums/species";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { Biome } from "#app/enums/biome";

describe("Test - Battle Phase", () => {
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

    game.onNextPrompt("SelectGenderPhase", UiMode.OPTION_SELECT, () => {
      game.scene.gameData.gender = PlayerGender.MALE;
      game.endPhase();
    });

    await game.phaseInterceptor.run(SelectGenderPhase);

    await game.phaseInterceptor.run(TitlePhase);
    await game.waitMode(UiMode.TITLE);

    expect(game.scene.ui?.getMode()).toBe(UiMode.TITLE);
    expect(game.scene.gameData.gender).toBe(PlayerGender.MALE);
  });

  it("test phase interceptor with prompt with preparation for a future prompt", async () => {
    await game.phaseInterceptor.run(LoginPhase);

    game.onNextPrompt("SelectGenderPhase", UiMode.OPTION_SELECT, () => {
      game.scene.gameData.gender = PlayerGender.MALE;
      game.endPhase();
    });

    game.onNextPrompt("CheckSwitchPhase", UiMode.CONFIRM, () => {
      game.setMode(UiMode.MESSAGE);
      game.endPhase();
    });
    await game.phaseInterceptor.run(SelectGenderPhase);

    await game.phaseInterceptor.run(TitlePhase);
    await game.waitMode(UiMode.TITLE);

    expect(game.scene.ui?.getMode()).toBe(UiMode.TITLE);
    expect(game.scene.gameData.gender).toBe(PlayerGender.MALE);
  });

  it("newGame one-liner", async () => {
    await game.classicMode.startBattle();
    expect(game.scene.ui?.getMode()).toBe(UiMode.COMMAND);
    expect(game.scene.getCurrentPhase()!.constructor.name).toBe(CommandPhase.name);
  });

  it("do attack wave 3 - single battle - regular - OHKO", async () => {
    game.override
      .battleStyle("single")
      .startingWave(3)
      .startingLevel(2000)
      .moveset(Moves.TACKLE)
      .enemySpecies(Species.RATTATA);
    await game.classicMode.startBattle([Species.MEWTWO]);

    game.move.select(Moves.TACKLE);
    await game.toNextWave();
  });

  it("do attack wave 3 - single battle - regular - NO OHKO with opponent using non damage attack", async () => {
    game.override
      .enemySpecies(Species.RATTATA)
      .startingLevel(5)
      .startingWave(3)
      .moveset(Moves.TACKLE)
      .enemyAbility(Abilities.HYDRATION)
      .enemyMoveset(Moves.TAIL_WHIP)
      .battleStyle("single");
    await game.classicMode.startBattle([Species.MEWTWO]);

    game.move.select(Moves.TACKLE);
    await game.toNextWave();
  });

  it("load 100% data file", async () => {
    await game.importData("./test/testUtils/saves/everything.prsv");
    const caughtCount = Object.keys(game.scene.gameData.dexData).filter(key => {
      const species = game.scene.gameData.dexData[key];
      return species.caughtAttr !== 0n;
    }).length;
    expect(caughtCount).toBe(Object.keys(allSpecies).length);
  });

  it("start battle with selected team", async () => {
    await game.classicMode.startBattle([Species.CHARIZARD, Species.CHANSEY, Species.MEW]);
    expect(game.scene.getPlayerParty().map(pm => pm.species.speciesId)).toEqual([
      Species.CHARIZARD,
      Species.CHANSEY,
      Species.MEW,
    ]);
  });

  it("test remove random battle seed int", async () => {
    for (let i = 0; i < 10; i++) {
      const rand = game.scene.randBattleSeedInt(16);
      expect(rand).toBe(15);
    }
  });

  it("wrong phase", async () => {
    await game.phaseInterceptor.run(LoginPhase);
    await game.phaseInterceptor.run(LoginPhase).catch(e => {
      expect(e).toBe("Wrong phase: this is SelectGenderPhase and not LoginPhase");
    });
  });

  it("wrong phase but skip", async () => {
    await game.phaseInterceptor.run(LoginPhase);
    await game.phaseInterceptor.run(LoginPhase, () => game.isCurrentPhase(SelectGenderPhase));
  });

  it("good run", async () => {
    await game.phaseInterceptor.run(LoginPhase);
    game.onNextPrompt(
      "SelectGenderPhase",
      UiMode.OPTION_SELECT,
      () => {
        game.scene.gameData.gender = PlayerGender.MALE;
        game.endPhase();
      },
      () => game.isCurrentPhase(TitlePhase),
    );
    await game.phaseInterceptor.run(SelectGenderPhase, () => game.isCurrentPhase(TitlePhase));
    await game.phaseInterceptor.run(TitlePhase);
  });

  it("good run from select gender to title", async () => {
    await game.phaseInterceptor.run(LoginPhase);
    game.onNextPrompt(
      "SelectGenderPhase",
      UiMode.OPTION_SELECT,
      () => {
        game.scene.gameData.gender = PlayerGender.MALE;
        game.endPhase();
      },
      () => game.isCurrentPhase(TitlePhase),
    );
    await game.phaseInterceptor.runFrom(SelectGenderPhase).to(TitlePhase);
  });

  it("good run to SummonPhase phase", async () => {
    await game.phaseInterceptor.run(LoginPhase);
    game.onNextPrompt(
      "SelectGenderPhase",
      UiMode.OPTION_SELECT,
      () => {
        game.scene.gameData.gender = PlayerGender.MALE;
        game.endPhase();
      },
      () => game.isCurrentPhase(TitlePhase),
    );
    game.onNextPrompt("TitlePhase", UiMode.TITLE, () => {
      game.scene.gameMode = getGameMode(GameModes.CLASSIC);
      const starters = generateStarter(game.scene);
      const selectStarterPhase = new SelectStarterPhase();
      game.scene.pushPhase(new EncounterPhase(false));
      selectStarterPhase.initBattle(starters);
    });
    await game.phaseInterceptor.runFrom(SelectGenderPhase).to(SummonPhase);
  });

  it.each([
    { name: "1v1", double: false, qty: 1 },
    { name: "2v1", double: false, qty: 2 },
    { name: "2v2", double: true, qty: 2 },
    { name: "4v2", double: true, qty: 4 },
  ])("should not crash when starting $name battle", async ({ double, qty }) => {
    game.override
      .battleStyle(double ? "double" : "single")
      .enemySpecies(Species.MIGHTYENA)
      .enemyAbility(Abilities.HYDRATION)
      .ability(Abilities.HYDRATION);

    await game.classicMode.startBattle(
      [Species.BLASTOISE, Species.CHARIZARD, Species.DARKRAI, Species.GABITE].slice(0, qty),
    );

    expect(game.scene.ui?.getMode()).toBe(UiMode.COMMAND);
    expect(game.scene.getCurrentPhase()!.constructor.name).toBe(CommandPhase.name);
  });

  it("kill opponent pokemon", async () => {
    const moveToUse = Moves.SPLASH;
    game.override
      .battleStyle("single")
      .starterSpecies(Species.MEWTWO)
      .enemySpecies(Species.RATTATA)
      .enemyAbility(Abilities.HYDRATION)
      .ability(Abilities.ZEN_MODE)
      .startingLevel(2000)
      .startingWave(3)
      .moveset([moveToUse])
      .enemyMoveset(Moves.TACKLE);
    await game.classicMode.startBattle([Species.DARMANITAN, Species.CHARIZARD]);

    game.move.select(moveToUse);
    await game.phaseInterceptor.to(DamageAnimPhase, false);
    await game.killPokemon(game.scene.currentBattle.enemyParty[0]);
    expect(game.scene.currentBattle.enemyParty[0].isFainted()).toBe(true);
  });

  it("to next turn", async () => {
    const moveToUse = Moves.SPLASH;
    game.override
      .battleStyle("single")
      .enemySpecies(Species.RATTATA)
      .enemyAbility(Abilities.HYDRATION)
      .ability(Abilities.ZEN_MODE)
      .startingLevel(2000)
      .startingWave(3)
      .moveset([moveToUse])
      .enemyMoveset(Moves.TACKLE);
    await game.classicMode.startBattle([Species.MEWTWO]);
    const turn = game.scene.currentBattle.turn;
    game.move.select(moveToUse);
    await game.toNextTurn();
    expect(game.scene.currentBattle.turn).toBeGreaterThan(turn);
  });

  it("does not set new weather if staying in same biome", async () => {
    const moveToUse = Moves.SPLASH;
    game.override
      .battleStyle("single")
      .starterSpecies(Species.MEWTWO)
      .enemySpecies(Species.RATTATA)
      .enemyAbility(Abilities.HYDRATION)
      .ability(Abilities.ZEN_MODE)
      .startingLevel(2000)
      .startingWave(3)
      .startingBiome(Biome.LAKE)
      .moveset([moveToUse])
      .enemyMoveset(Moves.TACKLE);
    await game.classicMode.startBattle();
    const waveIndex = game.scene.currentBattle.waveIndex;
    game.move.select(moveToUse);

    vi.spyOn(game.scene.arena, "trySetWeather");
    await game.doKillOpponents();
    await game.toNextWave();
    expect(game.scene.arena.trySetWeather).not.toHaveBeenCalled();
    expect(game.scene.currentBattle.waveIndex).toBeGreaterThan(waveIndex);
  });

  it("does not force switch if active pokemon faints at same time as enemy mon and is revived in post-battle", async () => {
    game.override
      .battleStyle("single")
      .enemySpecies(Species.RATTATA)
      .startingWave(1)
      .startingLevel(100)
      .moveset([Moves.TAKE_DOWN])
      .enemyMoveset(Moves.SPLASH)
      .startingHeldItems([{ name: "TEMP_STAT_STAGE_BOOSTER", type: Stat.ACC }]);

    await game.classicMode.startBattle([Species.SAWK, Species.SAWK]);
    game.scene.getPlayerPokemon()!.hp = 1;
    game.move.select(Moves.TAKE_DOWN);

    await game.phaseInterceptor.to("BattleEndPhase");
    game.doRevivePokemon(0); // pretend max revive was picked
    game.doSelectModifier();

    game.onNextPrompt(
      "SwitchPhase",
      UiMode.PARTY,
      () => {
        expect.fail("Switch was forced");
      },
      () => game.isCurrentPhase(NextEncounterPhase),
    );
    await game.phaseInterceptor.to("SwitchPhase");
  });
});
