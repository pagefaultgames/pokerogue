import { Abilities } from "#app/enums/abilities";
import { BerryType } from "#app/enums/berry-type";
import { WeatherType } from "#app/enums/weather-type";
import { Moves } from "#enums/moves";
import { Species } from "#enums/species";
import GameManager from "#test/utils/gameManager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";

describe("Moves - Corrosive Gas", () => {
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
      .moveset([ Moves.SPLASH, Moves.CORROSIVE_GAS ])
      .battleType("double")
      .enemySpecies(Species.MAGIKARP)
      .enemyMoveset(Moves.SPLASH);
  });

  it("Corrosive Gas should nullify enemy and ally items", async () => {
    game.override
      .enemyHeldItems([
        { name: "LEFTOVERS", count: 1 }
      ])
      .startingHeldItems(
        [
          { name: "LEFTOVERS", count: 1 }
        ]
      );
    await game.classicMode.startBattle([ Species.STAKATAKA, Species.SALAZZLE ]);
    const playerPokemon = game.scene.getPlayerField()!;
    const enemyPokemon = game.scene.getEnemyField()!;

    const staka = playerPokemon[0];
    const karp1 = enemyPokemon[0];
    const karp2 = enemyPokemon[1];

    staka.hp *= 0.5;
    karp1.hp *= 0.5;
    karp2.hp *= 0.5;

    const stakaHeldItems = staka.getHeldItems();
    const magikarpItems1 = karp1.getHeldItems();
    const magikarpItems2 = karp2.getHeldItems();

    game.move.select(Moves.SPLASH);
    game.move.select(Moves.CORROSIVE_GAS);
    await game.phaseInterceptor.to("TurnEndPhase");
    await game.toNextTurn();

    expect(stakaHeldItems[0].isNullified).toEqual(true);
    expect(magikarpItems1[0].isNullified).toEqual(true);
    expect(magikarpItems2[0].isNullified).toEqual(true);

    expect(staka.getHpRatio()).toBeCloseTo(0.5);
    expect(karp1.getHpRatio()).toBeCloseTo(0.5);
    expect(karp2.getHpRatio()).toBeCloseTo(0.5);
  });

  it("Items should not be nullified the following battle", async () => {
    game.override
      .enemyHeldItems([
        { name: "LEFTOVERS", count: 1 }
      ])
      .startingHeldItems(
        [
          { name: "LEFTOVERS", count: 1 }
        ]
      );
    await game.classicMode.startBattle([ Species.STAKATAKA, Species.SALAZZLE ]);
    const playerPokemon = game.scene.getPlayerField()!;
    const staka = playerPokemon[0];
    staka.hp *= 0.5;
    const stakaHeldItems = staka.getHeldItems();


    game.move.select(Moves.SPLASH);
    game.move.select(Moves.CORROSIVE_GAS);
    await game.phaseInterceptor.to("TurnEndPhase");
    await game.toNextTurn();

    expect(stakaHeldItems[0].isNullified).toEqual(true);
    expect(staka.getHpRatio()).toBeCloseTo(0.5);

    game.move.select(Moves.SPLASH);
    game.move.select(Moves.SPLASH);
    await game.doKillOpponents();
    game.doSelectModifier();
    await game.phaseInterceptor.to("TurnInitPhase");

    game.move.select(Moves.SPLASH);
    game.move.select(Moves.SPLASH);
    await game.phaseInterceptor.to("TurnEndPhase");

    expect(stakaHeldItems[0].isNullified).toEqual(false);
    expect(staka.getHpRatio()).toBeGreaterThan(0.5);
  });

  it("Corrosive Gas should not remove untransferrable items", async () => {
    game.override
      .enemyMoveset(Moves.CORROSIVE_GAS)
      .startingHeldItems(
        [
          { name: "MYSTERY_ENCOUNTER_MACHO_BRACE", count: 1 }
        ]
      );
    await game.classicMode.startBattle([ Species.GIRATINA, Species.AGGRON ]);
    const playerPokemon = game.scene.getPlayerField()!;
    const giratina = playerPokemon[0];
    const giratinaHeldItems = giratina.getHeldItems();

    game.move.select(Moves.SPLASH);
    game.move.select(Moves.SPLASH);
    await game.phaseInterceptor.to("TurnEndPhase");

    expect(giratinaHeldItems[0].isNullified).toEqual(false);
  });

  it("Corrosive Gas should not nullify items from sticky hold users", async () => {
    game.override
      .enemyAbility(Abilities.STICKY_HOLD)
      .enemyHeldItems([
        { name: "LEFTOVERS", count: 1 }
      ])
      .startingHeldItems(
        [
          { name: "LEFTOVERS", count: 1 }
        ]
      );
    await game.classicMode.startBattle([ Species.STAKATAKA, Species.SALAZZLE ]);
    const playerPokemon = game.scene.getPlayerField()!;
    const enemyPokemon = game.scene.getEnemyField()!;

    const staka = playerPokemon[0];
    const karp1 = enemyPokemon[0];
    const karp2 = enemyPokemon[1];

    staka.hp *= 0.5;
    karp1.hp *= 0.5;
    karp2.hp *= 0.5;

    const stakaHeldItems = staka.getHeldItems();
    const magikarpItems1 = karp1.getHeldItems();
    const magikarpItems2 = karp2.getHeldItems();

    game.move.select(Moves.SPLASH);
    game.move.select(Moves.CORROSIVE_GAS);
    await game.phaseInterceptor.to("TurnEndPhase");
    await game.toNextTurn();

    expect(stakaHeldItems[0].isNullified).toEqual(true);
    expect(magikarpItems1[0].isNullified).toEqual(false);
    expect(magikarpItems2[0].isNullified).toEqual(false);

    expect(staka.getHpRatio()).toBeCloseTo(0.5);
    expect(karp1.getHpRatio()).toBeGreaterThan(0.5);
    expect(karp2.getHpRatio()).toBeGreaterThan(0.5);
  });

  it("Corrosive Gas should not nullify items if it hits a substitute", async () => {
    game.override
      .moveset([ Moves.SPLASH, Moves.CORROSIVE_GAS, Moves.SUBSTITUTE ])
      .enemyHeldItems([
        { name: "LEFTOVERS", count: 1 }
      ])
      .startingHeldItems(
        [
          { name: "LEFTOVERS", count: 1 }
        ]
      );
    await game.classicMode.startBattle([ Species.STAKATAKA, Species.SALAZZLE ]);
    const playerPokemon = game.scene.getPlayerField()!;
    const staka = playerPokemon[0];
    staka.hp *= 0.5;

    const stakaHeldItems = staka.getHeldItems();

    game.move.select(Moves.SUBSTITUTE);
    game.move.select(Moves.SPLASH);
    await game.phaseInterceptor.to("TurnEndPhase");
    await game.toNextTurn();

    game.move.select(Moves.SPLASH);
    game.move.select(Moves.CORROSIVE_GAS);
    await game.phaseInterceptor.to("TurnEndPhase");
    await game.toNextTurn();

    expect(stakaHeldItems[0].isNullified).toEqual(false);

    expect(staka.getHpRatio()).toBeGreaterThan(0.25);
  });

  it("Items nullified cannot be reobtained with Harvest", async () => {
    game.override
      .weather(WeatherType.SUNNY)
      .ability(Abilities.HARVEST)
      .enemyAbility(Abilities.HARVEST)
      .enemyHeldItems([
        { name: "BERRY", type: BerryType.SITRUS, count: 1 },
      ])
      .startingHeldItems(
        [
          { name: "BERRY", type: BerryType.SITRUS, count: 1 },
        ]
      );
    await game.classicMode.startBattle([ Species.STAKATAKA, Species.SALAZZLE ]);
    const playerPokemon = game.scene.getPlayerField()!;
    const enemyPokemon = game.scene.getEnemyField()!;

    const staka = playerPokemon[0];
    const karp1 = enemyPokemon[0];
    const karp2 = enemyPokemon[1];

    staka.hp *= 0.1;
    karp1.hp *= 0.1;
    karp2.hp *= 0.1;

    const stakaHeldItems = staka.getHeldItems();
    const magikarpItems1 = karp1.getHeldItems();
    const magikarpItems2 = karp2.getHeldItems();

    game.move.select(Moves.SPLASH);
    game.move.select(Moves.CORROSIVE_GAS);
    await game.phaseInterceptor.to("TurnEndPhase");
    await game.toNextTurn();

    game.move.select(Moves.SPLASH);
    game.move.select(Moves.SPLASH);
    await game.phaseInterceptor.to("TurnEndPhase");
    await game.toNextTurn();


    expect(stakaHeldItems[0].isNullified).toEqual(true);
    expect(magikarpItems1[0].isNullified).toEqual(true);
    expect(magikarpItems2[0].isNullified).toEqual(true);

    expect(staka.getHpRatio()).toBeCloseTo(0.1);
    expect(karp1.getHpRatio()).toBeCloseTo(0.1);
    expect(karp2.getHpRatio()).toBeCloseTo(0.1);
  });

  it("Items stay nullified on switch out", async () => {
    game.override
      .enemyHeldItems([
        { name: "LEFTOVERS", count: 1 }
      ])
      .startingHeldItems(
        [
          { name: "LEFTOVERS", count: 1 }
        ]
      );
    await game.classicMode.startBattle([ Species.STAKATAKA, Species.SALAZZLE, Species.SALANDIT ]);
    const playerPokemon = game.scene.getPlayerField()!;

    const staka = playerPokemon[0];

    staka.hp *= 0.5;

    const stakaHeldItems = staka.getHeldItems();

    game.move.select(Moves.SPLASH);
    game.move.select(Moves.CORROSIVE_GAS);
    await game.phaseInterceptor.to("TurnEndPhase");
    await game.toNextTurn();

    game.doSwitchPokemon(2);
    game.move.select(Moves.SPLASH);
    await game.phaseInterceptor.to("TurnEndPhase");
    await game.toNextTurn();

    game.doSwitchPokemon(2);
    game.move.select(Moves.SPLASH);
    await game.phaseInterceptor.to("TurnEndPhase");
    await game.toNextTurn();

    expect(stakaHeldItems[0].isNullified).toEqual(true);
    expect(staka.getHpRatio()).toBeCloseTo(0.5);
  });
});
