import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";
import Phaser from "phaser";
import GameManager from "#test/testUtils/gameManager";
import { UiMode } from "#enums/ui-mode";
import { Stat } from "#enums/stat";
import { getMovePosition } from "#test/testUtils/gameManagerUtils";
import { AbilityId } from "#enums/ability-id";
import { MoveId } from "#enums/move-id";
import { SpeciesId } from "#enums/species-id";

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
      .battleStyle("single")
      .enemySpecies(SpeciesId.RATTATA)
      .enemyAbility(AbilityId.INTIMIDATE)
      .enemyPassiveAbility(AbilityId.HYDRATION)
      .ability(AbilityId.INTIMIDATE)
      .startingWave(3)
      .enemyMoveset(MoveId.SPLASH);
  });

  it("should lower ATK stat stage by 1 of enemy Pokemon on entry and player switch", async () => {
    await game.classicMode.runToSummon([SpeciesId.MIGHTYENA, SpeciesId.POOCHYENA]);
    game.onNextPrompt(
      "CheckSwitchPhase",
      UiMode.CONFIRM,
      () => {
        game.setMode(UiMode.MESSAGE);
        game.endPhase();
      },
      () => game.isCurrentPhase("CommandPhase") || game.isCurrentPhase("TurnInitPhase"),
    );
    await game.phaseInterceptor.to("CommandPhase", false);

    let playerPokemon = game.scene.getPlayerPokemon()!;
    const enemyPokemon = game.scene.getEnemyPokemon()!;

    expect(playerPokemon.species.speciesId).toBe(SpeciesId.MIGHTYENA);
    expect(enemyPokemon.getStatStage(Stat.ATK)).toBe(-1);
    expect(playerPokemon.getStatStage(Stat.ATK)).toBe(-1);

    game.doSwitchPokemon(1);
    await game.phaseInterceptor.run("CommandPhase");
    await game.phaseInterceptor.to("CommandPhase");

    playerPokemon = game.scene.getPlayerPokemon()!;
    expect(playerPokemon.species.speciesId).toBe(SpeciesId.POOCHYENA);
    expect(playerPokemon.getStatStage(Stat.ATK)).toBe(0);
    expect(enemyPokemon.getStatStage(Stat.ATK)).toBe(-2);
  });

  it("should lower ATK stat stage by 1 for every enemy Pokemon in a double battle on entry", async () => {
    game.override.battleStyle("double").startingWave(3);
    await game.classicMode.runToSummon([SpeciesId.MIGHTYENA, SpeciesId.POOCHYENA]);
    game.onNextPrompt(
      "CheckSwitchPhase",
      UiMode.CONFIRM,
      () => {
        game.setMode(UiMode.MESSAGE);
        game.endPhase();
      },
      () => game.isCurrentPhase("CommandPhase") || game.isCurrentPhase("TurnInitPhase"),
    );
    await game.phaseInterceptor.to("CommandPhase", false);

    const playerField = game.scene.getPlayerField()!;
    const enemyField = game.scene.getEnemyField()!;

    expect(enemyField[0].getStatStage(Stat.ATK)).toBe(-2);
    expect(enemyField[1].getStatStage(Stat.ATK)).toBe(-2);
    expect(playerField[0].getStatStage(Stat.ATK)).toBe(-2);
    expect(playerField[1].getStatStage(Stat.ATK)).toBe(-2);
  });

  it("should not activate again if there is no switch or new entry", async () => {
    game.override.startingWave(2).moveset([MoveId.SPLASH]);
    await game.classicMode.startBattle([SpeciesId.MIGHTYENA, SpeciesId.POOCHYENA]);

    const playerPokemon = game.scene.getPlayerPokemon()!;
    const enemyPokemon = game.scene.getEnemyPokemon()!;

    expect(enemyPokemon.getStatStage(Stat.ATK)).toBe(-1);
    expect(playerPokemon.getStatStage(Stat.ATK)).toBe(-1);

    game.move.select(MoveId.SPLASH);
    await game.toNextTurn();

    expect(enemyPokemon.getStatStage(Stat.ATK)).toBe(-1);
    expect(playerPokemon.getStatStage(Stat.ATK)).toBe(-1);
  });

  it("should lower ATK stat stage by 1 for every switch", async () => {
    game.override.moveset([MoveId.SPLASH]).enemyMoveset([MoveId.VOLT_SWITCH]).startingWave(5);
    await game.classicMode.startBattle([SpeciesId.MIGHTYENA, SpeciesId.POOCHYENA]);

    const playerPokemon = game.scene.getPlayerPokemon()!;
    let enemyPokemon = game.scene.getEnemyPokemon()!;

    expect(enemyPokemon.getStatStage(Stat.ATK)).toBe(-1);
    expect(playerPokemon.getStatStage(Stat.ATK)).toBe(-1);

    game.move.select(getMovePosition(game.scene, 0, MoveId.SPLASH));
    await game.toNextTurn();

    enemyPokemon = game.scene.getEnemyPokemon()!;

    expect(playerPokemon.getStatStage(Stat.ATK)).toBe(-2);
    expect(enemyPokemon.getStatStage(Stat.ATK)).toBe(0);

    game.move.select(MoveId.SPLASH);
    await game.toNextTurn();

    enemyPokemon = game.scene.getEnemyPokemon()!;

    expect(playerPokemon.getStatStage(Stat.ATK)).toBe(-3);
    expect(enemyPokemon.getStatStage(Stat.ATK)).toBe(0);
  });
});
