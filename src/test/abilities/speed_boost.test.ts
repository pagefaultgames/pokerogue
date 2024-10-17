import { Stat } from "#enums/stat";
import { Abilities } from "#enums/abilities";
import { Moves } from "#enums/moves";
import { Species } from "#enums/species";
import GameManager from "#test/utils/gameManager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { CommandPhase } from "#app/phases/command-phase";
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
      .battleType("single")
      .enemySpecies(Species.DRAGAPULT)
      .ability(Abilities.SPEED_BOOST)
      .enemyMoveset(Moves.SPLASH)
      .moveset([ Moves.SPLASH, Moves.U_TURN ]);
  });

  it("should increase speed by 1 stage at end of turn",
    async () => {
      await game.classicMode.startBattle();

      const playerPokemon = game.scene.getPlayerPokemon()!;
      game.move.select(Moves.SPLASH);
      await game.toNextTurn();

      expect(playerPokemon.getStatStage(Stat.SPD)).toBe(1);
    });

  it("should not trigger this turn if pokemon was switched into combat via attack, but the turn after",
    async () => {
      await game.classicMode.startBattle([
        Species.SHUCKLE,
        Species.NINJASK
      ]);

      game.move.select(Moves.U_TURN);
      game.doSelectPartyPokemon(1);
      await game.toNextTurn();
      const playerPokemon = game.scene.getPlayerPokemon()!;
      expect(playerPokemon.getStatStage(Stat.SPD)).toBe(0);

      game.move.select(Moves.SPLASH);
      await game.toNextTurn();
      expect(playerPokemon.getStatStage(Stat.SPD)).toBe(1);
    });

  it("checking back to back swtiches",
    async () => {
      await game.classicMode.startBattle([
        Species.SHUCKLE,
        Species.NINJASK
      ]);

      game.move.select(Moves.U_TURN);
      game.doSelectPartyPokemon(1);
      await game.toNextTurn();
      let playerPokemon = game.scene.getPlayerPokemon()!;
      expect(playerPokemon.getStatStage(Stat.SPD)).toBe(0);

      game.move.select(Moves.U_TURN);
      game.doSelectPartyPokemon(1);
      await game.toNextTurn();
      playerPokemon = game.scene.getPlayerPokemon()!;
      expect(playerPokemon.getStatStage(Stat.SPD)).toBe(0);

      game.move.select(Moves.SPLASH);
      await game.toNextTurn();
      expect(playerPokemon.getStatStage(Stat.SPD)).toBe(1);
    });

  it("should not trigger this turn if pokemon was switched into combat via normal switch, but the turn after",
    async () => {
      await game.classicMode.startBattle([
        Species.SHUCKLE,
        Species.NINJASK
      ]);

      game.doSwitchPokemon(1);
      await game.toNextTurn();
      const playerPokemon = game.scene.getPlayerPokemon()!;
      expect(playerPokemon.getStatStage(Stat.SPD)).toBe(0);

      game.move.select(Moves.SPLASH);
      await game.toNextTurn();
      expect(playerPokemon.getStatStage(Stat.SPD)).toBe(1);
    });

  it("should not trigger if pokemon fails to escape",
    async () => {
      await game.classicMode.startBattle([ Species.SHUCKLE ]);

      const commandPhase = game.scene.getCurrentPhase() as CommandPhase;
      commandPhase.handleCommand(Command.RUN, 0);
      const runPhase = game.scene.getCurrentPhase() as AttemptRunPhase;
      runPhase.forceFailEscape = true;
      await game.phaseInterceptor.to(AttemptRunPhase);
      await game.toNextTurn();

      const playerPokemon = game.scene.getPlayerPokemon()!;
      expect(playerPokemon.getStatStage(Stat.SPD)).toBe(0);

      game.move.select(Moves.SPLASH);
      await game.toNextTurn();
      expect(playerPokemon.getStatStage(Stat.SPD)).toBe(1);
    });
});
