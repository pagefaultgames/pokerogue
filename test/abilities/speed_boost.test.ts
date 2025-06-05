import { Stat } from "#enums/stat";
import { AbilityId } from "#enums/ability-id";
import { MoveId } from "#enums/move-id";
import { SpeciesId } from "#enums/species-id";
import GameManager from "#test/testUtils/gameManager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";
import type { CommandPhase } from "#app/phases/command-phase";
import { Command } from "#app/ui/command-ui-handler";
import { AttemptRunPhase } from "#app/phases/attempt-run-phase";

describe("Abilities - Speed Boost", () => {
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
      .enemySpecies(SpeciesId.SHUCKLE)
      .enemyAbility(AbilityId.BALL_FETCH)
      .enemyLevel(100)
      .ability(AbilityId.SPEED_BOOST)
      .enemyMoveset(MoveId.SPLASH)
      .moveset([MoveId.SPLASH, MoveId.U_TURN]);
  });

  it("should increase speed by 1 stage at end of turn", async () => {
    await game.classicMode.startBattle();

    const playerPokemon = game.scene.getPlayerPokemon()!;
    game.move.select(MoveId.SPLASH);
    await game.toNextTurn();

    expect(playerPokemon.getStatStage(Stat.SPD)).toBe(1);
  });

  it("should not trigger this turn if pokemon was switched into combat via attack, but the turn after", async () => {
    await game.classicMode.startBattle([SpeciesId.SHUCKLE, SpeciesId.NINJASK]);

    game.move.select(MoveId.U_TURN);
    game.doSelectPartyPokemon(1);
    await game.toNextTurn();
    const playerPokemon = game.scene.getPlayerPokemon()!;
    expect(playerPokemon.getStatStage(Stat.SPD)).toBe(0);

    game.move.select(MoveId.SPLASH);
    await game.toNextTurn();
    expect(playerPokemon.getStatStage(Stat.SPD)).toBe(1);
  });

  it("checking back to back swtiches", async () => {
    await game.classicMode.startBattle([SpeciesId.SHUCKLE, SpeciesId.NINJASK]);

    const [shuckle, ninjask] = game.scene.getPlayerParty();

    game.move.select(MoveId.U_TURN);
    game.doSelectPartyPokemon(1);
    await game.toNextTurn();
    expect(game.scene.getPlayerPokemon()!).toBe(ninjask);
    expect(ninjask.getStatStage(Stat.SPD)).toBe(0);

    game.move.select(MoveId.U_TURN);
    game.doSelectPartyPokemon(1);
    await game.toNextTurn();
    expect(game.scene.getPlayerPokemon()!).toBe(shuckle);
    expect(shuckle.getStatStage(Stat.SPD)).toBe(0);

    game.move.select(MoveId.SPLASH);
    await game.toNextTurn();
    expect(shuckle.getStatStage(Stat.SPD)).toBe(1);
  });

  it("should not trigger this turn if pokemon was switched into combat via normal switch, but the turn after", async () => {
    await game.classicMode.startBattle([SpeciesId.SHUCKLE, SpeciesId.NINJASK]);

    game.doSwitchPokemon(1);
    await game.toNextTurn();
    const playerPokemon = game.scene.getPlayerPokemon()!;
    expect(playerPokemon.getStatStage(Stat.SPD)).toBe(0);

    game.move.select(MoveId.SPLASH);
    await game.toNextTurn();
    expect(playerPokemon.getStatStage(Stat.SPD)).toBe(1);
  });

  it("should not trigger if pokemon fails to escape", async () => {
    await game.classicMode.startBattle([SpeciesId.SHUCKLE]);

    const commandPhase = game.scene.getCurrentPhase() as CommandPhase;
    commandPhase.handleCommand(Command.RUN, 0);
    const runPhase = game.scene.getCurrentPhase() as AttemptRunPhase;
    runPhase.forceFailEscape = true;
    await game.phaseInterceptor.to(AttemptRunPhase);
    await game.toNextTurn();

    const playerPokemon = game.scene.getPlayerPokemon()!;
    expect(playerPokemon.getStatStage(Stat.SPD)).toBe(0);

    game.move.select(MoveId.SPLASH);
    await game.toNextTurn();
    expect(playerPokemon.getStatStage(Stat.SPD)).toBe(1);
  });
});
