import Overrides from "#app/overrides";
import { AbilityId } from "#enums/ability-id";
import { Command } from "#enums/command";
import { MoveId } from "#enums/move-id";
import { SpeciesId } from "#enums/species-id";
import { Stat } from "#enums/stat";
import { AttemptRunPhase } from "#phases/attempt-run-phase";
import type { CommandPhase } from "#phases/command-phase";
import { GameManager } from "#test/test-utils/game-manager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

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

    const playerPokemon = game.field.getPlayerPokemon();
    game.move.select(MoveId.SPLASH);
    await game.toNextTurn();

    expect(playerPokemon.getStatStage(Stat.SPD)).toBe(1);
  });

  it("should not trigger this turn if pokemon was switched into combat via attack, but the turn after", async () => {
    await game.classicMode.startBattle([SpeciesId.SHUCKLE, SpeciesId.NINJASK]);

    game.move.select(MoveId.U_TURN);
    game.doSelectPartyPokemon(1);
    await game.toNextTurn();
    const playerPokemon = game.field.getPlayerPokemon();
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
    expect(game.field.getPlayerPokemon()).toBe(ninjask);
    expect(ninjask.getStatStage(Stat.SPD)).toBe(0);

    game.move.select(MoveId.U_TURN);
    game.doSelectPartyPokemon(1);
    await game.toNextTurn();
    expect(game.field.getPlayerPokemon()).toBe(shuckle);
    expect(shuckle.getStatStage(Stat.SPD)).toBe(0);

    game.move.select(MoveId.SPLASH);
    await game.toNextTurn();
    expect(shuckle.getStatStage(Stat.SPD)).toBe(1);
  });

  it("should not trigger this turn if pokemon was switched into combat via normal switch, but the turn after", async () => {
    await game.classicMode.startBattle([SpeciesId.SHUCKLE, SpeciesId.NINJASK]);

    game.doSwitchPokemon(1);
    await game.toNextTurn();
    const playerPokemon = game.field.getPlayerPokemon();
    expect(playerPokemon.getStatStage(Stat.SPD)).toBe(0);

    game.move.select(MoveId.SPLASH);
    await game.toNextTurn();
    expect(playerPokemon.getStatStage(Stat.SPD)).toBe(1);
  });

  it("should not trigger if pokemon fails to escape", async () => {
    //Account for doubles, should not trigger on either pokemon
    game.override.battleStyle("double");
    await game.classicMode.startBattle([SpeciesId.SHUCKLE]);

    vi.spyOn(Overrides, "RUN_SUCCESS_OVERRIDE", "get").mockReturnValue(false);

    const commandPhase = game.scene.phaseManager.getCurrentPhase() as CommandPhase;
    commandPhase.handleCommand(Command.RUN, 0);

    await game.phaseInterceptor.to(AttemptRunPhase);
    await game.toNextTurn();

    const playerPokemon = game.field.getPlayerPokemon();
    expect(playerPokemon.getStatStage(Stat.SPD)).toBe(0);

    game.move.select(MoveId.SPLASH);
    await game.toNextTurn();
    expect(playerPokemon.getStatStage(Stat.SPD)).toBe(1);
  });
});
