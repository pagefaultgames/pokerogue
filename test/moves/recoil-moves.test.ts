import { Moves } from "#enums/moves";
import { Species } from "#enums/species";
import GameManager from "#test/testUtils/gameManager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { Abilities } from "#enums/abilities";

describe("Moves - Recoil Moves", () => {
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
    game.override.battleStyle("single");
    game.override.enemySpecies(Species.PIDOVE);
    game.override.startingLevel(1);
    game.override.enemyLevel(100);
    game.override.enemyMoveset([Moves.SUBSTITUTE, Moves.SUBSTITUTE, Moves.SUBSTITUTE, Moves.SUBSTITUTE]);
    game.override.disableCrits();
  });

  describe.each([
    { moveName: "Double Edge", moveId: Moves.DOUBLE_EDGE },
    { moveName: "Brave Bird", moveId: Moves.BRAVE_BIRD },
    { moveName: "Flare Blitz", moveId: Moves.FLARE_BLITZ },
    { moveName: "Head Charge", moveId: Moves.HEAD_CHARGE },
    { moveName: "Head Smash", moveId: Moves.HEAD_SMASH },
    { moveName: "Light of Ruin", moveId: Moves.LIGHT_OF_RUIN },
    { moveName: "Struggle", moveId: Moves.STRUGGLE },
    { moveName: "Submission", moveId: Moves.SUBMISSION },
    { moveName: "Take Down", moveId: Moves.TAKE_DOWN },
    { moveName: "Volt Tackle", moveId: Moves.VOLT_TACKLE },
    { moveName: "Wave Crash", moveId: Moves.WAVE_CRASH },
    { moveName: "Wild Charge", moveId: Moves.WILD_CHARGE },
    { moveName: "Wood Hammer", moveId: Moves.WOOD_HAMMER },
  ])("Moves - $moveName", ({ moveId }) => {
    it("against SUBSTITUTE does recoil", async () => {
      game.override.ability(Abilities.NO_GUARD);
      await game.classicMode.startBattle([Species.TOGEPI]);

      game.override.moveset([moveId]);
      game.move.select(moveId);
      await game.toNextTurn();

      const playerPokemon = game.scene.getPlayerPokemon()!;
      expect(playerPokemon.hp).toBeLessThan(playerPokemon.getMaxHp());
    });
  });

  it("against SUBSTITUTE recoils properly in double battles", async () => {
    game.override.battleStyle("double");
    game.override.enemySpecies(Species.PIDOVE);
    game.override.startingLevel(1);
    game.override.enemyLevel(100);
    game.override.enemyMoveset([Moves.SUBSTITUTE]);
    game.override.disableCrits();
    game.override.ability(Abilities.NO_GUARD);
    await game.classicMode.startBattle([Species.TOGEPI, Species.TOGEPI]);
    game.override.moveset([Moves.DOUBLE_EDGE]);
    game.move.select(Moves.DOUBLE_EDGE, 0);
    game.move.select(Moves.DOUBLE_EDGE, 1);
    await game.forceEnemyMove(Moves.SUBSTITUTE, 0);
    await game.forceEnemyMove(Moves.SUBSTITUTE, 1);
    await game.phaseInterceptor.to("TurnEndPhase", false);
    await await game.toNextTurn();

    console.log(game.scene.getPlayerParty()[0].hp);
    console.log(game.scene.getPlayerParty()[1].hp);

    const playerPokemon = game.scene.getPlayerPokemon()!;
    expect(playerPokemon.hp).toBeLessThan(playerPokemon.getMaxHp());
  });
});
