import { CommandPhase } from "#app/phases/command-phase";
import { Mode } from "#app/ui/ui";
import { Abilities } from "#enums/abilities";
import { Moves } from "#enums/moves";
import { Species } from "#enums/species";
import GameManager from "#test/utils/gameManager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";

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
    game.override.enemySpecies(Species.RATTATA);
    game.override.startingLevel(2000);
    game.override.moveset([Moves.TACKLE]);
    game.override.enemyAbility(Abilities.HYDRATION);
    game.override.ability(Abilities.HYDRATION);
    game.override.enemyMoveset([Moves.TACKLE, Moves.TACKLE, Moves.TACKLE, Moves.TACKLE]);
  });

  it("startBattle 2vs1 boss", async() => {
    game.override
      .battleType("single")
      .startingWave(10);
    await game.startBattle([
      Species.BLASTOISE,
      Species.CHARIZARD,
    ]);
    expect(game.scene.ui?.getMode()).toBe(Mode.COMMAND);
    expect(game.scene.getCurrentPhase()!.constructor.name).toBe(CommandPhase.name);
  }, 20000);

  it("startBattle 2vs2 boss", async() => {
    game.override
      .battleType("double")
      .startingWave(10);
    await game.startBattle([
      Species.BLASTOISE,
      Species.CHARIZARD,
    ]);
    expect(game.scene.ui?.getMode()).toBe(Mode.COMMAND);
    expect(game.scene.getCurrentPhase()!.constructor.name).toBe(CommandPhase.name);
  }, 20000);

  it("startBattle 2vs2 trainer", async() => {
    game.override
      .battleType("double")
      .startingWave(5);
    await game.startBattle([
      Species.BLASTOISE,
      Species.CHARIZARD,
    ]);
    expect(game.scene.ui?.getMode()).toBe(Mode.COMMAND);
    expect(game.scene.getCurrentPhase()!.constructor.name).toBe(CommandPhase.name);
  }, 20000);

  it("startBattle 2vs1 trainer", async() => {
    game.override
      .battleType("single")
      .startingWave(5);
    await game.startBattle([
      Species.BLASTOISE,
      Species.CHARIZARD,
    ]);
    expect(game.scene.ui?.getMode()).toBe(Mode.COMMAND);
    expect(game.scene.getCurrentPhase()!.constructor.name).toBe(CommandPhase.name);
  }, 20000);

  it("startBattle 2vs1 rival", async() => {
    game.override
      .battleType("single")
      .startingWave(8);
    await game.startBattle([
      Species.BLASTOISE,
      Species.CHARIZARD,
    ]);
    expect(game.scene.ui?.getMode()).toBe(Mode.COMMAND);
    expect(game.scene.getCurrentPhase()!.constructor.name).toBe(CommandPhase.name);
  }, 20000);

  it("startBattle 2vs2 rival", async() => {
    game.override
      .battleType("double")
      .startingWave(8);
    await game.startBattle([
      Species.BLASTOISE,
      Species.CHARIZARD,
    ]);
    expect(game.scene.ui?.getMode()).toBe(Mode.COMMAND);
    expect(game.scene.getCurrentPhase()!.constructor.name).toBe(CommandPhase.name);
  }, 20000);

  it("startBattle 1vs1 trainer", async() => {
    game.override
      .battleType("single")
      .startingWave(5);
    await game.startBattle([
      Species.BLASTOISE,
    ]);
    expect(game.scene.ui?.getMode()).toBe(Mode.COMMAND);
    expect(game.scene.getCurrentPhase()!.constructor.name).toBe(CommandPhase.name);
  }, 20000);

  it("startBattle 2vs2 trainer", async() => {
    game.override
      .battleType("double")
      .startingWave(5);
    await game.startBattle([
      Species.BLASTOISE,
      Species.CHARIZARD,
    ]);
    expect(game.scene.ui?.getMode()).toBe(Mode.COMMAND);
    expect(game.scene.getCurrentPhase()!.constructor.name).toBe(CommandPhase.name);
  }, 20000);

  it("startBattle 4vs2 trainer", async() => {
    game.override
      .battleType("double")
      .startingWave(5);
    await game.startBattle([
      Species.BLASTOISE,
      Species.CHARIZARD,
      Species.DARKRAI,
      Species.GABITE,
    ]);
    expect(game.scene.ui?.getMode()).toBe(Mode.COMMAND);
    expect(game.scene.getCurrentPhase()!.constructor.name).toBe(CommandPhase.name);
  }, 20000);
});

