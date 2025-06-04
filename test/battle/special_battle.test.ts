import { CommandPhase } from "#app/phases/command-phase";
import { UiMode } from "#enums/ui-mode";
import { AbilityId } from "#enums/ability-id";
import { MoveId } from "#enums/move-id";
import { SpeciesId } from "#enums/species-id";
import GameManager from "#test/testUtils/gameManager";
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
    game.override
      .enemySpecies(SpeciesId.RATTATA)
      .startingLevel(2000)
      .moveset([MoveId.TACKLE])
      .enemyAbility(AbilityId.HYDRATION)
      .ability(AbilityId.HYDRATION)
      .enemyMoveset(MoveId.TACKLE);
  });

  it("startBattle 2vs1 boss", async () => {
    game.override.battleStyle("single").startingWave(10);
    await game.classicMode.startBattle([SpeciesId.BLASTOISE, SpeciesId.CHARIZARD]);
    expect(game.scene.ui?.getMode()).toBe(UiMode.COMMAND);
    expect(game.scene.getCurrentPhase()!.constructor.name).toBe(CommandPhase.name);
  }, 20000);

  it("startBattle 2vs2 boss", async () => {
    game.override.battleStyle("double").startingWave(10);
    await game.classicMode.startBattle([SpeciesId.BLASTOISE, SpeciesId.CHARIZARD]);
    expect(game.scene.ui?.getMode()).toBe(UiMode.COMMAND);
    expect(game.scene.getCurrentPhase()!.constructor.name).toBe(CommandPhase.name);
  }, 20000);

  it("startBattle 2vs2 trainer", async () => {
    game.override.battleStyle("double").startingWave(5);
    await game.classicMode.startBattle([SpeciesId.BLASTOISE, SpeciesId.CHARIZARD]);
    expect(game.scene.ui?.getMode()).toBe(UiMode.COMMAND);
    expect(game.scene.getCurrentPhase()!.constructor.name).toBe(CommandPhase.name);
  }, 20000);

  it("startBattle 2vs1 trainer", async () => {
    game.override.battleStyle("single").startingWave(5);
    await game.classicMode.startBattle([SpeciesId.BLASTOISE, SpeciesId.CHARIZARD]);
    expect(game.scene.ui?.getMode()).toBe(UiMode.COMMAND);
    expect(game.scene.getCurrentPhase()!.constructor.name).toBe(CommandPhase.name);
  }, 20000);

  it("startBattle 2vs1 rival", async () => {
    game.override.battleStyle("single").startingWave(8);
    await game.classicMode.startBattle([SpeciesId.BLASTOISE, SpeciesId.CHARIZARD]);
    expect(game.scene.ui?.getMode()).toBe(UiMode.COMMAND);
    expect(game.scene.getCurrentPhase()!.constructor.name).toBe(CommandPhase.name);
  }, 20000);

  it("startBattle 2vs2 rival", async () => {
    game.override.battleStyle("double").startingWave(8);
    await game.classicMode.startBattle([SpeciesId.BLASTOISE, SpeciesId.CHARIZARD]);
    expect(game.scene.ui?.getMode()).toBe(UiMode.COMMAND);
    expect(game.scene.getCurrentPhase()!.constructor.name).toBe(CommandPhase.name);
  }, 20000);

  it("startBattle 1vs1 trainer", async () => {
    game.override.battleStyle("single").startingWave(5);
    await game.classicMode.startBattle([SpeciesId.BLASTOISE]);
    expect(game.scene.ui?.getMode()).toBe(UiMode.COMMAND);
    expect(game.scene.getCurrentPhase()!.constructor.name).toBe(CommandPhase.name);
  }, 20000);

  it("startBattle 2vs2 trainer", async () => {
    game.override.battleStyle("double").startingWave(5);
    await game.classicMode.startBattle([SpeciesId.BLASTOISE, SpeciesId.CHARIZARD]);
    expect(game.scene.ui?.getMode()).toBe(UiMode.COMMAND);
    expect(game.scene.getCurrentPhase()!.constructor.name).toBe(CommandPhase.name);
  }, 20000);

  it("startBattle 4vs2 trainer", async () => {
    game.override.battleStyle("double").startingWave(5);
    await game.classicMode.startBattle([SpeciesId.BLASTOISE, SpeciesId.CHARIZARD, SpeciesId.DARKRAI, SpeciesId.GABITE]);
    expect(game.scene.ui?.getMode()).toBe(UiMode.COMMAND);
    expect(game.scene.getCurrentPhase()!.constructor.name).toBe(CommandPhase.name);
  }, 20000);
});
