import { allSpecies } from "#data/data-lists";
import { AbilityId } from "#enums/ability-id";
import { BiomeId } from "#enums/biome-id";
import { MoveId } from "#enums/move-id";
import { SpeciesId } from "#enums/species-id";
import { Stat } from "#enums/stat";
import { UiMode } from "#enums/ui-mode";
import { CommandPhase } from "#phases/command-phase";
import { NextEncounterPhase } from "#phases/next-encounter-phase";
import { GameManager } from "#test/test-utils/game-manager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

describe("Phase - Battle Phase", () => {
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

  it("do attack wave 3 - single battle - regular - OHKO", async () => {
    game.override.enemySpecies(SpeciesId.RATTATA).startingLevel(2000).battleStyle("single").startingWave(3);
    await game.classicMode.startBattle([SpeciesId.MEWTWO]);
    game.move.use(MoveId.TACKLE);
    await game.toNextWave();
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
    await game.phaseInterceptor.to("TurnInitPhase", false);
  });

  it("load 100% data file", async () => {
    await game.importData("./test/test-utils/saves/everything.prsv");
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

  it.each([
    { name: "1v1", double: false, qty: 1 },
    { name: "2v1", double: false, qty: 2 },
    { name: "2v2", double: true, qty: 2 },
    { name: "4v2", double: true, qty: 4 },
  ])("should not crash when starting $name battle", async ({ double, qty }) => {
    game.override
      .battleStyle(double ? "double" : "single")
      .enemySpecies(SpeciesId.MIGHTYENA)
      .enemyAbility(AbilityId.HYDRATION)
      .ability(AbilityId.HYDRATION);

    await game.classicMode.startBattle(
      [SpeciesId.BLASTOISE, SpeciesId.CHARIZARD, SpeciesId.DARKRAI, SpeciesId.GABITE].slice(0, qty),
    );

    expect(game.scene.ui?.getMode()).toBe(UiMode.COMMAND);
    expect(game.scene.phaseManager.getCurrentPhase()).toBeInstanceOf(CommandPhase);
  });

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
    await game.phaseInterceptor.to("DamageAnimPhase", false);
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
    game.field.getPlayerPokemon().hp = 1;
    game.move.select(moveToUse);

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
