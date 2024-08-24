import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";
import Phaser from "phaser";
import GameManager from "#test/utils/gameManager";
import { Mode } from "#app/ui/ui";
import { Stat } from "#enums/stat";
import { getMovePosition } from "#test/utils/gameManagerUtils";
import { Abilities } from "#enums/abilities";
import { Moves } from "#enums/moves";
import { Species } from "#enums/species";
import { SPLASH_ONLY } from "#test/utils/testUtils";
import { CommandPhase } from "#app/phases/command-phase";
import { TurnInitPhase } from "#app/phases/turn-init-phase";

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

  it("should lower ATK stat stage by 1 of enemy Pokemon on entry and player switch", async () => {
    await game.classicMode.runToSummon([Species.MIGHTYENA, Species.POOCHYENA]);
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

    let playerPokemon = game.scene.getPlayerPokemon();
    const enemyPokemon = game.scene.getEnemyPokemon();

    expect(playerPokemon!.species.speciesId).toBe(Species.MIGHTYENA);
    expect(enemyPokemon!.getStatStage(Stat.ATK)).toBe(-1);
    expect(playerPokemon!.getStatStage(Stat.ATK)).toBe(-1);

    game.doSwitchPokemon(1);
    await game.phaseInterceptor.run(CommandPhase);
    await game.phaseInterceptor.to(CommandPhase);

    playerPokemon = game.scene.getPlayerPokemon();
    expect(playerPokemon!.species.speciesId).toBe(Species.POOCHYENA);
    expect(playerPokemon!.getStatStage(Stat.ATK)).toBe(0);
    expect(enemyPokemon!.getStatStage(Stat.ATK)).toBe(-2);
  }, 20000);

  it("should lower ATK stat stage by 1 for every enemy Pokemon in a double battle on entry", async () => {
    game.override.battleType("double");
    game.override.startingWave(3);
    await game.classicMode.runToSummon([Species.MIGHTYENA, Species.POOCHYENA]);
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

    const playerField = game.scene.getPlayerField()!;
    const enemyField = game.scene.getEnemyField()!;

    expect(enemyField[0].getStatStage(Stat.ATK)).toBe(-2);
    expect(enemyField[1].getStatStage(Stat.ATK)).toBe(-2);
    expect(playerField[0].getStatStage(Stat.ATK)).toBe(-2);
    expect(playerField[1].getStatStage(Stat.ATK)).toBe(-2);
  }, 20000);

  it("should not activate again if there is no switch or new entry", async () => {
    game.override.startingWave(2);
    game.override.moveset([Moves.SPLASH]);
    await game.startBattle([Species.MIGHTYENA, Species.POOCHYENA]);

    const playerPokemon = game.scene.getPlayerPokemon()!;
    const enemyPokemon = game.scene.getEnemyPokemon()!;

    expect(enemyPokemon.getStatStage(Stat.ATK)).toBe(-1);
    expect(playerPokemon.getStatStage(Stat.ATK)).toBe(-1);

    game.move.select(Moves.SPLASH);
    await game.toNextTurn();

    expect(enemyPokemon.getStatStage(Stat.ATK)).toBe(-1);
    expect(playerPokemon.getStatStage(Stat.ATK)).toBe(-1);
  }, 20000);

  it("should lower ATK stat stage by 1 for every switch", async () => {
    game.override.moveset([Moves.SPLASH]);
    game.override.enemyMoveset([Moves.VOLT_SWITCH, Moves.VOLT_SWITCH, Moves.VOLT_SWITCH, Moves.VOLT_SWITCH]);
    game.override.startingWave(5);
    await game.startBattle([Species.MIGHTYENA, Species.POOCHYENA]);

    const playerPokemon = game.scene.getPlayerPokemon()!;
    let enemyPokemon = game.scene.getEnemyPokemon()!;

    expect(enemyPokemon.getStatStage(Stat.ATK)).toBe(-1);
    expect(playerPokemon.getStatStage(Stat.ATK)).toBe(-1);

    game.move.select(getMovePosition(game.scene, 0, Moves.SPLASH));
    await game.toNextTurn();

    enemyPokemon = game.scene.getEnemyPokemon()!;

    expect(playerPokemon.getStatStage(Stat.ATK)).toBe(-2);
    expect(enemyPokemon.getStatStage(Stat.ATK)).toBe(0);

    game.move.select(Moves.SPLASH);
    await game.toNextTurn();

    enemyPokemon = game.scene.getEnemyPokemon()!;

    expect(playerPokemon.getStatStage(Stat.ATK)).toBe(-3);
    expect(enemyPokemon.getStatStage(Stat.ATK)).toBe(0);
  }, 200000);
});
