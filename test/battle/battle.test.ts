import { allSpecies } from "#app/data/data-lists";
import { Stat } from "#enums/stat";
import { getGameMode } from "#app/game-mode";
import { GameModes } from "#enums/game-modes";
import { BattleEndPhase } from "#app/phases/battle-end-phase";
import { CommandPhase } from "#app/phases/command-phase";
import { DamageAnimPhase } from "#app/phases/damage-anim-phase";
import { EncounterPhase } from "#app/phases/encounter-phase";
import { EnemyCommandPhase } from "#app/phases/enemy-command-phase";
import { LoginPhase } from "#app/phases/login-phase";
import { NextEncounterPhase } from "#app/phases/next-encounter-phase";
import { SelectGenderPhase } from "#app/phases/select-gender-phase";
import { SelectStarterPhase } from "#app/phases/select-starter-phase";
import { SummonPhase } from "#app/phases/summon-phase";
import { SwitchPhase } from "#app/phases/switch-phase";
import { TitlePhase } from "#app/phases/title-phase";
import { TurnInitPhase } from "#app/phases/turn-init-phase";
import GameManager from "#test/testUtils/gameManager";
import { generateStarter } from "#test/testUtils/gameManagerUtils";
import { UiMode } from "#enums/ui-mode";
import { AbilityId } from "#enums/ability-id";
import { MoveId } from "#enums/move-id";
import { PlayerGender } from "#enums/player-gender";
import { SpeciesId } from "#enums/species-id";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { BiomeId } from "#enums/biome-id";

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
    expect(game.scene.phaseManager.getCurrentPhase()?.phaseName).toBe("CommandPhase");
  });

  it("do attack wave 3 - single battle - regular - OHKO", async () => {
    game.override.enemySpecies(SpeciesId.RATTATA).startingLevel(2000).battleStyle("single").startingWave(3);
    await game.classicMode.startBattle([SpeciesId.MEWTWO]);
    game.move.use(MoveId.TACKLE);
    await game.phaseInterceptor.to("SelectModifierPhase");
  });

  it("do attack wave 3 - single battle - regular - NO OHKO with opponent using non damage attack", async () => {
    game.override
      .enemySpecies(SpeciesId.RATTATA)
      .startingLevel(5)
      .startingWave(3)
      .moveset([MoveId.TACKLE])
      .enemyAbility(AbilityId.HYDRATION)
      .enemyMoveset([MoveId.TAIL_WHIP, MoveId.TAIL_WHIP, MoveId.TAIL_WHIP, MoveId.TAIL_WHIP])
      .battleStyle("single");
    await game.classicMode.startBattle([SpeciesId.MEWTWO]);
    game.move.select(MoveId.TACKLE);
    await game.phaseInterceptor.runFrom(EnemyCommandPhase).to(TurnInitPhase, false);
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
    await game.classicMode.startBattle([SpeciesId.CHARIZARD, SpeciesId.CHANSEY, SpeciesId.MEW]);
    expect(game.scene.getPlayerParty().map(p => p.species.speciesId)).toEqual([
      SpeciesId.CHARIZARD,
      SpeciesId.CHANSEY,
      SpeciesId.MEW,
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
      game.scene.phaseManager.pushPhase(new EncounterPhase(false));
      selectStarterPhase.initBattle(starters);
    });
    await game.phaseInterceptor.runFrom(SelectGenderPhase).to(SummonPhase);
  });

  it("2vs1", async () => {
    game.override.battleStyle("single");
    game.override.enemySpecies(SpeciesId.MIGHTYENA);
    game.override.enemyAbility(AbilityId.HYDRATION);
    game.override.ability(AbilityId.HYDRATION);
    await game.classicMode.startBattle([SpeciesId.BLASTOISE, SpeciesId.CHARIZARD]);
    expect(game.scene.ui?.getMode()).toBe(UiMode.COMMAND);
    expect(game.scene.phaseManager.getCurrentPhase()!.constructor.name).toBe(CommandPhase.name);
  }, 20000);

  it("1vs1", async () => {
    game.override.battleStyle("single");
    game.override.enemySpecies(SpeciesId.MIGHTYENA);
    game.override.enemyAbility(AbilityId.HYDRATION);
    game.override.ability(AbilityId.HYDRATION);
    await game.classicMode.startBattle([SpeciesId.BLASTOISE]);
    expect(game.scene.ui?.getMode()).toBe(UiMode.COMMAND);
    expect(game.scene.phaseManager.getCurrentPhase()!.constructor.name).toBe(CommandPhase.name);
  }, 20000);

  it("2vs2", async () => {
    game.override.battleStyle("double");
    game.override.enemySpecies(SpeciesId.MIGHTYENA);
    game.override.enemyAbility(AbilityId.HYDRATION);
    game.override.ability(AbilityId.HYDRATION);
    game.override.startingWave(3);
    await game.classicMode.startBattle([SpeciesId.BLASTOISE, SpeciesId.CHARIZARD]);
    expect(game.scene.ui?.getMode()).toBe(UiMode.COMMAND);
    expect(game.scene.phaseManager.getCurrentPhase()!.constructor.name).toBe(CommandPhase.name);
  }, 20000);

  it("4vs2", async () => {
    game.override.battleStyle("double");
    game.override.enemySpecies(SpeciesId.MIGHTYENA);
    game.override.enemyAbility(AbilityId.HYDRATION);
    game.override.ability(AbilityId.HYDRATION);
    game.override.startingWave(3);
    await game.classicMode.startBattle([SpeciesId.BLASTOISE, SpeciesId.CHARIZARD, SpeciesId.DARKRAI, SpeciesId.GABITE]);
    expect(game.scene.ui?.getMode()).toBe(UiMode.COMMAND);
    expect(game.scene.phaseManager.getCurrentPhase()!.constructor.name).toBe(CommandPhase.name);
  }, 20000);

  it("kill opponent pokemon", async () => {
    const moveToUse = MoveId.SPLASH;
    game.override
      .battleStyle("single")
      .starterSpecies(SpeciesId.MEWTWO)
      .enemySpecies(SpeciesId.RATTATA)
      .enemyAbility(AbilityId.HYDRATION)
      .ability(AbilityId.ZEN_MODE)
      .startingLevel(2000)
      .startingWave(3)
      .moveset([moveToUse])
      .enemyMoveset([MoveId.TACKLE, MoveId.TACKLE, MoveId.TACKLE, MoveId.TACKLE]);
    await game.classicMode.startBattle([SpeciesId.DARMANITAN, SpeciesId.CHARIZARD]);

    game.move.select(moveToUse);
    await game.phaseInterceptor.to(DamageAnimPhase, false);
    await game.killPokemon(game.scene.currentBattle.enemyParty[0]);
    expect(game.scene.currentBattle.enemyParty[0].isFainted()).toBe(true);
    await game.phaseInterceptor.to("VictoryPhase");
  });

  it("to next turn", async () => {
    const moveToUse = MoveId.SPLASH;
    game.override
      .battleStyle("single")
      .enemySpecies(SpeciesId.RATTATA)
      .enemyAbility(AbilityId.HYDRATION)
      .ability(AbilityId.ZEN_MODE)
      .startingLevel(2000)
      .startingWave(3)
      .moveset([moveToUse])
      .enemyMoveset([MoveId.TACKLE, MoveId.TACKLE, MoveId.TACKLE, MoveId.TACKLE]);
    await game.classicMode.startBattle([SpeciesId.MEWTWO]);
    const turn = game.scene.currentBattle.turn;
    game.move.select(moveToUse);
    await game.toNextTurn();
    expect(game.scene.currentBattle.turn).toBeGreaterThan(turn);
  });

  it("does not set new weather if staying in same biome", async () => {
    const moveToUse = MoveId.SPLASH;
    game.override
      .battleStyle("single")
      .starterSpecies(SpeciesId.MEWTWO)
      .enemySpecies(SpeciesId.RATTATA)
      .enemyAbility(AbilityId.HYDRATION)
      .ability(AbilityId.ZEN_MODE)
      .startingLevel(2000)
      .startingWave(3)
      .startingBiome(BiomeId.LAKE)
      .moveset([moveToUse])
      .enemyMoveset([MoveId.TACKLE, MoveId.TACKLE, MoveId.TACKLE, MoveId.TACKLE]);
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
    const moveToUse = MoveId.TAKE_DOWN;
    game.override
      .battleStyle("single")
      .starterSpecies(SpeciesId.SAWK)
      .enemySpecies(SpeciesId.RATTATA)
      .startingWave(1)
      .startingLevel(100)
      .moveset([moveToUse])
      .enemyMoveset(MoveId.SPLASH)
      .startingHeldItems([{ name: "TEMP_STAT_STAGE_BOOSTER", type: Stat.ACC }]);

    await game.classicMode.startBattle();
    game.scene.getPlayerPokemon()!.hp = 1;
    game.move.select(moveToUse);

    await game.phaseInterceptor.to(BattleEndPhase);
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
    await game.phaseInterceptor.to(SwitchPhase);
  });
});
